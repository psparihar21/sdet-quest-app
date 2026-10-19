import { opts, type ModuleBundle } from '../bundle';
import { VIDEOS } from '../videos';
import { OUTLINE } from '../outline';

const meta = OUTLINE.find((m) => m.id === 'm22')!;

const DESIGN_RUBRIC = (extra: { id: string; point: string; any: string[] }[]) => [
  { id: 'req', point: 'Clarifies functional and non-functional requirements', any: ['requirement', 'clarify', 'how many', 'scale', 'users', 'assume'] },
  { id: 'arch', point: 'High-level architecture with named components', any: ['component', 'service', 'queue', 'database', 'api', 'architecture'] },
  { id: 'flow', point: 'Walks through the data flow end to end', any: ['flow', 'step', 'then', 'request', 'event'] },
  { id: 'scale', point: 'Scaling approach', any: ['scale', 'horizontal', 'shard', 'parallel', 'partition', 'autoscal'] },
  { id: 'rel', point: 'Reliability: retries, idempotency, failure handling', any: ['retry', 'idempoten', 'failure', 'timeout', 'reliab', 'dead letter'] },
  { id: 'obs', point: 'Observability', any: ['metric', 'log', 'trace', 'dashboard', 'alert', 'observab'] },
  { id: 'sec', point: 'Security / access', any: ['security', 'auth', 'secret', 'permission', 'access'] },
  { id: 'trade', point: 'Explicit trade-offs', any: ['trade off', 'tradeoff', 'instead', 'alternative', 'versus', 'cost'] },
  ...extra,
];

export const m22: ModuleBundle = {
  module: {
    ...meta,
    lessons: [
      {
        id: 'm22-l1',
        title: 'A repeatable structure for SDET design rounds',
        minutes: 30,
        sections: [
          {
            kind: 'learn',
            title: 'The 10-step answer',
            body: `Design rounds reward **structure and trade-offs** more than a perfect diagram. Use the same skeleton every time (~40 minutes):

1. **Requirements** — functional ("run 5,000 UI tests per PR") and non-functional (time budget, cost, reliability, multi-team). Ask; don't assume silently.
2. **Assumptions & numbers** — tests/day, average duration, peak concurrency, retention. Back-of-envelope math: 5,000 tests × 30 s = 41.7 h serial → 15-min target needs ~170 parallel slots.
3. **High-level architecture** — 5–8 boxes, named.
4. **Components** — responsibilities and key interfaces of each.
5. **Data flow** — walk one request/test run through the system.
6. **Scaling** — what grows, how you scale it (queues, horizontal workers, sharding, caching).
7. **Reliability** — retries, idempotency, timeouts, failure isolation, what happens when a worker dies.
8. **Observability** — metrics, logs, traces, dashboards, alerts — for the platform *and* the tests.
9. **Security** — secrets, access, multi-tenancy, data retention, PII.
10. **Trade-offs & evolution** — what you'd do differently at 10× scale, build vs buy (cloud grids, BrowserStack).

**Common SDET design prompts:** automation framework, test execution platform, distributed test runner, reporting system, test data platform, flaky-test detection, parallel execution system, CI/CD testing architecture, API automation framework, UI automation platform.`,
          },
          { kind: 'video', title: 'Watch: a step-by-step design interview guide', video: VIDEOS.systemDesign },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m22-q1', 'm22-q2'] },
        ],
      },
      {
        id: 'm22-l2',
        title: 'Worked design: a distributed test execution platform',
        minutes: 35,
        sections: [
          {
            kind: 'learn',
            title: 'From 4 hours to 15 minutes',
            body: `**Requirements:** run any team's Playwright/Selenium suites on demand and on PRs; 15-minute feedback for 5,000 tests; fair sharing across 6 teams; results, traces and flaky analytics; cost-aware.

**Architecture**
~~~text
CI / CLI ──► API Gateway ──► Scheduler ──► Job queue (per-team priority)
                                │                 │
                                ▼                 ▼
                         Results service ◄── Worker pool (K8s pods, autoscaled)
                         (Postgres + object       │ each pod: runner + browsers
                          storage for traces)     ▼
                                │            App under test (ephemeral env)
                                ▼
                     Dashboard · flaky detector · notifications
~~~

**Data flow:** CI submits a run (commit, suite, tags) → the scheduler splits it into **shards** using historical durations (bin packing, longest first) → shards go to the queue → autoscaled workers pull shards, run them, stream results and upload artefacts → the results service aggregates, marks flaky candidates (same commit, mixed outcomes), and reports back to the PR.

**Scaling:** stateless workers scale on queue depth (KEDA/HPA); per-team quotas prevent one team starving others; duration-aware sharding prevents a slow straggler shard.

**Reliability:** shards are idempotent units — if a pod dies, the lease expires and the shard is re-queued; at-most-one automatic retry per test, recorded as flaky; timeouts per test and per shard; infrastructure failures are classified separately from test failures.

**Observability:** queue wait time, shard duration P95, worker utilisation, cost per run, flaky rate per suite, top failing tests; alerts on queue backlog.

**Security:** per-team secrets injected at runtime, short-lived credentials, isolated namespaces, artefact retention limits (traces can contain PII).

**Trade-offs:** build vs buy (Playwright sharding on CI runners is enough until it isn't; vendor grids trade cost for less ops); duration-based sharding needs history (fallback: file count); retries improve signal-to-noise but hide flakiness unless reported.`,
          },
          { kind: 'visual', title: 'Shards and workers', vizId: 'sharded-runner', caption: 'The execution half of the platform.' },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m22-q3', 'm22-q4', 'm22-q5'] },
          { kind: 'practice', title: 'Duration-aware sharding', problemId: 'js-shard-tests' },
          { kind: 'interview', title: 'Design round: test execution platform', interviewId: 'iv-m22-runner' },
          { kind: 'interview', title: 'Design round: flaky-test detection system', interviewId: 'iv-m22-flaky' },
          { kind: 'interview', title: 'Design round: test data platform', interviewId: 'iv-m22-data' },
        ],
      },
    ],
  },
  questions: [
    {
      id: 'm22-q1', skill: 'systemDesign', moduleId: 'm22', type: 'mcq', difficulty: 2,
      prompt: 'What should you do first in a design round?',
      options: opts('Draw the database schema', 'Clarify requirements and constraints, and state assumptions with rough numbers', 'Name the cloud provider', 'Write code'),
      answer: ['b'],
      explanation: 'Designs are judged against requirements; numbers drive scaling decisions.',
    },
    {
      id: 'm22-q2', skill: 'systemDesign', moduleId: 'm22', type: 'mcq', difficulty: 2,
      prompt: '3,000 tests averaging 20 s must finish in 10 minutes. Roughly how many parallel slots?',
      options: opts('10', '50', '100', '1,000'),
      answer: ['c'],
      explanation: '3,000 × 20 s = 60,000 s ÷ 600 s ≈ 100 slots, plus headroom for uneven shards and startup.',
    },
    {
      id: 'm22-q3', skill: 'systemDesign', moduleId: 'm22', type: 'mcq', difficulty: 3,
      prompt: 'Why shard by historical duration rather than by file count?',
      options: opts('It\'s simpler', 'Balanced shard durations avoid one slow straggler shard dominating total time', 'Files can\'t be counted', 'It reduces flakiness'),
      answer: ['b'],
      explanation: 'Total time = slowest shard. Duration-aware bin packing equalises shards.',
    },
    {
      id: 'm22-q4', skill: 'systemDesign', moduleId: 'm22', type: 'mcq', difficulty: 3,
      prompt: 'A worker pod dies mid-shard. What design makes recovery safe?',
      options: opts('Restart the whole run', 'Shards are idempotent leased units; an expired lease re-queues the shard', 'Ignore the shard', 'Mark all tests failed'),
      answer: ['b'],
      explanation: 'Leases + idempotent work units are the standard pattern for distributed job processing.',
    },
    {
      id: 'm22-q5', skill: 'systemDesign', moduleId: 'm22', type: 'multi', difficulty: 2,
      prompt: 'Useful platform metrics for a test execution system:',
      options: opts('Queue wait time', 'Shard duration P95', 'Cost per run', 'Flaky rate per suite', 'Number of lines in the scheduler'),
      answer: ['a', 'b', 'c', 'd'],
      explanation: 'They show user experience (wait, duration), efficiency (cost) and signal quality (flakiness).',
    },
  ],
  problems: [
    {
      kind: 'js', id: 'js-shard-tests', title: 'Duration-aware sharding', skill: 'systemDesign', moduleId: 'm22', difficulty: 3,
      statement: 'Assign tests to `k` shards to minimise the longest shard using the greedy **longest-processing-time** rule: sort tests by duration descending (ties: by name ascending), then put each test on the shard with the smallest current total (ties: lowest shard index). Return `{ shards: string[][], makespan }` where shards keep assignment order and makespan is the largest shard total.',
      examples: [{ input: 'shard([{name:"a",ms:5},{name:"b",ms:4},{name:"c",ms:3},{name:"d",ms:3}], 2)', output: '{ shards: [["a","d"],["b","c"]], makespan: 8 }' }],
      constraints: ['k ≥ 1'],
      functionName: 'shard',
      starter: 'function shard(tests: { name: string; ms: number }[], k: number) {\n  return { shards: [] as string[][], makespan: 0 };\n}',
      tests: [
        { args: [[{ name: 'a', ms: 5 }, { name: 'b', ms: 4 }, { name: 'c', ms: 3 }, { name: 'd', ms: 3 }], 2], expected: { shards: [['a', 'd'], ['b', 'c']], makespan: 8 } },
        { args: [[{ name: 'x', ms: 10 }], 3], expected: { shards: [['x'], [], []], makespan: 10 } },
        { args: [[], 2], expected: { shards: [[], []], makespan: 0 } },
        { args: [[{ name: 'p', ms: 7 }, { name: 'q', ms: 7 }, { name: 'r', ms: 2 }, { name: 's', ms: 2 }, { name: 't', ms: 2 }], 2], expected: { shards: [['p', 'r', 't'], ['q', 's']], makespan: 11 }, hidden: true },
      ],
      hints: ['Keep a totals array of length k.', 'For each test, find the index of the minimum total (first one on ties).'],
      solution: {
        code: `function shard(tests: { name: string; ms: number }[], k: number) {
  const sorted = [...tests].sort((a, b) => b.ms - a.ms || a.name.localeCompare(b.name));
  const shards: string[][] = Array.from({ length: k }, () => []);
  const totals = new Array(k).fill(0);
  for (const t of sorted) {
    let best = 0;
    for (let i = 1; i < k; i++) if (totals[i] < totals[best]) best = i;
    shards[best].push(t.name);
    totals[best] += t.ms;
  }
  return { shards, makespan: Math.max(0, ...totals) };
}`,
        explanation: 'LPT is a classic heuristic for minimising makespan — the same idea behind duration-based test splitting in CI tools.',
        time: 'O(n log n + n·k) (O(n log k) with a heap)', space: 'O(n + k)',
      },
      followUps: ['Where does the duration history come from, and what do you do for new tests?'],
    },
  ],
  interviews: [
    {
      id: 'iv-m22-runner', modes: ['system-design', 'full-sdet3', 'full-qa-lead'], skill: 'systemDesign', level: 'L5', kind: 'design',
      prompt: 'Design a test execution platform that runs 5,000 UI tests for six teams with 15-minute feedback on every PR.',
      rubric: DESIGN_RUBRIC([
        { id: 'shard', point: 'Sharding strategy (duration-aware) and worker pool', any: ['shard', 'worker', 'duration', 'bin pack'] },
        { id: 'fair', point: 'Fairness/quotas across teams and cost control', any: ['quota', 'fair', 'priority', 'cost'] },
      ]),
      structure: 'Requirements → numbers → architecture → data flow → scaling → reliability → observability → security → trade-offs.',
      modelAnswer: '"Requirements: on-demand and PR runs, 15-minute feedback for 5,000 tests, six teams, artefacts and flaky analytics. Numbers: 5,000 × 30 s ≈ 42 h serial, so ~170–200 slots at peak. Architecture: an API that accepts runs, a scheduler that shards by historical duration, a per-team priority queue, autoscaled Kubernetes worker pods running Playwright, a results service with Postgres plus object storage for traces, and a dashboard with flaky detection and PR notifications. Flow: CI submits commit and suite → shards → workers lease shards, run, stream results → aggregation → PR status. Scaling on queue depth with team quotas. Reliability: leased idempotent shards re-queue when a pod dies, one recorded retry per test, infra failures classified separately. Observability: queue wait, shard P95, utilisation, cost per run, flaky rate. Security: per-team secrets at runtime, namespace isolation, trace retention limits. Trade-off: building this vs CI-native sharding or a vendor grid — I\'d start with CI sharding and only build the platform when queueing and cost justify it."',
      followUp: 'Feedback is 15 minutes on average but 40 minutes at 10 am. What do you change?',
      revision: ['m22', 'm11'],
    },
    {
      id: 'iv-m22-flaky', modes: ['system-design', 'full-sdet3'], skill: 'systemDesign', level: 'L5', kind: 'design',
      prompt: 'Design a flaky-test detection and management system for a company running 50,000 test executions a day.',
      rubric: DESIGN_RUBRIC([
        { id: 'detect', point: 'Detection logic: mixed outcomes per commit, retries, history window', any: ['same commit', 'mixed', 'history', 'window', 'pass and fail'] },
        { id: 'workflow', point: 'Quarantine workflow with owners and SLAs', any: ['quarantine', 'owner', 'sla', 'ticket'] },
      ]),
      structure: 'Requirements → ingestion → detection → workflow (quarantine/owners) → reporting → scale → trade-offs.',
      modelAnswer: '"Ingest JUnit/Playwright results from every CI run into an events stream, store per execution (test id, commit, env, status, duration, retry, error signature). Detection: a test is flaky if it has mixed outcomes on the same commit, or passed-on-retry, within a rolling window; compute flaky rate and a confidence score; separate infra failures by error signature. Workflow: above a threshold the system opens a ticket for the owning team (from CODEOWNERS/tags), moves the test to a non-blocking quarantine lane, and sets an SLA; fixed tests return after N clean runs. Reporting: flaky rate per suite and team, top offenders, trend. Scale: 50k events/day is modest — a queue plus Postgres partitioned by date is plenty. Trade-off: aggressive auto-quarantine keeps CI green but risks hiding real races, so product-area owners must review."',
      followUp: 'How do you distinguish a flaky test from a real intermittent product bug?',
      revision: ['m22', 'm10'],
    },
    {
      id: 'iv-m22-data', modes: ['system-design', 'full-qa-lead'], skill: 'systemDesign', level: 'L5', kind: 'design',
      prompt: 'Design a test data platform so 300 parallel tests across 6 teams can get valid HRMS data (employees, policies, balances) on demand.',
      rubric: DESIGN_RUBRIC([
        { id: 'api', point: 'Self-service API / factories / templates', any: ['api', 'factory', 'template', 'self service', 'builder'] },
        { id: 'iso', point: 'Isolation (unique tenants/ids), cleanup and TTL', any: ['isolat', 'tenant', 'unique', 'cleanup', 'ttl', 'expire'] },
        { id: 'pii', point: 'Synthetic data / no production PII', any: ['synthetic', 'pii', 'anonymi', 'mask'] },
      ]),
      structure: 'Requirements → data model/templates → provisioning API → isolation & cleanup → performance (pools) → privacy → trade-offs.',
      modelAnswer: '"Requirements: on-demand valid data for many entity types, parallel-safe, fast (< 2 s), no production PII. Design: a data service exposing templates like \'employee with 12 casual leaves under policy X\' via an API and client libraries for Java and TypeScript. It creates data through the product\'s own APIs (so it stays valid as the schema evolves) inside a per-run tenant or with unique prefixes, tags everything with run id and TTL, and a janitor job deletes expired data. For speed, a pool of pre-created common entities is leased exclusively to one test at a time. All data is synthetic — Faker plus domain rules — and the platform refuses production connections. Observability: provisioning latency, pool exhaustion, cleanup failures. Trade-off: API-based creation is slower than DB inserts but never produces impossible states."',
      followUp: 'A test needs an employee with 3 years of attendance history. How does your platform handle that?',
      revision: ['m22', 'm04'],
    },
  ],
  flashcards: [
    { id: 'fc-m22-1', skill: 'systemDesign', moduleId: 'm22', front: '10-step design skeleton', back: 'Requirements, assumptions/numbers, architecture, components, data flow, scaling, reliability, observability, security, trade-offs.' },
    { id: 'fc-m22-2', skill: 'systemDesign', moduleId: 'm22', front: 'Recovering from a dead worker', back: 'Leased, idempotent work units; expired lease → re-queue.' },
  ],
};
