import type { Attempt, ItemType } from '@/store/types';
import { toDay } from './dates';

/** Max XP per item type. Earned as best-score × weight, once per item, so repeat clicking earns nothing. */
export const XP_WEIGHT: Record<ItemType, number> = {
  question: 10,
  flashcard: 2,
  problem: 40,
  interview: 30,
  diagnostic: 0,
  build: 50,
};

/** Successful spaced-repetition reviews earn a small bonus: retention is the point. */
export const REVIEW_BONUS = 5;

export function totalXp(attempts: Attempt[]): number {
  const best = new Map<string, { score: number; type: ItemType }>();
  let bonus = 0;
  for (const a of attempts) {
    const key = `${a.itemType}:${a.itemId}`;
    const prev = best.get(key);
    if (!prev || a.score > prev.score) best.set(key, { score: a.score, type: a.itemType });
    if (a.detail?.review === true && a.correct) bonus += REVIEW_BONUS;
  }
  let xp = bonus;
  for (const { score, type } of best.values()) xp += Math.round(score * XP_WEIGHT[type]);
  return xp;
}

/** Level curve: each level needs a little more than the last (L2 at 100 XP, L5 ≈ 1,000, L10 ≈ 4,500). */
export function levelFor(xp: number): { level: number; current: number; next: number; progress: number } {
  let level = 1;
  let floor = 0;
  let need = 100;
  while (xp >= floor + need) {
    floor += need;
    level += 1;
    need = Math.round(100 + (level - 1) * 50);
  }
  return { level, current: xp - floor, next: need, progress: (xp - floor) / need };
}

/** Distinct days with at least one graded attempt. Missing days are never penalised. */
export function activeDays(attempts: Attempt[]): string[] {
  return [...new Set(attempts.filter((a) => a.itemType !== 'diagnostic').map((a) => toDay(new Date(a.at))))].sort();
}

/** Current run of consecutive active days ending today or yesterday (shown, never punished). */
export function currentStreak(attempts: Attempt[], today = toDay()): number {
  const days = new Set(activeDays(attempts));
  const cursor = new Date(`${today}T12:00:00`);
  if (!days.has(today)) cursor.setDate(cursor.getDate() - 1);
  let n = 0;
  while (days.has(toDay(cursor))) {
    n += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return n;
}

export function attemptsToday(attempts: Attempt[], today = toDay()): number {
  return attempts.filter((a) => a.itemType !== 'diagnostic' && toDay(new Date(a.at)) === today).length;
}
