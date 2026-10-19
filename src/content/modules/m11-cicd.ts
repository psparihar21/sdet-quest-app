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
          { kind: 'check', title: 'Check your understanding', questionIds: ['m11-q1', 'm11-q2'] },
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
