// Walks through HU-044 with two people. Ana opens «My reputation» with her badges (the first plan organized, earned;
// the others with how far she is). Lucía opens the page of Ana and sees the badge. Then Lucía keeps «My reputation»
// open until she earns a badge herself and the notice arrives: the walkthrough waits for it (up to 3 minutes), so the
// badge has to be earned meanwhile, for example with a plan of Lucía that Ana arrives at.
// Usage: ONELEFT_TEST_USER=<Lucía> ONELEFT_TEST_PASSWORD=... ONELEFT_ORGANIZER_USER=<Ana> ONELEFT_ORGANIZER_PASSWORD=...
//   [ONELEFT_LANG=en] node tools/capture-badges.mjs <output-dir> [prefix]
import { APP, credentials, keycloakLogin, launch, mobilePage, pause, screenshot, t } from './lib/app.mjs';

const [outDir = '.', prefix = 'badges'] = process.argv.slice(2);
const participant = credentials();
const organizer = { user: process.env.ONELEFT_ORGANIZER_USER, password: process.env.ONELEFT_ORGANIZER_PASSWORD };
if (!organizer.user || !organizer.password) {
  console.error('ONELEFT_ORGANIZER_USER and ONELEFT_ORGANIZER_PASSWORD are required');
  process.exit(1);
}
/** Ana Pruebas: fixed id of the development realm */
const ANA = 'a624d063-bd1e-442d-b52d-8de2df356c13';
const browser = await launch();

const signedIn = async (login) => {
  const page = await mobilePage(await browser.createBrowserContext());
  await page.goto(`${APP}/profile`, { waitUntil: 'load' });
  await keycloakLogin(page, login);
  await page.waitForSelector('.profile-card', { timeout: 60000 });
  return page;
};

try {
  // 1. Ana's badges
  const ana = await signedIn(organizer);
  await ana.goto(`${APP}/reputation`, { waitUntil: 'load' });
  await ana.waitForSelector('.badges-section .badge', { timeout: 30000 });
  // The fixed header would cover the title of the section
  await ana.evaluate(() => {
    document.querySelector('.badges-section')?.scrollIntoView({ block: 'start' });
    window.scrollBy(0, -80);
  });
  await pause(500);
  await screenshot(ana, outDir, prefix, '1-mine', false);

  // 2. Lucía sees Ana's badge on her page
  const lucia = await signedIn(participant);
  await lucia.goto(`${APP}/people/${ANA}`, { waitUntil: 'load' });
  await lucia.waitForSelector('.person-badges .badge', { timeout: 30000 });
  await screenshot(lucia, outDir, prefix, '2-person', false);

  // 3. Lucía earns a badge with the app open: the notice arrives in real time
  await lucia.goto(`${APP}/reputation`, { waitUntil: 'load' });
  console.log('Waiting for a badge of Lucía...');
  // Only the notice of the badge: other notices (a check-in, a join) may arrive meanwhile
  await lucia.waitForFunction(
    (title) => [...document.querySelectorAll('.join-notice')].some((notice) => notice.textContent.includes(title)),
    { timeout: 180000 },
    t('notices.badgeTitle'),
  );
  await pause(800);
  await screenshot(lucia, outDir, prefix, '3-notice', false);
  console.log('Walkthrough completed');
} finally {
  await browser.close();
}
