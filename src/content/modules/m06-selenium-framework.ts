import { opts, type ModuleBundle } from '../bundle';
import { VIDEOS } from '../videos';
import { OUTLINE } from '../outline';

const meta = OUTLINE.find((m) => m.id === 'm06')!;

export const m06: ModuleBundle = {
  module: {
    ...meta,
    lessons: [
      {
        id: 'm06-l1',
        title: 'Layers of a production Selenium framework',
        minutes: 35,
        sections: [
          {
            kind: 'learn',
            title: 'The layered architecture',
            body: `~~~text
tests/            LeaveApprovalTest  — intent only: arrange, act, assert
flows/            LeaveFlows.applyAndApprove(...) — multi-page business steps
pages/components  LeavePage, ApprovalsPage, DatePickerComponent, ToastComponent
core/             DriverFactory (ThreadLocal), Waits, Config, Logger, Screenshot
data/             TestDataFactory, API-based setup, builders, cleanup registry
clients/          ApiClient (REST Assured), DbClient (JDBC, read-only)
reporting/        Listeners → Allure/Extent, screenshots, logs, video links
config/           env.properties per environment + -Denv / env vars for secrets
~~~

**Page Object Model:** one class per page, private locators, public methods named after user intent (applyLeave, not clickButton3). Return the next page object for fluent chains. **Assertions stay in tests**, not page objects — pages can expose state (getToastText()).

**PageFactory (@FindBy + initElements)** is legacy: proxies make elements lazily but complicate debugging and stale handling. Most teams now prefer plain By locators.

**Component objects** model reusable widgets (date pickers, tables, modals) used by many pages — composition over deep inheritance.

**Config & environments:** one place resolves base URLs, timeouts, browser and credentials from \`-Denv=qa\` plus environment variables; secrets come from CI secret stores, never committed.

**Test data:** create through APIs (fast, reliable), not the UI; unique IDs per test; track what you create and clean it up. Data-driven tests use TestNG @DataProvider (parallel = true when data is independent).`,
          },
          { kind: 'video', title: 'Watch: building a POM framework (long, watch selectively)', video: VIDEOS.pomFramework },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m06-q1', 'm06-q2', 'm06-q3'] },
        ],
      },
      {
        id: 'm06-l2',
        title: 'Parallelism, retries, reporting and failure handling',
        minutes: 30,
        sections: [
          {
            kind: 'learn',
            title: 'Running fast without lying',
            body: `**TestNG parallelism:** \`<suite parallel="methods" thread-count="6">\` (or classes/tests). Requirements: a ThreadLocal driver, no shared mutable statics, independent data, @AfterMethod(alwaysRun = true) cleanup.

**Grid/Docker/cloud:** RemoteWebDriver to Selenium Grid in docker-compose (selenium/hub + node images) or a vendor like BrowserStack for real devices and browser matrices. Capabilities select browser/OS.

**Retries:** IRetryAnalyzer can re-run a failed test once — **but log every retry** and report "passed on retry" as flaky, never as a clean pass. Retries without tracking turn a flaky suite into a lying suite.

**Failure handling:** an ITestListener onTestFailure hook captures screenshot, page source, current URL, browser console logs and the test's data IDs, and attaches them to the report.

**Reporting:** Allure or ExtentReports with steps, attachments and history; JUnit XML for CI. Tag tests (@Test(groups = {"smoke", "leave"})) so CI can run slices.

**CI integration:** \`mvn test -Dgroups=smoke -Denv=qa\` in Jenkins/GitHub Actions, publish reports as artifacts, fail the stage on failures.

**API + DB in the same framework:** UI tests set up data through ApiClient and verify side effects through DbClient — so one UI journey checks the screen, the API and the stored state.`,
          },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m06-q4', 'm06-q5', 'm06-q6'] },
          {
            kind: 'build',
            title: 'Design the framework yourself',
            task: `Your team is starting UI automation for the LeaveFlow HR admin panel in Java. Write the design: folder/package structure, the five most important classes and their responsibilities, how drivers are created per thread, how config and secrets are handled, how test data is created and cleaned up, how failures are reported, and how it runs in CI in parallel.`,
            acceptance: [
              'Clear layers: tests / flows / pages+components / core / data / clients / reporting',
              'ThreadLocal driver factory with remote (Grid/cloud) support',
              'Config per environment, secrets from environment/CI only',
              'API-based data setup with unique data and cleanup',
              'Listener capturing screenshot, logs and data on failure',
              'Retry policy that reports flakiness instead of hiding it',
            ],
          },
          { kind: 'interview', title: 'Interview drill', interviewId: 'iv-m06-framework' },
        ],
      },
    ],
  },
  questions: [
    {
      id: 'm06-q1', skill: 'framework', moduleId: 'm06', type: 'mcq', difficulty: 2,
      prompt: 'Where should assertions live in a POM framework?',
      options: opts('Inside page object methods', 'In the tests; pages expose state and actions', 'In the driver factory', 'In the reporting listener'),
      answer: ['b'],
      explanation: 'Pages model the UI; tests decide what\'s correct. Assertions in pages hide intent and make pages hard to reuse for negative tests.',
    },
    {
      id: 'm06-q2', skill: 'framework', moduleId: 'm06', type: 'mcq', difficulty: 2,
      prompt: 'A date picker appears on 9 pages. Best modelling?',
      options: opts('Copy the locators into each page', 'A DatePickerComponent used by those pages (composition)', 'Make all 9 pages extend DatePickerPage', 'Put it in BaseTest'),
      answer: ['b'],
      explanation: 'Component objects keep one implementation for a reusable widget. Inheritance for a widget creates awkward hierarchies.',
    },
    {
      id: 'm06-q3', skill: 'framework', moduleId: 'm06', type: 'mcq', difficulty: 2,
      prompt: 'Best way to create 20 employees with leave balances before a UI test?',
      options: opts('Through the UI admin screens in @BeforeClass', 'Through the API (or a seed service), with unique names and tracked cleanup', 'Reuse production data', 'Insert directly into the prod database'),
      answer: ['b'],
      explanation: 'API setup is fast and stable; UI setup is slow and adds failure points unrelated to what you test.',
    },
    {
      id: 'm06-q4', skill: 'framework', moduleId: 'm06', type: 'scenario', difficulty: 3,
      prompt: 'Your manager suggests adding retryAnalyzer with 3 retries to every test to "fix" flakiness. Best response?',
      options: opts('Agree — green builds matter most', 'Allow at most one retry, report "passed on retry" as flaky with an owner, and fix root causes', 'Refuse all retries', 'Retry until it passes'),
      answer: ['b'],
      explanation: 'Limited, visible retries keep CI usable while making flakiness measurable. Silent retries hide real intermittent bugs (race conditions often are real bugs).',
    },
    {
      id: 'm06-q5', skill: 'framework', moduleId: 'm06', type: 'multi', difficulty: 2,
      prompt: 'What should a failure listener attach to the report?',
      options: opts('Screenshot', 'Page source / DOM snapshot', 'Browser console logs', 'The test data IDs used', 'The database password'),
      answer: ['a', 'b', 'c', 'd'],
      explanation: 'Enough evidence to triage without rerunning. Never secrets.',
    },
    {
      id: 'm06-q6', skill: 'framework', moduleId: 'm06', type: 'mcq', difficulty: 2,
      prompt: 'Why is @AfterMethod(alwaysRun = true) used for driver.quit()?',
      options: opts('So teardown runs even if the test or a dependency failed, avoiding leaked browsers', 'It makes tests faster', 'It is required by Grid', 'It retries failed tests'),
      answer: ['a'],
      explanation: 'Without alwaysRun, skipped/failed configurations can skip teardown and leave sessions open — painful on a Grid with limited slots.',
    },
  ],
  problems: [],
  interviews: [
    {
      id: 'iv-m06-framework', modes: ['framework', 'automation', 'full-sdet3'], skill: 'framework', level: 'L4', kind: 'design',
      prompt: 'Walk me through the architecture of the UI automation framework you work with. What would you change if you rebuilt it?',
      cvGrounded: true,
      rubric: [
        { id: 'layers', point: 'Clear layers (tests, pages/components, core, data, reporting)', any: ['layer', 'page object', 'pom', 'component', 'base page', 'utilities'] },
        { id: 'driver', point: 'Driver management and parallel execution', any: ['threadlocal', 'thread local', 'driver factory', 'parallel', 'grid'] },
        { id: 'data', point: 'Test data strategy', any: ['test data', 'data provider', 'api setup', 'cleanup', 'seed'] },
        { id: 'config', point: 'Config/environments/secrets', any: ['config', 'environment', 'properties', 'secret'] },
        { id: 'report', point: 'Reporting and failure evidence', any: ['report', 'allure', 'extent', 'screenshot', 'listener'] },
        { id: 'ci', point: 'CI integration and tagging', any: ['jenkins', 'github actions', 'pipeline', 'ci', 'groups', 'tag'] },
        { id: 'improve', point: 'Honest improvements with reasons', any: ['would change', 'improve', 'next time', 'trade off', 'tradeoff', 'migrate', 'playwright'] },
      ],
      structure: 'Context (product, size) → layers → how a test runs end to end → CI → one or two things you\'d change and why.',
      modelAnswer: `"(Use your own framework.) For example: our HR product suite is Java + TestNG + Selenium with page objects per screen and component classes for shared widgets. A ThreadLocal driver factory supports local and remote runs; TestNG runs methods in parallel. Data is created through APIs before each test and cleaned up after. Config comes from per-environment properties with secrets injected by Jenkins. A listener attaches screenshots and logs to the report, and Jenkins runs smoke on every deploy and regression nightly.

If I rebuilt it I'd move more business-rule checks from UI to API tests, replace silent retries with visible flaky tracking, and use Playwright for new UI suites because of its isolation and trace viewer — which is the migration we started."`,
      followUp: 'How do you keep 500+ tests maintainable when the UI changes every sprint?',
      revision: ['m06', 'm10'],
    },
  ],
  flashcards: [
    { id: 'fc-m06-1', skill: 'framework', moduleId: 'm06', front: 'Page object golden rules', back: 'Private locators, intent-named public methods, no assertions, return next page.' },
    { id: 'fc-m06-2', skill: 'framework', moduleId: 'm06', front: 'Retries done right', back: 'Max one, logged and reported as flaky with an owner; never silent.' },
    { id: 'fc-m06-3', skill: 'framework', moduleId: 'm06', front: 'Fastest reliable test-data setup', back: 'Through APIs/seed services with unique IDs and tracked cleanup — not the UI.' },
  ],
};
