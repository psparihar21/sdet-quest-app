/// <reference lib="webworker" />
import { runTests, type TestCase } from './harness';

// Learner code runs only in this dedicated worker, in the learner's own browser.
// Defence in depth: the real boundary is this worker's own CSP (connect-src 'none', see public/_headers);
// here we also remove network/storage APIs from self AND its prototype chain so they can't be restored.
const BLOCKED = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts', 'indexedDB', 'caches', 'BroadcastChannel', 'Worker', 'SharedWorker', 'WebTransport'];
for (let o: object | null = self; o; o = Object.getPrototypeOf(o)) {
  for (const name of BLOCKED) {
    if (o !== self && !Object.prototype.hasOwnProperty.call(o, name)) continue;
    try {
      Object.defineProperty(o, name, { value: undefined, configurable: false, writable: false });
    } catch {
      // non-configurable built-in: the CSP still blocks it
    }
  }
}

self.onmessage = (e: MessageEvent<{ code: string; functionName: string; tests: TestCase[]; unordered?: boolean }>) => {
  const { code, functionName, tests, unordered } = e.data;
  const result = runTests(code, functionName, tests, { unordered });
  (self as unknown as Worker).postMessage(result);
};
