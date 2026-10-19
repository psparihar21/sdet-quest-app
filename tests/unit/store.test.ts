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
    expect(s.srs['question:q1'].step).toBe(1);
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
