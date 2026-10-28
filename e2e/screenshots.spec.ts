import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';

// Regenerates the README screenshots in docs/screenshots. Skipped in normal runs.
// Run: SCREENSHOTS=1 npx playwright test e2e/screenshots.spec.ts --project=desktop
test.skip(!process.env.SCREENSHOTS, 'set SCREENSHOTS=1 to regenerate README screenshots');
test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });

const out = (name: string) => path.resolve('docs/screenshots', `${name}.jpg`);
const shot = (page: Page, name: string) => page.screenshot({ path: out(name), type: 'jpeg', quality: 85 });

async function answer(page: Page, qid: string, option: RegExp) {
  const q = page.getByTestId(`question-${qid}`);
  await q.getByRole('radio', { name: option }).click();
  await q.getByRole('button', { name: 'Check answer' }).click();
}

test('capture README screenshots', async ({ page }) => {
  test.setTimeout(120_000);
  // Demo data: the public example profile pack plus a few real answers, so pages aren't empty.
  await page.goto('/settings');
  await page.locator('#pack-file').setInputFiles(path.resolve('profile.example.json'));
  await expect(page.getByText(/Profile pack imported/)).toBeVisible();

  await page.goto('/learn/m01/m01-l1');
  await page.getByRole('button', { name: /Step 2, Visualize/ }).click();
  await page.getByRole('button', { name: 'Healthy pyramid' }).click();
  await shot(page, 'lesson-visual');

  await page.getByRole('button', { name: /Step 3, Understand/ }).click();
  await answer(page, 'm01-q1', /Unit tests/);
  await answer(page, 'm01-q3', /Add a retry/);
  await page.getByTestId('question-m01-q1').getByText(/show a strong answer/).click();
  await page.getByTestId('question-m01-q1').scrollIntoViewIfNeeded();
  await shot(page, 'quiz-feedback');

  await page.goto('/lab/js-find-duplicates');
  const editor = page.getByRole('textbox', { name: /Code editor/ });
  await editor.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Delete');
  // One line: CodeMirror auto-closes brackets, which would double them if typed across lines.
  await editor.pressSequentially('function findDuplicates(ids) { const seen = new Set(), dupes = new Set(); for (const id of ids) { if (seen.has(id)) dupes.add(id); else seen.add(id); } return [...dupes]; }');
  await page.getByRole('button', { name: 'Run tests' }).click();
  await expect(page.getByText(/5\/5 tests passed/)).toBeVisible({ timeout: 10_000 });
  await shot(page, 'coding-lab');

  await page.goto('/lab/sql-duplicate-attendance');
  const sql = page.getByRole('textbox', { name: /SQL editor/ });
  await sql.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Delete');
  await sql.pressSequentially('SELECT employee_id, work_date, COUNT(*) AS rows_for_day FROM attendance GROUP BY employee_id, work_date HAVING COUNT(*) > 1');
  await page.getByRole('button', { name: 'Submit & check' }).click();
  await expect(page.getByText('Correct — result matches.')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Show solution & explanation' }).click();
  await shot(page, 'sql-lab');

  await page.goto('/learn/m01/m01-l1');
  await page.getByRole('button', { name: /Step 7, Interview/ }).click();
  await page.getByLabel(/Your answer/).fill(
    'First, the pyramid is inverted: too many UI tests. I would push business-rule checks down to API and unit tests, keep a few critical-path journeys as E2E, and quarantine flaky tests with an owner. For example, target CI under 15 minutes and a flaky rate under 2%. However this costs developer time, so I would phase it over a quarter and report progress weekly.',
  );
  await page.getByRole('button', { name: 'Submit answer' }).click();
  await expect(page.getByText('Technical correctness')).toBeVisible();
  await page.getByRole('heading', { name: 'Feedback' }).scrollIntoViewIfNeeded();
  await shot(page, 'interview-feedback');

  await page.goto('/');
  await shot(page, 'dashboard');

  await page.goto('/learn');
  await shot(page, 'curriculum');

  await page.goto('/revision');
  await page.getByRole('tab', { name: /Weakness queue/ }).click();
  await shot(page, 'revision');

  await page.goto('/progress');
  await page.getByRole('heading', { name: 'Skill tree' }).scrollIntoViewIfNeeded();
  await shot(page, 'progress');

  await page.goto('/settings');
  await page.getByText('Light', { exact: true }).click();
  await page.goto('/');
  await shot(page, 'dashboard-light');
  await page.goto('/settings');
  await page.getByText('Dark', { exact: true }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/learn/m01/m01-l1');
  await shot(page, 'mobile-lesson');
});
