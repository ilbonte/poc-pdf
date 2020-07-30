const chromium = require('chrome-aws-lambda');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event, context) => {
    const fileName = 'file-name-' + unique() + '.pdf';
    let result = null;
    let browser = null;
    const url = JSON.parse(event.body).url

    console.log("starting!");
    let response = {};

    try {
        browser = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        let page = await browser.newPage();


        console.log("going to page!");

        await page.goto(url || 'https://example.com');

        console.log("pringing!");

        await page.emulateMedia('print');
        const pdf = await page.pdf({
            fullPage: true,
            format: 'A4',
            printBackground: true
        })


        console.log("saving!");

        const params = {
            Bucket: process.env.BUCKET,
            Key: fileName,
            Body: pdf,
            ContentType : 'application/pdf'
        };

        await s3.putObject(params).promise();

        // response = {
        //     headers: {
        //         'Content-type': 'application/pdf',
        //         'content-disposition': 'attachment; filename=test.pdf'
        //     },
        //     statusCode: 200,
        //     body: pdf.toString('base64'),
        //     isBase64Encoded: true
        // }

        response = {
            statusCode: 200,
            body: JSON.stringify(
                {
                    message: fileName,
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
