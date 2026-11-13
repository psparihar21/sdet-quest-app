import type { Problem } from '@/content/types';

/**
 * Phone-sized coding practice built from a problem's reference solution, so no problem needs
 * extra authoring: put the lines in order, pick the missing syntax, then write the logic
 * with tap-in syntax chips. Everything here is pure and deterministic (seeded by problem id).
 */

export type DrillLang = 'js' | 'sql' | 'java';

export interface Block {
  id: number;
  /** One or more consecutive solution lines, indentation kept. */
  text: string;
}

/** Small seeded generator: the same problem always starts from the same shuffle. */
function rng(seed: string): () => number {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function shuffled<T>(xs: readonly T[], seed: string): T[] {
  const out = [...xs];
  const next = rng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** The solution as blocks in the right order. Long solutions are grouped so the puzzle fits one phone screen. */
export function orderBlocks(code: string, max = 7): Block[] {
  const lines = code.split('\n').filter((l) => l.trim());
  const per = Math.ceil(lines.length / max);
  const blocks: Block[] = [];
  for (let i = 0; i < lines.length; i += per) blocks.push({ id: blocks.length, text: lines.slice(i, i + per).join('\n') });
  return blocks;
}

/** The blocks mixed up, never already in the right order. */
export function scramble(blocks: readonly Block[], seed: string): Block[] {
  const out = shuffled(blocks, seed);
  // Compared by text: two identical lines are interchangeable.
  if (blocks.length > 1 && out.every((b, i) => b.text === blocks[i].text)) out.push(out.shift()!);
  return out;
}

/** Index of the first block that is out of place, or -1 when the picked order is the solution. */
export function firstWrong(picked: readonly Block[], blocks: readonly Block[]): number {
  for (let i = 0; i < blocks.length; i++) if (picked[i]?.text !== blocks[i].text) return i;
  return -1;
}

// Syntax worth recalling, most useful first. Neighbours in a list double as believable wrong options.
const SYNTAX: Record<DrillLang, string[]> = {
  js: ['Set', 'Map', 'has', 'includes', 'add', 'push', 'get', 'set', 'delete', 'filter', 'map', 'reduce', 'sort', 'slice', 'split', 'join', 'length', 'size', 'keys', 'values', 'entries', 'shift', 'pop', 'max', 'min', 'floor', 'return', 'continue', 'break', 'while', 'for', 'if', 'else', 'const', 'let', 'new', 'of', 'in'],
  java: ['HashMap', 'HashSet', 'ArrayList', 'ThreadLocal', 'containsKey', 'contains', 'getOrDefault', 'put', 'get', 'add', 'remove', 'size', 'length', 'synchronized', 'volatile', 'static', 'final', 'private', 'public', 'return', 'throw', 'while', 'for', 'if', 'else', 'new', 'void', 'int', 'String', 'boolean'],
  sql: ['GROUP BY', 'ORDER BY', 'PARTITION BY', 'HAVING', 'WHERE', 'LEFT JOIN', 'INNER JOIN', 'JOIN', 'ON', 'SELECT', 'FROM', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'ROW_NUMBER', 'RANK', 'OVER', 'IS NULL', 'IS NOT NULL', 'EXISTS', 'IN', 'AND', 'OR', 'WITH', 'AS', 'DESC', 'ASC', 'LIMIT', 'UNION'],
};

// Members only count after a dot: `max` in `Math.max(` is syntax, `max` as a parameter name is not.
const MEMBERS = new Set(['has', 'includes', 'add', 'push', 'get', 'set', 'delete', 'filter', 'map', 'reduce', 'sort', 'slice', 'split', 'join', 'length', 'size', 'keys', 'values', 'entries', 'shift', 'pop', 'max', 'min', 'floor', 'containsKey', 'contains', 'getOrDefault', 'put', 'remove']);

/** First whole-word occurrence of a piece of syntax. (No regex lookbehind: older iOS Safari cannot parse it.) */
function find(code: string, token: string, lang: DrillLang): { index: number; text: string } | undefined {
  // A single dot only: `...set` is the spread operator, not a member access.
  const before = lang !== 'sql' && MEMBERS.has(token) ? '((?:^|[^.])\\.)' : '(^|[^\\w.])';
  const m = new RegExp(`${before}(${token.replace(/ /g, '\\s+')})(?!\\w)`, lang === 'sql' ? 'i' : '').exec(code);
  return m ? { index: m.index + m[1].length, text: m[2] } : undefined;
}

export interface Gap {
  /** The text that was removed, exactly as written in the solution. */
  token: string;
  options: string[];
}

export interface GapDrill {
  /** Code pieces and gap indexes in reading order. */
  parts: (string | number)[];
  gaps: Gap[];
}

/** The solution with up to `max` pieces of syntax removed, each with four options to choose from. */
export function makeGaps(code: string, lang: DrillLang, seed: string, max = 3): GapDrill {
  const list = SYNTAX[lang];
  const found: { at: number; token: string; name: string }[] = [];
  for (const name of list) {
    if (found.length >= max) break;
    const m = find(code, name, lang);
    // One gap per line keeps every line readable, and gaps never overlap.
    if (!m || found.some((f) => code.slice(Math.min(f.at, m.index), Math.max(f.at, m.index)).indexOf('\n') === -1)) continue;
    found.push({ at: m.index, token: m.text, name });
  }
  found.sort((a, b) => a.at - b.at);

  const parts: (string | number)[] = [];
  const gaps: Gap[] = [];
  let pos = 0;
  for (const f of found) {
    parts.push(code.slice(pos, f.at), gaps.length);
    pos = f.at + f.token.length;
    const i = list.indexOf(f.name);
    // Nearest neighbours in the list that are not the answer; ones absent from the solution first.
    const near = list.filter((t) => t !== f.name).sort((a, b) => Math.abs(list.indexOf(a) - i) - Math.abs(list.indexOf(b) - i));
    const wrong = [...new Set([...near.filter((t) => !find(code, t, lang)), ...near])].slice(0, 3);
    gaps.push({ token: f.token, options: shuffled([f.token, ...wrong], `${seed}:${f.at}`) });
  }
  parts.push(code.slice(pos));
  return { parts, gaps };
}

export interface Chip {
  label: string;
  /** Text inserted at the cursor. */
  text: string;
}

const JS_CHIPS: [RegExp, Chip][] = [
  [/new Set/, { label: 'new Set()', text: 'new Set()' }],
  [/new Map/, { label: 'new Map()', text: 'new Map()' }],
  [/for \(const \w+ of/, { label: 'for…of', text: 'for (const x of xs) {\n  \n}' }],
  [/for \((let|var) /, { label: 'for i', text: 'for (let i = 0; i < n; i++) {\n  \n}' }],
  [/while \(/, { label: 'while', text: 'while () {\n  \n}' }],
  [/if \(/, { label: 'if', text: 'if () {\n  \n}' }],
  [/\belse\b/, { label: 'else', text: 'else {\n  \n}' }],
  [/\.has\(/, { label: '.has()', text: '.has()' }],
  [/\.add\(/, { label: '.add()', text: '.add()' }],
  [/\.get\(/, { label: '.get()', text: '.get()' }],
  [/\.set\(/, { label: '.set()', text: '.set(, )' }],
  [/\.push\(/, { label: '.push()', text: '.push()' }],
  [/\.includes\(/, { label: '.includes()', text: '.includes()' }],
  [/\.sort\(/, { label: '.sort()', text: '.sort((a, b) => a - b)' }],
  [/\.filter\(/, { label: '.filter()', text: '.filter((x) => )' }],
  [/\.map\(/, { label: '.map()', text: '.map((x) => )' }],
  [/\.reduce\(/, { label: '.reduce()', text: '.reduce((acc, x) => acc, 0)' }],
  [/\.length/, { label: '.length', text: '.length' }],
  [/\.size/, { label: '.size', text: '.size' }],
  [/\[\.\.\./, { label: '[...x]', text: '[...]' }],
  [/Math\.max/, { label: 'Math.max()', text: 'Math.max()' }],
  [/Math\.min/, { label: 'Math.min()', text: 'Math.min()' }],
];
const ALWAYS: Record<DrillLang, Chip[]> = {
  js: [
    { label: 'const', text: 'const  = ' },
    { label: 'return', text: 'return ' },
  ],
  java: [{ label: 'return', text: 'return ' }],
  sql: [],
};

/** Syntax the learner can tap in instead of typing: what this solution uses, in the order it is first needed. */
export function syntaxChips(code: string, lang: DrillLang): Chip[] {
  if (lang === 'js') {
    const hits = JS_CHIPS.map(([re, chip]) => ({ at: code.search(re), chip })).filter((h) => h.at >= 0);
    return [...ALWAYS.js, ...hits.sort((a, b) => a.at - b.at).map((h) => h.chip)];
  }
  const hits = SYNTAX[lang].map((name) => ({ at: find(code, name, lang)?.index ?? -1, name })).filter((h) => h.at >= 0);
  const chips = hits.sort((a, b) => a.at - b.at).map((h) => ({ label: h.name, text: `${h.name} ` }));
  return [...ALWAYS[lang].filter((c) => !chips.some((x) => x.label === c.label)), ...chips];
}

export const drillLang = (p: Problem): DrillLang => p.kind;
