import type { DiagramSpec } from './StepDiagram';

/** Step-through diagram definitions, keyed by vizId used in lessons. */
export const DIAGRAMS: Record<string, { label: string; spec: DiagramSpec }> = {
  'shift-left': {
    label: 'Shift-left and shift-right quality activities across the delivery flow',
    spec: {
      width: 860, height: 230,
      nodes: [
        { id: 'req', label: 'Requirements', sub: 'testable criteria', x: 10, y: 40 },
        { id: 'design', label: 'Design', sub: 'testability review', x: 150, y: 40 },
        { id: 'build', label: 'Build + PR', sub: 'unit · contract · lint', x: 290, y: 40, w: 130 },
        { id: 'ci', label: 'CI pipeline', sub: 'API · E2E · gates', x: 440, y: 40 },
        { id: 'deploy', label: 'Deploy', sub: 'smoke · canary', x: 580, y: 40 },
        { id: 'prod', label: 'Production', sub: 'monitor · flags', x: 720, y: 40, w: 130 },
        { id: 'left', label: '◀ Shift-left: prevent, cheap to fix', x: 10, y: 150, w: 410, h: 36 },
        { id: 'right', label: 'Shift-right: detect what the lab missed ▶', x: 440, y: 150, w: 410, h: 36 },
      ],
      edges: [
        { from: 'req', to: 'design' }, { from: 'design', to: 'build' }, { from: 'build', to: 'ci' }, { from: 'ci', to: 'deploy' }, { from: 'deploy', to: 'prod' },
        { from: 'prod', to: 'req', label: 'escaped defects feed back', bend: -120 },
      ],
      steps: [
        { title: 'Quality starts at requirements', text: 'Ask "how will we know this works?" Acceptance criteria with edge cases are the cheapest bug fix you will ever make.', nodes: ['req', 'left'] },
        { title: 'Design for testability', text: 'Stable test IDs, API contracts, feature flags and logs are designed in, not bolted on.', nodes: ['design', 'left'], edges: ['req>design'] },
        { title: 'Fast checks on every PR', text: 'Unit, contract and static checks give feedback in minutes, while the change is fresh in the developer\'s head.', nodes: ['build', 'left'], edges: ['design>build'] },
        { title: 'Pipeline quality gates', text: 'API and a thin E2E layer run in CI. Gates block merges or releases on explicit criteria.', nodes: ['ci'], edges: ['build>ci'] },
        { title: 'Verify the deployment', text: 'Post-deploy smoke and canary releases limit the blast radius of anything that slipped through.', nodes: ['deploy', 'right'], edges: ['ci>deploy'] },
        { title: 'Observe in production', text: 'Monitoring, synthetic checks and feature flags catch real-world issues: data, scale, devices.', nodes: ['prod', 'right'], edges: ['deploy>prod'] },
        { title: 'Close the loop', text: 'Every escaped defect becomes a new test, checklist item or monitor upstream.', nodes: ['prod', 'req'], edges: ['prod>req'] },
      ],
    },
  },

  'defect-lifecycle': {
    label: 'Defect lifecycle state machine',
    spec: {
      width: 860, height: 260,
      nodes: [
        { id: 'new', label: 'New', x: 10, y: 40, w: 100 },
        { id: 'triaged', label: 'Triaged', sub: 'severity + priority', x: 150, y: 40, w: 130 },
        { id: 'progress', label: 'In progress', x: 320, y: 40, w: 120 },
        { id: 'fixed', label: 'Fixed', x: 480, y: 40, w: 100 },
        { id: 'retest', label: 'Retest', x: 620, y: 40, w: 100 },
        { id: 'closed', label: 'Closed', sub: 'verified', x: 750, y: 40, w: 100 },
        { id: 'reopened', label: 'Reopened', x: 480, y: 170, w: 110 },
        { id: 'rejected', label: 'Rejected / Duplicate', sub: 'or Deferred', x: 120, y: 170, w: 190 },
      ],
      edges: [
        { from: 'new', to: 'triaged' }, { from: 'triaged', to: 'progress' }, { from: 'progress', to: 'fixed' }, { from: 'fixed', to: 'retest' }, { from: 'retest', to: 'closed', label: 'pass' },
        { from: 'retest', to: 'reopened', label: 'fail' }, { from: 'reopened', to: 'progress' }, { from: 'triaged', to: 'rejected' },
      ],
      steps: [
        { title: 'Reported', text: 'A good report has steps, expected vs actual, environment, evidence (logs, trace, screenshot) and impact.', nodes: ['new'] },
        { title: 'Triage', text: 'QA sets severity (impact); product sets priority (urgency). Duplicates, not-a-bug and deferred items leave here.', nodes: ['triaged', 'rejected'], edges: ['new>triaged', 'triaged>rejected'] },
        { title: 'Fix in progress', text: 'The developer reproduces and fixes it — ideally adding a failing automated test first.', nodes: ['progress'], edges: ['triaged>progress'] },
        { title: 'Fixed → retest', text: 'QA verifies the fix and runs sanity checks around it.', nodes: ['fixed', 'retest'], edges: ['progress>fixed', 'fixed>retest'] },
        { title: 'Fails retest → reopened', text: 'The loop most teams track as "reopen rate" — a quality signal for fixes and reviews.', nodes: ['retest', 'reopened', 'progress'], edges: ['retest>reopened', 'reopened>progress'] },
        { title: 'Passes → closed', text: 'Closed once verified. For escaped defects, add root cause and "where should we have caught it?"', nodes: ['closed'], edges: ['retest>closed'] },
      ],
    },
  },

  'http-lifecycle': {
    label: 'HTTP request and response lifecycle',
    spec: {
      width: 860, height: 250,
      nodes: [
        { id: 'client', label: 'Client / test', sub: 'Postman · RestAssured · PW', x: 10, y: 90, w: 150, h: 54 },
        { id: 'dns', label: 'DNS', x: 200, y: 10, w: 90 },
        { id: 'tls', label: 'TCP + TLS', sub: 'HTTPS handshake', x: 200, y: 170, w: 120 },
        { id: 'gw', label: 'API gateway', sub: 'auth · rate limit', x: 360, y: 90, w: 130, h: 54 },
        { id: 'svc', label: 'Leave service', sub: 'validate · logic', x: 530, y: 90, w: 130, h: 54 },
        { id: 'db', label: 'Database', x: 720, y: 90, w: 120, h: 54 },
      ],
      edges: [
        { from: 'client', to: 'dns', label: 'resolve' }, { from: 'client', to: 'tls' }, { from: 'client', to: 'gw', label: 'POST /leave' },
        { from: 'gw', to: 'svc' }, { from: 'svc', to: 'db', label: 'INSERT' }, { from: 'svc', to: 'client', label: '201 + Location', bend: 70 },
        { from: 'gw', to: 'client', label: '401 / 403 / 429', bend: -60 },
      ],
      steps: [
        { title: 'Resolve the host', text: 'DNS turns api.leaveflow.test into an IP. DNS issues show up as connection errors, not HTTP status codes.', nodes: ['client', 'dns'], edges: ['client>dns'] },
        { title: 'Connect securely', text: 'TCP connection, then a TLS handshake for HTTPS. Certificate problems fail here.', nodes: ['client', 'tls'], edges: ['client>tls'] },
        { title: 'Send the request', text: 'Method + path + headers (Authorization: Bearer <JWT>, Content-Type) + JSON body.', nodes: ['client', 'gw'], edges: ['client>gw'] },
        { title: 'Gateway checks', text: 'No/invalid token → 401 (who are you?). Valid token, wrong role → 403 (not allowed). Too many calls → 429.', nodes: ['gw', 'client'], edges: ['gw>client'] },
        { title: 'Business logic', text: 'Validation errors → 400/422. Conflicts (overlapping leave) → 409. Bugs → 500.', nodes: ['gw', 'svc'], edges: ['gw>svc'] },
        { title: 'Persist', text: 'The service writes to the DB inside a transaction.', nodes: ['svc', 'db'], edges: ['svc>db'] },
        { title: 'Respond', text: '201 Created with the new resource (and often a Location header). Your test asserts status, schema, body and side effects.', nodes: ['svc', 'client'], edges: ['svc>client'] },
      ],
    },
  },

  'webdriver-flow': {
    label: 'Selenium WebDriver command flow',
    spec: {
      width: 860, height: 220,
      nodes: [
        { id: 'test', label: 'Test code', sub: 'Java bindings', x: 10, y: 80, w: 130, h: 54 },
        { id: 'http', label: 'W3C WebDriver', sub: 'HTTP + JSON', x: 190, y: 80, w: 140, h: 54 },
        { id: 'grid', label: 'Grid (optional)', sub: 'router · node', x: 380, y: 10, w: 140, h: 54 },
        { id: 'driver', label: 'chromedriver', sub: 'browser driver', x: 380, y: 150, w: 140, h: 54 },
        { id: 'browser', label: 'Browser', sub: 'DOM', x: 580, y: 80, w: 120, h: 54 },
        { id: 'bidi', label: 'BiDi (Selenium 4+)', sub: 'events · network', x: 730, y: 80, w: 120, h: 54 },
      ],
      edges: [
        { from: 'test', to: 'http', label: 'driver.findElement' }, { from: 'http', to: 'grid' }, { from: 'http', to: 'driver' }, { from: 'grid', to: 'browser' }, { from: 'driver', to: 'browser' },
        { from: 'browser', to: 'test', label: 'JSON response', bend: 90 }, { from: 'browser', to: 'bidi' },
      ],
      steps: [
        { title: 'Your code calls the API', text: 'WebDriver is a Java interface; ChromeDriver is a class implementing it. Each call becomes a command.', nodes: ['test', 'http'], edges: ['test>http'] },
        { title: 'One HTTP request per command', text: 'Commands are serialised to the W3C WebDriver protocol. Every findElement / click is a network round trip — why chatty tests are slow.', nodes: ['http', 'driver'], edges: ['http>driver'] },
        { title: 'Or via Grid', text: 'RemoteWebDriver sends the same commands to a Grid router, which picks a node with a matching browser.', nodes: ['http', 'grid'], edges: ['http>grid', 'grid>browser'] },
        { title: 'The driver drives the browser', text: 'The browser vendor\'s driver translates commands into browser automation.', nodes: ['driver', 'browser'], edges: ['driver>browser'] },
        { title: 'Response comes back', text: 'An element reference, a value or an error (NoSuchElement, StaleElementReference…). No auto-waiting: synchronisation is your job.', nodes: ['browser', 'test'], edges: ['browser>test'] },
        { title: 'WebDriver BiDi', text: 'Selenium 4+ adds a bidirectional channel for events, console logs and network interception, closing part of the gap with Playwright.', nodes: ['browser', 'bidi'], edges: ['browser>bidi'] },
      ],
    },
  },

  'browser-context': {
    label: 'Playwright Browser, BrowserContext and Page isolation',
    spec: {
      width: 860, height: 280,
      nodes: [
        { id: 'browser', label: 'Browser (one process)', x: 10, y: 10, w: 840, h: 260, group: true },
        { id: 'ctxA', label: 'Context A — employee', x: 30, y: 40, w: 390, h: 210, group: true },
        { id: 'ctxB', label: 'Context B — manager', x: 440, y: 40, w: 390, h: 210, group: true },
        { id: 'a1', label: 'Page: /leave/apply', x: 50, y: 80, w: 170 },
        { id: 'a2', label: 'Page: popup', x: 235, y: 80, w: 165 },
        { id: 'aState', label: 'cookies · localStorage', sub: 'storageState: employee.json', x: 50, y: 170, w: 350, h: 54 },
        { id: 'b1', label: 'Page: /approvals', x: 460, y: 80, w: 170 },
        { id: 'bState', label: 'cookies · localStorage', sub: 'storageState: manager.json', x: 460, y: 170, w: 350, h: 54 },
      ],
      edges: [
        { from: 'a1', to: 'b1', label: 'request appears', bend: -40 },
      ],
      steps: [
        { title: 'One browser, launched once', text: 'Launching a browser is expensive, so Playwright reuses it across tests in a worker.', nodes: ['browser'] },
        { title: 'Each test gets a fresh context', text: 'A BrowserContext is like a brand-new incognito profile: its own cookies, storage and cache. Creating one takes milliseconds.', nodes: ['ctxA'] },
        { title: 'Pages live inside a context', text: 'Tabs and popups opened by the app share their context\'s session.', nodes: ['a1', 'a2'] },
        { title: 'Logged in without the login page', text: 'storageState loads saved cookies/localStorage, so tests skip the UI login and start authenticated.', nodes: ['aState'] },
        { title: 'Two users in one test', text: 'A second context is a completely separate session: employee applies, manager approves — no cross-talk.', nodes: ['ctxB', 'b1', 'bState'] },
        { title: 'Multi-user workflow', text: 'Drive both pages from the same test to verify the request reaches the manager. Isolation is why parallel Playwright tests don\'t leak state.', nodes: ['a1', 'b1'], edges: ['a1>b1'] },
      ],
    },
  },

  'ci-pipeline': {
    label: 'CI/CD testing pipeline with quality gates',
    spec: {
      width: 860, height: 250,
      nodes: [
        { id: 'pr', label: 'Pull request', x: 10, y: 90, w: 110 },
        { id: 'build', label: 'Build + unit', sub: '< 5 min', x: 150, y: 90, w: 120 },
        { id: 'api', label: 'API + contract', sub: 'parallel', x: 300, y: 30, w: 120 },
        { id: 'static', label: 'Lint · SAST', sub: 'deps scan', x: 300, y: 150, w: 120 },
        { id: 'gate', label: 'Quality gate', sub: 'merge allowed?', x: 450, y: 90, w: 120 },
        { id: 'e2e', label: 'E2E shards', sub: 'staging', x: 600, y: 30, w: 110 },
        { id: 'deploy', label: 'Deploy prod', sub: 'smoke + canary', x: 600, y: 150, w: 110 },
        { id: 'report', label: 'Reports', sub: 'trace · Slack', x: 740, y: 90, w: 110 },
      ],
      edges: [
        { from: 'pr', to: 'build' }, { from: 'build', to: 'api' }, { from: 'build', to: 'static' }, { from: 'api', to: 'gate' }, { from: 'static', to: 'gate' },
        { from: 'gate', to: 'e2e', label: 'merge' }, { from: 'e2e', to: 'deploy' }, { from: 'e2e', to: 'report' }, { from: 'deploy', to: 'report' },
      ],
      steps: [
        { title: 'A PR triggers the pipeline', text: 'Every change runs the same automated checks — no "works on my machine".', nodes: ['pr'] },
        { title: 'Fail fast', text: 'Compile and unit tests first: cheapest, fastest, catch most logic bugs.', nodes: ['build'], edges: ['pr>build'] },
        { title: 'Parallel stages', text: 'API/contract tests and static/security scans run at the same time to keep feedback short.', nodes: ['api', 'static'], edges: ['build>api', 'build>static'] },
        { title: 'Quality gate', text: 'Explicit criteria — all required checks green, coverage not dropping, no high-severity findings — decide whether the PR may merge.', nodes: ['gate'], edges: ['api>gate', 'static>gate'] },
        { title: 'E2E after merge', text: 'Slower UI journeys run sharded across machines against a deployed environment.', nodes: ['e2e'], edges: ['gate>e2e'] },
        { title: 'Deploy and verify', text: 'Post-deploy smoke and canary checks; automatic rollback if they fail.', nodes: ['deploy'], edges: ['e2e>deploy'] },
        { title: 'Make failures actionable', text: 'JUnit/HTML reports, Playwright traces and screenshots as artifacts; notify the owning team, not everyone.', nodes: ['report'], edges: ['e2e>report', 'deploy>report'] },
      ],
    },
  },

  'kafka-flow': {
    label: 'Asynchronous event flow with Kafka',
    spec: {
      width: 860, height: 250,
      nodes: [
        { id: 'leave', label: 'Leave service', sub: 'producer', x: 10, y: 90, w: 130, h: 54 },
        { id: 'topic', label: 'Topic: leave-approved', sub: 'partitions 0 · 1 · 2', x: 190, y: 90, w: 190, h: 54 },
        { id: 'payroll', label: 'Payroll service', sub: 'consumer group A', x: 440, y: 20, w: 160, h: 54 },
        { id: 'notify', label: 'Notification svc', sub: 'consumer group B', x: 440, y: 160, w: 160, h: 54 },
        { id: 'dlq', label: 'Dead-letter topic', x: 660, y: 160, w: 170, h: 54 },
        { id: 'pdb', label: 'Payroll DB', sub: 'eventually updated', x: 660, y: 20, w: 170, h: 54 },
      ],
      edges: [
        { from: 'leave', to: 'topic', label: 'publish' }, { from: 'topic', to: 'payroll' }, { from: 'topic', to: 'notify' }, { from: 'payroll', to: 'pdb' }, { from: 'notify', to: 'dlq', label: 'after retries' },
      ],
      steps: [
        { title: 'Publish an event', text: 'Approving leave publishes LeaveApproved. The API returns immediately; downstream work happens later.', nodes: ['leave', 'topic'], edges: ['leave>topic'] },
        { title: 'Fan-out to consumers', text: 'Each consumer group gets its own copy. Ordering is guaranteed only within a partition (key by employeeId).', nodes: ['topic', 'payroll', 'notify'], edges: ['topic>payroll', 'topic>notify'] },
        { title: 'Eventual consistency', text: 'Payroll\'s DB updates seconds later. Tests must poll with a timeout ("eventually"), never sleep a fixed time.', nodes: ['payroll', 'pdb'], edges: ['payroll>pdb'] },
        { title: 'Failures and retries', text: 'Consumers can see duplicates (at-least-once delivery), so handlers must be idempotent. Poison messages go to a DLQ.', nodes: ['notify', 'dlq'], edges: ['notify>dlq'] },
        { title: 'What to test', text: 'Schema/contract of the event, idempotency (same event twice), ordering per key, DLQ behaviour, and consumer lag under load.', nodes: ['topic', 'payroll', 'notify', 'dlq'] },
      ],
    },
  },

  'agent-loop': {
    label: 'AI agent loop: reason, act with tools, observe',
    spec: {
      width: 860, height: 260,
      nodes: [
        { id: 'goal', label: 'Goal', sub: '"test leave approval"', x: 10, y: 100, w: 140, h: 54 },
        { id: 'llm', label: 'LLM reasoning', sub: 'plan next step', x: 210, y: 100, w: 150, h: 54 },
        { id: 'tools', label: 'Tools', sub: 'browser · API · files', x: 430, y: 20, w: 160, h: 54 },
        { id: 'env', label: 'Environment', sub: 'app under test', x: 660, y: 20, w: 170, h: 54 },
        { id: 'obs', label: 'Observation', sub: 'snapshot · result', x: 430, y: 180, w: 160, h: 54 },
        { id: 'human', label: 'Human approval', sub: 'risky actions', x: 660, y: 180, w: 170, h: 54 },
        { id: 'mem', label: 'Context / memory', x: 210, y: 10, w: 150, h: 40 },
      ],
      edges: [
        { from: 'goal', to: 'llm' }, { from: 'mem', to: 'llm' }, { from: 'llm', to: 'tools', label: 'tool call' }, { from: 'tools', to: 'env' }, { from: 'env', to: 'obs', label: 'result' }, { from: 'obs', to: 'llm', label: 'feedback' }, { from: 'tools', to: 'human', bend: 40 },
      ],
      steps: [
        { title: 'A goal, not a script', text: 'A script has fixed steps. An agent gets a goal and decides the steps at run time.', nodes: ['goal', 'llm'], edges: ['goal>llm'] },
        { title: 'Reason with context', text: 'The model reads the goal, its instructions, memory and previous observations to choose the next action.', nodes: ['mem', 'llm'], edges: ['mem>llm'] },
        { title: 'Act through tools', text: 'It emits a structured tool call (navigate, click, call API). The harness — not the model — executes it.', nodes: ['llm', 'tools', 'env'], edges: ['llm>tools', 'tools>env'] },
        { title: 'Observe', text: 'The tool result (page snapshot, HTTP response, error) is fed back to the model.', nodes: ['env', 'obs', 'llm'], edges: ['env>obs', 'obs>llm'] },
        { title: 'Loop until done', text: 'Reason → act → observe repeats (the ReAct pattern) until the goal is met or a step limit is hit.', nodes: ['llm', 'tools', 'obs'], edges: ['llm>tools', 'obs>llm'] },
        { title: 'Guardrails', text: 'Permissions limit which tools exist; risky actions need human approval; every step is logged for observability and evaluation.', nodes: ['tools', 'human'], edges: ['tools>human'] },
      ],
    },
  },

  'mcp-flow': {
    label: 'MCP host, client and server interaction',
    spec: {
      width: 860, height: 260,
      nodes: [
        { id: 'host', label: 'Host app', sub: 'IDE · Claude · Cursor', x: 10, y: 20, w: 300, h: 220, group: true },
        { id: 'llm', label: 'LLM', x: 30, y: 60, w: 110 },
        { id: 'client1', label: 'MCP client', sub: '1 per server', x: 170, y: 60, w: 120, h: 54 },
        { id: 'client2', label: 'MCP client', x: 170, y: 160, w: 120 },
        { id: 'pw', label: 'Playwright MCP server', sub: 'tools: navigate, click, snapshot', x: 400, y: 50, w: 230, h: 60 },
        { id: 'tm', label: 'Test-mgmt MCP server', sub: 'resources: test cases', x: 400, y: 155, w: 230, h: 60 },
        { id: 'browser', label: 'Browser', x: 690, y: 55, w: 150, h: 50 },
        { id: 'jira', label: 'Test DB / Jira', x: 690, y: 160, w: 150, h: 50 },
      ],
      edges: [
        { from: 'client1', to: 'pw', label: 'JSON-RPC (stdio/HTTP)' }, { from: 'client2', to: 'tm' }, { from: 'llm', to: 'client1', label: 'tool call' }, { from: 'pw', to: 'browser' }, { from: 'tm', to: 'jira' }, { from: 'pw', to: 'client1', label: 'result', bend: 30 },
      ],
      steps: [
        { title: 'Host, clients, servers', text: 'The host app runs one MCP client per connected server. Servers expose capabilities; the host decides what the model may use.', nodes: ['host', 'client1', 'client2', 'pw', 'tm'] },
        { title: 'Initialise and discover', text: 'Client and server handshake over JSON-RPC (stdio for local, Streamable HTTP for remote), then list tools, resources and prompts.', nodes: ['client1', 'pw'], edges: ['client1>pw'] },
        { title: 'Model chooses a tool', text: 'The LLM sees tool names, descriptions and JSON schemas, and emits a call such as browser_navigate { url }.', nodes: ['llm', 'client1'], edges: ['llm>client1'] },
        { title: 'Server does the work', text: 'The Playwright MCP server drives a real browser and returns an accessibility snapshot — structured text, not pixels.', nodes: ['pw', 'browser'], edges: ['pw>browser'] },
        { title: 'Result back to the model', text: 'The result goes back into context; the agent loop continues.', nodes: ['pw', 'client1', 'llm'], edges: ['pw>client1'] },
        { title: 'Resources and permissions', text: 'Another server can expose resources (test cases, requirements). The host should require approval for destructive tools and never forward secrets.', nodes: ['client2', 'tm', 'jira'], edges: ['client2>tm', 'tm>jira'] },
      ],
    },
  },

  'sharded-runner': {
    label: 'Parallel workers and sharding across machines',
    spec: {
      width: 860, height: 270,
      nodes: [
        { id: 'suite', label: 'Suite: 600 tests', sub: '~60 min serial', x: 10, y: 105, w: 150, h: 54 },
        { id: 'm1', label: 'CI machine 1', sub: '--shard=1/3', x: 230, y: 15, w: 150, h: 54 },
        { id: 'm2', label: 'CI machine 2', sub: '--shard=2/3', x: 230, y: 105, w: 150, h: 54 },
        { id: 'm3', label: 'CI machine 3', sub: '--shard=3/3', x: 230, y: 195, w: 150, h: 54 },
        { id: 'w', label: '4 workers each', sub: 'own browser + contexts', x: 450, y: 105, w: 170, h: 54 },
        { id: 'merge', label: 'Merge reports', sub: 'blob → HTML', x: 690, y: 105, w: 150, h: 54 },
      ],
      edges: [
        { from: 'suite', to: 'm1' }, { from: 'suite', to: 'm2' }, { from: 'suite', to: 'm3' }, { from: 'm1', to: 'w' }, { from: 'm2', to: 'w' }, { from: 'm3', to: 'w' }, { from: 'w', to: 'merge' },
      ],
      steps: [
        { title: 'One long serial run', text: '600 tests at ~6 s each is an hour of feedback — too slow for a PR.', nodes: ['suite'] },
        { title: 'Shard across machines', text: 'Split the suite into N slices (Playwright --shard=i/N, or a CI matrix). Each machine runs one slice.', nodes: ['m1', 'm2', 'm3'], edges: ['suite>m1', 'suite>m2', 'suite>m3'] },
        { title: 'Parallel workers per machine', text: 'Each machine runs several worker processes. 3 × 4 = 12 lanes → about 5 minutes.', nodes: ['w'], edges: ['m1>w', 'm2>w', 'm3>w'] },
        { title: 'Only works with isolated tests', text: 'Parallelism exposes shared state: tests must create their own data and never depend on order.', nodes: ['w'] },
        { title: 'One report', text: 'Each shard uploads a blob report; a final job merges them into one HTML report with traces.', nodes: ['merge'], edges: ['w>merge'] },
      ],
    },
  },

  'stack-heap': {
    label: 'Java stack and heap memory',
    spec: {
      width: 860, height: 270,
      nodes: [
        { id: 'stack', label: 'Thread stack (per thread)', x: 10, y: 10, w: 330, h: 250, group: true },
        { id: 'heap', label: 'Heap (shared, garbage-collected)', x: 380, y: 10, w: 470, h: 250, group: true },
        { id: 'main', label: 'main()', sub: 'args', x: 30, y: 190, w: 290 },
        { id: 'apply', label: 'applyLeave()', sub: 'int days = 3; req →', x: 30, y: 120, w: 290 },
        { id: 'validate', label: 'validate()', sub: 'boolean ok', x: 30, y: 50, w: 290 },
        { id: 'req', label: 'LeaveRequest object', sub: 'employee →, days = 3', x: 410, y: 60, w: 200, h: 54 },
        { id: 'emp', label: 'Employee object', sub: 'name → "Asha"', x: 640, y: 60, w: 190, h: 54 },
        { id: 'pool', label: 'String pool', sub: '"Asha"', x: 640, y: 170, w: 190, h: 54 },
        { id: 'garbage', label: 'Unreachable object', sub: 'eligible for GC', x: 410, y: 170, w: 200, h: 54 },
      ],
      edges: [
        { from: 'apply', to: 'req', label: 'reference' }, { from: 'req', to: 'emp' }, { from: 'emp', to: 'pool' },
      ],
      steps: [
        { title: 'Each call gets a stack frame', text: 'main() calls applyLeave(), which calls validate(). Frames hold primitives and references, and pop when the method returns.', nodes: ['main', 'apply', 'validate'] },
        { title: 'Objects live on the heap', text: 'new LeaveRequest(...) allocates on the heap. The local variable req only holds a reference to it.', nodes: ['apply', 'req'], edges: ['apply>req'] },
        { title: 'Objects reference objects', text: 'The request references an Employee, whose name references a String literal in the string pool.', nodes: ['req', 'emp', 'pool'], edges: ['req>emp', 'emp>pool'] },
        { title: 'Frames pop, objects may become garbage', text: 'When no live reference reaches an object, the garbage collector can reclaim it. You don\'t free memory manually.', nodes: ['garbage'] },
        { title: 'Threads and safety', text: 'Each thread has its own stack, but the heap is shared. Shared mutable heap objects are where race conditions live — one reason drivers go in ThreadLocal.', nodes: ['stack', 'heap'] },
      ],
    },
  },

  'selenium-grid': {
    label: 'Selenium Grid routing sessions to nodes',
    spec: {
      width: 860, height: 250,
      nodes: [
        { id: 'tests', label: 'Parallel tests', sub: 'TestNG threads', x: 10, y: 95, w: 150, h: 54 },
        { id: 'router', label: 'Router', x: 220, y: 95, w: 110 },
        { id: 'dist', label: 'Distributor', sub: 'matches capabilities', x: 380, y: 95, w: 160, h: 54 },
        { id: 'n1', label: 'Node: Chrome × 4', x: 610, y: 15, w: 220 },
        { id: 'n2', label: 'Node: Firefox × 2', x: 610, y: 100, w: 220 },
        { id: 'n3', label: 'Node: Edge × 2', x: 610, y: 185, w: 220 },
      ],
      edges: [
        { from: 'tests', to: 'router', label: 'new session' }, { from: 'router', to: 'dist' }, { from: 'dist', to: 'n1' }, { from: 'dist', to: 'n2' }, { from: 'dist', to: 'n3' },
      ],
      steps: [
        { title: 'Tests request sessions', text: 'Each thread creates a RemoteWebDriver with desired capabilities (browser, version, platform).', nodes: ['tests', 'router'], edges: ['tests>router'] },
        { title: 'Distributor finds a slot', text: 'The Grid matches capabilities to a free slot; if none is free the request queues.', nodes: ['dist'], edges: ['router>dist'] },
        { title: 'Sessions run on nodes', text: 'Nodes (often Docker containers) host browsers. Scale by adding nodes, e.g. with docker-compose or Kubernetes.', nodes: ['n1', 'n2', 'n3'], edges: ['dist>n1', 'dist>n2', 'dist>n3'] },
        { title: 'Thread safety in the framework', text: 'Each test thread needs its own driver: store it in ThreadLocal<WebDriver> and quit it in teardown.', nodes: ['tests'] },
      ],
    },
  },
};
