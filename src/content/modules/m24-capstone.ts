import { opts, type ModuleBundle } from '../bundle';
import { OUTLINE } from '../outline';

const meta = OUTLINE.find((m) => m.id === 'm24')!;

export const m24: ModuleBundle = {
  module: {
    ...meta,
    lessons: [
      {
        id: 'm24-l1',
        title: 'Your portfolio project: LeaveFlow',
        minutes: 20,
        sections: [
          {
            kind: 'learn',
            title: 'Why a capstone wins interviews',
            body: `Every senior interview eventually asks "show me something you built". The capstone gives you a project you can open on screen and defend: strategy, architecture, trade-offs, failures and **measured results**.

**LeaveFlow** is an HRMS leave & attendance platform — deliberately close to the domain you already know, so your strategy decisions are informed and your stories are credible. The full roadmap (5 phases, 18 tasks, acceptance criteria and review checkpoints) lives on the **Projects** page; this module covers how to present it.

**How a reviewer reads your repo (in this order):**
1. README: what it is, architecture diagram, how to run it in one command, results.
2. Test strategy and risk register — is effort proportional to risk?
3. Framework code — layering, readability, no sleeps, no secrets.
4. CI — does it run, how fast, what's reported?
5. Evidence — reports, traces, flaky metrics, AI experiment write-up.

**Telling the story (2 minutes):** problem → architecture → three decisions with trade-offs (e.g. API-first coverage, Playwright for new UI with Selenium kept for admin, contract tests for the payroll event) → numbers (suite time, flaky rate, coverage of high risks) → what you'd do next.`,
          },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m24-q1', 'm24-q2'] },
          {
            kind: 'build',
            title: 'Publish the capstone',
            task: 'Complete the Projects roadmap to at least Phase 3, then publish the repository (public or shareable) with a README containing: architecture diagram, how to run, the test pyramid with real counts, CI link/badge, three trade-offs, and measured results.',
            acceptance: [
              'Runs locally with one documented command',
              'CI green with reports as artifacts',
              'README states real counts and timings',
              'No company code, data, URLs or secrets in the repo',
              'Three trade-offs explained',
            ],
          },
          { kind: 'interview', title: 'Present your project', interviewId: 'iv-m24-present' },
        ],
      },
    ],
  },
  questions: [
    {
      id: 'm24-q1', skill: 'framework', moduleId: 'm24', type: 'mcq', difficulty: 1,
      prompt: 'What should a reviewer be able to do within 5 minutes of opening your capstone repo?',
      options: opts('Read all the code', 'Understand what it is, see the architecture, and run it with one documented command', 'Watch a demo video only', 'Nothing — they should ask you'),
      answer: ['b'],
      explanation: 'A clear README is part of the deliverable.',
    },
    {
      id: 'm24-q2', skill: 'qaStrategy', moduleId: 'm24', type: 'mcq', difficulty: 2,
      prompt: 'Which is safe to include in a public portfolio project?',
      options: opts('Your employer\'s test code with names changed', 'A demo app and tests you wrote yourself, with synthetic data', 'Screenshots of internal dashboards', 'Production API URLs for realism'),
      answer: ['b'],
      explanation: 'Never publish employer code, data, URLs or internal screenshots.',
    },
  ],
  problems: [],
  interviews: [
    {
      id: 'iv-m24-present', modes: ['framework', 'qa-lead', 'full-sdet3', 'full-qa-lead'], skill: 'framework', level: 'L5', kind: 'design',
      prompt: 'Walk me through a test automation project you built end to end — architecture, key decisions, and results.',
      cvGrounded: true,
      rubric: [
        { id: 'problem', point: 'What problem/system it addresses', any: ['problem', 'system', 'app', 'platform', 'leaveflow', 'product'] },
        { id: 'arch', point: 'Architecture and layers', any: ['architecture', 'layer', 'api', 'ui', 'contract', 'framework'] },
        { id: 'decisions', point: 'Key decisions with trade-offs', any: ['decided', 'chose', 'trade off', 'tradeoff', 'instead of', 'because'] },
        { id: 'ci', point: 'CI, parallelism, reporting', any: ['ci', 'pipeline', 'parallel', 'shard', 'report'] },
        { id: 'results', point: 'Measured results', any: ['minutes', '%', 'flaky rate', 'tests', 'reduced'] },
        { id: 'next', point: 'What you would improve next', any: ['next', 'improve', 'would add', 'differently'] },
      ],
      structure: 'Problem → architecture → 3 decisions with trade-offs → CI and quality signals → numbers → next steps.',
      modelAnswer: '"(Describe your real capstone.) LeaveFlow is a small HRMS I built to practise enterprise testing: a React front end, a Node leave service with PostgreSQL, and a payroll consumer on Kafka. I wrote a risk-based strategy, then built API tests for business rules (most of the suite), a contract test for the leave.approved event, a thin Playwright layer for 12 journeys with per-role storage state, and a small Selenium suite for the admin panel to compare approaches. GitHub Actions runs unit, API and contract checks on every PR in about 6 minutes and sharded E2E after merge. Decisions: API-first to keep the pyramid healthy; contract tests instead of shared E2E for the payroll integration; Playwright agents tried for generation, with the share of usable generated tests measured (use your real figure). Next: ephemeral environments per PR."',
      followUp: 'What was the hardest bug you found in your own project, and how did you find it?',
      revision: ['m24', 'm10'],
    },
  ],
  flashcards: [
    { id: 'fc-m24-1', skill: 'framework', moduleId: 'm24', front: 'Portfolio README must show…', back: 'What it is, architecture, one-command run, test pyramid counts, CI, trade-offs, measured results.' },
  ],
};
