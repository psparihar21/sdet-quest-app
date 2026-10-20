import { opts, type ModuleBundle } from '../bundle';
import { VIDEOS } from '../videos';
import { OUTLINE } from '../outline';

const meta = OUTLINE.find((m) => m.id === 'm15')!;

export const m15: ModuleBundle = {
  module: {
    ...meta,
    lessons: [
      {
        id: 'm15-l1',
        title: 'How QA changes with microservices and events',
        minutes: 35,
        sections: [
          {
            kind: 'learn',
            title: 'From one app to many services',
            body: `In a monolith, one deploy changes everything at once and one E2E suite can cover it. With microservices, **each service deploys independently**, so the main risks move to the **seams**: contracts, events, timeouts, retries and data consistency.

**Distributed systems in one paragraph:** many processes communicating over an unreliable network. Requests can be slow, lost, duplicated or reordered; parts fail independently; there is no single clock or single database. Every test strategy here is about those facts.

**Mocking vs stubbing vs virtualisation:** a stub returns canned responses; a mock also verifies it was called as expected; service virtualisation is a stub of a whole dependency at the network level (WireMock, Mountebank, Hoverfly) so the service under test runs unchanged.

**Testing strategy per service:**
- Unit + component tests inside the service (dependencies stubbed).
- **Contract tests** (consumer-driven) for every HTTP and event interface — the main defence against breaking changes.
- **Service-level API tests** with dependencies virtualised (WireMock, Mountebank, Testcontainers for real DB/Kafka).
- A **small** set of cross-service E2E journeys in a shared environment.
- Production: health checks, synthetic monitoring, tracing.

**Asynchronous/event-driven flows (Kafka, queues):** producers publish events to **topics** split into **partitions**; consumer groups read them; ordering is only per partition (key by employeeId); delivery is usually **at-least-once**, so consumers must be **idempotent**.

**Testing async behaviour:**
- Never sleep; **poll with a timeout** ("eventually") on the observable outcome (DB row, API state, consumed message).
- Test duplicates (same event twice → one payroll adjustment), out-of-order events, poison messages → dead-letter queue, consumer restarts (offsets), schema evolution.
- Use correlation IDs to follow one request across services in logs/traces.

**Eventual consistency:** after "leave approved", payroll may update seconds later. Tests and UIs must tolerate the window; your test asserts the final state within an agreed time.

**Dependency failures:** test timeouts, retries with backoff, circuit breakers and fallbacks by making stubs slow or failing (fault injection, chaos experiments in non-prod).

**Test environments:** shared staging is a bottleneck and a flake source. Prefer ephemeral per-PR environments or service-level tests with containers; keep shared environments for a few E2E journeys.`,
          },
          { kind: 'visual', title: 'An event flow', vizId: 'kafka-flow', caption: 'Publish, fan out, eventual consistency and dead letters.' },
          { kind: 'video', title: 'Watch: Kafka in 100 seconds', video: VIDEOS.kafka },
          {
            kind: 'learn',
            title: 'Event-driven architecture and how to test it',
            body: `In an **event-driven architecture**, services don't call each other directly: a **producer** publishes an event (\`LeaveApproved\`) to a **broker** (Kafka, RabbitMQ, SNS/SQS) and any number of **consumers** react (payroll, notifications, calendar). This decouples teams but moves bugs into the gaps.

~~~text
Leave service ──LeaveApproved{id, employeeId, days, version}──▶ Kafka topic: leave-events
                                                               ├─▶ Payroll consumer (deduct balance)
                                                               ├─▶ Notification consumer (email)
                                                               └─▶ Calendar consumer
~~~

**What to test, layer by layer:**
- **Producer:** the right event is published with the right schema after the transaction commits (outbox pattern) — and not published if it rolls back.
- **Contract/schema:** event schemas in a registry (Avro/JSON Schema) with compatibility rules; consumer-driven contracts for messages (Pact supports message pacts).
- **Consumer:** **idempotency** (the same event delivered twice must not deduct twice), **ordering** (an "approved" arriving before "created"), unknown fields tolerated, poison messages go to a **dead-letter queue** instead of blocking the partition.
- **End-to-end:** publish or trigger, then **poll** for the eventual outcome with a timeout — never sleep. Use correlation ids to trace one flow through all services.
- **Failure modes:** broker down, consumer lag, retries with backoff, replaying a topic after a bug fix.

Tools: Testcontainers for a real Kafka in integration tests, embedded brokers for fast tests, and observability (consumer lag, DLQ size) as production checks.`,
          },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m15-q1', 'm15-q2', 'm15-q3', 'm15-q4', 'm15-q5', 'm15-q6'] },
          { kind: 'practice', title: 'Idempotent event consumer', problemId: 'js-idempotent-consumer' },
          { kind: 'interview', title: 'Interview drill', interviewId: 'iv-m15-async' },
        ],
      },
    ],
  },
  questions: [
    {
      id: 'm15-q6', skill: 'distributed', moduleId: 'm15', type: 'scenario', difficulty: 3,
      prompt: 'The leave service commits the approval to its database, then publishes LeaveApproved to Kafka. If it crashes between the two steps, payroll never hears about the approval. Which pattern fixes this, and how would you test it?',
      options: opts('Publish the event first, then commit', 'Transactional outbox: write the event to an outbox table in the same DB transaction and relay it to Kafka; test by killing the service between commit and publish and asserting the event still arrives exactly once downstream', 'Add a retry loop around the Kafka publish', 'Have payroll poll the leave database every minute'),
      answer: ['b'],
      explanation: 'The outbox makes "state change + event" atomic. Publishing first can announce approvals that later roll back; retries don\'t help if the process dies; direct DB polling couples services. A fault-injection test proves it.',
    },
    {
      id: 'm15-q1', skill: 'distributed', moduleId: 'm15', type: 'mcq', difficulty: 2,
      prompt: 'After approving leave via API, the payroll service updates asynchronously. How should the test verify payroll?',
      options: opts('Thread.sleep(10000) then check', 'Poll the payroll API/DB until the expected state appears or a timeout expires', 'Check immediately', 'Skip verification'),
      answer: ['b'],
      explanation: 'Polling with a timeout is fast when the system is fast and fails clearly when it isn\'t.',
    },
    {
      id: 'm15-q2', skill: 'distributed', moduleId: 'm15', type: 'mcq', difficulty: 2,
      prompt: 'Kafka consumers usually get at-least-once delivery. What must the consumer be?',
      options: opts('Stateless', 'Idempotent — processing the same event twice has the same effect as once', 'Single-threaded', 'Written in Java'),
      answer: ['b'],
      explanation: 'Retries and rebalances can redeliver events. Test it by publishing duplicates.',
    },
    {
      id: 'm15-q3', skill: 'distributed', moduleId: 'm15', type: 'mcq', difficulty: 3,
      prompt: 'Events for one employee must be processed in order. What guarantees that in Kafka?',
      options: opts('Nothing can', 'Using the employee id as the message key so all their events go to the same partition', 'Using more partitions', 'Using a bigger consumer group'),
      answer: ['b'],
      explanation: 'Ordering is per partition; the key decides the partition.',
    },
    {
      id: 'm15-q4', skill: 'distributed', moduleId: 'm15', type: 'mcq', difficulty: 2,
      prompt: 'What is service virtualisation for?',
      options: opts('Running services in VMs', 'Simulating dependencies (slow, failing, unavailable or costly third parties) so a service can be tested in isolation', 'Load balancing', 'Database replication'),
      answer: ['b'],
      explanation: 'Stubs like WireMock let you test timeouts, errors and edge responses deterministically.',
    },
    {
      id: 'm15-q5', skill: 'distributed', moduleId: 'm15', type: 'multi', difficulty: 3,
      prompt: 'Cases worth testing for an event consumer:',
      options: opts('Duplicate events', 'Out-of-order events', 'Malformed event → dead-letter queue', 'Consumer restart resumes from the right offset', 'Changing the CSS of the UI'),
      answer: ['a', 'b', 'c', 'd'],
      explanation: 'These are the failure modes of at-least-once, partitioned messaging.',
    },
  ],
  problems: [
    {
      kind: 'js', id: 'js-idempotent-consumer', title: 'Idempotent leave-approved consumer', skill: 'distributed', moduleId: 'm15', difficulty: 3,
      statement: 'Events are `{ eventId, employeeId, days }` (days deducted from balance) and may be **redelivered**. Write `applyEvents(balances, events)` that returns a new balances object after processing events in order, **ignoring any eventId already processed**, and **skipping** (not applying) events that would make a balance negative. Also return the list of skipped eventIds. Shape: `{ balances, skipped }`. Don\'t mutate the input.',
      examples: [{ input: 'applyEvents({ e1: 5 }, [{eventId:"a",employeeId:"e1",days:2},{eventId:"a",employeeId:"e1",days:2}])', output: '{ balances: { e1: 3 }, skipped: [] }' }],
      constraints: ['Unknown employees start at 0'],
      functionName: 'applyEvents',
      starter: `type Ev = { eventId: string; employeeId: string; days: number };
function applyEvents(balances: Record<string, number>, events: Ev[]) {
  return { balances, skipped: [] as string[] };
}`,
      tests: [
        { args: [{ e1: 5 }, [{ eventId: 'a', employeeId: 'e1', days: 2 }, { eventId: 'a', employeeId: 'e1', days: 2 }]], expected: { balances: { e1: 3 }, skipped: [] } },
        { args: [{ e1: 1 }, [{ eventId: 'x', employeeId: 'e1', days: 2 }]], expected: { balances: { e1: 1 }, skipped: ['x'] } },
        { args: [{}, [{ eventId: 'z', employeeId: 'e9', days: 0 }]], expected: { balances: { e9: 0 }, skipped: [] } },
        { args: [{ e1: 4, e2: 1 }, [{ eventId: '1', employeeId: 'e1', days: 3 }, { eventId: '2', employeeId: 'e2', days: 2 }, { eventId: '1', employeeId: 'e1', days: 3 }, { eventId: '3', employeeId: 'e1', days: 1 }]], expected: { balances: { e1: 0, e2: 1 }, skipped: ['2'] }, hidden: true },
      ],
      hints: ['Keep a Set of processed eventIds (in production: a processed-events table).', 'Copy balances with { ...balances } first.', 'Should a skipped event be marked processed? (Yes — or a redelivery would be re-evaluated.)'],
      solution: {
        code: `type Ev = { eventId: string; employeeId: string; days: number };
function applyEvents(balances: Record<string, number>, events: Ev[]) {
  const out = { ...balances };
  const processed = new Set<string>();
  const skipped: string[] = [];
  for (const e of events) {
    if (processed.has(e.eventId)) continue;
    processed.add(e.eventId);
    const current = out[e.employeeId] ?? 0;
    if (current - e.days < 0) { skipped.push(e.eventId); continue; }
    out[e.employeeId] = current - e.days;
  }
  return { balances: out, skipped };
}`,
        explanation: 'Deduplicating by event id makes processing idempotent; an invariant check (never negative) protects data when events are wrong. Real consumers store processed ids transactionally with the balance update.',
        time: 'O(n)', space: 'O(n)',
      },
      followUps: ['Where should skipped events go in a real system?', 'How would you write an integration test for this with Testcontainers Kafka?'],
    },
  ],
  interviews: [
    {
      id: 'iv-m15-async', modes: ['system-design', 'api-sql', 'full-sdet3'], skill: 'distributed', level: 'L4', kind: 'technical',
      prompt: 'How do you test a flow where approving leave publishes a Kafka event that the payroll service consumes?',
      rubric: [
        { id: 'contract', point: 'Event contract/schema testing', any: ['contract', 'schema', 'avro', 'pact', 'event format'] },
        { id: 'poll', point: 'Eventually-consistent verification with polling, no sleeps', any: ['poll', 'eventually', 'timeout', 'awaitility', 'not sleep', 'no sleep'] },
        { id: 'idem', point: 'Duplicate/idempotency tests', any: ['duplicate', 'idempoten', 'twice', 'redeliver'] },
        { id: 'order', point: 'Ordering and partition key', any: ['order', 'partition', 'key'] },
        { id: 'failure', point: 'Failures: poison messages, DLQ, consumer down, retries', any: ['dead letter', 'dlq', 'poison', 'retry', 'consumer down', 'restart'] },
        { id: 'obs', point: 'Correlation IDs / observability', any: ['correlation', 'trace', 'log', 'observability', 'lag'] },
        { id: 'levels', point: 'Right levels: component with Testcontainers vs few E2E', any: ['testcontainers', 'component', 'isolation', 'e2e', 'level'] },
      ],
      structure: 'Levels → contract → happy path with polling → failure modes → observability.',
      modelAnswer: '"I\'d test at three levels. Contract: the LeaveApproved event schema is verified between the leave service and payroll with consumer-driven contracts, so a renamed field fails before deploy. Component: payroll\'s consumer runs against Kafka in Testcontainers — I publish events and assert the DB, including duplicates (one adjustment), out-of-order events, malformed messages going to the DLQ, and a consumer restart resuming from the committed offset. End to end, one journey: approve via API, then poll payroll\'s API with a timeout until the deduction appears — never a fixed sleep. Every request carries a correlation ID so a failure can be traced across both services, and we monitor consumer lag in staging."',
      followUp: 'The E2E check passes locally but times out in CI 10% of the time. What do you look at?',
      revision: ['m15', 'm09'],
    },
  ],
  flashcards: [
    { id: 'fc-m15-1', skill: 'distributed', moduleId: 'm15', front: 'Kafka ordering guarantee', back: 'Only within a partition; use a key (e.g. employeeId).' },
    { id: 'fc-m15-2', skill: 'distributed', moduleId: 'm15', front: 'Testing eventual consistency', back: 'Poll for the final state with a timeout; never fixed sleeps.' },
    { id: 'fc-m15-3', skill: 'distributed', moduleId: 'm15', front: 'At-least-once delivery implies…', back: 'Idempotent consumers; test duplicate events.' },
  ],
};
