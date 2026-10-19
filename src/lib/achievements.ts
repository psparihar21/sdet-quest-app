import type { ProgressState } from '@/store/types';
import { latestByItem } from './mastery';
import { activeDays } from './xp';
import { toDay } from './dates';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  /** 0..1 progress toward the badge. Earned at 1. */
  progress: (s: ProgressState) => number;
}

const correct = (s: ProgressState, type?: string) =>
  [...latestByItem(s.attempts.filter((a) => (type ? a.itemType === type : a.itemType !== 'diagnostic'))).values()].filter((a) => a.correct).length;

/** Badges reward demonstrated understanding (correct answers, solved problems, retention), never time spent or clicks. */
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-blood', title: 'First correct answer', description: 'Answer any question correctly.', progress: (s) => Math.min(1, correct(s, 'question')) },
  { id: 'sharp-25', title: 'Sharp', description: '25 different questions answered correctly.', progress: (s) => Math.min(1, correct(s, 'question') / 25) },
  { id: 'coder', title: 'Green tests', description: 'Solve a coding problem with all tests passing.', progress: (s) => Math.min(1, correct(s, 'problem')) },
  { id: 'coder-10', title: 'Pattern hunter', description: 'Solve 10 different coding problems.', progress: (s) => Math.min(1, correct(s, 'problem') / 10) },
  {
    id: 'sql-sleuth', title: 'SQL sleuth', description: 'Solve 3 SQL problems.',
    progress: (s) => Math.min(1, [...latestByItem(s.attempts.filter((a) => a.itemType === 'problem' && a.skill === 'sql')).values()].filter((a) => a.correct).length / 3),
  },
  {
    id: 'interview-7', title: 'Interview-ready answer', description: 'Score 7+/10 on an interview question.',
    progress: (s) => Math.min(1, Math.max(0, ...s.attempts.filter((a) => a.itemType === 'interview').map((a) => a.score)) / 0.7),
  },
  {
    id: 'retention', title: 'It stuck', description: 'Pass 10 spaced-repetition reviews.',
    progress: (s) => Math.min(1, s.attempts.filter((a) => a.detail?.review === true && a.correct).length / 10),
  },
  {
    id: 'weakness-slayer', title: 'Weakness slayer', description: 'Resolve a weakness by passing it on two different days.',
    progress: (s) => Math.min(1, Object.values(s.weaknesses).filter((w) => w.status === 'resolved').length),
  },
  { id: 'module-done', title: 'Module complete', description: 'Finish every lesson in a module.', progress: (s) => Math.min(1, Object.values(s.lessons).filter((l) => l.completedAt).length / 3) },
  { id: 'boss', title: 'Boss battle survived', description: 'Finish a full SDET 3 or QA Lead mock interview.', progress: (s) => (s.interviews.some((i) => i.finishedAt && (i.mode === 'full-sdet3' || i.mode === 'full-qa-lead')) ? 1 : 0) },
  { id: 'story', title: 'Story bank', description: 'Write 3 STAR stories from your real experience.', progress: (s) => Math.min(1, s.stories.length / 3) },
  { id: 'rhythm', title: 'Study rhythm', description: 'Practise on 5 different days (gaps are fine).', progress: (s) => Math.min(1, activeDays(s.attempts).length / 5) },
];

export interface Quest {
  id: string;
  title: string;
  target: number;
  current: number;
  to: string;
}

/** Today's quests, derived from today's real attempts. No penalties if they're skipped. */
export function dailyQuests(s: ProgressState, dueCount: number, today = toDay()): Quest[] {
  const todays = s.attempts.filter((a) => a.itemType !== 'diagnostic' && toDay(new Date(a.at)) === today);
  const quests: Quest[] = [];
  const reviewsToday = todays.filter((a) => a.detail?.review === true).length;
  if (dueCount > 0 || reviewsToday > 0) quests.push({ id: 'q-review', title: 'Clear your revision queue', target: Math.max(1, Math.min(10, reviewsToday + dueCount)), current: reviewsToday, to: '/revision' });
  quests.push({ id: 'q-correct', title: 'Answer 5 questions correctly', target: 5, current: todays.filter((a) => a.itemType === 'question' && a.correct).length, to: '/learn' });
  quests.push({ id: 'q-code', title: 'Solve one coding problem', target: 1, current: todays.filter((a) => a.itemType === 'problem' && a.correct).length, to: '/lab' });
  quests.push({ id: 'q-interview', title: 'Answer one interview question (6+/10)', target: 1, current: todays.filter((a) => a.itemType === 'interview' && a.score >= 0.6).length, to: '/arena' });
  return quests;
}
