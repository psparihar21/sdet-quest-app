import { opts, type ModuleBundle } from '../bundle';
import { VIDEOS } from '../videos';
import { OUTLINE } from '../outline';

const meta = OUTLINE.find((m) => m.id === 'm12')!;

export const m12: ModuleBundle = {
  module: {
    ...meta,
    lessons: [
      {
        id: 'm12-l1',
        title: 'Test types, metrics and percentiles',
        minutes: 30,
        sections: [
          {
            kind: 'learn',
            title: 'Speak performance fluently',
            body: `| Test | Question | Shape |
|---|---|---|
| **Load** | Does it meet targets at expected peak? | Ramp to expected load, hold |
| **Stress** | Where and how does it break? | Increase until failure; check recovery |
| **Spike** | Can it absorb sudden bursts? (payroll day, 9:30 AM swipe-in) | Jump from low to very high instantly |
| **Endurance / soak** | Does it degrade over hours? (memory leaks, connection exhaustion) | Moderate load for 4–24 h |
| **Capacity** | How many users/requests can we support within SLOs? | Step up, find the knee |

**Metrics:**
- **Latency / response time** — time for one request (client-measured includes network).
- **Throughput** — requests (or transactions) per second.
- **Error rate** — % failed.
- **Concurrency** — simultaneous users/requests. Little's law: concurrency ≈ throughput × latency.
- **Resource utilisation** — CPU, memory, DB connections, GC pauses, queue lag.

**Why percentiles, not averages:** averages hide the slow tail. P95 = 95% of requests were this fast or faster; P99 = the experience of your unluckiest 1-in-100 — which at scale is thousands of users. Report P50/P95/P99 + error rate + throughput together.

**Nearest-rank P95:** sort the samples; take the value at position ceil(0.95 × n) (1-based).`,
          },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m12-q1', 'm12-q2', 'm12-q3'] },
          { kind: 'practice', title: 'Compute P95 and P99', problemId: 'js-percentile' },
        ],
      },
      {
        id: 'm12-l2',
        title: 'JMeter basics, bottlenecks and strategy',
        minutes: 25,
        sections: [
          {
            kind: 'learn',
            title: 'From script to decision',
            body: `**JMeter vocabulary:** Test Plan → **Thread Group** (users, ramp-up, loop/duration) → **Samplers** (HTTP requests) → **Config elements** (CSV Data Set for test data, HTTP defaults, cookie/header managers) → **Extractors** (JSON extractor for tokens/ids) → **Assertions** (response code, duration) → **Timers** (think time) → **Listeners** (use them only in debug; run headless: \`jmeter -n -t plan.jmx -l results.jtl -e -o report/\`). Modern alternatives: k6 (JS), Gatling (Scala/Java), Locust (Python).

**Realistic workload model:** mix of transactions from production analytics (e.g. 70% view balance, 20% apply, 10% approve), think times, realistic data volumes, a production-like environment, and an agreed **SLO** (e.g. apply-leave P95 < 800 ms at 300 req/s, errors < 0.5%).

**Finding bottlenecks:** correlate the latency curve with server metrics. Throughput flattening while latency climbs = saturation. Usual suspects: DB queries without indexes, connection-pool exhaustion, N+1 queries, synchronous calls to slow dependencies, GC pauses, lock contention, missing caching, too few pods.

**Strategy for a lead:** performance acceptance criteria in stories; a short perf smoke in CI on key APIs (thresholds fail the build); full load/soak before big releases and peak events; production monitoring of the same SLOs.`,
          },
          { kind: 'video', title: 'Watch: JMeter load testing basics', video: VIDEOS.jmeter },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m12-q4', 'm12-q5'] },
          { kind: 'interview', title: 'Interview drill', interviewId: 'iv-m12-strategy' },
        ],
      },
    ],
  },
  questions: [
    {
      id: 'm12-q1', skill: 'performance', moduleId: 'm12', type: 'mcq', difficulty: 2,
      prompt: 'Thousands of employees swipe in between 9:25 and 9:35 AM. Which test models this?',
      options: opts('Endurance', 'Spike', 'Unit', 'Smoke'),
      answer: ['b'],
      explanation: 'A sudden burst from low to very high load is a spike.',
    },
    {
      id: 'm12-q2', skill: 'performance', moduleId: 'm12', type: 'mcq', difficulty: 2,
      prompt: 'Average response time is 300 ms but users complain about slowness. What should you check?',
      options: opts('Nothing, 300 ms is fine', 'P95/P99 latency — the tail may be several seconds', 'Throughput only', 'The CSS bundle size'),
      answer: ['b'],
      explanation: 'Averages hide slow outliers that many real users experience.',
    },
    {
      id: 'm12-q3', skill: 'performance', moduleId: 'm12', type: 'mcq', difficulty: 3,
      prompt: 'As load increases, throughput stays flat at 400 req/s while latency rises steeply. This indicates…',
      options: opts('The test is wrong', 'A saturated resource — a bottleneck has been reached', 'Good scalability', 'A network outage'),
      answer: ['b'],
      explanation: 'The system cannot do more work, so extra requests just queue. Find the saturated resource.',
    },
    {
      id: 'm12-q4', skill: 'performance', moduleId: 'm12', type: 'mcq', difficulty: 2,
      prompt: 'A 12-hour soak test shows memory rising steadily until the service restarts. Most likely?',
      options: opts('Spike problem', 'A memory leak (e.g. an unbounded cache or unclosed resources)', 'DNS issue', 'Too many assertions'),
      answer: ['b'],
      explanation: 'Endurance tests exist to find slow resource leaks.',
    },
    {
      id: 'm12-q5', skill: 'performance', moduleId: 'm12', type: 'multi', difficulty: 2,
      prompt: 'Elements of a realistic load model:',
      options: opts('Transaction mix from production analytics', 'Think time between steps', 'All users hitting one endpoint with the same record', 'Production-like data volume', 'Agreed SLOs as pass/fail criteria'),
      answer: ['a', 'b', 'd', 'e'],
      explanation: 'Identical requests on identical data hit caches and give falsely good numbers.',
    },
  ],
  problems: [
    {
      kind: 'js', id: 'js-percentile', title: 'Latency percentiles', skill: 'performance', moduleId: 'm12', difficulty: 2,
      statement: 'Write `summarize(latencies)` returning `{ p50, p95, p99, max }` using the **nearest-rank** method: sort ascending; the p-th percentile is the value at 1-based position `ceil(p/100 × n)`. Return all zeros for an empty list. Don\'t mutate the input.',
      examples: [{ input: 'summarize([100, 200, ..., 2000])  // 20 values', output: '{ p50: 1000, p95: 1900, p99: 2000, max: 2000 }' }],
      constraints: ['n up to 10⁶', 'O(n log n)'],
      functionName: 'summarize',
      starter: 'function summarize(latencies: number[]) {\n  return { p50: -1, p95: -1, p99: -1, max: -1 };\n}',
      tests: [
        { args: [Array.from({ length: 20 }, (_, i) => (i + 1) * 100)], expected: { p50: 1000, p95: 1900, p99: 2000, max: 2000 } },
        { args: [[]], expected: { p50: 0, p95: 0, p99: 0, max: 0 } },
        { args: [[5]], expected: { p50: 5, p95: 5, p99: 5, max: 5 } },
        { args: [[300, 100, 200]], expected: { p50: 200, p95: 300, p99: 300, max: 300 }, hidden: true },
      ],
      hints: ['Copy before sorting: [...latencies].sort((a, b) => a - b).', 'Index = Math.ceil(p / 100 * n) - 1.'],
      solution: {
        code: `function summarize(latencies: number[]) {
  if (latencies.length === 0) return { p50: 0, p95: 0, p99: 0, max: 0 };
  const s = [...latencies].sort((a, b) => a - b);
  const at = (p: number) => s[Math.max(0, Math.ceil((p / 100) * s.length) - 1)];
  return { p50: at(50), p95: at(95), p99: at(99), max: s[s.length - 1] };
}`,
        explanation: 'Nearest-rank is simple and what many tools report. Note how P99 equals the max for small samples — you need enough requests for tail percentiles to mean anything.',
        time: 'O(n log n)', space: 'O(n)',
      },
      followUps: ['How do tools compute percentiles over millions of samples without storing them all? (histograms / HDR)'],
    },
  ],
  interviews: [
    {
      id: 'iv-m12-strategy', modes: ['qa-lead', 'full-qa-lead', 'system-design'], skill: 'performance', level: 'L5', kind: 'scenario',
      prompt: 'Payroll processing for 50,000 employees must finish within 2 hours on the last day of the month. How would you plan performance testing for it?',
      rubric: [
        { id: 'slo', point: 'Defines measurable targets/SLOs', any: ['slo', 'target', 'within 2 hours', 'acceptance criteria', 'throughput'] },
        { id: 'types', point: 'Chooses test types (load, stress, soak, spike)', any: ['load', 'stress', 'soak', 'endurance', 'spike', 'capacity'] },
        { id: 'model', point: 'Realistic data/workload and environment', any: ['production like', 'realistic', 'data volume', 'environment', 'workload'] },
        { id: 'metrics', point: 'Monitors percentiles and resources', any: ['p95', 'p99', 'percentile', 'cpu', 'memory', 'database', 'monitor'] },
        { id: 'bottleneck', point: 'Plans for bottleneck analysis and re-test', any: ['bottleneck', 'profile', 'tune', 're test', 'retest', 'index'] },
        { id: 'risk', point: 'Business risk, rollback/contingency', any: ['risk', 'contingency', 'rollback', 'fallback', 'stakeholder'] },
      ],
      structure: 'Goal → workload model → environment & data → test types → metrics → analysis → reporting & go/no-go.',
      modelAnswer: '"First the target: 50,000 payslips in under 2 hours means at least ~7 per second sustained, with headroom — say 2× for growth. I\'d build a production-sized anonymised dataset with realistic variation (bonuses, arrears, tax regimes) in a production-like environment. Tests: a load test at expected volume, a stress test to find the break point, and a soak test for a full run to catch leaks and connection exhaustion. I\'d watch batch throughput, per-step P95, DB CPU and slow queries, queue lag and GC. Bottlenecks get profiled and fixed, then re-tested. I\'d report a go/no-go with margin, plus a contingency — e.g. the ability to resume a failed batch without double-paying anyone."',
      followUp: 'The run passes in test but takes 3 hours in production. What do you check first?',
      revision: ['m12'],
    },
  ],
  flashcards: [
    { id: 'fc-m12-1', skill: 'performance', moduleId: 'm12', front: 'Load vs stress vs soak vs spike', back: 'Expected peak / beyond limits / long duration / sudden burst.' },
    { id: 'fc-m12-2', skill: 'performance', moduleId: 'm12', front: 'Why P95/P99?', back: 'Averages hide the slow tail that real users feel.' },
    { id: 'fc-m12-3', skill: 'performance', moduleId: 'm12', front: "Little's law", back: 'Concurrency ≈ throughput × latency.' },
  ],
};
