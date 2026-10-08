// Walks through HU-036 with two people: Ana saves an alert for padel near Vallecas (form and list), then Lucía
// publishes a padel plan there and Ana, with the home screen open, gets the notice. Ana's alert is deleted at the end.
// Usage: ONELEFT_TEST_USER=<Ana> ONELEFT_TEST_PASSWORD=... ONELEFT_PUBLISHER_USER=<Lucía> ONELEFT_PUBLISHER_PASSWORD=...
//   [ONELEFT_LANG=en] node tools/capture-alerts.mjs <output-dir> [prefix]
import { APP, click, credentials, keycloakLogin, launch, mobilePage, pause, screenshot, t } from './lib/app.mjs';
import { clockIn, publishPlan } from './lib/publish.mjs';

const [outDir = '.', prefix = 'alerts'] = process.argv.slice(2);
const owner = credentials();
const publisher = { user: process.env.ONELEFT_PUBLISHER_USER, password: process.env.ONELEFT_PUBLISHER_PASSWORD };
if (!publisher.user || !publisher.password) {
  console.error('ONELEFT_PUBLISHER_USER and ONELEFT_PUBLISHER_PASSWORD are required');
  process.exit(1);
}
const name = 'Pádel al salir';
const browser = await launch();

try {
  const ownerContext = await browser.createBrowserContext();
  const publisherContext = await browser.createBrowserContext();
  for (const context of [ownerContext, publisherContext]) {
    await context.overridePermissions(APP, ['geolocation']);
  }
  const page = await mobilePage(ownerContext);
  await page.setGeolocation({ latitude: 40.391234, longitude: -3.628765, accuracy: 10 });

  // 1. Ana saves an alert: intermediate padel, 3 km around her, any day and time (the plan of the capture is now)
  await page.goto(`${APP}/profile`, { waitUntil: 'load' });
  await keycloakLogin(page, owner);
  await page.waitForSelector('.profile-card', { timeout: 30000 });
  await page.goto(`${APP}/notifications/alerts`, { waitUntil: 'load' });
  await page.waitForSelector('.alert-list, .alerts-empty, .alerts-error', { timeout: 30000 });
  await click(page, '.new-alert button');
  await page.locator('#alertName').fill(name);
  await click(page, `button.activity-chip[aria-pressed] ::-p-text(${t('activities.PADEL')})`);
  await click(page, `p-togglebutton[aria-label="${t('levels.INTERMEDIATE')}"]`);
  await click(page, '.use-location button');
  await page.waitForSelector('.zone-coordinates');
  await screenshot(page, outDir, prefix, '1-form');

  // 2. Her list of alerts
  await click(page, '.save-alert button');
  await page.waitForSelector(`.saved-alert ::-p-text(${name})`);
  await screenshot(page, outDir, prefix, '2-list', false);

  // 3. Lucía publishes intermediate padel nearby; Ana, on the home screen, gets the notice
  await page.goto(APP, { waitUntil: 'load' });
  await page.waitForSelector('.home, .my-plan, h1', { timeout: 20000 });
  await pause(1500);
  const other = await mobilePage(publisherContext);
  await other.setGeolocation({ latitude: 40.3964, longitude: -3.6297, accuracy: 10 });
  await other.goto(`${APP}/plans/new`, { waitUntil: 'load' });
  await keycloakLogin(other, publisher);
  await publishPlan(other, {
    activity: 'PADEL',
    title: 'Pádel 2 contra 2, falta uno',
    place: 'Pistas de la Albufera',
    time: clockIn(90),
    before: (form) => click(form, `p-togglebutton[aria-label="${t('levels.INTERMEDIATE')}"]`),
  });
  await page.waitForSelector(`.join-notice ::-p-text(${t('notices.nearbyTitle')})`, { timeout: 60000 });
  await pause(500);
  await screenshot(page, outDir, prefix, '3-notice', false);

  // The capture leaves no alert behind
  await page.goto(`${APP}/notifications/alerts`, { waitUntil: 'load' });
  await page.waitForSelector(`.saved-alert ::-p-text(${name})`);
  await click(page, '.delete-alert button');
  await page.waitForSelector('.alerts-empty');
  console.log('Walkthrough completed');
} finally {
  await browser.close();
}
