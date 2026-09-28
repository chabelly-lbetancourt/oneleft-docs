// Shows the translated message of the gateway rate limit (429) when publishing a plan.
// Run it once the user has used up the publications of the hour (for example with the e2e script).
// Usage: ONELEFT_TEST_USER=... ONELEFT_TEST_PASSWORD=... [ONELEFT_LANG=en] node tools/capture-rate-limit.mjs <output-dir> [prefix]
import { APP, button, click, credentials, keycloakLogin, launch, mobilePage, pause, screenshot, t } from './lib/app.mjs';

const [outDir = '.', prefix = 'rate-limit'] = process.argv.slice(2);
const login = credentials();
const browser = await launch();

try {
  await browser.defaultBrowserContext().overridePermissions(APP, ['geolocation']);
  const page = await mobilePage(browser);
  await page.setGeolocation({ latitude: 40.391234, longitude: -3.628765, accuracy: 10 });

  await page.goto(`${APP}/plans/new`, { waitUntil: 'load' });
  await keycloakLogin(page, login, 'load');
  await page.waitForSelector('.publish-form', { timeout: 20000 });

  await click(page, 'p-select');
  await click(page, `li[role="option"][aria-label="${t('activities.RUNNING')}"]`);
  await page.type('#title', t('publish.planTitlePlaceholder'));
  await click(page, `p-togglebutton[aria-label="${t('publish.in120')}"]`);
  await page.type('#placeName', t('publish.wherePlaceholder'));
  await click(page, button('publish.here'));
  await page.waitForSelector('.meeting-coordinates');
  await click(page, button('publish.submit'));

  // The form stays filled in and explains how long to wait
  await page.waitForSelector('.status-message', { timeout: 20000 });
  await pause(500);
  await screenshot(page, outDir, prefix, 'publish-429', true);
  console.log('Walkthrough completed');
} finally {
  await browser.close();
}
