/// <reference lib="webworker" />
import { runTests, type TestCase } from './harness';

// Learner code runs only in this dedicated worker, in the learner's own browser.
// Remove network and storage APIs so exercise code cannot reach anything outside the sandbox.
const scope = self as unknown as Record<string, unknown>;
for (const name of ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts', 'indexedDB', 'caches', 'BroadcastChannel', 'Worker', 'SharedWorker']) {
  try {
    Object.defineProperty(scope, name, { value: undefined, configurable: false, writable: false });
  } catch {
    scope[name] = undefined;
  }
}

self.onmessage = (e: MessageEvent<{ code: string; functionName: string; tests: TestCase[]; unordered?: boolean }>) => {
  const { code, functionName, tests, unordered } = e.data;
  const result = runTests(code, functionName, tests, { unordered });
  (self as unknown as Worker).postMessage(result);
};
