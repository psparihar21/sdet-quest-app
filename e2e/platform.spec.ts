import { expect, test } from '@playwright/test';
import path from 'node:path';

test('importing a profile pack seeds weaknesses and due revision', async ({ page }) => {
  await page.goto('/settings');
  await page.locator('#pack-file').setInputFiles(path.resolve('profile.example.json'));
  await expect(page.getByText(/Profile pack imported: 1 diagnostic scores and 1 self-ratings/)).toBeVisible();

  await page.goto('/revision');
  await expect(page.getByRole('tab', { name: /Due now/ })).toContainText('2');
  await page.getByRole('tab', { name: /Weakness queue/ }).click();
  await expect(page.getByText('Test pyramid', { exact: true })).toBeVisible();
  await expect(page.getByText('Coding patterns', { exact: true })).toBeVisible();
});

test('an invalid profile pack is rejected with a clear message', async ({ page }) => {
  await page.goto('/settings');
  await page.locator('#pack-file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"kind":"nope"}') });
  await expect(page.getByText(/isn't a valid profile pack/)).toBeVisible();
});

test('a full arena round asks one question at a time and shows results', async ({ page }) => {
  await page.goto('/arena/dsa');
  for (let i = 0; i < 4; i++) {
    await expect(page.getByText(new RegExp(`Question ${i + 1} of 4`))).toBeVisible();
    await page.getByLabel(/Your answer/).fill('I would use a hash map for O(n) time and O(n) space, test empty input and edge cases, and mention the trade off with sorting.');
    await page.getByRole('button', { name: 'Submit answer' }).click();
    await expect(page.getByText('Technical correctness')).toBeVisible();
    await page.getByRole('button', { name: /Next question|See results/ }).click();
  }
  await expect(page.getByRole('heading', { name: /DSA round — results/ })).toBeVisible();
  await page.goto('/arena');
  await expect(page.getByText(/4\/4 answered/)).toBeVisible();
});

test('STAR stories can be written, saved and persist', async ({ page }) => {
  await page.goto('/arena');
  await page.getByRole('button', { name: 'New STAR story' }).click();
  await page.getByLabel('Story title').fill('Cutting regression time with API tests');
  await page.getByLabel(/Result/).fill('Regression went from [need: hours] to [need: hours].');
  await page.getByRole('button', { name: 'Tell me about a failure' }).click();
  await page.getByRole('button', { name: 'Save story' }).click();
  await page.reload();
  await expect(page.getByText('Cutting regression time with API tests')).toBeVisible();
  await expect(page.getByText(/Prompt coverage 1\/15/)).toBeVisible();
});

test('project tasks can be checked off and persist', async ({ page }) => {
  await page.goto('/projects');
  await page.getByRole('button', { name: 'Done: Write the test strategy' }).click();
  await page.reload();
  await expect(page.getByText('1/18 tasks')).toBeVisible();
});

test('export produces a backup file', async ({ page }) => {
  await page.goto('/settings');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^sdet-quest-backup-\d{4}-\d{2}-\d{2}\.json$/);
});

test('every module page and first lesson renders without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (let i = 1; i <= 24; i++) {
    const id = `m${String(i).padStart(2, '0')}`;
    await page.goto(`/learn/${id}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // The link name starts with the status icon's label ("Not completed"), then "1. <title>".
    await page.getByRole('link', { name: /\b1\. / }).first().click();
    await expect(page.getByText(/Step 1 of/)).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('corrupted saved progress is set aside instead of crashing the app', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('sdet-quest:v1', JSON.stringify({ state: { schemaVersion: 1, attempts: null, stories: 'oops' }, version: 1 }));
      sessionStorage.setItem('seeded', '1');
    }
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Start here' })).toBeVisible();
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys.some((k) => k.startsWith('sdet-quest:v1:corrupt-'))).toBe(true);
});

test('the mobile menu traps focus and closes on Escape', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile-only menu');
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Menu' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
});
