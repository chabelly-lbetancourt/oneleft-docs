// Walks through HU-027: the organizer publishes a plan and adds it to the calendar from its detail; the downloaded
// iCalendar file is saved next to the screenshot.
// Usage: ONELEFT_TEST_USER=... ONELEFT_TEST_PASSWORD=... [ONELEFT_LANG=en] node tools/capture-calendar.mjs <output-dir> [prefix]
import { readdirSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';
import { APP, credentials, keycloakLogin, launch, mobilePage, pause, screenshot } from './lib/app.mjs';
import { clockIn, publishPlan } from './lib/publish.mjs';

const [outDir = '.', prefix = 'calendar'] = process.argv.slice(2);
const login = credentials();
const browser = await launch();

try {
  await browser.defaultBrowserContext().overridePermissions(APP, ['geolocation']);
  const page = await mobilePage(browser);
  await page.setGeolocation({ latitude: 40.391234, longitude: -3.628765, accuracy: 10 });
  const downloads = resolve(outDir);
  const cdp = await page.createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads });

  await page.goto(`${APP}/plans/new`, { waitUntil: 'load' });
  await keycloakLogin(page, login);
  await publishPlan(page, {
    activity: 'PADEL',
    title: 'Pádel 2 contra 2',
    place: 'Pistas de la Albufera',
    time: clockIn(90),
  });

  // 1. The detail of my plan, with "Add to calendar" under the participants
  await page.waitForSelector('.calendar-button', { timeout: 15000 });
  await screenshot(page, outDir, prefix, '1-detail');

  // 2. The button downloads the .ics of the plan
  await page.locator('.calendar-button button').click();
  let file;
  for (let i = 0; i < 20 && !file; i++) {
    await pause(250);
    file = readdirSync(downloads).find((name) => name.endsWith('.ics'));
  }
  if (!file) {
    throw new Error('The .ics file was not downloaded');
  }
  renameSync(`${downloads}/${file}`, `${downloads}/${prefix}-2-plan.ics`);
  console.log('Walkthrough completed');
} finally {
  await browser.close();
}
