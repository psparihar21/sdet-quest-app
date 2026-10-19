// GitHub Pages has no SPA rewrite rules: serving index.html as 404.html lets deep links load the app.
// Only used by `npm run build:gh-pages` (Cloudflare Pages / Netlify use public/_redirects instead).
import { copyFileSync } from 'node:fs';
copyFileSync('dist/index.html', 'dist/404.html');
console.log('dist/404.html written for GitHub Pages SPA fallback.');
