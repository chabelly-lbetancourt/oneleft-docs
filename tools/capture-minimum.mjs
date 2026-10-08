// Walks through HU-039: the organizer publishes a plan with a minimum of participants (form and detail), and another
// one that starts in 7 minutes with its deadline at the start. Nobody joins, so at the deadline it is cancelled: the
// organizer gets the notice on the home screen and the detail explains why. Takes about 8 minutes.
// Usage: ONELEFT_TEST_USER=... ONELEFT_TEST_PASSWORD=... [ONELEFT_LANG=en] node tools/capture-minimum.mjs <output-dir> [prefix]
import { APP, click, credentials, keycloakLogin, launch, mobilePage, pause, screenshot, t } from './lib/app.mjs';
import { clockIn, publishPlan, typeNumber } from './lib/publish.mjs';

const [outDir = '.', prefix = 'minimum'] = process.argv.slice(2);
const login = credentials();
const browser = await launch();

/** Switches the minimum on and chooses its participants and deadline. */
const chooseMinimum = async (page, participants, deadlineKey) => {
  await click(page, 'p-toggleswitch.minimum-switch');
  await page.waitForSelector('#minParticipants');
  await typeNumber(page, '#minParticipants', participants);
  await click(page, `p-togglebutton[aria-label="${t(deadlineKey)}"]`);
};

/**
 * Waits for a selector for up to `minutes`, in steps shorter than the protocol timeout of Puppeteer (180 s), which
 * otherwise cuts a single long wait.
 */
const waitLong = async (page, selector, minutes) => {
  const until = Date.now() + minutes * 60_000;
  for (;;) {
    try {
      return await page.waitForSelector(selector, { timeout: 120000 });
    } catch (error) {
      if (Date.now() > until) {
        throw error;
      }
    }
  }
};

try {
  await browser.defaultBrowserContext().overridePermissions(APP, ['geolocation']);
  const page = await mobilePage(browser);
  await page.setGeolocation({ latitude: 40.391234, longitude: -3.628765, accuracy: 10 });
  await page.goto(`${APP}/plans/new`, { waitUntil: 'load' });
  await keycloakLogin(page, login);

  // A quick padel match that needs 2 people by its start: nobody will join it
  const cancelling = await publishPlan(page, {
    activity: 'PADEL',
    title: 'Pádel, partido rápido',
    place: 'Polideportivo de Vallecas',
    time: clockIn(7),
    spots: 3,
    before: (form) => chooseMinimum(form, 2, 'publish.deadlineAtStart'),
  });
  // 1-2. A football match that needs at least 6 people one hour before it starts: the form and its detail
  await page.goto(`${APP}/plans/new`, { waitUntil: 'load' });
  await publishPlan(page, {
    activity: 'FOOTBALL',
    title: 'Fútbol 7, faltan jugadores',
    place: 'Campo de fútbol de Entrevías',
    time: clockIn(180),
    spots: 8,
    before: async (form) => {
      await chooseMinimum(form, 6, 'publish.deadline60');
      await form.evaluate(() => document.querySelector('.minimum-section')?.scrollIntoView({ block: 'center' }));
      await screenshot(form, outDir, prefix, '1-form', false);
    },
  });
  await screenshot(page, outDir, prefix, '2-detail');

  // 3. Nobody joined the quick one: at its deadline it is cancelled and the organizer is told
  await page.goto(APP, { waitUntil: 'load' });
  await waitLong(page, `.join-notice ::-p-text(${t('notices.cancelledTitle')})`, 10);
  await pause(500);
  await screenshot(page, outDir, prefix, '3-notice', false);

  // 4. The detail of the cancelled plan explains why
  await page.goto(`${APP}${cancelling}`, { waitUntil: 'load' });
  await page.waitForSelector('.ended-hint', { timeout: 30000 });
  await screenshot(page, outDir, prefix, '4-cancelled');
  console.log('Walkthrough completed');
} finally {
  await browser.close();
}
