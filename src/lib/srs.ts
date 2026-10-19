import type { ItemType, SrsCard } from '@/store/types';
import type { Skill } from '@/content/types';
import { addDays, toDay } from './dates';

/**
 * Review ladder in days. The first four steps mirror the original study plan
 * (Day 1 re-teach, Day 3 recall, Day 7 applied scenario, Day 21 interview question);
 * later steps keep mastered items warm without crowding the queue.
 */
export const LADDER = [1, 3, 7, 21, 45, 90] as const;

/** Score at or above this counts as a successful recall. */
export const PASS = 0.7;

export function cardId(itemType: ItemType, itemId: string): string {
  return `${itemType}:${itemId}`;
}

export function newCard(itemType: ItemType, itemId: string, skill: Skill, today = toDay()): SrsCard {
  return { id: cardId(itemType, itemId), itemId, itemType, skill, step: 0, due: addDays(today, LADDER[0]), lapses: 0, reviews: 0 };
}

/**
 * Apply a graded review. Pass moves one rung up the ladder; a fail drops back to
 * the first rung (due tomorrow) and counts a lapse. A near-miss (0.5–0.7) holds the rung.
 */
export function review(card: SrsCard, score: number, today = toDay()): SrsCard {
  let step = card.step;
  let lapses = card.lapses;
  if (score >= PASS) step = Math.min(step + 1, LADDER.length - 1);
  else if (score >= 0.5) step = Math.max(step, 0);
  else {
    step = 0;
    lapses += 1;
  }
  return { ...card, step, lapses, reviews: card.reviews + 1, lastScore: score, due: addDays(today, LADDER[step]) };
}

export function isDue(card: SrsCard, today = toDay()): boolean {
  return card.due <= today;
}

/** Due cards, most-lapsed and most-overdue first. */
export function dueCards(cards: Record<string, SrsCard>, today = toDay()): SrsCard[] {
  return Object.values(cards)
    .filter((c) => isDue(c, today))
    .sort((a, b) => b.lapses - a.lapses || a.due.localeCompare(b.due) || a.step - b.step);
}

/** Cards coming due in the next `days` days, grouped by date (for the revision calendar). */
export function upcoming(cards: Record<string, SrsCard>, days: number, today = toDay()): Record<string, number> {
  const out: Record<string, number> = {};
  for (let i = 0; i <= days; i++) out[addDays(today, i)] = 0;
  for (const c of Object.values(cards)) {
    const key = c.due < today ? today : c.due;
    if (key in out) out[key] += 1;
  }
  return out;
}
