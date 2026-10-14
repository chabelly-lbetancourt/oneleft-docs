// Walks through HU-020 with two people. Lucía adds her photo from «My profile»: the browser crops it and uploads
// it straight to the storage. Ana adds hers too, and Lucía sees it next to her name among the nearby plans (the plan
// of Ana of the demo data, around Vallecas), in the detail of that plan and on the page of Ana. The photos are
// illustrations drawn here, and both are removed at the end.
// Usage: ONELEFT_TEST_USER=<Lucía> ONELEFT_TEST_PASSWORD=... ONELEFT_ORGANIZER_USER=<Ana>
//   ONELEFT_ORGANIZER_PASSWORD=... [ONELEFT_LANG=en] node tools/capture-photo.mjs <output-dir> [prefix]
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { APP, credentials, keycloakLogin, launch, mobilePage, pause, screenshot, t } from './lib/app.mjs';

const [outDir = '.', prefix = 'photo'] = process.argv.slice(2);
const lucia = credentials();
const ana = { user: process.env.ONELEFT_ORGANIZER_USER, password: process.env.ONELEFT_ORGANIZER_PASSWORD };
if (!ana.user || !ana.password) {
  console.error('ONELEFT_ORGANIZER_USER and ONELEFT_ORGANIZER_PASSWORD are required');
  process.exit(1);
}
/** Ana Pruebas: fixed id of the development realm */
const ANA = 'a624d063-bd1e-442d-b52d-8de2df356c13';
const browser = await launch();

/** A landscape illustration of someone, like a photo taken with a phone: the app has to crop it */
const illustration = async (name, { sky, hair, shirt }) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200">
    <defs><linearGradient id="s" x2="1" y2="1"><stop offset="0" stop-color="${sky[0]}"/>
      <stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs>
    <rect width="1600" height="1200" fill="url(#s)"/><circle cx="1250" cy="260" r="110" fill="#fef3c7"/>
    <path d="M0 900 Q400 760 800 880 T1600 840 V1200 H0 Z" fill="#4d7c0f"/>
    <g transform="translate(800 520)">
      <path d="M-300 700 Q-280 260 0 230 Q280 260 300 700 Z" fill="${shirt}"/>
      <rect x="-45" y="150" width="90" height="110" rx="40" fill="#f2c09b"/>
      <ellipse cx="0" cy="40" rx="150" ry="170" fill="#f2c09b"/>
      <path d="M-165 40 Q-180 -170 0 -165 Q185 -170 170 40 Q150 -60 60 -90 Q-60 -40 -165 40 Z" fill="${hair}"/>
      <circle cx="-55" cy="50" r="13" fill="#3b2314"/><circle cx="55" cy="50" r="13" fill="#3b2314"/>
      <path d="M-50 120 Q0 160 50 120" stroke="#9a3412" stroke-width="12" fill="none" stroke-linecap="round"/>
    </g></svg>`;
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1200 });
  await page.setContent(svg);
  const path = join(tmpdir(), `oneleft-${name}.jpg`);
  await page.screenshot({ path, type: 'jpeg', quality: 90 });
  await page.close();
  return path;
};

/** A person in their own browser context, signed in, in Vallecas (where the plans of the demo data are) */
const signedIn = async (login) => {
  const context = await browser.createBrowserContext();
  await context.overridePermissions(APP, ['geolocation']);
  const page = await mobilePage(context);
  await page.setGeolocation({ latitude: 40.3912, longitude: -3.6287, accuracy: 10 });
  await page.goto(`${APP}/profile`, { waitUntil: 'load' });
  await keycloakLogin(page, login);
  await page.waitForSelector('.profile-card', { timeout: 60000 });
  return page;
};

/** Chooses the photo as the file picker would, and waits until it is mine */
const addPhoto = async (page, photo) => {
  await (await page.$('.photo-file')).uploadFile(photo);
  await page.waitForSelector('.profile-photo img', { timeout: 30000 });
  await page.waitForFunction((text) => document.querySelector('.photo-status')?.textContent.includes(text), {
    timeout: 30000,
  }, t('photo.changed'));
};

const removePhoto = async (page) => {
  await page.goto(`${APP}/profile`, { waitUntil: 'load' });
  await page.waitForSelector('.profile-card', { timeout: 30000 });
  const remove = await page.waitForSelector('.remove-photo button', { timeout: 10000 }).catch(() => null);
  if (remove) {
    await remove.click();
    await page.waitForFunction(() => !document.querySelector('.profile-photo img'), { timeout: 30000 });
  }
};

const people = [];
try {
  const luciaPhoto = await illustration('lucia', { sky: ['#fdba74', '#f472b6'], hair: '#3b2314', shirt: '#0f766e' });
  const anaPhoto = await illustration('ana', { sky: ['#93c5fd', '#c4b5fd'], hair: '#a16207', shirt: '#b91c1c' });

  // 1. Lucía adds her photo from her profile
  const luciaPage = await signedIn(lucia);
  people.push(luciaPage);
  await addPhoto(luciaPage, luciaPhoto);
  await pause(500);
  await screenshot(luciaPage, outDir, prefix, '1-profile', false);

  // 2. Ana adds hers; Lucía sees it next to her name among the nearby plans
  const anaPage = await signedIn(ana);
  people.push(anaPage);
  await addPhoto(anaPage, anaPhoto);
  await luciaPage.goto(`${APP}/plans/nearby`, { waitUntil: 'load' });
  await luciaPage.waitForSelector('.plan-ticket__organizer img', { timeout: 30000 });
  await luciaPage.evaluate(() =>
    document.querySelector('.plan-ticket__organizer img')?.closest('li')?.scrollIntoView({ block: 'center' }),
  );
  await screenshot(luciaPage, outDir, prefix, '2-nearby', false);

  // 3. The detail of that plan: the photo of Ana as organizer; without a photo, the initials
  await luciaPage.evaluate(() => document.querySelector('.plan-ticket__organizer img')?.closest('a')?.click());
  await luciaPage.waitForSelector('.organizer-avatar img', { timeout: 30000 });
  await pause(500);
  await screenshot(luciaPage, outDir, prefix, '3-plan', false);

  // 4. The page of Ana
  await luciaPage.goto(`${APP}/people/${ANA}`, { waitUntil: 'load' });
  await luciaPage.waitForSelector('.person-card__avatar img', { timeout: 30000 });
  await screenshot(luciaPage, outDir, prefix, '4-person', false);
  console.log('Walkthrough completed');
} finally {
  // The photos were only for the screenshots
  for (const page of people) {
    await removePhoto(page).catch((error) => console.error('Could not remove a photo:', error.message));
  }
  await browser.close();
}
