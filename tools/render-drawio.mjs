// Exports the draw.io diagrams of a folder (<folder>/src/*.drawio) to SVG and PNG next to it, with the official
// viewer of diagrams.net in a headless browser: nothing to install besides the tools of this folder.
// Usage: node tools/render-drawio.mjs diagramas/datos
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import puppeteer from 'puppeteer-core';

const [folder] = process.argv.slice(2);
if (!folder) {
  console.error('Usage: node tools/render-drawio.mjs <folder>');
  process.exit(1);
}
const VIEWER = 'https://viewer.diagrams.net/js/viewer-static.min.js';
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});

try {
  for (const file of readdirSync(join(folder, 'src')).filter((name) => name.endsWith('.drawio'))) {
    const xml = readFileSync(join(folder, 'src', file), 'utf8');
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 2 });
    const config = JSON.stringify({ xml, toolbar: '', nav: false, resize: true, border: 24 })
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;');
    await page.setContent(
      `<!doctype html><html><body style="margin:0;background:#fff">
         <div class="mxgraph" data-mxgraph="${config}"></div>
         <script src="${VIEWER}"></script></body></html>`,
      { waitUntil: 'networkidle0' },
    );
    const svg = await page.waitForSelector('.mxgraph svg', { timeout: 30000 });
    const name = basename(file, '.drawio');
    const markup = await svg.evaluate((element) => {
      element.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      element.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      return element.outerHTML;
    });
    writeFileSync(join(folder, `${name}.svg`), `<?xml version="1.0" encoding="UTF-8"?>\n${markup}\n`);
    await (await page.$('.mxgraph')).screenshot({ path: join(folder, `${name}.png`), omitBackground: false });
    console.log(join(folder, `${name}.png`));
    await page.close();
  }
} finally {
  await browser.close();
}
