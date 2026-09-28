// Recorre HU-003 en la app: login, publicar un plan, ver su detalle y la pantalla de inicio.
// Uso: ONELEFT_TEST_USER=... ONELEFT_TEST_PASSWORD=... node tools/captura-plan.mjs <carpeta-salida> [prefijo]
import puppeteer from 'puppeteer-core';

const [outDir = '.', prefix = 'plan'] = process.argv.slice(2);
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
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const shot = (page, name) => page.screenshot({ path: `${outDir}/${prefix}-${name}.png`, fullPage: true });

try {
  await browser.defaultBrowserContext().overridePermissions(APP, ['geolocation']);
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await page.setGeolocation({ latitude: 40.391234, longitude: -3.628765, accuracy: 10 });

  // Login entrando directamente en «Publicar un plan» (ruta protegida)
  await page.goto(`${APP}/planes/nuevo`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('#username');
  await page.locator('#username').fill(user);
  await page.locator('#password').fill(password);
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }), page.locator('#kc-login').click()]);
  await page.waitForSelector('.publish-form', { timeout: 20000 });
  await pause(500);
  await shot(page, '1-formulario-vacio');

  // Actividad (Select de PrimeNG: clic real y opción del desplegable)
  await (await page.$('p-select')).click();
  await page.waitForSelector('li[role="option"][aria-label="Pádel"]');
  await (await page.$('li[role="option"][aria-label="Pádel"]')).click();
  await page.type('#title', 'Partido de pádel, falta uno');
  await page.type('#description', 'Nivel medio, pista cubierta. Traemos bolas.');
  await (await page.$('p-togglebutton[aria-label="En 2 h"]')).click();
  await page.type('#placeName', 'Pistas del polideportivo de Vallecas');
  await (await page.$('p-button[label="Estoy aquí"] button')).click();
  await page.waitForSelector('.meeting-coordinates');
  await (await page.$('p-togglebutton[aria-label="Intermedio"]')).click();
  await pause(400);
  await shot(page, '2-formulario-relleno');

  // Publicar y ver el detalle
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    (await page.$('p-button[label="Publicar plan"] button')).click(),
  ]);
  await page.waitForSelector('.plan-card', { timeout: 20000 });
  await pause(500);
  await shot(page, '3-detalle');

  // Pantalla de inicio con «Tus próximos planes»
  await page.goto(APP, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.my-plan', { timeout: 20000 });
  await pause(500);
  await page.screenshot({ path: `${outDir}/${prefix}-4-inicio.png` });
  console.log('Recorrido completado');
} finally {
  await browser.close();
}
