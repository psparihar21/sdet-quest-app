import { mergeStates } from '@/lib/merge';
import { initialState, parseBackup, recordAttemptReducer } from '@/store/progress';
import type { ProgressState } from '@/store/types';

const day = (d: string) => new Date(`${d}T10:00:00`);
const answer = (s: ProgressState, itemId: string, score: number, d: string) => recordAttemptReducer(s, { itemId, itemType: 'question', skill: 'api', score, topic: itemId }, day(d));

describe('mergeStates', () => {
  it('keeps every attempt from both devices, once, in time order', () => {
    const shared = answer(initialState(), 'q1', 1, '2026-11-01');
    const phone = answer(shared, 'q2', 0, '2026-11-03');
    const laptop = answer(shared, 'q3', 1, '2026-11-02');
    const merged = mergeStates(phone, laptop);
    expect(merged.attempts.map((a) => a.itemId)).toEqual(['q1', 'q3', 'q2']);
    // Merging is stable: syncing twice, or from the other side, changes nothing.
    expect(mergeStates(merged, laptop).attempts).toHaveLength(3);
    expect(mergeStates(laptop, phone).attempts.map((a) => a.id).sort()).toEqual(merged.attempts.map((a) => a.id).sort());
  });

  it('keeps the revision card that was reviewed more, and the weakness from a miss', () => {
    const shared = answer(initialState(), 'q1', 1, '2026-11-01');
    const phone = answer(shared, 'q1', 1, '2026-11-02'); // due review passed: one rung up
    const merged = mergeStates(shared, phone);
    expect(merged.srs['question:q1']).toEqual(phone.srs['question:q1']);
    const missed = answer(shared, 'q9', 0, '2026-11-02');
    expect(Object.values(mergeStates(shared, missed).weaknesses).map((w) => w.topic)).toContain('q9');
  });

  it('unions lesson steps and bookmarks, and keeps device settings local', () => {
    const phone: ProgressState = { ...initialState(), lessons: { l1: { done: [0, 2] } }, bookmarks: ['l1'], settings: { ...initialState().settings, theme: 'light' } };
    const laptop: ProgressState = { ...initialState(), lessons: { l1: { done: [1], completedAt: '2026-11-02T00:00:00Z' }, l2: { done: [0] } }, bookmarks: ['l2'] };
    const merged = mergeStates(phone, laptop);
    expect(merged.lessons.l1).toEqual({ done: [0, 1, 2], completedAt: '2026-11-02T00:00:00Z' });
    expect(merged.lessons.l2).toEqual({ done: [0] });
    expect(merged.bookmarks.sort()).toEqual(['l1', 'l2']);
    expect(merged.settings.theme).toBe('light');
  });

  it('produces a state that passes the same validation as a backup', () => {
    const merged = mergeStates(answer(initialState(), 'q1', 0, '2026-11-01'), answer(initialState(), 'q2', 1, '2026-11-02'));
    expect(() => parseBackup(JSON.stringify({ app: 'sdet-quest', state: merged }))).not.toThrow();
  });
});
