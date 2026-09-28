// Captura una página web emulando un dispositivo, para las evidencias de la memoria.
// Uso (tras npm install en tools/): node tools/captura-web.mjs <url> <salida.png> [movil|escritorio] [paginaCompleta]
import puppeteer from 'puppeteer-core';

const [url, output, device = 'movil', fullPage = 'false'] = process.argv.slice(2);
const viewports = {
  movil: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  escritorio: { width: 1440, height: Number(process.env.CAPTURA_ALTO ?? 900), deviceScaleFactor: 1 },
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
  // networkidle2 tolera páginas con conexiones persistentes (Grafana, Prometheus)
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((resolve) => setTimeout(resolve, Number(process.env.CAPTURA_ESPERA_MS ?? 1500)));
  await page.screenshot({ path: output, fullPage: fullPage === 'true' });
  console.log(output);
} finally {
  await browser.close();
}
