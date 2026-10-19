# SDET Quest

An interactive, gamified learning platform for **SDET 3 / Senior SDET / QA Automation Lead / QA Lead / AI-Agentic QA** interviews. It teaches through active practice — graded questions, code and SQL that really run in your browser, interview answers with rubric feedback, and spaced revision — and tracks mastery only from assessed work.

- 24 modules · 54 lessons · 154 graded questions · 35 coding/SQL/Java problems · 41 interview questions · 81 flashcards
- 529 curriculum topics traced to content ([docs/requirements-traceability.md](docs/requirements-traceability.md))
- 18 interactive visualizations (test pyramid, HashMap buckets, race conditions, WebDriver flow, BrowserContext isolation, CI pipeline, Kafka, agent loop, MCP, sharding, …)
- 40 curated YouTube videos, each verified to exist and allow embedding
- No account, no server, no paid APIs. Everything runs client-side.

## Quick start

Requirements: Node.js 20+ (tested with Node 24) and npm.

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173. Progress is saved in your browser's local storage.

### Personalise it (optional)

Go to **Settings → Import profile pack** and choose a profile JSON file. A pack holds your CV facts (shown during behavioral practice), baseline diagnostic scores and self-ratings (they seed your weakness queue and revision schedule). See [`profile.example.json`](profile.example.json) for the format.

`profile.local.json` is git-ignored: it is for your own data and must never be committed or deployed. The public build contains no personal data (a unit test enforces this).

## What's inside

| Page | What it does |
|---|---|
| Dashboard | Recommended next step, daily quests, readiness estimates per role, weakest areas, recent performance |
| Curriculum | Search and filter 24 modules by area, level and status |
| Learning Studio | Each lesson follows Learn → Visualize → Understand → Practice → Build → Interview; answers are hidden until you attempt |
| Coding Lab | JS/TS problems run in an isolated Web Worker; SQL runs on in-browser SQLite against an HRMS dataset; Java problems are self-reviewed (not executed) |
| Interview Arena | 12 modes incl. timed "boss" mocks; one question at a time; 10-part rubric feedback; STAR story bank |
| Revision | Spaced repetition (1 → 3 → 7 → 21 → 45 → 90 days), weakness queue, previous mistakes, flashcards, mixed quizzes |
| Projects | LeaveFlow capstone: 5 phases, 18 tasks with deliverables, acceptance criteria and review checkpoints |
| Progress | Readiness by role, skill tree, mastery table, weekly practice, mock scores, achievements |
| Settings | Theme, motion, video loading, profile pack, export/restore backup, reset |

### Honest by design

- **Interview scoring is a deterministic rubric**, not AI. It looks for evidence of expected points, misconceptions, examples, trade-offs and structure, and lets you correct its checklist (raising the score by at most 3 points, marked as self-assessed).
- **Mastery comes only from graded attempts.** Reading a lesson or ticking a box does not move readiness. XP is earned once per item at your best score.
- **No streak penalties.** Missing a day costs nothing.
- **Java code does not run** in the browser; those exercises say so.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server on port 5173 |
| `npm run build` | Typecheck + production build into `dist/` |
| `npm run preview` | Serve the production build on port 4173 |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (app + config) |
| `npm test` | Vitest unit tests (logic, evaluators, sandbox, content integrity, privacy) |
| `npm run e2e` | Playwright end-to-end tests on desktop and mobile (builds and previews automatically) |
| `npm run check` | Lint + typecheck + unit tests + build |
| `npm run docs:trace` | Regenerate the requirements traceability matrix from the content |
| `npm run verify:videos` | Re-verify all YouTube videos via oEmbed |
| `npm run build:gh-pages` | Build for GitHub Pages under `/sdet-quest/` with SPA fallback |

First E2E run on a new machine: `npx playwright install chromium`.

## Documentation

- [docs/architecture.md](docs/architecture.md) — stack, data model, sandboxing, evaluation, persistence
- [docs/curriculum-roadmap.md](docs/curriculum-roadmap.md) — modules, levels, learning order, progression
- [docs/requirements-traceability.md](docs/requirements-traceability.md) — every topic → module → assessments → status
- [docs/deployment.md](docs/deployment.md) — free hosting options and a step-by-step checklist
- [docs/progress.md](docs/progress.md) — what is done, verified, partial and planned
- [docs/source-inventory.md](docs/source-inventory.md) — the source material this was built from

## Content and licensing notes

Lessons, questions, problems and visualizations are original. Videos are third-party YouTube content embedded with `youtube-nocookie.com` and loaded only on click; they remain the property of their creators.
