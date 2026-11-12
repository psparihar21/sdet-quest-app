# Deployment

SDET Quest is a static site: `npm run build` produces `dist/`, which any static host can serve. No backend, database or secrets are required.

> Provider limits below were checked on **2026-10-19** from the providers' own pages. Free tiers change — re-check before relying on them.

## Recommended: Cloudflare Pages

| Free plan (per Cloudflare's limits page) | |
|---|---|
| Builds | 500 per month, 1 concurrent |
| Files per site | 20,000 (this app: ~50) |
| Max file size | 25 MiB per asset (largest here: sql-wasm ≈ 0.7 MB) |
| Static requests / bandwidth | No limit stated for static assets |
| Custom domains | 100 per project |

SPA routing works via `public/_redirects` (`/* /index.html 200`). Security headers, including a separate stricter CSP for the code-sandbox workers, come from `public/_headers` (Cloudflare Pages and Netlify both read it).

### Steps

1. Put the project in a Git repository (GitHub or GitLab). **Do not commit `profile.local.json`** — it is in `.gitignore`; confirm with `git status` before the first push.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → choose the repo.
3. Build settings: framework preset **None** (or Vite), build command `npm run build`, output directory `dist`, environment variable `NODE_VERSION=22`.
4. Deploy. Every push to the main branch redeploys; pull requests get preview URLs.

Alternative without Git: `npm run build`, then `npx wrangler pages deploy dist` (requires a Cloudflare login).

## GitHub Pages

| Limits (per GitHub docs) | |
|---|---|
| Published site size | 1 GB |
| Bandwidth | 100 GB/month soft limit |
| Builds | 10/hour soft limit (not applied to custom Actions workflows) |
| Deploy timeout | 10 minutes |

GitHub Pages has no rewrite rules, so deep links like `/learn/m01` need the `404.html` trick. A project site is served under `/<repo-name>/`:

1. Any repo name works: the workflow builds with the base path `/<repo-name>/`.
2. The repo must be public (GitHub Pages on a private repo needs a paid plan).
3. Repo → Settings → Pages → Source: **GitHub Actions**.
4. Push to `main`. `.github/workflows/pages.yml` lints, typechecks, runs the unit tests, runs `npm run build:gh-pages` and deploys `dist/`.

`npm run build:gh-pages` builds with the base path from `VITE_BASE_PATH` (the workflow sets it), adds the page security policy as a `<meta>` tag (GitHub Pages ignores `public/_headers`) and writes `dist/404.html`. See [security.md](security.md) for what this host cannot enforce.

To try that build locally (PowerShell; Git Bash rewrites arguments that start with `/`):

```powershell
$env:VITE_BASE_PATH = '/sdet-quest-app/'; npm.cmd run build:gh-pages; npx.cmd vite preview --base=/sdet-quest-app/ --port 4174
```

Note: with the 404 fallback, deep links return HTTP 404 status but render the app — fine for people, less ideal for crawlers.

## Netlify

The free plan is credit-based (300 credits listed on the pricing page; production deploys cost 15 credits each and bandwidth draws on the same credits). It works (`public/_redirects` is Netlify's format) but leaves less headroom for frequent deploys than Cloudflare Pages.

Build command `npm run build`, publish directory `dist`.

## Install on a phone

The app is installable and works offline once it has been opened online one time.

- **Android (Chrome):** open the site → menu (⋮) → **Add to Home screen** → Install.
- **iPhone (Safari):** open the site → Share → **Add to Home Screen**.

It opens full screen on the scroll feed. Updates arrive automatically the next time it is opened online.

## Pre-deployment checklist

- [ ] `npm ci` on a clean checkout succeeds
- [ ] `npm run check` passes (lint, typecheck, unit tests, build)
- [ ] `npx playwright install chromium` then `npm run e2e` passes
- [ ] `npm run verify:videos` passes (or broken videos are removed)
- [ ] `git status` shows no `profile.local.json`, `private/`, `.env` or test-results
- [ ] `npm run preview` → click through Dashboard, a lesson, Coding Lab (JS + SQL), Arena, Revision, Settings
- [ ] After deploying: open a deep link directly (e.g. `/learn/m04/m04-l1`) and refresh — it must load
- [ ] Run one SQL problem on the deployed site (checks the `.wasm` asset is served and the SQL worker CSP allows WebAssembly)
- [ ] Run one JS problem and check the browser console shows no CSP errors (confirms the `/sandbox/*` header rules applied)
- [ ] Check headers: `curl -sI https://<your-site>/` shows `content-security-policy` and `x-content-type-options`
- [ ] Import your profile pack on the deployed site only in your own browser

## What "multi-user" would need (not built)

Public visitors already get their own progress in their own browsers. Shared accounts, cross-device sync or leaderboards would need: an auth provider, a backend implementing `ProgressRepository` (e.g. Supabase free tier with row-level security), a privacy policy, and data-deletion support. See [architecture.md](architecture.md#persistence-and-migration).

## Deployment status

Not deployed yet. Builds succeed locally; the source is on GitHub (private repository).
