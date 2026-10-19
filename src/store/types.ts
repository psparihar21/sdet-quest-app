import type { InterviewMode, Skill } from '@/content/types';

export const SCHEMA_VERSION = 1;

export type ItemType = 'question' | 'problem' | 'interview' | 'flashcard' | 'diagnostic' | 'build';

/** One graded attempt. All mastery, XP and analytics are derived from these. */
export interface Attempt {
  id: string;
  itemId: string;
  itemType: ItemType;
  skill: Skill;
  moduleId?: string;
  /** 0..1 */
  score: number;
  correct: boolean;
  at: string; // ISO
  /** Free-form evaluation details (selected options, failed tests, rubric hits...). */
  detail?: Record<string, unknown>;
}

/** Spaced-repetition card. Cards point at an item (question/flashcard/problem/interview). */
export interface SrsCard {
  id: string; // `${itemType}:${itemId}`
  itemId: string;
  itemType: ItemType;
  skill: Skill;
  step: number; // index into the review ladder
  due: string; // ISO date (yyyy-mm-dd)
  lapses: number;
  reviews: number;
  lastScore?: number;
}

export interface Weakness {
  id: string;
  skill: Skill;
  topic: string;
  /** Item that triggered it, if any (repeat mistakes on the same item are tracked). */
  itemId?: string;
  source: 'calibration' | 'self-rating' | 'assessment';
  score: number; // 0..1 at time of adding
  addedAt: string;
  mistakes: number;
  /** Successful re-attempts since it was added; two on different days resolve it. */
  passes: number;
  lastPassDay?: string;
  status: 'active' | 'resolved';
  resolvedAt?: string;
}

export interface InterviewAnswer {
  questionId: string;
  answer: string;
  at: string;
  technical: number; // 0..10
  depth: number;
  communication: number;
  covered: string[]; // rubric point ids
  selfAdjusted: boolean;
  seconds?: number;
}

export interface InterviewSession {
  id: string;
  mode: InterviewMode;
  startedAt: string;
  finishedAt?: string;
  questionIds: string[];
  answers: InterviewAnswer[];
  timed: boolean;
}

export interface LessonProgress {
  /** Section indexes the learner has worked through. */
  done: number[];
  completedAt?: string;
}

export interface StarStory {
  id: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  prompts: string[];
  updatedAt: string;
}

export interface Profile {
  name: string;
  headline: string;
  primaryLanguage: 'javascript' | 'java' | 'typescript';
  targetRoles: string[];
  /** Facts imported from the learner's own CV/profile pack. Only ever shown back to them. */
  cvFacts: string[];
  importedAt?: string;
}

export interface Settings {
  theme: 'dark' | 'light';
  motion: 'system' | 'reduce' | 'full';
  dailyGoal: number; // assessed items per day
  loadVideos: 'ask' | 'always';
}

export interface ProgressState {
  schemaVersion: number;
  createdAt: string;
  profile: Profile;
  settings: Settings;
  attempts: Attempt[];
  srs: Record<string, SrsCard>;
  weaknesses: Record<string, Weakness>;
  lessons: Record<string, LessonProgress>;
  interviews: InterviewSession[];
  projectTasks: Record<string, { done: boolean; notes: string; at: string }>;
  notes: Record<string, string>;
  bookmarks: string[];
  stories: StarStory[];
  /** Code drafts per problem so work survives refresh. */
  drafts: Record<string, string>;
}
