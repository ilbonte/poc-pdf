const chromium = require('chrome-aws-lambda');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event, context) => {
    const fileName = 'file-name-' + unique() + '.pdf';
    let result = null;
    let browser = null;
    const payload = JSON.parse(event.body)

    console.log("starting!");
    let response = {};

    try {
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
        const html = Buffer.from(payload.html, 'base64').toString()
        if (!html) return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Page HTML not defined' })
        }
        const browser = await chromium.puppeteer.launch({
            args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
        });
        const page = await browser.newPage();
        await page.emulateMedia(emulateMedia);
        await page.setContent(html);
        // await page.goto(pageToScreenshot, { waitUntil: 'networkidle2' });
        // const screenshot = await page.screenshot({ encoding: 'binary' });
        const pdf = await page.pdf({
            printBackground,
            landscape,
            scale,
            format,
            displayHeaderFooter,
            margin,
            width,
            heigth
        });


        console.log("saving!");

        const params = {
            Bucket: process.env.BUCKET,
            Key: fileName,
            Body: pdf,
            ContentType: 'application/pdf',
            ACL:'public-read'
        };

        await s3.putObject(params).promise();


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


        result = await page.title();
        console.log(result);
    } catch (error) {
        console.log("exceptoin!");
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
    } finally {
        if (browser !== null) {
            console.log("closing!");

            await browser.close();
        }
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
