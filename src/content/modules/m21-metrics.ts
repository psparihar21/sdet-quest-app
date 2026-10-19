import { opts, type ModuleBundle } from '../bundle';
import { VIDEOS } from '../videos';
import { OUTLINE } from '../outline';

const meta = OUTLINE.find((m) => m.id === 'm21')!;

export const m21: ModuleBundle = {
  module: {
    ...meta,
    lessons: [
      {
        id: 'm21-l1',
        title: 'Metrics that change decisions',
        minutes: 30,
        sections: [
          {
            kind: 'learn',
            title: 'Useful, dangerous and vanity metrics',
            body: `**Rule:** a metric is useful only if someone would make a different decision when it moves. Pair every speed metric with a quality metric so you can't game one.

| Metric | Formula / meaning | Use it for | Watch out |
|---|---|---|---|
| **Defect leakage (escape rate)** | prod defects ÷ (pre-release + prod defects) for a release | Effectiveness of testing | Needs consistent severity rules |
| **Defect density** | defects ÷ size (KLOC, story points, modules) | Hotspot detection | Size measures are fuzzy |
| **MTTR / MTTD** | Mean time to restore / detect | Operational quality | Averages hide outliers |
| **Flaky rate** | flaky runs ÷ total runs | Trust in automation | Must be measured per commit |
| **Regression duration** | Wall-clock time of full regression | Release speed | Can be "improved" by deleting tests |
| **Test execution time (PR)** | Time to feedback | Developer experience | — |
| **Pass rate** | passed ÷ executed | Run health | 100% pass on a weak suite means nothing |
| **Automation %** | automated ÷ total cases | Rough progress | **Vanity** — counts cases, not risk covered |
| **Code coverage** | lines/branches executed by tests | Finding untested code | High coverage ≠ good assertions |
| **Risk coverage** | high-risk areas with tests ÷ high-risk areas | Strategy health | Needs an honest risk map |
| **Bug counts per tester** | — | Nothing good | Creates perverse incentives |

**KPIs vs metrics:** a KPI is one of the few metrics tied to a goal with a target ("escape rate below 5% by Q2"); everything else is diagnostic. Pick 3–5 KPIs per quarter.

**DORA metrics** (delivery performance): deployment frequency, lead time for changes, change failure rate, time to restore. QA influences all four — especially change failure rate.

**Quality trends:** show direction over time (last 6 releases), not single numbers; annotate changes ("migrated to Playwright here").`,
          },
          { kind: 'video', title: 'Watch: DORA metrics', video: VIDEOS.dora },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m21-q1', 'm21-q2', 'm21-q3', 'm21-q4'] },
          { kind: 'practice', title: 'Quality metrics from release data', problemId: 'js-quality-metrics' },
          { kind: 'interview', title: 'Interview drill', interviewId: 'iv-m21-metrics' },
        ],
      },
    ],
  },
  questions: [
    {
      id: 'm21-q1', skill: 'metrics', moduleId: 'm21', type: 'mcq', difficulty: 2,
      prompt: '40 defects found before release, 10 found in production. Defect leakage?',
      options: opts('10%', '20%', '25%', '40%'),
      answer: ['b'],
      explanation: '10 ÷ (40 + 10) = 20%.',
    },
    {
      id: 'm21-q2', skill: 'metrics', moduleId: 'm21', type: 'mcq', difficulty: 2,
      prompt: 'Why is "95% automation coverage" a weak headline on its own?',
      options: opts('It is always false', 'It counts test cases, not whether the riskiest behaviour is covered or tests assert anything meaningful', 'Automation should be 100%', 'It is too hard to calculate'),
      answer: ['b'],
      explanation: 'Pair it with risk coverage, escape rate and flaky rate — and be ready to explain how the number was computed (it\'s on your CV).',
    },
    {
      id: 'm21-q3', skill: 'metrics', moduleId: 'm21', type: 'mcq', difficulty: 2,
      prompt: 'Which is a DORA metric?',
      options: opts('Number of test cases', 'Change failure rate', 'Bugs per tester', 'Lines of test code'),
      answer: ['b'],
      explanation: 'DORA: deployment frequency, lead time for changes, change failure rate, time to restore.',
    },
    {
      id: 'm21-q4', skill: 'metrics', moduleId: 'm21', type: 'scenario', difficulty: 3,
      prompt: 'Leadership wants to rank testers by bugs found. Your response?',
      options: opts('Agree', 'Explain it rewards splitting and trivial bugs and discourages prevention; propose team-level outcome metrics (escapes, cycle time) instead', 'Refuse to discuss metrics', 'Add story points'),
      answer: ['b'],
      explanation: 'Individual counts create perverse incentives; team outcome metrics drive the right behaviour.',
    },
  ],
  problems: [
    {
      kind: 'js', id: 'js-quality-metrics', title: 'Quality metrics from release data', skill: 'metrics', moduleId: 'm21', difficulty: 2,
      statement: 'Each release is `{ name, preReleaseDefects, prodDefects, deploys, failedDeploys }`. Return per release `{ name, leakage, changeFailureRate }` (both as % rounded to 1 decimal; 0 when the denominator is 0) and an overall `trend`: "improving" if the last release\'s leakage is lower than the first\'s, "worse" if higher, otherwise "flat". Shape: `{ releases, trend }`.',
      examples: [{ input: '[{ name: "R1", preReleaseDefects: 40, prodDefects: 10, deploys: 20, failedDeploys: 2 }]', output: '{ releases: [{ name: "R1", leakage: 20, changeFailureRate: 10 }], trend: "flat" }' }],
      constraints: ['Leakage = prod ÷ (pre + prod)'],
      functionName: 'qualityMetrics',
      starter: 'function qualityMetrics(rs: { name: string; preReleaseDefects: number; prodDefects: number; deploys: number; failedDeploys: number }[]) {\n  return { releases: [], trend: "?" };\n}',
      tests: [
        { args: [[{ name: 'R1', preReleaseDefects: 40, prodDefects: 10, deploys: 20, failedDeploys: 2 }]], expected: { releases: [{ name: 'R1', leakage: 20, changeFailureRate: 10 }], trend: 'flat' } },
        {
          args: [[{ name: 'R1', preReleaseDefects: 30, prodDefects: 10, deploys: 10, failedDeploys: 3 }, { name: 'R2', preReleaseDefects: 45, prodDefects: 5, deploys: 15, failedDeploys: 1 }]],
          expected: { releases: [{ name: 'R1', leakage: 25, changeFailureRate: 30 }, { name: 'R2', leakage: 10, changeFailureRate: 6.7 }], trend: 'improving' },
        },
        { args: [[{ name: 'R0', preReleaseDefects: 0, prodDefects: 0, deploys: 0, failedDeploys: 0 }]], expected: { releases: [{ name: 'R0', leakage: 0, changeFailureRate: 0 }], trend: 'flat' }, hidden: true },
      ],
      hints: ['A small pct(a, b) helper that returns 0 when b is 0 avoids NaN.'],
      solution: {
        code: `function qualityMetrics(rs: { name: string; preReleaseDefects: number; prodDefects: number; deploys: number; failedDeploys: number }[]) {
  const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 1000) / 10);
  const releases = rs.map((r) => ({
    name: r.name,
    leakage: pct(r.prodDefects, r.preReleaseDefects + r.prodDefects),
    changeFailureRate: pct(r.failedDeploys, r.deploys),
  }));
  const first = releases[0]?.leakage ?? 0;
  const last = releases[releases.length - 1]?.leakage ?? 0;
  return { releases, trend: last < first ? 'improving' : last > first ? 'worse' : 'flat' };
}`,
        explanation: 'Leakage (testing effectiveness) next to change failure rate (delivery stability) tells a fuller story than either alone.',
        time: 'O(n)', space: 'O(n)',
      },
      followUps: ['Why might leakage look better simply because fewer customers used a release?'],
    },
  ],
  interviews: [
    {
      id: 'iv-m21-metrics', modes: ['qa-lead', 'full-qa-lead'], skill: 'metrics', level: 'L6', kind: 'technical',
      prompt: 'Which quality metrics would you report to engineering leadership every month, and which would you avoid?',
      rubric: [
        { id: 'leak', point: 'Defect leakage / escape rate with severity', any: ['leakage', 'escape', 'production defect'] },
        { id: 'flaky', point: 'Flaky rate / automation reliability', any: ['flaky'] },
        { id: 'speed', point: 'Feedback/regression time or DORA lead time', any: ['regression time', 'cycle time', 'lead time', 'feedback time', 'duration'] },
        { id: 'dora', point: 'DORA / change failure rate / MTTR', any: ['dora', 'change failure', 'mttr', 'time to restore', 'deployment frequency'] },
        { id: 'avoid', point: 'Names misleading metrics and why', any: ['vanity', 'misleading', 'avoid', 'automation percentage', 'bug count', 'per tester', 'coverage alone'] },
        { id: 'decide', point: 'Ties metrics to decisions/trends', any: ['decision', 'trend', 'action', 'over time'] },
      ],
      structure: 'Principle → 4–5 metrics with why → what you avoid and why → how it\'s presented (trends + actions).',
      modelAnswer: '"Principle: every metric must drive a decision, and speed metrics are paired with quality metrics. Monthly I\'d show escape rate by severity and the root-cause categories of escapes; change failure rate and time to restore from DORA; PR feedback time and regression duration; flaky rate and the size of the quarantine. I avoid automation percentage as a headline, raw bug counts and anything per individual — they\'re easy to game and say little about risk. I present trends over six releases with annotations and one or two actions, for example \'escapes clustered in shift rules → adding contract tests to the roster service\'."',
      followUp: 'Escape rate went down but customer complaints went up. What could be happening?',
      revision: ['m21', 'm20'],
    },
  ],
  flashcards: [
    { id: 'fc-m21-1', skill: 'metrics', moduleId: 'm21', front: 'Defect leakage formula', back: 'Production defects ÷ (pre-release defects + production defects).' },
    { id: 'fc-m21-2', skill: 'metrics', moduleId: 'm21', front: 'DORA four', back: 'Deployment frequency, lead time for changes, change failure rate, time to restore.' },
    { id: 'fc-m21-3', skill: 'metrics', moduleId: 'm21', front: 'Vanity QA metrics', back: 'Automation % alone, raw bug counts, bugs per tester, coverage without assertion quality.' },
  ],
};
