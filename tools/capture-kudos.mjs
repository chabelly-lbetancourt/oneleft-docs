// Walks through HU-060 with two people. Ana publishes a padel plan that starts in a few minutes at the courts, Lucía
// joins it and both check in there. The plan is then moved 3 hours back in the local database, so that the task of
// each minute finishes it and closes its attendance, as if it had been held. In the detail of the plan, Ana gives
// «Good vibes» to Lucía, who has the plan open and gets the notice; Lucía gives «Great organizer» to Ana. Lucía's social
// profile shows the kudos received and «My reputation» the +5. At the end everything the walkthrough created is
// deleted from the local databases: the plan, its check-ins, the history, the kudos and their entries, and the scores
// are recomputed, so nothing of it stays. Local stack only: it needs the PostgreSQL container of oneleft-infra.
// Usage: ONELEFT_TEST_USER=<Lucía> ONELEFT_TEST_PASSWORD=... ONELEFT_ORGANIZER_USER=<Ana> ONELEFT_ORGANIZER_PASSWORD=...
//   [ONELEFT_LANG=en] [ONELEFT_POSTGRES=oneleft-postgres] node tools/capture-kudos.mjs <output-dir> [prefix]
import { execFileSync } from 'node:child_process';
import { APP, click, credentials, keycloakLogin, launch, mobilePage, pause, screenshot, t } from './lib/app.mjs';
import { clockIn, publishPlan } from './lib/publish.mjs';

const [outDir = '.', prefix = 'kudos'] = process.argv.slice(2);
const participant = credentials();
const organizer = { user: process.env.ONELEFT_ORGANIZER_USER, password: process.env.ONELEFT_ORGANIZER_PASSWORD };
if (!organizer.user || !organizer.password) {
  console.error('ONELEFT_ORGANIZER_USER and ONELEFT_ORGANIZER_PASSWORD are required');
  process.exit(1);
}
const POSTGRES = process.env.ONELEFT_POSTGRES ?? 'oneleft-postgres';
/** Ana and Lucía Pruebas: fixed ids of the development realm */
const ANA = 'a624d063-bd1e-442d-b52d-8de2df356c13';
const LUCIA = '5b0f7c2e-8d4a-4f3b-9c61-2e7a9d4b8f10';
const TITLE = 'Pádel 2 contra 2, falta uno';
/** The courts of Vallecas: the plan is published there and both check in there */
const COURTS = { latitude: 40.3912, longitude: -3.6287 };
const UUID = /^[0-9a-f-]{36}$/;

/** One SQL statement in a database of the local stack; returns the rows, one per line */
const sql = (database, statement) =>
  execFileSync('docker', ['exec', POSTGRES, 'psql', '-U', 'oneleft', '-d', database, '-Atc', statement], {
    encoding: 'utf8',
  }).trim();

/** Waits until a query returns something (the task of each minute, an event through RabbitMQ) */
const waitFor = async (database, statement, what, seconds = 150) => {
  for (let waited = 0; waited < seconds; waited += 3) {
    if (sql(database, statement)) {
      return;
    }
    await pause(3000);
  }
  throw new Error(`Timed out waiting for ${what}`);
};

const browser = await launch();

/** A person in their own browser context, signed in, at the courts */
const signedIn = async (login) => {
  const context = await browser.createBrowserContext();
  await context.overridePermissions(APP, ['geolocation']);
  const page = await mobilePage(context);
  await page.setGeolocation({ ...COURTS, accuracy: 10 });
  await page.goto(`${APP}/profile`, { waitUntil: 'load' });
  await keycloakLogin(page, login);
  await page.waitForSelector('.profile-card', { timeout: 60000 });
  return page;
};

/** Brings the kudos of the plan into view, below its people */
const showKudos = async (page) => {
  await page.waitForSelector('app-plan-kudos .kudos-person', { timeout: 60000 });
  await page.evaluate(() => document.querySelector('app-plan-kudos')?.scrollIntoView({ block: 'center' }));
  await pause(600);
};

/** Gives a kudos of a kind to a person of the panel, with a real click on its chip (text selectors do not work
 * inside :has) */
const giveKudos = async (page, name, kind) => {
  const chip = await page.waitForFunction(
    (person, label) =>
      [...document.querySelectorAll('app-plan-kudos .kudos-person')]
        .find((item) => item.querySelector('.kudos-person__name')?.textContent.includes(person))
        ?.querySelectorAll('.kudos-kind')
        .values()
        .find((button) => button.textContent.trim() === label),
    { timeout: 15000 },
    name,
    t(`kudos.kinds.${kind}`),
  );
  await chip.asElement().click();
  await pause(400);
};

const startedAt = sql('plans', 'SELECT now()');
let planId = null;
try {
  // Ana publishes at the courts; Lucía joins, and both say they are there
  const ana = await signedIn(organizer);
  await ana.goto(`${APP}/plans/new`, { waitUntil: 'load' });
  const path = await publishPlan(ana, { activity: 'PADEL', title: TITLE, place: 'Pistas de la Albufera', time: clockIn(8) });
  planId = path.split('/').pop();
  if (!UUID.test(planId)) {
    throw new Error(`Unexpected plan path: ${path}`);
  }
  const lucia = await signedIn(participant);
  await lucia.goto(`${APP}${path}`, { waitUntil: 'load' });
  await click(lucia, '.join-button button');
  for (const page of [lucia, ana]) {
    await page.goto(`${APP}${path}`, { waitUntil: 'load' });
    await click(page, '.check-in__button button');
    await page.waitForSelector('.check-in__done', { timeout: 30000 });
  }

  // The plan is held: 3 hours back, the task of each minute finishes it and closes its attendance, and the
  // reputation keeps who arrived
  sql('plans', `UPDATE plan SET starts_at = now() - interval '3 hours 5 minutes' WHERE id = '${planId}'`);
  console.log('Waiting for the plan to finish and its attendance to close...');
  await waitFor(
    'plans',
    `SELECT 1 FROM plan WHERE id = '${planId}' AND status = 'FINISHED' AND attendance_closed_at IS NOT NULL`,
    'the plan to finish',
  );
  await waitFor('reputation', `SELECT 1 FROM track_record WHERE plan_id = '${planId}' AND arrived`, 'the history');

  // 1. Ana, in the plan that ended, sees whom she can give kudos to
  await ana.goto(`${APP}${path}`, { waitUntil: 'load' });
  await showKudos(ana);
  await screenshot(ana, outDir, prefix, '1-choices', false);

  // 2. Lucía has the plan open when Ana gives her «Good vibes»: the notice arrives in real time
  await lucia.goto(`${APP}${path}`, { waitUntil: 'load' });
  await showKudos(lucia);
  await giveKudos(ana, 'Lucía', 'GOOD_VIBES');
  await ana.waitForSelector('app-plan-kudos .kudos-person__given', { timeout: 30000 });
  await lucia.waitForSelector(`.join-notice ::-p-text(${t('notices.kudosTitle')})`, { timeout: 60000 });
  await pause(800);
  await screenshot(lucia, outDir, prefix, '2-notice', false);

  // 3. Lucía gives «Great organizer» to Ana: once given, it replaces the choices
  await giveKudos(lucia, 'Ana', 'GREAT_ORGANIZER');
  await lucia.waitForSelector('app-plan-kudos .kudos-person__given', { timeout: 30000 });
  // The notice lasts 8 s: the capture waits for it to go, so that it shows the panel
  await lucia.waitForFunction(() => !document.querySelector('.join-notice'), { timeout: 20000 });
  await showKudos(lucia);
  await screenshot(lucia, outDir, prefix, '3-given', false);

  // 4. The kudos received, in Lucía's social profile
  await lucia.goto(`${APP}/people/${LUCIA}`, { waitUntil: 'load' });
  await lucia.waitForSelector('.person-kudos .kudos-count', { timeout: 30000 });
  await lucia.evaluate(() => document.querySelector('.person-kudos')?.scrollIntoView({ block: 'center' }));
  await pause(600);
  await screenshot(lucia, outDir, prefix, '4-profile', false);

  // 5. And the +5 in «My reputation»
  await lucia.goto(`${APP}/reputation`, { waitUntil: 'load' });
  await lucia.waitForSelector('.entry', { timeout: 30000 });
  await lucia.evaluate(() => document.querySelector('.entry')?.scrollIntoView({ block: 'center' }));
  await pause(600);
  await screenshot(lucia, outDir, prefix, '5-reputation', false);
  console.log('Walkthrough completed');
} finally {
  await browser.close();
  // Nothing of the walkthrough stays: the plan and everything that hangs from it, in every service
  if (planId) {
    undo(planId);
  }
}

/** Deletes the plan of the walkthrough from every service. Each step runs on its own, so one failure does not leave
 * the others undone. */
function undo(plan) {
  const people = `('${ANA}', '${LUCIA}')`;
  const steps = {
    plans: `DELETE FROM plan_arrival WHERE plan_id = '${plan}';
      DELETE FROM plan_check_in WHERE plan_id = '${plan}';
      DELETE FROM plan_participant WHERE plan_id = '${plan}';
      DELETE FROM plan_waitlist WHERE plan_id = '${plan}';
      DELETE FROM plan WHERE id = '${plan}'`,
    // The ledger is append-only: it only lets an erasure delete entries, as the tests of the service do
    reputation: `BEGIN;
      SET LOCAL oneleft.ledger_erasure = 'on';
      DELETE FROM kudos WHERE plan_id = '${plan}';
      DELETE FROM track_record WHERE plan_id = '${plan}';
      DELETE FROM reputation_entry WHERE user_id IN ${people} AND plan_title = '${TITLE.replaceAll("'", "''")}'
        AND recorded_at >= '${startedAt}';
      DELETE FROM badge WHERE user_id IN ${people} AND earned_at >= '${startedAt}';
      DELETE FROM reputation_score s WHERE s.user_id IN ${people}
        AND NOT EXISTS (SELECT 1 FROM reputation_entry e WHERE e.user_id = s.user_id);
      UPDATE reputation_score s SET score = (SELECT sum(points) FROM reputation_entry e WHERE e.user_id = s.user_id)
        WHERE s.user_id IN ${people};
      COMMIT`,
    social: `DELETE FROM activity WHERE plan_id = '${plan}'; DELETE FROM hidden_plan WHERE plan_id = '${plan}'`,
    chat: `DELETE FROM chat_message WHERE plan_id = '${plan}'`,
    notifications: `DELETE FROM sent_notice WHERE plan_id = '${plan}'`,
  };
  let undone = true;
  for (const [database, statement] of Object.entries(steps)) {
    try {
      sql(database, statement);
    } catch (error) {
      undone = false;
      console.error(`Could not undo the walkthrough in ${database}:`, error.message);
    }
  }
  try {
    // The cached feeds may still list the plan: they are rebuilt on the next read
    const feeds = execFileSync('docker', ['exec', 'oneleft-redis', 'redis-cli', '--scan', '--pattern', 'oneleft:social:feed:*'], {
      encoding: 'utf8',
    })
      .split('\n')
      .filter(Boolean);
    if (feeds.length) {
      execFileSync('docker', ['exec', 'oneleft-redis', 'redis-cli', 'DEL', ...feeds]);
    }
  } catch (error) {
    undone = false;
    console.error('Could not forget the cached feeds:', error.message);
  }
  console.log(undone ? `Walkthrough undone: plan ${plan} deleted` : `Walkthrough partly undone: plan ${plan}`);
}