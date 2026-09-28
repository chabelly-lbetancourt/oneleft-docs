// Walks through HU-004 in the app: nearby plans as a list and on the map, and a new plan arriving in real time.
// The user signs in with ONELEFT_TEST_USER; a second user (ONELEFT_PUBLISHER_USER) publishes the new plan through
// the API with the confidential test client of the development realm (ONELEFT_API_CLIENT_SECRET).
// Usage: [ONELEFT_LANG=en] node tools/capture-nearby.mjs <output-dir> [prefix]
import { APP, click, credentials, keycloakLogin, launch, mobilePage, pause, screenshot, t } from './lib/app.mjs';

const [outDir = '.', prefix = 'nearby'] = process.argv.slice(2);
const login = credentials();
const API = process.env.ONELEFT_API_URL ?? 'http://localhost:8080';
const KEYCLOAK = process.env.ONELEFT_KEYCLOAK_URL ?? 'http://localhost:8180/realms/oneleft';
const { ONELEFT_PUBLISHER_USER, ONELEFT_PUBLISHER_PASSWORD, ONELEFT_API_CLIENT_SECRET } = process.env;
const POSITION = { latitude: 40.391234, longitude: -3.628765, accuracy: 10 };

const publisherToken = async () => {
  const response = await fetch(`${KEYCLOAK}/protocol/openid-connect/token`, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: 'oneleft-api',
      client_secret: ONELEFT_API_CLIENT_SECRET,
      username: ONELEFT_PUBLISHER_USER,
      password: ONELEFT_PUBLISHER_PASSWORD,
    }),
  });
  return (await response.json()).access_token;
};

const publishNearbyPlan = async () => {
  const response = await fetch(`${API}/api/v1/plans`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await publisherToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      activity: 'PADEL',
      title: t('publish.planTitlePlaceholder'),
      meetingPoint: { name: 'Pistas de la Albufera', latitude: 40.3964, longitude: -3.6297 },
      startsAt: new Date(Date.now() + 70 * 60_000).toISOString(),
      spots: 2,
    }),
  });
  if (response.status !== 201) {
    throw new Error(`Publishing failed: HTTP ${response.status}`);
  }
};

const browser = await launch();
const shot = (page, name, fullPage = true) => screenshot(page, outDir, prefix, name, fullPage);

try {
  await browser.defaultBrowserContext().overridePermissions(APP, ['geolocation']);
  const page = await mobilePage(browser);
  await page.setGeolocation(POSITION);

  await page.goto(`${APP}/plans/nearby`, { waitUntil: 'networkidle0' });
  await keycloakLogin(page, login, 'load');

  // 1. List with the default filters (5 km, next 12 hours, all activities)
  await page.waitForSelector('.nearby-card', { timeout: 20000 });
  await pause(800);
  await shot(page, '1-list');

  // 2. Map with the search area and the plans (OpenStreetMap tiles)
  await click(page, `.view-switch p-togglebutton[aria-label="${t('nearby.map')}"]`);
  await page.waitForSelector('.leaflet-marker-pane, path.leaflet-interactive', { timeout: 15000 });
  await pause(2500);
  await shot(page, '2-map', false);

  // 3. Filters: 3 km and only padel
  await click(page, `.view-switch p-togglebutton[aria-label="${t('nearby.list')}"]`);
  await click(page, `.radius-filter p-togglebutton[aria-label="3 km"]`);
  await click(page, '.activity-filter');
  await click(page, `li[role="option"][aria-label="${t('activities.PADEL')}"]`);
  await click(page, 'h1'); // closes the dropdown
  await pause(800);
  await shot(page, '3-filters');

  // 4. Someone publishes a padel plan 600 m away: it arrives in real time and the list reloads
  await publishNearbyPlan();
  await page.waitForSelector('.new-plan-message', { timeout: 15000 });
  await pause(800);
  await shot(page, '4-real-time', false);
  console.log('Walkthrough completed');
} finally {
  await browser.close();
}
