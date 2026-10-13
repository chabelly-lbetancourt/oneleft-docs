// Walks through HU-025 with two people: Ana publishes a padel plan that starts in a few minutes at the courts and Lucía
// joins it. Lucía, at the courts, says «I'm here»; Ana, with the plan open, gets the notice and sees who has arrived.
// Ana is still about 400 m away, so her own check-in is rejected.
// Usage: ONELEFT_TEST_USER=<Lucía> ONELEFT_TEST_PASSWORD=... ONELEFT_ORGANIZER_USER=<Ana> ONELEFT_ORGANIZER_PASSWORD=...
//   [ONELEFT_LANG=en] node tools/capture-check-in.mjs <output-dir> [prefix]
import { APP, click, credentials, keycloakLogin, launch, mobilePage, pause, screenshot, t } from './lib/app.mjs';
import { clockIn, publishPlan } from './lib/publish.mjs';

const [outDir = '.', prefix = 'check-in'] = process.argv.slice(2);
const participant = credentials();
const organizer = { user: process.env.ONELEFT_ORGANIZER_USER, password: process.env.ONELEFT_ORGANIZER_PASSWORD };
if (!organizer.user || !organizer.password) {
  console.error('ONELEFT_ORGANIZER_USER and ONELEFT_ORGANIZER_PASSWORD are required');
  process.exit(1);
}
/** The courts of Vallecas, where the plan is published with «I'm here» */
const COURTS = { latitude: 40.3912, longitude: -3.6287 };
/** About 400 m north of the courts */
const ON_THE_WAY = { latitude: 40.3948, longitude: -3.6287 };
const browser = await launch();

/** A person in their own browser context, signed in, at a given place. */
const signedIn = async (login, place) => {
  const context = await browser.createBrowserContext();
  await context.overridePermissions(APP, ['geolocation']);
  const page = await mobilePage(context);
  await page.setGeolocation({ ...place, accuracy: 10 });
  await page.goto(`${APP}/profile`, { waitUntil: 'load' });
  await keycloakLogin(page, login);
  await page.waitForSelector('.profile-card', { timeout: 60000 });
  return page;
};

/** Brings the check-in into view, below the details of the plan */
const showCheckIn = (page) =>
  page.evaluate(() => document.querySelector('.check-in')?.scrollIntoView({ block: 'center' }));

try {
  // Ana publishes at the courts and then walks away from them
  const ana = await signedIn(organizer, COURTS);
  await ana.goto(`${APP}/plans/new`, { waitUntil: 'load' });
  const path = await publishPlan(ana, {
    activity: 'PADEL',
    title: 'Pádel 2 contra 2, falta uno',
    place: 'Pistas de la Albufera',
    time: clockIn(8),
  });
  await ana.setGeolocation({ ...ON_THE_WAY, accuracy: 10 });

  // 1. Lucía joins and, at the courts, says she is there
  const lucia = await signedIn(participant, COURTS);
  await lucia.goto(`${APP}${path}`, { waitUntil: 'load' });
  await click(lucia, '.join-button button');
  await lucia.waitForSelector('.check-in__button', { timeout: 60000 });
  await ana.goto(`${APP}${path}`, { waitUntil: 'load' });
  await ana.waitForSelector('.check-in__nobody', { timeout: 60000 });
  await click(lucia, '.check-in__button button');
  await lucia.waitForSelector('.check-in__done', { timeout: 30000 });
  await showCheckIn(lucia);
  await screenshot(lucia, outDir, prefix, '1-participant', false);

  // 2. Ana gets the notice and sees Lucía in the list; from 400 m away her own check-in is rejected
  await ana.waitForSelector(`.join-notice ::-p-text(${t('notices.arrivalTitle')})`, { timeout: 60000 });
  await ana.waitForSelector('.check-in__person', { timeout: 30000 });
  await click(ana, '.check-in__button button');
  await ana.waitForSelector('.check-in__error', { timeout: 30000 });
  await showCheckIn(ana);
  await pause(300);
  await screenshot(ana, outDir, prefix, '2-organizer', false);
  console.log('Walkthrough completed');
} finally {
  await browser.close();
}
