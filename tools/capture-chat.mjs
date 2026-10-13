// Walks through HU-008 with two people at the same time: the organizer (ONELEFT_ORGANIZER_USER, Ana) publishes a padel
// plan, a second person (ONELEFT_TEST_USER, Lucía) joins it, and both open the chat of the plan and talk: each message
// appears on the other screen at once, through the WebSocket of the gateway and the chat service. The plan is left to
// expire like any other, and its messages are deleted 24 h after it ends.
// Usage: [ONELEFT_LANG=en] node tools/capture-chat.mjs <output-dir> [prefix]
import { APP, click, credentials, keycloakLogin, launch, mobilePage, pause, screenshot, t } from './lib/app.mjs';
import { clockIn, publishPlan } from './lib/publish.mjs';

const [outDir = '.', prefix = 'chat'] = process.argv.slice(2);
const participant = credentials();
const organizer = { user: process.env.ONELEFT_ORGANIZER_USER, password: process.env.ONELEFT_ORGANIZER_PASSWORD };
if (!organizer.user || !organizer.password) {
  console.error('ONELEFT_ORGANIZER_USER and ONELEFT_ORGANIZER_PASSWORD are required');
  process.exit(1);
}

/** Writes in the chat and waits until the message is in its own log (it came back through the WebSocket). */
const write = async (page, text) => {
  await page.locator('#chatText').fill(text);
  await page.keyboard.press('Enter');
  await page.waitForSelector(`.chat-message__text ::-p-text(${text})`, { timeout: 15000 });
};

/** The chat is open and connected: the field is there and «connecting» is gone. */
const connected = (page) =>
  page.waitForFunction(() => document.querySelector('#chatText') && !document.querySelector('.chat-status .hint'), {
    timeout: 20000,
  });

const browser = await launch();
try {
  const organizerContext = await browser.createBrowserContext();
  const participantContext = await browser.createBrowserContext();
  for (const context of [organizerContext, participantContext]) {
    await context.overridePermissions(APP, ['geolocation']);
  }
  const organizerPage = await mobilePage(organizerContext);
  const participantPage = await mobilePage(participantContext);
  await organizerPage.setGeolocation({ latitude: 40.391234, longitude: -3.628765, accuracy: 10 });

  // Ana publishes a padel plan in an hour and a half
  await organizerPage.goto(`${APP}/plans/new`, { waitUntil: 'load' });
  await keycloakLogin(organizerPage, organizer);
  const planPath = await publishPlan(organizerPage, {
    activity: 'PADEL',
    title: 'Pádel 2 contra 2, falta uno',
    place: 'Polideportivo Campus Sur',
    time: clockIn(90),
  });

  // Lucía joins it and finds the chat in the plan
  await participantPage.goto(`${APP}${planPath}`, { waitUntil: 'load' });
  await click(participantPage, '.guest-join button');
  await keycloakLogin(participantPage, participant, 'load');
  await participantPage.waitForSelector('.join-button', { timeout: 20000 });
  await click(participantPage, '.join-button button');
  await participantPage.waitForSelector('.joined-message', { timeout: 15000 });
  await participantPage.waitForSelector('.chat-button', { timeout: 15000 });
  await pause(500);
  await screenshot(participantPage, outDir, prefix, '1-plan');

  // Both open the chat
  await click(participantPage, '.chat-button button');
  await connected(participantPage);
  await organizerPage.goto(`${APP}${planPath}/chat`, { waitUntil: 'load' });
  await connected(organizerPage);

  // Each message reaches the other screen at once
  await write(organizerPage, '¿Quién trae bolas? Yo tengo una pala de sobra');
  await participantPage.waitForSelector('.chat-message__text ::-p-text(una pala de sobra)', { timeout: 15000 });
  await write(participantPage, '¡Yo las llevo! Llego 10 minutos antes');
  await organizerPage.waitForSelector('.chat-message__text ::-p-text(10 minutos antes)', { timeout: 15000 });
  await write(organizerPage, 'Perfecto, nos vemos en la pista 3');
  await participantPage.waitForSelector('.chat-message__text ::-p-text(pista 3)', { timeout: 15000 });
  await pause(800);
  await screenshot(organizerPage, outDir, prefix, '2-organizer', false);
  await screenshot(participantPage, outDir, prefix, '3-participant', false);
  console.log(`Walkthrough completed (${t('chat.title')}: ${planPath})`);
} finally {
  await browser.close();
}
