# Progress report

_Last updated 2026-10-28._

## Quality pass (2026-10-28)

Three independent audits (React/TypeScript logic, security, WCAG 2.2 accessibility) plus a browser pass and user-reported screenshots. Fixed:

- **Scoring integrity:** re-answering early no longer climbs the revision ladder or earns review XP; "Try again" is practice and isn't graded; interview self-corrections rescore the same attempt instead of logging a second one; partially passing code (e.g. 4/5 tests) no longer counts as correct; build tasks need at least one ticked criterion; weakness pass-tracking no longer gets stuck after a same-day miss.
- **Learning flow:** "Finish lesson" sends you to skipped steps instead of silently doing nothing; check and practice steps remember earlier answers; keyboard focus moves to each new step; the mixed quiz no longer reshuffles while you read; correct answers stay visible in "Previous mistakes"; revision can't get stuck on removed content; only finished mock interviews count in averages.
- **Security:** CSP and security headers (`public/_headers`), with the code-sandbox workers isolated under their own no-network CSP; prototype-chain API stripping in the JS worker; all saved progress, backups and profile packs validated on load, with corrupted data set aside instead of crashing; storage-full warning; production dependencies upgraded (react-router 7, zod 4): `npm audit --omit=dev` reports 0 vulnerabilities.
- **Accessibility:** contrast fixes for faint text and light-theme accent buttons; native modal dialog for the mobile menu (focus trap, Escape, focus return); arrow-key radio groups and tabs; focus moves to feedback after answering and to the page on navigation; visible focus on editor and settings; screen-reader text for correct/incorrect marks and badges.
- **Interviewer follow-ups:** every follow-up question (quizzes and all 49 interview questions) now has a model answer, revealed on demand with "Think it through, then show a strong answer". A content test fails if one is missing.
- **Answer-mode cue:** questions show a coloured "One answer" or "Multiple answers" pill and a one-line instruction above the options; multi-select options use tick boxes.
- **Responsive layout:** new `e2e/layout.spec.ts` checks 17 pages at 375, 768, 1024, 1440 and 1920 px for sideways overflow; the lesson step rail stays horizontal below 1280 px so content isn't squeezed, and Bookmark/Notes are now available on phones.
- **UI (from screenshots):** code blocks no longer turn `=>` into `⇒` (ligatures off) and wrap long lines; content aligns with the sidebar on wide screens; multi-select options show a tick.

## Verification results (run locally, Windows 11, Node 24.20)

| Check | Command | Result |
|---|---|---|
| Lint | `npm run lint` | Pass, 0 warnings |
| Typecheck | `npm run typecheck` | Pass |
| Unit tests | `npm test` | **107 passed** (logic, evaluators, scoring regressions, every JS and SQL reference solution, store validation, security headers, profile packs, content integrity, privacy) |
| Production build | `npm run build` | Pass (main bundle ≈ 215 kB gzip) |
| GitHub Pages build | `npm run build:gh-pages` | Pass |
| E2E | `npm run e2e` | **48 passed, 6 skipped** (desktop 1280×800 and Pixel 7 mobile, plus layout checks at five widths; desktop 1280×800 and Pixel 7 mobile; adds corrupted-storage recovery and mobile-menu Escape/focus) |
| Fresh install | clean copy → `npm ci` → `npm run check` | Pass |
| Videos | `npm run verify:videos` | 40/40 available and embeddable |
| Manual browser check | dev server | Dashboard, lesson 1 (pyramid visual, quiz feedback), JS and SQL execution, interview feedback, persistence after reload |

E2E scenarios cover: start-here path, wrong answer → weakness queue → survives reload → previous mistakes, multi-select partial credit, JS sandbox pass/fail, infinite-loop timeout, SQL check fail/pass, interview feedback hidden until submit, lesson progress persistence, curriculum search, navigation to every page, theme persistence + 404, no horizontal overflow on 8 pages, reduced motion, profile-pack import (valid and invalid), full arena round with results, STAR story persistence, project task persistence, backup export, and every module's first lesson rendering without errors.

## Definition of done — MVP

| Criterion | Status |
|---|---|
| Existing files and CV inspected | Done (docs/source-inventory.md; private analysis) |
| Complete curriculum mapped to requirements | Done — 529 topics: 529 covered, 0 partial, 0 gaps (keyword-verified) |
| Personalised from CV evidence | Done via private profile pack (diagnostic seeds, CV facts in behavioral prompts) |
| Dashboard and curriculum navigation | Done, E2E-tested |
| Meaningful original lessons | Done — 54 lessons, 256 steps |
| At least one educational animation | Done — 18 (6 bespoke interactive + 12 step-through) |
| At least one verified YouTube video | Done — 40 verified |
| Assessments evaluate answers correctly | Done, unit + E2E tested |
| Progress persists across refresh | Done, E2E-tested |
| Weakness tracking / revision | Done, unit + E2E tested |
| Interview exercise with meaningful feedback | Done — 49 questions, 12 modes, 10-part feedback |
| Responsive and accessible | Done for tested widths; keyboard and screen-reader labels; reduced motion. No formal audit (axe/screen reader) yet |
| Automated tests for critical journeys | Done |
| Production build succeeds | Done |
| Setup, testing, deployment docs | Done |
| Limitations reported | This file + architecture.md |

## Full-product criteria

| Criterion | Status |
|---|---|
| Every in-scope topic accounted for | Done (traceability matrix) |
| All major learning modes | Done: lessons, visuals, videos, MCQ/multi/TF/predict/debug/scenario questions, runnable JS & SQL, Java self-review, build tasks, interview arena, flashcards, mixed quizzes |
| Enterprise project path usable | Done (Projects page, 18 tasks) — the LeaveFlow app itself is for the learner to build |
| Mock interview engine covers planned categories | Done (12 modes; every mode has 4+ questions; Java and AI/MCP are thinnest at 4) |
| Analytics from real stored data | Done |
| Public multi-user deployment | Not built — static per-browser use is supported; accounts/sync documented as future work |
| No feature falsely represented | Scoring method, Java non-execution, self-assessment and estimates are labelled in the UI |

## Partial / known limitations

- **Interview scoring** is keyword/rubric-based. A short answer stuffed with the right phrases can score well; the learner-correction step is self-assessed. An optional BYO-key LLM grader is planned.
- **Java** exercises are not executed (checklist + reference solution).
- **Build tasks** and project tasks are self-assessed.
- **Videos** were verified to exist and match their topic by title/channel; they were not watched end to end.
- **Accessibility:** no automated axe scan or screen-reader session yet.
- **Bundle:** all content ships in the main chunk; per-module splitting would speed first load.
- **Progress is per browser/device**; export backups to move it.
- **Not deployed.** No hosting account was used; see deployment.md.
- **Not committed.** A git repository is initialised with nothing committed yet.

## Next steps

1. Import `profile.local.json` in Settings and follow the suggested order in curriculum-roadmap.md (start with M1 lesson 1).
2. Commit the project (check `git status` first — `profile.local.json` and `private/` are ignored) and push to a new GitHub repo.
3. Deploy to Cloudflare Pages following docs/deployment.md, then run the post-deploy checklist.
4. Content: add more Java problems with a downloadable JUnit project; add Java and AI/MCP arena questions (4 each today).
5. Quality: add an axe accessibility check to the E2E suite; split content per module.
6. Optional: BYO-key LLM grading for interview answers (clearly labelled, off by default).
