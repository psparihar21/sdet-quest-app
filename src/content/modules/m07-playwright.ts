import { opts, type ModuleBundle } from '../bundle';
import { VIDEOS } from '../videos';
import { OUTLINE } from '../outline';

const meta = OUTLINE.find((m) => m.id === 'm07')!;

export const m07: ModuleBundle = {
  module: {
    ...meta,
    lessons: [
      {
        id: 'm07-l1',
        title: 'Architecture: Browser, BrowserContext, Page',
        minutes: 30,
        sections: [
          {
            kind: 'learn',
            title: 'Not "another Selenium"',
            body: `Playwright Test is a **test runner + browser automation library** in one. It talks to browsers over a persistent connection (CDP for Chromium, patched protocols for Firefox and WebKit) instead of one HTTP request per command, and it ships its own browser builds.

| Object | What it is | Cost |
|---|---|---|
| **Browser** | A launched Chromium/Firefox/WebKit process | Expensive — reused per worker |
| **BrowserContext** | An isolated, incognito-like profile: cookies, storage, permissions, viewport | Cheap (ms) — **a new one per test** |
| **Page** | A tab inside a context | Cheap |

Every test gets a fresh context through the built-in \`page\` / \`context\` fixtures. That isolation is why Playwright tests can run in parallel without leaking logins or cookies — and why two users in one test is easy.

~~~ts
import { test, expect } from '@playwright/test';

test('employee applies for leave', async ({ page }) => {
  await page.goto('/leave/apply');
  await page.getByLabel('Leave type').selectOption('CASUAL');
  await page.getByLabel('From').fill('2026-11-02');
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByRole('status')).toHaveText('Leave applied');
});
~~~

**TypeScript essentials for this code:** \`async/await\` (every browser action returns a Promise — forgetting await is the #1 beginner bug), \`const\`/\`let\` (never \`var\`: function-scoped and hoisted), arrow functions, destructuring \`({ page })\`.`,
          },
          { kind: 'visual', title: 'Context isolation', vizId: 'browser-context', caption: 'Two users, two contexts, one browser.' },
          { kind: 'video', title: 'Watch: official Playwright getting started', video: VIDEOS.playwrightStart },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m07-q1', 'm07-q2', 'm07-q3'] },
        ],
      },
      {
        id: 'm07-l2',
        title: 'Locators, auto-waiting and web-first assertions',
        minutes: 30,
        sections: [
          {
            kind: 'learn',
            title: 'Why Playwright tests flake less',
            body: `**Locators are lazy and re-resolved** on every action, so there is no "stale element". **Actionability checks** run before each action: attached, visible, stable (not animating), enabled, receives events (not covered). **Web-first assertions** (\`await expect(locator).toHaveText(...)\`) retry until the timeout.

**Locator priority:**
1. \`getByRole('button', { name: 'Approve' })\` — what users and assistive tech see
2. \`getByLabel\`, \`getByPlaceholder\`, \`getByText\`
3. \`getByTestId('leave-row')\` (configure testIdAttribute)
4. CSS/XPath — last resort

**Strictness:** an action on a locator that matches several elements throws. Narrow it: \`.filter({ hasText: 'Asha' })\`, chaining (\`row.getByRole('button')\`), \`.first()\` only when order is meaningful.

~~~ts
const row = page.getByRole('row').filter({ hasText: 'Asha Rao' }).filter({ hasText: 'PENDING' });
await row.getByRole('button', { name: 'Approve' }).click();
await expect(row).toContainText('APPROVED');          // retries until true or timeout

// Anti-patterns
await page.waitForTimeout(3000);                       // fixed sleep
expect(await page.locator('.toast').isVisible()).toBe(true); // no retry: checks once
~~~

**Soft assertions** (\`expect.soft\`) record failures and continue. **Custom timeouts:** \`expect(x).toBeVisible({ timeout: 10_000 })\`. \`expect.poll(() => api.status(id)).toBe('APPROVED')\` polls any async function — great for eventually consistent backends.`,
          },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m07-q4', 'm07-q5', 'm07-q6'] },
        ],
      },
      {
        id: 'm07-l3',
        title: 'Fixtures, auth state, network mocking and API testing',
        minutes: 35,
        sections: [
          {
            kind: 'learn',
            title: 'Fixtures and authentication',
            body: `**Fixtures** replace before/after hooks with composable, lazily created dependencies. A test only pays for the fixtures it requests.

~~~ts
type Fixtures = { leavePage: LeavePage; employeeApi: APIRequestContext };

export const test = base.extend<Fixtures>({
  leavePage: async ({ page }, use) => {
    const lp = new LeavePage(page);
    await lp.goto();
    await use(lp);                       // test runs here
  },
  employeeApi: async ({ playwright }, use) => {
    const api = await playwright.request.newContext({ baseURL: process.env.API_URL, storageState: '.auth/employee.json' });
    await use(api);
    await api.dispose();                 // teardown
  },
});
~~~

Fixture scopes: \`test\` (default) or \`worker\` (shared by all tests in a worker — e.g. a seeded tenant).

**Authentication once, reuse everywhere:** a *setup project* logs in per role and saves \`storageState\`; other projects depend on it.

~~~ts
// auth.setup.ts
setup('login as manager', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.MANAGER_EMAIL!);
  await page.getByLabel('Password').fill(process.env.MANAGER_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.context().storageState({ path: '.auth/manager.json' });
});
// playwright.config.ts → projects: [{ name: 'setup', testMatch: /.*\\.setup\\.ts/ },
//   { name: 'chromium', dependencies: ['setup'], use: { storageState: '.auth/manager.json' } }]
~~~

Keep \`.auth/\` out of git — it contains live session cookies.`,
          },
          {
            kind: 'learn',
            title: 'Network interception and API testing',
            body: `~~~ts
// Mock an edge case the backend can't easily produce
await page.route('**/api/leave/balance', (route) =>
  route.fulfill({ status: 200, json: { CASUAL: 0, EARNED: 0.5 } }));

// Modify a real response
await page.route('**/api/holidays', async (route) => {
  const res = await route.fetch();
  const json = await res.json();
  await route.fulfill({ response: res, json: [...json, { date: '2026-11-03', name: 'Test holiday' }] });
});

// Simulate failures
await page.route('**/api/leave', (route) => route.abort('failed'));

// Wait for a specific call
const resp = page.waitForResponse((r) => r.url().includes('/api/leave') && r.request().method() === 'POST');
await page.getByRole('button', { name: 'Apply' }).click();
expect((await resp).status()).toBe(201);
~~~

**API testing** uses the \`request\` fixture (APIRequestContext) — no browser needed, shares cookies with the context when you use \`page.request\`:

~~~ts
test('POST /leave returns 201 and the new id', async ({ request }) => {
  const res = await request.post('/api/leave', { data: { type: 'CASUAL', from: '2026-11-02', days: 1 } });
  expect(res.status()).toBe(201);
  expect(await res.json()).toMatchObject({ status: 'PENDING' });
});
~~~

A strong pattern: **set up data through the API, verify through the UI** in the same test.`,
          },
          { kind: 'video', title: 'Watch: Playwright API testing in TypeScript', video: VIDEOS.pwApi },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m07-q7', 'm07-q8', 'm07-q9'] },
          { kind: 'interview', title: 'Interview drill', interviewId: 'iv-m07-fixtures' },
        ],
      },
      {
        id: 'm07-l4',
        title: 'Config, projects, parallelism, sharding, debugging, CI',
        minutes: 30,
        sections: [
          {
            kind: 'learn',
            title: 'Running at scale',
            body: `~~~ts
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,                  // tests inside a file run in parallel too
  workers: process.env.CI ? 4 : undefined,
  retries: process.env.CI ? 1 : 0,      // retried passes are reported as "flaky"
  reporter: [['html'], ['junit', { outputFile: 'results.xml' }], ['blob']],
  use: { baseURL: process.env.BASE_URL, trace: 'on-first-retry', screenshot: 'only-on-failure', video: 'retain-on-failure' },
  projects: [
    { name: 'setup', testMatch: /.*\\.setup\\.ts/ },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, dependencies: ['setup'] },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] }, dependencies: ['setup'] },
    { name: 'mobile',   use: { ...devices['Pixel 7'] }, dependencies: ['setup'] },
  ],
});
~~~

- **Configuration** lives in playwright.config.ts: global \`use\` options (baseURL, trace, screenshot, video, viewport, locale, timezone), timeouts, retries, reporters and projects; projects override \`use\` per browser/device/role.
- **Evidence:** screenshots (\`screenshot: 'only-on-failure'\`, or \`page.screenshot({ fullPage: true })\`, \`locator.screenshot()\`), videos (\`video: 'retain-on-failure'\`) and traces are attached to the report automatically.
- **Reporting:** built-in list, line, dot, html, json, junit and blob reporters (combine several); third-party Allure; custom reporters implement the Reporter interface to push results to a dashboard.
- **Workers** are separate processes on one machine; **sharding** splits the suite across machines: \`npx playwright test --shard=2/4\`, then \`npx playwright merge-reports\` on the blob reports.
- **Annotations & tags:** \`test.skip\`, \`test.fixme\`, \`test.fail\`, \`test.slow\`, \`test('…', { tag: '@smoke' }, …)\` → \`--grep @smoke\`.
- **Debugging:** \`--ui\` (UI mode with time-travel), \`--debug\` (inspector), \`PWDEBUG=1\`, and the **trace viewer** — DOM snapshots, network, console and actions for every step: \`npx playwright show-trace trace.zip\`.
- **Codegen:** \`npx playwright codegen <url>\` records locators — a starting point, not a test design.
- **Downloads/uploads:** \`const d = await page.waitForEvent('download')\`; \`setInputFiles('input[type=file]', 'proof.pdf')\`. **Multiple tabs:** \`const popup = await page.waitForEvent('popup')\`. **Frames:** \`page.frameLocator('#payslip').getByText(...)\`.
- **CI & Docker:** use the official \`mcr.microsoft.com/playwright\` image or \`npx playwright install --with-deps\`; upload the HTML report and traces as artifacts.`,
          },
          { kind: 'visual', title: 'Workers and shards', vizId: 'sharded-runner', caption: 'How 600 tests become a 5-minute run.' },
          {
            kind: 'learn',
            title: 'Parallel execution: workers, modes and isolation',
            body: `Playwright runs test **files** in parallel across **worker processes** by default; tests inside one file run in order in the same worker.

| Setting | Effect |
|---|---|
| \`workers: 4\` / \`--workers=50%\` | How many OS processes run tests at once (CI often 1–4 per machine) |
| \`fullyParallel: true\` | Tests *within* a file also spread across workers |
| \`test.describe.configure({ mode: 'serial' })\` | Run a group in order; a failure skips the rest — use rarely |
| \`--shard=2/4\` | Split the whole suite across machines; combine with workers inside each |

Every test gets a **fresh BrowserContext**, so cookies and storage never leak — but **your data** can. Parallel execution fails when tests share a mutable account or record. Fixes: unique data per test (\`testInfo.workerIndex\` / a uuid in names), **worker-scoped fixtures** for expensive setup (one account per worker), and API-based setup/cleanup.

~~~ts
export const test = base.extend<{}, { account: Account }>({
  account: [async ({}, use, workerInfo) => {
    const acc = await createAccount(\`qa-worker-\${workerInfo.workerIndex}\`);
    await use(acc);
    await deleteAccount(acc.id);
  }, { scope: 'worker' }],
});
~~~

Symptoms of an isolation bug: passes with \`--workers=1\`, fails in parallel or in a different order. Re-run with \`--repeat-each\` and \`--workers=1\` to confirm.`,
          },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m07-q10', 'm07-q11', 'm07-q12'] },
          {
            kind: 'build',
            title: 'Build a Playwright starter for LeaveFlow',
            task: 'Create a Playwright TypeScript project with: a setup project that saves storageState for employee and manager, a LeavePage page object, a fixture that provides it, one multi-user test (employee applies in one context, manager approves in another), one API test, and a config with chromium + mobile projects, traces on first retry and an HTML + JUnit reporter.',
            acceptance: [
              'No UI login inside regular tests (storageState used)',
              'Two BrowserContexts in the multi-user test',
              'Only role/label/test-id locators',
              'No waitForTimeout anywhere',
              'Credentials read from environment variables, .auth/ in .gitignore',
            ],
          },
        ],
      },
    ],
  },
  questions: [
    {
      id: 'm07-q12', skill: 'playwright', moduleId: 'm07', type: 'scenario', difficulty: 3,
      prompt: 'A suite passes with --workers=1 but fails randomly with 4 workers. What is the most likely cause and fix?',
      options: opts('Playwright is unstable in parallel; keep workers at 1', 'Tests share mutable data (e.g. the same account); give each worker or test its own data via fixtures', 'Browsers need more sleep between steps', 'Contexts leak cookies between tests; add manual logout'),
      answer: ['b'],
      explanation: 'Each test already gets a fresh context, so the leak is almost always shared server-side data. Worker-scoped fixtures or unique data per test fix it.',
    },
    {
      id: 'm07-q1', skill: 'playwright', moduleId: 'm07', type: 'mcq', difficulty: 1,
      prompt: 'What does a Playwright BrowserContext give each test?',
      options: opts('A new browser process', 'An isolated session (cookies, storage, permissions) inside a shared browser', 'A new operating system user', 'A mocked network'),
      answer: ['b'],
      explanation: 'Contexts are cheap incognito-like profiles. Launching a browser per test would be slow.',
    },
    {
      id: 'm07-q2', skill: 'playwright', moduleId: 'm07', type: 'mcq', difficulty: 2,
      prompt: 'You need an employee and a manager logged in simultaneously in one test. How?',
      options: opts('Two tabs in the same context', 'Two browser contexts, each with its own storageState', 'Log out and in between steps', 'Two separate test files'),
      answer: ['b'],
      explanation: 'Tabs share a context\'s cookies, so both would be the same user. Separate contexts are separate sessions.',
    },
    {
      id: 'm07-q3', skill: 'playwright', moduleId: 'm07', type: 'debug', difficulty: 2, codeLang: 'ts',
      prompt: 'This test passes even when the toast never appears. Why?',
      code: `test('shows toast', async ({ page }) => {
  page.getByRole('button', { name: 'Apply' }).click();
  expect(page.getByText('Leave applied')).toBeVisible();
});`,
      options: opts('getByText is case-sensitive', 'Missing await: the promises are never awaited, so the test ends before they run or fail', 'toBeVisible needs a timeout', 'getByRole needs exact: true'),
      answer: ['b'],
      explanation: 'Unawaited promises let the test function resolve immediately. The @typescript-eslint/no-floating-promises rule catches this.',
    },
    {
      id: 'm07-q4', skill: 'playwright', moduleId: 'm07', type: 'mcq', difficulty: 2,
      prompt: 'Which assertion retries until it passes or times out?',
      options: opts("expect(await page.locator('.toast').isVisible()).toBe(true)", "await expect(page.locator('.toast')).toBeVisible()", "expect(page.locator('.toast')).toBeTruthy()", 'assert(page.locator(".toast"))'),
      answer: ['b'],
      explanation: 'Web-first assertions take a locator and re-check it. isVisible() returns a snapshot boolean once.',
    },
    {
      id: 'm07-q5', skill: 'playwright', moduleId: 'm07', type: 'mcq', difficulty: 2,
      prompt: '`page.getByRole("button", { name: "Approve" }).click()` throws "strict mode violation". Why?',
      options: opts('The button is disabled', 'The locator matches more than one element', 'getByRole is deprecated', 'The page is in a frame'),
      answer: ['b'],
      explanation: 'Playwright refuses to guess. Scope it: rows.filter({ hasText }).getByRole(...).',
    },
    {
      id: 'm07-q6', skill: 'playwright', moduleId: 'm07', type: 'multi', difficulty: 2,
      prompt: 'Which checks does Playwright perform before click()?',
      options: opts('Element is attached', 'Element is visible', 'Element is stable (not animating)', 'Element receives events (not covered)', 'The API behind the button returned 200'),
      answer: ['a', 'b', 'c', 'd'],
      explanation: 'Actionability checks are about the element; backend results are your assertions\' job.',
    },
    {
      id: 'm07-q7', skill: 'playwright', moduleId: 'm07', type: 'mcq', difficulty: 2,
      prompt: 'Fastest reliable way to start 200 tests already logged in?',
      options: opts('Log in through the UI in beforeEach', 'A setup project saves storageState per role; tests load it', 'Disable authentication in the test environment', 'Share one page across all tests'),
      answer: ['b'],
      explanation: 'Log in once per role, reuse cookies/storage. Disabling auth tests a different system.',
    },
    {
      id: 'm07-q8', skill: 'playwright', moduleId: 'm07', type: 'mcq', difficulty: 3,
      prompt: 'How do you test the UI when the balance API returns 500, without breaking the backend?',
      options: opts('Ask devs to deploy a broken build', 'page.route on the balance endpoint and fulfill with status 500', 'Stop the database', 'It can\'t be tested'),
      answer: ['b'],
      explanation: 'Network interception lets you produce rare states deterministically and assert the error UI.',
    },
    {
      id: 'm07-q9', skill: 'playwright', moduleId: 'm07', type: 'mcq', difficulty: 2,
      prompt: 'Main benefit of fixtures over beforeEach hooks?',
      options: opts('They run faster in every case', 'Composable, typed, lazily created per test with built-in teardown after use()', 'They remove the need for assertions', 'They replace the config file'),
      answer: ['b'],
      explanation: 'A test only gets what it asks for, and setup/teardown live together around use().',
    },
    {
      id: 'm07-q10', skill: 'playwright', moduleId: 'm07', type: 'mcq', difficulty: 2,
      prompt: 'Workers vs sharding?',
      options: opts('Same thing', 'Workers = parallel processes on one machine; sharding = splitting the suite across machines', 'Workers are for API tests only', 'Sharding retries failed tests'),
      answer: ['b'],
      explanation: 'Combine them: e.g. 4 shards × 4 workers, then merge blob reports.',
    },
    {
      id: 'm07-q11', skill: 'playwright', moduleId: 'm07', type: 'mcq', difficulty: 2,
      prompt: 'A test failed only in CI. What is the most useful artifact?',
      options: opts('The console output only', 'The Playwright trace (actions, DOM snapshots, network, console)', 'A screenshot of the CI dashboard', 'The package-lock.json'),
      answer: ['b'],
      explanation: 'Trace viewer lets you time-travel through the failing run. Configure trace: "on-first-retry" or "retain-on-failure".',
    },
  ],
  problems: [],
  interviews: [
    {
      id: 'iv-m07-fixtures', modes: ['automation', 'full-sdet3'], skill: 'playwright', level: 'L3', kind: 'technical',
      prompt: 'How do you handle authentication and test isolation in a Playwright suite with three user roles?',
      rubric: [
        { id: 'context', point: 'Each test gets a fresh BrowserContext', any: ['browsercontext', 'browser context', 'context', 'isolat'] },
        { id: 'state', point: 'Save storageState per role in a setup project', any: ['storagestate', 'storage state', 'setup project', 'global setup'] },
        { id: 'deps', point: 'Projects depend on setup / use per-role state', any: ['dependencies', 'project', 'per role', 'each role'] },
        { id: 'multi', point: 'Multi-role tests use multiple contexts', any: ['two contexts', 'multiple contexts', 'new context', 'newcontext'] },
        { id: 'secrets', point: 'Credentials from env; auth files not committed', any: ['environment variable', 'env', 'secret', 'gitignore', 'not commit'] },
        { id: 'data', point: 'Isolated test data per test/worker', any: ['test data', 'worker', 'unique', 'parallel'] },
      ],
      structure: 'Isolation model → auth setup → multi-role → data → security of auth state.',
      modelAnswer: '"Playwright gives each test a new BrowserContext, so cookies and storage never leak. For three roles I add a setup project that logs in once per role through the UI or API and saves storageState to .auth/employee.json, manager.json and admin.json. Test projects depend on setup and load the right state; for workflows that need two roles, the test creates a second context with the other state. Credentials come from environment variables or the CI secret store and .auth/ is git-ignored because it holds live sessions. Data is created per test with unique names so workers can run in parallel."',
      followUp: 'Sessions expire after 30 minutes and your nightly run takes 50. What do you do?',
      revision: ['m07'],
    },
  ],
  flashcards: [
    { id: 'fc-m07-1', skill: 'playwright', moduleId: 'm07', front: 'Browser vs BrowserContext vs Page', back: 'Process (expensive, shared) → isolated session (cheap, per test) → tab.' },
    { id: 'fc-m07-2', skill: 'playwright', moduleId: 'm07', front: 'Locator priority', back: 'getByRole → getByLabel/Text/Placeholder → getByTestId → CSS/XPath.' },
    { id: 'fc-m07-3', skill: 'playwright', moduleId: 'm07', front: 'Reuse login across tests', back: 'Setup project saves storageState; projects depend on it and load it.' },
    { id: 'fc-m07-4', skill: 'playwright', moduleId: 'm07', front: 'Split a suite across 4 CI machines', back: '--shard=i/4 on each, then merge-reports on the blob outputs.' },
    { id: 'fc-m07-5', skill: 'playwright', moduleId: 'm07', front: 'const vs let vs var', back: 'const: block-scoped, no reassignment. let: block-scoped, reassignable. var: function-scoped, hoisted — avoid.' },
  ],
};
