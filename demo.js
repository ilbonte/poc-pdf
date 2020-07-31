const axios = require('axios');
const LAMBDA_URL = '<lambda_url_here>'
const data = {"html": "", "displayHeaderFooter": false, "format": "A4", "emulateMedia": "print"}

run();

async function run() {
    let html = await htmlFromUrl("https://github.com/axios/axios");
    data.html = base64FromHtm(html)

    console.log("Sending request")
    console.log(JSON.stringify(data));

    axios.post(LAMBDA_URL, data)
        .then(function (response) {
            console.log("Response: \n")
            console.log(response.data.message);
        })
        .catch(function (error) {
            console.log(error);
        });
}

function base64FromHtm(promise) {
    return Buffer.from(promise).toString('base64');
}

function simpleHtml() {
    return `<html><body><h1>ciao mondo</h1></body></html>`
}

async function htmlFromUrl(url) {
    let response = await axios.get(url);
    return response.data
}
