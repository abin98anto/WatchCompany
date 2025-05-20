const puppeteer = require("puppeteer");
const chromium = require("chrome-aws-lambda");

const launchBrowser = async () => {
  const isRenderEnv =
    process.env.RENDER || process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (isRenderEnv) {
    // Use the recommended Render setup for Puppeteer
    return puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
      ],
      headless: "new",
      executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH ||
        (await chromium.executablePath),
    });
  } else {
    // Local development configuration
    return puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
};

module.exports = launchBrowser;
