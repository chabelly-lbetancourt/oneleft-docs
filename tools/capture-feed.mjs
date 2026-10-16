// Walks through HU-051 and HU-059 with two people. Lucía opens her feed while she follows nobody: it explains how to
// fill it. She asks to follow Ana, whose profile is private, and Ana accepts. With the feed open, Ana joins one of the
// nearby plans and the activity reaches Lucía's feed in real time. Then Ana keeps that plan out of her activity from
// its detail, and it leaves Lucía's feed; Lucía sees in «My network» who sees her own activity. At the end Ana shows
// the plan again and leaves it, and Lucía stops following her, so nothing of the walkthrough stays.
// Usage: ONELEFT_TEST_USER=<Lucía> ONELEFT_TEST_PASSWORD=... ONELEFT_ORGANIZER_USER=<Ana>
//   ONELEFT_ORGANIZER_PASSWORD=... [ONELEFT_LANG=en] node tools/capture-feed.mjs <output-dir> [prefix]
import { APP, click, credentials, keycloakLogin, launch, mobilePage, pause, screenshot } from './lib/app.mjs';

const [outDir = '.', prefix = 'feed'] = process.argv.slice(2);
const lucia = credentials();
const ana = { user: process.env.ONELEFT_ORGANIZER_USER, password: process.env.ONELEFT_ORGANIZER_PASSWORD };
if (!ana.user || !ana.password) {
  console.error('ONELEFT_ORGANIZER_USER and ONELEFT_ORGANIZER_PASSWORD are required');
  process.exit(1);
}
/** Ana Pruebas: fixed id of the development realm */
const ANA = 'a624d063-bd1e-442d-b52d-8de2df356c13';
const browser = await launch();

/** A person in their own browser context, signed in, in Vallecas (where the plans of the demo data are) */
const signedIn = async (login) => {
  const context = await browser.createBrowserContext();
  await context.overridePermissions(APP, ['geolocation']);
  const page = await mobilePage(context);
  await page.setGeolocation({ latitude: 40.3912, longitude: -3.6287, accuracy: 10 });
  await page.goto(`${APP}/profile`, { waitUntil: 'load' });
  await keycloakLogin(page, login);
  await page.waitForSelector('.profile-card', { timeout: 60000 });
  return page;
};

/** Joins the first nearby plan that has a spot for Ana; returns its path */
const joinNearbyPlan = async (page) => {
  await page.goto(`${APP}/plans/nearby`, { waitUntil: 'load' });
  await page.waitForSelector('.nearby-card', { timeout: 30000 });
  const paths = await page.$$eval('.nearby-card', (links) => links.map((link) => link.getAttribute('href')));
  for (const path of paths.slice(0, 6)) {
    await page.goto(`${APP}${path}`, { waitUntil: 'load' });
    const join = await page.waitForSelector('.join-button button', { timeout: 8000 }).catch(() => null);
    if (join) {
      await join.click();
      await page.waitForSelector('.joined-message', { timeout: 15000 });
      return path;
    }
  }
  throw new Error('No nearby plan with a free spot for Ana');
};

let anaPage;
let luciaPage;
let joinedPath = null;
let hidden = false;
try {
  // 1. Lucía follows nobody yet: her feed explains how to fill it
  luciaPage = await signedIn(lucia);
  await luciaPage.goto(`${APP}/feed`, { waitUntil: 'load' });
  await luciaPage.waitForSelector('.feed-empty', { timeout: 30000 });
  await pause(800);
  await screenshot(luciaPage, outDir, prefix, '1-empty', false);

  // 2. Lucía asks to follow Ana and Ana accepts
  anaPage = await signedIn(ana);
  await luciaPage.goto(`${APP}/people/${ANA}`, { waitUntil: 'load' });
  await click(luciaPage, '.follow-button button');
  await luciaPage.waitForSelector('.requested-message', { timeout: 30000 });
  await anaPage.goto(`${APP}/network`, { waitUntil: 'load' });
  await anaPage.waitForSelector('.connections--followers', { timeout: 30000 });
  await pause(600);
  await click(anaPage, '.requests-tab');
  const accept = await anaPage.waitForSelector(
    '.connections--requests .connection:first-child .accept-request button',
    { timeout: 30000 },
  );
  await accept.click();
  await pause(800);

  // 3. With her feed open, Ana joins a plan: the activity arrives in real time
  await luciaPage.goto(`${APP}/feed`, { waitUntil: 'load' });
  await luciaPage.waitForSelector('.feed-empty', { timeout: 30000 });
  await pause(1500);
  joinedPath = await joinNearbyPlan(anaPage);
  await luciaPage.waitForSelector('.feed-item--fresh', { timeout: 30000 });
  await pause(1200);
  await screenshot(luciaPage, outDir, prefix, '2-live', false);

  // 4. The entry of the home page
  await luciaPage.goto(APP, { waitUntil: 'load' });
  await luciaPage.waitForSelector('.feed-entry', { timeout: 30000 });
  await pause(1200);
  await screenshot(luciaPage, outDir, prefix, '3-home', false);

  // 5. Ana keeps the plan out of her activity, from its detail: it leaves Lucía's feed
  await anaPage.goto(`${APP}${joinedPath}`, { waitUntil: 'load' });
  await anaPage.waitForSelector('app-activity-visibility input:not([disabled])', { timeout: 30000 });
  await click(anaPage, 'app-activity-visibility label');
  await anaPage.waitForFunction(
    () => document.querySelector('app-activity-visibility input')?.checked === false,
    { timeout: 15000 },
  );
  hidden = true;
  await anaPage.evaluate(() =>
    document.querySelector('app-activity-visibility')?.scrollIntoView({ block: 'center' }),
  );
  await pause(800);
  await screenshot(anaPage, outDir, prefix, '4-hidden-plan', false);
  // After a full load the app renews its token first: on a busy machine that can take a while
  await luciaPage.goto(`${APP}/feed`, { waitUntil: 'load' });
  await luciaPage.waitForSelector('.feed-empty', { timeout: 60000 });

  // 6. Who sees Lucía's own activity, in «My network»: her followers, by default
  await luciaPage.goto(`${APP}/network`, { waitUntil: 'load' });
  await luciaPage.waitForSelector('.audience-card', { timeout: 60000 });
  await pause(1200);
  await screenshot(luciaPage, outDir, prefix, '5-network', false);
  console.log('Walkthrough completed');
} finally {
  // Nothing of the walkthrough stays: Ana leaves the plan and Lucía no longer follows her
  try {
    if (anaPage && joinedPath) {
      await anaPage.goto(`${APP}${joinedPath}`, { waitUntil: 'load' });
      if (hidden) {
        await anaPage.waitForSelector('app-activity-visibility input:not([disabled])', { timeout: 30000 });
        await click(anaPage, 'app-activity-visibility label');
        await anaPage.waitForFunction(
          () => document.querySelector('app-activity-visibility input')?.checked === true,
          { timeout: 15000 },
        );
      }
      await click(anaPage, '.leave-button button');
      await click(anaPage, '.leave-yes button');
      await anaPage.waitForSelector('.join-button', { timeout: 30000 });
    }
    if (luciaPage) {
      await luciaPage.goto(`${APP}/people/${ANA}`, { waitUntil: 'load' });
      const button = await luciaPage.waitForSelector('.follow-button, .unfollow-button, .cancel-request', {
        timeout: 60000,
      });
      // Already not following (the walkthrough stopped before): nothing to undo
      if (!(await button.evaluate((element) => element.classList.contains('follow-button')))) {
        await click(luciaPage, '.unfollow-button button, .cancel-request button');
        await luciaPage.waitForSelector('.follow-button', { timeout: 30000 });
      }
    }
  } catch (error) {
    console.error('Could not undo the walkthrough:', error.message);
  }
  await browser.close();
}
