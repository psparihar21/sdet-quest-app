import { skillMastery, weakestSkills, EVIDENCE_TARGET } from '@/lib/mastery';
import { readiness } from '@/lib/readiness';
import { totalXp, levelFor, currentStreak } from '@/lib/xp';
import type { Attempt } from '@/store/types';

let n = 0;
function att(p: Partial<Attempt>): Attempt {
  n += 1;
  return { id: `a${n}`, itemId: `i${n}`, itemType: 'question', skill: 'dsa', score: 1, correct: true, at: `2026-10-${String(10 + (n % 9)).padStart(2, '0')}T10:00:00.000Z`, ...p };
}

describe('mastery', () => {
  it('is zero without evidence', () => {
    expect(skillMastery([], 'java')).toMatchObject({ mastery: 0, items: 0 });
  });

  it('scales by evidence until the target item count', () => {
    const one = skillMastery([att({ skill: 'java' })], 'java');
    expect(one.accuracy).toBe(100);
    expect(one.mastery).toBe(Math.round(100 / EVIDENCE_TARGET));
  });

  it('uses only the latest attempt per item (retries replace, they do not stack)', () => {
    const attempts = [
      att({ itemId: 'x', score: 0, at: '2026-10-01T00:00:00Z' }),
      att({ itemId: 'x', score: 1, at: '2026-10-02T00:00:00Z' }),
    ];
    expect(skillMastery(attempts, 'dsa')).toMatchObject({ accuracy: 100, items: 1, attempts: 2 });
  });

  it('orders weakest skills by accuracy', () => {
    const attempts = [att({ skill: 'sql', score: 0.2 }), att({ skill: 'api', score: 0.9 })];
    expect(weakestSkills(attempts, 1)[0].skill).toBe('sql');
  });
});

describe('readiness', () => {
  it('weights skills per role and reports evidence coverage', () => {
    const attempts = Array.from({ length: 6 }, (_, i) => att({ skill: 'playwright', itemId: `pw${i}` }));
    const r = readiness('sdet3', attempts);
    expect(r.score).toBe(15); // playwright weight 15/100 at 100% mastery
    expect(r.coverage).toBe(15);
    expect(r.gaps[0].mastery).toBe(0);
  });
});

describe('xp', () => {
  it('awards each item once at its best score, so repetition earns nothing', () => {
    const attempts = [att({ itemId: 'q', score: 1 }), att({ itemId: 'q', score: 1 }), att({ itemId: 'q', score: 1 })];
    expect(totalXp(attempts)).toBe(10);
  });

  it('gives diagnostics no xp and review passes a bonus', () => {
    expect(totalXp([att({ itemType: 'diagnostic' })])).toBe(0);
    expect(totalXp([att({ itemId: 'r', detail: { review: true } })])).toBe(15);
  });

  it('levels up on a growing curve', () => {
    expect(levelFor(0).level).toBe(1);
    expect(levelFor(100).level).toBe(2);
    expect(levelFor(249).level).toBe(2);
    expect(levelFor(250).level).toBe(3);
  });

  it('counts a streak ending today or yesterday without penalising gaps', () => {
    const a = [att({ at: '2026-10-17T12:00:00' }), att({ at: '2026-10-18T12:00:00' })];
    expect(currentStreak(a, '2026-10-19')).toBe(2);
    expect(currentStreak(a, '2026-10-25')).toBe(0);
  });
});
