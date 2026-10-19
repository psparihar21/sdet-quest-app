import type { InterviewQuestion } from '@/content/types';

/**
 * Deterministic, rubric-based evaluation of a free-text interview answer.
 * It looks for evidence of each rubric point (phrases and their simple inflections),
 * known misconceptions, examples, trade-offs and structure. It does not "understand"
 * the answer, so the UI lets the learner confirm which points they really covered.
 */

export interface RubricResult {
  covered: string[];
  missing: string[];
  redFlags: string[];
  technical: number; // 0..10
  depth: number; // 0..10
  communication: number; // 0..10
  seniority: string;
  words: number;
  summary: string;
  signals: { examples: boolean; tradeoffs: boolean; structure: boolean; star: boolean };
}

export function normalize(text: string): string {
  return ` ${text
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9+#./%\s-]/g, ' ')
    .replace(/[-/]/g, ' ')
    .replace(/[.,;:!?](?=\s|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** True when `phrase` (or a plural/past/-ing/-ly form of its last word) appears as whole words. */
export function hasPhrase(normalizedText: string, phrase: string): boolean {
  const p = normalize(phrase).trim();
  if (!p) return false;
  const re = new RegExp(`(^|\\s)${escapeRe(p)}(s|es|ed|d|ing|ly)?(?=\\s|$)`);
  return re.test(normalizedText);
}

const EXAMPLE_RE = /\b(for example|for instance|e\.g\.|such as|in my (team|project|company|experience)|we had|i built|i led|i owned|at my (current|previous) (company|job|team)|last (year|quarter|release))\b|\d/;
const TRADEOFF_RE = /\b(trade ?off|however|but|depends|downside|drawback|instead|whereas|on the other hand|cost|risk)\b/;
const STRUCTURE_RE = /(^|\n)\s*(\d+[.)]|[-*•])\s+|\b(first(ly)?|second(ly)?|then|next|finally|in summary|to summari[sz]e)\b/;
const STAR_RE = [/\bsituation|context|we were|our team\b/, /\btask|my (role|responsibility)|i was (asked|responsible)\b/, /\b(i (decided|built|created|led|wrote|introduced|proposed|set up|changed|analy[sz]ed))|action\b/, /\bresult|outcome|reduced|improved|increased|saved|%|\bfrom \d+ to \d+\b/];

function clamp(n: number): number {
  return Math.max(0, Math.min(10, Math.round(n * 10) / 10));
}

export function seniorityFor(technical: number, depth: number): string {
  const s = technical * 0.6 + depth * 0.4;
  if (s < 3.5) return 'Below SDET bar — fundamentals gap';
  if (s < 5.5) return 'SDET 1–2';
  if (s < 7) return 'Senior SDET';
  if (s < 8.5) return 'SDET 3';
  return 'Lead / Architect';
}

export function scoreFromCovered(q: InterviewQuestion, covered: string[], redFlagCount = 0): number {
  const total = q.rubric.reduce((s, p) => s + p.weight, 0);
  const got = q.rubric.filter((p) => covered.includes(p.id)).reduce((s, p) => s + p.weight, 0);
  return clamp((got / total) * 10 - redFlagCount);
}

export function evaluateAnswer(q: InterviewQuestion, answer: string): RubricResult {
  const text = normalize(answer);
  const raw = answer.toLowerCase();
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  const covered = q.rubric.filter((p) => p.any.some((ph) => hasPhrase(text, ph))).map((p) => p.id);
  const missing = q.rubric.filter((p) => !covered.includes(p.id)).map((p) => p.id);
  const redFlags = q.redFlags.filter((f) => f.any.some((ph) => hasPhrase(text, ph))).map((f) => f.note);

  const technical = scoreFromCovered(q, covered, redFlags.length);
  const examples = EXAMPLE_RE.test(raw);
  const tradeoffs = TRADEOFF_RE.test(raw);
  const structure = STRUCTURE_RE.test(raw);
  const starHits = STAR_RE.filter((re) => re.test(raw)).length;
  const star = starHits >= 3;

  let depth = (covered.length / q.rubric.length) * 6 + (examples ? 1.5 : 0) + (tradeoffs ? 1.5 : 0);
  depth += words >= 120 ? 1 : words >= 60 ? 0.5 : 0;
  if (words < 15) depth = Math.min(depth, 2);

  const sentences = answer.split(/[.!?\n]+/).map((s) => s.trim()).filter((s) => s.split(/\s+/).length >= 3);
  const avgLen = sentences.length ? words / sentences.length : words;
  let communication = 0;
  communication += sentences.length >= 3 ? 3 : sentences.length >= 2 ? 2 : sentences.length ? 1 : 0;
  communication += avgLen >= 6 && avgLen <= 30 ? 2 : 0.5;
  communication += structure ? 2 : 0;
  if (q.kind === 'behavioral') communication += starHits * 0.75;
  else communication += /\b(so|therefore|in short|overall|in summary|the key)\b/.test(raw) ? 2 : 0.5;
  communication += words >= 40 && words <= 400 ? 1 : 0;
  if (words < 15) communication = Math.min(communication, 3);

  const firstSentence = answer.trim().split(/(?<=[.!?])\s+/)[0] ?? '';
  const summary = words
    ? `${words} words. Opens with: “${firstSentence.slice(0, 160)}${firstSentence.length > 160 ? '…' : ''}” Covers ${covered.length} of ${q.rubric.length} expected points.`
    : 'No answer given.';

  return {
    covered,
    missing,
    redFlags,
    technical,
    depth: clamp(depth),
    communication: clamp(communication),
    seniority: seniorityFor(technical, clamp(depth)),
    words,
    summary,
    signals: { examples, tradeoffs, structure, star },
  };
}
