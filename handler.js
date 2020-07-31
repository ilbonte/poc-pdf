const chromium = require('chrome-aws-lambda');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();


exports.handler = async (event, context) => {
    console.log(event)
    const payload = JSON.parse(event.body)

    console.log("starting!");
    let response = {};

    try {
        const html = getHtmlFromBase64(payload.html)
        if (!html) return Responses.HTTP_BAD_REQUEST({message: 'HTML Page not defined', input: event})

        const pdf = await generatePdf(html, payload);

        const fileName = 'file-name-' + unique() + '.pdf';
        await savePdfToS3(fileName, pdf);

        const url = await getSignedUrl(fileName)

        response = Responses.HTTP_OK({
            message: url
        })

    } catch (error) {
        console.log(error);
        response = Responses.INTERNAL_SERVER_ERROR({message: error, input: event})
    }

    console.log("done");

    return response;
};

function getHtmlFromBase64(html) {
    return Buffer.from(html, 'base64').toString();
}


async function getSignedUrl(fileName) {
    return new Promise((resolve, reject) => {
        s3.getSignedUrl('getObject', {
            Bucket: process.env.BUCKET,
            Key: fileName,
            Expires: 60 * 5
        }, (err, url) => {
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
        height,
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
            height
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
    console.log("saving!");
    const params = {
        Bucket: process.env.BUCKET,
        Key: fileName,
        Body: pdf,
        ContentType: 'application/pdf',
        ACL: 'public-read'  //check this policy!
    };

    await s3.putObject(params).promise();
}

function unique() {
    return 'xxxxxxxxxxxx'.replace(/[x]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


const Responses = {
    HTTP_OK(data = {}) {
        return {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Methods': '*',
                'Access-Control-Allow-Origin': '*',
            },
            statusCode: 200,
            body: JSON.stringify(data, null, 2),
        };
    },

    HTTP_BAD_REQUEST(data = {}) {
        return {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Methods': '*',
                'Access-Control-Allow-Origin': '*',
            },
            statusCode: 400,
            body: JSON.stringify(data),
        };
    },

    INTERNAL_SERVER_ERROR(data = {}) {
        return {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Methods': '*',
                'Access-Control-Allow-Origin': '*',
            },
            statusCode: 500,
            body: JSON.stringify(data),
        };
    }
};
