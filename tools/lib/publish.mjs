// Publishes a plan from the app's form, as in HU-003, starting at a given time (the "Other time" option).
import { button, click, pause, t } from './app.mjs';

/** "19:30" for a date that is `minutes` from now (the form takes the next occurrence of that time). */
export const clockIn = (minutes) => {
  const date = new Date(Date.now() + minutes * 60_000);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

/** Fills and sends the form (the page must be on /plans/new) and returns the path of the published plan. */
export const publishPlan = async (page, { activity, title, place, time }) => {
  await page.waitForSelector('.publish-form', { timeout: 20000 });
  // The page arrives with a short transition (view transitions): clicks during it do not open the select
  await pause(800);
  await click(page, 'p-select');
  await click(page, `li[role="option"][aria-label="${t(`activities.${activity}`)}"]`);
  await page.locator('#title').fill(title);
  await click(page, `p-togglebutton[aria-label="${t('publish.custom')}"]`);
  await page.locator('#customTime').fill(time);
  await page.locator('#placeName').fill(place);
  await click(page, button('publish.here'));
  await page.waitForSelector('.meeting-coordinates');
  await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), click(page, button('publish.submit'))]);
  await page.waitForSelector('.plan-card', { timeout: 20000 });
  await pause(300);
  return new URL(page.url()).pathname;
};
