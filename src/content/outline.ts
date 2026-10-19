import type { ModuleBundle } from './bundle';

type Meta = Omit<ModuleBundle['module'], 'lessons'>;

/**
 * Metadata for all 24 modules, mapped 1:1 to the parts of the original mentor prompt.
 * `topics` lists every bullet from that prompt so the traceability matrix can be generated.
 * A module listed here without an authored bundle shows as "Planned" in the app.
 */
export const OUTLINE: Meta[] = [
  {
    id: 'm01', number: 1, title: 'Testing Fundamentals & the QA Lead Mindset', area: 'A', level: 'L1', skills: ['fundamentals', 'qaStrategy'],
    summary: 'Pyramid, verification vs validation, test types, test design, defects and risk.', prerequisites: [], tags: [], topics: ['see module'], source: 'sdet3/curriculum/01-testing-fundamentals/LESSON.md',
  },
  {
    id: 'm02', number: 2, title: 'Java for SDETs', area: 'B', level: 'L2', skills: ['java'],
    summary: 'OOP, collections and HashMap internals, strings, exceptions, generics, streams, memory model and concurrency — taught from JavaScript you already know.',
    prerequisites: ['m01'], tags: ['oop', 'collections', 'streams', 'concurrency'],
    topics: ['OOP', 'Classes and objects', 'Encapsulation', 'Inheritance', 'Polymorphism', 'Abstraction', 'Interfaces', 'Abstract classes', 'Constructors', 'Static', 'Final', 'Access modifiers', 'Exception handling', 'Collections', 'List', 'Set', 'Map', 'HashMap internals', 'HashSet', 'TreeMap', 'ConcurrentHashMap', 'Comparable', 'Comparator', 'Generics', 'Streams', 'Lambda expressions', 'Functional interfaces', 'Optional', 'String handling', 'String pool', 'StringBuilder', 'StringBuffer', 'Immutable objects', 'Java memory model', 'Stack vs heap', 'Garbage collection', 'Multithreading', 'Synchronization', 'Executors', 'CompletableFuture', 'Thread safety', 'Race conditions'],
    source: 'sdet3/curriculum/02-java/PART1-OOP-COLLECTIONS.md, PART2-STREAMS-CONCURRENCY.md',
  },
  {
    id: 'm03', number: 3, title: 'Data Structures & Algorithms for SDET Interviews', area: 'B', level: 'L2', skills: ['dsa'],
    summary: 'The handful of patterns that cover most SDET coding rounds: hashing, two pointers, sliding window, stacks, binary search, recursion, trees and graphs.',
    prerequisites: ['m02'], tags: ['patterns', 'big-o'],
    topics: ['Arrays', 'Strings', 'HashMap', 'HashSet', 'Stack', 'Queue', 'Deque', 'Linked List', 'Trees', 'Binary Search', 'Sorting', 'Recursion', 'Sliding window', 'Two pointers', 'Prefix sums', 'Basic graphs', 'Big O', 'Time complexity', 'Space complexity'],
    source: 'sdet3/curriculum/03-dsa/LESSON.md',
  },
  {
    id: 'm04', number: 4, title: 'SQL & Database Validation', area: 'E', level: 'L2', skills: ['sql'],
    summary: 'Run real SQL in the browser against an HRMS dataset: joins, aggregation, subqueries, CTEs, window functions, indexes, transactions and isolation.',
    prerequisites: ['m01'], tags: ['joins', 'window functions', 'acid'],
    topics: ['SELECT', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'JOINs', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'SELF JOIN', 'Subqueries', 'CTE', 'Window functions', 'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'Aggregations', 'Indexes', 'Transactions', 'ACID', 'Isolation levels', 'QA database-validation problems'],
    source: 'sdet3/curriculum/04-sql/LESSON.md',
  },
  {
    id: 'm05', number: 5, title: 'Selenium WebDriver', area: 'C', level: 'L2', skills: ['selenium'],
    summary: 'How WebDriver really works, robust locators, synchronisation, frames/windows/alerts, shadow DOM, Grid and the exceptions interviewers ask about.',
    prerequisites: ['m02'], tags: ['webdriver', 'locators', 'waits'],
    topics: ['WebDriver', 'Browser drivers', 'Locators', 'CSS selectors', 'XPath', 'Dynamic XPath', 'Relative XPath', 'Web elements', 'Waits', 'Implicit wait', 'Explicit wait', 'Fluent wait', 'StaleElementReferenceException', 'ElementClickInterceptedException', 'NoSuchElementException', 'Frames', 'Windows', 'Tabs', 'Alerts', 'Cookies', 'JavaScriptExecutor', 'Actions', 'Keyboard/mouse interactions', 'File uploads', 'Downloads', 'Screenshots', 'Shadow DOM', 'Web components', 'Dynamic elements', 'AJAX', 'Synchronization', 'Browser capabilities', 'Selenium Grid', 'Parallel execution', 'Remote WebDriver'],
    source: 'sdet3/curriculum/05-selenium/LESSON.md',
  },
  {
    id: 'm06', number: 6, title: 'Building a Production Selenium Framework', area: 'C', level: 'L3', skills: ['selenium', 'framework'],
    summary: 'Page objects and components, driver factory with ThreadLocal, config, data, logging, reporting, retries, Grid/Docker/cloud and DB/API hooks.',
    prerequisites: ['m05'], tags: ['pom', 'threadlocal', 'testng'],
    topics: ['Page Object Model', 'Page Factory', 'Component-based design', 'Driver factory', 'Configuration management', 'Environment management', 'Test data management', 'Logging', 'Reporting', 'Retry', 'Screenshots', 'Failure handling', 'Parallel execution', 'ThreadLocal', 'CI/CD integration', 'Docker', 'Selenium Grid', 'Cloud execution', 'API integration', 'Database validation', 'Design the framework yourself'],
    source: 'sdet3/curriculum/06-selenium-framework/LESSON.md',
  },
  {
    id: 'm07', number: 7, title: 'Playwright Deep Dive (TypeScript)', area: 'D', level: 'L3', skills: ['playwright'],
    summary: 'Browser → BrowserContext → Page, locators and auto-waiting, web-first assertions, fixtures, auth state, network mocking, API testing, tracing, projects, sharding and CI.',
    prerequisites: ['m01'], tags: ['typescript', 'fixtures', 'trace'],
    topics: ['Playwright architecture', 'Browser', 'BrowserContext', 'Page', 'Locator', 'Auto-waiting', 'Assertions', 'Fixtures', 'Hooks', 'Test isolation', 'Authentication', 'Storage state', 'Multiple tabs', 'Multiple contexts', 'Frames', 'Downloads', 'Uploads', 'Network interception', 'Mocking', 'API testing', 'Tracing', 'Screenshots', 'Videos', 'Codegen', 'Debugging', 'Parallel execution', 'Projects', 'Configuration', 'Retries', 'Sharding', 'Test annotations', 'Tags', 'Reporting', 'CI/CD', 'Docker', 'Cross-browser testing'],
    source: 'sdet3/curriculum/07-playwright/LESSON.md',
  },
  {
    id: 'm08', number: 8, title: 'Selenium vs Playwright: Choosing and Migrating', area: 'D', level: 'L4', skills: ['playwright', 'selenium', 'framework'],
    summary: 'Architecture differences, reliability, parallelism, debugging and a migration strategy you can defend — including your own Playwright migration story.',
    prerequisites: ['m05', 'm07'], tags: ['comparison', 'migration'],
    topics: ['Selenium vs Playwright', 'When to choose Selenium', 'When to choose Playwright', 'Architecture differences', 'Auto-waiting', 'Browser contexts', 'Parallelism', 'Reliability', 'Performance', 'Grid vs Playwright workers', 'Cross-browser limitations', 'CI/CD differences', 'Debugging', 'Network mocking', 'API testing', 'Test isolation', 'Maintenance', 'Migration strategy'],
    source: 'sdet3/curriculum/08-selenium-vs-playwright/LESSON.md',
  },
  {
    id: 'm09', number: 9, title: 'API Testing & API Frameworks', area: 'E', level: 'L2', skills: ['api'],
    summary: 'HTTP from the wire up, auth (OAuth/JWT), schemas, idempotency, pagination, rate limits, contract testing, with Postman, REST Assured and Playwright request.',
    prerequisites: ['m01'], tags: ['http', 'rest', 'jwt', 'contracts'],
    topics: ['HTTP', 'HTTPS', 'REST', 'SOAP', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'Headers', 'Cookies', 'Authentication', 'Authorization', 'OAuth', 'JWT', 'Status codes', 'Request/response', 'JSON', 'JSON Schema', 'Serialization', 'Deserialization', 'Contract testing', 'Idempotency', 'Pagination', 'Rate limiting', 'Error handling', 'Postman', 'REST Assured', 'Playwright API testing', 'Production-grade API framework'],
    source: 'sdet3/curriculum/09-api-testing/LESSON.md',
  },
  {
    id: 'm10', number: 10, title: 'Test Framework Architecture', area: 'C', level: 'L4', skills: ['framework'],
    summary: 'How a senior SDET designs automation: patterns, layering, DI, config, data, secrets, reporting, retries, flaky-test management, tagging and triage — and how to whiteboard it.',
    prerequisites: ['m06', 'm07', 'm09'], tags: ['architecture', 'flaky', 'whiteboard'],
    topics: ['Framework patterns', 'POM', 'Screenplay', 'Component model', 'Data-driven testing', 'Keyword-driven testing', 'Hybrid frameworks', 'Dependency injection', 'Configuration', 'Environment handling', 'Test data', 'Secrets', 'Logging', 'Reporting', 'Retry strategy', 'Parallelism', 'Flaky test management', 'Test tagging', 'Test selection', 'Test ownership', 'Test maintenance', 'Failure triage', 'Design an automation framework for our company'],
    source: 'sdet3/curriculum/10-framework-architecture/LESSON.md',
  },
  {
    id: 'm11', number: 11, title: 'CI/CD & DevOps for Testers', area: 'F', level: 'L4', skills: ['cicd', 'devops'],
    summary: 'Git workflows, Maven, Jenkins and GitHub Actions, Docker, Kubernetes and Helm basics, secrets, artifacts, quality gates and post-deploy validation.',
    prerequisites: ['m10'], tags: ['github actions', 'jenkins', 'docker', 'k8s'],
    topics: ['Git', 'GitHub/GitLab', 'Branching strategies', 'Pull requests', 'Code reviews', 'Jenkins', 'GitHub Actions', 'Maven', 'Docker', 'Kubernetes basics', 'Helm basics', 'Environment management', 'Secrets', 'Artifacts', 'Pipeline stages', 'Quality gates', 'Parallel pipelines', 'Test reports', 'Failure notifications', 'Scheduled testing', 'Deployment validation', 'Smoke tests after deployment', 'Regression pipelines', 'Design a CI/CD testing pipeline'],
    source: 'sdet3/curriculum/11-cicd-devops/LESSON.md',
  },
  {
    id: 'm12', number: 12, title: 'Performance Testing', area: 'G', level: 'L4', skills: ['performance'],
    summary: 'Load, stress, spike, soak and capacity tests; latency vs throughput; percentiles; finding bottlenecks; JMeter basics and a lead-level performance strategy.',
    prerequisites: ['m09'], tags: ['p95', 'jmeter'],
    topics: ['Load testing', 'Stress testing', 'Spike testing', 'Endurance testing', 'Capacity testing', 'Throughput', 'Latency', 'Response time', 'Percentiles', 'P95', 'P99', 'Bottlenecks', 'Basic JMeter knowledge', 'Performance test strategy', 'Interpreting results'],
    source: 'sdet3/curriculum/12-performance/LESSON.md',
  },
  {
    id: 'm13', number: 13, title: 'Security Testing for SDETs', area: 'G', level: 'L4', skills: ['security'],
    summary: 'Authentication vs authorization, sessions, OWASP Top 10, injection, XSS, CSRF, sensitive data and secrets — enough to discuss security testing credibly.',
    prerequisites: ['m09'], tags: ['owasp', 'auth'],
    topics: ['Authentication', 'Authorization', 'Session management', 'OWASP Top 10', 'SQL injection', 'XSS', 'CSRF', 'Sensitive data exposure', 'Secrets management', 'Basic API security testing'],
    source: 'sdet3/curriculum/13-security/LESSON.md',
  },
  {
    id: 'm14', number: 14, title: 'Mobile Testing', area: 'G', level: 'L3', skills: ['mobile'],
    summary: 'Android and iOS testing, native vs hybrid vs WebView, Appium architecture, device farms like BrowserStack, and mobile CI.',
    prerequisites: ['m05'], tags: ['appium', 'browserstack'],
    topics: ['Android testing', 'iOS testing', 'Appium', 'Mobile automation architecture', 'Native apps', 'Hybrid apps', 'WebView', 'Device farms', 'BrowserStack', 'Mobile CI'],
    source: 'sdet3/curriculum/14-mobile/LESSON.md',
  },
  {
    id: 'm15', number: 15, title: 'Testing Distributed Systems', area: 'H', level: 'L4', skills: ['distributed'],
    summary: 'Microservices, Kafka and queues, async testing, eventual consistency, service virtualisation, consumer-driven contracts and dependency failures.',
    prerequisites: ['m09'], tags: ['kafka', 'async', 'contracts'],
    topics: ['Microservices', 'Event-driven architecture', 'Kafka basics', 'Queues', 'Async testing', 'Eventual consistency', 'Distributed systems', 'Service virtualization', 'Contract testing', 'Consumer-driven contracts', 'Mocking', 'Test environments', 'Dependency failures', 'How QA changes with microservices'],
    source: 'sdet3/curriculum/15-distributed-systems/LESSON.md',
  },
  {
    id: 'm16', number: 16, title: 'AI for Testing & Testing AI', area: 'H', level: 'L7', skills: ['ai'],
    summary: 'Using LLMs in QA work, and testing LLM-powered features: evaluation, hallucinations, prompt and model regression, RAG basics, guardrails and safety.',
    prerequisites: ['m01'], tags: ['llm', 'evals', 'rag'],
    topics: ['AI-assisted test generation', 'AI-assisted debugging', 'AI test maintenance', 'AI code generation', 'LLMs in QA', 'Prompt engineering', 'RAG basics', 'AI evaluation', 'AI hallucinations', 'AI reliability', 'AI testing strategy', 'Testing AI-powered applications', 'LLM evaluation', 'Prompt testing', 'Model regression testing', 'Guardrails', 'Safety testing', 'Agent testing'],
    source: 'sdet3/curriculum/16-ai-testing/LESSON.md',
  },
  {
    id: 'm17', number: 17, title: 'AI Agents & Playwright Agents', area: 'H', level: 'L7', skills: ['agents'],
    summary: 'What makes something an agent, the agent loop, tools, memory, permissions and evaluation — then Playwright\'s planner, generator and healer agents in practice.',
    prerequisites: ['m07', 'm16'], tags: ['agents', 'react loop', 'healer'],
    topics: ['What is an AI agent', 'Agent vs chatbot', 'Agent vs automation script', 'Tool calling', 'Planning', 'Reasoning', 'Memory', 'Context', 'State', 'Environment', 'Observability', 'Agent loops', 'ReAct-style systems', 'Tool execution', 'Human-in-the-loop', 'Agent permissions', 'Agent safety', 'Agent evaluation', 'Playwright Agents', 'Agent skills', 'Skills architecture', 'Hooks', 'Tools', 'Browser tools', 'Test generation', 'Test execution', 'Test healing', 'Locator discovery', 'Debugging agents', 'Planning agents', 'Browser agents', 'Agent memory', 'Context management', 'Agent orchestration', 'Agent workflows', 'Agent observability'],
    source: 'sdet3/curriculum/17-agents/LESSON.md',
  },
  {
    id: 'm18', number: 18, title: 'MCP (Model Context Protocol) for SDETs', area: 'H', level: 'L7', skills: ['mcp'],
    summary: 'Hosts, clients and servers; tools, resources and prompts; transports; security and permissions; Playwright MCP and exposing QA tools to agents.',
    prerequisites: ['m17'], tags: ['mcp', 'tools'],
    topics: ['What MCP is', 'MCP architecture', 'MCP server', 'MCP client', 'Tools', 'Resources', 'Prompts', 'Transport', 'Security', 'Permissions', 'Context', 'How coding agents use MCP', 'How QA tools can expose MCP tools', 'Playwright/browser automation in agent workflows'],
    source: 'sdet3/curriculum/18-mcp/LESSON.md',
  },
  {
    id: 'm19', number: 19, title: 'Working with AI Coding Agents (Cursor & co.)', area: 'H', level: 'L7', skills: ['cursor'],
    summary: 'Plan vs agent mode, rules, skills, hooks, MCP, context windows, verification and human review — and the risks of AI-generated test code.',
    prerequisites: ['m17'], tags: ['cursor', 'rules', 'review'],
    topics: ['Agent mode', 'Plan mode', 'Context', 'Rules', 'Skills', 'Hooks', 'MCP', 'Tools', 'Codebase indexing', 'Context windows', 'Agent planning', 'Agent execution', 'Verification', 'Human review', 'Test generation', 'Refactoring', 'Debugging', 'Code review', 'AI-generated code risks', 'Using Cursor for automation engineering'],
    source: 'sdet3/curriculum/19-cursor/LESSON.md',
  },
  {
    id: 'm20', number: 20, title: 'QA Leadership', area: 'I', level: 'L6', skills: ['leadership', 'qaStrategy'],
    summary: 'Strategy, planning, estimation, automation ROI and roadmaps, release readiness, stakeholders, mentoring, hiring, delegation, conflict and escalation.',
    prerequisites: ['m01'], tags: ['strategy', 'people', 'roi'],
    topics: ['QA strategy', 'Test strategy', 'Test planning', 'Release planning', 'Risk management', 'Estimation', 'Capacity planning', 'Automation ROI', 'Automation roadmap', 'Quality gates', 'Release readiness', 'Defect management', 'Production quality', 'Technical debt', 'Prioritization', 'Stakeholder management', 'Cross-functional collaboration', 'Developer collaboration', 'Product manager collaboration', 'Mentoring', 'Hiring', 'Interviewing candidates', 'Delegation', 'Conflict resolution', 'Escalation', 'Ownership', 'Communication'],
    source: 'sdet3/curriculum/20-qa-leadership/LESSON.md',
  },
  {
    id: 'm21', number: 21, title: 'QA Metrics That Matter', area: 'I', level: 'L6', skills: ['metrics'],
    summary: 'Defect leakage, escape rate, flaky rate, MTTR, coverage and DORA — which metrics drive decisions and which ones mislead.',
    prerequisites: ['m20'], tags: ['kpi', 'dora'],
    topics: ['Defect leakage', 'Defect density', 'Automation percentage', 'Pass rate', 'Flaky test rate', 'MTTR', 'Test execution time', 'Regression duration', 'Escape rate', 'Coverage', 'Risk coverage', 'Quality trends', 'KPIs', 'Test coverage', 'Automation coverage', 'Useful vs misleading metrics'],
    source: 'sdet3/curriculum/21-qa-metrics/LESSON.md',
  },
  {
    id: 'm22', number: 22, title: 'System Design for SDETs', area: 'I', level: 'L5', skills: ['systemDesign'],
    summary: 'A 10-step answer structure applied to test platforms: framework, execution platform, distributed runner, reporting, test data, flaky detection and CI architecture.',
    prerequisites: ['m10', 'm11'], tags: ['design', 'scaling'],
    topics: ['Design an automation framework', 'Design a test execution platform', 'Design a distributed test runner', 'Design a test reporting system', 'Design a test data platform', 'Design a flaky-test detection system', 'Design a parallel test execution system', 'Design a CI/CD testing architecture', 'Design an API automation framework', 'Design a UI automation platform', 'Answer structure: requirements, assumptions, architecture, components, data flow, scaling, reliability, observability, security, trade-offs'],
    source: 'sdet3/curriculum/22-system-design/LESSON.md',
  },
  {
    id: 'm23', number: 23, title: 'Behavioral & Leadership Interviews (STAR)', area: 'I', level: 'L6', skills: ['behavioral'],
    summary: 'Build STAR stories from your real work — framework, flaky tests, production bugs, conflict, mentoring — with no invented details.',
    prerequisites: ['m20'], tags: ['star', 'stories'],
    topics: ['Tell me about yourself', 'Tell me about your automation framework', 'Biggest automation challenge', 'Biggest production bug', 'How did you reduce flaky tests', 'How do you decide what to automate', 'Developer disagrees with QA', 'Release with critical defects', 'Mentoring junior engineers', 'Estimating testing', 'Prioritizing under deadlines', 'Convincing management to invest in automation', 'Tell me about a failure', 'Tell me about a conflict', 'A project you led'],
    source: 'sdet3/curriculum/23-behavioral/LESSON.md',
  },
  {
    id: 'm24', number: 24, title: 'Capstone: LeaveFlow Enterprise Test Platform', area: 'I', level: 'L5', skills: ['framework', 'qaStrategy', 'cicd'],
    summary: 'A portfolio project on a realistic HRMS: strategy, risks, UI/API/DB automation in Playwright and Selenium, Docker, CI, reporting, AI-assisted and agentic testing.',
    prerequisites: ['m10', 'm11'], tags: ['portfolio', 'project'],
    topics: ['Frontend', 'REST APIs', 'Database', 'Authentication', 'Microservices', 'Async events', 'CI/CD', 'Multiple environments', 'UI automation', 'API automation', 'DB validation', 'Reporting', 'Parallel execution', 'Docker', 'Playwright', 'Selenium', 'Test strategy', 'Quality gates', 'AI-assisted testing', 'Agentic testing', 'Senior review of architecture'],
    source: 'sdet3/curriculum/24-capstone/LESSON.md',
  },
];
