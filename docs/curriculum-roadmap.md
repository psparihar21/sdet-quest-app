# Curriculum roadmap

24 modules map 1:1 to the parts of the original mentor prompt, grouped into nine areas and eight interview levels. Every module has lessons, graded questions, interview questions and flashcards; most have coding/SQL problems, visualizations and build tasks.

## Levels

| Level | Meaning | Gate (suggested) |
|---|---|---|
| L1 | SDET fundamentals | M1 questions ≥ 70% and the pyramid interview ≥ 6/10 |
| L2 | SDET automation | M2–M5, M9 core questions ≥ 70% |
| L3 | Senior SDET | M6, M7 + API/automation arena rounds ≥ 6 |
| L4 | SDET 3 | Framework whiteboard (M10 build) + CI/CD + full SDET 3 boss ≥ 7 |
| L5 | Automation Architect | M22 design rounds ≥ 7 |
| L6 | QA Lead | M20, M21, M23 + full QA Lead boss ≥ 7 |
| L7 | AI/Agentic QA | M16–M19 + AI & MCP arena ≥ 7 |
| L8 | Principal | Org-wide strategy and platform design (roadmap) |

Locks in the app are **recommendations**, never hard blocks — you can open anything. Readiness, not completion, decides whether you are ready.

## Modules

| # | Module | Area | Level | Highlights |
|---|---|---|---|---|
| 1 | Testing fundamentals & QA Lead mindset | A | L1 | Interactive pyramid, risk matrix, defect lifecycle, BVA problem |
| 2 | Java for SDETs | B | L2 | JS→Java bridge, HashMap & stack/heap & race-condition visuals, LRU cache (runs), Java self-review problems |
| 3 | DSA for SDET interviews | B | L2 | 12 runnable problems: hashing, windows, stacks, binary search, topological sort, prefix sums |
| 4 | SQL & database validation | E | L2 | Real SQLite on an HRMS dataset; joins visual; reconciliation query finds seeded bugs |
| 5 | Selenium WebDriver | C | L2 | Protocol flow, locators, waits & exceptions, frames/windows/shadow DOM, Grid |
| 6 | Production Selenium framework | C | L3 | Layers, ThreadLocal, retries done right, design-it-yourself build task |
| 7 | Playwright deep dive (TS) | D | L3 | Contexts, locators, fixtures, auth state, mocking, API testing, sharding, traces |
| 8 | Selenium vs Playwright | D | L4 | Senior comparison, migration strategy, your migration story |
| 9 | API testing & frameworks | E | L2 | HTTP lifecycle visual, 401/403/201, JWT problem, pagination, contracts |
| 10 | Framework architecture | C | L4 | Patterns, flaky-test process + detector problem, company-wide design |
| 11 | CI/CD & DevOps | F | L4 | Pipeline visual, GitHub Actions sharding, Docker/K8s/Helm |
| 12 | Performance | G | L4 | Test types, percentiles problem, JMeter, strategy |
| 13 | Security | G | L4 | OWASP Top 10, authorization matrix generator, IDOR |
| 14 | Mobile | G | L3 | Appium 2 architecture, hybrid contexts, device strategy |
| 15 | Distributed systems | H | L4 | Kafka visual, eventual consistency, idempotent consumer problem |
| 16 | AI for testing & testing AI | H | L7 | LLM eval harness problem, RAG risks, guardrails, model regression |
| 17 | AI agents & Playwright Agents | H | L7 | Agent loop visual, tool-permission guard problem, planner/generator/healer |
| 18 | MCP | H | L7 | Host/client/server visual, primitives, transports, security |
| 19 | AI coding agents (Cursor & co.) | H | L7 | Plan/agent modes, rules, skills, hooks, risks, rules-file build task |
| 20 | QA leadership | I | L6 | Strategy, estimation, ROI calculator, people topics, 90-day plan |
| 21 | QA metrics | I | L6 | Useful vs vanity metrics, DORA, metrics problem |
| 22 | System design for SDETs | I | L5 | 10-step structure, execution platform, flaky detection, test data platform, sharding problem |
| 23 | Behavioral (STAR) | I | L6 | Story bank, CV-grounded prompts, no-invention rules |
| 24 | Capstone: LeaveFlow | I | L5 | 5-phase portfolio project (Projects page) |

## Suggested order

Designed for a learner whose baseline shows gaps in testing vocabulary (pyramid, verification vs validation), hashing-based coding, HTTP status codes and flaky-test communication, plus self-rated gaps in DSA, CI/CD and system design. (A personal version lives in the private profile pack and `private/learner-analysis.md`.)

1. **M1** (pyramid, V&V) — closes two P0 gaps fast.
2. **M3** hashing lesson + **M9** status codes — the other two diagnostic gaps.
3. **M2 → M3 → M4** — Java/JS fundamentals, DSA, SQL (the coding rounds).
4. **M7 → M5 → M6 → M8** — Playwright first (current direction), then Selenium depth and the comparison.
5. **M10 → M11** — framework architecture and pipelines (SDET 3 core).
6. **M20 → M21 → M23** in parallel from week 3 — QA Lead track and STAR stories.
7. **M22** — system design once M10–M11 are solid.
8. **M16 → M17 → M18 → M19** — AI/agentic track.
9. **M12–M15** — breadth topics.
10. **M24** throughout — build the capstone alongside.

Daily rhythm: clear due revision first, then one lesson step block, one coding problem, one interview answer.

## Planned (not yet built)

- L8 principal-level content (org strategy, multi-team platform economics).
- Optional bring-your-own-key LLM grader for open answers.
- More Java problems with a downloadable runnable project (JUnit) for local execution.
- Per-module content code-splitting.
