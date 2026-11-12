import { initialState, migrate, parseBackup, recordAttemptReducer } from '@/store/progress';
import { applyProfilePack, profilePackSchema } from '@/store/profilePack';

describe('progress reducer', () => {
  it('records an attempt, schedules a card and queues a weakness on failure', () => {
    const s = recordAttemptReducer(initialState(), { itemId: 'q1', itemType: 'question', skill: 'api', score: 0, topic: '401 vs 403' });
    expect(s.attempts).toHaveLength(1);
    expect(s.srs['question:q1'].lapses).toBe(1);
    expect(Object.values(s.weaknesses)[0]).toMatchObject({ topic: '401 vs 403', status: 'active' });
  });

  it('does not queue a weakness for a correct first answer', () => {
    const s = recordAttemptReducer(initialState(), { itemId: 'q1', itemType: 'question', skill: 'api', score: 1, topic: 't' });
    expect(Object.keys(s.weaknesses)).toHaveLength(0);
    // New cards start on the 1-day rung.
    expect(s.srs['question:q1']).toMatchObject({ step: 0, reviews: 0 });
  });

  const day = (d: string) => new Date(`${d}T10:00:00`);
  const input = { itemId: 'q1', itemType: 'question' as const, skill: 'api' as const, topic: 't' };

  it('re-answering before a card is due neither climbs the ladder nor earns the review bonus', () => {
    let s = recordAttemptReducer(initialState(), { ...input, score: 1 }, day('2026-10-01'));
    s = recordAttemptReducer(s, { ...input, score: 1 }, day('2026-10-01'));
    expect(s.srs['question:q1'].step).toBe(0);
    expect(s.attempts.some((a) => a.detail?.review)).toBe(false);
  });

  it('a due card climbs on a pass and is marked as a review', () => {
    let s = recordAttemptReducer(initialState(), { ...input, score: 1 }, day('2026-10-01'));
    s = recordAttemptReducer(s, { ...input, score: 1 }, day('2026-10-02'));
    expect(s.srs['question:q1']).toMatchObject({ step: 1, due: '2026-10-05' });
    expect(s.attempts[1].detail?.review).toBe(true);
  });

  it('a clear miss resets the card even when it is not due', () => {
    let s = recordAttemptReducer(initialState(), { ...input, score: 1 }, day('2026-10-01'));
    s = recordAttemptReducer(s, { ...input, score: 1 }, day('2026-10-02'));
    s = recordAttemptReducer(s, { ...input, score: 0 }, day('2026-10-03'));
    expect(s.srs['question:q1']).toMatchObject({ step: 0, lapses: 1, due: '2026-10-04' });
  });
});

describe('persistence', () => {
  it('migrates partial saves by filling defaults', () => {
    const s = migrate({ attempts: [], settings: { theme: 'light' } }, 1);
    expect(s.settings).toMatchObject({ theme: 'light', motion: 'system' });
    expect(s.srs).toEqual({});
  });

  it('round-trips an exported backup and rejects garbage', () => {
    const s = recordAttemptReducer(initialState(), { itemId: 'q1', itemType: 'question', skill: 'api', score: 1, topic: 't' });
    const back = parseBackup(JSON.stringify({ app: 'sdet-quest', state: s }));
    expect(back.attempts).toHaveLength(1);
    expect(() => parseBackup('{"hello":1}')).toThrow();
    expect(() => parseBackup(JSON.stringify({ state: { ...s, schemaVersion: 99 } }))).toThrow(/newer/);
  });

  it('rejects corrupted collections that would crash rendering', () => {
    const s = initialState();
    expect(() => parseBackup(JSON.stringify({ state: { ...s, attempts: null } }))).toThrow();
    expect(() => parseBackup(JSON.stringify({ state: { ...s, stories: [{ id: 1 }] } }))).toThrow();
    expect(() => parseBackup(JSON.stringify({ state: { ...s, bookmarks: 'x' } }))).toThrow();
    expect(() => migrate({ attempts: [{ itemId: 'q', itemType: 'nope', skill: 'api', score: 1, correct: true, at: 'x', id: 'a' }] }, 1)).toThrow();
  });
});

describe('profile pack', () => {
  const pack = profilePackSchema.parse({
    kind: 'sdet-quest-profile',
    version: 1,
    profile: { name: 'Test', headline: 'QA', primaryLanguage: 'javascript', targetRoles: ['SDET 3'], cvFacts: ['fact'] },
    diagnostics: [
      { id: 'diag-pyramid', skill: 'fundamentals', topic: 'Test pyramid', score: 0.1, at: '2026-08-18T10:00:00Z', relatedItems: ['m01-q1'] },
      { id: 'diag-flaky', skill: 'framework', topic: 'Flaky tests', score: 0.8, at: '2026-08-18T10:00:00Z' },
    ],
    selfRatings: [{ skill: 'dsa', topic: 'Coding patterns', rating: 1, at: '2026-08-18T10:00:00Z' }],
  });

  it('imports diagnostics as attempts, weaknesses and due revision cards', () => {
    const s = applyProfilePack(initialState(), pack, '2026-10-19');
    expect(s.attempts.filter((a) => a.itemType === 'diagnostic')).toHaveLength(2);
    expect(Object.values(s.weaknesses).map((w) => w.topic).sort()).toEqual(['Coding patterns', 'Test pyramid']);
    expect(s.srs['question:m01-q1'].due).toBe('2026-10-19');
  });

  it('is idempotent', () => {
    const once = applyProfilePack(initialState(), pack, '2026-10-19');
    const twice = applyProfilePack(once, pack, '2026-10-19');
    expect(twice.attempts).toHaveLength(once.attempts.length);
    expect(Object.keys(twice.weaknesses)).toEqual(Object.keys(once.weaknesses));
  });
});

describe('recommendations', () => {
  it('never recommends the in-progress lesson twice', async () => {
    const { recommendations } = await import('@/lib/recommend');
    const s = { ...initialState(), lessons: { 'm01-l1': { done: [0] } } };
    const titles = recommendations(s).filter((r) => r.kind === 'continue' || r.kind === 'next').map((r) => r.to);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe('hostile backups', () => {
  it('a __proto__ key in a backup never reaches Object.prototype', () => {
    const s = initialState();
    const raw = JSON.stringify({ app: 'sdet-quest', state: s }).replace('"notes":{}', '"notes":{"__proto__":"polluted","constructor":"x"}');
    expect(raw).toContain('__proto__');
    try {
      parseBackup(raw);
    } catch {
      // Rejecting the file is fine too; the point is that nothing leaks into every object.
    }
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.prototype.toString.call({})).toBe('[object Object]');
    expect(typeof {}.constructor).toBe('function');
  });
});
