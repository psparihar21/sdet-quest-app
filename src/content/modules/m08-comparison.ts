import { opts, type ModuleBundle } from '../bundle';
import { VIDEOS } from '../videos';
import { OUTLINE } from '../outline';

const meta = OUTLINE.find((m) => m.id === 'm08')!;

export const m08: ModuleBundle = {
  module: {
    ...meta,
    lessons: [
      {
        id: 'm08-l1',
        title: 'Choosing between Selenium and Playwright',
        minutes: 30,
        sections: [
          {
            kind: 'learn',
            title: 'A senior comparison',
            body: `| Dimension | Selenium 4 | Playwright |
|---|---|---|
| Protocol | W3C WebDriver (HTTP per command) + BiDi | Persistent connection to the browser |
| Waiting | Explicit waits you write | Auto-waiting + web-first assertions |
| Isolation | New driver/session per test (slow) or reuse (leaky) | New BrowserContext per test (ms) |
| Parallelism | TestNG/JUnit threads + Grid nodes | Worker processes + sharding built in |
| Browsers | Real Chrome, Edge, Firefox, Safari (real Safari via safaridriver) | Chromium, Firefox, WebKit builds (WebKit ≠ real Safari); branded Chrome/Edge channels |
| Languages | Java, C#, Python, JS, Ruby, Kotlin | TS/JS (best), Python, Java, .NET |
| Network | Limited (BiDi improving) | route(): mock, modify, abort, wait for response |
| Debugging | Screenshots, logs | Trace viewer, UI mode, inspector |
| Mobile | Appium (same protocol) for real devices | Device emulation only |
| Ecosystem | 15+ years, Grid, every cloud vendor | Fast-moving, test runner, agents, MCP |

**Performance and reliability:** per-command round trips and per-test browser sessions make Selenium suites slower at the same coverage; Playwright's persistent connection, cheap contexts and auto-waiting usually give faster and more stable runs. But most suite time is spent in the app under test and in waiting — measure your own suite before claiming a speed-up.

**Choose Selenium when:** a large, healthy Java suite already exists and works; you need real Safari or exotic browsers; Appium reuse matters; the team is Java-only and changing stack isn't justified.

**Choose Playwright when:** new suites; flaky timing-heavy SPAs; multi-user or multi-tab flows; you want built-in parallelism, tracing, API testing and network mocking; TypeScript front-end teams who'll co-own tests.

**Interview stance:** "It depends — here's on what." Never "Playwright is just better".`,
          },
          { kind: 'video', title: 'Watch: why Playwright feels faster', video: VIDEOS.pwVsSelenium },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m08-q1', 'm08-q2', 'm08-q3'] },
        ],
      },
      {
        id: 'm08-l2',
        title: 'Migrating without stopping the release train',
        minutes: 25,
        sections: [
          {
            kind: 'learn',
            title: 'A migration strategy you can defend',
            body: `Your knowledge base lists a **Playwright migration** project — expect "walk me through it". A defensible plan:

1. **Baseline and goal.** Measure today: suite time, flaky rate, maintenance hours per sprint, escaped defects. Define success (e.g. PR feedback < 15 min, flaky < 2%).
2. **Don't port, redesign.** Use the move to push business-rule checks into API tests. Only critical journeys come across as UI tests.
3. **Strangler pattern.** New tests in Playwright from day one; migrate by module, starting with the flakiest/highest-value area. Both suites run in CI during the transition.
4. **Foundations first.** Fixtures, auth state, data factories, reporting, CI sharding — then tests.
5. **Parity checks.** Map old cases to new ones in a matrix; retire Selenium tests only when the replacement has run green N times.
6. **People.** Pairing, a style guide, PR reviews; Java engineers learning TypeScript need time — budget it.
7. **Measure and report** the same metrics monthly.

**Risks:** two frameworks to maintain for months, coverage gaps during cut-over, WebKit ≠ real Safari, learning curve. Name them before the interviewer does.`,
          },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m08-q4', 'm08-q5'] },
          { kind: 'interview', title: 'Interview drill', interviewId: 'iv-m08-choose' },
          { kind: 'interview', title: 'Interview drill: your migration', interviewId: 'iv-m08-migration' },
        ],
      },
    ],
  },
  questions: [
    {
      id: 'm08-q1', skill: 'playwright', moduleId: 'm08', type: 'mcq', difficulty: 2,
      prompt: 'A key architectural reason Playwright tests are often faster than Selenium tests?',
      options: opts('Playwright uses a faster programming language', 'Persistent browser connection and cheap contexts instead of an HTTP request per command and a new browser session per test', 'Playwright skips rendering', 'Selenium doesn\'t support headless'),
      answer: ['b'],
      explanation: 'Fewer round trips and millisecond-cost isolation add up across thousands of commands.',
    },
    {
      id: 'm08-q2', skill: 'selenium', moduleId: 'm08', type: 'scenario', difficulty: 3,
      prompt: 'A bank must certify on real Safari on macOS and iOS devices, and has a stable 2,000-test Java Selenium + Appium suite with 1% flakiness. Recommendation?',
      options: opts('Rewrite everything in Playwright immediately', 'Keep Selenium/Appium for this suite; consider Playwright only for new web areas with clear benefits', 'Drop Safari support', 'Switch to manual testing'),
      answer: ['b'],
      explanation: 'A healthy suite plus real-Safari and Appium needs favour Selenium. Migration cost must buy something concrete.',
    },
    {
      id: 'm08-q3', skill: 'playwright', moduleId: 'm08', type: 'multi', difficulty: 2,
      prompt: 'Which are genuine Playwright strengths?',
      options: opts('Built-in network interception/mocking', 'Trace viewer for debugging CI failures', 'Real iOS device automation', 'Built-in sharding and parallel workers', 'Auto-waiting before actions'),
      answer: ['a', 'b', 'd', 'e'],
      explanation: 'Real mobile devices are Appium territory; Playwright emulates viewports and user agents.',
    },
    {
      id: 'm08-q4', skill: 'framework', moduleId: 'm08', type: 'mcq', difficulty: 3,
      prompt: 'Best first step in a Selenium → Playwright migration?',
      options: opts('Auto-convert all scripts', 'Baseline current metrics and define success criteria, then build foundations (fixtures, auth, data, CI)', 'Delete the Selenium suite', 'Migrate the easiest tests first to show progress'),
      answer: ['b'],
      explanation: 'Without a baseline you can\'t prove the migration helped; without foundations each migrated test repeats setup code.',
    },
    {
      id: 'm08-q5', skill: 'framework', moduleId: 'm08', type: 'mcq', difficulty: 2,
      prompt: 'When can a Selenium test be retired during migration?',
      options: opts('As soon as a Playwright version is written', 'When the replacement covers the same risk and has run green consistently in CI', 'Never', 'When the manager asks'),
      answer: ['b'],
      explanation: 'Parity of risk coverage plus a stability record prevents silent coverage gaps.',
    },
  ],
  problems: [],
  interviews: [
    {
      id: 'iv-m08-choose', modes: ['automation', 'framework', 'full-sdet3'], skill: 'playwright', level: 'L4', kind: 'scenario',
      prompt: 'We are a SaaS company with a React front end and a Java back end. We have no UI automation. Selenium or Playwright — and why?',
      rubric: [
        { id: 'depends', point: 'Frames the decision on context, not hype', any: ['depends', 'context', 'trade off', 'tradeoff', 'criteria'] },
        { id: 'pw', point: 'Playwright strengths relevant here (auto-wait, isolation, tracing, parallel, network)', any: ['auto wait', 'auto-wait', 'context', 'trace', 'parallel', 'route', 'mock'] },
        { id: 'team', point: 'Team skills and ownership (TS with front-end devs vs Java)', any: ['team', 'skill', 'typescript', 'front end', 'frontend', 'developers', 'java'] },
        { id: 'browser', point: 'Browser coverage needs (WebKit vs real Safari)', any: ['safari', 'webkit', 'browser coverage', 'cross browser'] },
        { id: 'cost', point: 'Cost/maintenance/CI considerations', any: ['maintenance', 'cost', 'ci', 'pipeline', 'speed'] },
        { id: 'poc', point: 'Validate with a proof of concept and success metrics', any: ['proof of concept', 'poc', 'pilot', 'spike', 'measure'] },
      ],
      redFlags: [{ any: ['selenium is dead', 'selenium is outdated'], note: 'Selenium is actively maintained (Selenium 4, BiDi). Dismissing it sounds junior.' }],
      structure: 'Clarify needs → criteria → recommendation → risks → how you\'d validate it.',
      modelAnswer: '"First I\'d confirm browser requirements and who will write tests. Assuming Chrome/Edge/Firefox plus Safari via WebKit is acceptable, I\'d choose Playwright with TypeScript: the React developers can contribute in their own language, auto-waiting and per-test contexts cut flakiness, tracing makes CI failures debuggable, and parallelism, API testing and network mocking are built in. Back-end API tests can stay in Java with REST Assured if that team prefers. Risks: WebKit isn\'t real Safari, so if customers need certified Safari I\'d add a small real-device check on a cloud provider. I\'d run a two-week proof of concept on the leave-approval journey and compare stability and run time before committing."',
      followUp: 'Six months later the front-end team won\'t write tests. What do you change?',
      revision: ['m08', 'm07'],
    },
    {
      id: 'iv-m08-migration', modes: ['automation', 'framework', 'qa-lead', 'full-qa-lead'], skill: 'framework', level: 'L5', kind: 'behavioral',
      prompt: 'Tell me about the Playwright migration you worked on. Why did you do it, how did you run it, and what was the measurable result?',
      cvGrounded: true,
      rubric: [
        { id: 'why', point: 'Business/technical reason with baseline numbers', any: ['flaky', 'slow', 'maintenance', 'baseline', 'because'] },
        { id: 'plan', point: 'Incremental plan (strangler, module by module, foundations first)', any: ['phase', 'module by module', 'incremental', 'pilot', 'foundation', 'first'] },
        { id: 'role', point: 'Own role with "I" statements', any: ['i led', 'i designed', 'i built', 'i proposed', 'i owned', 'my role'] },
        { id: 'people', point: 'Team enablement (training, reviews, guidelines)', any: ['train', 'mentor', 'review', 'guideline', 'pair'] },
        { id: 'result', point: 'Measured result', any: ['%', 'minutes', 'reduced', 'from', 'hours'] },
        { id: 'lesson', point: 'What you\'d do differently', any: ['differently', 'learned', 'lesson', 'next time', 'mistake'] },
      ],
      structure: 'STAR: context and baseline → your responsibility → actions in phases → numbers → lesson.',
      modelAnswer: '"(Answer only with what really happened — if you don\'t have a number, say so and explain how you\'d measure it.) Example shape: Our Selenium suite took about N hours and failed intermittently on async approvals. I proposed piloting Playwright on the attendance module, built fixtures and per-role auth state first, then migrated module by module while both suites ran. I paired with two engineers and added review guidelines. Result: [real numbers]. What I\'d change: move more checks to API tests before migrating UI tests."',
      followUp: 'What did the migration cost, and how did you justify it to your manager?',
      revision: ['m08', 'm23'],
    },
  ],
  flashcards: [
    { id: 'fc-m08-1', skill: 'playwright', moduleId: 'm08', front: 'When to keep Selenium', back: 'Healthy existing Java suite, real Safari/exotic browsers, Appium reuse, Java-only team.' },
    { id: 'fc-m08-2', skill: 'framework', moduleId: 'm08', front: 'Migration pattern', back: 'Baseline → foundations → strangler (new in PW, migrate by module) → parity matrix → retire after stable green.' },
  ],
};
