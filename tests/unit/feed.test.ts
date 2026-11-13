import { MODULES } from '@/content';
import { answeredCheckSteps, buildFeed, parseTable, splitBody } from '@/lib/feed';
import { initialState, recordAttemptReducer } from '@/store/progress';

const today = '2026-11-13';
const day = (d: string) => new Date(`${d}T10:00:00`);

describe('splitBody', () => {
  it('keeps code fences whole and headings with their text', () => {
    const body = ['## One', '', 'First paragraph.', '', '```js', 'const a = 1;', '', 'const b = 2;', '```', '', '## Two', '', 'Second.'].join('\n');
    const parts = splitBody(body);
    expect(parts).toHaveLength(2);
    expect(parts[0]).toContain('const a = 1;\n\nconst b = 2;');
    expect(parts[1].startsWith('## Two')).toBe(true);
    expect(parts.join('\n\n')).toBe(body);
  });

  it('gives a table its own part and parses it into cells', () => {
    const body = ['Intro text.', '', '## Layers', '', '| Layer | Speed |', '|---|---|', '| **Unit** | ms |', '| UI | a \\| b |', '', 'After the table.'].join('\n');
    const parts = splitBody(body);
    expect(parts).toHaveLength(3);
    expect(parseTable(parts[0])).toBeUndefined();
    expect(parseTable(parts[1])).toEqual({ title: 'Layers', head: ['Layer', 'Speed'], rows: [['**Unit**', 'ms'], ['UI', 'a | b']] });
    expect(parts[2]).toBe('After the table.');
  });

  it('handles a heading glued to its table and rows without a trailing pipe', () => {
    const parts = splitBody(['## Layers', '| Layer | Speed', '|---|---', '| Unit | ms', '', 'After.'].join('\n'));
    expect(parts).toHaveLength(2);
    expect(parseTable(parts[0])).toEqual({ title: 'Layers', head: ['Layer', 'Speed'], rows: [['Unit', 'ms']] });
  });

  it('splits long text at paragraph breaks', () => {
    const para = 'word '.repeat(80).trim();
    expect(splitBody([para, para, para].join('\n\n'))).toHaveLength(3);
  });
});

describe('buildFeed', () => {
  it('starts a new learner on the first lesson, with unique keys', () => {
    const feed = buildFeed(initialState(), { today });
    expect(feed[0]).toMatchObject({ why: 'new', kind: 'learn', part: 1, moduleId: MODULES[0].id, lessonId: MODULES[0].lessons[0].id });
    expect(feed.some((c) => c.kind === 'table' && c.rows.length > 0)).toBe(true);
    expect(feed[0].step?.lessonId).toBe(MODULES[0].lessons[0].id);
    expect(new Set(feed.map((c) => c.key)).size).toBe(feed.length);
    expect(feed.some((c) => c.kind === 'question')).toBe(true);
    expect(feed.some((c) => c.kind === 'flashcard')).toBe(true);
  });

  it('puts due revision first, then weak spots, then new material', () => {
    // A miss on day 1 is due on day 2 and sits in the weakness queue.
    const s = recordAttemptReducer(initialState(), { itemId: 'm01-q1', itemType: 'question', skill: 'fundamentals', score: 0, topic: 't' }, day('2026-11-01'));
    const feed = buildFeed(s, { today });
    expect(feed[0]).toMatchObject({ why: 'due', kind: 'question', id: 'm01-q1' });
    // The same question is not repeated as a weak-spot or new card.
    expect(feed.filter((c) => c.kind === 'question' && c.id === 'm01-q1')).toHaveLength(1);
    expect(feed[1].why).toBe('new');
  });

  it('skips finished steps, finished lessons and keys already on screen', () => {
    const first = MODULES[0].lessons[0];
    const base = buildFeed(initialState(), { today });
    const stepDone = buildFeed({ ...initialState(), lessons: { [first.id]: { done: [0] } } }, { today });
    expect(stepDone.some((c) => c.step?.lessonId === first.id && c.step.index === 0)).toBe(false);
    const lessonDone = buildFeed({ ...initialState(), lessons: { [first.id]: { done: [], completedAt: 'x' } } }, { today });
    expect(lessonDone.some((c) => c.step?.lessonId === first.id)).toBe(false);
    const next = buildFeed(initialState(), { today, shown: base });
    expect(next.length).toBeGreaterThan(0);
    expect(next.some((c) => base.some((b) => b.key === c.key))).toBe(false);
  });

  it('does not offer a question again as a weak spot while it is still on screen', () => {
    const shown = buildFeed(initialState(), { today });
    const q = shown.find((c) => c.kind === 'question')!;
    const id = q.kind === 'question' ? q.id : '';
    const missed = recordAttemptReducer(initialState(), { itemId: id, itemType: 'question', skill: 'fundamentals', score: 0, topic: 't' }, day(today));
    expect(buildFeed(missed, { today, shown }).some((c) => c.kind === 'question' && c.id === id)).toBe(false);
  });

  it('finds check steps that were fully answered outside the lesson', () => {
    const lesson = MODULES[0].lessons[0];
    const index = lesson.sections.findIndex((s) => s.kind === 'check');
    const section = lesson.sections[index];
    let s = initialState();
    expect(answeredCheckSteps(s)).toEqual([]);
    for (const id of section.kind === 'check' ? section.questionIds : []) s = recordAttemptReducer(s, { itemId: id, itemType: 'question', skill: 'fundamentals', score: 1, topic: 't' }, day(today));
    expect(answeredCheckSteps(s)).toContainEqual({ lessonId: lesson.id, index, total: lesson.sections.length });
    expect(answeredCheckSteps({ ...s, lessons: { [lesson.id]: { done: [index] } } })).toEqual([]);
  });

  it('marks exactly one card per step as the one that completes it', () => {
    const feed = buildFeed(initialState(), { today, limit: 500 });
    const lasts = new Map<string, number>();
    for (const c of feed) if (c.step?.last) lasts.set(`${c.step.lessonId}:${c.step.index}`, (lasts.get(`${c.step.lessonId}:${c.step.index}`) ?? 0) + 1);
    expect([...lasts.values()].every((n) => n === 1)).toBe(true);
  });
});
