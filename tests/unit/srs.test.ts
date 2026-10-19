import { LADDER, dueCards, newCard, review, upcoming } from '@/lib/srs';

describe('spaced repetition', () => {
  const today = '2026-10-19';

  it('new cards are due one day out', () => {
    const c = newCard('question', 'q1', 'fundamentals', today);
    expect(c.due).toBe('2026-10-20');
    expect(c.step).toBe(0);
  });

  it('passing climbs the 1/3/7/21 ladder', () => {
    let c = newCard('question', 'q1', 'fundamentals', today);
    const dues: string[] = [];
    for (let i = 0; i < 4; i++) {
      c = review(c, 1, today);
      dues.push(c.due);
    }
    expect(dues).toEqual(['2026-10-22', '2026-10-26', '2026-11-09', '2026-12-03']);
    expect(LADDER.slice(1, 5)).toEqual([3, 7, 21, 45]);
  });

  it('failing resets to day 1 and counts a lapse', () => {
    let c = newCard('question', 'q1', 'fundamentals', today);
    c = review(c, 1, today);
    c = review(c, 1, today);
    c = review(c, 0.2, today);
    expect(c.step).toBe(0);
    expect(c.lapses).toBe(1);
    expect(c.due).toBe('2026-10-20');
  });

  it('a near miss holds the current rung', () => {
    let c = review(newCard('question', 'q1', 'dsa', today), 1, today);
    c = review(c, 0.6, today);
    expect(c.step).toBe(1);
    expect(c.lapses).toBe(0);
  });

  it('lists due cards with most lapses first and buckets upcoming', () => {
    const a = { ...newCard('question', 'a', 'dsa', today), due: '2026-10-18', lapses: 0 };
    const b = { ...newCard('question', 'b', 'dsa', today), due: '2026-10-19', lapses: 2 };
    const c = { ...newCard('question', 'c', 'dsa', today), due: '2026-10-25' };
    const due = dueCards({ a, b, c }, today);
    expect(due.map((x) => x.itemId)).toEqual(['b', 'a']);
    const up = upcoming({ a, b, c }, 7, today);
    expect(up['2026-10-19']).toBe(2);
    expect(up['2026-10-25']).toBe(1);
  });
});
