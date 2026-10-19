# Architecture

## Goals that shaped it

1. Free to host, nothing to run server-side, no paid APIs → **static single-page app**.
2. Real practice, not fake interactivity → **in-browser execution** for JS/TS and SQL.
3. Honest measurement → mastery derived only from graded attempts; deterministic, explainable scoring.
4. Easy to grow → content is typed data validated by schemas and tests; persistence behind an interface.

## Stack

| Concern | Choice | Why |
|---|---|---|
| UI | React 18 + TypeScript, Vite 6 | Fast dev loop, static output, wide familiarity |
| Styling | Tailwind CSS 4 with CSS-variable design tokens | Consistent design system; dark default + light theme |
| Routing | React Router 6 (BrowserRouter, lazy routes) | Code-split pages; SPA fallback via `_redirects` / `404.html` |
| State | Zustand + `persist` | Tiny, typed, easy migrations |
| Content validation | Zod | Content mistakes fail tests, not users |
| Editor | CodeMirror 6 | Much lighter than Monaco, accessible |
| JS/TS execution | Web Worker + Sucrase (TS → JS) | Isolated thread, killable, no server |
| SQL execution | sql.js (SQLite → WebAssembly) in a Worker | Real SQL semantics in the browser |
| Markdown | react-markdown + remark-gfm, **no raw HTML** | Safe rendering of authored content |
| Tests | Vitest (unit), Playwright (E2E, desktop + mobile) | The app teaches these tools, so it uses them |

## Source layout

```
src/
  content/          types.ts (Zod schemas), outline.ts (24 modules ↔ original prompt topics),
                    modules/m01…m24 (lessons, questions, problems, interviews, flashcards),
                    videos.ts (verified), projects.ts (capstone), index.ts (parse + lookups), locate.ts
  lib/              srs.ts, mastery.ts, readiness.ts, xp.ts, weakness.ts, recommend.ts,
                    achievements.ts, arena.ts, hooks.ts, dates.ts
  lib/evaluate/     choice.ts (MCQ/multi), rubric.ts (interview answers)
  lib/sandbox/      harness.ts, js.worker.ts, runJs.ts, sql.worker.ts, runSql.ts, sqlSeed.ts, sqlCompare.ts
  store/            types.ts (data model), progress.ts (store + reducer + migrations),
                    repository.ts (persistence boundary), profilePack.ts
  viz/              StepDiagram + diagrams.ts (12 step-through diagrams), TestPyramid, HashMapBuckets, SmallViz
  components/       ui primitives, QuestionCard, ProblemWorkspace, InterviewRunner, VideoEmbed, StoryBank, Markdown
  pages/            Dashboard, Curriculum, ModulePage, LessonPage, Lab, ProblemPage, Arena, ArenaSession,
                    Revision, Projects, Progress, Settings, NotFound
tests/unit/         logic, evaluators, sandbox (runs every reference solution), store, content integrity, privacy
e2e/                learning.spec.ts, platform.spec.ts
scripts/            gen-traceability.ts, verify-videos.mjs, spa-404.mjs
```

## Data model (persisted)

`ProgressState` (`src/store/types.ts`), schema version 1:

- `attempts[]` — every graded attempt: item, type, skill, module, score 0–1, timestamp, details. **The single source of truth** for mastery, readiness, XP, analytics and achievements.
- `srs{}` — spaced-repetition card per item: ladder step, due date, lapses, reviews.
- `weaknesses{}` — queue entries from failed attempts (score < 0.6), the baseline diagnostic or self-ratings; resolved after passes on two different days (item-level) or demonstrated mastery (skill-level).
- `lessons{}` — completed steps per lesson.
- `interviews[]` — arena sessions with per-answer scores and covered rubric points.
- `stories[]`, `projectTasks{}`, `notes{}`, `bookmarks[]`, `drafts{}`, `profile`, `settings`.

### Derived values (pure functions, unit-tested)

| Value | Rule |
|---|---|
| Skill mastery | Accuracy on the **latest** attempt per item × min(1, items ÷ 6). Retrying replaces; it doesn't stack. |
| Readiness | Weighted skill mastery per role (weights from the original study tracker: SDET 3, QA Lead, AI/Agentic). Shown with evidence coverage. |
| XP | Best score per item × type weight (question 10, problem 40, interview 30, build 50, flashcard 2) + 5 per passed spaced review. Diagnostics earn nothing. |
| Revision schedule | Pass (≥ 0.7) climbs 1 → 3 → 7 → 21 → 45 → 90 days; near miss holds; fail resets to day 1 and counts a lapse. |

### Persistence and migration

The store talks to `ProgressRepository` (`src/store/repository.ts`). Today it is `localStorage` with an in-memory fallback when storage is blocked (the UI warns). `migrate()` upgrades old saves by schema version; backups are validated before restore.

**Moving to multi-user later:** implement `ProgressRepository` against an API (e.g. Supabase/Postgres with row-level security), add authentication, and sync `attempts` as an append-only log keyed by user. Because everything else is derived from attempts, the server only needs to store events.

## Execution sandboxes

- **JS/TS:** each run creates a new module Worker; network/storage globals (`fetch`, `XMLHttpRequest`, `WebSocket`, `importScripts`, `indexedDB`, …) are removed; the main thread terminates it after 2 s. Inputs are deep-cloned per test so tests can't contaminate each other. Code runs only in the learner's own browser, with the same privileges as typing it into DevTools — there is no server to attack.
- **SQL:** a Worker loads sql.js, builds a fresh copy of the seed DB per run, runs the learner query and the reference query, and compares result sets by value (column names ignored, order only when the problem requires it). 4 s timeout.
- **Java:** not executed. Exercises are code-reading/self-review with a checklist and a reference solution.

## Interview evaluation

`lib/evaluate/rubric.ts` scores free text against each question's rubric: phrase evidence with simple inflections for each expected point (technical score), red-flag phrases (misconceptions), examples/trade-off/structure signals (depth), sentence structure and STAR markers (communication), and a seniority signal. The learner can correct the detected checklist; corrections raise the score by at most 3 and are stored as self-assessed. This is transparent and cheap, but it does not understand meaning — the UI says so wherever scores appear. A bring-your-own-key LLM grader is a roadmap item.

## Security and privacy

- No backend, accounts, analytics or third-party scripts. YouTube iframes load only after a click (`youtube-nocookie.com`), or automatically if the learner opts in.
- Markdown is rendered without raw HTML; user-entered text is rendered as text.
- Personal data lives in a git-ignored profile pack imported into the learner's own browser; `tests/unit/privacy-and-profile.test.ts` fails the build if personal identifiers appear in `src/`.
- No secrets are needed; `.env.example` documents the only optional variable (`VITE_BASE_PATH`).

## Accessibility and motion

Keyboard-reachable controls with visible focus rings, skip link, landmarks, labelled form controls, ARIA radio/checkbox roles on answer options, `aria-live` feedback, progress bars with values, accessible names on icon buttons. Animations respect `prefers-reduced-motion` unless the learner overrides it in Settings; step-through diagrams have play/pause/step/replay controls.

## Known technical limitations

- The main bundle (~215 kB gzip) includes all lesson content; splitting content per module is a future optimisation.
- Local storage is per browser and device; there is no sync.
- Keyword-based traceability and rubric scoring are approximations (documented where shown).
