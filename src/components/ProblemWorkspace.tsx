import { lazy, Suspense, useState } from 'react';
import { CheckCircle2, Lightbulb, Play, RotateCcw, XCircle } from 'lucide-react';
import type { JavaProblem, JsProblem, Problem, SqlProblem } from '@/content/types';
import { useProgress } from '@/store/progress';
import { runJs } from '@/lib/sandbox/runJs';
import { runSql } from '@/lib/sandbox/runSql';
import type { RunResult } from '@/lib/sandbox/harness';
import type { QueryResult, SqlRunResult } from '@/lib/sandbox/sqlCompare';
import { SQL_SCHEMA_SUMMARY } from '@/lib/sandbox/sqlSeed';
import { Markdown } from './Markdown';
import { Badge, Button, Notice, cx } from './ui';

const CodeEditor = lazy(() => import('./CodeEditor'));

function EditorFallback() {
  return <div className="h-[220px] animate-pulse rounded-lg border border-line bg-code" aria-label="Loading editor" />;
}

/** Hints are revealed one at a time; the full solution only after an attempt or an explicit, confirmed request. */
function HintsAndSolution({ problem, attempted, revealed, onReveal }: { problem: Problem; attempted: boolean; revealed: boolean; onReveal: () => void }) {
  const [hints, setHints] = useState(0);
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="space-y-3">
      {problem.hints.slice(0, hints).map((h, i) => (
        <div key={i} className="flex gap-2 rounded-lg border border-xp/30 bg-xp-soft px-3 py-2 text-[13.5px] text-ink">
          <Lightbulb size={16} className="mt-0.5 shrink-0 text-xp" aria-hidden="true" />
          <span>
            <span className="font-medium">Hint {i + 1}:</span> {h}
          </span>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        {hints < problem.hints.length && (
          <Button size="sm" onClick={() => setHints((n) => n + 1)}>
            <Lightbulb size={14} aria-hidden="true" /> {hints === 0 ? 'Show a hint' : 'Next hint'}
          </Button>
        )}
        {!revealed &&
          (attempted ? (
            <Button size="sm" onClick={onReveal}>
              Show solution & explanation
            </Button>
          ) : confirming ? (
            <span className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
              Reveal before trying? Solving afterwards earns half credit.
              <Button size="sm" variant="danger" onClick={onReveal}>
                Reveal anyway
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                Keep trying
              </Button>
            </span>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setConfirming(true)}>
              I want the solution
            </Button>
          ))}
      </div>
      {revealed && (
        <div className="animate-rise space-y-3 rounded-xl border border-line bg-surface-2 p-4">
          <h3 className="text-sm font-semibold text-ink">Reference solution</h3>
          <pre className="overflow-x-auto rounded-lg border border-line bg-code p-3 font-mono text-[12.5px] leading-relaxed text-ink">
            <code>{problem.solution.code}</code>
          </pre>
          <Markdown className="!max-w-none text-[14px]">{problem.solution.explanation}</Markdown>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge tone="info">Time: {problem.solution.time}</Badge>
            <Badge tone="info">Space: {problem.solution.space}</Badge>
          </div>
          {problem.kind === 'js' && problem.javaEquivalent && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted hover:text-ink">Java equivalent (for Java interview rounds)</summary>
              <pre className="mt-2 overflow-x-auto rounded-lg border border-line bg-code p-3 font-mono text-[12.5px] text-ink">
                <code>{problem.javaEquivalent}</code>
              </pre>
            </details>
          )}
          {problem.followUps.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-faint">Interviewer follow-ups</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-[13.5px] text-ink">
                {problem.followUps.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function fmt(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function JsResults({ result }: { result: RunResult }) {
  if (result.compileError) {
    return (
      <div className="rounded-lg border border-bad/40 bg-bad-soft p-3 font-mono text-[12.5px] text-bad" role="alert">
        {result.compileError}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <p className={cx('text-sm font-semibold', result.ok ? 'text-ok' : 'text-ink')}>
        {result.passed}/{result.total} tests passed {result.ok && '— all green.'}
      </p>
      <ul className="space-y-1.5">
        {result.cases.map((c) => (
          <li key={c.index} className={cx('rounded-lg border px-3 py-2 text-[12.5px]', c.pass ? 'border-ok/30 bg-ok-soft' : 'border-bad/30 bg-bad-soft')}>
            <div className="flex items-center gap-2 font-medium text-ink">
              {c.pass ? <CheckCircle2 size={14} className="text-ok" aria-hidden="true" /> : <XCircle size={14} className="text-bad" aria-hidden="true" />}
              Test {c.index + 1} {c.hidden ? '(hidden)' : ''} · {c.pass ? 'pass' : 'fail'}
            </div>
            {!c.hidden && (
              <div className="mt-1 space-y-0.5 font-mono text-muted">
                <div>input: {fmt(c.args)}</div>
                <div>expected: {fmt(c.expected)}</div>
                {!c.pass && <div className="text-ink">got: {c.error ? `Error: ${c.error}` : fmt(c.actual)}</div>}
              </div>
            )}
            {c.hidden && !c.pass && c.error && <div className="mt-1 font-mono text-ink">Error: {c.error}</div>}
          </li>
        ))}
      </ul>
      {result.logs.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-faint">console.log</p>
          <pre className="mt-1 max-h-40 overflow-auto rounded-lg border border-line bg-code p-2 font-mono text-[12px] text-ink">{result.logs.join('\n')}</pre>
        </div>
      )}
    </div>
  );
}

function ResultTable({ r, caption }: { r: QueryResult; caption: string }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full text-left font-mono text-[12px]">
        <caption className="bg-surface-2 px-3 py-1.5 text-left font-sans text-xs font-semibold text-muted">
          {caption} · {r.rows.length} row{r.rows.length === 1 ? '' : 's'}
        </caption>
        <thead>
          <tr>
            {r.columns.map((c, i) => (
              <th key={i} className="border-b border-line px-3 py-1.5 text-faint">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {r.rows.slice(0, 50).map((row, i) => (
            <tr key={i} className="odd:bg-surface-2/40">
              {row.map((v, j) => (
                <td key={j} className="px-3 py-1 text-ink">
                  {v === null ? <span className="text-faint">NULL</span> : String(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function useAttemptRecorder(problem: Problem) {
  const recordAttempt = useProgress((s) => s.recordAttempt);
  return (pass: boolean, fraction: number, revealedEarly: boolean, detail: Record<string, unknown>) => {
    const raw = pass ? 1 : fraction;
    recordAttempt({
      itemId: problem.id,
      itemType: 'problem',
      skill: problem.skill,
      moduleId: problem.moduleId,
      score: revealedEarly ? Math.min(raw, 0.5) : raw,
      topic: problem.title,
      detail: { ...detail, revealedEarly },
    });
  };
}

function JsWorkspace({ problem }: { problem: JsProblem }) {
  const draft = useProgress((s) => s.drafts[problem.id]);
  const saveDraft = useProgress((s) => s.saveDraft);
  const [code, setCode] = useState(draft ?? problem.starter);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [revealedEarly, setRevealedEarly] = useState(false);
  const record = useAttemptRecorder(problem);

  const run = async () => {
    setRunning(true);
    const r = await runJs(code, problem.functionName, problem.tests, problem.unordered);
    setResult(r);
    setRunning(false);
    record(r.ok, r.total ? r.passed / r.total : 0, revealedEarly, { passed: r.passed, total: r.total });
  };

  return (
    <Workspace
      problem={problem}
      editor={
        <Suspense fallback={<EditorFallback />}>
          <CodeEditor value={code} onChange={(v) => { setCode(v); saveDraft(problem.id, v); }} lang="ts" label={`Code editor for ${problem.title}`} />
        </Suspense>
      }
      actions={
        <>
          <Button variant="primary" onClick={run} disabled={running}>
            <Play size={15} aria-hidden="true" /> {running ? 'Running…' : 'Run tests'}
          </Button>
          <Button variant="ghost" onClick={() => { setCode(problem.starter); saveDraft(problem.id, problem.starter); }}>
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </Button>
        </>
      }
      results={result && <JsResults result={result} />}
      notice={<>Your code runs <strong>in this browser</strong> in an isolated Web Worker with a 2-second limit and no network access. TypeScript types are stripped before running.</>}
      hints={<HintsAndSolution problem={problem} attempted={!!result} revealed={revealed} onReveal={() => { if (!result) setRevealedEarly(true); setRevealed(true); }} />}
    />
  );
}

function SqlWorkspace({ problem }: { problem: SqlProblem }) {
  const draft = useProgress((s) => s.drafts[problem.id]);
  const saveDraft = useProgress((s) => s.saveDraft);
  const [code, setCode] = useState(draft ?? problem.starter);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SqlRunResult | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [revealedEarly, setRevealedEarly] = useState(false);
  const record = useAttemptRecorder(problem);

  const run = async (check: boolean) => {
    setRunning(true);
    const r = await runSql(code, check ? problem.expectedQuery : undefined, problem.orderMatters);
    setResult({ ...r, ok: check ? r.ok : false, reason: check ? r.reason : undefined, expected: check ? r.expected : undefined });
    setRunning(false);
    if (check) record(r.ok, 0, revealedEarly, { reason: r.reason, error: r.error });
  };

  return (
    <Workspace
      problem={problem}
      editor={
        <>
          <details className="mb-2 text-[13px]">
            <summary className="cursor-pointer text-muted hover:text-ink">Schema</summary>
            <pre className="mt-1 overflow-x-auto rounded-lg border border-line bg-code p-2 font-mono text-[12px] text-ink">{SQL_SCHEMA_SUMMARY}</pre>
          </details>
          <Suspense fallback={<EditorFallback />}>
            <CodeEditor value={code} onChange={(v) => { setCode(v); saveDraft(problem.id, v); }} lang="sql" label={`SQL editor for ${problem.title}`} minHeight="160px" />
          </Suspense>
        </>
      }
      actions={
        <>
          <Button variant="primary" onClick={() => run(true)} disabled={running}>
            <Play size={15} aria-hidden="true" /> {running ? 'Running…' : 'Submit & check'}
          </Button>
          <Button onClick={() => run(false)} disabled={running}>
            Run only
          </Button>
        </>
      }
      results={
        result && (
          <div className="space-y-2">
            {result.error ? (
              <div className="rounded-lg border border-bad/40 bg-bad-soft p-3 font-mono text-[12.5px] text-bad" role="alert">
                {result.error}
              </div>
            ) : (
              <>
                {result.expected && (
                  <p className={cx('text-sm font-semibold', result.ok ? 'text-ok' : 'text-bad')}>{result.ok ? 'Correct — result matches.' : `Not yet: ${result.reason}`}</p>
                )}
                {result.learner && <ResultTable r={result.learner} caption="Your result" />}
                {result.expected && !result.ok && revealed && <ResultTable r={result.expected} caption="Expected result" />}
              </>
            )}
          </div>
        )
      }
      notice={<>Queries run on a <strong>real SQLite engine in your browser</strong> against a fresh copy of the practice HRMS database each time. Result sets are compared by values; column names don't matter.</>}
      hints={<HintsAndSolution problem={problem} attempted={!!result?.expected} revealed={revealed} onReveal={() => { if (!result?.expected) setRevealedEarly(true); setRevealed(true); }} />}
    />
  );
}

function JavaWorkspace({ problem }: { problem: JavaProblem }) {
  const draft = useProgress((s) => s.drafts[problem.id]);
  const saveDraft = useProgress((s) => s.saveDraft);
  const [code, setCode] = useState(draft ?? problem.starter);
  const [checked, setChecked] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const record = useAttemptRecorder(problem);

  const submit = () => {
    setSubmitted(true);
    setRevealed(true);
    record(checked.length === problem.checklist.length, checked.length / problem.checklist.length, false, { selfChecked: checked.length });
  };

  return (
    <Workspace
      problem={problem}
      editor={
        <Suspense fallback={<EditorFallback />}>
          <CodeEditor value={code} onChange={(v) => { setCode(v); saveDraft(problem.id, v); }} lang="java" label={`Java editor for ${problem.title}`} />
        </Suspense>
      }
      actions={
        <Button variant="primary" onClick={submit} disabled={submitted}>
          Submit self-review
        </Button>
      }
      results={
        <fieldset className="space-y-1.5">
          <legend className="mb-1 text-sm font-semibold text-ink">Self-review checklist — tick what your code really does</legend>
          {problem.checklist.map((c, i) => (
            <label key={i} className="flex items-start gap-2 text-[13.5px] text-ink">
              <input type="checkbox" className="mt-1 accent-[var(--accent)]" disabled={submitted} checked={checked.includes(i)} onChange={(e) => setChecked((s) => (e.target.checked ? [...s, i] : s.filter((x) => x !== i)))} />
              {c}
            </label>
          ))}
        </fieldset>
      }
      notice={<><strong>Java is not executed in the browser.</strong> Compare your code against the checklist and reference solution, or run it locally (JDK 17+: <code>java Solution.java</code>). Your self-review is recorded as such.</>}
      hints={<HintsAndSolution problem={problem} attempted={submitted} revealed={revealed} onReveal={() => setRevealed(true)} />}
    />
  );
}

function Workspace({ problem, editor, actions, results, notice, hints }: { problem: Problem; editor: React.ReactNode; actions: React.ReactNode; results: React.ReactNode; notice: React.ReactNode; hints: React.ReactNode }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="space-y-4">
        <Markdown className="!max-w-none">{problem.statement}</Markdown>
        {problem.kind === 'js' && (
          <>
            {problem.examples.map((e, i) => (
              <div key={i} className="rounded-lg border border-line bg-surface-2 p-3 font-mono text-[12.5px]">
                <div className="text-ink">{e.input}</div>
                <div className="text-accent-strong">→ {e.output}</div>
                {e.explain && <div className="mt-1 font-sans text-xs text-muted">{e.explain}</div>}
              </div>
            ))}
            <ul className="list-disc space-y-0.5 pl-5 text-[13px] text-muted">
              {problem.constraints.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </>
        )}
        {hints}
      </div>
      <div className="space-y-3">
        {editor}
        <div className="flex flex-wrap gap-2">{actions}</div>
        <Notice>{notice}</Notice>
        <div aria-live="polite">{results}</div>
      </div>
    </div>
  );
}

export function ProblemWorkspace({ problem }: { problem: Problem }) {
  if (problem.kind === 'js') return <JsWorkspace key={problem.id} problem={problem} />;
  if (problem.kind === 'sql') return <SqlWorkspace key={problem.id} problem={problem} />;
  return <JavaWorkspace key={problem.id} problem={problem} />;
}
