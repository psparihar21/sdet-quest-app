# Source inventory

What the platform was built from (inspected 2026-10-19). Paths are relative to the `Study/` folder that contains this project.

| Source | Used for | Status |
|---|---|---|
| `Cursor Pro SDET 3 + QA Lead Master Interview Preparation Prompt.md` | Primary requirements: all 30 parts → 24 modules and 529 traced topics | Fully mapped (see requirements-traceability.md) |
| `sdet3/curriculum/01…24/LESSON.md` | Seed lesson content, migrated and expanded | Migrated into `src/content/modules/` |
| `sdet3/exercises/*.md` | Problems and build tasks (e.g. checkout plan → pyramid redesign, test log parsing, test dependency order, LRU cache, thread-safe metrics) | Converted to runnable/self-review problems |
| `sdet3/assessments/round-01…15.md` | Interview Arena modes and question themes | Mapped to 12 arena modes |
| `sdet3/mock-interviews/level-*.md` | Mock interview questions | Converted to rubric-scored interview questions |
| `sdet3/templates/CALIBRATION-RESULTS.md`, `PROGRESS.md`, `WEAKNESS-QUEUE.md` | Baseline scores, readiness weightings, spaced-repetition ladder | Weightings in `lib/readiness.ts`; ladder in `lib/srs.ts`; scores in the private profile pack |
| `sdet3/templates/STAR-STORY-BANK.md` | The 15 behavioral prompts | Story Bank in the Interview Arena |
| `Interview 2026.docx` | Topic list (Java/Selenium/RestAssured/TestNG/Playwright questions) | Topics covered in M2, M5, M7, M9 |
| `CV/` (CV PDF, career knowledge base) | Learner profile | Private profile pack only — never in `src/` |
| `personaldata.zip` | Duplicate of the CV folder | Ignored |
| A résumé belonging to another person in the Study folder | — | Deliberately **not** used |

The learner-specific analysis (experience profile, gaps, interview risks) is kept in `private/learner-analysis.md`, which is git-ignored.
