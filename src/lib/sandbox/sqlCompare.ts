export interface QueryResult {
  columns: string[];
  rows: unknown[][];
}

export interface SqlRunResult {
  ok: boolean;
  error?: string;
  learner?: QueryResult;
  expected?: QueryResult;
  reason?: string;
}

function cell(v: unknown): string {
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2);
  if (v === null || v === undefined) return 'NULL';
  return String(v);
}

/** Compare result sets by values (column names may differ; aliases are the learner's choice). */
export function compareResults(learner: QueryResult, expected: QueryResult, orderMatters: boolean): { match: boolean; reason?: string } {
  if (learner.columns.length !== expected.columns.length) {
    return { match: false, reason: `Expected ${expected.columns.length} column(s) but got ${learner.columns.length}.` };
  }
  if (learner.rows.length !== expected.rows.length) {
    return { match: false, reason: `Expected ${expected.rows.length} row(s) but got ${learner.rows.length}.` };
  }
  const a = learner.rows.map((r) => r.map(cell).join('\u0001'));
  const b = expected.rows.map((r) => r.map(cell).join('\u0001'));
  if (!orderMatters) {
    a.sort();
    b.sort();
  }
  const diff = a.findIndex((row, i) => row !== b[i]);
  if (diff === -1) return { match: true };
  if (orderMatters && [...a].sort().join('|') === [...b].sort().join('|')) {
    return { match: false, reason: 'Right rows, wrong order. Check your ORDER BY.' };
  }
  return { match: false, reason: `Row ${diff + 1} differs from the expected result.` };
}
