// Walks through HU-047 with two people. Lucía opens the page of Ana, whose profile is private, and asks to follow her;
// Ana sees the request in «My network» next to the one of Marta (demo data) and accepts it; Lucía now follows her. At
// the end Lucía stops following Ana, so the walkthrough leaves no data behind.
// Usage: ONELEFT_TEST_USER=<Lucía> ONELEFT_TEST_PASSWORD=... ONELEFT_ORGANIZER_USER=<Ana> ONELEFT_ORGANIZER_PASSWORD=...
//   [ONELEFT_LANG=en] node tools/capture-social.mjs <output-dir> [prefix]
import { APP, click, credentials, keycloakLogin, launch, mobilePage, pause, screenshot } from './lib/app.mjs';

const [outDir = '.', prefix = 'social'] = process.argv.slice(2);
const participant = credentials();
const organizer = { user: process.env.ONELEFT_ORGANIZER_USER, password: process.env.ONELEFT_ORGANIZER_PASSWORD };
if (!organizer.user || !organizer.password) {
  console.error('ONELEFT_ORGANIZER_USER and ONELEFT_ORGANIZER_PASSWORD are required');
  process.exit(1);
}
/** Ana Pruebas: fixed id of the development realm */
const ANA = 'a624d063-bd1e-442d-b52d-8de2df356c13';
const browser = await launch();

/** A person in their own browser context, signed in. */
const signedIn = async (login) => {
  const context = await browser.createBrowserContext();
  const page = await mobilePage(context);
  await page.goto(`${APP}/profile`, { waitUntil: 'load' });
  await keycloakLogin(page, login);
  await page.waitForSelector('.profile-card', { timeout: 60000 });
  return page;
};

try {
  // 1. Lucía asks to follow Ana
  const lucia = await signedIn(participant);
  await lucia.goto(`${APP}/people/${ANA}`, { waitUntil: 'load' });
  await lucia.waitForSelector('.follow-button', { timeout: 30000 });
  await pause(600);
  await click(lucia, '.follow-button button');
  await lucia.waitForSelector('.requested-message', { timeout: 30000 });
  await screenshot(lucia, outDir, prefix, '1-request', false);

  // 2. Ana sees the requests in «My network»
  const ana = await signedIn(organizer);
  await ana.goto(`${APP}/network`, { waitUntil: 'load' });
  await ana.waitForSelector('.connections--followers', { timeout: 30000 });
  await pause(600);
  await click(ana, '.requests-tab');
  await ana.waitForSelector('.connections--requests .accept-request', { timeout: 30000 });
  await screenshot(ana, outDir, prefix, '2-requests', false);

  // 3. Ana accepts Lucía, who now follows her
  const accept = await ana.waitForSelector('.connections--requests .connection:first-child .accept-request button');
  await accept.click();
  await pause(800);
  await lucia.reload({ waitUntil: 'load' });
  await lucia.waitForSelector('.following-message', { timeout: 30000 });
  await screenshot(lucia, outDir, prefix, '3-following', false);

  // The walkthrough leaves no follow behind
  await click(lucia, '.unfollow-button button');
  await lucia.waitForSelector('.follow-button', { timeout: 30000 });
  console.log('Walkthrough completed');
} finally {
  await browser.close();
}
