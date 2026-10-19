import { opts, type ModuleBundle } from '../bundle';
import { VIDEOS } from '../videos';

export const m01: ModuleBundle = {
  module: {
    id: 'm01',
    number: 1,
    title: 'Testing Fundamentals & the QA Lead Mindset',
    area: 'A',
    level: 'L1',
    skills: ['fundamentals', 'qaStrategy'],
    summary:
      'The vocabulary every SDET and QA Lead interview starts with — and the judgment behind it: the test pyramid, verification vs validation, test types, test design techniques, defects and risk.',
    prerequisites: [],
    tags: ['pyramid', 'test design', 'defects', 'risk', 'shift-left'],
    source: 'sdet3/curriculum/01-testing-fundamentals/LESSON.md',
    topics: [
      'SDLC', 'STLC', 'QA vs QC', 'Verification vs validation', 'Test pyramid', 'Testing quadrants',
      'Functional testing', 'Regression testing', 'Smoke testing', 'Sanity testing', 'Integration testing',
      'System testing', 'End-to-end testing', 'Exploratory testing', 'Risk-based testing',
      'Boundary value analysis', 'Equivalence partitioning', 'Decision tables', 'State transition testing',
      'Pairwise testing', 'Negative testing', 'Error guessing', 'Shift-left testing', 'Shift-right testing',
      'Quality engineering', 'Quality gates', 'Defect lifecycle', 'Severity vs priority', 'Root cause analysis',
      'Production defect analysis', 'How a QA Lead thinks',
    ],
    lessons: [
      {
        id: 'm01-l1',
        title: 'The test pyramid: where your tests should live',
        minutes: 25,
        sections: [
          {
            kind: 'learn',
            title: 'Why the shape matters',
            body: `Every automated test buys **feedback** and costs **time, money and maintenance**. The test pyramid is a budget rule for spending that cost well.

| Layer | What it checks | Speed | Typical count | Breaks because of |
|---|---|---|---|---|
| **Unit** | One function/class in isolation | ms | Thousands | Real logic bugs |
| **Integration / API / component** | Modules talking to each other, contracts, DB | 10–500 ms | Hundreds | Interface or data bugs |
| **End-to-end UI** | A whole user journey through the browser | seconds–minutes | Tens | Anything — including timing, data and environment |

**The rule:** push each check to the *lowest layer that can catch the bug*. A leave-balance calculation belongs in a unit test; "an employee can apply for leave and their manager sees it" is one E2E journey.

**Why it matters in interviews:** an inverted pyramid ("ice-cream cone": hundreds of UI tests, few unit tests) is the root cause of slow CI, flaky suites and teams that stop trusting automation. An SDET 3 is expected to *diagnose* that and *fix the distribution*, not just write more UI tests.

> Interview line: "I treat E2E tests as the most expensive tests we own, so I keep them for critical user journeys and push everything else down to API and unit level, where it's faster and more stable."`,
          },
          {
            kind: 'visual',
            title: 'Play with the distribution',
            vizId: 'test-pyramid',
            caption: 'Move the mix of unit / API / UI tests and watch suite time and flaky failures change. The numbers are a simple model, not a benchmark.',
          },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m01-q1', 'm01-q2', 'm01-q3'] },
          {
            kind: 'learn',
            title: 'Beyond the pyramid: shapes you will hear about',
            body: `- **Testing trophy** (Kent C. Dodds): most weight on *integration* tests for front-end apps, with static analysis at the base.
- **Honeycomb** (Spotify, microservices): most tests at the *service/integration* level because each service is small.
- **Ice-cream cone**: the anti-pattern — mostly manual/UI.

A senior answer: *"The pyramid is a heuristic, not a law. The real rule is fast, reliable feedback at the lowest sensible level. For a microservice I'd weight contract and API tests heavily; for a UI-heavy app I'd add component tests."*

**Testing quadrants** (Brian Marick) complement the pyramid — they ask *why* you test, not *where*:

|  | Business-facing | Technology-facing |
|--|--|--|
| **Guide development** | Q2: functional/story tests, examples | Q1: unit, component |
| **Critique the product** | Q3: exploratory, usability, UAT | Q4: performance, security, reliability |`,
          },
          { kind: 'video', title: 'Watch: the pyramid in 5 minutes', video: VIDEOS.testPyramid },
          {
            kind: 'build',
            title: 'Redesign an inverted pyramid',
            task: `**Current state:** 50 unit tests, 30 integration tests, 400 UI E2E tests. CI takes 3 hours. 15% of runs fail with no code change.

Write a one-page plan for your engineering manager:
1. What you keep at E2E level (and how you choose).
2. What you convert to API/integration tests, and how.
3. What you delete.
4. How you handle the flaky tests while migrating.
5. The target numbers (CI time, flaky rate) and how you'll measure them.`,
            acceptance: [
              'Names a selection rule for E2E (critical journeys / revenue / compliance), not a random cut',
              'Converts UI checks of business rules into API or unit tests',
              'Quarantines flaky tests with owners instead of adding retries everywhere',
              'Gives measurable targets (e.g. CI < 30 min, flaky < 2%) and a timeline',
              'Explains the business impact in non-technical words',
            ],
          },
          { kind: 'interview', title: 'Interview drill', interviewId: 'iv-m01-pyramid' },
        ],
      },
      {
        id: 'm01-l2',
        title: 'Verification vs validation, QA vs QC, SDLC & STLC',
        minutes: 20,
        sections: [
          {
            kind: 'learn',
            title: 'Two questions every product must answer',
            body: `| | Verification | Validation |
|---|---|---|
| Question | **Are we building the product right?** | **Are we building the right product?** |
| Checked against | Specs, designs, standards | Real user needs |
| Typical activities | Reviews, walkthroughs, static analysis, unit tests against the spec | UAT, beta, usability tests, production analytics |
| Can be done without running code? | Often yes | Rarely |

**Example (leave management):** the spec says *"a leave request after 9:30 AM for the same day needs manager approval."*
- *Verification:* the code implements that rule exactly — a test proves a 9:31 request goes to approval.
- *Validation:* managers actually *want* that rule; if every manager approves blindly, the feature solved the wrong problem.

Note: checking that a business rule is enforced is still **verification** — it compares the product to its specification. Validation asks whether the specification itself serves users.

**QA vs QC**
- **QA (assurance)** is process-oriented and *prevents* defects: test strategy, review gates, definition of done, CI quality gates.
- **QC (control)** is product-oriented and *detects* defects: executing tests, logging bugs.
A QA Lead owns QA; the whole team does QC.`,
          },
          {
            kind: 'learn',
            title: 'SDLC and STLC — and where QA really starts',
            body: `**SDLC:** Requirements → Design → Build → Test → Deploy → Operate.
**STLC:** Test planning → Analysis → Design → Environment setup → Execution → Closure.

In agile teams these aren't phases; they repeat every sprint. Interviewers listen for **when QA gets involved**:

| SDLC stage | What a strong QA/SDET does |
|---|---|
| Requirements | Ask "how will we know this works?" — testable acceptance criteria, edge cases, data rules |
| Design | Testability review: IDs/test hooks, API contracts, feature flags, logging |
| Build | Unit/API tests in the same PR, contract tests, static analysis |
| Test | Risk-based regression, exploratory sessions, automation |
| Deploy | Post-deploy smoke, canary checks, rollback verification |
| Operate | Monitor errors, analyse escaped defects, feed back into tests |`,
          },
          { kind: 'visual', title: 'Shift-left and shift-right', vizId: 'shift-left', caption: 'Step through where each quality activity sits in the delivery flow.' },
          { kind: 'video', title: 'Watch: verification & validation', video: VIDEOS.verification },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m01-q4', 'm01-q5', 'm01-q6'] },
          { kind: 'interview', title: 'Interview drill', interviewId: 'iv-m01-vv' },
        ],
      },
      {
        id: 'm01-l3',
        title: 'Test types: smoke, sanity, regression and friends',
        minutes: 15,
        sections: [
          {
            kind: 'learn',
            title: 'Pick the right test for the moment',
            body: `| Type | Question it answers | When | Breadth / depth |
|---|---|---|---|
| **Smoke** | Is this build stable enough to test at all? | Every build / deploy | Broad, shallow |
| **Sanity** | Does this specific fix work, and did nothing next to it break? | After a fix or small change | Narrow, deeper |
| **Regression** | Did existing behaviour break anywhere? | Before release, nightly | Broad, deep |
| **Functional** | Does the feature meet its requirements? | Per story | Per feature |
| **Integration** | Do components/services work together? | Per change, in CI | Interfaces |
| **System** | Does the whole system meet requirements? | Per release | Whole product |
| **End-to-end** | Can a user complete a real journey across all systems? | Critical paths | Few journeys |
| **Exploratory** | What did nobody think to specify? | New/risky features | Time-boxed sessions with a charter |
| **Negative** | Does it fail safely with bad input? | Always, alongside positives | Error paths |

**Exploratory testing is not random clicking.** It is simultaneous learning, test design and execution, guided by a *charter* ("Explore leave cancellation with overlapping holidays, looking for balance errors") and time-boxed, with notes.

**Error guessing** uses experience of where bugs usually hide: nulls, time zones, month ends, leap years, concurrency, permissions, unicode, very large inputs.`,
          },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m01-q7', 'm01-q8'] },
          { kind: 'interview', title: 'Interview drill', interviewId: 'iv-m01-smoke' },
        ],
      },
      {
        id: 'm01-l4',
        title: 'Test design techniques: fewer tests, more bugs',
        minutes: 30,
        sections: [
          {
            kind: 'learn',
            title: 'Equivalence partitioning and boundary values',
            body: `**Equivalence partitioning (EP):** split inputs into groups the system should treat the same way; test one value per group.

**Boundary value analysis (BVA):** bugs cluster at edges (off-by-one, \`<\` vs \`<=\`). For a valid range *min..max* test *min−1, min, min+1, max−1, max, max+1*.

**Example — leave days per request, allowed 0.5 to 30:**

| Partition | Representative | Boundaries |
|---|---|---|
| Below range (invalid) | −3 | 0, 0.4 |
| Valid | 10 | 0.5, 1, 29, 30 |
| Above range (invalid) | 45 | 31 |
| Not a number (invalid) | "abc" | — |

**Decision tables** handle combinations of conditions. **State transition** testing maps states and events (Draft → Pending → Approved → Cancelled) — test every valid transition *and* the invalid ones (can you approve a cancelled request?). **Pairwise** testing covers every *pair* of parameter values instead of every combination: 4 browsers × 3 OSes × 3 roles = 36 combinations, but about 12 tests cover all pairs.`,
          },
          { kind: 'video', title: 'Watch: BVA & EP', video: VIDEOS.bvaEp },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m01-q9', 'm01-q10'] },
          { kind: 'practice', title: 'Code it: generate boundary values', problemId: 'js-boundary-values' },
          {
            kind: 'build',
            title: 'Design tests for a password field',
            task: `Rules: 8–20 characters; at least 1 uppercase, 1 lowercase, 1 digit; no spaces; cannot match the last 3 passwords.

Produce: the equivalence partitions, the boundary values, a decision table for the character-class rules, and the negative tests. Mark which tests you'd automate at API level vs UI level.`,
            acceptance: [
              'Boundaries 7, 8, 9, 19, 20, 21 characters',
              'One partition per missing character class plus a space case',
              'History rule tested with the 3rd and 4th previous password',
              'Validation rules automated at API/unit level; one UI test for the error message',
            ],
          },
        ],
      },
      {
        id: 'm01-l5',
        title: 'Defects: lifecycle, severity vs priority, RCA',
        minutes: 20,
        sections: [
          { kind: 'visual', title: 'Defect lifecycle', vizId: 'defect-lifecycle', caption: 'Step through a defect from report to closure, including the reopen loop.' },
          {
            kind: 'learn',
            title: 'Severity is impact, priority is urgency',
            body: `- **Severity** — how bad the *technical/user impact* is (crash, data loss, wrong payroll). Usually set by QA.
- **Priority** — how *soon* the business needs it fixed. Set with product.

| Example | Severity | Priority |
|---|---|---|
| Payroll calculates wrong tax for one rare state, payroll runs next month | High | Medium |
| Company logo misspelled on the login page before a big customer demo | Low | High |
| App crashes when leave is applied on Feb 29 | High | High (if leap year is near) |

**Root cause analysis — 5 Whys** keeps asking *why* until you reach a *process* you can fix:

Bug: expired promo codes accepted at checkout →
why? expiry compared in local time → why? no time-zone rule in the spec → why? no review checklist for date logic → **action:** date/time checklist in story refinement + boundary tests at midnight UTC.

**Production defect analysis** turns escapes into prevention: classify each escaped bug by *where it should have been caught* (unit, API, E2E, review, monitoring) and *why it wasn't* (missing test, wrong data, environment gap). Track it as **defect leakage**.`,
          },
          { kind: 'check', title: 'Triage practice', questionIds: ['m01-q11', 'm01-q12'] },
          {
            kind: 'build',
            title: 'Write a 5-Whys RCA',
            task: 'A production bug allowed employees to apply leave beyond their balance when two requests were submitted within the same second. Write a 5-Whys RCA and three process improvements.',
            acceptance: [
              'Identifies the race condition (check-then-act without locking)',
              'Reaches a process cause, not just "developer mistake"',
              'Improvements include a concurrency test and a DB constraint or lock',
              'Mentions detection: monitoring or reconciliation for negative balances',
            ],
          },
        ],
      },
      {
        id: 'm01-l6',
        title: 'How a QA Lead thinks: risk, gates and shift-right',
        minutes: 20,
        sections: [
          {
            kind: 'learn',
            title: 'From tester to quality owner',
            body: `A QA Lead's job is **decisions under uncertainty**. Five habits:

1. **Risk first.** Risk = *likelihood × impact*. Payroll and statutory leave rules are high-impact; a tooltip colour is not. Test effort follows risk.
2. **Explicit quality gates.** "Feels ready" is not a gate. Example gates: zero open P0/P1, all critical-path E2E green, API suite ≥ 98% pass with known failures triaged, no new high-severity security findings, performance P95 within budget.
3. **Translate risk into business language.** Not "17 tests failed" but "applying leave fails for employees on night shifts — about 8% of users. I recommend we hold the release or ship with the shift feature flagged off."
4. **Shift-left *and* shift-right.** Prevent early (testable stories, PR checks); detect late (canary releases, feature flags, monitoring, synthetic checks in production).
5. **Learn from production.** Every escaped defect becomes a test, a checklist item or a monitor.

**Quality engineering** is the umbrella: quality is built into the system (pipelines, observability, testability), not inspected at the end.`,
          },
          { kind: 'visual', title: 'Risk matrix', vizId: 'risk-matrix', caption: 'Drag features into the likelihood × impact grid to see where test effort should go.' },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m01-q13', 'm01-q14'] },
          { kind: 'interview', title: 'Interview drill', interviewId: 'iv-m01-release' },
        ],
      },
    ],
  },
  questions: [
    {
      id: 'm01-q1', skill: 'fundamentals', moduleId: 'm01', type: 'mcq', difficulty: 1,
      prompt: 'In a healthy test pyramid, which layer should contain the **most** tests?',
      options: opts('End-to-end UI tests', 'Integration / API tests', 'Unit tests', 'Manual exploratory tests'),
      answer: ['c'],
      explanation: 'Unit tests are fastest, cheapest and most stable, so they form the wide base. E2E tests sit at the narrow top because they are slow and brittle.',
      misconceptions: { a: 'E2E tests give the most confidence per test but cost the most per test; making them the majority produces the "ice-cream cone" anti-pattern.', d: 'Exploratory testing is valuable but is not part of the automated pyramid.' },
      followUp: 'When might a team deliberately keep fewer unit tests and more integration tests?',
    },
    {
      id: 'm01-q2', skill: 'fundamentals', moduleId: 'm01', type: 'multi', difficulty: 2,
      prompt: 'Your suite has 400 UI tests and 50 unit tests. Which problems does this shape typically cause? (Select all that apply.)',
      options: opts('Long CI feedback time', 'Higher flaky failure rate', 'Bugs located precisely to a function', 'High maintenance when the UI changes', 'Developers ignoring red builds'),
      answer: ['a', 'b', 'd', 'e'],
      explanation: 'UI-heavy suites are slow, flaky and expensive to maintain, and constant false alarms train people to ignore failures. Precise fault localisation is a property of *unit* tests, which this suite lacks.',
      misconceptions: { c: 'A failing UI test tells you a journey broke, not which function — that is why unit tests localise better.' },
    },
    {
      id: 'm01-q3', skill: 'fundamentals', moduleId: 'm01', type: 'scenario', difficulty: 3,
      prompt: 'A UI test checks that leave longer than the balance is rejected with an error. It takes 40 s and is flaky. What is the best senior-level move?',
      options: opts(
        'Add a retry so it passes more often',
        'Move the balance rule check to an API/unit test and keep one UI test that the error message renders',
        'Delete it; business rules don\'t need tests',
        'Increase the explicit wait timeout to 60 seconds',
      ),
      answer: ['b'],
      explanation: 'The business rule is logic, so test it at the lowest layer that can catch the bug (API or unit). Keep a single thin UI check for the user-visible message. Retries and longer waits hide the problem.',
      misconceptions: { a: 'Retries mask flakiness and slow the suite further; they are a last resort with tracking, not a fix.', d: 'Longer waits make the suite slower and do not address why the test is slow and flaky.' },
    },
    {
      id: 'm01-q4', skill: 'fundamentals', moduleId: 'm01', type: 'mcq', difficulty: 1,
      prompt: '“Are we building the **right product**?” describes…',
      options: opts('Verification', 'Validation', 'Quality control', 'Regression testing'),
      answer: ['b'],
      explanation: 'Validation checks the product against real user needs. Verification ("building the product right") checks it against the specification.',
      misconceptions: { a: 'Verification is "building it right" — conformance to the spec, design and standards.' },
    },
    {
      id: 'm01-q5', skill: 'fundamentals', moduleId: 'm01', type: 'multi', difficulty: 2,
      prompt: 'Which of these are **verification** activities?',
      options: opts('Code review against the design doc', 'User acceptance testing with HR managers', 'Unit tests asserting the 9:30 AM approval rule from the spec', 'Beta release to 5 customers', 'Static analysis in the PR pipeline'),
      answer: ['a', 'c', 'e'],
      explanation: 'Reviews, spec-based unit tests and static analysis compare work against specifications or standards. UAT and beta releases check whether real users\' needs are met — validation.',
      misconceptions: { b: 'UAT asks users whether the product meets their needs — that is validation.', d: 'A beta tests fitness for real use — validation.' },
    },
    {
      id: 'm01-q6', skill: 'fundamentals', moduleId: 'm01', type: 'mcq', difficulty: 2,
      prompt: 'Which statement best describes **QA vs QC**?',
      options: opts('QA finds bugs; QC prevents them', 'QA is process-focused prevention; QC is product-focused detection', 'They are synonyms', 'QC is only done by managers'),
      answer: ['b'],
      explanation: 'Quality assurance improves the process so defects are prevented (strategy, gates, reviews). Quality control inspects the product to detect defects (executing tests).',
      misconceptions: { a: 'This is reversed: assurance prevents, control detects.' },
    },
    {
      id: 'm01-q7', skill: 'fundamentals', moduleId: 'm01', type: 'scenario', difficulty: 2,
      prompt: 'A developer fixed a bug in the comp-off calculation an hour before the release. What do you run?',
      options: opts('Full regression (6 hours)', 'Sanity testing around comp-off and its neighbours, plus the automated smoke suite', 'Nothing — the developer tested it', 'Only exploratory testing on unrelated modules'),
      answer: ['b'],
      explanation: 'Sanity testing is narrow and deep: confirm the fix and the closely related areas (balance, approvals). Smoke confirms the build is still basically stable. Full regression won\'t fit and isn\'t proportionate to the change.',
    },
    {
      id: 'm01-q8', skill: 'fundamentals', moduleId: 'm01', type: 'tf', difficulty: 1,
      prompt: 'True or false: exploratory testing means testing without any plan.',
      options: opts('True', 'False'),
      answer: ['b'],
      explanation: 'Good exploratory testing is structured: a charter, a time box, and notes. It is unscripted, not unplanned.',
    },
    {
      id: 'm01-q9', skill: 'fundamentals', moduleId: 'm01', type: 'mcq', difficulty: 2,
      prompt: 'A field accepts an age from 18 to 60 inclusive. Which set is the classic **boundary value** set?',
      options: opts('18, 39, 60', '17, 18, 19, 59, 60, 61', '0, 18, 60, 100', '18 and 60 only'),
      answer: ['b'],
      explanation: 'Test just below, on, and just above each boundary: min−1, min, min+1, max−1, max, max+1.',
      misconceptions: { a: 'That is one value per partition plus the edges — closer to equivalence partitioning; it misses the invalid neighbours 17 and 61.', d: 'Testing only the boundaries misses off-by-one errors on the invalid side.' },
    },
    {
      id: 'm01-q10', skill: 'fundamentals', moduleId: 'm01', type: 'mcq', difficulty: 3,
      prompt: 'A report filter has 4 browsers × 3 roles × 3 date ranges × 2 export formats (72 combinations). Which technique reduces this most sensibly?',
      options: opts('Boundary value analysis', 'Pairwise (all-pairs) testing', 'State transition testing', 'Error guessing'),
      answer: ['b'],
      explanation: 'Most defects are triggered by a single parameter or an interaction of two. Pairwise covers every pair of values in roughly 12 tests instead of 72.',
    },
    {
      id: 'm01-q11', skill: 'fundamentals', moduleId: 'm01', type: 'mcq', difficulty: 2,
      prompt: 'The company name is misspelled on the login page the day before a demo to your largest customer. Severity / priority?',
      options: opts('High / High', 'Low / High', 'High / Low', 'Low / Low'),
      answer: ['b'],
      explanation: 'Technically trivial (low severity), but business-urgent (high priority). This mismatch is the classic interview example.',
    },
    {
      id: 'm01-q12', skill: 'fundamentals', moduleId: 'm01', type: 'mcq', difficulty: 2,
      prompt: 'A retested bug fails again. In the defect lifecycle it moves to…',
      options: opts('Closed', 'Deferred', 'Reopened', 'Rejected'),
      answer: ['c'],
      explanation: 'A failed retest sends the defect back to the developer as Reopened.',
    },
    {
      id: 'm01-q13', skill: 'qaStrategy', moduleId: 'm01', type: 'scenario', difficulty: 3,
      prompt: 'Two days before release you find a P1 bug: leave approvals fail for employees with no manager assigned (~2% of users). The fix is risky. Best QA Lead recommendation?',
      options: opts(
        'Block the release silently until it is fixed',
        'Ship and say nothing; 2% is small',
        'Quantify impact, propose options (fix + targeted regression, or ship with a workaround/flag and a hotfix plan), and let product decide with you',
        'Ask developers to fix it and skip regression to save time',
      ),
      answer: ['c'],
      explanation: 'A lead makes risk visible, quantifies it in user/business terms, offers options with trade-offs and owns the recommendation — without unilateral blocking or hiding the risk.',
    },
    {
      id: 'm01-q14', skill: 'qaStrategy', moduleId: 'm01', type: 'multi', difficulty: 2,
      prompt: 'Which are **shift-right** practices?',
      options: opts('Canary releases', 'Reviewing acceptance criteria in refinement', 'Synthetic monitoring in production', 'Feature flags with gradual rollout', 'Contract tests in the PR pipeline'),
      answer: ['a', 'c', 'd'],
      explanation: 'Shift-right tests and observes in production-like or production environments. Refinement reviews and PR contract tests are shift-left.',
    },
  ],
  problems: [
    {
      kind: 'js',
      id: 'js-boundary-values',
      title: 'Boundary value generator',
      skill: 'fundamentals',
      moduleId: 'm01',
      difficulty: 1,
      statement: `Write \`boundaryValues(min, max)\` that returns the classic boundary-value test inputs for an inclusive integer range: \`[min-1, min, min+1, max-1, max, max+1]\`, **sorted ascending with duplicates removed** (ranges can be tiny).`,
      examples: [
        { input: 'boundaryValues(18, 60)', output: '[17, 18, 19, 59, 60, 61]' },
        { input: 'boundaryValues(5, 5)', output: '[4, 5, 6]', explain: 'min+1 and max-1 collapse onto existing values.' },
      ],
      constraints: ['min ≤ max', 'Integers only', 'Return a new array'],
      functionName: 'boundaryValues',
      starter: `function boundaryValues(min: number, max: number): number[] {
  // TODO: return min-1, min, min+1, max-1, max, max+1 — sorted and de-duplicated
  return [];
}`,
      tests: [
        { args: [18, 60], expected: [17, 18, 19, 59, 60, 61] },
        { args: [5, 5], expected: [4, 5, 6] },
        { args: [1, 2], expected: [0, 1, 2, 3] },
        { args: [-3, 3], expected: [-4, -3, -2, 2, 3, 4], hidden: true },
        { args: [0, 100], expected: [-1, 0, 1, 99, 100, 101], hidden: true },
      ],
      hints: ['Build all six candidates first, then remove duplicates.', 'A Set removes duplicates; spread it back into an array and sort numerically with (a, b) => a - b.'],
      solution: {
        code: `function boundaryValues(min: number, max: number): number[] {
  const candidates = [min - 1, min, min + 1, max - 1, max, max + 1];
  return [...new Set(candidates)].sort((a, b) => a - b);
}`,
        explanation: 'Generate the six standard boundary points, de-duplicate with a Set (tiny ranges overlap), and sort numerically — the default sort compares strings, which would put 100 before 17.',
        time: 'O(1) — always six candidates',
        space: 'O(1)',
      },
      javaEquivalent: `List<Integer> boundaryValues(int min, int max) {
    return Stream.of(min - 1, min, min + 1, max - 1, max, max + 1)
        .distinct().sorted().collect(Collectors.toList());
}`,
      followUps: ['How would you extend this for decimal ranges such as 0.5–30 leave days?', 'Where would you use this in a data-driven test (TestNG @DataProvider or Playwright parameterised tests)?'],
    },
  ],
  interviews: [
    {
      id: 'iv-m01-pyramid', modes: ['qa-lead', 'automation', 'full-sdet3'], skill: 'fundamentals', level: 'L2', kind: 'scenario',
      prompt: 'Your team\'s pyramid is inverted: 80% UI tests, 10% integration, 10% unit. CI takes 2 hours and fails 20% of the time from flakiness. Present your improvement plan to an engineering manager in about two minutes.',
      rubric: [
        { id: 'diag', point: 'Diagnoses the inverted pyramid / ice-cream cone as the root cause', any: ['inverted', 'ice cream', 'pyramid', 'too many ui', 'too many e2e'] },
        { id: 'push', point: 'Pushes business-rule checks down to API/unit/integration level', any: ['api level', 'api test', 'unit test', 'integration test', 'push down', 'lower level', 'service level'] },
        { id: 'keep', point: 'Keeps a small set of critical-journey E2E tests', any: ['critical path', 'critical journey', 'critical flow', 'happy path', 'smoke'] },
        { id: 'flaky', point: 'Handles flakiness explicitly (quarantine, root causes, ownership)', any: ['quarantine', 'flaky', 'root cause', 'owner'] },
        { id: 'metrics', point: 'Sets measurable targets', any: ['minutes', '%', 'percent', 'target', 'measure', 'metric'] },
        { id: 'business', point: 'Explains business impact (release speed, trust, cost)', any: ['release', 'trust', 'cost', 'faster feedback', 'developer time', 'productivity'] },
        { id: 'phased', point: 'Phased, incremental plan rather than a big-bang rewrite', any: ['phase', 'incremental', 'step by step', 'sprint', 'first', 'roadmap', 'quarter'] },
      ],
      redFlags: [
        { any: ['add retries', 'increase retries', 'retry all'], note: 'Blanket retries hide flakiness and slow CI further; retries need tracking and a fix-by date.' },
        { any: ['thread.sleep', 'add sleep', 'hard wait'], note: 'Hard waits make suites slower and still flaky; fix synchronisation instead.' },
      ],
      structure: 'Problem in one line → impact in business terms → plan in 3 phases → targets → what you need from the manager.',
      modelAnswer: `"Our suite is an ice-cream cone: most checks run through the browser, so feedback takes two hours and one run in five fails for reasons unrelated to the code. That costs us release speed and, worse, developers have stopped trusting red builds.

**Phase 1 (2 weeks):** quarantine the top flaky tests into a non-blocking job with an owner each, and fix the main causes — hard waits, shared test data, environment dependencies. Target: flaky rate under 5%.
**Phase 2 (1–2 months):** audit the UI tests. Anything that checks a business rule — leave balance, approval routing — moves to API or unit tests. We keep 20–30 E2E journeys for revenue- and compliance-critical paths.
**Phase 3:** make it stick — PR checks run unit + API in under 10 minutes, E2E runs in parallel shards after merge, and new stories need tests at the right level in the definition of done.

Targets: PR feedback under 15 minutes, full suite under 30, flaky rate under 2%. I'll report these weekly. I need roughly one sprint of developer time per squad for the unit-test gap."`,
      followUp: 'A developer says "API tests won\'t catch UI bugs, so we still need the UI tests." How do you respond?',
      revision: ['m01', 'm10'],
    },
    {
      id: 'iv-m01-vv', modes: ['qa-lead', 'full-qa-lead'], skill: 'fundamentals', level: 'L1', kind: 'technical',
      prompt: 'Explain verification vs validation, with an example from a product you have worked on.',
      rubric: [
        { id: 'ver', point: 'Verification = building the product right / conforms to spec', any: ['building it right', 'building the product right', 'build it right', 'against the spec', 'specification', 'requirement', 'design'] },
        { id: 'val', point: 'Validation = building the right product / meets user needs', any: ['right product', 'right thing', 'user need', 'customer need', 'business need', 'meets the need'] },
        { id: 'act', point: 'Names typical activities on each side', any: ['review', 'static analysis', 'unit test', 'uat', 'user acceptance', 'beta', 'usability'] },
        { id: 'ex', point: 'Gives a concrete product example', any: ['leave', 'attendance', 'payroll', 'checkout', 'login', 'for example', 'e.g'] },
      ],
      redFlags: [{ any: ['validation means checking the value', 'verification means checking it exists'], note: 'Verification/validation are about spec conformance vs user needs, not about whether a value exists or is correct.' }],
      structure: 'Definition pair → one-line memory hook → activities → product example on both sides.',
      modelAnswer: `"Verification asks *are we building the product right* — does it conform to the spec and design? Reviews, static analysis and spec-based tests are verification. Validation asks *are we building the right product* — does it actually solve the user's problem? UAT, beta and usability testing are validation.

In an attendance module, verifying means proving the rule 'a swipe after 9:30 marks the employee late' is implemented exactly, including 9:30:00 itself. Validating means checking with HR admins that this rule matches how they really manage late arrivals — flexible shifts might make it the wrong rule entirely."`,
      followUp: 'Can a product pass verification and fail validation? Give an example.',
      revision: ['m01'],
    },
    {
      id: 'iv-m01-smoke', modes: ['automation', 'full-sdet3'], skill: 'fundamentals', level: 'L1', kind: 'technical',
      prompt: 'What is the difference between smoke and sanity testing? When would you run each?',
      rubric: [
        { id: 'smoke', point: 'Smoke: broad, shallow check that the build is stable/testable', any: ['broad', 'shallow', 'build is stable', 'build stability', 'testable', 'basic functionality', 'critical function'] },
        { id: 'sanity', point: 'Sanity: narrow, deeper check of a specific change/fix', any: ['narrow', 'specific', 'fix', 'particular change', 'focused', 'deep'] },
        { id: 'when', point: 'When: smoke on every build/deploy, sanity after a fix or minor change', any: ['every build', 'each build', 'after deploy', 'every deploy', 'after a fix', 'bug fix', 'hotfix'] },
        { id: 'auto', point: 'Mentions automating smoke in CI/CD', any: ['automate', 'pipeline', 'ci', 'post deploy'] },
      ],
      structure: 'Definitions with breadth/depth → timing → example → automation.',
      modelAnswer: '"Smoke testing is broad and shallow: is this build stable enough to test at all? — login works, key pages load, core APIs respond. It runs automatically on every build and after every deploy. Sanity testing is narrow and deeper: after a fix to comp-off calculation, I verify the fix and the neighbouring flows — balance, approvals — before deciding whether wider regression is needed."',
      followUp: 'How many tests belong in a smoke suite, and how do you keep it from growing into a regression suite?',
      revision: ['m01'],
    },
    {
      id: 'iv-m01-release', modes: ['qa-lead', 'full-qa-lead'], skill: 'qaStrategy', level: 'L6', kind: 'scenario',
      prompt: 'Development wants to skip regression for a "small" hotfix that touches the authentication module. How do you respond?',
      rubric: [
        { id: 'risk', point: 'Frames it as risk: auth is high-impact regardless of change size', any: ['risk', 'high impact', 'critical', 'security', 'everyone logs in', 'all users'] },
        { id: 'scope', point: 'Proposes a targeted, risk-based regression instead of all-or-nothing', any: ['targeted', 'subset', 'risk based', 'focused regression', 'impacted area', 'impact analysis'] },
        { id: 'auto', point: 'Uses automation to make it fast (smoke/API suite)', any: ['automated', 'automation', 'api suite', 'smoke suite', 'pipeline', 'minutes'] },
        { id: 'rollback', point: 'Mitigation: rollback plan, feature flag, monitoring', any: ['rollback', 'roll back', 'feature flag', 'monitor', 'canary'] },
        { id: 'collab', point: 'Collaborative tone; decision made with stakeholders', any: ['discuss', 'align', 'together', 'stakeholder', 'product owner', 'agree'] },
      ],
      redFlags: [{ any: ['refuse to release', 'never release'], note: 'Absolute refusal without options reads as gatekeeping, not leadership.' }],
      structure: 'Acknowledge the urgency → explain the risk → offer a proportionate plan with time estimate → mitigation → who decides.',
      modelAnswer: '"I understand the urgency, but the size of the change isn\'t the risk — the blast radius is. If authentication breaks, nobody can use the product. Instead of full regression I\'d run a focused pack: our automated auth API tests and login/SSO/session smoke across roles, about 20 minutes. In parallel we confirm a rollback plan and watch login error rates for an hour after deploy. If the hotfix is truly urgent and something fails, we decide together with the product owner, with the risk written down."',
      followUp: 'The automated auth tests are flaky and you can\'t trust them today. What now?',
      revision: ['m01', 'm20'],
    },
  ],
  flashcards: [
    { id: 'fc-m01-1', skill: 'fundamentals', moduleId: 'm01', front: 'Verification vs validation in one line each', back: 'Verification: are we building the product right (vs spec)? Validation: are we building the right product (vs user needs)?' },
    { id: 'fc-m01-2', skill: 'fundamentals', moduleId: 'm01', front: 'Smoke vs sanity', back: 'Smoke: broad & shallow, is the build testable (every build). Sanity: narrow & deep, did this fix work without breaking neighbours.' },
    { id: 'fc-m01-3', skill: 'fundamentals', moduleId: 'm01', front: 'The ice-cream cone anti-pattern', back: 'Mostly UI/manual tests, few unit tests → slow CI, flaky builds, high maintenance, lost trust in automation.' },
    { id: 'fc-m01-4', skill: 'fundamentals', moduleId: 'm01', front: 'Boundary values for an inclusive range min..max', back: 'min−1, min, min+1, max−1, max, max+1' },
    { id: 'fc-m01-5', skill: 'fundamentals', moduleId: 'm01', front: 'Severity vs priority', back: 'Severity = technical/user impact. Priority = business urgency to fix. They can disagree (logo typo: low severity, high priority).' },
    { id: 'fc-m01-6', skill: 'qaStrategy', moduleId: 'm01', front: 'Risk-based testing formula', back: 'Risk = likelihood × impact. Spend test effort where both are high.' },
  ],
};
