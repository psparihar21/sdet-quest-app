import { opts, type ModuleBundle } from '../bundle';
import { VIDEOS } from '../videos';
import { OUTLINE } from '../outline';

const meta = OUTLINE.find((m) => m.id === 'm11')!;

export const m11: ModuleBundle = {
  module: {
    ...meta,
    lessons: [
      {
        id: 'm11-l1',
        title: 'Git, reviews and pipeline stages',
        minutes: 30,
        sections: [
          {
            kind: 'learn',
            title: 'Branching and pull requests',
            body: `**Trunk-based development:** short-lived branches merged to main daily, behind feature flags if unfinished. Needs fast, reliable PR checks — which is exactly the SDET's job.
**GitFlow:** long-lived develop/release/hotfix branches. Slower, more merge pain; still common with scheduled releases.

**A good PR (and test-code review checklist):** small, one purpose; tests at the right level; no sleeps; no hard-coded data or secrets; readable names; failure messages that explain themselves; CI green.

**Maven lifecycle** (Java): validate → compile → test (surefire, unit) → package → verify (failsafe, integration) → install → deploy. \`mvn verify -Dgroups=smoke -Denv=qa\`.

**Pipeline stages (typical):**

| Stage | Runs | Budget |
|---|---|---|
| Build + unit + lint | Every push | < 5 min |
| API + contract + security scans | Every PR, in parallel | < 10 min |
| Quality gate | Blocks merge | — |
| Deploy to staging | On merge | — |
| E2E (sharded) + perf smoke | Against staging | < 20 min |
| Deploy to prod (canary) | Approval / automatic | — |
| Post-deploy smoke + synthetic monitoring | Immediately after | < 5 min, rollback on failure |
| Nightly full regression, cross-browser | Scheduled | hours OK |`,
          },
          { kind: 'visual', title: 'A CI/CD testing pipeline', vizId: 'ci-pipeline', caption: 'Step through stages, gates and reports.' },
          {
            kind: 'learn',
            title: 'GitHub vs GitLab, branching strategies and environment management',
            body: `**GitHub/GitLab — same ideas, different words:**

| Concept | GitHub | GitLab |
|---|---|---|
| Code review | Pull request | Merge request |
| Pipeline file | \`.github/workflows/*.yml\` | \`.gitlab-ci.yml\` |
| Execution | Jobs on runners, \`needs\` | Stages + jobs on runners, \`needs\` for DAG |
| Parallel split | \`strategy.matrix\` | \`parallel: 4\` / \`parallel:matrix\` |
| Reports | Artifacts + checks | \`artifacts:reports:junit\` shown in the MR |
| Gates | Required status checks, rulesets | Protected branches, "pipelines must succeed" |
| Environments | \`environment:\` with protection rules | \`environment:\` with review apps and deployment approvals |

~~~yaml
# .gitlab-ci.yml
stages: [test, e2e]
api:
  stage: test
  script: [mvn -B verify -Dgroups=api]
  artifacts: { when: always, reports: { junit: target/failsafe-reports/*.xml } }
e2e:
  stage: e2e
  # pin the image tag to the exact @playwright/test version in package-lock.json,
  # otherwise the bundled browsers won't match and tests fail to launch
  image: mcr.microsoft.com/playwright:v1.56.0-noble
  parallel: 4
  script: [npm ci, npx playwright test --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL]
~~~

**Branching strategies** and what each means for testing:
- **Trunk-based** — tiny branches, merge daily, feature flags. Testing must be fast and trustworthy on every PR; test both flag states.
- **GitHub flow** — feature branch → PR → main → deploy. Same as trunk-based with slightly longer branches.
- **GitFlow** — develop, release, hotfix branches. Regression runs on the release branch; hotfixes need a quick targeted suite and must be merged back.
- **Release branches** (for mobile/on-prem) — stabilise and test a cut while main moves on; cherry-picks need re-testing.

**Environment management:** define environments (dev, QA, staging, prod-like, ephemeral **per-PR preview environments**) as code (Docker Compose, Helm values, Terraform). Tests read the target from config (\`BASE_URL\`, \`ENV=staging\`), never hard-coded. Keep test data seeded per environment, secrets per environment in the secret store, version/health checks before a run ("is staging on the build I think?"), and a booking/ownership rule for shared environments so two teams don't deploy over each other's test run.`,
          },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m11-q1', 'm11-q2', 'm11-q7'] },
        ],
      },
      {
        id: 'm11-l2',
        title: 'GitHub Actions, Jenkins, Docker, Kubernetes, Helm',
        minutes: 35,
        sections: [
          {
            kind: 'learn',
            title: 'A real GitHub Actions workflow',
            body: `~~~yaml
name: e2e
on: [pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix: { shard: [1, 2, 3, 4] }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test --shard=\${{ matrix.shard }}/4
        env:
          BASE_URL: \${{ vars.STAGING_URL }}
          MANAGER_PASSWORD: \${{ secrets.MANAGER_PASSWORD }}   # never echo secrets
      - uses: actions/upload-artifact@v4
        if: \${{ !cancelled() }}
        with: { name: blob-\${{ matrix.shard }}, path: blob-report, retention-days: 7 }
  report:
    needs: e2e
    if: \${{ !cancelled() }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with: { pattern: blob-*, path: all-blobs, merge-multiple: true }
      - run: npx playwright merge-reports --reporter html ./all-blobs
~~~

Concepts: **workflow → jobs → steps**, runners, **matrix** for parallel jobs, **needs** for ordering, **secrets** and **vars**, **artifacts** for reports, \`schedule:\` with cron for nightly runs, \`workflow_dispatch\` for manual runs, required status checks for gates.

**Jenkins:** declarative Jenkinsfile with \`stages\`, \`parallel\`, \`post { always { junit 'target/surefire-reports/*.xml' } }\`, credentials via \`withCredentials\`. Agents/labels instead of runners.

**Docker:** an **image** is a packaged filesystem + command; a **container** is a running instance. Tests in containers run the same everywhere (\`mcr.microsoft.com/playwright\`, \`selenium/standalone-chrome\`). docker-compose spins up the app + DB + Grid for a test run.

**Kubernetes:** pods (containers), deployments (desired replicas), services (stable networking), namespaces (isolate environments), config maps and secrets. **Helm** packages K8s manifests as versioned charts with values per environment — handy for ephemeral test environments per PR.

**Failure notifications:** route to the owning team's channel with the failing tests, trace links and the commit — not @channel for everyone.`,
          },
          { kind: 'video', title: 'Watch: GitHub Actions basics', video: VIDEOS.githubActions },
          { kind: 'video', title: 'Watch: Docker in 100 seconds', video: VIDEOS.docker },
          { kind: 'video', title: 'Watch: Kubernetes in 100 seconds', video: VIDEOS.kubernetes },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m11-q3', 'm11-q4', 'm11-q5', 'm11-q6'] },
          {
            kind: 'build',
            title: 'Design the LeaveFlow pipeline',
            task: 'Write the GitHub Actions (or Jenkins) design for LeaveFlow: stages, what runs in each, parallelism, gates, secrets handling, artifacts, notifications, scheduled runs and post-deploy validation with rollback criteria.',
            acceptance: [
              'PR stage under 15 minutes with explicit budget per job',
              'Quality gate criteria written down',
              'Secrets only from the secret store, masked',
              'Artifacts: HTML report, traces, JUnit',
              'Post-deploy smoke with automatic rollback rule',
              'Nightly regression with failure routing to owners',
            ],
          },
          { kind: 'interview', title: 'Interview drill', interviewId: 'iv-m11-pipeline' },
        ],
      },
    ],
  },
  questions: [
    {
      id: 'm11-q7', skill: 'cicd', moduleId: 'm11', type: 'mcq', difficulty: 2,
      prompt: 'Two teams keep breaking each other\'s test runs on one shared staging environment. Which change addresses the root cause?',
      options: opts('Add retries to all tests', 'Ephemeral per-PR environments created from the same Helm/Compose definitions, plus a health/version check before each run', 'Run tests only at night', 'Hard-code the staging URL in every test'),
      answer: ['b'],
      explanation: 'Environment management as code lets each change get an isolated, identical environment; the pre-run check catches "wrong build" surprises.',
    },
    {
      id: 'm11-q1', skill: 'cicd', moduleId: 'm11', type: 'mcq', difficulty: 2,
      prompt: 'Trunk-based development depends most on…',
      options: opts('Long-lived release branches', 'Fast, reliable automated checks on every PR plus feature flags', 'Manual regression before every merge', 'Weekly merges'),
      answer: ['b'],
      explanation: 'Merging small changes daily is only safe if the pipeline catches breakage quickly.',
    },
    {
      id: 'm11-q2', skill: 'cicd', moduleId: 'm11', type: 'mcq', difficulty: 2,
      prompt: 'In Maven, where do integration tests usually run?',
      options: opts('compile, via surefire', 'verify, via failsafe', 'package', 'clean'),
      answer: ['b'],
      explanation: 'Surefire runs unit tests in the test phase; failsafe runs integration tests in integration-test/verify so cleanup still happens.',
    },
    {
      id: 'm11-q3', skill: 'cicd', moduleId: 'm11', type: 'mcq', difficulty: 2,
      prompt: 'How do you run one Playwright suite on 4 GitHub Actions machines?',
      options: opts('workers: 4 in config', 'A matrix of shard values with --shard=${{ matrix.shard }}/4, then merge reports', 'Four separate repositories', 'Use Jenkins instead'),
      answer: ['b'],
      explanation: 'Matrix jobs run in parallel on separate runners; each runs its shard.',
    },
    {
      id: 'm11-q4', skill: 'devops', moduleId: 'm11', type: 'mcq', difficulty: 1,
      prompt: 'Image vs container?',
      options: opts('Same thing', 'Image = packaged template; container = running instance of an image', 'Container = template; image = running process', 'Images only exist in Kubernetes'),
      answer: ['b'],
      explanation: 'You can start many containers from one image.',
    },
    {
      id: 'm11-q5', skill: 'devops', moduleId: 'm11', type: 'mcq', difficulty: 2,
      prompt: 'What is Helm used for?',
      options: opts('Running unit tests', 'Packaging and templating Kubernetes manifests as versioned charts with per-environment values', 'Building Docker images', 'Monitoring CPU'),
      answer: ['b'],
      explanation: 'One chart, different values files for QA/staging/prod — and for ephemeral PR environments.',
    },
    {
      id: 'm11-q6', skill: 'cicd', moduleId: 'm11', type: 'multi', difficulty: 2,
      prompt: 'Good CI practices for test secrets:',
      options: opts('Store them in the CI secret store', 'Echo them in logs for debugging', 'Use separate, least-privilege test accounts', 'Commit a .env file for convenience', 'Rotate them periodically'),
      answer: ['a', 'c', 'e'],
      explanation: 'Secrets must never reach logs or git; test accounts should only be able to touch test data.',
    },
  ],
  problems: [],
  interviews: [
    {
      id: 'iv-m11-slow-pipeline', modes: ['cicd', 'full-sdet3', 'qa-lead'], skill: 'cicd', level: 'L4', kind: 'scenario',
      prompt: 'PR checks take 45 minutes and developers are batching changes to avoid them. How do you bring feedback under 15 minutes without losing confidence?',
      rubric: [
        { id: 'measure', point: 'Measures first: where the time goes per stage and per test', any: ['measure', 'profile', 'data', 'slowest', 'breakdown', 'duration'] },
        { id: 'parallel', point: 'Parallelism and sharding across machines', any: ['parallel', 'shard', 'matrix', 'workers'] },
        { id: 'cache', point: 'Caching dependencies, builds and browser images', any: ['cache', 'caching', 'docker layer', 'prebuilt image'] },
        { id: 'pyramid', point: 'Pushes coverage down: API/component tests instead of slow E2E', any: ['pyramid', 'api test', 'component test', 'push down', 'lower level', 'unit'] },
        { id: 'tia', point: 'Runs the right subset: test impact analysis, tags, smoke on PR and full regression later', any: ['impact analysis', 'affected', 'changed files', 'smoke', 'subset', 'tag', 'nightly'] },
        { id: 'flaky', point: 'Removes retries/waits hiding slowness; quarantines flaky tests', any: ['flaky', 'quarantine', 'retry', 'sleep', 'wait'] },
      ],
      redFlags: [{ any: ['delete the e2e tests', 'skip tests', 'make them optional'], note: 'Cutting coverage without replacing it trades speed for escaped defects.' }],
      structure: 'Measure → quick wins (parallel, cache) → structural fixes (pyramid, selection) → guardrails and a time budget.',
      modelAnswer: '"First I measure: stage timings from the CI API and the slowest 20 tests. Quick wins usually come from caching npm/Maven and browser images, running independent jobs in parallel, and sharding E2E across four machines with merged reports. Then structural fixes: replace E2E tests that only check validation or API rules with API or component tests, and run only a tagged smoke set plus tests affected by the changed files on each PR, with the full regression on merge and nightly. I remove fixed sleeps and blanket retries that silently add minutes, and quarantine flaky tests with owners. Finally I set a time budget per stage and alert when the PR pipeline exceeds 15 minutes, so it doesn\'t creep back."',
      followUp: 'Test impact analysis misses a regression once. How do you keep trust in the selective approach?',
      revision: ['m11', 'm10'],
    },
    {
      id: 'iv-m11-branching', modes: ['cicd', 'full-sdet3'], skill: 'cicd', level: 'L4', kind: 'technical',
      prompt: 'Your team is moving from GitFlow to trunk-based development. What changes for testing and the pipeline?',
      rubric: [
        { id: 'fast', point: 'Every merge to main must be releasable: fast, reliable PR checks are mandatory', any: ['every merge', 'releasable', 'fast', 'reliable', 'required check'] },
        { id: 'flags', point: 'Feature flags for unfinished work; test both flag states and flag clean-up', any: ['feature flag', 'flag', 'toggle'] },
        { id: 'regression', point: 'Regression moves from a release-branch phase to continuous runs on main', any: ['continuous', 'on main', 'release branch', 'regression', 'nightly'] },
        { id: 'small', point: 'Small, frequent changes; tests written in the same PR', any: ['small', 'frequent', 'same pr', 'same pull request', 'daily'] },
        { id: 'safety', point: 'Production safety nets: canary, monitoring, quick rollback', any: ['canary', 'rollback', 'monitor', 'observability', 'dark launch'] },
      ],
      structure: 'What trunk-based demands → pipeline changes → flags → release safety → team habits.',
      modelAnswer: '"With GitFlow we could stabilise on a release branch; with trunk-based, main must be releasable after every merge, so PR checks become the real quality gate — fast, required and not flaky. Unfinished features hide behind feature flags, so we test both flag states for risky flags and track flag removal as debt. Regression no longer happens in a release phase: it runs continuously on main and nightly. Developers merge small changes at least daily with tests in the same PR, and I\'d add production safety nets — canary releases, monitoring on key journeys and one-click rollback — because some issues will only show up in production."',
      followUp: 'How do you test a feature flag that has 4 variants across 3 services?',
      revision: ['m11', 'm20'],
    },
    {
      id: 'iv-m11-environments', modes: ['cicd', 'full-sdet3', 'system-design'], skill: 'devops', level: 'L4', kind: 'design',
      prompt: 'Tests pass on QA but fail on staging, and nobody is sure which build each environment runs. How would you set up environment management for testing?',
      rubric: [
        { id: 'iac', point: 'Environments defined as code (Docker Compose, Helm, Terraform) so they are reproducible', any: ['as code', 'helm', 'terraform', 'compose', 'infrastructure as code', 'iac'] },
        { id: 'version', point: 'Version/health check before tests run; build info exposed by the app', any: ['version', 'health check', 'build number', 'commit sha', 'endpoint'] },
        { id: 'config', point: 'Configuration and secrets per environment, nothing hard-coded in tests', any: ['config', 'environment variable', 'secret', 'base url', 'hard coded'] },
        { id: 'data', point: 'Test data seeded per environment, independent of what is already there', any: ['seed', 'test data', 'fixture', 'reset'] },
        { id: 'ephemeral', point: 'Ephemeral per-PR environments; ownership/booking of shared ones', any: ['ephemeral', 'per pr', 'preview', 'review app', 'owner', 'booking'] },
        { id: 'drift', point: 'Detects drift between environments (versions, config, feature flags)', any: ['drift', 'diff', 'parity', 'feature flag', 'mismatch'] },
      ],
      structure: 'Reproducible environments → know what is deployed → config/secrets/data → isolation → drift detection.',
      modelAnswer: '"I\'d make environments reproducible by defining them as code — Helm values or Compose files per environment — so QA and staging differ only in declared values. Every service exposes a version endpoint with the commit SHA, and the pipeline checks it before running tests, failing fast with \'staging is on build 412, expected 415\'. Tests read the base URL and credentials from environment config and the secret store, never hard-coded, and seed their own data. For PRs we spin up ephemeral preview environments; shared ones get an owner and a booking rule. Finally a nightly job diffs versions, config and feature flags between QA and staging, because most \'passes on QA, fails on staging\' bugs are drift."',
      followUp: 'Ephemeral environments are too expensive for every PR. What compromise do you propose?',
      revision: ['m11', 'm22'],
    },
    {
      id: 'iv-m11-pipeline', modes: ['cicd', 'full-sdet3', 'system-design'], skill: 'cicd', level: 'L4', kind: 'design',
      prompt: 'Design a CI/CD pipeline with testing for a microservices product deploying several times a day. Where do which tests run, and what blocks a release?',
      rubric: [
        { id: 'stages', point: 'Clear stages from PR to production', any: ['stage', 'pull request', 'pr', 'merge', 'staging', 'production'] },
        { id: 'fast', point: 'Fast PR feedback with time budgets', any: ['minutes', 'fast', 'budget', 'quick'] },
        { id: 'levels', point: 'Right tests per stage (unit, contract, API, E2E, perf, security)', any: ['unit', 'contract', 'api', 'e2e', 'performance', 'security'] },
        { id: 'gates', point: 'Explicit quality gates', any: ['gate', 'block', 'required check', 'criteria'] },
        { id: 'parallel', point: 'Parallelism/sharding and artifacts', any: ['parallel', 'shard', 'matrix', 'artifact', 'report'] },
        { id: 'deploy', point: 'Post-deploy validation, canary, rollback', any: ['canary', 'rollback', 'smoke', 'post deploy', 'monitor', 'feature flag'] },
        { id: 'ownership', point: 'Failure routing/ownership', any: ['owner', 'notify', 'notification', 'team', 'slack'] },
      ],
      structure: 'Principles → stage-by-stage table → gates → deployment safety → observability and ownership.',
      modelAnswer: '"Principle: fail fast and cheap, then add depth. On every PR: build, unit tests, lint and dependency scan, then contract tests and the service\'s API suite in parallel — under 10 minutes, all required checks. Merge deploys to staging, where sharded Playwright journeys and a short k6 perf smoke run; failures block promotion. Production deploys go canary-first with post-deploy smoke and synthetic checks; error-rate or latency regressions trigger automatic rollback. Nightly runs full regression across browsers. Reports, traces and JUnit go up as artifacts; failures notify the owning squad with links. Gates: all required checks green, no open P0/P1, perf within budget."',
      followUp: 'The E2E stage takes 40 minutes and blocks every deploy. What do you change?',
      revision: ['m11', 'm22'],
    },
    {
      id: 'iv-m11-red-build', modes: ['cicd', 'qa-lead', 'full-sdet3'], skill: 'cicd', level: 'L4', kind: 'scenario',
      prompt: 'The main branch has been red for two days because of failing E2E tests, and developers have started ignoring it. What do you do?',
      rubric: [
        { id: 'stop', point: 'Treat red main as an incident; restore signal fast', any: ['stop the line', 'priority', 'incident', 'immediately', 'first'] },
        { id: 'triage', point: 'Triage: product bug vs test vs environment vs flaky', any: ['triage', 'product bug', 'environment', 'flaky', 'test bug', 'classify'] },
        { id: 'quar', point: 'Revert or quarantine to restore green, with owners', any: ['quarantine', 'revert', 'owner', 'disable'] },
        { id: 'comm', point: 'Communicates status and ownership', any: ['communicat', 'announce', 'channel', 'update', 'notify'] },
        { id: 'prevent', point: 'Prevents recurrence: required checks, flaky policy, root cause', any: ['prevent', 'required check', 'policy', 'gate', 'branch protection', 'root cause'] },
      ],
      structure: 'Restore signal now → triage → communicate → prevent recurrence.',
      modelAnswer: '"A red main that people ignore means we have no safety net, so it becomes my top priority. I triage every failure within hours: real product bugs get a revert or a fix owner; broken tests and environment issues get fixed or quarantined with an owner and a deadline, so main is green and meaningful again. I post a short status in the team channel saying who owns what. Then prevention: make the E2E stage a required check so it can\'t stay red silently, enforce the flaky quarantine policy, route failures to owning teams automatically, and look at why faster checks didn\'t catch these earlier."',
      followUp: 'A developer reverts your quarantine because they think the test is useless. How do you handle it?',
      revision: ['m11', 'm10'],
    },
    {
      id: 'iv-m11-docker', modes: ['cicd', 'full-sdet3'], skill: 'devops', level: 'L3', kind: 'technical',
      prompt: 'Why would you run your test suite inside Docker containers in CI, and what problems does that solve or create?',
      rubric: [
        { id: 'repro', point: 'Reproducible, identical environment locally and in CI', any: ['reproduc', 'same environment', 'consistent', 'works on my machine'] },
        { id: 'deps', point: 'Pinned browsers, dependencies and versions', any: ['version', 'pinned', 'browser', 'dependenc', 'image'] },
        { id: 'scale', point: 'Easy parallel scaling (Grid, compose, Kubernetes)', any: ['parallel', 'scale', 'grid', 'compose', 'kubernetes'] },
        { id: 'isol', point: 'Isolation and clean state per run', any: ['isolat', 'clean', 'fresh', 'ephemeral'] },
        { id: 'cons', point: 'Costs: image size, startup, debugging, resource limits', any: ['image size', 'startup', 'slow', 'debug', 'memory', 'shm', 'resource'] },
      ],
      structure: 'Benefits → how you set it up → downsides and mitigations.',
      modelAnswer: '"Containers give every run the same OS, browsers and dependencies, pinned by image version, so a CI failure reproduces locally with one command. Each run starts clean, and docker-compose can bring up the app, database and a Selenium Grid together; on Kubernetes we scale workers horizontally. Downsides: large images and startup time — cache layers and use the official Playwright or Selenium images; browsers need enough shared memory or they crash; and debugging inside containers needs traces, videos and logs exported as artifacts."',
      followUp: 'Chrome keeps crashing only inside the container. What do you check?',
      revision: ['m11'],
    },
  ],
  flashcards: [
    { id: 'fc-m11-1', skill: 'cicd', moduleId: 'm11', front: 'GitHub Actions building blocks', back: 'Workflow → jobs (runners, matrix, needs) → steps; secrets, vars, artifacts, schedule.' },
    { id: 'fc-m11-2', skill: 'devops', moduleId: 'm11', front: 'Pod / Deployment / Service', back: 'Running containers / desired replicas & rollout / stable network endpoint.' },
    { id: 'fc-m11-3', skill: 'cicd', moduleId: 'm11', front: 'Surefire vs failsafe', back: 'Surefire: unit tests in test phase. Failsafe: integration tests in verify.' },
  ],
};
