import { opts, type ModuleBundle } from '../bundle';
import { VIDEOS } from '../videos';
import { OUTLINE } from '../outline';

const meta = OUTLINE.find((m) => m.id === 'm10')!;

export const m10: ModuleBundle = {
  module: {
    ...meta,
    lessons: [
      {
        id: 'm10-l1',
        title: 'Patterns: POM, Screenplay, components, data- and keyword-driven',
        minutes: 30,
        sections: [
          {
            kind: 'learn',
            title: 'Pick patterns for the problem, not the CV',
            body: `| Pattern | Idea | Good for | Watch out |
|---|---|---|---|
| **Page Object Model** | One class per page | Most web suites | God-pages with 80 methods |
| **Component model** | Objects per reusable widget | Design systems, SPAs | Over-abstraction |
| **Screenplay** | Actors with abilities perform tasks and ask questions | Large suites, many roles, high reuse | Learning curve, verbosity |
| **Data-driven** | Same flow, many data rows | Validation matrices | Unreadable tests when data hides intent |
| **Keyword-driven** | Tests as keyword tables (Robot Framework) | Non-coders authoring tests | Becomes a bad programming language |
| **Hybrid** | Mix of the above | Reality | Inconsistency without guidelines |
| **BDD (Cucumber)** | Gherkin specs bound to steps | Shared language with business | Step-definition sprawl, slow; only worth it if business reads the specs |

**Dependency injection** (TestNG Guice, Spring, Playwright fixtures) supplies drivers, clients and config to tests instead of tests constructing them — easier parallelism and swapping implementations.

**Layering principle:** tests express *what*; flows/pages/clients express *how*; core handles *infrastructure*. A UI redesign should change pages, not tests. An API version change should change clients, not tests.`,
          },
          { kind: 'video', title: 'Watch: an architecture for web test automation', video: VIDEOS.frameworkArch },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m10-q2', 'm10-q3'] },
        ],
      },
      {
        id: 'm10-l2',
        title: 'Flaky tests: detect, quarantine, fix, prevent',
        minutes: 30,
        sections: [
          {
            kind: 'learn',
            title: 'The senior answer to flakiness',
            body: `**Definition:** a flaky test passes and fails on the **same code** without changes. It is a reliability bug in the test, the environment — or the product (race conditions are real bugs).

**Business impact (say this to a PM):** "Flaky tests are false fire alarms. They waste engineering time on investigations, slow releases, and teach people to ignore red builds — which is how real bugs ship."

**Root-cause categories:**
| Cause | Example | Fix |
|---|---|---|
| Timing / async | Clicking before the list re-renders | Wait on state, not time; web-first assertions |
| Shared state / order | Test B uses data test A changed | Isolated data, no inter-test dependencies |
| Test data collisions | Two workers create "test@x.com" | Unique IDs per test/worker |
| Environment | Shared QA env redeployed mid-run | Ephemeral envs, health checks, contract stubs |
| Locators | Index-based or text that changes | Roles / test IDs |
| Product race | Double-submit creates two requests | Report as a bug — don't retry it away |
| Infrastructure | Grid node out of memory | Resource limits, monitoring |

**Process:**
1. **Detect** — record every run's result per test and commit; a test with both pass and fail on the same commit is flaky. Track flaky rate = flaky runs ÷ total runs.
2. **Quarantine** — move to a non-blocking lane with an owner and an SLA (e.g. fix in 10 working days or delete). Visible, never silent.
3. **Fix the root cause** using traces, logs and reruns with stress (repeat-each).
4. **Prevent** — review checklist (no sleeps, no shared data), lint rules, run new tests 20× before merge.`,
          },
          { kind: 'video', title: 'Watch: 3 reasons Playwright tests flake', video: VIDEOS.flaky },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m10-q1', 'm10-q4', 'm10-q5'] },
          { kind: 'practice', title: 'Detect flaky tests from run history', problemId: 'js-detect-flaky' },
          { kind: 'interview', title: 'Interview drill', interviewId: 'iv-m10-flaky' },
        ],
      },
      {
        id: 'm10-l3',
        title: 'Config, secrets, tagging, selection, ownership, triage',
        minutes: 25,
        sections: [
          {
            kind: 'learn',
            title: 'The operational side of a framework',
            body: `- **Configuration:** one typed config object resolved from defaults → environment file → environment variables → CLI flags. Fail fast on missing values.
- **Secrets:** CI secret store or a vault, injected as environment variables; masked in logs; never in repos, reports or screenshots. Rotate test credentials.
- **Logging:** structured, with a correlation ID per test that is also sent as a request header — then you can find the backend logs for a failed test.
- **Reporting:** one report per run with history and trends (Allure, Playwright HTML + a results store), JUnit XML for CI, and links to traces.
- **Tagging:** @smoke, @regression, @critical, by module/owner (@leave, @team-hr). Tags drive what runs where.
- **Test selection:** PR → unit + API + smoke; merge → impacted E2E (by changed paths/modules); nightly → full regression; pre-release → critical journeys on all browsers.
- **Ownership:** every test has an owning team (CODEOWNERS for test folders); failures route to them.
- **Maintenance:** budget time each sprint, delete tests that never fail and duplicate lower-level coverage, review test code like product code.
- **Failure triage:** classify each failure — product bug / test bug / environment / data / flaky — within a day. Track the classification; it tells you where to invest.`,
          },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m10-q6', 'm10-q7'] },
          {
            kind: 'build',
            title: 'Whiteboard: design an automation framework for our company',
            task: 'Company: 40 engineers, 6 squads, a React web app, Java microservices, Kafka, PostgreSQL, GitHub Actions. Design the automation framework(s): layers, tools per layer (UI/API/contract), data strategy, config/secrets, tagging and test selection per pipeline stage, reporting and triage, flaky policy, ownership, and a 3-month rollout plan. Draw the diagram in your notes as boxes and arrows.',
            acceptance: [
              'Separate UI, API and contract layers with tool choices justified',
              'Test pyramid targets with rough numbers',
              'Data strategy that supports parallel runs',
              'Pipeline stages with what runs where and time budgets',
              'Flaky policy with quarantine, owner and SLA',
              'Ownership model (CODEOWNERS / squad tags) and triage process',
              'Phased rollout with success metrics',
            ],
          },
          { kind: 'interview', title: 'Interview drill', interviewId: 'iv-m10-design' },
        ],
      },
    ],
  },
  questions: [
    {
      id: 'm10-q1', skill: 'framework', moduleId: 'm10', type: 'mcq', difficulty: 2,
      prompt: 'Which is the best definition of a flaky test?',
      options: opts('A test that is slow', 'A test that passes and fails on the same code without any change', 'A test that always fails', 'A test with no assertions'),
      answer: ['b'],
      explanation: 'Non-determinism on unchanged code is the defining property. Slow and always-failing tests are different problems.',
    },
    {
      id: 'm10-q2', skill: 'framework', moduleId: 'm10', type: 'mcq', difficulty: 3,
      prompt: 'Business analysts want to read and review acceptance tests, but nobody outside QA will ever edit Gherkin. Is Cucumber worth it?',
      options: opts('Always — BDD is best practice', 'Only if the readable specs are actually used for collaboration; otherwise it adds a costly translation layer', 'Never use BDD', 'Only for API tests'),
      answer: ['b'],
      explanation: 'BDD pays off through conversations and shared specs. Without that, step definitions are overhead.',
    },
    {
      id: 'm10-q3', skill: 'framework', moduleId: 'm10', type: 'mcq', difficulty: 2,
      prompt: 'A UI redesign forces changes in 300 test files. What does that reveal?',
      options: opts('Nothing unusual', 'Tests depend directly on UI details; locators/flows should be encapsulated in pages, components or flows', 'The redesign was wrong', 'Too few tests'),
      answer: ['b'],
      explanation: 'Good layering confines UI change to the page/component layer.',
    },
    {
      id: 'm10-q4', skill: 'framework', moduleId: 'm10', type: 'scenario', difficulty: 3,
      prompt: 'A checkout-style test fails 1 in 30 runs: occasionally two leave requests are created after one click. What do you do?',
      options: opts('Add a retry', 'Quarantine the test and move on', 'Investigate as a possible product race condition (double submit / missing idempotency) and raise a bug with evidence', 'Add Thread.sleep before the click'),
      answer: ['c'],
      explanation: 'Some "flaky tests" are real intermittent bugs. Retries would hide a customer-facing defect.',
    },
    {
      id: 'm10-q5', skill: 'framework', moduleId: 'm10', type: 'multi', difficulty: 2,
      prompt: 'Healthy quarantine policy includes…',
      options: opts('An owner per quarantined test', 'A deadline to fix or delete', 'Quarantined tests still run and are reported, but don\'t block', 'Quarantined tests are silently skipped forever', 'Flaky rate tracked over time'),
      answer: ['a', 'b', 'c', 'e'],
      explanation: 'Quarantine is a temporary, visible state — not a graveyard.',
    },
    {
      id: 'm10-q6', skill: 'framework', moduleId: 'm10', type: 'mcq', difficulty: 2,
      prompt: 'Where should the API key used by tests live?',
      options: opts('In config.properties in the repo', 'In the CI secret store, injected as an environment variable and masked in logs', 'Hard-coded in the base test', 'In the test report for debugging'),
      answer: ['b'],
      explanation: 'Secrets never belong in source control or artifacts.',
    },
    {
      id: 'm10-q7', skill: 'framework', moduleId: 'm10', type: 'mcq', difficulty: 3,
      prompt: 'What should run on every pull request?',
      options: opts('The full 4-hour regression', 'Fast unit, API/contract and a small smoke set; heavier suites after merge or nightly', 'Nothing — test after release', 'Only manual tests'),
      answer: ['b'],
      explanation: 'PR checks must be fast enough that developers wait for them. Depth comes later in the pipeline.',
    },
  ],
  problems: [
    {
      kind: 'js', id: 'js-detect-flaky', title: 'Detect flaky tests from run history', skill: 'framework', moduleId: 'm10', difficulty: 3,
      statement: '`runs` is a list of `{ test, commit, status }` with status "pass" or "fail". A test is **flaky** if, for at least one commit, it has both a pass and a fail. Return `{ test, flakyRate }` for every flaky test, where flakyRate = (number of commits where it was flaky) ÷ (number of distinct commits it ran on), rounded to 2 decimals. Sort by flakyRate descending, then test name.',
      examples: [{ input: 'runs for login: c1 pass+fail, c2 pass', output: '[{ test: "login", flakyRate: 0.5 }]' }],
      constraints: ['Up to 10⁵ runs', 'O(n log n) or better'],
      functionName: 'detectFlaky',
      starter: `type Run = { test: string; commit: string; status: 'pass' | 'fail' };
function detectFlaky(runs: Run[]): { test: string; flakyRate: number }[] {
  return [{ test: 'todo', flakyRate: 0 }];
}`,
      tests: [
        { args: [[{ test: 'login', commit: 'c1', status: 'pass' }, { test: 'login', commit: 'c1', status: 'fail' }, { test: 'login', commit: 'c2', status: 'pass' }]], expected: [{ test: 'login', flakyRate: 0.5 }] },
        { args: [[{ test: 'a', commit: 'c1', status: 'fail' }, { test: 'a', commit: 'c2', status: 'pass' }]], expected: [], note: 'failing then fixed is not flaky' },
        { args: [[]], expected: [] },
        {
          args: [[
            { test: 'b', commit: 'c1', status: 'pass' }, { test: 'b', commit: 'c1', status: 'fail' },
            { test: 'a', commit: 'c1', status: 'fail' }, { test: 'a', commit: 'c1', status: 'pass' },
            { test: 'a', commit: 'c2', status: 'fail' }, { test: 'a', commit: 'c2', status: 'pass' },
            { test: 'a', commit: 'c3', status: 'pass' },
          ]],
          expected: [{ test: 'b', flakyRate: 1 }, { test: 'a', flakyRate: 0.67 }],
          hidden: true,
        },
      ],
      hints: ['Group by test, then by commit, tracking which statuses you have seen.', 'A Map<string, Map<string, Set<status>>> works.', 'Math.round(x * 100) / 100 for two decimals.'],
      solution: {
        code: `type Run = { test: string; commit: string; status: 'pass' | 'fail' };
function detectFlaky(runs: Run[]): { test: string; flakyRate: number }[] {
  const byTest = new Map<string, Map<string, Set<string>>>();
  for (const r of runs) {
    const commits = byTest.get(r.test) ?? new Map<string, Set<string>>();
    const statuses = commits.get(r.commit) ?? new Set<string>();
    statuses.add(r.status);
    commits.set(r.commit, statuses);
    byTest.set(r.test, commits);
  }
  const out: { test: string; flakyRate: number }[] = [];
  for (const [test, commits] of byTest) {
    let flaky = 0;
    for (const s of commits.values()) if (s.size === 2) flaky++;
    if (flaky > 0) out.push({ test, flakyRate: Math.round((flaky / commits.size) * 100) / 100 });
  }
  return out.sort((x, y) => y.flakyRate - x.flakyRate || x.test.localeCompare(y.test));
}`,
        explanation: 'This is the core of a flaky-test detection service: group results by (test, commit) and look for mixed outcomes. In production you\'d feed it from a results database and ignore commits with infrastructure incidents.',
        time: 'O(n + t log t)', space: 'O(n)',
      },
      followUps: ['How would you exclude runs that failed because the environment was down?', 'Where would this run — and who gets notified?'],
    },
  ],
  interviews: [
    {
      id: 'iv-m10-flaky', modes: ['automation', 'framework', 'qa-lead', 'full-sdet3'], skill: 'framework', level: 'L3', kind: 'technical',
      prompt: 'Your suite has a 15% flaky failure rate. Explain flakiness to a product manager, then tell me exactly how you would bring it under 2%.',
      rubric: [
        { id: 'def', point: 'Definition: passes and fails on the same code', any: ['same code', 'without change', 'intermittent', 'non deterministic', 'randomly'] },
        { id: 'impact', point: 'Business impact in PM language', any: ['fire alarm', 'trust', 'release', 'waste', 'delay', 'ignore'] },
        { id: 'detect', point: 'Detect/measure from run history', any: ['history', 'measure', 'flaky rate', 'dashboard', 'track'] },
        { id: 'quar', point: 'Quarantine with owner and SLA', any: ['quarantine', 'owner', 'sla', 'non blocking'] },
        { id: 'causes', point: 'Root causes: timing, data, shared state, env', any: ['timing', 'wait', 'test data', 'shared state', 'environment', 'race'] },
        { id: 'prevent', point: 'Prevention: review rules, repeat runs before merge', any: ['prevent', 'review', 'repeat', 'guideline', 'lint', 'checklist'] },
        { id: 'retry', point: 'Retries are visible, not a fix', any: ['retry', 'retries'] },
      ],
      redFlags: [{ any: ['increase the timeout everywhere', 'add sleep', 'thread.sleep'], note: 'Bigger timeouts and sleeps slow the suite and hide the cause.' }],
      structure: 'PM explanation (one analogy + impact) → measure → quarantine → fix top causes → prevent → target and reporting.',
      modelAnswer: '"For the PM: a flaky test is a fire alarm that sometimes rings with no fire. Every false alarm costs an engineer time, and after enough of them people stop reacting — that\'s how real bugs get through. Plan: first measure — record results per test and commit and rank tests by flaky rate. Quarantine the worst offenders into a non-blocking job, each with an owner and a ten-day fix-or-delete SLA. Fix the big categories: replace sleeps with state-based waits, give each test its own data, remove order dependencies, stub unstable third parties. Allow at most one retry and report \'passed on retry\' as flaky. Prevent: review checklist, run new tests 20 times before merge. I\'d report flaky rate weekly — target under 2% within a quarter."',
      followUp: 'One flaky test turns out to be a real race condition in the product. How does that change your process?',
      revision: ['m10', 'm21'],
    },
    {
      id: 'iv-m10-design', modes: ['framework', 'system-design', 'full-sdet3'], skill: 'framework', level: 'L5', kind: 'design',
      prompt: 'Design an automation framework for our company: React web app, Java microservices, Kafka, PostgreSQL, six squads, GitHub Actions.',
      rubric: [
        { id: 'clarify', point: 'Clarifies requirements and constraints first', any: ['clarify', 'requirement', 'assume', 'question', 'constraint'] },
        { id: 'layers', point: 'Layers: UI, API, contract, (component/unit by devs)', any: ['api', 'contract', 'ui', 'layer', 'pyramid'] },
        { id: 'tools', point: 'Tool choices with reasons', any: ['playwright', 'rest assured', 'pact', 'testng', 'junit', 'because'] },
        { id: 'data', point: 'Test data and environments', any: ['test data', 'environment', 'seed', 'ephemeral', 'docker'] },
        { id: 'ci', point: 'CI stages, selection, parallelism', any: ['pipeline', 'pull request', 'nightly', 'shard', 'parallel', 'stage'] },
        { id: 'report', point: 'Reporting, triage, flaky policy', any: ['report', 'triage', 'flaky', 'quarantine', 'dashboard'] },
        { id: 'owner', point: 'Ownership and adoption across squads', any: ['owner', 'squad', 'codeowners', 'adoption', 'guideline', 'train'] },
        { id: 'tradeoff', point: 'Trade-offs and rollout plan', any: ['trade off', 'tradeoff', 'phase', 'rollout', 'first', 'risk'] },
      ],
      structure: 'Clarify → goals/metrics → layers and tools → data/env → pipeline → reporting/triage → ownership → rollout → trade-offs.',
      modelAnswer: '"Clarify first: release cadence, browsers, who writes tests, current pain. Goal: PR feedback under 15 minutes and trustworthy nightly regression. Layers: developers own unit and component tests; Pact contracts between services and for Kafka events; an API suite per domain in REST Assured (Java, close to the services); a thin Playwright TypeScript UI layer for 20–40 critical journeys. Data: API-based factories, unique per test, plus ephemeral environments per PR with Docker Compose for API/contract tests. Pipeline: PR runs unit, contract, API smoke; merge runs impacted API and sharded E2E against staging; nightly full regression on three browsers; post-deploy smoke in production. Reporting: Playwright HTML + JUnit into a results store with flaky detection; failures route to the owning squad via tags and CODEOWNERS. Rollout: one squad pilot for a month, then templates and pairing for the others. Trade-off: two languages (Java API, TS UI) in exchange for each layer living next to the people who change it."',
      followUp: 'How do you stop six squads from building six different frameworks?',
      revision: ['m10', 'm22'],
    },
  ],
  flashcards: [
    { id: 'fc-m10-1', skill: 'framework', moduleId: 'm10', front: 'Flaky test definition', back: 'Passes and fails on the same code without changes.' },
    { id: 'fc-m10-2', skill: 'framework', moduleId: 'm10', front: 'Flaky handling loop', back: 'Detect (history) → quarantine (owner + SLA) → fix root cause → prevent (review, repeat runs).' },
    { id: 'fc-m10-3', skill: 'framework', moduleId: 'm10', front: 'Failure triage categories', back: 'Product bug, test bug, environment, data, flaky.' },
    { id: 'fc-m10-4', skill: 'framework', moduleId: 'm10', front: 'Screenplay pattern', back: 'Actors with abilities perform tasks and ask questions — composition over page inheritance.' },
  ],
};
