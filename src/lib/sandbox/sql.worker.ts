/// <reference lib="webworker" />
import initSqlJs, { type Database } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { SQL_SEED } from './sqlSeed';
import { compareResults, type QueryResult, type SqlRunResult } from './sqlCompare';

const sqlPromise = initSqlJs({ locateFile: () => wasmUrl });

function lastResult(db: Database, sql: string): QueryResult {
  const res = db.exec(sql);
  const last = res[res.length - 1];
  return last ? { columns: last.columns, rows: last.values } : { columns: [], rows: [] };
}

self.onmessage = async (e: MessageEvent<{ query: string; expectedQuery?: string; orderMatters?: boolean }>) => {
  const { query, expectedQuery, orderMatters = false } = e.data;
  const SQL = await sqlPromise;
  const post = (r: SqlRunResult) => (self as unknown as Worker).postMessage(r);
  let learner: QueryResult;
  try {
    const db = new SQL.Database();
    db.exec(SQL_SEED);
    learner = lastResult(db, query);
    db.close();
  } catch (err) {
    post({ ok: false, error: String((err as Error).message ?? err) });
    return;
  }
  if (!expectedQuery) {
    post({ ok: true, learner });
    return;
  }
  const db2 = new SQL.Database();
  db2.exec(SQL_SEED);
  const expected = lastResult(db2, expectedQuery);
  db2.close();
  const cmp = compareResults(learner, expected, orderMatters);
  post({ ok: cmp.match, learner, expected, reason: cmp.reason });
};
