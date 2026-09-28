// Recorre HU-002 en la app: login, perfil, ubicación aproximada, aficiones y guardado.
// Uso: ONELEFT_TEST_USER=... ONELEFT_TEST_PASSWORD=... node tools/captura-perfil.mjs <carpeta-salida> [prefijo]
import puppeteer from 'puppeteer-core';

const [outDir = '.', prefix = 'perfil'] = process.argv.slice(2);
const APP = process.env.ONELEFT_APP_URL ?? 'http://localhost:4200';
const { ONELEFT_TEST_USER: user, ONELEFT_TEST_PASSWORD: password } = process.env;
if (!user || !password) {
  console.error('Faltan ONELEFT_TEST_USER y ONELEFT_TEST_PASSWORD');
  process.exit(1);
}
// Posición simulada del dispositivo, con toda la precisión: la app debe redondearla antes de enviarla
const DEVICE_POSITION = { latitude: 40.391234, longitude: -3.628765, accuracy: 10 };

const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const shot = (page, name, fullPage = true) => page.screenshot({ path: `${outDir}/${prefix}-${name}.png`, fullPage });

try {
  await browser.defaultBrowserContext().overridePermissions(APP, ['geolocation']);
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await page.setGeolocation(DEVICE_POSITION);

  // Login
  await page.goto(`${APP}/perfil`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('#username');
  await page.locator('#username').fill(user);
  await page.locator('#password').fill(password);
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }), page.locator('#kc-login').click()]);

  // 1. Perfil recién creado
  await page.waitForSelector('.profile-form', { timeout: 20000 });
  await pause(500);
  await shot(page, '1-inicial');

  // 2. Nombre, zona y aficiones
  const clickDom = async (selector) => {
    await page.$eval(selector, (el) => el.click());
    await pause(400);
  };
  await page.$eval('#displayName', (el) => {
    el.value = '';
    el.dispatchEvent(new Event('input'));
  });
  await page.type('#displayName', 'Admin del club');
  await clickDom('p-button[label="Usar mi ubicación"] button');
  await page.waitForSelector('.zone-coordinates');
  await page.$eval('#zoneName', (el) => {
    el.value = '';
    el.dispatchEvent(new Event('input'));
  });
  await page.type('#zoneName', 'Vallecas');
  await clickDom('p-button[label="Añadir afición"] button');
  await clickDom('p-button[label="Añadir afición"] button');
  // Segunda afición: nivel avanzado
  // El SelectButton de PrimeNG necesita un clic real del ratón, no un click() sobre el DOM
  const rows = await page.$$('.hobby-row');
  const advanced = await rows[1].$('p-togglebutton[aria-label="Avanzado"]');
  await advanced.click();
  await pause(400);
  await shot(page, '2-editado');

  // 3. Guardar
  await clickDom('p-button[label="Guardar perfil"] button');
  await page.waitForSelector('.status-message', { timeout: 15000 });
  await pause(500);
  await shot(page, '3-guardado');
  console.log('Recorrido completado');
} finally {
  await browser.close();
}
