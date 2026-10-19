/**
 * Capstone: LeaveFlow, an enterprise HRMS leave & attendance platform.
 * It replaces the original "ShopFlow" e-commerce brief with a domain the learner can discuss
 * from experience; every ShopFlow deliverable maps to a task below.
 */
export interface ProjectTask {
  id: string;
  title: string;
  modules: string[];
  brief: string;
  deliverables: string[];
  acceptance: string[];
  review: string;
}

export interface ProjectPhase {
  id: string;
  title: string;
  goal: string;
  tasks: ProjectTask[];
}

export const PROJECT = {
  name: 'LeaveFlow',
  tagline: 'Enterprise leave & attendance platform: your portfolio test project',
  architecture: `A small set of microservices behind one gateway:
- **Frontend** web app (React SPA): employees apply for leave, managers approve, HR configures policies.
- **API gateway** with JWT authentication and role-based authorization (roles: EMPLOYEE, MANAGER, HR_ADMIN).
- **Leave service** (REST, PostgreSQL): requests, balances, policies.
- **Attendance service** (REST): swipes, regularisation, shift rosters.
- **Payroll connector**: consumes \`leave.approved\` events from **Kafka** to adjust pay.
- **Notification service**: emails/push from events; failures go to a dead-letter topic.
- **Environments**: local (Docker Compose), QA, staging, production.`,
  buildOptions: `You don't need a real LeaveFlow to start. Pick one:
1. **Public practice targets** for UI/API mechanics (e.g. a demo REST API and a demo web shop you are allowed to test) while you design LeaveFlow's strategy on paper.
2. **Build a thin LeaveFlow yourself**: one Node/Express or Spring Boot service + PostgreSQL in Docker Compose, a minimal React page. Small, but real enough to test end to end — and a far better interview story.
3. **Your own product at work** — only with permission, and never commit company code, data or URLs to a public repo.`,
  scoring: [
    ['Test strategy completeness', 20],
    ['Framework architecture', 20],
    ['Risk-based coverage', 15],
    ['CI/CD integration', 15],
    ['Code quality & maintainability', 10],
    ['Modern practices (Playwright, AI, agents)', 10],
    ['Documentation & trade-offs', 10],
  ] as [string, number][],
  phases: [
    {
      id: 'p1',
      title: 'Phase 1 · Strategy and risk',
      goal: 'Decide what matters before writing a single test.',
      tasks: [
        {
          id: 'lf-strategy', title: 'Write the test strategy', modules: ['m01', 'm20'],
          brief: 'Scope, test levels and types, environments, data, tooling, entry/exit criteria, quality gates, roles, reporting.',
          deliverables: ['docs/test-strategy.md (2–4 pages)'],
          acceptance: ['Test pyramid targets with numbers', 'Explicit out-of-scope list', 'Entry/exit criteria and release gates', 'Environment and test-data approach'],
          review: 'Could a new SDET start contributing from this document alone? Would a product manager understand the release gates?',
        },
        {
          id: 'lf-risk', title: 'Risk analysis', modules: ['m01', 'm20'],
          brief: 'Identify business and technical risks: balance calculation, approval routing, payroll sync, time zones, concurrency, permissions, PII.',
          deliverables: ['Risk register with likelihood × impact, owner and mitigating tests'],
          acceptance: ['At least 12 risks, both business and technical', 'Each high risk maps to specific tests or monitors', 'Includes non-functional risks (performance, security, privacy)'],
          review: 'Is test effort clearly proportional to risk?',
        },
        {
          id: 'lf-design', title: 'Functional and non-functional test design', modules: ['m01', 'm12', 'm13'],
          brief: 'Apply EP/BVA, decision tables and state transitions to leave requests; define performance and security checks.',
          deliverables: ['Test design doc with techniques named per feature'],
          acceptance: ['State-transition model for leave status', 'Decision table for approval routing', 'Boundary values for balances and half-days', 'P95 latency targets for key APIs'],
          review: 'Are the techniques chosen for a reason, or just listed?',
        },
      ],
    },
    {
      id: 'p2',
      title: 'Phase 2 · API and data layer',
      goal: 'Most of your confidence should come from fast, stable API tests.',
      tasks: [
        {
          id: 'lf-api-fw', title: 'API automation framework', modules: ['m09', 'm10'],
          brief: 'REST Assured (Java) or Playwright request (TS): config per environment, auth helper, request builders, schema validation, logging, reporting.',
          deliverables: ['api-tests/ module with README', 'Environment config without secrets in the repo'],
          acceptance: ['Auth token handled once per role', 'JSON schema validation on responses', 'No hard-coded URLs or credentials', 'Readable failure output with request/response'],
          review: 'Would adding a new endpoint test take minutes, not hours?',
        },
        {
          id: 'lf-api-suite', title: 'API test suite', modules: ['m09'],
          brief: 'Auth (401/403), leave CRUD, approvals, balances, pagination, idempotency, error contracts.',
          deliverables: ['30+ API tests tagged smoke/regression'],
          acceptance: ['Negative tests for every role boundary', 'Idempotency check for retried POST', 'Pagination edge cases', 'Each test creates and cleans up its own data'],
          review: 'Does the suite run in parallel without collisions?',
        },
        {
          id: 'lf-db', title: 'Database validation', modules: ['m04'],
          brief: 'Verify DB state after API calls and write reconciliation queries (balances vs approved leave).',
          deliverables: ['DB helper + 5 validation queries', 'Nightly data-quality check'],
          acceptance: ['Reads via a least-privilege DB user', 'Polling for async writes, no sleeps', 'Reconciliation query catches seeded inconsistencies'],
          review: 'Do DB checks add confidence the API response can\'t give on its own?',
        },
        {
          id: 'lf-contract', title: 'Contract tests between services', modules: ['m15', 'm09'],
          brief: 'Consumer-driven contract for the payroll connector consuming leave.approved (Pact or schema-based).',
          deliverables: ['Contract + provider verification in CI'],
          acceptance: ['Breaking field rename is caught before deploy', 'Contract versioned with the consumer'],
          review: 'Can the leave team deploy independently with confidence?',
        },
      ],
    },
    {
      id: 'p3',
      title: 'Phase 3 · UI automation',
      goal: 'A thin, reliable UI layer for critical journeys only.',
      tasks: [
        {
          id: 'lf-pw', title: 'Playwright framework (TypeScript)', modules: ['m07', 'm10'],
          brief: 'Fixtures, page/component objects, storageState per role, network mocking for edge cases, traces on failure.',
          deliverables: ['ui-tests/ with playwright.config.ts and fixtures'],
          acceptance: ['Role-based auth via storageState, no UI login per test', 'getByRole/getByTestId locators', 'Trace + screenshot on failure', 'Projects for Chromium, Firefox, WebKit and mobile viewport'],
          review: 'Are tests readable as user journeys?',
        },
        {
          id: 'lf-ui-suite', title: 'Critical-path UI suite', modules: ['m07'],
          brief: 'Apply → approve (two contexts) → balance updated; reject; cancel; holiday overlap message.',
          deliverables: ['8–15 E2E journeys'],
          acceptance: ['Multi-user flow with two BrowserContexts', 'Zero fixed waits', '< 5 min in CI with sharding'],
          review: 'Is anything here testing logic that belongs in API tests?',
        },
        {
          id: 'lf-selenium', title: 'Selenium suite for the HR admin panel', modules: ['m05', 'm06', 'm08'],
          brief: 'Java + TestNG + POM with a ThreadLocal driver factory, run on Selenium Grid in Docker. Document when you would migrate it to Playwright.',
          deliverables: ['selenium-tests/ Maven module', 'Migration decision note'],
          acceptance: ['Parallel-safe driver handling', 'Explicit waits only', 'Grid via docker-compose', 'Migration note with criteria and phased plan'],
          review: 'Could you defend keeping or migrating this suite to a skeptical manager?',
        },
      ],
    },
    {
      id: 'p4',
      title: 'Phase 4 · Pipeline, scale and quality',
      goal: 'Fast feedback on every change and evidence for release decisions.',
      tasks: [
        {
          id: 'lf-ci', title: 'CI/CD pipeline with quality gates', modules: ['m11'],
          brief: 'GitHub Actions: unit → API + contract (parallel) → gate → E2E shards → report; nightly regression; post-deploy smoke.',
          deliverables: ['.github/workflows/*.yml', 'Branch protection rules documented'],
          acceptance: ['PR feedback under 15 minutes', 'Secrets via the CI secret store', 'Artifacts: HTML report, traces, JUnit XML'],
          review: 'Does a red build tell you what broke and who owns it?',
        },
        {
          id: 'lf-docker', title: 'Dockerised execution and parallelism', modules: ['m11', 'm10'],
          brief: 'Run suites in containers; shard E2E; isolate test data per worker.',
          deliverables: ['Dockerfile / compose for test execution'],
          acceptance: ['Same command runs locally and in CI', 'Sharded run merges into one report'],
          review: 'What breaks first when you double the number of workers?',
        },
        {
          id: 'lf-flaky', title: 'Flaky-test management', modules: ['m10', 'm21'],
          brief: 'Detect flakiness from run history, quarantine with owners and SLAs, track flaky rate.',
          deliverables: ['Flaky report script + policy doc'],
          acceptance: ['Flaky rate metric over last N runs', 'Quarantine is visible, owned and time-boxed', 'Retries are tracked, not hidden'],
          review: 'Would developers trust a red build again?',
        },
        {
          id: 'lf-perf-sec', title: 'Performance smoke and security checks', modules: ['m12', 'm13'],
          brief: 'k6 or JMeter smoke on apply/approve APIs; authorization matrix tests; dependency and secret scanning.',
          deliverables: ['Perf script with thresholds', 'AuthZ test matrix'],
          acceptance: ['P95 thresholds fail the job', 'IDOR check: employee cannot read another\'s leave', 'Dependency scan in CI'],
          review: 'Are the thresholds tied to real user expectations?',
        },
        {
          id: 'lf-metrics', title: 'Quality metrics and release checklist', modules: ['m21', 'm20'],
          brief: 'Dashboard of meaningful metrics and a release-readiness checklist.',
          deliverables: ['Metrics definitions', 'Release checklist'],
          acceptance: ['Defect leakage, flaky rate, MTTR, escape analysis', 'States which vanity metrics you deliberately don\'t track'],
          review: 'Would these numbers change a decision?',
        },
      ],
    },
    {
      id: 'p5',
      title: 'Phase 5 · AI-assisted and agentic testing',
      goal: 'Use AI where it helps, measure it, and keep humans accountable.',
      tasks: [
        {
          id: 'lf-ai-gen', title: 'AI-assisted test generation, evaluated', modules: ['m16', 'm19'],
          brief: 'Generate tests for one feature with an AI coding agent; review, fix and measure how many were usable.',
          deliverables: ['Before/after write-up with acceptance rate and defects found'],
          acceptance: ['Every generated test reviewed by you', 'Hallucinated APIs/locators recorded', 'Rules/instructions file used and versioned'],
          review: 'Is the claimed productivity gain backed by numbers?',
        },
        {
          id: 'lf-agents', title: 'Agentic workflow with Playwright agents / MCP', modules: ['m17', 'm18'],
          brief: 'Use Playwright\'s planner/generator/healer agents (or the Playwright MCP server) on LeaveFlow; evaluate plan quality and healing decisions.',
          deliverables: ['Agent run log + evaluation notes', 'Permission and safety rules used'],
          acceptance: ['Agent restricted to the test environment', 'Healed changes reviewed before merge', 'Failure modes documented'],
          review: 'Where would you not trust the agent, and why?',
        },
        {
          id: 'lf-story', title: 'Interview narrative', modules: ['m23'],
          brief: 'Turn the project into a 2-minute overview plus deep dives on architecture, a failure you fixed, and measurable results.',
          deliverables: ['README with architecture diagram, trade-offs and results', '3 STAR stories in the Story bank'],
          acceptance: ['Numbers are real measurements from your project', 'Explains at least two trade-offs you made'],
          review: 'Can you survive three levels of "why?" on any decision?',
        },
      ],
    },
  ] as ProjectPhase[],
};

export const PROJECT_TASKS = PROJECT.phases.flatMap((p) => p.tasks);
