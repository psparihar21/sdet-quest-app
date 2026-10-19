import { z } from 'zod';
import { SKILLS } from '@/content/types';
import type { Attempt, ItemType, ProgressState, Weakness } from './types';
import { newCard } from '@/lib/srs';
import { toDay } from '@/lib/dates';

/**
 * A profile pack is a private JSON file (never committed or deployed) holding the learner's
 * own profile, baseline diagnostic scores and self-ratings. Importing it personalises the app
 * on this device only.
 */
export const profilePackSchema = z.object({
  kind: z.literal('sdet-quest-profile'),
  version: z.literal(1),
  profile: z.object({
    name: z.string(),
    headline: z.string(),
    primaryLanguage: z.enum(['javascript', 'java', 'typescript']),
    targetRoles: z.array(z.string()),
    cvFacts: z.array(z.string()),
  }),
  diagnostics: z
    .array(
      z.object({
        id: z.string(),
        skill: z.enum(SKILLS),
        topic: z.string(),
        score: z.number().min(0).max(1),
        at: z.string(),
        relatedItems: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  selfRatings: z
    .array(z.object({ skill: z.enum(SKILLS), topic: z.string(), rating: z.number().min(1).max(5), at: z.string() }))
    .default([]),
});
export type ProfilePack = z.infer<typeof profilePackSchema>;

/** Merge a validated pack into state. Re-importing the same pack is idempotent. */
export function applyProfilePack(state: ProgressState, pack: ProfilePack, today = toDay()): ProgressState {
  const attempts: Attempt[] = state.attempts.filter((a) => !(a.itemType === 'diagnostic' && pack.diagnostics.some((d) => d.id === a.itemId)));
  const weaknesses: Record<string, Weakness> = { ...state.weaknesses };
  const srs = { ...state.srs };

  for (const d of pack.diagnostics) {
    attempts.push({ id: `diag_${d.id}`, itemId: d.id, itemType: 'diagnostic', skill: d.skill, score: d.score, correct: d.score >= 0.7, at: d.at, detail: { topic: d.topic } });
    if (d.score < 0.6) {
      const id = `w:diagnostic:${d.id}`;
      weaknesses[id] ??= { id, skill: d.skill, topic: d.topic, source: 'calibration', score: d.score, addedAt: d.at, mistakes: 1, passes: 0, status: 'active' };
      for (const ref of d.relatedItems) {
        // "type:id" (e.g. "problem:js-find-duplicates"); a bare id means a question.
        const [type, item] = ref.includes(':') ? (ref.split(':') as [ItemType, string]) : (['question', ref] as [ItemType, string]);
        const card = newCard(type, item, d.skill, today);
        srs[card.id] ??= { ...card, due: today };
      }
    }
  }
  for (const r of pack.selfRatings) {
    if (r.rating > 2) continue;
    const id = `w:self:${r.skill}:${r.topic}`;
    weaknesses[id] ??= { id, skill: r.skill, topic: r.topic, source: 'self-rating', score: r.rating / 5, addedAt: r.at, mistakes: 0, passes: 0, status: 'active' };
  }
  return {
    ...state,
    profile: { ...pack.profile, importedAt: new Date().toISOString() },
    attempts,
    weaknesses,
    srs,
  };
}
