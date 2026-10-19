import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { profilePackSchema } from '@/store/profilePack';
import { getInterview, getProblem, getQuestion } from '@/content';
import { VIZ_IDS } from '@/viz';
import { MODULES } from '@/content';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

describe('privacy', () => {
  // The public build must never contain the learner's personal data; that lives in profile.local.json (git-ignored).
  // The identifiers themselves are personal data, so they live in a git-ignored file, one regex per line.
  // Without that file (CI, a fresh clone) the list is empty and this check passes trivially.
  const FORBIDDEN = existsSync('private/forbidden.txt') ? readFileSync('private/forbidden.txt', 'utf8').split(/\r?\n/).filter((p) => p.trim()).map((p) => new RegExp(p.trim(), 'i')) : [];
  it('ships no personal identifiers in src/', () => {
    for (const f of files('src')) {
      const text = readFileSync(f, 'utf8');
      for (const re of FORBIDDEN) expect(re.test(text), `${f} matches ${re}`).toBe(false);
    }
  });
});

describe('profile packs', () => {
  const check = (path: string) => {
    const pack = profilePackSchema.parse(JSON.parse(readFileSync(path, 'utf8')));
    for (const d of pack.diagnostics) {
      for (const ref of d.relatedItems) {
        const [type, id] = ref.includes(':') ? ref.split(':') : ['question', ref];
        const found = type === 'question' ? getQuestion(id) : type === 'problem' ? getProblem(id) : type === 'interview' ? getInterview(id) : undefined;
        expect(found, `${path}: ${ref}`).toBeDefined();
      }
    }
  };
  it('example pack is valid and references real content', () => check('profile.example.json'));
  it.runIf(existsSync('profile.local.json'))('local pack (if present) is valid and references real content', () => check('profile.local.json'));
});

describe('visualizations', () => {
  it('every vizId used in a lesson exists', () => {
    for (const m of MODULES) for (const l of m.lessons) for (const s of l.sections) if (s.kind === 'visual') expect(VIZ_IDS, `${l.id}`).toContain(s.vizId);
  });
});
