import { MODULES, getFlashcard, getInterview, getProblem, getQuestion } from './index';
import type { Module, Skill } from './types';

export interface ItemLocation {
  moduleId: string;
  lessonId?: string;
  sectionIndex?: number;
}

const index = new Map<string, ItemLocation>();
for (const m of MODULES) {
  for (const l of m.lessons) {
    l.sections.forEach((s, i) => {
      const loc = { moduleId: m.id, lessonId: l.id, sectionIndex: i };
      if (s.kind === 'check') s.questionIds.forEach((q) => index.set(`question:${q}`, loc));
      if (s.kind === 'practice') index.set(`problem:${s.problemId}`, loc);
      if (s.kind === 'interview') index.set(`interview:${s.interviewId}`, loc);
    });
  }
}

/** Where an item is taught, so revision and weaknesses can link back to the lesson. */
export function locate(itemType: string, itemId: string): ItemLocation | undefined {
  const hit = index.get(`${itemType}:${itemId}`);
  if (hit) return hit;
  const moduleId =
    (itemType === 'question' && getQuestion(itemId)?.moduleId) ||
    (itemType === 'problem' && getProblem(itemId)?.moduleId) ||
    (itemType === 'flashcard' && getFlashcard(itemId)?.moduleId) ||
    (itemType === 'interview' && getInterview(itemId)?.revision[0]) ||
    undefined;
  return moduleId ? { moduleId } : undefined;
}

export function lessonPath(loc: ItemLocation): string {
  return loc.lessonId ? `/learn/${loc.moduleId}/${loc.lessonId}` : `/learn/${loc.moduleId}`;
}

/** First authored module that teaches a skill (for skill-level weaknesses). */
export function moduleForSkill(skill: Skill): Module | undefined {
  return MODULES.find((m) => m.skills[0] === skill && m.lessons.length > 0) ?? MODULES.find((m) => m.skills.includes(skill) && m.lessons.length > 0) ?? MODULES.find((m) => m.skills.includes(skill));
}
