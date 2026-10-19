import { activeQueue, applyAttempt, repeatedMistakes, resolveSkillWeaknesses } from '@/lib/weakness';
import type { Attempt, Weakness } from '@/store/types';

function att(score: number, at: string, itemId = 'q1'): Attempt {
  return { id: at, itemId, itemType: 'question', skill: 'api', score, correct: score >= 0.7, at };
}

describe('weakness queue', () => {
  it('adds a weakness on a low score and tracks repeat mistakes', () => {
    let q = applyAttempt({}, att(0, '2026-10-19T09:00:00Z'), 'HTTP status codes');
    expect(activeQueue(q)).toHaveLength(1);
    expect(repeatedMistakes(q)).toHaveLength(0);
    q = applyAttempt(q, att(0.3, '2026-10-19T10:00:00Z'), 'HTTP status codes');
    expect(repeatedMistakes(q)[0].topic).toBe('HTTP status codes');
  });

  it('needs passes on two different days to resolve', () => {
    let q = applyAttempt({}, att(0, '2026-10-19T09:00:00Z'), 't');
    q = applyAttempt(q, att(1, '2026-10-19T11:00:00Z'), 't');
    q = applyAttempt(q, att(1, '2026-10-19T12:00:00Z'), 't');
    expect(activeQueue(q)).toHaveLength(1);
    q = applyAttempt(q, att(1, '2026-10-21T12:00:00Z'), 't');
    expect(activeQueue(q)).toHaveLength(0);
  });

  it('a correct answer on an item that was never weak changes nothing', () => {
    const q = {};
    expect(applyAttempt(q, att(1, '2026-10-19T09:00:00Z'), 't')).toBe(q);
  });

  it('resolves skill-level calibration weaknesses once mastery is proven', () => {
    const w: Weakness = { id: 'w', skill: 'dsa', topic: 'DSA', source: 'calibration', score: 0, addedAt: '', mistakes: 1, passes: 0, status: 'active' };
    expect(resolveSkillWeaknesses({ w }, { dsa: { mastery: 50, items: 6 } }).w.status).toBe('active');
    expect(resolveSkillWeaknesses({ w }, { dsa: { mastery: 75, items: 6 } }).w.status).toBe('resolved');
  });
});
