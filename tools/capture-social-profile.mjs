// Walks through HU-048 with two people. Ana writes her bio; her profile is private. Lucía opens Ana's social profile
// without following her: photo, bio, hobbies, statistics and badges, but not her plans nor her network. Lucía asks to
// follow her, Ana accepts, and Lucía sees Ana's activity: her recent plans, followers and who she follows. Lucía also
// writes her own bio. At the end the bios are restored and Lucía stops following Ana.
// Usage: ONELEFT_TEST_USER=<Lucía> ONELEFT_TEST_PASSWORD=... ONELEFT_ORGANIZER_USER=<Ana>
//   ONELEFT_ORGANIZER_PASSWORD=... [ONELEFT_LANG=en] node tools/capture-social-profile.mjs <output-dir> [prefix]
import { APP, click, credentials, keycloakLogin, launch, mobilePage, pause, screenshot, t } from './lib/app.mjs';

const [outDir = '.', prefix = 'social-profile'] = process.argv.slice(2);
const lucia = credentials();
const ana = { user: process.env.ONELEFT_ORGANIZER_USER, password: process.env.ONELEFT_ORGANIZER_PASSWORD };
if (!ana.user || !ana.password) {
  console.error('ONELEFT_ORGANIZER_USER and ONELEFT_ORGANIZER_PASSWORD are required');
  process.exit(1);
}
/** Ana Pruebas: fixed id of the development realm */
const ANA = 'a624d063-bd1e-442d-b52d-8de2df356c13';
const ANA_BIO = 'Corro los domingos por el parque y busco a alguien para el pádel.';
const LUCIA_BIO = 'Pádel y running siempre que puedo. Llego puntual y me apunto a casi todo.';
const browser = await launch();

const signedIn = async (login) => {
  const page = await mobilePage(await browser.createBrowserContext());
  await page.goto(`${APP}/profile`, { waitUntil: 'load' });
  await keycloakLogin(page, login);
  await page.waitForSelector('.profile-card', { timeout: 60000 });
  return page;
};

/** Writes a bio in «My profile» and saves it; returns the one there was */
const writeBio = async (page, bio) => {
  await page.goto(`${APP}/profile`, { waitUntil: 'load' });
  const field = await page.waitForSelector('#bio', { timeout: 30000 });
  const before = await field.evaluate((element) => element.value);
  await field.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  if (bio) {
    await field.type(bio);
  }
  await click(page, '.profile-form button[type=submit]');
  await page.waitForFunction((text) => document.querySelector('.status-message')?.textContent.includes(text), {
    timeout: 30000,
  }, t('profile.saved'));
  return before;
};

let anaBefore = null;
let luciaBefore = null;
let anaPage;
let luciaPage;
try {
  // 1. Ana writes her bio; Lucía opens her social profile without following her
  anaPage = await signedIn(ana);
  anaBefore = await writeBio(anaPage, ANA_BIO);
  luciaPage = await signedIn(lucia);
  await luciaPage.goto(`${APP}/people/${ANA}`, { waitUntil: 'load' });
  await luciaPage.waitForSelector('.person-bio', { timeout: 30000 });
  await luciaPage.waitForSelector('.private-activity', { timeout: 30000 });
  await screenshot(luciaPage, outDir, prefix, '1-private', false);

  // 2. Lucía asks to follow her and Ana accepts: Lucía sees Ana's activity
  await click(luciaPage, '.follow-button button');
  await luciaPage.waitForSelector('.requested-message', { timeout: 30000 });
  await anaPage.goto(`${APP}/network`, { waitUntil: 'load' });
  await anaPage.waitForSelector('.connections--followers', { timeout: 30000 });
  await pause(600);
  await click(anaPage, '.requests-tab');
  const accept = await anaPage.waitForSelector(
    '.connections--requests .connection:first-child .accept-request button',
    { timeout: 30000 },
  );
  await accept.click();
  await pause(800);
  await luciaPage.reload({ waitUntil: 'load' });
  await luciaPage.waitForSelector('.activity-tabs', { timeout: 30000 });
  await pause(600);
  await click(luciaPage, '.person-followers-tab');
  await luciaPage.waitForSelector('.person-connection', { timeout: 30000 });
  await luciaPage.evaluate(() =>
    document.querySelector('.person-activity-card')?.scrollIntoView({ block: 'end' }),
  );
  await screenshot(luciaPage, outDir, prefix, '2-following', false);

  // 3. Lucía writes her own bio
  luciaBefore = await writeBio(luciaPage, LUCIA_BIO);
  await luciaPage.evaluate(() => {
    document.querySelector('#bio')?.scrollIntoView({ block: 'center' });
  });
  await screenshot(luciaPage, outDir, prefix, '3-my-bio', false);
  console.log('Walkthrough completed');
} finally {
  // Nothing of the walkthrough stays: the bios as they were, and Lucía no longer follows Ana
  try {
    if (luciaPage) {
      if (luciaBefore !== null) {
        await writeBio(luciaPage, luciaBefore);
      }
      await luciaPage.goto(`${APP}/people/${ANA}`, { waitUntil: 'load' });
      const unfollow = await luciaPage.waitForSelector('.unfollow-button button, .cancel-request button', {
        timeout: 15000,
      }).catch(() => null);
      if (unfollow) {
        await unfollow.click();
        await luciaPage.waitForSelector('.follow-button', { timeout: 30000 });
      }
    }
    if (anaPage && anaBefore !== null) {
      await writeBio(anaPage, anaBefore);
    }
  } catch (error) {
    console.error('Could not undo the walkthrough:', error.message);
  }
  await browser.close();
}
