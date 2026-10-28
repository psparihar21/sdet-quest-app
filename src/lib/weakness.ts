import type { Attempt, Weakness } from '@/store/types';
import { toDay } from './dates';

/** Below this an attempt is a weakness signal. */
export const WEAK_BELOW = 0.6;

/**
 * Update the weakness queue after a graded attempt.
 * - A low score adds the item (or bumps `mistakes` if it was already there: a repeat mistake).
 * - A good score on a queued item counts as a pass; passes on two different days resolve it.
 */
export function applyAttempt(
  queue: Record<string, Weakness>,
  attempt: Attempt,
  topic: string,
): Record<string, Weakness> {
  const id = `w:${attempt.itemType}:${attempt.itemId}`;
  const existing = queue[id];
  const day = toDay(new Date(attempt.at));

  if (attempt.score < WEAK_BELOW) {
    const next: Weakness = existing
      ? { ...existing, mistakes: existing.mistakes + 1, status: 'active', passes: 0, lastPassDay: undefined, resolvedAt: undefined, score: attempt.score }
      : {
          id,
          skill: attempt.skill,
          topic,
          itemId: attempt.itemId,
          source: 'assessment',
          score: attempt.score,
          addedAt: attempt.at,
          mistakes: 1,
          passes: 0,
          status: 'active',
        };
    return { ...queue, [id]: next };
  }

  if (existing && existing.status === 'active' && attempt.score >= 0.7) {
    if (existing.lastPassDay === day) return queue;
    const passes = existing.passes + 1;
    const resolved = passes >= 2;
    return {
      ...queue,
      [id]: {
        ...existing,
        passes,
        lastPassDay: day,
        status: resolved ? 'resolved' : 'active',
        resolvedAt: resolved ? attempt.at : undefined,
      },
    };
  }
  return queue;
}

/** Skill-level weaknesses (from calibration) resolve once the skill is demonstrably solid. */
export function resolveSkillWeaknesses(
  queue: Record<string, Weakness>,
  masteryBySkill: Record<string, { mastery: number; items: number }>,
  now = new Date().toISOString(),
): Record<string, Weakness> {
  let changed = false;
  const out = { ...queue };
  for (const w of Object.values(queue)) {
    if (w.status !== 'active' || w.itemId) continue;
    const m = masteryBySkill[w.skill];
    if (m && m.items >= 5 && m.mastery >= 70) {
      out[w.id] = { ...w, status: 'resolved', resolvedAt: now };
      changed = true;
    }
  }
  return changed ? out : queue;
}

/** Active weaknesses, repeat mistakes first, then lowest score, then oldest. */
export function activeQueue(queue: Record<string, Weakness>): Weakness[] {
  return Object.values(queue)
    .filter((w) => w.status === 'active')
    .sort((a, b) => b.mistakes - a.mistakes || a.score - b.score || a.addedAt.localeCompare(b.addedAt));
}

/** "Same mistake twice blocks progression": items missed two or more times. */
export function repeatedMistakes(queue: Record<string, Weakness>): Weakness[] {
  return activeQueue(queue).filter((w) => w.mistakes >= 2);
}
