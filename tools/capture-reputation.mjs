// Walks through HU-009 with two people. Ana opens «My reputation»: her score and why it went up or down (the plan of
// before, held with every spot taken, and her own no-show). Then she publishes a plan, and Lucía sees her reputation
// next to her name in the nearby plans and in the detail of the plan.
// Usage: ONELEFT_TEST_USER=<Lucía> ONELEFT_TEST_PASSWORD=... ONELEFT_ORGANIZER_USER=<Ana> ONELEFT_ORGANIZER_PASSWORD=...
//   [ONELEFT_LANG=en] node tools/capture-reputation.mjs <output-dir> [prefix]
import { APP, credentials, keycloakLogin, launch, mobilePage, pause, screenshot } from './lib/app.mjs';
import { clockIn, publishPlan } from './lib/publish.mjs';

const [outDir = '.', prefix = 'reputation'] = process.argv.slice(2);
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
  // 1. Ana's reputation
  const ana = await signedIn(organizer);
  await ana.goto(`${APP}/reputation`, { waitUntil: 'load' });
  await ana.waitForSelector('.ledger .entry', { timeout: 30000 });
  await screenshot(ana, outDir, prefix, '1-mine', false);

  // 2. Ana publishes; Lucía sees her reputation among the nearby plans
  await ana.goto(`${APP}/plans/new`, { waitUntil: 'load' });
  const path = await publishPlan(ana, {
    activity: 'PADEL',
    title: 'Pádel 2 contra 2, falta uno',
    place: 'Pistas de la Albufera',
    time: clockIn(90),
  });
  const lucia = await signedIn(participant);
  await lucia.goto(`${APP}/plans/nearby`, { waitUntil: 'load' });
  await lucia.waitForSelector('.plan-ticket__organizer', { timeout: 30000 });
  await pause(500);
  await screenshot(lucia, outDir, prefix, '2-nearby', false);

  // 3. And next to the organizer in the detail of the plan
  await lucia.goto(`${APP}${path}`, { waitUntil: 'load' });
  await lucia.waitForSelector('.organizer-reputation', { timeout: 30000 });
  await screenshot(lucia, outDir, prefix, '3-detail', false);
  console.log('Walkthrough completed');
} finally {
  await browser.close();
}
