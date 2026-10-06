// Walks through HU-007: the organizer publishes a plan that starts in 31 minutes and another one in 6 minutes, gets
// the "your plan starts soon" notice of the first one within a couple of minutes and, once the second one has
// started, sees it "in progress" without the join, leave or waiting list buttons. Takes about 8 minutes.
// Usage: ONELEFT_TEST_USER=... ONELEFT_TEST_PASSWORD=... [ONELEFT_LANG=en] node tools/capture-reminder.mjs <output-dir> [prefix]
import { APP, credentials, keycloakLogin, launch, mobilePage, pause, screenshot, t } from './lib/app.mjs';
import { clockIn, publishPlan } from './lib/publish.mjs';

const [outDir = '.', prefix = 'reminder'] = process.argv.slice(2);
const login = credentials();
const browser = await launch();

try {
  await browser.defaultBrowserContext().overridePermissions(APP, ['geolocation']);
  const page = await mobilePage(browser);
  await page.setGeolocation({ latitude: 40.391234, longitude: -3.628765, accuracy: 10 });

  await page.goto(`${APP}/plans/new`, { waitUntil: 'load' });
  await keycloakLogin(page, login);
  const started = await publishPlan(page, {
    activity: 'PADEL',
    title: 'Pádel, partido rápido',
    place: 'Polideportivo de Vallecas',
    time: clockIn(6),
  });
  await page.goto(`${APP}/plans/new`, { waitUntil: 'load' });
  await publishPlan(page, {
    activity: 'PADEL',
    title: 'Pádel 2 contra 2',
    place: 'Pistas de la Albufera',
    time: clockIn(31),
  });

  // 1. The reminder arrives in real time on the home screen (the plans service checks every minute)
  await page.goto(APP, { waitUntil: 'load' });
  await page.waitForSelector(`.join-notice ::-p-text(${t('notices.reminderTitle')})`, { timeout: 180000 });
  await pause(500);
  await screenshot(page, outDir, prefix, '1-notice', false);

  // 2. The first plan has started: its detail shows the state and no longer offers to join
  const startsAt = Date.now() + 7 * 60_000;
  while (Date.now() < startsAt) {
    await pause(15000);
  }
  await page.goto(`${APP}${started}`, { waitUntil: 'load' });
  await page.waitForSelector('.ended-hint', { timeout: 120000 });
  await screenshot(page, outDir, prefix, '2-in-progress');
  console.log('Walkthrough completed');
} finally {
  await browser.close();
}
