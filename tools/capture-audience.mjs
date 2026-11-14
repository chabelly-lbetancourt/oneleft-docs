// Walks through HU-070 and HU-069 with Lucía: date of birth and gender in the profile, who the plan is for when publishing,
// a plan that does not fit her, and the tray of the organizer with the age band and the level of who asks. The plans and
// demographics services are answered in the browser (like in the E2E tests): nothing is created and no date of birth is
// kept.
// Usage: ONELEFT_TEST_USER=<Lucía> ONELEFT_TEST_PASSWORD=... [ONELEFT_LANG=en] node tools/capture-audience.mjs <output-dir> [prefix]
import { APP, click, credentials, keycloakLogin, launch, mobilePage, pause, screenshot as capture } from './lib/app.mjs';

/** A build without the PrimeUI licence key shows a notice that is not part of the app: removed before capturing. */
const screenshot = async (page, ...rest) => {
  await page.evaluate(() => document.getElementById('p-license-host')?.remove());
  return capture(page, ...rest);
};

const [outDir = '.', prefix = 'audience'] = process.argv.slice(2);
const API = 'http://localhost:8080';
const CORS = {
  'access-control-allow-origin': new URL(APP).origin,
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
};
const PLAN_ID = '8d2b6e41-0c53-4a97-b1f8-3e5a7c9d2b64';
const YEARS = (n) => `${new Date().getFullYear() - n}-01-01`;
const BAND = { from: 25, to: 34, label: '25–34' };

const fakePlan = (organizerId, extra = {}) => ({
  id: PLAN_ID,
  organizerId,
  organizerName: 'Marta',
  activity: 'YOGA',
  activityOther: null,
  title: 'Yoga al aire libre',
  description: null,
  meetingPoint: { name: 'Estudio de yoga', latitude: 40.3912, longitude: -3.6287 },
  startsAt: new Date(Date.now() + 70 * 60_000).toISOString(),
  endsAt: new Date(Date.now() + 250 * 60_000).toISOString(),
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
  requiresApproval: false,
  myRequest: null,
  ...extra,
});

const browser = await launch();
try {
  const context = await browser.createBrowserContext();
  await context.overridePermissions(APP, ['geolocation']);
  const page = await mobilePage(context);
  await page.setGeolocation({ latitude: 40.3912, longitude: -3.6287, accuracy: 10 });
  // What the browser answers instead of the services; everything else goes to the real ones
  const mocks = new Map();
  let myId = null;
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    const mock = request.url().startsWith(API) ? mocks.get(path) : undefined;
    if (!mock) {
      return request.continue();
    }
    if (request.method() === 'OPTIONS') {
      return request.respond({ status: 204, headers: CORS });
    }
    const { status = 200, body } = mock(request);
    return request.respond({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });
  });
  page.on('response', async (response) => {
    if (response.url() === `${API}/api/v1/users/me` && response.ok()) {
      myId = (await response.json().catch(() => ({}))).id ?? myId;
    }
  });

  // 1. Date of birth and gender in the profile (nothing set yet)
  let stored = null;
  mocks.set('/api/v1/users/me/demographics', (request) => {
    if (request.method() === 'PUT') {
      stored = { ...JSON.parse(request.postData()), ageBand: BAND, changesLeft: 2 };
      return { body: stored };
    }
    return stored ? { body: stored } : { status: 404, body: {} };
  });
  await page.goto(`${APP}/profile`, { waitUntil: 'load' });
  await keycloakLogin(page, credentials());
  await page.waitForSelector('.demographics', { timeout: 90000 });
  await page.$eval('.demographics', (element) => element.scrollIntoView());
  await page.type('#birth-date', '01011995');
  await click(page, '#gender');
  await click(page, '[role="option"]');
  await pause(300);
  await screenshot(page, outDir, prefix, '1-profile', false);
  await click(page, '.demographics__save button');
  await page.waitForSelector('.demographics__done', { timeout: 30000 });
  await pause(300);
  await screenshot(page, outDir, prefix, '2-profile-saved', false);

  // 2. Who the plan is for, when publishing
  await page.goto(`${APP}/plans/new`, { waitUntil: 'load' });
  await page.waitForSelector('.audience-section', { timeout: 60000 });
  await click(page, '.audience-section p-selectbutton [aria-label]:nth-of-type(2)').catch(() => {});
  await page.$eval('.audience-section', (element) => element.scrollIntoView({ block: 'center' }));
  await page.type('#minAge', '25');
  await page.type('#maxAge', '40');
  await pause(400);
  await screenshot(page, outDir, prefix, '3-publish', false);

  // 3. A plan for women of 25 to 40 offered to someone who fits, and to someone who does not
  mocks.set(`/api/v1/plans/${PLAN_ID}`, () => ({
    body: fakePlan('c0ffee00-0000-4000-8000-000000000001', { audience: { gender: 'WOMAN', minAge: 25, maxAge: 40 } }),
  }));
  await page.goto(`${APP}/plans/${PLAN_ID}`, { waitUntil: 'load' });
  await page.waitForSelector('.join-button', { timeout: 60000 }).catch(async (error) => {
    await page.screenshot({ path: `${outDir}/${prefix}-failed.png` });
    throw error;
  });
  await screenshot(page, outDir, prefix, '4-plan-fits', false);
  stored = { ...stored, gender: 'MAN' };
  await page.goto(`${APP}/plans/${PLAN_ID}`, { waitUntil: 'load' });
  await page.waitForSelector('.audience-mismatch', { timeout: 60000 });
  await screenshot(page, outDir, prefix, '5-plan-does-not-fit', false);

  // 4. The tray of the organizer (HU-069) with the age band and the level of who asks
  const asked = (userId, name, message, ageBand, level) => ({
    userId, name, message, status: 'PENDING', requestedAt: new Date().toISOString(), decidedAt: null, ageBand, level,
  });
  mocks.set(`/api/v1/plans/${PLAN_ID}`, () => ({
    body: fakePlan(myId, { requiresApproval: true, audience: { gender: 'ALL', minAge: null, maxAge: null } }),
  }));
  mocks.set(`/api/v1/plans/${PLAN_ID}/requests`, () => ({
    body: [
      asked('a1', 'Carmen', '¡Me encantaría!', '25–34', 'INTERMEDIATE'),
      asked('a2', 'Diego', null, '35–44', 'BEGINNER'),
      asked('a3', 'Sara', 'Voy con mi esterilla', null, null),
    ],
  }));
  await page.goto(`${APP}/plans/${PLAN_ID}`, { waitUntil: 'load' });
  await page.waitForSelector('.join-requests__item', { timeout: 60000 });
  await page.$eval('.join-requests__list', (element) => element.scrollIntoView({ block: 'center' }));
  await pause(400);
  await screenshot(page, outDir, prefix, '6-tray', false);
  console.log('Walkthrough completed');
} finally {
  await browser.close();
}
