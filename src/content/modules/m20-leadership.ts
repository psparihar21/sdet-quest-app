import { opts, type ModuleBundle } from '../bundle';
import { VIDEOS } from '../videos';
import { OUTLINE } from '../outline';

const meta = OUTLINE.find((m) => m.id === 'm20')!;

export const m20: ModuleBundle = {
  module: {
    ...meta,
    lessons: [
      {
        id: 'm20-l1',
        title: 'Strategy, planning, estimation and automation ROI',
        minutes: 35,
        sections: [
          {
            kind: 'learn',
            title: 'From test plan to quality strategy',
            body: `**Test strategy** (long-lived, org or product level): quality goals, risk approach, test levels and ownership, environments, data, tooling, automation approach, metrics, release gates.
**Test plan** (per release/feature): scope, out of scope, schedule, resources, entry/exit criteria, risks, deliverables.

**Estimation techniques:**
- **Work breakdown** — list test activities (design, data, automation, execution, regression, exploratory, bug verification) and estimate each.
- **Three-point (PERT)** — (optimistic + 4 × likely + pessimistic) ÷ 6; communicates uncertainty.
- **Ratio/historical** — testing effort as a % of dev effort from past releases, adjusted for risk.
- Always state **assumptions** (environment ready by X, API stable) and **risks**; re-estimate when they break.

**Capacity planning:** people × focus days − meetings, leave, support rotation, maintenance (often 20–30% for a large suite).

**Automation ROI** — a simple, honest model:
- Manual cost per regression cycle = cases × minutes ÷ 60 × hourly cost × cycles per year
- Automation cost = build + yearly maintenance + infrastructure
- Payback period = automation cost ÷ yearly manual savings
Then the real arguments: faster feedback (bugs found in minutes, not days), more frequent releases, freed testers for exploratory work, fewer escapes. And when **not** to automate: one-off features, rapidly changing UI, low-risk areas, tests cheaper to run by hand than to maintain.

**Automation roadmap:** baseline → foundations (framework, CI, data) → critical paths → API coverage of business rules → expand by risk → optimise (flaky, speed) — with quarterly metrics.

**Release readiness:** gates agreed in advance (no open P0/P1, critical journeys green, regression pass rate ≥ X with known failures triaged, perf/security checks, rollback plan, monitoring ready). The lead *recommends* with evidence; the decision is shared with product/engineering.`,
          },
          { kind: 'video', title: 'Watch: what goes into a test strategy', video: VIDEOS.testStrategy },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m20-q1', 'm20-q2', 'm20-q3'] },
          { kind: 'practice', title: 'Automation ROI calculator', problemId: 'js-automation-roi' },
          { kind: 'interview', title: 'Interview drill', interviewId: 'iv-m20-invest' },
        ],
      },
      {
        id: 'm20-l2',
        title: 'People: stakeholders, mentoring, hiring, conflict',
        minutes: 30,
        sections: [
          {
            kind: 'learn',
            title: 'Leading without (only) authority',
            body: `**Stakeholder management:** know what each cares about — product (scope, date, customer impact), engineering managers (velocity, predictability), developers (fast feedback, low noise), support (escapes). Report in their terms: risk, impact, options, recommendation.

**Developer collaboration:** QA as a partner, not a gate. Pair on testability, review unit tests, share failure triage. "Quality is a team responsibility; I make it visible and easy."

**Prioritisation under deadlines:** risk × impact; protect critical journeys and compliance (payroll, statutory leave); explicitly descope low-risk areas and **write down** what wasn't tested.

**Communication:** one clear message per audience — a daily one-line quality status for the team, a weekly risk summary for managers, a release recommendation with evidence for decision-makers. Bad news early, with options.

**Production quality and cross-functional collaboration:** own the loop from production back to the team — review incidents and escaped defects with developers, support and product; agree on monitors and alerts with DevOps/SRE; run joint bug bashes before big releases.

**Interviewing candidates:** use a scorecard per competency, the same core questions for every candidate, a practical exercise close to the real job, and independent scoring before the debrief.

**Technical debt in test code:** track it like product debt — flaky list, slow tests, duplicated coverage, outdated frameworks — and reserve capacity (e.g. 15–20% per sprint).

**Mentoring:** set expectations, pair, code-review with reasons, give stretch tasks with support, regular 1:1s, celebrate learning. Show outcomes ("two new joiners shipping tests in week 2").

**Hiring & interviewing:** define the bar per level; structured interviews with rubrics (coding, design, scenario, behavioral); practical exercises over trivia; calibrate panels to reduce bias.

**Delegation:** delegate outcomes, not steps; match task to growth goals; agree checkpoints; stay accountable.

**Conflict resolution:** listen first, separate people from problem, use data, find shared goals (ship safely), propose options, escalate with facts when needed — not as a threat.

**Escalation:** escalate early, with impact, options and a recommendation — "Leave approvals fail for 2% of users; options A/B/C; I recommend B; need a decision by 3 pm."`,
          },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m20-q4', 'm20-q5', 'm20-q6'] },
          { kind: 'interview', title: 'Interview drill', interviewId: 'iv-m20-conflict' },
          { kind: 'interview', title: 'Interview drill: first 90 days', interviewId: 'iv-m20-90days' },
        ],
      },
    ],
  },
  questions: [
    {
      id: 'm20-q1', skill: 'qaStrategy', moduleId: 'm20', type: 'mcq', difficulty: 2,
      prompt: 'Test strategy vs test plan?',
      options: opts('Synonyms', 'Strategy: long-lived approach and principles; plan: scope, schedule and criteria for a specific release/feature', 'Strategy is per test case', 'Plans are only for manual testing'),
      answer: ['b'],
      explanation: 'Strategy sets the approach; plans apply it to a concrete delivery.',
    },
    {
      id: 'm20-q2', skill: 'qaStrategy', moduleId: 'm20', type: 'mcq', difficulty: 2,
      prompt: 'Optimistic 4 days, most likely 6, pessimistic 14. PERT estimate?',
      options: opts('6', '7', '8', '8 days ± 0'),
      answer: ['b'],
      explanation: '(4 + 4×6 + 14) ÷ 6 = 42 ÷ 6 = 7 days. Mention the wide range as a risk.',
    },
    {
      id: 'm20-q3', skill: 'qaStrategy', moduleId: 'm20', type: 'multi', difficulty: 2,
      prompt: 'When is automation usually NOT worth it?',
      options: opts('A one-off data migration check', 'A UI that is being redesigned next sprint', 'Payroll tax rules run every release', 'A low-risk admin page used twice a year', 'Login and leave application'),
      answer: ['a', 'b', 'd'],
      explanation: 'High-frequency, high-risk, stable behaviour pays back; one-offs and volatile UIs don\'t.',
    },
    {
      id: 'm20-q4', skill: 'leadership', moduleId: 'm20', type: 'scenario', difficulty: 3,
      prompt: 'A senior developer dismisses your bug as "works as designed" in front of the team. Best response?',
      options: opts('Argue until they concede', 'Acknowledge, take it offline, bring evidence (requirement, user impact) and involve the product owner to decide the expected behaviour', 'Close the bug', 'Escalate to their manager immediately'),
      answer: ['b'],
      explanation: 'Separate the person from the problem, use evidence, and let the owner of requirements decide.',
    },
    {
      id: 'm20-q5', skill: 'leadership', moduleId: 'm20', type: 'mcq', difficulty: 2,
      prompt: 'Best way to delegate building the new API test framework to a mid-level SDET?',
      options: opts('Give step-by-step instructions and check every commit', 'Agree on the outcome, constraints and checkpoints; support with reviews; stay accountable', 'Hand it over and check back in a month', 'Do it yourself'),
      answer: ['b'],
      explanation: 'Delegate outcomes with checkpoints — it grows the person and protects delivery.',
    },
    {
      id: 'm20-q6', skill: 'leadership', moduleId: 'm20', type: 'mcq', difficulty: 2,
      prompt: 'What makes an escalation effective?',
      options: opts('Doing it as late as possible', 'Early, with impact, options, a recommendation and a decision deadline', 'Copying as many people as possible', 'Only verbal'),
      answer: ['b'],
      explanation: 'Escalation is a request for a decision, not a complaint.',
    },
  ],
  problems: [
    {
      kind: 'js', id: 'js-automation-roi', title: 'Automation ROI calculator', skill: 'qaStrategy', moduleId: 'm20', difficulty: 2,
      statement: 'Write `roi(input)` where input = `{ cases, manualMinutesPerCase, cyclesPerYear, hourlyCost, buildHours, maintenanceHoursPerYear }`. Return `{ manualCostPerYear, automationCostFirstYear, savingsFirstYear, paybackMonths }`: manual cost = cases × minutes ÷ 60 × hourlyCost × cycles; automation first-year cost = (buildHours + maintenanceHoursPerYear) × hourlyCost; savings = manual − automation; paybackMonths = buildHours × hourlyCost ÷ ((manual − maintenance cost) ÷ 12), rounded to 1 decimal, or `null` if yearly manual cost does not exceed maintenance cost. Round money to whole numbers.',
      examples: [{ input: 'roi({ cases: 300, manualMinutesPerCase: 10, cyclesPerYear: 24, hourlyCost: 20, buildHours: 400, maintenanceHoursPerYear: 200 })', output: '{ manualCostPerYear: 24000, automationCostFirstYear: 12000, savingsFirstYear: 12000, paybackMonths: 4.8 }' }],
      constraints: ['A model to support a conversation, not a guarantee'],
      functionName: 'roi',
      starter: 'function roi(i: { cases: number; manualMinutesPerCase: number; cyclesPerYear: number; hourlyCost: number; buildHours: number; maintenanceHoursPerYear: number }) {\n  return {};\n}',
      tests: [
        { args: [{ cases: 300, manualMinutesPerCase: 10, cyclesPerYear: 24, hourlyCost: 20, buildHours: 400, maintenanceHoursPerYear: 200 }], expected: { manualCostPerYear: 24000, automationCostFirstYear: 12000, savingsFirstYear: 12000, paybackMonths: 4.8 } },
        { args: [{ cases: 10, manualMinutesPerCase: 6, cyclesPerYear: 2, hourlyCost: 30, buildHours: 40, maintenanceHoursPerYear: 20 }], expected: { manualCostPerYear: 60, automationCostFirstYear: 1800, savingsFirstYear: -1740, paybackMonths: null } },
        { args: [{ cases: 100, manualMinutesPerCase: 15, cyclesPerYear: 12, hourlyCost: 25, buildHours: 150, maintenanceHoursPerYear: 50 }], expected: { manualCostPerYear: 7500, automationCostFirstYear: 5000, savingsFirstYear: 2500, paybackMonths: 7.2 }, hidden: true },
      ],
      hints: ['Compute maintenance cost per year separately; payback uses net monthly savings.'],
      solution: {
        code: `function roi(i: { cases: number; manualMinutesPerCase: number; cyclesPerYear: number; hourlyCost: number; buildHours: number; maintenanceHoursPerYear: number }) {
  const manual = (i.cases * i.manualMinutesPerCase / 60) * i.hourlyCost * i.cyclesPerYear;
  const maintenance = i.maintenanceHoursPerYear * i.hourlyCost;
  const build = i.buildHours * i.hourlyCost;
  const netMonthly = (manual - maintenance) / 12;
  return {
    manualCostPerYear: Math.round(manual),
    automationCostFirstYear: Math.round(build + maintenance),
    savingsFirstYear: Math.round(manual - build - maintenance),
    paybackMonths: netMonthly > 0 ? Math.round((build / netMonthly) * 10) / 10 : null,
  };
}`,
        explanation: 'Cost alone undersells automation (faster feedback, more releases) and oversells it if maintenance is ignored. The second test shows a case where automation never pays back.',
        time: 'O(1)', space: 'O(1)',
      },
      followUps: ['Which non-financial benefits would you add when presenting this to a director?'],
    },
  ],
  interviews: [
    {
      id: 'iv-m20-invest', modes: ['qa-lead', 'full-qa-lead', 'behavioral'], skill: 'leadership', level: 'L6', kind: 'scenario',
      prompt: 'How would you convince management to invest two engineers for a quarter in test automation?',
      rubric: [
        { id: 'problem', point: 'Starts from a business problem with data (escapes, cycle time, cost)', any: ['escape', 'regression takes', 'release', 'cost', 'data', 'currently'] },
        { id: 'roi', point: 'ROI / payback reasoning', any: ['roi', 'payback', 'savings', 'hours', 'cost'] },
        { id: 'benefits', point: 'Non-financial benefits: speed, confidence, frequency', any: ['faster', 'feedback', 'frequent', 'confidence', 'release more'] },
        { id: 'plan', point: 'Phased plan with milestones', any: ['phase', 'milestone', 'first month', 'pilot', 'roadmap'] },
        { id: 'metrics', point: 'Success metrics reported regularly', any: ['metric', 'measure', 'report', 'kpi'] },
        { id: 'risk', point: 'Risks and how they are managed', any: ['risk', 'maintenance', 'flaky', 'if it does not'] },
      ],
      structure: 'Problem in business terms → proposal → cost & payback → benefits beyond cost → plan & metrics → risks.',
      modelAnswer: '"I\'d start with the problem in their language: regression takes 5 days per release, so we ship monthly, and last quarter 6 escaped defects cost X support hours. The proposal: two engineers for a quarter to automate API-level regression for leave and attendance plus 20 critical UI journeys. Cost about Y; at 24 regression cycles a year it pays back within the first year, before counting the bigger win — release every week instead of every month, and testers moved to exploratory work on new features. Plan: month 1 framework and CI, month 2 API coverage of business rules, month 3 UI journeys and flaky control. I\'d report regression duration, escape rate and flaky rate monthly, and if we\'re not on track by week 6, we re-plan rather than sink more cost."',
      followUp: 'Management says: "Developers should write the tests, not QA." How do you respond?',
      revision: ['m20', 'm21'],
    },
    {
      id: 'iv-m20-conflict', modes: ['qa-lead', 'behavioral', 'full-qa-lead'], skill: 'leadership', level: 'L6', kind: 'behavioral',
      prompt: 'Tell me about a time a developer or product manager disagreed with you about a quality issue. What did you do?',
      cvGrounded: true,
      rubric: [
        { id: 's', point: 'Situation with context', any: ['release', 'sprint', 'feature', 'team', 'we were'] },
        { id: 'listen', point: 'Listened and understood their view', any: ['listen', 'understood', 'their point', 'perspective', 'asked'] },
        { id: 'evidence', point: 'Used evidence (data, requirement, user impact)', any: ['data', 'evidence', 'requirement', 'logs', 'impact', 'users'] },
        { id: 'options', point: 'Proposed options / compromise', any: ['option', 'compromise', 'propose', 'alternative', 'feature flag'] },
        { id: 'result', point: 'Outcome and relationship afterwards', any: ['result', 'outcome', 'shipped', 'agreed', 'relationship', 'since then'] },
        { id: 'i', point: 'Uses "I" for own actions', any: ['i '] },
      ],
      structure: 'STAR, 2 minutes. Situation → your responsibility → what you did (listen, evidence, options) → outcome → what you learned.',
      modelAnswer: '"(Use a real situation from your Leave/Attendance work. Shape:) In a release, a developer marked my bug in attendance regularisation as \'works as designed\'. I asked how they read the requirement, then showed the HR policy and two support tickets from customers hitting the same case. We disagreed on expected behaviour, so I brought in the product owner with both views and the impact numbers; we agreed on a fix behind a flag for the next patch and a release note. Afterwards the developer started pinging me during refinement for edge cases. Lesson: bring evidence and options, and let the requirement owner decide."',
      followUp: 'What if the product owner had sided with the developer?',
      revision: ['m20', 'm23'],
    },
    {
      id: 'iv-m20-90days', modes: ['qa-lead', 'full-qa-lead'], skill: 'qaStrategy', level: 'L6', kind: 'scenario',
      prompt: 'You join as QA Lead for a team with no test documentation and a flaky UI suite. What do you do in your first 90 days?',
      rubric: [
        { id: 'listen', point: 'First 30 days: listen, learn product and pain points, baseline metrics', any: ['listen', 'learn', 'understand', 'baseline', 'first 30', 'stakeholder'] },
        { id: 'risk', point: 'Risk map of the product', any: ['risk', 'critical', 'map'] },
        { id: 'quick', point: 'Quick wins (stabilise flaky suite, smoke in CI)', any: ['quick win', 'flaky', 'quarantine', 'smoke'] },
        { id: 'strategy', point: 'Write and agree a strategy and roadmap', any: ['strategy', 'roadmap', 'plan', 'agree'] },
        { id: 'people', point: 'Team: skills, roles, mentoring', any: ['team', 'skill', 'mentor', 'one on one', '1:1'] },
        { id: 'metrics', point: 'Define and report metrics', any: ['metric', 'report', 'dashboard', 'measure'] },
      ],
      structure: '30 / 60 / 90 days: learn & baseline → quick wins & strategy → execute & measure.',
      modelAnswer: '"Days 1–30: listen and learn — 1:1s with the team, developers, product and support; walk the product; map critical journeys and risks; baseline escape rate, flaky rate, regression time. Days 31–60: quick wins — quarantine flaky tests with owners, get a reliable smoke suite gating deploys — and write a lightweight test strategy and roadmap agreed with engineering and product. Days 61–90: execute — API coverage for high-risk rules, definition of done including tests, a skills plan for the team, and a monthly quality report. Success at 90 days: trusted CI, agreed strategy, and measurable improvement on at least two metrics."',
      followUp: 'Your manager wants a 100% automation target. How do you respond?',
      revision: ['m20', 'm21'],
    },
  ],
  flashcards: [
    { id: 'fc-m20-1', skill: 'qaStrategy', moduleId: 'm20', front: 'PERT estimate', back: '(Optimistic + 4 × Likely + Pessimistic) ÷ 6.' },
    { id: 'fc-m20-2', skill: 'leadership', moduleId: 'm20', front: 'Good escalation', back: 'Early; impact, options, recommendation and a decision deadline.' },
    { id: 'fc-m20-3', skill: 'qaStrategy', moduleId: 'm20', front: 'Automation payback', back: 'Build cost ÷ net monthly savings (manual cost − maintenance).' },
  ],
};
