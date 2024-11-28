const puppeteer = require("puppeteer");
const chromium = require("chrome-aws-lambda");

const launchBrowser = async () => {
  const isRenderEnv =
    process.env.RENDER || process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (isRenderEnv) {
    // Configuration for Render or AWS Lambda
    return chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });
  } else {
    // Configuration for local development
    return puppeteer.launch({
      headless: true,
    });
  }
};

module.exports = launchBrowser;
