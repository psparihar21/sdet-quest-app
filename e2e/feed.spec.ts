import { expect, test, type Locator, type Page } from '@playwright/test';

const cardsOf = (page: Page) => page.getByTestId('feed-card');
/** Land on a card the way a swipe does: its top edge at the top of the screen. */
const swipeTo = async (card: Locator) => {
  await card.evaluate((el) => el.scrollIntoView());
  await card.page().waitForTimeout(120);
};

test('the feed is a full-screen reel: no app chrome, one card per screen', async ({ page }) => {
  await page.goto('/feed');
  const feed = page.getByRole('feed');
  await expect(cardsOf(page).first()).toContainText('Module 1');
  await expect(page.getByTestId('feed-hint')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open menu' })).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toHaveCount(0);

  const sizes = await feed.evaluate((el) => ({ screen: window.innerHeight, feed: el.clientHeight, cards: Array.from(el.querySelectorAll('article')).slice(0, 12).map((a) => a.offsetHeight) }));
  expect(sizes.feed).toBe(sizes.screen);
  expect(sizes.cards.every((h) => h === sizes.screen)).toBe(true);
  // Nothing scrolls sideways or stretches the page.
  expect(await feed.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(1);

  // The close button leads back to the rest of the app.
  await cardsOf(page).first().getByRole('link', { name: /Close the feed/ }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('reading completes steps, one tap answers, and a miss comes back first', async ({ page }) => {
  await page.goto('/feed');
  const cards = cardsOf(page);
  const question = page.getByTestId('question-m01-q1');
  for (let i = 0; i < 14 && !(await cards.nth(i).getByTestId('question-m01-q1').count()); i++) await swipeTo(cards.nth(i));
  await swipeTo(cards.filter({ has: question }));

  // Reading the whole first step marked it done, exactly like "Got it, next" on the lesson page.
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sdet-quest:v1') ?? '{}').state?.lessons?.['m01-l1']?.done ?? [])).toContain(0);

  // One tap locks the answer in: there is no separate check button.
  await question.getByRole('button', { name: /End-to-end UI tests/ }).click();
  await expect(question.locator('.stamp')).toHaveText('Not quite');
  await expect(question.getByRole('status')).toContainText('Correct answer: Unit tests');
  await expect(question.getByText(/Added to your revision queue/)).toBeVisible();
  await expect(question.getByRole('button', { name: /Unit tests/ })).toBeDisabled();

  // Next visit: the missed question leads the feed as a weak spot, and the finished step is gone.
  await page.reload();
  await expect(cards.first()).toContainText('Weak spot');
  await expect(cards.first().getByTestId('question-m01-q1')).toBeVisible();
  await expect(page.locator('[data-key^="new:m01-l1:0:"]')).toHaveCount(0);
});

test('true/false is answered by throwing the card, and flashcards flip', async ({ page }) => {
  await page.goto('/feed');
  const cards = cardsOf(page);
  const tf = page.locator('[data-testid^="question-"]').filter({ hasText: 'True or false?' }).first();
  // More cards load as the end comes near; keep going until a true/false question is in the feed.
  for (let i = 0; i < 8 && !(await tf.count()); i++) await swipeTo(cards.last());
  await swipeTo(cards.filter({ has: tf }).first());
  const box = (await tf.locator('.cursor-grab').boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 140, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect(tf.locator('.stamp')).toBeVisible();
  await expect(tf.getByRole('button', { name: /^True/ })).toBeDisabled();

  const flash = page.locator('[data-testid^="flashcard-"]').first();
  await swipeTo(cards.filter({ has: flash }).first());
  await flash.getByRole('button', { name: /tap to flip/ }).click();
  await flash.getByRole('button', { name: 'Nailed it' }).click();
  await expect(flash.getByText(/Scheduled/)).toBeVisible();
  const kinds = await page.evaluate(() => (JSON.parse(localStorage.getItem('sdet-quest:v1') ?? '{}').state?.attempts ?? []).map((a: { itemType: string }) => a.itemType));
  expect(kinds).toEqual(expect.arrayContaining(['question', 'flashcard']));
});

test('more cards load from the last card, where snap scrolling stops', async ({ page }) => {
  await page.goto('/feed');
  const count = await cardsOf(page).count();
  await swipeTo(cardsOf(page).nth(count - 1));
  await expect.poll(() => cardsOf(page).count()).toBeGreaterThan(count);
});

test('the app installs a service worker and opens offline', async ({ page, context }) => {
  await page.goto('/feed');
  await page.evaluate(() => navigator.serviceWorker.ready);
  // The first visit precaches the app; wait for the worker to take control before cutting the network.
  await expect.poll(() => page.evaluate(async () => (await caches.keys()).length)).toBeGreaterThan(0);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await context.setOffline(true);
  await page.goto('/feed');
  await expect(page.getByTestId('feed-card').first()).toBeVisible();
  // A deep link that was never visited still loads from the cached shell.
  await page.goto('/revision');
  await expect(page.getByRole('heading', { name: 'Revision Center' })).toBeVisible();
});

test('coding happens inside the feed: order the lines, fill the gaps, write and run', async ({ page }) => {
  await page.goto('/feed');
  const cards = cardsOf(page);
  const stage = (name: string) => page.getByTestId(`code-js-boundary-values-${name}`);
  for (let i = 0; i < 10 && !(await stage('write').count()); i++) await swipeTo(cards.last());

  // 1. Tap the lines into order. The assembled code then really runs.
  await swipeTo(cards.filter({ has: stage('order') }));
  const pile = stage('order').getByRole('group', { name: 'Lines to place' }).getByRole('button');
  for (const line of [/^function boundaryValues/, /const candidates/, /return \[/, /^}$/]) await pile.filter({ hasText: line }).first().click();
  await expect(stage('order').getByRole('status')).toContainText('5/5 tests passed');

  // 2. Pick the missing syntax; a wrong pick is not accepted.
  await swipeTo(cards.filter({ has: stage('gaps') }));
  const options = stage('gaps').getByRole('group').getByRole('button');
  await options.filter({ hasNotText: /^const$/ }).first().click();
  await expect(stage('gaps').getByRole('status')).toContainText('Try another');
  await options.getByText('const', { exact: true }).click();
  await options.getByText('Set', { exact: true }).click();
  await expect(stage('gaps').getByRole('status')).toContainText('All 2 filled');

  // 3. Write it with tap-in syntax, and run the real tests.
  await swipeTo(cards.filter({ has: stage('write') }));
  const editor = stage('write').getByRole('textbox');
  await stage('write').getByRole('button', { name: 'Run the tests' }).click();
  await expect(stage('write').getByText(/\d\/5 tests passed/)).toBeVisible();
  await editor.fill('function boundaryValues(min, max) {\n  const c = [min - 1, min, min + 1, max - 1, max, max + 1];\n  return ');
  await stage('write').getByRole('button', { name: '[...x]' }).click();
  await expect(editor).toHaveValue(/return \[\.\.\.\]$/);
  await editor.fill('function boundaryValues(min, max) {\n  const c = [min - 1, min, min + 1, max - 1, max, max + 1];\n  return [...new Set(c)].sort((a, b) => a - b);\n}');
  await stage('write').getByRole('button', { name: 'Run the tests' }).click();
  await expect(stage('write').getByText('5/5 tests passed')).toBeVisible();
  // Running it finished the lesson's practice step, without leaving the feed.
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sdet-quest:v1') ?? '{}').state?.lessons?.['m01-l4']?.done ?? [])).toContain(3);
  await expect(page).toHaveURL(/\/feed$/);
});

test('interview drills and build tasks are answered in the feed, with no "open the full page" cards', async ({ page }) => {
  await page.goto('/feed');
  const iv = page.locator('[data-testid^="interview-"]').first();
  await swipeTo(cardsOf(page).filter({ has: iv }).first());
  await iv.getByLabel(/Your answer/).fill('The pyramid is inverted. I would move business rules down to unit and API tests, keep a few critical journeys as E2E, quarantine flaky tests with an owner, and report CI time and flaky rate weekly. For example, target CI under 15 minutes. The trade-off is developer time.');
  await iv.getByRole('button', { name: 'Submit answer' }).click();
  await expect(iv.getByText('Technical correctness')).toBeVisible();
  await expect(page.getByTestId('build-task').first()).toBeAttached();
  await expect(page.getByText('Needs the full screen')).toHaveCount(0);
});
