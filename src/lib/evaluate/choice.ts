import type { Question } from '@/content/types';

export interface ChoiceResult {
  correct: boolean;
  /** 0..1. Multi-select gets partial credit: (hits − wrong picks) / answers, floored at 0. */
  score: number;
  missed: string[];
  wrongPicks: string[];
  /** Misconception notes for the wrong options the learner picked. */
  notes: string[];
}

export function evaluateChoice(q: Question, selected: string[]): ChoiceResult {
  const answer = new Set(q.answer);
  const picked = new Set(selected);
  const hits = [...picked].filter((id) => answer.has(id));
  const wrongPicks = [...picked].filter((id) => !answer.has(id));
  const missed = [...answer].filter((id) => !picked.has(id));
  const correct = wrongPicks.length === 0 && missed.length === 0;
  const score = correct ? 1 : q.type === 'multi' ? Math.max(0, (hits.length - wrongPicks.length) / answer.size) : 0;
  const notes = wrongPicks.map((id) => q.misconceptions?.[id]).filter((n): n is string => Boolean(n));
  return { correct, score: Math.round(score * 100) / 100, missed, wrongPicks, notes };
}
