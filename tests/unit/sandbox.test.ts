import initSqlJs from 'sql.js';
import { deepEqual, runTests } from '@/lib/sandbox/harness';
import { compareResults } from '@/lib/sandbox/sqlCompare';
import { SQL_SEED } from '@/lib/sandbox/sqlSeed';
import { PROBLEMS } from '@/content/problems';

describe('js harness', () => {
  const tests = [
    { args: [['a', 'b', 'a']], expected: ['a'] },
    { args: [[]], expected: [] },
  ];

  it('runs TypeScript solutions and reports passes', () => {
    const code =
      'function findDuplicates(xs: string[]): string[] { const seen = new Set<string>(); const d = new Set<string>(); for (const x of xs) { if (seen.has(x)) d.add(x); else seen.add(x); } return [...d]; }';
    expect(runTests(code, 'findDuplicates', tests)).toMatchObject({ ok: true, passed: 2, total: 2 });
  });

  it('reports wrong answers, runtime errors and compile errors', () => {
    expect(runTests('function findDuplicates(){ return ["z"]; }', 'findDuplicates', tests).passed).toBe(0);
    expect(runTests('function findDuplicates(){ throw new Error("boom"); }', 'findDuplicates', tests).cases[0].error).toBe('boom');
    expect(runTests('function (', 'findDuplicates', tests).compileError).toBeTruthy();
    expect(runTests('const x = 1;', 'findDuplicates', tests).compileError).toMatch(/Could not find/);
  });

  it('captures console output and accepts Sets as arrays', () => {
    const r = runTests('function f(){ console.log("hi", 1); return new Set([1,2]); }', 'f', [
      { args: [], expected: [1, 2] },
      { args: [], expected: [1, 2] },
    ]);
    expect(r.ok).toBe(true);
    expect(r.logs[0]).toBe('hi 1');
  });

  it('does not let a test mutate shared inputs', () => {
    const r = runTests('function f(a){ a.push(9); return a.length; }', 'f', [
      { args: [[1]], expected: 2 },
      { args: [[1]], expected: 2 },
    ]);
    expect(r.ok).toBe(true);
  });

  it('compares unordered arrays when asked', () => {
    expect(deepEqual([1, 2], [2, 1])).toBe(false);
    expect(deepEqual([1, 2], [2, 1], true)).toBe(true);
  });
});

describe('every JS problem reference solution passes its own tests', () => {
  for (const p of PROBLEMS) {
    if (p.kind !== 'js') continue;
    it(p.id, () => {
      const r = runTests(p.solution.code, p.functionName, p.tests, { unordered: p.unordered });
      expect(r.compileError).toBeUndefined();
      expect(r.cases.filter((c) => !c.pass).map((c) => c.index)).toEqual([]);
    });
    it(`${p.id} starter code does not already pass`, () => {
      expect(runTests(p.starter, p.functionName, p.tests, { unordered: p.unordered }).ok).toBe(false);
    });
  }
});

describe('sql problems', () => {
  it('compares result sets by value and order', () => {
    const exp = { columns: ['a'], rows: [[1], [2]] };
    expect(compareResults({ columns: ['x'], rows: [[2], [1]] }, exp, false).match).toBe(true);
    expect(compareResults({ columns: ['x'], rows: [[2], [1]] }, exp, true).reason).toMatch(/order/);
    expect(compareResults({ columns: ['x', 'y'], rows: [[1, 1]] }, exp, false).reason).toMatch(/column/);
  });

  it('every SQL reference solution matches its expected query on the seed DB', async () => {
    const SQL = await initSqlJs();
    const run = (q: string) => {
      const db = new SQL.Database();
      db.exec(SQL_SEED);
      const r = db.exec(q);
      db.close();
      const last = r[r.length - 1];
      return last ? { columns: last.columns, rows: last.values } : { columns: [], rows: [] };
    };
    for (const p of PROBLEMS) {
      if (p.kind !== 'sql') continue;
      const expected = run(p.expectedQuery);
      expect(expected.rows.length, `${p.id} expected query returns rows`).toBeGreaterThan(0);
      expect(compareResults(run(p.solution.code), expected, p.orderMatters), p.id).toEqual({ match: true });
    }
  });
});
