import type { Skill } from '@/content/types';
import type { Attempt } from '@/store/types';
import { allMastery } from './mastery';

/** Role weightings carried over from the original PROGRESS.md tracker. */
export const ROLE_WEIGHTS = {
  sdet3: {
    label: 'SDET 3',
    weights: { java: 15, dsa: 10, selenium: 10, playwright: 15, api: 10, sql: 5, framework: 15, cicd: 10, systemDesign: 10 },
  },
  qaLead: {
    label: 'QA Lead',
    weights: { leadership: 30, qaStrategy: 25, metrics: 15, behavioral: 20, systemDesign: 10 },
  },
  aiQa: {
    label: 'AI / Agentic QA',
    weights: { ai: 40, agents: 35, mcp: 25 },
  },
} satisfies Record<string, { label: string; weights: Partial<Record<Skill, number>> }>;

export type Role = keyof typeof ROLE_WEIGHTS;

export interface Readiness {
  role: Role;
  label: string;
  /** 0..100 weighted mastery. An estimate from practice data, not a prediction of interview outcome. */
  score: number;
  /** 0..100 share of the role's weight that has any assessment evidence at all. */
  coverage: number;
  /** Average mock-interview technical score for this role's skills (0..10), if any. */
  mockAverage?: number;
  gaps: { skill: Skill; mastery: number; weight: number }[];
}

export function readiness(role: Role, attempts: Attempt[]): Readiness {
  const { label, weights } = ROLE_WEIGHTS[role];
  const m = allMastery(attempts);
  const entries = Object.entries(weights) as [Skill, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let score = 0;
  let covered = 0;
  for (const [skill, w] of entries) {
    score += (m[skill].mastery * w) / total;
    if (m[skill].items > 0) covered += w;
  }
  const roleSkills = new Set(entries.map(([s]) => s));
  const interviewAttempts = attempts.filter((a) => a.itemType === 'interview' && roleSkills.has(a.skill));
  const mockAverage = interviewAttempts.length
    ? Math.round((interviewAttempts.reduce((s, a) => s + a.score, 0) / interviewAttempts.length) * 100) / 10
    : undefined;
  const gaps = entries
    .map(([skill, weight]) => ({ skill, weight, mastery: m[skill].mastery }))
    .sort((a, b) => a.mastery - b.mastery || b.weight - a.weight);
  return { role, label, score: Math.round(score), coverage: Math.round((covered / total) * 100), mockAverage, gaps };
}

export function allReadiness(attempts: Attempt[]): Readiness[] {
  return (Object.keys(ROLE_WEIGHTS) as Role[]).map((r) => readiness(r, attempts));
}
