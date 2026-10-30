// Walks through HU-010 with Lucía: she writes a plan in one sentence in «Publish a plan», the form is filled in from the
// draft and she still has to publish it. The service that understands the sentence needs a paid key, so its answer is
// made up in the browser (like in the E2E tests): nothing is sent to Anthropic, published or created.
// Usage: ONELEFT_TEST_USER=<Lucía> ONELEFT_TEST_PASSWORD=... [ONELEFT_LANG=en] node tools/capture-draft.mjs <output-dir> [prefix]
import { APP, credentials, keycloakLogin, launch, mobilePage, pause, screenshot } from './lib/app.mjs';

const [outDir = '.', prefix = 'draft'] = process.argv.slice(2);
const SENTENCE = 'Pádel hoy a las 7 en las pistas de la Albufera, falta uno';
const startsAt = new Date(Date.now() + 2 * 60 * 60_000);
const draft = {
  activity: 'PADEL',
  title: 'Pádel 2 contra 2, falta uno',
  description: null,
  place: 'las pistas de la Albufera',
  meetingPoint: { name: 'Pistas de pádel de la Albufera', latitude: 40.3964, longitude: -3.6297 },
  startsAt: startsAt.toISOString(),
  spots: 1,
  level: 'INTERMEDIATE',
  minParticipants: null,
  missing: [],
  warnings: [],
};
const CORS = {
  'access-control-allow-origin': new URL(APP).origin,
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
};

const browser = await launch();
try {
  const context = await browser.createBrowserContext();
  // The place is looked up near the device: Vallecas, Madrid
  await context.overridePermissions(APP, ['geolocation']);
  const page = await mobilePage(context);
  await page.setGeolocation({ latitude: 40.3912, longitude: -3.6287, accuracy: 10 });
  await page.goto(`${APP}/plans/new`, { waitUntil: 'load' });
  await keycloakLogin(page, credentials());
  await page.waitForSelector('.plan-draft', { timeout: 60000 });
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (!new URL(request.url()).pathname.endsWith('/api/v1/plans/draft')) {
      return request.continue();
    }
    if (request.method() === 'OPTIONS') {
      return request.respond({ status: 204, headers: CORS });
    }
    return request.respond({
      status: 200,
      contentType: 'application/json',
      headers: CORS,
      body: JSON.stringify(draft),
    });
  });

  // 1. The card with the sentence written
  await page.type('#draft-text', SENTENCE);
  await pause(300);
  await screenshot(page, outDir, prefix, '1-sentence', false);

  // 2. The form filled in from the draft, to review before publishing
  await page.click('.plan-draft__submit button');
  await page.waitForSelector('.plan-draft__message', { timeout: 15000 });
  await pause(600);
  await screenshot(page, outDir, prefix, '2-draft', false);
  await page.$eval('#title', (element) => element.scrollIntoView({ block: 'start' }));
  await pause(400);
  await screenshot(page, outDir, prefix, '3-form', false);
  console.log('Walkthrough completed');
} finally {
  await browser.close();
}
