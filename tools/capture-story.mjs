// Walks through HU-056 with Ana, the organizer of a plan with free spots: the card for Stories in the detail of the
// plan, made by the browser, and the card itself as it is shared (the PNG of 1080 × 1920). Nothing is shared or
// changed: the card is only made and saved.
// Usage: ONELEFT_TEST_USER=<Ana> ONELEFT_TEST_PASSWORD=... ONELEFT_PLAN_ID=<a plan of Ana> [ONELEFT_LANG=en]
//   node tools/capture-story.mjs <output-dir> [prefix]
import { writeFileSync } from 'node:fs';
import { APP, click, credentials, keycloakLogin, launch, mobilePage, pause, screenshot } from './lib/app.mjs';

const [outDir = '.', prefix = 'story'] = process.argv.slice(2);
const plan = process.env.ONELEFT_PLAN_ID;
if (!plan) {
  console.error('ONELEFT_PLAN_ID is required');
  process.exit(1);
}

const browser = await launch();
try {
  const page = await mobilePage(await browser.createBrowserContext());
  await page.goto(`${APP}/profile`, { waitUntil: 'load' });
  await keycloakLogin(page, credentials());
  await page.waitForSelector('.profile-card', { timeout: 60000 });

  // 1. In the detail of her plan, the card made in the device
  await page.goto(`${APP}/plans/${plan}`, { waitUntil: 'load' });
  await click(page, '.story-create button');
  await page.waitForSelector('.story-preview', { timeout: 30000 });
  await page.waitForFunction(() => document.querySelector('.story-preview')?.complete, { timeout: 10000 });
  await page.$eval('.story-share', (element) => element.scrollIntoView({ block: 'center' }));
  await pause(400);
  await screenshot(page, outDir, prefix, '1-plan', false);

  // 2. The card itself, as the share sheet receives it
  const png = await page.$eval('.story-preview', async (image) => {
    const blob = await (await fetch(image.src)).blob();
    const bytes = new Uint8Array(await blob.arrayBuffer());
    return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));
  });
  writeFileSync(`${outDir}/${prefix}-2-card.png`, Buffer.from(png, 'base64'));
  console.log('Walkthrough completed');
} finally {
  await browser.close();
}
