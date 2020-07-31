const chromium = require('chrome-aws-lambda');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();


exports.handler = async (event, context) => {
    console.log(event)
    const payload = JSON.parse(event.body)

    console.log("starting!");
    let response = {};

    try {

        const html = Buffer.from(payload.html, 'base64').toString()
        if (!html) return {
            statusCode: 400,
            body: JSON.stringify({message: 'HTML Page not defined'})
        }
        const pdf = await generatePdf(html, payload);


        console.log("saving!");

        const fileName = 'file-name-' + unique() + '.pdf';
        await savePdfToS3(fileName, pdf);


        const url = await getSignedUrl({
            Bucket: process.env.BUCKET,
            Key: fileName,
            Expires: 60 * 5
        })

        response = {
            statusCode: 200,
            body: JSON.stringify(
                {
                    message: url,
                    input: event,
                },
                null,
                2
            )
        }

    } catch (error) {
        console.log(error);
        return {
            statusCode: 500,
            body: JSON.stringify(
                {
                    message: error,
                    input: event,
                },
                null,
                2
            ),
        };
    }

    console.log("returning");

    return response;
};

function unique() {
    return 'xxxxxxxxxxxx'.replace(/[x]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


async function getSignedUrl(params) {
    return new Promise((resolve, reject) => {
        s3.getSignedUrl('getObject', params, (err, url) => {
            if (err) reject(err)
            resolve(url);
        })
    });
}

async function generatePdf(html, payload) {
    const {
        emulateMedia,
        landscape,
        scale,
        format,
        displayHeaderFooter,
        margin,
        printBackground,
        width,
        heigth,
    } = payload;
    let pdf = null;
    let browser = null;
    try {
        browser = await chromium.puppeteer.launch({
            args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],  //what are these parameters?
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
        });
        const page = await browser.newPage();
        await page.emulateMedia(emulateMedia);
        await page.setContent(html);

        pdf = await page.pdf({
            printBackground,
            landscape,
            scale,
            format,
            displayHeaderFooter,
            margin,
            width,
            heigth
        });
    } catch (e) {
        console.log("Error generating pdf")
        throw(e)
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
    return pdf;

}

async function savePdfToS3(fileName, pdf) {
    const params = {
        Bucket: process.env.BUCKET,
        Key: fileName,
        Body: pdf,
        ContentType: 'application/pdf',
        ACL: 'public-read'  //check this policy!
    };

    await s3.putObject(params).promise();
}
