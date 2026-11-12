// GitHub Pages post-build step, only used by `npm run build:gh-pages`
// (Cloudflare Pages / Netlify use public/_redirects and public/_headers instead).
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';

// GitHub Pages ignores _headers, so the page policy from that file is applied as a <meta> tag.
const csp = readFileSync('public/_headers', 'utf8').match(/^\/\*\n\s+Content-Security-Policy: (.+)$/m)?.[1];
if (!csp) throw new Error('Page Content-Security-Policy not found in public/_headers');
// frame-ancestors is ignored in a meta policy and only logs a console warning.
const content = csp.replace(/;?\s*frame-ancestors [^;]+/, '');
const html = readFileSync('dist/index.html', 'utf8');
const marker = '<meta charset="UTF-8" />';
if (!html.includes(marker)) throw new Error('dist/index.html: charset meta not found');
// Right after the charset: a meta policy only governs what follows it.
writeFileSync('dist/index.html', html.replace(marker, `${marker}\n    <meta http-equiv="Content-Security-Policy" content="${content}" />`));

// No SPA rewrite rules either: serving index.html as 404.html lets deep links load the app.
copyFileSync('dist/index.html', 'dist/404.html');
console.log('dist: CSP meta tag added, 404.html written for GitHub Pages.');
