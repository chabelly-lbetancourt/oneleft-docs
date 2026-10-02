// Walks through HU-003 in the app: login, publish a plan, see its detail and the home screen.
// Usage: ONELEFT_TEST_USER=... ONELEFT_TEST_PASSWORD=... [ONELEFT_LANG=en] node tools/capture-plan.mjs <output-dir> [prefix]
import { APP, button, click, credentials, keycloakLogin, launch, mobilePage, pause, screenshot, t } from './lib/app.mjs';

const [outDir = '.', prefix = 'plan'] = process.argv.slice(2);
const login = credentials();
const browser = await launch();
const shot = (page, name, fullPage = true) => screenshot(page, outDir, prefix, name, fullPage);

try {
  await browser.defaultBrowserContext().overridePermissions(APP, ['geolocation']);
  const page = await mobilePage(browser);
  await page.setGeolocation({ latitude: 40.391234, longitude: -3.628765, accuracy: 10 });

  // Login by opening "Publish a plan" directly (protected route)
  await page.goto(`${APP}/plans/new`, { waitUntil: 'load' });
  await keycloakLogin(page, login);
  await page.waitForSelector('.publish-form', { timeout: 20000 });
  await pause(500);
  await shot(page, '1-empty-form');

  // Activity (PrimeNG Select: real click and an option of the dropdown)
  await click(page, 'p-select');
  await click(page, `li[role="option"][aria-label="${t('activities.PADEL')}"]`);
  await page.type('#title', t('publish.planTitlePlaceholder'));
  await page.type('#description', t('publish.detailsPlaceholder'));
  await click(page, `p-togglebutton[aria-label="${t('publish.in120')}"]`);
  await page.type('#placeName', t('publish.wherePlaceholder'));
  await click(page, button('publish.here'));
  await page.waitForSelector('.meeting-coordinates');
  await click(page, `p-togglebutton[aria-label="${t('levels.INTERMEDIATE')}"]`);
  await shot(page, '2-filled-form');

  // Publish and see the detail
  await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), click(page, button('publish.submit'))]);
  await page.waitForSelector('.plan-card', { timeout: 20000 });
  await pause(500);
  await shot(page, '3-detail');

  // Home screen with "Your upcoming plans"
  await page.goto(APP, { waitUntil: 'load' });
  await page.waitForSelector('.my-plan', { timeout: 20000 });
  await pause(500);
  await shot(page, '4-home', false);
  console.log('Walkthrough completed');
} finally {
  await browser.close();
}
