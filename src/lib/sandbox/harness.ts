/**
 * Pure test harness used inside the JS sandbox worker (and directly by unit tests).
 * It compiles learner code, pulls out the named function and runs each test case.
 */
import { transform } from 'sucrase';

export interface TestCase {
  args: unknown[];
  expected?: unknown;
  hidden?: boolean;
  note?: string;
}

export interface CaseResult {
  index: number;
  pass: boolean;
  hidden: boolean;
  args?: unknown[];
  expected?: unknown;
  actual?: unknown;
  error?: string;
  ms: number;
}

export interface RunResult {
  ok: boolean;
  compileError?: string;
  cases: CaseResult[];
  logs: string[];
  passed: number;
  total: number;
}

export function deepEqual(a: unknown, b: unknown, unordered = false): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    if (unordered) {
      const key = (v: unknown) => JSON.stringify(v);
      const sa = [...a].map(key).sort();
      const sb = [...b].map(key).sort();
      return sa.every((v, i) => v === sb[i]);
    }
    return a.every((v, i) => deepEqual(v, b[i], unordered));
  }
  const ka = Object.keys(a as object).sort();
  const kb = Object.keys(b as object).sort();
  if (ka.length !== kb.length || ka.some((k, i) => k !== kb[i])) return false;
  return ka.every((k) => deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], unordered));
}

/** Map/Set results are compared as arrays/objects so learners can return either. */
function toPlain(v: unknown): unknown {
  if (v instanceof Set) return [...v].map(toPlain);
  if (v instanceof Map) return Object.fromEntries([...v.entries()].map(([k, x]) => [String(k), toPlain(x)]));
  if (Array.isArray(v)) return v.map(toPlain);
  return v;
}

function clone<T>(v: T): T {
  return v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T);
}

export function compile(code: string): string {
  return transform(code, { transforms: ['typescript'], disableESTransforms: true }).code;
}

export function runTests(
  code: string,
  functionName: string,
  tests: TestCase[],
  opts: { unordered?: boolean } = {},
): RunResult {
  const logs: string[] = [];
  const fakeConsole = {
    log: (...a: unknown[]) => logs.length < 200 && logs.push(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(toPlain(x)))).join(' ')),
  };
  let fn: unknown;
  try {
    const js = compile(code).replace(/^\s*export\s+(default\s+)?/gm, '');
    const factory = new Function('console', `"use strict";\n${js}\nreturn typeof ${functionName} === "function" ? ${functionName} : undefined;`);
    fn = factory(Object.assign({}, fakeConsole, { error: fakeConsole.log, warn: fakeConsole.log, info: fakeConsole.log }));
  } catch (e) {
    return { ok: false, compileError: String((e as Error).message ?? e), cases: [], logs, passed: 0, total: tests.length };
  }
  if (typeof fn !== 'function') {
    return { ok: false, compileError: `Could not find a function named "${functionName}".`, cases: [], logs, passed: 0, total: tests.length };
  }
  const cases: CaseResult[] = tests.map((t, index) => {
    const start = performance.now();
    try {
      const actual = toPlain((fn as (...a: unknown[]) => unknown)(...clone(t.args)));
      const pass = deepEqual(actual, t.expected, opts.unordered);
      return { index, pass, hidden: !!t.hidden, args: t.hidden ? undefined : t.args, expected: t.hidden ? undefined : t.expected, actual: t.hidden ? undefined : actual, ms: performance.now() - start };
    } catch (e) {
      return { index, pass: false, hidden: !!t.hidden, args: t.hidden ? undefined : t.args, error: String((e as Error).message ?? e), ms: performance.now() - start };
    }
  });
  const passed = cases.filter((c) => c.pass).length;
  return { ok: passed === tests.length, cases, logs, passed, total: tests.length };
}
