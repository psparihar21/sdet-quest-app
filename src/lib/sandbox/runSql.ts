import type { SqlRunResult } from './sqlCompare';

export const SQL_TIMEOUT_MS = 4000;

/** Run a query against a fresh in-browser SQLite copy of the practice DB (see sqlSeed.ts). */
export function runSql(query: string, expectedQuery?: string, orderMatters = false): Promise<SqlRunResult> {
  return new Promise((resolve) => {
    const worker = new Worker(new URL('./sql.worker.ts', import.meta.url), { type: 'module' });
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({ ok: false, error: `Query stopped after ${SQL_TIMEOUT_MS / 1000}s. A recursive CTE without a limit?` });
    }, SQL_TIMEOUT_MS);
    worker.onmessage = (e: MessageEvent<SqlRunResult>) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(e.data);
    };
    worker.onerror = (e) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({ ok: false, error: e.message || 'SQL engine failed to load' });
    };
    worker.postMessage({ query, expectedQuery, orderMatters });
  });
}
