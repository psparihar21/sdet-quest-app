import { expect, test } from '@playwright/test';

test('the feed teaches by scrolling: reading completes steps and a miss comes back first', async ({ page }) => {
  await page.goto('/feed');
  const cards = page.getByTestId('feed-card');
  await expect(cards.first()).toContainText('Module 1');
  await expect(page.getByText('Scroll for the next card')).toBeVisible();

  // Scroll card by card until the first question, as a thumb would.
  const question = page.getByTestId('question-m01-q1');
  // Each card ends in a marker; reaching it is what counts as having read the card.
  const ends = page.locator('[data-seen]');
  for (let i = 0; i < 12 && !(await cards.nth(i).getByTestId('question-m01-q1').count()); i++) {
    await ends.nth(i).scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
  }
  await question.scrollIntoViewIfNeeded();

  // Reading the whole first step marked it done, exactly like "Got it, next" on the lesson page.
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sdet-quest:v1') ?? '{}').state?.lessons?.['m01-l1']?.done ?? [])).toContain(0);

  await question.getByRole('radio', { name: /End-to-end UI tests/ }).click();
  await question.getByRole('button', { name: 'Check answer' }).click();
  await expect(question.getByText(/Added to your revision queue/)).toBeVisible();

  // Next visit: the missed question leads the feed as a weak spot, and the finished step is gone.
  await page.reload();
  await expect(cards.first()).toContainText('Weak spot');
  await expect(cards.first().getByTestId('question-m01-q1')).toBeVisible();
  await expect(page.locator('[data-key^="new:m01-l1:0:"]')).toHaveCount(0);
});

test('the feed does not scroll sideways and loads more cards at the end', async ({ page }) => {
  await page.goto('/feed');
  const feed = page.getByRole('feed');
  const count = await page.getByTestId('feed-card').count();
  // Snap scrolling stops at the top of the last card, never past it: more cards must load from there.
  await page.getByTestId('feed-card').nth(count - 1).evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await expect.poll(() => page.getByTestId('feed-card').count()).toBeGreaterThan(count);
  expect(await feed.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(1);
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
