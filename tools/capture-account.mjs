// Walks through HU-045 with Lucía: the consent card on the home page, «My data» (privacy, download and delete) with the
// confirmation word typed but never submitted, and the public privacy text. Nothing is accepted, downloaded or deleted.
// Usage: ONELEFT_TEST_USER=<Lucía> ONELEFT_TEST_PASSWORD=... [ONELEFT_LANG=en] node tools/capture-account.mjs <output-dir> [prefix]
import { APP, credentials, keycloakLogin, launch, mobilePage, pause, screenshot, t } from './lib/app.mjs';

const [outDir = '.', prefix = 'account'] = process.argv.slice(2);
const browser = await launch();
try {
  const page = await mobilePage(await browser.createBrowserContext());
  await page.goto(`${APP}/profile`, { waitUntil: 'load' });
  await keycloakLogin(page, credentials());
  await page.waitForSelector('.profile-card', { timeout: 60000 });

  // 1. The consent card on the home page
  await page.goto(`${APP}/`, { waitUntil: 'load' });
  await page.waitForSelector('.consent-card', { timeout: 30000 });
  await screenshot(page, outDir, prefix, '1-consent', false);

  // 2. «My data»: privacy, download and delete, with the word typed (not submitted)
  await page.goto(`${APP}/account`, { waitUntil: 'load' });
  await page.waitForSelector('.account-card', { timeout: 30000 });
  await screenshot(page, outDir, prefix, '2-account', false);
  await page.type('#delete-confirmation', t('account.deleteWord'));
  await page.$eval('.account-delete', (element) => element.scrollIntoView({ block: 'end' }));
  await pause(400);
  await screenshot(page, outDir, prefix, '3-delete', false);

  // 3. The privacy text
  await page.goto(`${APP}/privacy`, { waitUntil: 'load' });
  await page.waitForSelector('h1', { timeout: 30000 });
  await screenshot(page, outDir, prefix, '4-privacy', false);
  console.log('Walkthrough completed');
} finally {
  await browser.close();
}
