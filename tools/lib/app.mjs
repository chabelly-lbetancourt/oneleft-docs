// Shared helpers for the scripts that walk through the OneLeft app and capture screenshots.
// Texts are looked up in the web app's own translation files, so the scripts work in both languages:
//   ONELEFT_LANG=en node tools/capture-plan.mjs <output-dir>
import { readFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

export const APP = process.env.ONELEFT_APP_URL ?? 'http://localhost:4200';
export const LANG = process.env.ONELEFT_LANG ?? 'es';
const I18N = process.env.ONELEFT_I18N_DIR ?? new URL('../../../oneleft-frontend/public/i18n/', import.meta.url).pathname;
const translations = JSON.parse(readFileSync(`${I18N}${LANG}.json`, 'utf8'));

/** Translated text of a key, for example t('auth.login') → "Entrar" or "Sign in". */
export const t = (key) => {
  const value = key.split('.').reduce((node, part) => node?.[part], translations);
  if (typeof value !== 'string') {
    throw new Error(`Missing translation: ${key}`);
  }
  return value;
};

/** Test credentials come from environment variables (taken from the development realm). */
export const credentials = () => {
  const { ONELEFT_TEST_USER: user, ONELEFT_TEST_PASSWORD: password } = process.env;
  if (!user || !password) {
    console.error('ONELEFT_TEST_USER and ONELEFT_TEST_PASSWORD are required');
    process.exit(1);
  }
  return { user, password };
};

export const launch = () =>
  puppeteer.launch({
    executablePath: process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });

export const MOBILE = { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

export const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** New mobile page (in a browser or a browser context) with the app language already chosen. */
export const mobilePage = async (browser) => {
  const page = await browser.newPage();
  await page.setViewport(MOBILE);
  // Captures show the final state of each screen: no entrance animations or page transitions
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.evaluateOnNewDocument((lang) => localStorage.setItem('oneleft.language', lang), LANG);
  return page;
};

/** PrimeNG button by its translated label. */
export const button = (key) => `p-button ::-p-text(${t(key)})`;

/** Real mouse click on the first element that matches (PrimeNG widgets ignore DOM clicks). */
export const click = async (page, selector) => {
  const element = await page.waitForSelector(selector, { timeout: 15000 });
  await element.click();
  await pause(400);
};

/**
 * The app opens its own sign-in and sign-up pages first (/login, /register): «Continue with email» leads to the
 * Keycloak form. Does nothing when the page is already Keycloak.
 */
export const openKeycloak = async (page) => {
  const found = await page.waitForSelector('#username, #firstName, .email-login button', { timeout: 20000 });
  if (await found.evaluate((element) => element.matches('.email-login button'))) {
    // The page arrives with a short transition (view transitions): clicks during it do not reach the button
    await pause(600);
    await found.click();
    await page.waitForSelector('#username, #firstName', { timeout: 60000 });
  }
};

/**
 * Fills the Keycloak login form that the app redirected to. It waits for 'load': with a session the app keeps the
 * real-time stream open (Server-Sent Events), so its pages never reach networkidle0.
 */
export const keycloakLogin = async (page, { user, password }, waitUntil = 'load') => {
  await openKeycloak(page);
  await page.waitForSelector('#username');
  await page.locator('#username').fill(user);
  await page.locator('#password').fill(password);
  await Promise.all([page.waitForNavigation({ waitUntil }), page.locator('#kc-login').click()]);
};

/** Waits until the screen has its data (no loading screen or skeletons left) and captures it. */
export const screenshot = async (page, outDir, prefix, name, fullPage = true) => {
  await page
    .waitForFunction(() => !document.querySelector('app-skeleton, .app-splash'), { timeout: 20000 })
    .catch(() => {});
  await pause(500);
  return page.screenshot({ path: `${outDir}/${prefix}-${name}.png`, fullPage });
};
