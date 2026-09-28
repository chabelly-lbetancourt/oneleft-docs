// Walks through the gateway Swagger UI: signs in with Keycloak (PKCE) and tries GET /api/v1/users/me.
// Usage: ONELEFT_TEST_USER=... ONELEFT_TEST_PASSWORD=... node tools/capture-swagger.mjs <output-dir> [prefix]
import { credentials, launch, pause } from './lib/app.mjs';

const [outDir = '.', prefix = 'swagger'] = process.argv.slice(2);
const SWAGGER = process.env.ONELEFT_SWAGGER_URL ?? 'http://localhost:8080/swagger-ui/index.html';
const { user, password } = credentials();
const browser = await launch();

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });

  // 1. Swagger UI with the users API
  await page.goto(SWAGGER, { waitUntil: 'networkidle2' });
  await page.waitForSelector('.opblock-summary');
  await pause(800);
  await page.screenshot({ path: `${outDir}/${prefix}-1-swagger-ui.png`, fullPage: true });

  // 2. "Authorize": OAuth2 authorization dialog with Keycloak
  await page.locator('.btn.authorize').click();
  await page.waitForSelector('.auth-container');
  await page.$$eval('.auth-container input[type=checkbox]', (boxes) =>
    boxes.forEach((box) => !box.checked && box.click()),
  );
  await page.screenshot({ path: `${outDir}/${prefix}-2-authorize.png` });

  // 3. Keycloak login (opens in a popup)
  const popupTarget = browser.waitForTarget((t) => t.url().includes('/protocol/openid-connect/auth'));
  await page.locator('.auth-btn-wrapper .btn.modal-btn.auth.authorize').click();
  const popup = await (await popupTarget).page();
  await popup.setViewport({ width: 800, height: 900 });
  await popup.waitForSelector('#username');
  await popup.locator('#username').fill(user);
  await popup.locator('#password').fill(password);
  await popup.screenshot({ path: `${outDir}/${prefix}-3-login-keycloak.png` });
  await popup.locator('#kc-login').click();

  // 4. Back in Swagger UI, authorized
  await page.waitForSelector('.auth-container .btn.modal-btn.auth.button', { timeout: 20000 });
  await pause(500);
  await page.screenshot({ path: `${outDir}/${prefix}-4-authorized.png` });
  // The next clicks go through the DOM: the Swagger UI modal is animated and
  // Puppeteer locators wait for the element to stop moving.
  const clickDom = async (selector) => {
    await page.waitForSelector(selector);
    await page.$eval(selector, (el) => el.click());
    await pause(400);
  };
  await clickDom('.btn-done');

  // 5. "Execute" on GET /api/v1/users/me ("Try it out" is enabled in the configuration)
  await clickDom('.opblock-summary-control');
  await clickDom('.btn.execute');
  await page.waitForSelector('.live-responses-table .response-col_status', { timeout: 20000 });
  await pause(800);
  const operation = await page.$('.opblock.is-open');
  await operation.screenshot({ path: `${outDir}/${prefix}-5-me-response.png` });
  console.log('Walkthrough completed');
} finally {
  await browser.close();
}
