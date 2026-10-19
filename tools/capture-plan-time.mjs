// Walks through the fix of frontend#139: the time of a plan follows its status. Ana publishes a padel plan that starts
// in 30 minutes (through the API) and opens it; the plan is then moved in the local database so that the task of each
// minute starts it and finishes it, and at the end it is marked as cancelled (in the app only the minimum of HU-039
// cancels a plan). One capture per status. Everything the walkthrough creates is deleted at the end. Local stack only:
// it needs the PostgreSQL container of oneleft-infra and the development client oneleft-api of the realm.
// Usage: ONELEFT_ORGANIZER_USER=<Ana> ONELEFT_ORGANIZER_PASSWORD=... [ONELEFT_LANG=en] [ONELEFT_POSTGRES=oneleft-postgres]
//   node tools/capture-plan-time.mjs <output-dir> [prefix]
import { execFileSync } from 'node:child_process';
import { APP, keycloakLogin, launch, mobilePage, pause, screenshot } from './lib/app.mjs';

const [outDir = '.', prefix = 'plan-time'] = process.argv.slice(2);
const ana = { user: process.env.ONELEFT_ORGANIZER_USER, password: process.env.ONELEFT_ORGANIZER_PASSWORD };
if (!ana.user || !ana.password) {
  console.error('ONELEFT_ORGANIZER_USER and ONELEFT_ORGANIZER_PASSWORD are required');
  process.exit(1);
}
const POSTGRES = process.env.ONELEFT_POSTGRES ?? 'oneleft-postgres';
const KEYCLOAK = 'http://localhost:8180/realms/oneleft/protocol/openid-connect/token';
const API = 'http://localhost:8080/api/v1/plans';
const ANA = 'a624d063-bd1e-442d-b52d-8de2df356c13';
const TITLE = 'Prueba de la hora (#139)';

const sql = (database, statement) =>
  execFileSync('docker', ['exec', POSTGRES, 'psql', '-U', 'oneleft', '-d', database, '-Atc', statement], {
    encoding: 'utf8',
  }).trim();

const waitFor = async (database, statement, what, seconds = 150) => {
  for (let waited = 0; waited < seconds; waited += 3) {
    if (sql(database, statement)) {
      return;
    }
    await pause(3000);
  }
  throw new Error(`Timed out waiting for ${what}`);
};

/** Ana's token with the confidential development client (password grant) */
const token = async () => {
  const response = await fetch(KEYCLOAK, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: 'oneleft-api',
      client_secret: 'oneleft-api-dev-secret',
      username: ana.user,
      password: ana.password,
      scope: 'openid',
    }),
  });
  if (!response.ok) {
    throw new Error(`Token: ${response.status}`);
  }
  return (await response.json()).access_token;
};

const startedAt = sql('plans', 'SELECT now()');
const browser = await launch();
let planId = null;
try {
  const response = await fetch(API, {
    method: 'POST',
    headers: { authorization: `Bearer ${await token()}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      activity: 'PADEL',
      title: TITLE,
      meetingPoint: { name: 'Pistas de la Albufera', latitude: 40.3912, longitude: -3.6287 },
      startsAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      spots: 1,
    }),
  });
  if (!response.ok) {
    throw new Error(`Publish: ${response.status} ${await response.text()}`);
  }
  planId = (await response.json()).id;

  const page = await mobilePage(await browser.createBrowserContext());
  await page.goto(`${APP}/profile`, { waitUntil: 'load' });
  await keycloakLogin(page, ana);
  await page.waitForSelector('.profile-card', { timeout: 60000 });

  /** Opens the plan and captures its card, with the time line in view */
  const capture = async (name) => {
    await page.goto(`${APP}/plans/${planId}`, { waitUntil: 'load' });
    await page.waitForSelector('.plan-time', { timeout: 30000 });
    await pause(800);
    await screenshot(page, outDir, prefix, name, false);
  };

  // 1. Open: «in 30 min»
  await capture('1-open');

  // 2. In progress: it started 20 minutes ago
  sql('plans', `UPDATE plan SET starts_at = now() - interval '20 minutes' WHERE id = '${planId}'`);
  await waitFor('plans', `SELECT 1 FROM plan WHERE id = '${planId}' AND status = 'IN_PROGRESS'`, 'the start');
  await capture('2-in-progress');

  // 3. Finished: 3 hours after the start
  sql('plans', `UPDATE plan SET starts_at = now() - interval '3 hours 5 minutes' WHERE id = '${planId}'`);
  await waitFor('plans', `SELECT 1 FROM plan WHERE id = '${planId}' AND status = 'FINISHED'`, 'the end');
  await capture('3-finished');

  // 4. Cancelled: only the time, nothing after it
  sql('plans', `UPDATE plan SET status = 'CANCELLED' WHERE id = '${planId}'`);
  await capture('4-cancelled');
  console.log('Walkthrough completed');
} finally {
  await browser.close();
  if (planId) {
    // Nothing of the walkthrough stays, in any service. The ledger is append-only: only an erasure deletes entries
    const steps = {
      plans: `DELETE FROM plan_check_in WHERE plan_id = '${planId}'; DELETE FROM plan_arrival WHERE plan_id = '${planId}';
        DELETE FROM plan_participant WHERE plan_id = '${planId}'; DELETE FROM plan WHERE id = '${planId}'`,
      reputation: `BEGIN; SET LOCAL oneleft.ledger_erasure = 'on';
        DELETE FROM track_record WHERE plan_id = '${planId}';
        DELETE FROM reputation_entry WHERE user_id = '${ANA}' AND plan_title = '${TITLE}' AND recorded_at >= '${startedAt}';
        DELETE FROM badge WHERE user_id = '${ANA}' AND earned_at >= '${startedAt}';
        DELETE FROM reputation_score s WHERE s.user_id = '${ANA}'
          AND NOT EXISTS (SELECT 1 FROM reputation_entry e WHERE e.user_id = s.user_id);
        UPDATE reputation_score s SET score = (SELECT sum(points) FROM reputation_entry e WHERE e.user_id = s.user_id)
          WHERE s.user_id = '${ANA}';
        COMMIT`,
      social: `DELETE FROM activity WHERE plan_id = '${planId}'`,
      notifications: `DELETE FROM sent_notice WHERE plan_id = '${planId}'`,
    };
    for (const [database, statement] of Object.entries(steps)) {
      try {
        sql(database, statement);
      } catch (error) {
        console.error(`Could not undo the walkthrough in ${database}:`, error.message);
      }
    }
    console.log(`Walkthrough undone: plan ${planId} deleted`);
  }
}
