import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { z } from 'zod';
import { SKILLS, type InterviewMode, type Skill } from '@/content/types';
import { cardId, isDue, newCard, review } from '@/lib/srs';
import { applyAttempt, resolveSkillWeaknesses } from '@/lib/weakness';
import { allMastery } from '@/lib/mastery';
import { toDay, uid } from '@/lib/dates';
import { localRepository, STORAGE_KEY } from './repository';
import { applyProfilePack, type ProfilePack } from './profilePack';
import {
  SCHEMA_VERSION,
  type Attempt,
  type InterviewAnswer,
  type InterviewSession,
  type ItemType,
  type ProgressState,
  type Settings,
  type StarStory,
} from './types';

export function initialState(): ProgressState {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    profile: { name: '', headline: '', primaryLanguage: 'javascript', targetRoles: ['SDET 3', 'QA Lead'], cvFacts: [] },
    settings: { theme: 'dark', motion: 'system', dailyGoal: 10, loadVideos: 'ask' },
    attempts: [],
    srs: {},
    weaknesses: {},
    lessons: {},
    interviews: [],
    projectTasks: {},
    notes: {},
    bookmarks: [],
    stories: [],
    drafts: {},
  };
}

export interface RecordInput {
  itemId: string;
  itemType: ItemType;
  skill: Skill;
  moduleId?: string;
  score: number;
  /** Human-readable topic used if this lands in the weakness queue. */
  topic: string;
  detail?: Record<string, unknown>;
}

/** Below this an attempt counts as a lapse even when the card isn't due yet. */
const LAPSE_BELOW = 0.5;

/** Pure reducer for a graded attempt: attempt log + SRS card + weakness queue. */
export function recordAttemptReducer(state: ProgressState, input: RecordInput, now = new Date()): ProgressState {
  const score = Math.max(0, Math.min(1, input.score));
  const id = cardId(input.itemType, input.itemId);
  const existing = state.srs[id];
  const today = toDay(now);
  // Only an answer to a card that was actually due is a spaced review (earns the bonus, climbs the ladder).
  const isReview = !!existing && isDue(existing, today);
  const attempt: Attempt = {
    id: uid('att'),
    itemId: input.itemId,
    itemType: input.itemType,
    skill: input.skill,
    moduleId: input.moduleId,
    score,
    correct: score >= 0.7,
    at: now.toISOString(),
    detail: { ...input.detail, ...(isReview ? { review: true } : {}) },
  };
  const attempts = [...state.attempts, attempt];
  // New cards start at day 1; re-answering early never pushes a card further out, but a clear miss still resets it.
  const card = existing ?? newCard(input.itemType, input.itemId, input.skill, today);
  const nextCard = isReview || score < LAPSE_BELOW ? review(card, score, today) : card;
  // Self-assessed build tasks are not scheduled for spaced repetition.
  const srs = input.itemType === 'build' ? state.srs : { ...state.srs, [id]: nextCard };
  let weaknesses = applyAttempt(state.weaknesses, attempt, input.topic);
  weaknesses = resolveSkillWeaknesses(weaknesses, allMastery(attempts), attempt.at);
  return { ...state, attempts, srs, weaknesses };
}

const str = z.string().max(20000);
const attemptSchema = z
  .object({ id: str, itemId: str, itemType: z.enum(['question', 'problem', 'interview', 'flashcard', 'diagnostic', 'build']), skill: z.enum(SKILLS), score: z.number().min(0).max(1), correct: z.boolean(), at: str, moduleId: str.optional() })
  .passthrough();
const srsSchema = z.object({ id: str, itemId: str, itemType: attemptSchema.shape.itemType, skill: z.enum(SKILLS), step: z.number().int().min(0), due: str, lapses: z.number(), reviews: z.number() }).passthrough();
const weaknessSchema = z.object({ id: str, skill: z.enum(SKILLS), topic: str, source: z.enum(['calibration', 'self-rating', 'assessment']), score: z.number(), addedAt: str, mistakes: z.number(), passes: z.number().default(0), status: z.enum(['active', 'resolved']) }).passthrough();
const interviewSchema = z.object({ id: str, mode: str, startedAt: str, questionIds: z.array(str), answers: z.array(z.object({ questionId: str, technical: z.number(), depth: z.number(), communication: z.number() }).passthrough()), timed: z.boolean() }).passthrough();
const storySchema = z.object({ id: str, title: str, situation: str, task: str, action: str, result: str, prompts: z.array(str), updatedAt: str });

/** Every collection the UI maps over is validated, so a corrupted save or hostile backup can't crash rendering. */
const stateSchema = z.object({
  schemaVersion: z.number().default(SCHEMA_VERSION),
  attempts: z.array(attemptSchema).default([]),
  srs: z.record(z.string(), srsSchema).default({}),
  weaknesses: z.record(z.string(), weaknessSchema).default({}),
  lessons: z.record(z.string(), z.object({ done: z.array(z.number()), completedAt: str.optional() })).default({}),
  interviews: z.array(interviewSchema).default([]),
  projectTasks: z.record(z.string(), z.object({ done: z.boolean(), notes: str, at: str })).default({}),
  notes: z.record(z.string(), str).default({}),
  bookmarks: z.array(str).default([]),
  stories: z.array(storySchema).default([]),
  drafts: z.record(z.string(), str).default({}),
  settings: z.object({ theme: z.enum(['dark', 'light']), motion: z.enum(['system', 'reduce', 'full']), dailyGoal: z.number().int().min(1).max(100), loadVideos: z.enum(['ask', 'always']) }).partial().default({}),
  profile: z.object({ name: str, headline: str, primaryLanguage: z.enum(['javascript', 'java', 'typescript']), targetRoles: z.array(str), cvFacts: z.array(str), importedAt: str }).partial().default({}),
  createdAt: str.optional(),
});

/** Validate an exported backup before it replaces local progress. */
export function parseBackup(json: string): ProgressState {
  const data = JSON.parse(json);
  const state = data?.state ?? data;
  if (typeof state?.schemaVersion !== 'number') throw new Error('Not an SDET Quest backup.');
  return migrate(state, state.schemaVersion);
}

/** Schema migrations + validation. Each version bump adds a step here so old saves keep loading. Throws on invalid data. */
export function migrate(persisted: unknown, fromVersion: number): ProgressState {
  if (fromVersion > SCHEMA_VERSION) throw new Error('This backup comes from a newer version of SDET Quest.');
  const base = initialState();
  const s = stateSchema.parse(persisted ?? {}) as unknown as Partial<ProgressState>;
  return {
    ...base,
    ...s,
    settings: { ...base.settings, ...s.settings },
    profile: { ...base.profile, ...s.profile },
    schemaVersion: SCHEMA_VERSION,
  };
}

/** Rehydration guard: invalid saved data is set aside under a separate key and the app starts fresh instead of crashing. */
function safeMerge(persisted: unknown, current: Store): Store {
  try {
    return { ...current, ...migrate(persisted, (persisted as { schemaVersion?: number })?.schemaVersion ?? SCHEMA_VERSION) };
  } catch (e) {
    console.error('SDET Quest: saved progress was invalid and has been set aside.', e);
    try {
      localRepository.setItem(`${STORAGE_KEY}:corrupt-${Date.now()}`, JSON.stringify(persisted));
    } catch {
      // storage full or blocked: nothing more we can do
    }
    return current;
  }
}

interface Actions {
  recordAttempt: (input: RecordInput) => Attempt;
  rescoreAttempt: (id: string, score: number, detail: Record<string, unknown>) => void;
  markSection: (lessonId: string, index: number, total: number) => void;
  saveDraft: (problemId: string, code: string) => void;
  setNote: (key: string, text: string) => void;
  toggleBookmark: (key: string) => void;
  startInterview: (mode: InterviewMode, questionIds: string[], timed: boolean, id?: string) => string;
  answerInterview: (sessionId: string, answer: InterviewAnswer) => void;
  finishInterview: (sessionId: string) => void;
  setProjectTask: (taskId: string, done: boolean, notes?: string) => void;
  saveStory: (story: Omit<StarStory, 'updatedAt'>) => void;
  deleteStory: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  importProfilePack: (pack: ProfilePack) => void;
  replaceState: (state: ProgressState) => void;
  reset: () => void;
}

export type Store = ProgressState & Actions;

export const useProgress = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState(),

      recordAttempt: (input) => {
        const next = recordAttemptReducer(get(), input);
        set(next);
        return next.attempts[next.attempts.length - 1];
      },

      rescoreAttempt: (id, score, detail) =>
        set((s) => ({ attempts: s.attempts.map((a) => (a.id === id ? { ...a, score, correct: score >= 0.7, detail: { ...a.detail, ...detail } } : a)) })),

      markSection: (lessonId, index, total) =>
        set((s) => {
          const prev = s.lessons[lessonId] ?? { done: [] };
          if (prev.done.includes(index)) return s;
          const done = [...prev.done, index].sort((a, b) => a - b);
          const completedAt = prev.completedAt ?? (done.length >= total ? new Date().toISOString() : undefined);
          return { lessons: { ...s.lessons, [lessonId]: { done, completedAt } } };
        }),

      saveDraft: (problemId, code) => set((s) => ({ drafts: { ...s.drafts, [problemId]: code } })),
      setNote: (key, text) => set((s) => ({ notes: { ...s.notes, [key]: text } })),
      toggleBookmark: (key) =>
        set((s) => ({ bookmarks: s.bookmarks.includes(key) ? s.bookmarks.filter((b) => b !== key) : [...s.bookmarks, key] })),

      startInterview: (mode, questionIds, timed, id) => {
        if (id && get().interviews.some((iv) => iv.id === id)) return id;
        const session: InterviewSession = { id: id ?? uid('iv'), mode, startedAt: new Date().toISOString(), questionIds, answers: [], timed };
        set((s) => ({ interviews: [...s.interviews, session] }));
        return session.id;
      },
      answerInterview: (sessionId, answer) =>
        set((s) => ({
          interviews: s.interviews.map((iv) =>
            iv.id === sessionId ? { ...iv, answers: [...iv.answers.filter((a) => a.questionId !== answer.questionId), answer] } : iv,
          ),
        })),
      finishInterview: (sessionId) =>
        set((s) => ({ interviews: s.interviews.map((iv) => (iv.id === sessionId ? { ...iv, finishedAt: new Date().toISOString() } : iv)) })),

      setProjectTask: (taskId, done, notes) =>
        set((s) => ({
          projectTasks: { ...s.projectTasks, [taskId]: { done, notes: notes ?? s.projectTasks[taskId]?.notes ?? '', at: new Date().toISOString() } },
        })),

      saveStory: (story) =>
        set((s) => {
          const full = { ...story, updatedAt: new Date().toISOString() };
          const exists = s.stories.some((x) => x.id === story.id);
          return { stories: exists ? s.stories.map((x) => (x.id === story.id ? full : x)) : [...s.stories, full] };
        }),
      deleteStory: (id) => set((s) => ({ stories: s.stories.filter((x) => x.id !== id) })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      importProfilePack: (pack) => set((s) => applyProfilePack(s, pack)),
      replaceState: (state) => set({ ...initialState(), ...state }),
      reset: () => set(initialState()),
    }),
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => localRepository),
      // migrate only runs on a version change; merge runs on every load, so validation lives there.
      migrate: (persisted) => persisted as Store,
      merge: (persisted, current) => safeMerge(persisted, current),
      partialize: (s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { recordAttempt, rescoreAttempt, markSection, saveDraft, setNote, toggleBookmark, startInterview, answerInterview, finishInterview, setProjectTask, saveStory, deleteStory, updateSettings, importProfilePack, replaceState, reset, ...data } = s;
        return data;
      },
    },
  ),
);

/** Snapshot of persisted data only (no actions), for export. */
export function exportState(): string {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { recordAttempt, rescoreAttempt, markSection, saveDraft, setNote, toggleBookmark, startInterview, answerInterview, finishInterview, setProjectTask, saveStory, deleteStory, updateSettings, importProfilePack, replaceState, reset, ...data } = useProgress.getState();
  return JSON.stringify({ app: 'sdet-quest', exportedAt: new Date().toISOString(), state: data }, null, 2);
}
