// Recorre el flujo de inicio de sesión de OneLeft con Keycloak (entorno local) y captura cada paso.
// Las credenciales de prueba se leen de variables de entorno (proceden del realm de desarrollo):
//   ONELEFT_TEST_USER=... ONELEFT_TEST_PASSWORD=... node tools/captura-login.mjs <carpeta-salida> [prefijo]
import puppeteer from 'puppeteer-core';

const [outDir = '.', prefix = 'login'] = process.argv.slice(2);
const APP = process.env.ONELEFT_APP_URL ?? 'http://localhost:4200';
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
const shot = (page, name) => page.screenshot({ path: `${outDir}/${prefix}-${name}.png` });

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });

  // 1. Inicio sin sesión
  await page.goto(APP, { waitUntil: 'networkidle0' });
  await shot(page, '1-sin-sesion');

  // 2. Registro: «Crear cuenta» abre el formulario de registro de Keycloak
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.locator('p-button[label="Crear cuenta"] button').click(),
  ]);
  await shot(page, '2-registro-keycloak');

  // 3. Login: «Entrar» abre el formulario de acceso de Keycloak
  await page.goto(APP, { waitUntil: 'networkidle0' });
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.locator('p-button[label="Entrar"] button').click(),
  ]);
  await page.locator('#username').fill(user);
  await page.locator('#password').fill(password);
  await shot(page, '3-login-keycloak');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.locator('#kc-login').click(),
  ]);

  // 4. De vuelta en OneLeft con sesión iniciada
  await page.waitForSelector('.user-menu', { timeout: 15000 });
  await shot(page, '4-con-sesion');

  // 5. Perfil protegido, cargado desde la API a través del gateway
  await page.locator('.user-menu').click();
  await page.waitForSelector('.profile-card', { timeout: 15000 });
  await shot(page, '5-perfil');

  // 6. La sesión se mantiene al recargar la página
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('.profile-card', { timeout: 15000 });
  await shot(page, '6-perfil-tras-recargar');

  // 7. Cierre de sesión
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.locator('p-button[label="Cerrar sesión"] button').click(),
  ]);
  await page.waitForSelector('p-button[label="Entrar"]', { timeout: 15000 });
  await shot(page, '7-sesion-cerrada');
  console.log('Flujo completado');
} finally {
  await browser.close();
}
