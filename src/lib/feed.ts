import { FLASHCARDS, MODULES, getFlashcard, getInterview, getProblem, getQuestion } from '@/content';
import { lessonPath, locate, moduleForSkill } from '@/content/locate';
import type { Video } from '@/content/types';
import type { ProgressState } from '@/store/types';
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
}

export type FeedCard = Base &
  (
    | { kind: 'learn'; title: string; body: string }
    | { kind: 'visual'; title: string; vizId: string; caption: string }
    | { kind: 'video'; title: string; video: Video }
    | { kind: 'question'; id: string }
    | { kind: 'flashcard'; id: string }
    /** Work that needs the full page (code editor, typed interview answer, build task). */
    | { kind: 'open'; title: string; text: string; to: string; cta: string }
  );

const MAX_DUE = 10;
const MAX_WEAK = 5;
const FLASHCARD_EVERY = 5;
const PART_CHARS = 600;

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
  for (const b of blocks) {
    const heading = /^#{1,6} /.test(b);
    // A heading alone is not a part: it always travels with the block after it.
    const onlyHeading = /^#{1,6} [^\n]*$/.test(part);
    if (part && !onlyHeading && (heading || part.length + b.length > max)) {
      parts.push(part);
      part = b;
    } else part = part ? `${part}\n\n${b}` : b;
  }
  if (part) parts.push(part);
  return parts;
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
    if (c.itemType === 'question' && getQuestion(c.itemId)) push({ ...base, kind: 'question', id: c.itemId }, c.id);
    else if (c.itemType === 'flashcard' && getFlashcard(c.itemId)) push({ ...base, kind: 'flashcard', id: c.itemId }, c.id);
    else {
      const title = c.itemType === 'problem' ? getProblem(c.itemId)?.title : c.itemType === 'interview' ? getInterview(c.itemId)?.prompt : undefined;
      if (title) push({ ...base, kind: 'open', title, text: c.itemType === 'problem' ? 'A coding problem is due. It needs the editor.' : 'An interview question is due. Answer it on the revision page.', to: '/revision', cta: 'Open revision' }, c.id);
    }
  }

  for (const w of activeQueue(state.weaknesses).slice(0, MAX_WEAK)) {
    const base = { key: `weak:${w.id}`, why: 'weak' as const, label: 'Weak spot' };
    const type = weaknessItemType(w.id);
    if (w.itemId && type === 'question' && getQuestion(w.itemId)) {
      push({ ...base, kind: 'question', id: w.itemId }, cardId('question', w.itemId));
      continue;
    }
    const loc = w.itemId ? locate(type, w.itemId) : undefined;
    const to = loc ? lessonPath(loc) : `/learn/${moduleForSkill(w.skill)?.id ?? ''}`;
    push({ ...base, kind: 'open', title: w.topic, text: w.itemId ? `Missed ${w.mistakes} time${w.mistakes === 1 ? '' : 's'}. Go back to where it is taught.` : 'Flagged as a gap. Work through the module that teaches it.', to, cta: 'Open lesson' });
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
      const opens: FeedCard[] = [];
      let fed = false;
      const add = (c: FeedCard, item?: string) => {
        if (!push(c, item)) return;
        fed = true;
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
          parts.forEach((body, p) => add({ key: `${key}:${p}`, why: 'new', label, step: step(p === parts.length - 1), kind: 'learn', title: s.title, body }));
        } else if (s.kind === 'visual') add({ key, why: 'new', label, step: step(true), kind: 'visual', title: s.title, vizId: s.vizId, caption: s.caption });
        else if (s.kind === 'video') add({ key, why: 'new', label, step: step(true), kind: 'video', title: s.title, video: s.video });
        else if (s.kind === 'check') {
          const ids = s.questionIds.filter((id) => getQuestion(id) && !tried.has(id));
          ids.forEach((id, q) => add({ key: `${key}:${id}`, why: 'new', label, step: step(q === ids.length - 1), kind: 'question', id }, cardId('question', id)));
        } else {
          const text = s.kind === 'practice' ? 'Hands-on problem. It opens in the full editor.' : s.kind === 'interview' ? 'Interview drill. Answer it on the lesson page for rubric feedback.' : 'Build task with acceptance criteria.';
          opens.push({ key, why: 'new', label, kind: 'open', title: s.title, text, to: `/learn/${m.id}/${l.id}`, cta: 'Open lesson' });
        }
      });
      // Full-page steps ride along with a lesson that still has scrollable material; alone they would repeat forever.
      if (fed) opens.forEach((c) => push(c));
      if (out.length >= end) return out;
    }
  }
  return out;
}

/**
 * Check steps whose questions were all answered somewhere else (revision, a mixed quiz) but
 * never marked done. The feed has no card left to show for them, so it completes them itself.
 */
export function answeredCheckSteps(state: ProgressState): Omit<FeedStep, 'last'>[] {
  const tried = new Set(state.attempts.filter((a) => a.itemType === 'question').map((a) => a.itemId));
  const out: Omit<FeedStep, 'last'>[] = [];
  for (const m of MODULES)
    for (const l of m.lessons)
      l.sections.forEach((s, index) => {
        if (s.kind !== 'check' || state.lessons[l.id]?.done.includes(index)) return;
        const ids = s.questionIds.filter((id) => getQuestion(id));
        if (ids.length && ids.every((id) => tried.has(id))) out.push({ lessonId: l.id, index, total: l.sections.length });
      });
  return out;
}
