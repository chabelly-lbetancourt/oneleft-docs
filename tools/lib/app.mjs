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

/** New mobile page with the app language already chosen. */
export const mobilePage = async (browser) => {
  const page = await browser.newPage();
  await page.setViewport(MOBILE);
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

/** Fills the Keycloak login form that the app redirected to. */
export const keycloakLogin = async (page, { user, password }) => {
  await page.waitForSelector('#username');
  await page.locator('#username').fill(user);
  await page.locator('#password').fill(password);
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }), page.locator('#kc-login').click()]);
};

export const screenshot = (page, outDir, prefix, name, fullPage = true) =>
  page.screenshot({ path: `${outDir}/${prefix}-${name}.png`, fullPage });
