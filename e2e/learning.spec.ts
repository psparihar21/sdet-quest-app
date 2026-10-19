import { expect, test, type Page } from '@playwright/test';

// Each test runs in a fresh BrowserContext, so local progress starts empty.

async function openMenuIfMobile(page: Page) {
  const menu = page.getByRole('button', { name: 'Open menu' });
  if (await menu.isVisible()) await menu.click();
}

test('dashboard shows the start-here path for a new learner', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Start here' })).toBeVisible();
  await expect(page.getByText('Interview readiness estimate')).toBeVisible();
  await page.getByRole('link', { name: /Start Lesson 1/ }).click();
  await expect(page.getByRole('heading', { name: 'Why the shape matters' })).toBeVisible();
});

test('answering a question wrongly queues a weakness that survives a reload', async ({ page }) => {
  await page.goto('/learn/m01/m01-l1');
  await page.getByRole('button', { name: /Check your understanding/ }).click();

  const q1 = page.getByTestId('question-m01-q1');
  await q1.getByRole('radio', { name: /End-to-end UI tests/ }).click();
  await q1.getByRole('button', { name: 'Check answer' }).click();
  await expect(q1.getByText(/Not quite\. Added to your revision queue/)).toBeVisible();
  await expect(q1.getByText(/Unit tests are fastest, cheapest/)).toBeVisible();

  const q4 = page.getByTestId('question-m01-q3');
  await q4.getByRole('radio', { name: /Move the balance rule check/ }).click();
  await q4.getByRole('button', { name: 'Check answer' }).click();
  await expect(q4.getByText('Correct.')).toBeVisible();

  await page.reload();
  await page.goto('/revision');
  await page.getByRole('tab', { name: /Weakness queue/ }).click();
  await expect(page.getByText(/In a healthy test pyramid/)).toBeVisible();
  await page.getByRole('tab', { name: /Previous mistakes/ }).click();
  await expect(page.getByTestId('question-m01-q1')).toBeVisible();
});

test('multi-select questions give partial credit', async ({ page }) => {
  await page.goto('/learn/m01/m01-l1');
  await page.getByRole('button', { name: /Check your understanding/ }).click();
  const q = page.getByTestId('question-m01-q2');
  await q.getByRole('checkbox', { name: /Long CI feedback time/ }).click();
  await q.getByRole('checkbox', { name: /Higher flaky failure rate/ }).click();
  await q.getByRole('button', { name: 'Check answer' }).click();
  await expect(q.getByText('Partly right (50%).')).toBeVisible();
});

test('JS problems really run in the sandbox', async ({ page }) => {
  await page.goto('/lab/js-find-duplicates');
  await page.getByRole('button', { name: 'Run tests' }).click();
  await expect(page.getByText('2/5 tests passed')).toBeVisible({ timeout: 10_000 });

  const editor = page.getByRole('textbox', { name: /Code editor for Find duplicate strings/ });
  await editor.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Delete');
  await editor.pressSequentially('function findDuplicates(ids) { const s = new Set(), d = new Set(); for (const x of ids) { if (s.has(x)) d.add(x); else s.add(x); } return [...d]; }');
  await page.getByRole('button', { name: 'Run tests' }).click();
  await expect(page.getByText(/5\/5 tests passed/)).toBeVisible({ timeout: 10_000 });
});

test('an infinite loop is stopped by the timeout', async ({ page }) => {
  await page.goto('/lab/js-boundary-values');
  const editor = page.getByRole('textbox', { name: /Code editor/ });
  await editor.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Delete');
  await editor.pressSequentially('function boundaryValues() { while (true) {} }');
  await page.getByRole('button', { name: 'Run tests' }).click();
  await expect(page.getByText(/Stopped after 2s/)).toBeVisible({ timeout: 10_000 });
});

test('SQL problems run against in-browser SQLite and are checked', async ({ page }) => {
  await page.goto('/lab/sql-no-department');
  await page.getByRole('button', { name: 'Submit & check' }).click();
  await expect(page.getByText(/Not yet: Expected 1 row\(s\) but got 11/)).toBeVisible({ timeout: 15_000 });

  const editor = page.getByRole('textbox', { name: /SQL editor/ });
  await editor.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Delete');
  await editor.pressSequentially("SELECT e.name FROM employees e LEFT JOIN departments d ON d.id = e.department_id WHERE d.id IS NULL AND e.status = 'ACTIVE'");
  await page.getByRole('button', { name: 'Submit & check' }).click();
  await expect(page.getByText('Correct — result matches.')).toBeVisible({ timeout: 15_000 });
});

test('interview answers get rubric feedback, and the model answer is hidden until submit', async ({ page }) => {
  await page.goto('/learn/m01/m01-l3');
  await page.getByRole('button', { name: /Interview drill/ }).click();
  await expect(page.getByText('Illustrative model answer', { exact: false })).toHaveCount(0);
  await page.getByLabel(/Your answer/).fill('Smoke testing is broad and shallow, run on every build to check the build is stable. Sanity is narrow and focused on a specific fix after a hotfix.');
  await page.getByRole('button', { name: 'Submit answer' }).click();
  await expect(page.getByText('Technical correctness')).toBeVisible();
  await expect(page.getByText(/Illustrative model answer/i)).toBeVisible();
  await expect(page.getByText(/Interviewer follow-up/i)).toBeVisible();
  await expect(page.getByText(/Missing: Mentions automating smoke/)).toBeVisible();
});

test('completing passive steps tracks lesson progress', async ({ page }) => {
  await page.goto('/learn/m01/m01-l2');
  await page.getByRole('button', { name: 'Got it, next' }).click();
  await page.getByRole('button', { name: 'Got it, next' }).click();
  await expect(page.getByText('2/6 steps')).toBeVisible();
  await page.reload();
  await expect(page.getByText('2/6 steps')).toBeVisible();
});

test('curriculum search and filters work', async ({ page }) => {
  await page.goto('/learn');
  await expect(page.getByTestId('module-m24')).toBeVisible();
  await page.getByPlaceholder(/Search topics/).fill('ThreadLocal');
  await expect(page.getByTestId('module-m06')).toBeVisible();
  await expect(page.getByTestId('module-m01')).toHaveCount(0);
});

test('navigation reaches every page', async ({ page }) => {
  await page.goto('/');
  for (const [name, heading] of [
    ['Curriculum', 'Curriculum'],
    ['Coding Lab', 'Coding Lab'],
    ['Interview Arena', 'Interview Arena'],
    ['Revision', 'Revision Center'],
    ['Projects', 'Capstone: LeaveFlow'],
    ['Progress', 'Progress & analytics'],
    ['Settings', 'Settings'],
  ]) {
    await openMenuIfMobile(page);
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name }).click();
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  }
});

test('theme toggle persists and unknown routes show a not-found page', async ({ page }) => {
  await page.goto('/settings');
  await page.getByText('Light', { exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.goto('/nope');
  await expect(page.getByText("That page doesn't exist")).toBeVisible();
});

test('no horizontal page overflow on the main pages', async ({ page }) => {
  for (const path of ['/', '/learn', '/learn/m01/m01-l1', '/lab', '/arena', '/revision', '/progress', '/projects']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(1);
  }
});

test('reduced motion is respected', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/learn/m01/m01-l1');
  const duration = await page.evaluate(() => {
    const el = document.createElement('div');
    el.className = 'animate-rise';
    document.body.appendChild(el);
    return getComputedStyle(el).animationDuration;
  });
  expect(parseFloat(duration)).toBeLessThan(0.01);
  await ctx.close();
});
