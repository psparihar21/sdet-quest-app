import {
  flashcardSchema,
  interviewQuestionSchema,
  moduleSchema,
  problemSchema,
  questionSchema,
  type Flashcard,
  type InterviewMode,
  type InterviewQuestion,
  type Module,
  type Problem,
  type Question,
} from './types';
import type { ModuleBundle } from './bundle';
import { OUTLINE } from './outline';
import { AUTHORED } from './modules';

/** Parse every authored bundle through its schema so defaults are filled and bad content fails loudly. */
const bundles = new Map<string, ModuleBundle>(AUTHORED.map((b) => [b.module.id, b]));

export const MODULES: Module[] = OUTLINE.map((meta) => {
  const authored = bundles.get(meta.id);
  return moduleSchema.parse(authored ? authored.module : { ...meta, lessons: [] });
});

export const QUESTIONS: Question[] = AUTHORED.flatMap((b) => b.questions.map((q) => questionSchema.parse(q)));
export const PROBLEMS: Problem[] = AUTHORED.flatMap((b) => b.problems.map((p) => problemSchema.parse(p)));
export const INTERVIEWS: InterviewQuestion[] = AUTHORED.flatMap((b) => b.interviews.map((q) => interviewQuestionSchema.parse(q)));
export const FLASHCARDS: Flashcard[] = AUTHORED.flatMap((b) => b.flashcards.map((f) => flashcardSchema.parse(f)));

const byId = <T extends { id: string }>(xs: T[]) => new Map(xs.map((x) => [x.id, x]));
const moduleMap = byId(MODULES);
const questionMap = byId(QUESTIONS);
const problemMap = byId(PROBLEMS);
const interviewMap = byId(INTERVIEWS);
const flashcardMap = byId(FLASHCARDS);

export const getModule = (id: string) => moduleMap.get(id);
export const getQuestion = (id: string) => questionMap.get(id);
export const getProblem = (id: string) => problemMap.get(id);
export const getInterview = (id: string) => interviewMap.get(id);
export const getFlashcard = (id: string) => flashcardMap.get(id);

export function findLesson(lessonId: string) {
  for (const m of MODULES) {
    const i = m.lessons.findIndex((l) => l.id === lessonId);
    if (i >= 0) return { module: m, lesson: m.lessons[i], index: i };
  }
  return undefined;
}

export const isAuthored = (moduleId: string) => (moduleMap.get(moduleId)?.lessons.length ?? 0) > 0;

export function interviewsForMode(mode: InterviewMode): InterviewQuestion[] {
  return INTERVIEWS.filter((q) => q.modes.includes(mode));
}

/** Human label for any assessable item (used by the weakness queue and revision). */
export function itemLabel(itemType: string, itemId: string): string {
  if (itemType === 'question') return getQuestion(itemId)?.prompt.replace(/\*\*/g, '').slice(0, 90) ?? itemId;
  if (itemType === 'problem') return getProblem(itemId)?.title ?? itemId;
  if (itemType === 'interview') return getInterview(itemId)?.prompt.slice(0, 90) ?? itemId;
  if (itemType === 'flashcard') return getFlashcard(itemId)?.front ?? itemId;
  return itemId;
}

export function lessonCount(): number {
  return MODULES.reduce((s, m) => s + m.lessons.length, 0);
}
