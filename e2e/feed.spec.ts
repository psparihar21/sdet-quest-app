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
