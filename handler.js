const chromium = require('chrome-aws-lambda');

exports.handler = async (event, context) => {
    let result = null;
    let browser = null;
    const url = JSON.parse(event.body).url

    console.log("starting!");

    try {
        browser = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        let page = await browser.newPage();

        console.log("page readt!");


        await page.goto(url || 'https://example.com');

        console.log("whent to page, returning!");


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

    return {
        statusCode: 200,
        body: JSON.stringify(
            {
                message: result,
                input: event,
            },
            null,
            2
        ),
    };
};
