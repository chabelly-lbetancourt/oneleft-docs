// Walks through HU-002 in the app: login, profile, approximate location, hobbies and saving.
// Usage: ONELEFT_TEST_USER=... ONELEFT_TEST_PASSWORD=... [ONELEFT_LANG=en] node tools/capture-profile.mjs <output-dir> [prefix]
import { APP, button, click, credentials, keycloakLogin, launch, mobilePage, pause, screenshot, t } from './lib/app.mjs';

const [outDir = '.', prefix = 'profile'] = process.argv.slice(2);
const login = credentials();
// Simulated device position, full precision: the app must round it before sending it
const DEVICE_POSITION = { latitude: 40.391234, longitude: -3.628765, accuracy: 10 };
const browser = await launch();
const shot = (page, name) => screenshot(page, outDir, prefix, name);

const retype = async (page, selector, text) => {
  await page.$eval(selector, (el) => {
    el.value = '';
    el.dispatchEvent(new Event('input'));
  });
  await page.type(selector, text);
};

try {
  await browser.defaultBrowserContext().overridePermissions(APP, ['geolocation']);
  const page = await mobilePage(browser);
  await page.setGeolocation(DEVICE_POSITION);

  await page.goto(`${APP}/profile`, { waitUntil: 'load' });
  await keycloakLogin(page, login);

  // 1. Newly created profile
  await page.waitForSelector('.profile-form', { timeout: 20000 });
  await pause(500);
  await shot(page, '1-initial');

  // 2. Name, zone and hobbies
  await retype(page, '#displayName', 'Admin');
  await click(page, button('profile.useLocation'));
  await page.waitForSelector('.zone-coordinates');
  await retype(page, '#zoneName', 'Vallecas');
  await click(page, button('profile.addHobby'));
  await click(page, button('profile.addHobby'));
  // Second hobby: advanced level (PrimeNG SelectButton options are p-togglebutton with aria-label)
  const rows = await page.$$('.hobby-row');
  await (await rows[1].$(`p-togglebutton[aria-label="${t('levels.ADVANCED')}"]`)).click();
  await pause(400);
  await shot(page, '2-edited');

  // 3. Save
  await click(page, button('profile.save'));
  await page.waitForSelector('.status-message', { timeout: 15000 });
  await pause(500);
  await shot(page, '3-saved');
  console.log('Walkthrough completed');
} finally {
  await browser.close();
}
