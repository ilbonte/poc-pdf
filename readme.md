Prerequisites:
- nodejs >= 12
- aws configured on your machine

Deployment:
- `npm install`
- `npm run deploy`
If you only modify the function you can simply run (it's quicker because it does not recreate the stack)
- `npm run deploy-function`

Try it by inserting the lambda's url in demo.js 



[WIP] Run locally (not working right now)


`npm install`

`npm install -g serverless`

`npm install chrome-aws-lambda@3.0.4 #because on aws it's included as a layer`

Set "headless" to true

`PUPPETEER_CHROMIUM_REVISION=756035 node node_modules/puppeteer-core/install.js`

`serverless invoke local --function hello --data '{"body": "{\"html\":\"PGh0bWw+PGJvZHk+PGgxPmNpYW8gbW9uZG8gbG9jYWxlPC9oMT48L2JvZHk+PC9odG1sPg==\",\"displayHeaderFooter\":false,\"format\":\"A4\",\"emulateMedia\":\"print\"}" }'`

