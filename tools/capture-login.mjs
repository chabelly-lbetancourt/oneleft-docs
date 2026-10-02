// Walks through the OneLeft login flow with Keycloak (local environment) and captures each step.
// Usage: ONELEFT_TEST_USER=... ONELEFT_TEST_PASSWORD=... [ONELEFT_LANG=en] node tools/capture-login.mjs <output-dir> [prefix]
import { APP, button, click, credentials, keycloakLogin, launch, mobilePage, openKeycloak, pause, screenshot } from './lib/app.mjs';

const [outDir = '.', prefix = 'login'] = process.argv.slice(2);
const login = credentials();
const browser = await launch();
const shot = (page, name) => screenshot(page, outDir, prefix, name, false);

try {
  const page = await mobilePage(browser);

  // 1. Home without a session
  await page.goto(APP, { waitUntil: 'load' });
  await shot(page, '1-signed-out');

  // 2. Sign up: the app's sign-up page, then the Keycloak registration form
  await click(page, button('auth.register'));
  await openKeycloak(page);
  await page.waitForSelector('#firstName');
  await shot(page, '2-keycloak-registration');

  // 3. Sign in: the app's sign-in page, then the Keycloak login form
  await page.goto(APP, { waitUntil: 'load' });
  await click(page, button('auth.login'));
  await openKeycloak(page);
  await page.locator('#username').fill(login.user);
  await pause(300);
  await shot(page, '3-keycloak-login');
  await keycloakLogin(page, login);

  // 4. Back in OneLeft with a session
  await page.waitForSelector('.user-menu', { timeout: 15000 });
  await shot(page, '4-signed-in');

  // 5. Protected profile, loaded from the API through the gateway
  await click(page, '.user-menu');
  await page.waitForSelector('.profile-card', { timeout: 15000 });
  await shot(page, '5-profile');

  // 6. The session survives a reload
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('.profile-card', { timeout: 15000 });
  await shot(page, '6-profile-after-reload');

  // 7. Sign out
  await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), click(page, '.logout-button button')]);
  await page.waitForSelector(button('auth.login'), { timeout: 15000 });
  await shot(page, '7-signed-out-again');
  console.log('Flow completed');
} finally {
  await browser.close();
}
