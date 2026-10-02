// Puts several screenshots side by side, each with its caption, in one figure for the diary.
// Usage: node tools/compose-figure.mjs <output.png> "<caption 1>=<image 1>" "<caption 2>=<image 2>" ...
//   [COLUMNS=4] [WIDTH=360] node tools/compose-figure.mjs capturas/app-web/68-paginas-acceso.png "Entrar=/tmp/a.png" ...
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import puppeteer from 'puppeteer-core';

const [output, ...items] = process.argv.slice(2);
if (!output || items.length === 0) {
  console.error('Usage: node tools/compose-figure.mjs <output.png> "<caption>=<image>" ...');
  process.exit(1);
}
const columns = Number(process.env.COLUMNS ?? Math.min(items.length, 4));
const width = Number(process.env.WIDTH ?? 360);
const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const cells = items
  .map((item) => {
    const at = item.lastIndexOf('=');
    const [caption, image] = [item.slice(0, at), resolve(item.slice(at + 1))];
    return `<figure><img src="file://${image}"><figcaption>${escape(caption)}</figcaption></figure>`;
  })
  .join('');
const html = `<!doctype html><meta charset="utf-8"><style>
  body { margin: 0; padding: 24px; background: #fff; font: 15px/1.3 system-ui, sans-serif; color: #1c1917;
         display: grid; grid-template-columns: repeat(${columns}, ${width}px); gap: 24px 20px; width: max-content; }
  figure { margin: 0; }
  img { width: ${width}px; border: 1px solid #e7e5e4; border-radius: 12px; display: block; }
  figcaption { margin-top: 8px; text-align: center; font-weight: 600; }
</style>${cells}`;
const page = join(tmpdir(), `compose-figure-${process.pid}.html`);
writeFileSync(page, html);

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
try {
  const tab = await browser.newPage();
  await tab.setViewport({ width: 400, height: 400, deviceScaleFactor: 2 });
  await tab.goto(`file://${page}`, { waitUntil: 'load' });
  const body = await tab.$('body');
  await body.screenshot({ path: output });
  console.log(output);
} finally {
  await browser.close();
}
