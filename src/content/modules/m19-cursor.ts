import { opts, type ModuleBundle } from '../bundle';
import { VIDEOS } from '../videos';
import { OUTLINE } from '../outline';

const meta = OUTLINE.find((m) => m.id === 'm19')!;

export const m19: ModuleBundle = {
  module: {
    ...meta,
    lessons: [
      {
        id: 'm19-l1',
        title: 'Senior habits with AI coding agents',
        minutes: 30,
        sections: [
          {
            kind: 'learn',
            title: 'Cursor, Claude Code, Copilot: the shared mental model',
            body: `Tools differ in UI, but the building blocks are the same:

| Concept | What it is | How a senior SDET uses it |
|---|---|---|
| **Ask / chat** | Q&A about code | Understand an unfamiliar framework fast |
| **Plan mode** | Agent investigates and proposes a plan without editing | Agree on approach before any change; catch wrong assumptions cheaply |
| **Agent mode** | Agent edits files and runs commands in a loop | Bounded tasks with a clear definition of done |
| **Context** | Files, docs, terminal output, @-mentions, indexed codebase | Point it at the right examples; small focused context beats "the whole repo" |
| **Context window** | Max tokens per turn | Long sessions degrade — summarise, restart with a plan file |
| **Rules / instructions** | Persistent project guidance (Cursor: .cursor/rules/*.mdc; many tools read AGENTS.md / CLAUDE.md) | Encode conventions: "use getByRole, fixtures from tests/fixtures, no waitForTimeout" |
| **Skills** | Packaged, task-specific instructions/scripts loaded on demand | "Write an API test in our framework" with templates |
| **Hooks** | Commands run on agent events (after edit, before commit) | Auto-run lint, typecheck and affected tests so the agent gets feedback |
| **MCP** | External tools (browser, Jira, DB) | Playwright MCP to explore the app; read-only DB for test data |

**Typical automation-engineering tasks with an agent:**
- **Test generation:** give it the story, an existing test as a style example and the page object; ask for cases first, code second.
- **Refactoring:** "extract a DatePicker component used by these three pages, keep behaviour identical, run the suite" — small, verifiable steps.
- **Debugging:** feed the failing trace/log and ask for ranked hypotheses plus the evidence that would confirm each; you decide.
- **Code review:** ask it to review a PR against your checklist — as a second reviewer, not the only one.
- **Codebase indexing** lets the agent search your repo semantically; still @-mention the exact files that matter.
- **Agent planning and execution:** in plan mode it proposes steps; in agent mode it executes them, running tools until the task's definition of done is met.

**Workflow that works:**
1. **Plan:** describe the goal, constraints and acceptance criteria; review the plan.
2. **Execute in small steps:** one test file or one refactor at a time.
3. **Verify:** the agent must run the tests; you read the diff. Ask it to make a test fail on purpose to prove it tests something.
4. **Review like a PR:** naming, duplication, flakiness patterns, hidden sleeps, secrets, licence of copied code.
5. **Feed back:** when it repeats a mistake, add a rule rather than correcting it every time.

**AI-generated code risks:** plausible-but-wrong logic, hallucinated APIs, outdated library usage, security issues (string-built SQL, logged secrets), over-broad changes, tests that mirror the implementation, licence/IP concerns, and **skill atrophy** — interviewers will test what *you* can do without the agent.`,
          },
          { kind: 'video', title: 'Watch: how senior engineers use Cursor', video: VIDEOS.cursor },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m19-q1', 'm19-q2', 'm19-q3', 'm19-q4'] },
          {
            kind: 'build',
            title: 'Write the rules file for your automation repo',
            task: 'Write a rules/instructions file (e.g. .cursor/rules/testing.mdc or AGENTS.md) for your Playwright or Selenium repo: conventions, folder layout, locator policy, waits policy, data rules, how to run tests, definition of done for AI changes, and things the agent must never do.',
            acceptance: [
              'Concrete do/don\'t rules with examples',
              'Exact commands to run lint, typecheck and tests',
              'Definition of done includes running tests and showing output',
              'Never: commit secrets, touch production, weaken assertions to make tests pass',
              'Short enough to stay in context (under ~150 lines)',
            ],
          },
          { kind: 'interview', title: 'Interview drill', interviewId: 'iv-m19-ai-code' },
        ],
      },
    ],
  },
  questions: [
    {
      id: 'm19-q1', skill: 'cursor', moduleId: 'm19', type: 'mcq', difficulty: 1,
      prompt: 'Best use of plan mode before a large refactor of the page objects?',
      options: opts('Skip it to save time', 'Have the agent investigate and propose an approach you review before any files change', 'Use it only for documentation', 'Let it edit everything at once'),
      answer: ['b'],
      explanation: 'Correcting a plan is cheap; correcting 60 changed files is not.',
    },
    {
      id: 'm19-q2', skill: 'cursor', moduleId: 'm19', type: 'mcq', difficulty: 2,
      prompt: 'The agent keeps writing `waitForTimeout(2000)` despite your corrections. Best fix?',
      options: opts('Correct it every time', 'Add a project rule (rules/AGENTS.md) forbidding it, with the preferred pattern; optionally a lint rule enforced by a hook', 'Switch models', 'Accept it'),
      answer: ['b'],
      explanation: 'Persistent rules plus automated checks scale; repeated chat corrections don\'t.',
    },
    {
      id: 'm19-q3', skill: 'cursor', moduleId: 'm19', type: 'multi', difficulty: 2,
      prompt: 'Risks of AI-generated test code you must review for:',
      options: opts('Hallucinated APIs/locators', 'Assertions copied from current (possibly wrong) behaviour', 'Secrets or real PII in fixtures', 'Overly broad changes outside the task', 'Code that is too well tested'),
      answer: ['a', 'b', 'c', 'd'],
      explanation: 'Review AI code as if a fast, confident junior wrote it.',
    },
    {
      id: 'm19-q4', skill: 'cursor', moduleId: 'm19', type: 'mcq', difficulty: 2,
      prompt: 'A long agent session starts ignoring earlier instructions and repeating mistakes. Likely cause and fix?',
      options: opts('The model is broken', 'Context-window pressure; summarise into a plan/notes file and start a fresh session with focused context', 'Too few files open', 'Hooks are disabled'),
      answer: ['b'],
      explanation: 'Earlier context gets truncated or diluted. Fresh, focused context restores quality.',
    },
  ],
  problems: [],
  interviews: [
    {
      id: 'iv-m19-ai-code', modes: ['ai-mcp', 'qa-lead'], skill: 'cursor', level: 'L7', kind: 'scenario',
      prompt: 'Your team now writes most new tests with AI coding agents. As the lead, how do you keep quality high?',
      rubric: [
        { id: 'rules', point: 'Project rules/instructions and examples', any: ['rule', 'agents.md', 'instruction', 'convention', 'example', 'template'] },
        { id: 'plan', point: 'Plan before execute; small scoped tasks', any: ['plan', 'small', 'scope', 'step'] },
        { id: 'verify', point: 'Automated verification: run tests, lint, hooks, mutation/fail-first', any: ['run the tests', 'lint', 'hook', 'ci', 'fail', 'mutation', 'verify'] },
        { id: 'review', point: 'Human code review with AI-specific checklist', any: ['review', 'checklist', 'pull request', 'human'] },
        { id: 'risks', point: 'Names risks: hallucination, weak assertions, secrets, licence', any: ['hallucinat', 'weak assertion', 'secret', 'licen', 'security', 'wrong'] },
        { id: 'measure', point: 'Measures impact (escape rate, flaky rate, review time)', any: ['measure', 'metric', 'flaky rate', 'defect', 'time'] },
        { id: 'skills', point: 'Keeps team skills sharp / ownership', any: ['skill', 'learn', 'understand', 'ownership', 'accountab'] },
      ],
      structure: 'Principles → guardrails before (rules, plans) → during (hooks, tests) → after (review, metrics) → people.',
      modelAnswer: '"Principle: the engineer who merges owns the code, whoever typed it. Before: a short rules file with our conventions and examples, and tasks scoped to one test file or feature with a plan reviewed first. During: hooks run lint, typecheck and the affected tests after every agent edit, and we require a fail-first check — the test must fail when the feature is broken. After: PR review with an AI checklist — hallucinated locators, assertions mirroring current behaviour, sleeps, secrets, scope creep. I\'d track flaky rate, escaped defects and review time to see if quality holds. And I\'d keep skills sharp: pairing sessions and occasional no-AI katas, because people still need to debug what the agent writes."',
      followUp: 'A junior engineer merges 2,000 lines of AI-generated tests nobody can explain. What do you do?',
      revision: ['m19', 'm20'],
    },
  ],
  flashcards: [
    { id: 'fc-m19-1', skill: 'cursor', moduleId: 'm19', front: 'Rules vs skills vs hooks', back: 'Rules: always-on conventions. Skills: task packages loaded on demand. Hooks: commands run on agent events.' },
    { id: 'fc-m19-2', skill: 'cursor', moduleId: 'm19', front: 'Prove an AI-written test works', back: 'Make it fail by breaking the feature (or mutating the assertion), then pass again.' },
  ],
};
