// Walks through HU-071: Lucía, in Vallecas, starts publishing a plan and types «Polidep» as the meeting point. The
// nearby sports halls appear with their address and distance (real Photon results through the local backend); she
// chooses the closest one with the keyboard and the place and its point are filled. Nothing is published.
// Usage: ONELEFT_TEST_USER=<Lucía> ONELEFT_TEST_PASSWORD=... [ONELEFT_LANG=en] node tools/capture-places.mjs <output-dir> [prefix]
import { APP, credentials, keycloakLogin, launch, mobilePage, pause, screenshot } from './lib/app.mjs';

const [outDir = '.', prefix = 'places'] = process.argv.slice(2);
const browser = await launch();

try {
  const context = await browser.createBrowserContext();
  await context.overridePermissions(APP, ['geolocation']);
  const page = await mobilePage(context);
  await page.setGeolocation({ latitude: 40.391234, longitude: -3.628765, accuracy: 10 });
  await page.goto(`${APP}/plans/new`, { waitUntil: 'load' });
  await keycloakLogin(page, credentials());
  await page.waitForSelector('.publish-form', { timeout: 30000 });
  await pause(800);

  // 1. She types the beginning of the name: the closest places come first. The field is at the top of the screen, as
  // when the keyboard is open, so the list opens below it
  await page.$eval('#placeName', (input) => input.scrollIntoView({ block: 'start' }));
  await pause(300);
  await page.click('#placeName');
  await page.keyboard.type('Polidep', { delay: 80 });
  await page.waitForSelector('[role="option"]', { timeout: 20000 });
  await pause(600);
  await screenshot(page, outDir, prefix, '1-suggestions', false);

  // 2. She chooses the first one with the keyboard: the name and the point of the meeting are filled
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.waitForSelector('.meeting-coordinates');
  await pause(400);
  await screenshot(page, outDir, prefix, '2-chosen', false);
  console.log('Walkthrough completed');
} finally {
  await browser.close();
}
