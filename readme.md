Generate a PDF from HTML using pupeteer and save the result to a S3 bucket

Note: This is a POC and needs some refinements before using it in production


Prerequisites:
- nodejs >= 12
- aws configured on your machine
- a s3 bucket where to save generated PDFs. The default name is `poc-pdf-files `

Deployment:
- in `serverless.yml` under `custom: bucket: poc-pdf-files` customize the name of the bucket where PDFs will be saved 
- `npm install`
- `npm run deploy` (Required the first time)
If you only modify the function you can simply run (it's quicker because it does not recreate the stack)
- `npm run deploy-function`

You can now try your lambda with

`curl <lambda_url> --data '{"html":"PGh0bWw+PGJvZHk+PGgxPmNpYW8gbW9uZG8gbG9jYWxlPC9oMT48L2JvZHk+PC9odG1sPg==","displayHeaderFooter":false,"format":"A4","emulateMedia":"print"}'`

If you need to test with a more sophisticated example take a look at the `demo.js`



[WIP] Run locally (not working right now)


`npm install`

`npm install -g serverless`

`npm install chrome-aws-lambda@3.0.4 #because on aws it's included as a layer`

Set "headless" to true

`PUPPETEER_CHROMIUM_REVISION=756035 node node_modules/puppeteer-core/install.js`

`serverless invoke local --function hello --data '{"body": "{\"html\":\"PGh0bWw+PGJvZHk+PGgxPmNpYW8gbW9uZG8gbG9jYWxlPC9oMT48L2JvZHk+PC9odG1sPg==\",\"displayHeaderFooter\":false,\"format\":\"A4\",\"emulateMedia\":\"print\"}" }'`

