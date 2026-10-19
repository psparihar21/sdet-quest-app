import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { z } from 'zod';
import type { InterviewMode, Skill } from '@/content/types';
import { cardId, newCard, review } from '@/lib/srs';
import { applyAttempt, resolveSkillWeaknesses } from '@/lib/weakness';
import { allMastery } from '@/lib/mastery';
import { uid } from '@/lib/dates';
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
  /** Set by the Revision Center: counts as a spaced-repetition review. */
  review?: boolean;
}

/** Pure reducer for a graded attempt: attempt log + SRS card + weakness queue. */
export function recordAttemptReducer(state: ProgressState, input: RecordInput, now = new Date()): ProgressState {
  const score = Math.max(0, Math.min(1, input.score));
  const attempt: Attempt = {
    id: uid('att'),
    itemId: input.itemId,
    itemType: input.itemType,
    skill: input.skill,
    moduleId: input.moduleId,
    score,
    correct: score >= 0.7,
    at: now.toISOString(),
    detail: { ...input.detail, ...(input.review ? { review: true } : {}) },
  };
  const attempts = [...state.attempts, attempt];
  const id = cardId(input.itemType, input.itemId);
  const existing = state.srs[id];
  // Self-assessed build tasks are not scheduled for spaced repetition.
  const srs = input.itemType === 'build' ? state.srs : { ...state.srs, [id]: review(existing ?? newCard(input.itemType, input.itemId, input.skill), score) };
  let weaknesses = applyAttempt(state.weaknesses, attempt, input.topic);
  weaknesses = resolveSkillWeaknesses(weaknesses, allMastery(attempts), attempt.at);
  return { ...state, attempts, srs, weaknesses };
}

const looseStateSchema = z
  .object({
    schemaVersion: z.number(),
    attempts: z.array(z.object({ itemId: z.string(), itemType: z.string(), skill: z.string(), score: z.number(), at: z.string() }).passthrough()),
    srs: z.record(z.unknown()),
    weaknesses: z.record(z.unknown()),
  })
  .passthrough();

/** Validate an exported backup before it replaces local progress. */
export function parseBackup(json: string): ProgressState {
  const data = JSON.parse(json);
  const state = data?.state ?? data;
  looseStateSchema.parse(state);
  return migrate(state, state.schemaVersion);
}

/** Schema migrations. Each version bump adds a step here so old saves keep loading. */
export function migrate(persisted: unknown, fromVersion: number): ProgressState {
  const base = initialState();
  const s = (persisted ?? {}) as Partial<ProgressState>;
  if (fromVersion > SCHEMA_VERSION) throw new Error('This backup comes from a newer version of SDET Quest.');
  // v1 is the first schema: fill in any missing collections defensively.
  return {
    ...base,
    ...s,
    settings: { ...base.settings, ...s.settings },
    profile: { ...base.profile, ...s.profile },
    schemaVersion: SCHEMA_VERSION,
  };
}

interface Actions {
  recordAttempt: (input: RecordInput) => Attempt;
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
      migrate: (persisted, version) => migrate(persisted, version),
      partialize: (s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { recordAttempt, markSection, saveDraft, setNote, toggleBookmark, startInterview, answerInterview, finishInterview, setProjectTask, saveStory, deleteStory, updateSettings, importProfilePack, replaceState, reset, ...data } = s;
        return data;
      },
    },
  ),
);

/** Snapshot of persisted data only (no actions), for export. */
export function exportState(): string {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { recordAttempt, markSection, saveDraft, setNote, toggleBookmark, startInterview, answerInterview, finishInterview, setProjectTask, saveStory, deleteStory, updateSettings, importProfilePack, replaceState, reset, ...data } = useProgress.getState();
  return JSON.stringify({ app: 'sdet-quest', exportedAt: new Date().toISOString(), state: data }, null, 2);
}
