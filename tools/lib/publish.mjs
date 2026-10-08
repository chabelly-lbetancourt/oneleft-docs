// Publishes a plan from the app's form, as in HU-003, starting at a given time (the "Other time" option).
import { button, click, pause, t } from './app.mjs';

/** "19:30" for a date that is `minutes` from now (the form takes the next occurrence of that time). */
export const clockIn = (minutes) => {
  const date = new Date(Date.now() + minutes * 60_000);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

/** PrimeNG InputNumber: the value is typed over the selected one, as a person would, and the field is left. */
export const typeNumber = async (page, selector, value) => {
  await page.click(selector, { clickCount: 3 });
  await page.keyboard.type(String(value));
  await page.keyboard.press('Tab');
  await pause(200);
};

/**
 * Fills and sends the form (the page must be on /plans/new) and returns the path of the published plan. `spots` changes
 * the free spots and `before` runs on the filled form just before sending it (HU-039 uses it for the minimum).
 */
export const publishPlan = async (page, { activity, title, place, time, spots, before }) => {
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
  if (spots) {
    await typeNumber(page, '#spots', spots);
  }
  if (before) {
    await before(page);
  }
  await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), click(page, button('publish.submit'))]);
  await page.waitForSelector('.plan-card', { timeout: 20000 });
  await pause(300);
  return new URL(page.url()).pathname;
};
