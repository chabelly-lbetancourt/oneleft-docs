// Walks through HU-005 with two people at the same time: the organizer (ONELEFT_ORGANIZER_USER) has the app open on
// the home screen and a second person (ONELEFT_TEST_USER) joins one of the organizer's plans. The organizer gets the
// notice in real time. The plan to join is the organizer's upcoming plan whose title contains ONELEFT_PLAN_TITLE
// (the first one if it is not set).
// Usage: [ONELEFT_LANG=en] node tools/capture-join.mjs <output-dir> [prefix]
import { APP, button, click, credentials, keycloakLogin, launch, mobilePage, pause, screenshot } from './lib/app.mjs';

const [outDir = '.', prefix = 'join'] = process.argv.slice(2);
const joiner = credentials();
const organizer = { user: process.env.ONELEFT_ORGANIZER_USER, password: process.env.ONELEFT_ORGANIZER_PASSWORD };
if (!organizer.user || !organizer.password) {
  console.error('ONELEFT_ORGANIZER_USER and ONELEFT_ORGANIZER_PASSWORD are required');
  process.exit(1);
}

const browser = await launch();
try {
  // Two separate browser contexts: two people, each with their own session
  const organizerContext = await browser.createBrowserContext();
  const joinerContext = await browser.createBrowserContext();
  const organizerPage = await mobilePage(organizerContext);
  const joinerPage = await mobilePage(joinerContext);

  // The organizer signs in and stays on the home screen with their upcoming plans
  await organizerPage.goto(`${APP}/profile`, { waitUntil: 'networkidle0' });
  await keycloakLogin(organizerPage, organizer, 'load');
  // The profile only loads once the app has exchanged the code for the tokens
  await organizerPage.waitForSelector('.profile-card', { timeout: 20000 });
  await organizerPage.goto(APP, { waitUntil: 'load' });
  await organizerPage.waitForSelector('.my-plan', { timeout: 20000 });
  const planPath = await organizerPage.$$eval(
    '.my-plan',
    (links, title) => (links.find((link) => link.textContent.includes(title)) ?? links[0]).getAttribute('href'),
    process.env.ONELEFT_PLAN_TITLE ?? '',
  );

  // 1. The other person opens the plan: free spots and the "I'm in" button
  await joinerPage.goto(`${APP}${planPath}`, { waitUntil: 'networkidle0' });
  await keycloakLogin(joinerPage, joiner, 'load');
  await joinerPage.waitForSelector('.join-button', { timeout: 20000 });
  await pause(500);
  await screenshot(joinerPage, outDir, prefix, '1-before');

  // 2. They join: they are in and appear among the participants
  await click(joinerPage, '.join-button button');
  await joinerPage.waitForSelector('.joined-message', { timeout: 15000 });
  await pause(500);
  await screenshot(joinerPage, outDir, prefix, '2-joined');

  // 3. The organizer gets the notice in real time, without reloading
  await organizerPage.waitForSelector('.join-notice', { timeout: 15000 });
  await pause(500);
  await screenshot(organizerPage, outDir, prefix, '3-organizer-notice', false);

  // 4. Tapping the notice opens the plan with the new participant
  await click(organizerPage, '.join-notice');
  await organizerPage.waitForSelector('.participant', { timeout: 15000 });
  await pause(500);
  await screenshot(organizerPage, outDir, prefix, '4-organizer-plan');
  console.log('Walkthrough completed');
} finally {
  await browser.close();
}
