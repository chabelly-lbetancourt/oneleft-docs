// Walks through HU-040 with two people: Ana publishes a padel plan and Lucía joins it. Lucía says she is running 10
// minutes late; Ana, with the plan open, gets the notice and sees the status of the group. Lucía takes it back at the
// end.
// Usage: ONELEFT_TEST_USER=<Lucía> ONELEFT_TEST_PASSWORD=... ONELEFT_ORGANIZER_USER=<Ana> ONELEFT_ORGANIZER_PASSWORD=...
//   [ONELEFT_LANG=en] node tools/capture-arrivals.mjs <output-dir> [prefix]
import { APP, click, credentials, keycloakLogin, launch, mobilePage, pause, screenshot, t } from './lib/app.mjs';
import { clockIn, publishPlan } from './lib/publish.mjs';

const [outDir = '.', prefix = 'arrivals'] = process.argv.slice(2);
const participant = credentials();
const organizer = { user: process.env.ONELEFT_ORGANIZER_USER, password: process.env.ONELEFT_ORGANIZER_PASSWORD };
if (!organizer.user || !organizer.password) {
  console.error('ONELEFT_ORGANIZER_USER and ONELEFT_ORGANIZER_PASSWORD are required');
  process.exit(1);
}
const browser = await launch();

/** A person in their own browser context, signed in, near the courts of Vallecas. */
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

try {
  const ana = await signedIn(organizer);
  await ana.goto(`${APP}/plans/new`, { waitUntil: 'load' });
  const path = await publishPlan(ana, {
    activity: 'PADEL',
    title: 'Pádel 2 contra 2, falta uno',
    place: 'Pistas de la Albufera',
    time: clockIn(60),
  });

  // 1. Lucía joins and says she is running 10 minutes late
  const lucia = await signedIn(participant);
  await lucia.goto(`${APP}${path}`, { waitUntil: 'load' });
  await click(lucia, '.join-button button');
  await lucia.waitForSelector('.arrivals', { timeout: 120000 });
  await click(lucia, '.late-10 button');
  await lucia.waitForSelector('.arrival', { timeout: 30000 });
  await lucia.evaluate(() => document.querySelector('.arrivals')?.scrollIntoView({ block: 'center' }));
  await screenshot(lucia, outDir, prefix, '1-participant', false);

  // 2. Ana, with the plan open, says she is on the way and gets Lucía's notice
  await ana.goto(`${APP}${path}`, { waitUntil: 'load' });
  await ana.waitForSelector('.arrivals', { timeout: 120000 });
  await click(ana, '.on-the-way button');
  await pause(1000);
  await click(lucia, '.late-15 button');
  await ana.waitForSelector(`.join-notice ::-p-text(${t('notices.arrivalTitle')})`, { timeout: 60000 });
  await ana.waitForSelector('.arrival--late', { timeout: 30000 });
  await pause(500);
  await screenshot(ana, outDir, prefix, '2-organizer', false);

  // The capture leaves no status behind
  await click(lucia, '.clear-arrival button');
  await click(ana, '.clear-arrival button');
  console.log('Walkthrough completed');
} finally {
  await browser.close();
}
