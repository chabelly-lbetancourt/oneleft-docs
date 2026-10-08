// Walks through HU-035 with two people: Lucía says «I'm free now» on the home screen (choosing and on), and Ana
// publishes a padel plan nearby and sees, in its detail, that someone is free around (without names or places).
// Lucía turns free mode off at the end.
// Usage: ONELEFT_TEST_USER=<Lucía> ONELEFT_TEST_PASSWORD=... ONELEFT_ORGANIZER_USER=<Ana> ONELEFT_ORGANIZER_PASSWORD=...
//   [ONELEFT_LANG=en] node tools/capture-free-now.mjs <output-dir> [prefix]
import { APP, click, credentials, keycloakLogin, launch, mobilePage, pause, screenshot } from './lib/app.mjs';
import { clockIn, publishPlan } from './lib/publish.mjs';

const [outDir = '.', prefix = 'free'] = process.argv.slice(2);
const free = credentials();
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
  await page.waitForSelector('.profile-card', { timeout: 30000 });
  return page;
};

try {
  // 1-2. Lucía is free for 2 hours
  const lucia = await signedIn(free);
  await lucia.goto(APP, { waitUntil: 'load' });
  const card = await lucia.waitForSelector('.start-free, .free-now--on', { timeout: 30000 });
  if (await card.evaluate((element) => element.matches('.free-now--on'))) {
    // Still free from an earlier run: start from the beginning
    await click(lucia, '.stop-free button');
  }
  await click(lucia, '.start-free button');
  await lucia.evaluate(() => document.querySelector('.free-now')?.scrollIntoView({ block: 'center' }));
  await screenshot(lucia, outDir, prefix, '1-choose', false);
  await click(lucia, '.confirm-free button');
  await lucia.waitForSelector('.free-now--on', { timeout: 60000 });
  await lucia.evaluate(() => document.querySelector('.free-now')?.scrollIntoView({ block: 'center' }));
  await screenshot(lucia, outDir, prefix, '2-on', false);

  // 3. Ana publishes padel nearby and sees someone free around
  const ana = await signedIn(organizer);
  await ana.goto(`${APP}/plans/new`, { waitUntil: 'load' });
  await publishPlan(ana, {
    activity: 'PADEL',
    title: 'Pádel 2 contra 2, falta uno',
    place: 'Pistas de la Albufera',
    time: clockIn(75),
  });
  await ana.waitForSelector('.free-people', { timeout: 20000 });
  await ana.evaluate(() => document.querySelector('.free-people')?.scrollIntoView({ block: 'center' }));
  await pause(500);
  await screenshot(ana, outDir, prefix, '3-organizer', false);

  // The capture leaves no free mode behind
  await lucia.goto(APP, { waitUntil: 'load' });
  await click(lucia, '.stop-free button');
  await lucia.waitForSelector('.start-free');
  console.log('Walkthrough completed');
} finally {
  await browser.close();
}
