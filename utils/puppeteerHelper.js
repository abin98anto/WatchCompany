const puppeteer = require("puppeteer");
const chromium = require("chrome-aws-lambda");

const launchBrowser = async () => {
  const isRenderEnv =
    process.env.RENDER || process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (isRenderEnv) {
    return chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: "/opt/render/.cache/puppeteer/chrome-linux/chrome",
      headless: chromium.headless,
    });
  } else {
    return puppeteer.launch({
      executablePath: "/usr/bin/google-chrome",
      headless: true,
    });
  }
};

module.exports = launchBrowser;
