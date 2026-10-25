// Walks through HU-033 with Lucía: the profile of Ana with «Bloquear» and «Reportar», the question before blocking,
// Ana blocked, the people Lucía blocked (from the avatar menu), and the form to report a plan of Ana, filled in but
// not sent. What it changes is undone: Ana is unblocked from the list, and no report is sent.
// Usage: ONELEFT_TEST_USER=<Lucía> ONELEFT_TEST_PASSWORD=... ONELEFT_PERSON_ID=<Ana> ONELEFT_PLAN_ID=<a plan of Ana>
//   [ONELEFT_LANG=en] node tools/capture-safety.mjs <output-dir> [prefix]
import {
  APP,
  click,
  credentials,
  keycloakLogin,
  LANG,
  launch,
  mobilePage,
  pause,
  screenshot,
  t,
} from './lib/app.mjs';

const [outDir = '.', prefix = 'safety'] = process.argv.slice(2);
const { ONELEFT_PERSON_ID: person, ONELEFT_PLAN_ID: plan } = process.env;
if (!person || !plan) {
  console.error('ONELEFT_PERSON_ID and ONELEFT_PLAN_ID are required');
  process.exit(1);
}

/** The element in the middle of the screen, and a capture of what is seen */
const capture = async (page, selector, name) => {
  await page.$eval(selector, (element) => element.scrollIntoView({ block: 'center' }));
  await pause(400);
  await screenshot(page, outDir, prefix, name, false);
};

const browser = await launch();
let blocked = false;
const page = await mobilePage(await browser.createBrowserContext());
try {
  await page.goto(`${APP}/profile`, { waitUntil: 'load' });
  await keycloakLogin(page, credentials());
  await page.waitForSelector('.profile-card', { timeout: 60000 });

  // 1. Her profile: «Bloquear» and «Reportar» at the end of the card
  await page.goto(`${APP}/people/${person}`, { waitUntil: 'load' });
  await page.waitForSelector('.person-safety .report-button', { timeout: 30000 });
  await capture(page, '.person-safety', '1-profile');

  // 2. Blocking asks first, and says that she is not told
  await click(page, '.block-button button');
  await page.waitForSelector('.block-confirm', { timeout: 15000 });
  await capture(page, '.block-confirm', '2-confirm');

  // 3. Blocked: a notice, «Desbloquear», and none of her plans
  await click(page, '.block-confirm-button button');
  blocked = true;
  await page.waitForSelector('.blocked-message', { timeout: 15000 });
  await capture(page, '.blocked-message', '3-blocked');

  // 4. The people she blocked, from the menu of her avatar
  await page.goto(APP, { waitUntil: 'load' });
  await click(page, 'button.user-menu');
  await click(page, '.user-menu__blocked a, .user-menu__blocked .p-menu-item-link');
  await page.waitForSelector('.connections--blocked .connection', { timeout: 15000 });
  await screenshot(page, outDir, prefix, '4-blocked-people', false);
  await click(page, '.unblock-person button');
  await page.waitForSelector('.no-blocked', { timeout: 15000 });
  blocked = false;

  // 5. Reporting a plan: the reason and what happened, not sent
  await page.goto(`${APP}/plans/${plan}`, { waitUntil: 'load' });
  await click(page, '.report-plan button');
  await click(page, '.report-reason');
  await click(page, `.p-select-option ::-p-text(${t('safety.reasons.FAKE')})`);
  await page.locator('.report-comment').fill(LANG === 'en' ? 'There is no such court' : 'La pista no existe');
  await capture(page, 'app-report-form', '5-report');
  await click(page, '.report-cancel button');
  console.log('Walkthrough completed');
} finally {
  if (blocked) {
    // Never leave her blocked, even if a step failed
    await page.goto(`${APP}/blocked`, { waitUntil: 'load' }).catch(() => {});
    await click(page, '.unblock-person button').catch(() => {});
  }
  await browser.close();
}
