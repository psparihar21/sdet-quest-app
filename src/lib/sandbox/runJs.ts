import type { RunResult, TestCase } from './harness';

export const JS_TIMEOUT_MS = 2000;

/**
 * Run learner JS/TS in a fresh Web Worker with a hard timeout.
 * Each run gets a new worker, so infinite loops are killed by terminate() and leave no state behind.
 */
export function runJs(code: string, functionName: string, tests: TestCase[], unordered = false): Promise<RunResult> {
  return new Promise((resolve) => {
    const worker = new Worker(new URL('./js.worker.ts', import.meta.url), { type: 'module' });
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({
        ok: false,
        compileError: `Stopped after ${JS_TIMEOUT_MS / 1000}s. Check for an infinite loop or very slow algorithm.`,
        cases: [],
        logs: [],
        passed: 0,
        total: tests.length,
      });
    }, JS_TIMEOUT_MS);
    worker.onmessage = (e: MessageEvent<RunResult>) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(e.data);
    };
    worker.onerror = (e) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({ ok: false, compileError: e.message || 'Worker error', cases: [], logs: [], passed: 0, total: tests.length });
    };
    worker.postMessage({ code, functionName, tests, unordered });
  });
}
