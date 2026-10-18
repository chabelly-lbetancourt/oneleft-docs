// Walks through HU-073 and HU-072 with Lucía. On the web, at phone size, the header keeps the logo and her avatar,
// which opens the menu of her account and the settings. Then the same build runs as the Android app would: Capacitor
// reports the platform 'android' and the navigation bar of the system takes 24 px, which shows the bottom menu. In
// that simulation the native plugins do not answer, so only the home page, which needs no data, is captured.
// It only looks: nothing is created or changed.
// Usage: ONELEFT_TEST_USER=<Lucía> ONELEFT_TEST_PASSWORD=... [ONELEFT_LANG=en] node tools/capture-navigation.mjs
//   <output-dir> [prefix]
import { APP, credentials, keycloakLogin, launch, mobilePage, pause, screenshot } from './lib/app.mjs';

const [outDir = '.', prefix = 'navigation'] = process.argv.slice(2);
const browser = await launch();
try {
  const page = await mobilePage(await browser.createBrowserContext());
  await page.goto(`${APP}/profile`, { waitUntil: 'load' });
  await keycloakLogin(page, credentials());
  await page.waitForSelector('.profile-card', { timeout: 60000 });

  // 1. The web: the header with the avatar, and the menu it opens
  await page.goto(APP, { waitUntil: 'load' });
  await page.waitForSelector('.nearby-entry', { timeout: 30000 });
  await screenshot(page, outDir, prefix, '1-header', false);
  await page.click('button.user-menu');
  await page.waitForSelector('.user-menu-panel', { visible: true, timeout: 15000 });
  await pause(500);
  await screenshot(page, outDir, prefix, '2-account-menu', false);
  await page.keyboard.press('Escape');

  // 2. The Android app: it keeps the session in localStorage, and Capacitor reports the platform
  await page.evaluate(() => {
    for (let index = 0; index < sessionStorage.length; index++) {
      const key = sessionStorage.key(index);
      localStorage.setItem(key, sessionStorage.getItem(key));
    }
  });
  await page.evaluateOnNewDocument(() => {
    window.CapacitorCustomPlatform = { name: 'android', plugins: {} };
    document.addEventListener('DOMContentLoaded', () =>
      document.documentElement.style.setProperty('--safe-area-inset-bottom', '24px'),
    );
  });
  await page.goto(APP, { waitUntil: 'load' });
  await page.waitForSelector('app-tab-bar nav', { timeout: 30000 });
  await page.waitForSelector('.nearby-entry', { timeout: 30000 });
  await pause(1000);
  await page.screenshot({ path: `${outDir}/${prefix}-3-app-menu.png` });
  console.log('Walkthrough completed');
} finally {
  await browser.close();
}
