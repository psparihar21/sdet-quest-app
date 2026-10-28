import { SKILLS, type Skill } from '@/content/types';
import type { Attempt } from '@/store/types';

/** Distinct assessed items needed before a mastery number is treated as fully evidenced. */
export const EVIDENCE_TARGET = 6;

export interface SkillMastery {
  skill: Skill;
  /** 0..100. Accuracy on the latest attempt per item, scaled down while evidence is thin. */
  mastery: number;
  /** 0..100 raw accuracy on the latest attempt per item. */
  accuracy: number;
  items: number;
  attempts: number;
  lastAt?: string;
}

/** Latest attempt per item: retrying an item replaces its old score instead of piling up points. */
export function latestByItem(attempts: Attempt[]): Map<string, Attempt> {
  const latest = new Map<string, Attempt>();
  for (const a of attempts) {
    const key = `${a.itemType}:${a.itemId}`;
    const prev = latest.get(key);
    if (!prev || prev.at <= a.at) latest.set(key, a);
  }
  return latest;
}

export function skillMastery(attempts: Attempt[], skill: Skill): SkillMastery {
  const mine = attempts.filter((a) => a.skill === skill);
  const latest = [...latestByItem(mine).values()];
  if (latest.length === 0) return { skill, mastery: 0, accuracy: 0, items: 0, attempts: 0 };
  const accuracy = latest.reduce((s, a) => s + a.score, 0) / latest.length;
  const confidence = Math.min(1, latest.length / EVIDENCE_TARGET);
  const lastAt = mine.reduce((m, a) => (a.at > m ? a.at : m), mine[0].at);
  return {
    skill,
    mastery: Math.round(accuracy * confidence * 100),
    accuracy: Math.round(accuracy * 100),
    items: latest.length,
    attempts: mine.length,
    lastAt,
  };
}

export function allMastery(attempts: Attempt[]): Record<Skill, SkillMastery> {
  return Object.fromEntries(SKILLS.map((s) => [s, skillMastery(attempts, s)])) as Record<Skill, SkillMastery>;
}

export function masteryLabel(m: SkillMastery): string {
  if (m.items === 0) return 'Not assessed';
  // With only one or two answers the accuracy is real but too thin to call a level.
  if (m.items < 3) return 'Early signal';
  if (m.mastery >= 80) return 'Strong';
  if (m.mastery >= 60) return 'Solid';
  if (m.mastery >= 35) return 'Developing';
  return 'Weak';
}

/** Skills with evidence, weakest first. */
export function weakestSkills(attempts: Attempt[], n = 3): SkillMastery[] {
  return Object.values(allMastery(attempts))
    .filter((m) => m.items > 0)
    .sort((a, b) => a.accuracy - b.accuracy || a.mastery - b.mastery)
    .slice(0, n);
}
