// Captures a web page emulating a device, as evidence for the thesis.
// Usage (after npm install in tools/): node tools/capture-web.mjs <url> <output.png> [mobile|desktop] [fullPage]
import puppeteer from 'puppeteer-core';

const [url, output, device = 'mobile', fullPage = 'false'] = process.argv.slice(2);
const viewports = {
  mobile: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  desktop: { width: 1440, height: Number(process.env.CAPTURE_HEIGHT ?? 900), deviceScaleFactor: 1 },
};

const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
try {
  const page = await browser.newPage();
  await page.setViewport(viewports[device]);
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  // networkidle2 tolerates pages with persistent connections (Grafana, Prometheus)
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((resolve) => setTimeout(resolve, Number(process.env.CAPTURE_WAIT_MS ?? 1500)));
  await page.screenshot({ path: output, fullPage: fullPage === 'true' });
  console.log(output);
} finally {
  await browser.close();
}
