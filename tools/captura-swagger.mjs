// Recorre Swagger UI del gateway: inicia sesión con Keycloak (PKCE) y prueba GET /api/v1/users/me.
// Uso: ONELEFT_TEST_USER=... ONELEFT_TEST_PASSWORD=... node tools/captura-swagger.mjs <carpeta-salida> [prefijo]
import puppeteer from 'puppeteer-core';

const [outDir = '.', prefix = 'swagger'] = process.argv.slice(2);
const SWAGGER = process.env.ONELEFT_SWAGGER_URL ?? 'http://localhost:8080/swagger-ui/index.html';
const { ONELEFT_TEST_USER: user, ONELEFT_TEST_PASSWORD: password } = process.env;
if (!user || !password) {
  console.error('Faltan ONELEFT_TEST_USER y ONELEFT_TEST_PASSWORD');
  process.exit(1);
}

const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });

  // 1. Swagger UI con la API de users
  await page.goto(SWAGGER, { waitUntil: 'networkidle2' });
  await page.waitForSelector('.opblock-summary');
  await pause(800);
  await page.screenshot({ path: `${outDir}/${prefix}-1-swagger-ui.png`, fullPage: true });

  // 2. «Authorize»: ventana de autorización OAuth2 con Keycloak
  await page.locator('.btn.authorize').click();
  await page.waitForSelector('.auth-container');
  await page.$$eval('.auth-container input[type=checkbox]', (boxes) =>
    boxes.forEach((box) => !box.checked && box.click()),
  );
  await page.screenshot({ path: `${outDir}/${prefix}-2-authorize.png` });

  // 3. Login en Keycloak (se abre en una ventana emergente)
  const popupTarget = browser.waitForTarget((t) => t.url().includes('/protocol/openid-connect/auth'));
  await page.locator('.auth-btn-wrapper .btn.modal-btn.auth.authorize').click();
  const popup = await (await popupTarget).page();
  await popup.setViewport({ width: 800, height: 900 });
  await popup.waitForSelector('#username');
  await popup.locator('#username').fill(user);
  await popup.locator('#password').fill(password);
  await popup.screenshot({ path: `${outDir}/${prefix}-3-login-keycloak.png` });
  await popup.locator('#kc-login').click();

  // 4. De vuelta en Swagger UI, autorizado
  await page.waitForSelector('.auth-container .btn.modal-btn.auth.button', { timeout: 20000 });
  await pause(500);
  await page.screenshot({ path: `${outDir}/${prefix}-4-autorizado.png` });
  // Los clics siguientes se hacen sobre el DOM: el modal de Swagger UI se anima y
  // los localizadores de Puppeteer esperan a que el elemento deje de moverse.
  const clickDom = async (selector) => {
    await page.waitForSelector(selector);
    await page.$eval(selector, (el) => el.click());
    await pause(400);
  };
  await clickDom('.btn-done');

  // 5. «Execute» en GET /api/v1/users/me («Try it out» viene activado en la configuración)
  await clickDom('.opblock-summary-control');
  await clickDom('.btn.execute');
  await page.waitForSelector('.live-responses-table .response-col_status', { timeout: 20000 });
  await pause(800);
  const operation = await page.$('.opblock.is-open');
  await operation.screenshot({ path: `${outDir}/${prefix}-5-respuesta-me.png` });
  console.log('Recorrido completado');
} finally {
  await browser.close();
}
