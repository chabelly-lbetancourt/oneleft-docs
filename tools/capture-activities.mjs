// Walks through HU-068 with Lucía: the selector of «Publish a plan» grouped by category, the name asked for when the
// activity is «other», and the filter of nearby plans by category. The plans service is answered in the browser (like in
// the E2E tests): nothing is published or created.
// Usage: ONELEFT_TEST_USER=<Lucía> ONELEFT_TEST_PASSWORD=... [ONELEFT_LANG=en] node tools/capture-activities.mjs <output-dir> [prefix]
import { APP, click, credentials, keycloakLogin, launch, mobilePage, pause, screenshot, t } from './lib/app.mjs';

const [outDir = '.', prefix = 'activities'] = process.argv.slice(2);
const CORS = {
  'access-control-allow-origin': new URL(APP).origin,
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
};
const plan = (activity, title, minutes) => ({
  id: crypto.randomUUID(),
  organizerId: '9e51a057-ce42-4177-b020-ac2fc7ec6ffa',
  organizerName: 'Marta',
  activity,
  activityOther: null,
  title,
  description: null,
  meetingPoint: { name: 'Estudio de yoga', latitude: 40.3912, longitude: -3.6287 },
  startsAt: new Date(Date.now() + minutes * 60_000).toISOString(),
  endsAt: new Date(Date.now() + (minutes + 120) * 60_000).toISOString(),
  spots: 3,
  occupied: 1,
  freeSpots: 2,
  level: null,
  status: 'OPEN',
  publishedAt: new Date().toISOString(),
  participants: [],
  waitlist: [],
  minimum: null,
  arrivals: [],
});
const SPORT = [plan('YOGA', 'Yoga al aire libre', 60), plan('VOLLEYBALL', 'Vóley en la playa', 90)];

const browser = await launch();
try {
  const context = await browser.createBrowserContext();
  await context.overridePermissions(APP, ['geolocation']);
  const page = await mobilePage(context);
  await page.setGeolocation({ latitude: 40.3912, longitude: -3.6287, accuracy: 10 });
  await page.goto(`${APP}/plans/new`, { waitUntil: 'load' });
  await keycloakLogin(page, credentials());
  await page.waitForSelector('.publish-form', { timeout: 90000 }).catch(async (error) => {
    console.error(`The publish form did not appear at ${page.url()}`);
    await page.screenshot({ path: `${outDir}/${prefix}-failed.png` });
    throw error;
  });

  // 1. The selector, grouped by category
  await click(page, 'p-select');
  await page.waitForSelector('[role="listbox"]', { timeout: 15000 });
  await pause(500);
  await screenshot(page, outDir, prefix, '1-selector', false);

  // 2. «Other» asks for a name of its own
  const other = await page.$$(`::-p-aria([name="${t('activities.OTHER')}"][role="option"])`);
  await other.at(-1).click();
  await page.waitForSelector('#activityOther', { timeout: 15000 });
  await page.type('#activityOther', 'Taller de cerámica');
  await pause(400);
  await screenshot(page, outDir, prefix, '2-other', false);

  // 3. Nearby plans filtered by the category «Sport»
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (!new URL(request.url()).pathname.endsWith('/api/v1/plans/nearby')) {
      return request.continue();
    }
    if (request.method() === 'OPTIONS') {
      return request.respond({ status: 204, headers: CORS });
    }
    const sport = new URL(request.url()).searchParams.getAll('category').includes('SPORT');
    return request.respond({
      status: 200,
      contentType: 'application/json',
      headers: CORS,
      body: JSON.stringify(sport ? SPORT.map((p, i) => ({ plan: p, distanceMeters: 300 + i * 450 })) : []),
    });
  });
  await page.goto(`${APP}/plans/nearby`, { waitUntil: 'load' });
  await page.waitForSelector('.category-filter', { timeout: 60000 });
  await click(page, `.category-filter p-togglebutton[aria-label="${t('categories.SPORT')}"]`);
  await page.waitForSelector('.nearby-card', { timeout: 30000 });
  await pause(600);
  await screenshot(page, outDir, prefix, '3-filter', false);
  console.log('Walkthrough completed');
} finally {
  await browser.close();
}
