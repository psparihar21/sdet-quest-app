import { FLASHCARDS, MODULES, getFlashcard, getInterview, getProblem, getQuestion } from '@/content';
import { locate } from '@/content/locate';
import type { Video } from '@/content/types';
import type { ProgressState } from '@/store/types';
import { makeGaps, orderBlocks } from './codeDrill';
import { toDay } from './dates';
import { isUnlocked, weaknessItemType } from './recommend';
import { cardId, dueCards } from './srs';
import { activeQueue } from './weakness';

/** Lesson step a card belongs to. `last` marks the card that finishes the step. */
export interface FeedStep {
  lessonId: string;
  index: number;
  total: number;
  last: boolean;
}

interface Base {
  key: string;
  why: 'due' | 'weak' | 'new';
  /** Short context line shown above the card. */
  label: string;
  step?: FeedStep;
  /** Lesson the card belongs to, for saving it and opening the full lesson. */
  moduleId?: string;
  lessonId?: string;
}

/** Position of a card inside its lesson step, e.g. part 2 of 4. */
interface Part {
  part: number;
  parts: number;
}

export type FeedCard = Base &
  (
    | ({ kind: 'learn'; title: string; body: string } & Part)
    /** A markdown table, shown as one row per slide. */
    | ({ kind: 'table'; title: string; head: string[]; rows: string[][] } & Part)
    | { kind: 'visual'; title: string; vizId: string; caption: string }
    | { kind: 'video'; title: string; video: Video }
    | { kind: 'question'; id: string }
    | { kind: 'flashcard'; id: string }
    /** One stage of tap-to-code practice on a problem: order the lines, fill the gaps, then write and run it. */
    | { kind: 'code'; id: string; stage: CodeStage }
    | { kind: 'interview'; id: string }
    /** A build task, self-reviewed against its acceptance criteria. `index` is its step in the lesson. */
    | { kind: 'build'; title: string; task: string; acceptance: string[]; index: number }
  );

export type CodeStage = 'order' | 'gaps' | 'write';

const MAX_DUE = 10;
const MAX_WEAK = 5;
const FLASHCARD_EVERY = 5;
// One idea per phone screen at reading size.
const PART_CHARS = 380;

/** A markdown table, with or without a heading line directly above it. */
const isTable = (block: string) => {
  const lines = block.split('\n');
  if (/^#{1,6} /.test(lines[0]) && lines.length > 1) lines.shift();
  return lines.every((l) => l.trim().startsWith('|'));
};

/** Split a lesson body into screen-sized parts at headings and paragraph breaks, never inside a code fence. */
export function splitBody(body: string, max = PART_CHARS): string[] {
  const blocks: string[] = [];
  let cur: string[] = [];
  let fenced = false;
  for (const line of body.split('\n')) {
    if (/^\s*```/.test(line)) fenced = !fenced;
    if (!fenced && line.trim() === '') {
      if (cur.length) blocks.push(cur.join('\n'));
      cur = [];
    } else cur.push(line);
  }
  if (cur.length) blocks.push(cur.join('\n'));

  const parts: string[] = [];
  let part = '';
  let afterTable = false;
  for (const b of blocks) {
    const heading = /^#{1,6} /.test(b);
    // A heading alone is not a part: it always travels with the block after it.
    const onlyHeading = /^#{1,6} [^\n]*$/.test(part);
    // A table gets a card of its own (it becomes a slide deck).
    if (part && (afterTable || (!onlyHeading && (heading || isTable(b) || part.length + b.length > max)))) {
      parts.push(part);
      part = b;
    } else part = part ? `${part}\n\n${b}` : b;
    afterTable = isTable(b);
  }
  if (part) parts.push(part);
  return parts;
}

/** A part that is just a markdown table (optionally under a heading), as cells. */
export function parseTable(part: string): { title?: string; head: string[]; rows: string[][] } | undefined {
  const lines = part.split('\n').filter((l) => l.trim());
  const title = /^#{1,6} /.test(lines[0] ?? '') ? lines.shift()!.replace(/^#{1,6} /, '').trim() : undefined;
  if (lines.length < 3 || !lines.every((l) => l.trim().startsWith('|')) || !/^\|[\s:|-]+\|?$/.test(lines[1].trim())) return undefined;
  // Split on unescaped pipes. The trailing pipe is optional in markdown. (No regex lookbehind: older iOS Safari cannot parse it.)
  const cells = (l: string) =>
    l
      .trim()
      .replace(/\\\|/g, '\uE000')
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim().replace(/\uE000/g, '|'));
  const head = cells(lines[0]);
  const rows = lines.slice(2).map(cells).filter((r) => r.length === head.length);
  return rows.length ? { title, head, rows } : undefined;
}

/**
 * The scroll feed: revision that is due, then weak spots, then new lesson material in
 * course order with an unseen flashcard mixed in. `shown` is what is already on screen:
 * neither those cards nor the questions and flashcards on them are offered again.
 */
export function buildFeed(state: ProgressState, opts: { today?: string; limit?: number; shown?: readonly FeedCard[] } = {}): FeedCard[] {
  const { today = toDay(), limit = 40, shown = [] } = opts;
  const out: FeedCard[] = [];
  const skip = new Set(shown.map((c) => c.key));
  // `${itemType}:${itemId}` already in this feed
  const items = new Set(shown.flatMap((c) => (c.kind === 'question' || c.kind === 'flashcard' ? [cardId(c.kind, c.id)] : [])));
  const push = (c: FeedCard, item?: string) => {
    if (skip.has(c.key) || (item && items.has(item))) return false;
    if (item) items.add(item);
    out.push(c);
    return true;
  };

  for (const c of dueCards(state.srs, today).slice(0, MAX_DUE)) {
    const base = { key: `due:${c.id}`, why: 'due' as const, label: 'Due for revision' };
    if (c.itemType === 'question' && getQuestion(c.itemId)) push({ ...base, ...locate('question', c.itemId), kind: 'question', id: c.itemId }, c.id);
    else if (c.itemType === 'flashcard' && getFlashcard(c.itemId)) push({ ...base, kind: 'flashcard', id: c.itemId }, c.id);
    // Revision is recall: a due problem goes straight to writing it, without the guided warm-ups.
    else if (c.itemType === 'problem' && getProblem(c.itemId)) push({ ...base, ...locate('problem', c.itemId), kind: 'code', id: c.itemId, stage: 'write' }, c.id);
    else if (c.itemType === 'interview' && getInterview(c.itemId)) push({ ...base, ...locate('interview', c.itemId), kind: 'interview', id: c.itemId }, c.id);
  }

  for (const w of activeQueue(state.weaknesses).slice(0, MAX_WEAK)) {
    const base = { key: `weak:${w.id}`, why: 'weak' as const, label: 'Weak spot' };
    const type = weaknessItemType(w.id);
    if (w.itemId && type === 'question' && getQuestion(w.itemId)) {
      push({ ...base, ...locate('question', w.itemId), kind: 'question', id: w.itemId }, cardId('question', w.itemId));
      continue;
    }
    if (w.itemId && type === 'problem' && getProblem(w.itemId)) push({ ...base, ...locate('problem', w.itemId), kind: 'code', id: w.itemId, stage: 'write' }, cardId('problem', w.itemId));
    else if (w.itemId && type === 'interview' && getInterview(w.itemId)) push({ ...base, ...locate('interview', w.itemId), kind: 'interview', id: w.itemId }, cardId('interview', w.itemId));
    // Skill-level gaps (from a diagnostic or self-rating) have no single card: the course order below covers them.
  }

  const tried = new Set(state.attempts.filter((a) => a.itemType === 'question').map((a) => a.itemId));
  // Modules whose prerequisites are met come first, but a locked module never dead-ends the feed.
  const ordered = [...MODULES.filter((m) => isUnlocked(m, state)), ...MODULES.filter((m) => !isUnlocked(m, state))];
  let fresh = 0;
  const end = out.length + limit;
  for (const m of ordered) {
    for (const l of m.lessons) {
      const prog = state.lessons[l.id];
      if (prog?.completedAt) continue;
      const label = `Module ${m.number} · ${l.title}`;
      const total = l.sections.length;
      const add = (card: FeedCard, item?: string) => {
        const c = { ...card, moduleId: m.id, lessonId: l.id };
        if (!push(c, item)) return;
        fresh += 1;
        if (fresh % FLASHCARD_EVERY) return;
        const f = FLASHCARDS.find((x) => x.moduleId === m.id && !state.srs[cardId('flashcard', x.id)] && !items.has(cardId('flashcard', x.id)));
        if (f) push({ key: `new:flashcard:${f.id}`, why: 'new', label: `Module ${m.number} · Flashcard`, kind: 'flashcard', id: f.id }, cardId('flashcard', f.id));
      };
      l.sections.forEach((s, index) => {
        if (prog?.done.includes(index)) return;
        const key = `new:${l.id}:${index}`;
        const step = (last: boolean): FeedStep => ({ lessonId: l.id, index, total, last });
        if (s.kind === 'learn') {
          const parts = splitBody(s.body);
          parts.forEach((body, p) => {
            const base = { key: `${key}:${p}`, why: 'new' as const, label, step: step(p === parts.length - 1), part: p + 1, parts: parts.length };
            const table = parseTable(body);
            add(table ? { ...base, kind: 'table', title: table.title ?? s.title, head: table.head, rows: table.rows } : { ...base, kind: 'learn', title: s.title, body });
          });
        } else if (s.kind === 'visual') add({ key, why: 'new', label, step: step(true), kind: 'visual', title: s.title, vizId: s.vizId, caption: s.caption });
        else if (s.kind === 'video') add({ key, why: 'new', label, step: step(true), kind: 'video', title: s.title, video: s.video });
        else if (s.kind === 'check') {
          const ids = s.questionIds.filter((id) => getQuestion(id) && !tried.has(id));
          ids.forEach((id, q) => add({ key: `${key}:${id}`, why: 'new', label, step: step(q === ids.length - 1), kind: 'question', id }, cardId('question', id)));
        } else if (s.kind === 'practice') {
          const p = getProblem(s.problemId);
          if (!p) return;
          // Guided the first time: put the lines in order, pick the missing syntax, then write the logic.
          const stages: CodeStage[] = [...(orderBlocks(p.solution.code).length >= 3 ? (['order'] as const) : []), ...(makeGaps(p.solution.code, p.kind, p.id).gaps.length ? (['gaps'] as const) : []), 'write'];
          stages.forEach((stage) => add({ key: `${key}:${stage}`, why: 'new', label, step: step(stage === 'write'), kind: 'code', id: p.id, stage }, stage === 'write' ? cardId('problem', p.id) : undefined));
        } else if (s.kind === 'interview') {
          if (getInterview(s.interviewId)) add({ key, why: 'new', label, step: step(true), kind: 'interview', id: s.interviewId }, cardId('interview', s.interviewId));
        } else add({ key, why: 'new', label, step: step(true), kind: 'build', title: s.title, task: s.task, acceptance: s.acceptance, index });
      });
      if (out.length >= end) return out;
    }
  }
  return out;
}

/**
 * Steps that are finished by answering, not by reading, and whose work is already stored:
 * every question of a check answered, a problem attempted, an interview answered, a build task
 * self-reviewed. It does not matter where that happened (the feed, a lesson page, revision),
 * so the feed completes them from the stored attempts, by the same rules as the lesson page.
 */
export function answeredSteps(state: ProgressState): Omit<FeedStep, 'last'>[] {
  const has = (type: string) => new Set(state.attempts.filter((a) => a.itemType === type).map((a) => a.itemId));
  const tried = has('question');
  const [problems, interviews, builds] = [has('problem'), has('interview'), has('build')];
  const out: Omit<FeedStep, 'last'>[] = [];
  for (const m of MODULES)
    for (const l of m.lessons)
      l.sections.forEach((s, index) => {
        if (state.lessons[l.id]?.done.includes(index)) return;
        const ids = s.kind === 'check' ? s.questionIds.filter((id) => getQuestion(id)) : [];
        const done =
          (s.kind === 'check' && ids.length > 0 && ids.every((id) => tried.has(id))) ||
          (s.kind === 'practice' && problems.has(s.problemId)) ||
          (s.kind === 'interview' && interviews.has(s.interviewId)) ||
          (s.kind === 'build' && builds.has(`${l.id}#${index}`));
        if (done) out.push({ lessonId: l.id, index, total: l.sections.length });
      });
  return out;
}
