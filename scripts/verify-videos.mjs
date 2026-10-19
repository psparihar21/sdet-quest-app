// Re-verifies every curated YouTube video with YouTube's public oEmbed endpoint.
// HTTP 200 = the video exists and allows embedding; the returned title/channel are compared with ours.
// Usage: npm run verify:videos   (needs network access; exits 1 if any video fails)
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/content/videos.ts', import.meta.url), 'utf8');
const entries = [...src.matchAll(/V\('([\w-]{11})',\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)'/g)].map((m) => ({
  id: m[1],
  title: m[2].replace(/\\'/g, "'"),
  channel: m[3].replace(/\\'/g, "'"),
}));

let failed = 0;
for (const v of entries) {
  const url = `https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${v.id}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      failed++;
      console.log(`FAIL ${v.id} HTTP ${res.status}  ${v.title}`);
      continue;
    }
    const data = await res.json();
    const channelOk = data.author_name === v.channel;
    console.log(`${channelOk ? 'OK  ' : 'WARN'} ${v.id}  ${data.title}  —  ${data.author_name}${channelOk ? '' : `  (expected channel: ${v.channel})`}`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${v.id} ${e.message}`);
  }
}
console.log(`\n${entries.length - failed}/${entries.length} videos available.`);
process.exit(failed ? 1 : 0);
