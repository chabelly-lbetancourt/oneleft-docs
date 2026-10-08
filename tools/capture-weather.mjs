// Walks through HU-026: the detail of an upcoming outdoor plan with the weather forecast at its time and place.
// Usage: ONELEFT_TEST_USER=... ONELEFT_TEST_PASSWORD=... [ONELEFT_LANG=en] node tools/capture-weather.mjs <output-dir> <plan-id> [prefix]
import { APP, credentials, keycloakLogin, launch, mobilePage, screenshot } from './lib/app.mjs';

const [outDir = '.', planId, prefix = 'weather'] = process.argv.slice(2);
if (!planId) {
  console.error('The id of an upcoming outdoor plan is required');
  process.exit(1);
}
const login = credentials();
const browser = await launch();

try {
  const page = await mobilePage(browser);
  // Signed in first: the forecast is only asked with a session
  await page.goto(`${APP}/profile`, { waitUntil: 'load' });
  await keycloakLogin(page, login);
  await page.waitForSelector('.profile-card', { timeout: 30000 });
  await page.goto(`${APP}/plans/${planId}`, { waitUntil: 'load' });
  await page.waitForSelector('.weather', { timeout: 30000 });
  await page.evaluate(() => document.querySelector('.weather')?.scrollIntoView({ block: 'center' }));
  await screenshot(page, outDir, prefix, 'detail', false);
  console.log('Walkthrough completed');
} finally {
  await browser.close();
}
