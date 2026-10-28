import { MODULES } from '@/content';
import { lessonPath, locate, moduleForSkill } from '@/content/locate';
import type { Module } from '@/content/types';
import type { ProgressState } from '@/store/types';
import { dueCards } from './srs';
import { activeQueue, repeatedMistakes } from './weakness';
import { allMastery } from './mastery';
import { toDay } from './dates';

export interface Recommendation {
  kind: 'revision' | 'relearn' | 'continue' | 'next' | 'interview' | 'weakness';
  title: string;
  reason: string;
  to: string;
  cta: string;
}

/** Weakness ids are `w:<itemType>:<itemId>`. */
export function weaknessItemType(weaknessId: string): string {
  return weaknessId.split(':')[1] ?? 'question';
}

export function moduleProgress(m: Module, lessons: ProgressState['lessons']): { done: number; total: number; pct: number } {
  const total = m.lessons.length;
  const done = m.lessons.filter((l) => lessons[l.id]?.completedAt).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

/** A module is "ready" when each prerequisite is at least half complete or demonstrably mastered. */
export function isUnlocked(m: Module, state: Pick<ProgressState, 'lessons' | 'attempts'>): boolean {
  if (m.prerequisites.length === 0) return true;
  const mastery = allMastery(state.attempts);
  return m.prerequisites.every((pid) => {
    const p = MODULES.find((x) => x.id === pid);
    if (!p) return true;
    const prog = moduleProgress(p, state.lessons);
    return prog.pct >= 50 || p.skills.some((s) => mastery[s].mastery >= 60) || p.lessons.length === 0;
  });
}

/** Ordered study recommendations. The first one drives "Continue learning" on the dashboard. */
export function recommendations(state: ProgressState, today = toDay()): Recommendation[] {
  const out: Recommendation[] = [];
  const due = dueCards(state.srs, today);
  if (due.length) {
    out.push({ kind: 'revision', title: `${due.length} revision item${due.length > 1 ? 's' : ''} due`, reason: 'Spaced review now is cheaper than relearning later.', to: '/revision', cta: 'Start revision' });
  }

  const repeated = repeatedMistakes(state.weaknesses)[0];
  if (repeated?.itemId) {
    const loc = locate(weaknessItemType(repeated.id), repeated.itemId);
    if (loc) out.push({ kind: 'relearn', title: `Re-learn: ${repeated.topic.slice(0, 60)}`, reason: `Missed ${repeated.mistakes} times — same mistake twice means we teach it differently before moving on.`, to: lessonPath(loc), cta: 'Re-learn' });
  }

  for (const m of MODULES) {
    for (const l of m.lessons) {
      const p = state.lessons[l.id];
      if (p && !p.completedAt && p.done.length > 0) {
        out.push({ kind: 'continue', title: `Continue: ${l.title}`, reason: `${m.title} · ${p.done.length}/${l.sections.length} steps done`, to: `/learn/${m.id}/${l.id}`, cta: 'Continue' });
        break;
      }
    }
    if (out.some((r) => r.kind === 'continue')) break;
  }

  // A lesson already started is offered as "Continue" above, so "Next" means one not yet started.
  const notStarted = (id: string) => !state.lessons[id]?.completedAt && !state.lessons[id]?.done.length;
  const next = MODULES.find((m) => m.lessons.length > 0 && isUnlocked(m, state) && m.lessons.some((l) => notStarted(l.id)));
  if (next) {
    const l = next.lessons.find((x) => notStarted(x.id))!;
    out.push({ kind: 'next', title: `Next lesson: ${l.title}`, reason: `Module ${next.number} · ${next.title}`, to: `/learn/${next.id}/${l.id}`, cta: 'Start lesson' });
  }

  const weak = activeQueue(state.weaknesses).find((w) => !w.itemId);
  if (weak) {
    const m = moduleForSkill(weak.skill);
    if (m) out.push({ kind: 'weakness', title: `Weak spot: ${weak.topic}`, reason: weak.source === 'calibration' ? 'Flagged by your baseline diagnostic.' : 'Self-rated as a gap.', to: `/learn/${m.id}`, cta: 'Work on it' });
  }

  const completed = Object.values(state.lessons).filter((l) => l.completedAt).length;
  if (completed >= 2) out.push({ kind: 'interview', title: 'Practise out loud in the Interview Arena', reason: 'Knowing it and explaining it under pressure are different skills.', to: '/arena', cta: 'Enter arena' });

  return out;
}
