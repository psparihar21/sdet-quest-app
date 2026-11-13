# Security

SDET Quest is a static, client-side app. There is no server, account or database in this version, so the things to protect are the learner's saved progress, the browser the app runs in, and the repository itself.

## What protects what

| Risk | Protection | Checked by |
|---|---|---|
| Learner code attacks the page | JS/TS and SQL run in dedicated Web Workers with a hard timeout; the JS worker removes `fetch`, `XMLHttpRequest`, `WebSocket`, `importScripts`, `indexedDB`, `caches` and more before any learner code runs | `tests/unit/sandbox.test.ts`, E2E "an infinite loop is stopped by the timeout" |
| Script injection | No raw HTML in markdown (`react-markdown` without `rehype-raw`); React escapes all text; the page policy allows no inline or `eval` script except one theme script pinned by hash | `tests/unit/headers.test.ts`; injected inline script blocked in the GitHub Pages smoke test |
| Hostile backup or profile file | Every import and every load from storage is validated against a Zod schema; corrupt data is set aside, not loaded; a `__proto__` key cannot pollute objects | `tests/unit/store.test.ts` ("rejects corrupted collections", "hostile backups"), E2E "corrupted saved progress" |
| Personal data in the public build | Personal data lives only in `profile.local.json` (git-ignored) | `tests/unit/privacy-and-profile.test.ts` |
| Stale or tampered app version | The service worker and manifest are revalidated on every visit; a new version reloads the page | E2E "installs a service worker and opens offline" |
| Vulnerable dependencies | `npm audit --omit=dev` reports 0 vulnerabilities in what ships | run before each release |

## Review on 2026-11-13 (scroll feed, installable app, GitHub Pages)

Reviewed by the `ecc:security-reviewer` and `ecc:react-reviewer` agents plus hands-on checks.

- **Git history:** no API keys, tokens, private keys or home paths in any commit. `profile.local.json` and `private/` were never committed.
- **New feed code:** no `innerHTML`, `dangerouslySetInnerHTML`, redirects or new network calls.
- **Dependencies:** 0 vulnerabilities in shipped packages. 15 remain in development-only tools (the test runner and its helpers); fixing them needs a major-version upgrade of the test runner, which is planned separately. They never reach users.
- **GitHub Pages build**, served under `/sdet-quest/`: feed loads, service worker scope and install manifest are correct, both code runners work, the pinned theme script runs, an injected inline script is blocked, and a never-visited deep link opens offline.

## Sync (optional)

- Off unless the build is given a Supabase project URL and public key, and nothing is loaded or sent until the learner signs in. The URL must be a `*.supabase.co` address or sync stays off.
- Sign-in is a one-time link sent by email, returning to the app's own address (the only redirect the project allows). No password exists.
- The key in the build is the public one. Row-level security limits each account to its own row, and a size check caps a row at 3 MB.
- Progress downloaded from the cloud gets the same schema validation as an imported backup before it is merged.
- The page policy allows connections to `https://*.supabase.co` and nowhere else outside the site.
- **Verified on the live project (2026-11-13):** signed-out requests read nothing, cannot insert (refused by row-level security) and update nothing. **Not yet verified:** a full sign-in and two-device merge, and that one signed-in account cannot touch another's row (needs two real email accounts).
- Anyone who opens the public site can request a sign-in code for their own email and store their own row in the project. Turn off new sign-ups in Supabase once your own account exists.

## Known limits

- **GitHub Pages cannot send response headers.** The page policy is applied as a `<meta>` tag instead (added by `scripts/spa-404.mjs`), which covers script, style, frame and connection rules. Lost on that host: `frame-ancestors` (so the site could be framed by another site), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and the separate stricter policy for the code workers. Cloudflare Pages or Netlify keep all of these through `public/_headers`.
- **Code worker on GitHub Pages:** without its own policy, code a learner pastes could load a remote module with `import()`. The worker has no access to the page, to saved progress or to browser storage, so the exposure is limited to what the learner's own pasted code can reach on the network. Do not paste code you do not trust.
- **Worker policy when served from the offline cache** has not been verified on a header-capable host.
- **Reading is trusted.** Scrolling past a lesson card in the feed marks it read, the same as pressing "Got it, next" on the lesson page. Mastery still comes only from graded answers.

## Reporting

Open a private security advisory on the GitHub repository.
