import { opts, type ModuleBundle } from '../bundle';
import { VIDEOS } from '../videos';
import { OUTLINE } from '../outline';

const meta = OUTLINE.find((m) => m.id === 'm17')!;

export const m17: ModuleBundle = {
  module: {
    ...meta,
    lessons: [
      {
        id: 'm17-l1',
        title: 'What an AI agent actually is',
        minutes: 30,
        sections: [
          {
            kind: 'learn',
            title: 'Chatbot vs script vs agent',
            body: `| | Automation script | Chatbot | Agent |
|---|---|---|---|
| Decides steps | You, in advance | n/a — it answers | The model, at run time |
| Acts on the world | Yes, fixed actions | No | Yes, through **tools** |
| Handles surprises | Fails | Talks about them | Observes and re-plans |
| Determinism | High | Low | Low — needs guardrails and evaluation |

**An agent = model + tools + a loop + context.**
- **Tool calling:** the model emits a structured request (name + JSON arguments matching a schema). The **harness** executes it and returns the result. The model never touches the browser directly.
- **Planning & reasoning:** decomposing the goal, choosing the next step (ReAct: reason → act → observe).
- **Context:** everything the model sees this turn — instructions, goal, tool results, history. Limited by the context window; long runs need summarisation or retrieval.
- **Memory:** within-run state, plus persistent notes across runs (files, vector stores).
- **State & environment:** the app under test, files, browser — what tools read and change.
- **Observability:** log every step, tool call, input/output, tokens, cost and latency so runs can be debugged and evaluated.
- **Human-in-the-loop:** approval for risky actions, review before merge.
- **Permissions & safety:** least privilege (allowlist tools and environments), no production credentials, sandboxed execution, limits on steps/time/cost, prompt-injection awareness (a web page can contain instructions!).
- **Evaluation:** task success rate on a fixed benchmark of tasks, number of steps, cost, harmful/unsafe actions, and reviewer acceptance of outputs.`,
          },
          { kind: 'visual', title: 'The agent loop', vizId: 'agent-loop', caption: 'Reason → act through tools → observe → repeat, with guardrails.' },
          { kind: 'video', title: 'Watch: what are AI agents?', video: VIDEOS.aiAgents },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m17-q1', 'm17-q2', 'm17-q3'] },
          { kind: 'practice', title: 'Guard an agent\'s tool calls', problemId: 'js-tool-guard' },
        ],
      },
      {
        id: 'm17-l2',
        title: 'Playwright Agents and agentic testing workflows',
        minutes: 35,
        sections: [
          {
            kind: 'learn',
            title: 'Planner, generator, healer',
            body: `Playwright (from v1.56) ships three **Test Agents**, set up with:

~~~bash
npx playwright init-agents --loop=vscode     # or --loop=claude / codex / opencode
~~~

This adds **agent definitions** (instructions + the Playwright MCP tools they may use) to your repo. Regenerate them whenever you upgrade Playwright.

| Agent | Input | Output |
|---|---|---|
| **Planner** | A goal, a **seed test** (tests/seed.spec.ts sets up fixtures/auth), optionally a PRD | A Markdown test plan in **specs/** — scenarios, steps, expected results |
| **Generator** | A spec | Playwright test files in **tests/**, with locators and assertions checked live against the app |
| **Healer** | A failing test | Replays it, inspects the current UI, proposes a fix (e.g. updated locator, extra wait condition), reruns; skips the test if it believes the feature is actually broken |

Under the hood they drive a real browser through **Playwright MCP tools** that return **accessibility snapshots** (structured text of roles and names) instead of screenshots — cheaper and more reliable for a model, and the same reason getByRole locators are robust.

**Using them responsibly:**
- The **seed test** is the quality lever: good fixtures, auth state and conventions there are copied into everything generated.
- Treat specs as reviewable artefacts — a human approves the plan before generation.
- **Review healed changes like any PR.** A healer that "fixes" a locator after a real regression hides a bug. Prefer heals that change *how* we find things, never *what* we assert.
- Run agents against **test environments only**, with test credentials and no destructive tools by default.
- Measure: plan coverage vs your risk list, generated-test acceptance rate, heal accuracy, time saved.

**Agent skills, hooks, orchestration:** coding agents load **skills** (packaged instructions/scripts for a task, e.g. "write a Playwright test in our style"), run **hooks** (commands triggered on events, e.g. run lint + tests after every edit), and can be **orchestrated** (a planner agent delegating to generator/healer sub-agents). Each is a control point for quality.`,
          },
          { kind: 'video', title: 'Watch: Playwright agents demo', video: VIDEOS.playwrightAgents },
          { kind: 'video', title: 'Watch: what agent skills are', video: VIDEOS.agentSkills },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m17-q4', 'm17-q5', 'm17-q6'] },
          {
            kind: 'build',
            title: 'Run the planner → generator → healer loop',
            task: 'In a Playwright project for a test app (or LeaveFlow), run init-agents, write a solid seed test, ask the planner for a plan of the leave-apply feature, review and edit the spec, generate tests, deliberately change a locator in the app, and let the healer fix it. Write up what you accepted, rejected and why.',
            acceptance: [
              'Seed test uses fixtures/auth state and role-based locators',
              'Spec reviewed and edited before generation',
              'Every generated test reviewed; rejected ones listed with reasons',
              'Healer change reviewed; you confirmed it did not weaken an assertion',
              'Agents only ran against a test environment with test credentials',
            ],
          },
          { kind: 'interview', title: 'Interview drill', interviewId: 'iv-m17-agents' },
        ],
      },
    ],
  },
  questions: [
    {
      id: 'm17-q1', skill: 'agents', moduleId: 'm17', type: 'mcq', difficulty: 1,
      prompt: 'What distinguishes an AI agent from a chatbot?',
      options: opts('It uses a bigger model', 'It takes actions through tools in a loop, observing results and choosing next steps toward a goal', 'It has a UI', 'It never makes mistakes'),
      answer: ['b'],
      explanation: 'Tools + loop + goal. A chatbot only responds with text.',
    },
    {
      id: 'm17-q2', skill: 'agents', moduleId: 'm17', type: 'mcq', difficulty: 2,
      prompt: 'In tool calling, who actually executes the browser click?',
      options: opts('The LLM directly', 'The harness/tool server, after the model emits a structured tool call', 'The user', 'The operating system randomly'),
      answer: ['b'],
      explanation: 'The model proposes; the harness executes — which is exactly where permissions and approvals are enforced.',
    },
    {
      id: 'm17-q3', skill: 'agents', moduleId: 'm17', type: 'multi', difficulty: 3,
      prompt: 'Sensible guardrails for a test-generation agent:',
      options: opts('Allowlist of tools and target URLs (test environments only)', 'Production admin credentials for convenience', 'Step, time and cost limits', 'Human review before merging generated or healed tests', 'Logging of every tool call'),
      answer: ['a', 'c', 'd', 'e'],
      explanation: 'Least privilege, limits, review and observability. Never production credentials.',
    },
    {
      id: 'm17-q4', skill: 'agents', moduleId: 'm17', type: 'mcq', difficulty: 2,
      prompt: 'What does the Playwright planner agent produce?',
      options: opts('Executable tests', 'A Markdown test plan in specs/ with scenarios and expected results', 'A performance report', 'A Docker image'),
      answer: ['b'],
      explanation: 'The generator turns specs into tests; the healer repairs failing tests.',
    },
    {
      id: 'm17-q5', skill: 'agents', moduleId: 'm17', type: 'scenario', difficulty: 3,
      prompt: 'The healer "fixed" a failing test by changing `expect(balance).toHaveText("3")` to `toHaveText("5")`. What do you do?',
      options: opts('Accept — the test passes now', 'Reject: the healer changed what is asserted; investigate whether the product has a balance bug', 'Disable the healer forever', 'Delete the test'),
      answer: ['b'],
      explanation: 'Healing should change how elements are found, not expected business outcomes. This may be a real regression.',
    },
    {
      id: 'm17-q6', skill: 'agents', moduleId: 'm17', type: 'mcq', difficulty: 2,
      prompt: 'Why do Playwright\'s agent tools use accessibility snapshots rather than screenshots?',
      options: opts('Screenshots are illegal', 'Structured roles/names are cheaper and more reliable for a model to reason about and map to robust locators', 'Snapshots are prettier', 'Browsers can\'t take screenshots'),
      answer: ['b'],
      explanation: 'Text structure is compact, deterministic and maps directly to getByRole locators.',
    },
  ],
  problems: [
    {
      kind: 'js', id: 'js-tool-guard', title: 'Guard an agent\'s tool calls', skill: 'agents', moduleId: 'm17', difficulty: 3,
      statement: 'Write `guard(call, policy)` for an agent harness. `call` is `{ tool, args }`; `policy` is `{ allowedTools: string[], allowedHosts: string[], needsApproval: string[] }`. Return `"deny"` if the tool isn\'t allowed, or if `args.url` exists and its **hostname** isn\'t in allowedHosts (or the URL is invalid); return `"ask"` if the tool is in needsApproval; otherwise `"allow"`. Deny wins over ask.',
      examples: [{ input: 'guard({ tool: "navigate", args: { url: "https://qa.leaveflow.test/x" } }, policy)', output: '"allow"' }],
      constraints: ['Use the URL class to parse', 'Subdomains are NOT automatically allowed'],
      functionName: 'guard',
      starter: `type Call = { tool: string; args: Record<string, unknown> };
type Policy = { allowedTools: string[]; allowedHosts: string[]; needsApproval: string[] };
function guard(call: Call, policy: Policy): 'allow' | 'ask' | 'deny' {
  return 'allow';
}`,
      tests: [
        { args: [{ tool: 'navigate', args: { url: 'https://qa.leaveflow.test/leave' } }, { allowedTools: ['navigate', 'click'], allowedHosts: ['qa.leaveflow.test'], needsApproval: [] }], expected: 'allow' },
        { args: [{ tool: 'navigate', args: { url: 'https://app.leaveflow.com' } }, { allowedTools: ['navigate'], allowedHosts: ['qa.leaveflow.test'], needsApproval: [] }], expected: 'deny' },
        { args: [{ tool: 'delete_user', args: {} }, { allowedTools: ['navigate'], allowedHosts: [], needsApproval: [] }], expected: 'deny' },
        { args: [{ tool: 'submit_form', args: {} }, { allowedTools: ['submit_form'], allowedHosts: [], needsApproval: ['submit_form'] }], expected: 'ask' },
        { args: [{ tool: 'navigate', args: { url: 'not a url' } }, { allowedTools: ['navigate'], allowedHosts: ['qa.leaveflow.test'], needsApproval: [] }], expected: 'deny', hidden: true },
        { args: [{ tool: 'navigate', args: { url: 'https://qa.leaveflow.test.evil.com/' } }, { allowedTools: ['navigate'], allowedHosts: ['qa.leaveflow.test'], needsApproval: ['navigate'] }], expected: 'deny', hidden: true, note: 'deny wins over ask; suffix tricks fail' },
      ],
      hints: ['new URL(str).hostname throws on invalid input — catch it.', 'Compare hostnames exactly, not with includes() or endsWith().'],
      solution: {
        code: `type Call = { tool: string; args: Record<string, unknown> };
type Policy = { allowedTools: string[]; allowedHosts: string[]; needsApproval: string[] };
function guard(call: Call, policy: Policy): 'allow' | 'ask' | 'deny' {
  if (!policy.allowedTools.includes(call.tool)) return 'deny';
  if (typeof call.args.url === 'string') {
    let host: string;
    try { host = new URL(call.args.url).hostname; } catch { return 'deny'; }
    if (!policy.allowedHosts.includes(host)) return 'deny';
  }
  return policy.needsApproval.includes(call.tool) ? 'ask' : 'allow';
}`,
        explanation: 'The harness enforces permissions; the model can\'t talk its way past code. Exact hostname matching blocks look-alike domains.',
        time: 'O(policy size)', space: 'O(1)',
      },
      followUps: ['Which tools in a test-generation agent would you put behind approval?', 'How do you defend against instructions hidden in a web page the agent reads?'],
    },
  ],
  interviews: [
    {
      id: 'iv-m17-agents', modes: ['ai-mcp'], skill: 'agents', level: 'L7', kind: 'technical',
      prompt: 'Explain how an AI testing agent like Playwright\'s planner/generator/healer works, and how you would use it safely in a team.',
      rubric: [
        { id: 'loop', point: 'Agent loop: model reasons, calls tools, observes', any: ['loop', 'tool call', 'observe', 'react', 'reason'] },
        { id: 'roles', point: 'Planner → spec, generator → tests, healer → fixes', any: ['planner', 'generator', 'healer', 'spec', 'plan'] },
        { id: 'mcp', point: 'Browser via MCP tools / accessibility snapshots', any: ['mcp', 'accessibility snapshot', 'snapshot', 'browser tool'] },
        { id: 'seed', point: 'Seed test/conventions drive quality', any: ['seed', 'convention', 'fixture', 'instructions'] },
        { id: 'review', point: 'Human review of plans, tests and heals', any: ['review', 'human', 'approve', 'pull request'] },
        { id: 'safety', point: 'Permissions, test envs only, no prod creds', any: ['permission', 'test environment', 'least privilege', 'credential', 'sandbox'] },
        { id: 'measure', point: 'Measure value (acceptance rate, heal accuracy, time saved)', any: ['measure', 'acceptance rate', 'metric', 'time saved', 'accuracy'] },
      ],
      structure: 'What an agent is → the three agents → how they touch the browser → team workflow with review → safety → metrics.',
      modelAnswer: '"An agent is a model in a loop with tools: it reasons about the goal, emits a tool call, the harness executes it, and the result comes back as an observation. Playwright\'s planner explores the app through Playwright MCP tools — which return accessibility snapshots, not pixels — and writes a Markdown plan in specs/. A human reviews that plan. The generator turns it into tests, verifying locators live; the healer replays failing tests and proposes fixes. In a team I\'d invest in the seed test so generated code follows our fixtures and locator rules, run agents only against test environments with test credentials, and treat every generated or healed change as a PR — in particular rejecting heals that change expected values, because that can hide real bugs. I\'d track acceptance rate, heal accuracy and time saved to decide whether it\'s worth it."',
      followUp: 'How would you build an evaluation benchmark for the healer?',
      revision: ['m17', 'm18'],
    },
  ],
  flashcards: [
    { id: 'fc-m17-1', skill: 'agents', moduleId: 'm17', front: 'Agent = ?', back: 'Model + tools + loop + context (with guardrails).' },
    { id: 'fc-m17-2', skill: 'agents', moduleId: 'm17', front: 'Playwright Test Agents', back: 'Planner (spec in specs/), generator (tests/), healer (repairs failing tests). npx playwright init-agents --loop=…' },
    { id: 'fc-m17-3', skill: 'agents', moduleId: 'm17', front: 'Red flag in a healed test', back: 'Changed expected values/assertions rather than locators or waits.' },
  ],
};
