import { useMemo, useRef, useState } from 'react';
import { Check, Play, X } from 'lucide-react';
import { getProblem } from '@/content';
import type { Problem } from '@/content/types';
import { firstWrong, makeGaps, orderBlocks, scramble, syntaxChips, type Block } from '@/lib/codeDrill';
import type { CodeStage } from '@/lib/feed';
import type { RunResult } from '@/lib/sandbox/harness';
import { runJs } from '@/lib/sandbox/runJs';
import { runSql } from '@/lib/sandbox/runSql';
import type { SqlRunResult } from '@/lib/sandbox/sqlCompare';
import { SQL_SCHEMA_SUMMARY } from '@/lib/sandbox/sqlSeed';
import { useProgress } from '@/store/progress';
import { Markdown } from '@/components/Markdown';
import { useAttemptRecorder } from '@/lib/useAttemptRecorder';
import { cx } from '@/components/ui';

const STAGE: Record<CodeStage, string> = { order: 'Put the lines in order', gaps: 'Pick the missing syntax', write: 'Now write the logic' };
const LANG = { js: 'JavaScript', sql: 'SQL', java: 'Java' } as const;

const code = 'font-mono text-[12.5px] leading-[1.5] whitespace-pre-wrap [overflow-wrap:anywhere]';
const chip = 'reel-btn shrink-0 rounded-lg border-2 border-[var(--on)] px-3 py-2 font-mono text-[13px] font-semibold';
const action = 'reel-btn reel-display flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--on)] px-5 py-3 text-[15px] font-extrabold uppercase tracking-wide text-[var(--paper)] disabled:opacity-40';

/** Runs the reference-ordered code for real, so finishing the puzzle ends with "it works", not just "it matches". */
function useRun(problem: Problem) {
  const [out, setOut] = useState<string>();
  const run = async (source: string) => {
    if (problem.kind === 'js') {
      const r = await runJs(source, problem.functionName, problem.tests, problem.unordered);
      setOut(r.compileError ? `Did not run: ${r.compileError}` : `Ran in your browser: ${r.passed}/${r.total} tests passed.`);
    } else if (problem.kind === 'sql') {
      const r = await runSql(source, problem.expectedQuery, problem.orderMatters);
      setOut(r.error ? `Did not run: ${r.error}` : `Ran on the practice database: ${r.learner?.rows.length ?? 0} row${r.learner?.rows.length === 1 ? '' : 's'} returned${r.ok ? ', matching the expected result.' : '.'}`);
    } else setOut('Java is not run in the browser. This is the reference order.');
  };
  return [out, run] as const;
}

/** Tap lines from the pile into place. Lines in the wrong position turn red; tap one to send it back. */
function OrderStage({ problem }: { problem: Problem }) {
  const blocks = useMemo(() => orderBlocks(problem.solution.code), [problem]);
  const pile = useMemo(() => scramble(blocks, problem.id), [blocks, problem.id]);
  const [picked, setPicked] = useState<Block[]>([]);
  const [ranOut, run] = useRun(problem);
  const full = picked.length === blocks.length;
  const solved = full && firstWrong(picked, blocks) === -1;

  const add = (b: Block) => {
    const next = [...picked, b];
    setPicked(next);
    if (next.length === blocks.length && firstWrong(next, blocks) === -1) void run(problem.solution.code);
  };

  return (
    <div>
      <ol className="min-h-24 space-y-1.5 rounded-xl border-2 border-dashed border-[var(--border-strong)] p-2" aria-label="Your code so far">
        {picked.length === 0 && <li className="px-2 py-6 text-center text-[13.5px] text-muted">Tap the lines below in the order they should run.</li>}
        {picked.map((b, i) => {
          const wrong = full && b.text !== blocks[i].text;
          return (
            <li key={b.id}>
              <button
                type="button"
                disabled={solved}
                onClick={() => setPicked(picked.filter((x) => x.id !== b.id))}
                aria-label={`Line ${i + 1}${wrong ? ', wrong place' : ''}: ${b.text.trim()}. Tap to remove.`}
                className={cx('reel-btn flex w-full items-start gap-2 overflow-x-auto rounded-lg px-2.5 py-2 text-left', code, wrong ? 'bg-[#ff9d8a] text-[#161514]' : solved ? 'bg-[#b9f26b] text-[#161514]' : 'bg-[var(--surface-2)]')}
              >
                <span aria-hidden="true" className="w-4 shrink-0 select-none text-right opacity-60">
                  {i + 1}
                </span>
                {b.text}
              </button>
            </li>
          );
        })}
      </ol>

      {!solved && (
        <div className="mt-3 space-y-1.5" role="group" aria-label="Lines to place">
          {pile
            .filter((b) => !picked.some((x) => x.id === b.id))
            .map((b) => (
              <button key={b.id} type="button" onClick={() => add(b)} className={cx('reel-btn block w-full overflow-x-auto rounded-lg border-2 border-[var(--on)] px-2.5 py-2 text-left', code)}>
                {b.text}
              </button>
            ))}
        </div>
      )}
      <p role="status" className="mt-3 text-[14px] font-semibold empty:hidden">
        {solved ? (ranOut ?? 'In order. Running it…') : full ? 'Not yet: the red lines are in the wrong place. Tap them to take them out.' : ''}
      </p>
    </div>
  );
}

/** The solution with pieces of syntax missing. One gap is active at a time; a wrong pick just shakes. */
function GapsStage({ problem }: { problem: Problem }) {
  const drill = useMemo(() => makeGaps(problem.solution.code, problem.kind, problem.id), [problem]);
  const [filled, setFilled] = useState(0);
  const [misses, setMisses] = useState(0);
  const [wrong, setWrong] = useState<string>();
  const done = filled === drill.gaps.length;
  const pick = (option: string) => {
    if (option === drill.gaps[filled].token) {
      setFilled(filled + 1);
      setWrong(undefined);
    } else {
      setMisses(misses + 1);
      setWrong(option);
    }
  };
  return (
    <div>
      <pre className={cx('overflow-x-auto rounded-xl bg-[var(--surface-2)] p-3', code)}>
        {drill.parts.map((p, i) =>
          typeof p === 'string' ? (
            p
          ) : p < filled ? (
            <mark key={i} className="rounded bg-[var(--mark)] px-1 font-bold text-[#161514]">
              {drill.gaps[p].token}
            </mark>
          ) : (
            <span key={i} className={cx('inline-block min-w-12 rounded border-2 px-1 text-center font-bold', p === filled ? 'border-[var(--mark)] text-[var(--mark)]' : 'border-[var(--border-strong)] text-muted')}>
              <span aria-hidden="true">{p === filled ? '?' : '…'}</span>
              <span className="sr-only">{p === filled ? 'gap to fill now' : 'gap'}</span>
            </span>
          ),
        )}
      </pre>
      {!done && (
        <div className="mt-4 grid grid-cols-2 gap-2.5" role="group" aria-label={`Options for gap ${filled + 1} of ${drill.gaps.length}`}>
          {drill.gaps[filled].options.map((o) => (
            <button key={`${filled}:${o}`} type="button" onClick={() => pick(o)} data-state={wrong === o ? 'wrong' : undefined} className="tile min-h-12 px-3 py-2.5 font-mono text-[14px] font-bold">
              {o}
            </button>
          ))}
        </div>
      )}
      <p role="status" className="mt-3 text-[14px] font-semibold empty:hidden">
        {done ? `All ${drill.gaps.length} filled${misses ? `, with ${misses} wrong pick${misses === 1 ? '' : 's'} on the way` : ' first time'}.` : wrong ? `Not ${wrong}. Try another.` : ''}
      </p>
    </div>
  );
}

function ResultLine({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <p className={cx('flex items-start gap-2 rounded-lg px-3 py-2 text-[14px] font-semibold text-[#161514]', ok ? 'bg-[#b9f26b]' : 'bg-[#ff9d8a]')}>
      {ok ? <Check size={18} aria-hidden="true" className="mt-0.5 shrink-0" /> : <X size={18} aria-hidden="true" className="mt-0.5 shrink-0" />}
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}

function JsResult({ r }: { r: RunResult }) {
  const failed = r.cases.find((c) => !c.pass);
  return (
    <div className="space-y-2">
      <ResultLine ok={r.ok}>{r.compileError ? `Did not run: ${r.compileError}` : `${r.passed}/${r.total} tests passed`}</ResultLine>
      {failed && !r.compileError && (
        <pre className={cx('overflow-x-auto rounded-lg bg-[var(--surface-2)] p-2.5', code)}>
          {failed.hidden ? 'A hidden test failed: think about edge cases (empty input, repeats, case).' : `input:    ${JSON.stringify(failed.args)}\nexpected: ${JSON.stringify(failed.expected)}\n${failed.error ? `error:    ${failed.error}` : `got:      ${JSON.stringify(failed.actual)}`}`}
        </pre>
      )}
    </div>
  );
}

function SqlResult({ r }: { r: SqlRunResult }) {
  const rows = r.learner?.rows.slice(0, 5) ?? [];
  return (
    <div className="space-y-2">
      <ResultLine ok={r.ok}>{r.error ? `Did not run: ${r.error}` : r.ok ? 'Correct: the result matches.' : (r.reason ?? 'The result does not match yet.')}</ResultLine>
      {r.learner && !r.error && (
        <div className="overflow-x-auto rounded-lg bg-[var(--surface-2)] p-2.5">
          <table className="font-mono text-[12px]">
            <caption className="sr-only">Your result, first {rows.length} rows</caption>
            <thead>
              <tr>
                {r.learner.columns.map((c) => (
                  <th key={c} className="pr-4 text-left font-bold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {row.map((v, j) => (
                    <td key={j} className="pr-4">
                      {String(v ?? 'NULL')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {r.learner.rows.length > rows.length && <p className="mt-1 text-[12px] text-muted">…and {r.learner.rows.length - rows.length} more rows</p>}
        </div>
      )}
    </div>
  );
}

/**
 * Write the solution on a phone: syntax goes in with a tap, so typing is for names and logic.
 * JavaScript and SQL really run against the tests; Java is self-reviewed against its checklist.
 */
function WriteStage({ problem }: { problem: Problem }) {
  const draft = useProgress((s) => s.drafts[problem.id]);
  const saveDraft = useProgress((s) => s.saveDraft);
  const record = useAttemptRecorder(problem);
  const [source, setSource] = useState(draft ?? problem.starter);
  const [running, setRunning] = useState(false);
  const [js, setJs] = useState<RunResult>();
  const [sql, setSql] = useState<SqlRunResult>();
  const [checked, setChecked] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const chips = useMemo(() => syntaxChips(problem.solution.code, problem.kind), [problem]);
  const attempted = !!js || !!sql || submitted;

  const insert = (text: string) => {
    const el = area.current;
    if (!el) return;
    el.setRangeText(text, el.selectionStart, el.selectionEnd, 'end');
    setSource(el.value);
    el.focus();
  };

  const run = async () => {
    setRunning(true);
    saveDraft(problem.id, source);
    try {
      if (problem.kind === 'js') {
        const r = await runJs(source, problem.functionName, problem.tests, problem.unordered);
        setJs(r);
        record(r.ok, r.total ? r.passed / r.total : 0, false, { passed: r.passed, total: r.total, feed: true });
      } else if (problem.kind === 'sql') {
        const r = await runSql(source, problem.expectedQuery, problem.orderMatters);
        setSql(r);
        record(r.ok, 0, false, { reason: r.reason, error: r.error, feed: true });
      }
    } finally {
      setRunning(false);
    }
  };

  const selfReview = () => {
    if (problem.kind !== 'java') return;
    saveDraft(problem.id, source);
    setSubmitted(true);
    record(checked.length === problem.checklist.length, checked.length / problem.checklist.length, false, { selfChecked: checked.length, feed: true });
  };

  return (
    <div>
      <Markdown className="reel-prose !text-[15.5px]">{problem.statement}</Markdown>
      {problem.kind === 'js' && problem.examples[0] && (
        <pre className={cx('mt-2 overflow-x-auto rounded-lg bg-[var(--surface-2)] p-2.5', code)}>{`${problem.examples[0].input}\n→ ${problem.examples[0].output}`}</pre>
      )}
      {problem.kind === 'sql' && (
        <details className="mt-2 text-[13.5px]">
          <summary className="cursor-pointer font-semibold">Tables you can use</summary>
          <pre className={cx('mt-1 overflow-x-auto rounded-lg bg-[var(--surface-2)] p-2.5', code)}>{SQL_SCHEMA_SUMMARY}</pre>
        </details>
      )}

      <label htmlFor={`code-${problem.id}`} className="reel-display mt-4 block text-[12px] font-bold uppercase tracking-[0.08em] text-muted">
        Your {LANG[problem.kind]}
      </label>
      <textarea
        id={`code-${problem.id}`}
        ref={area}
        value={source}
        onChange={(e) => setSource(e.target.value.slice(0, 20000))}
        onBlur={() => saveDraft(problem.id, source)}
        rows={Math.min(12, Math.max(6, source.split('\n').length + 1))}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        // 16px on the field itself: anything smaller makes iOS zoom the page when the keyboard opens.
        className="mt-1 w-full resize-y rounded-xl border-2 border-[var(--on)] bg-[var(--surface)] p-3 font-mono text-[16px] leading-snug text-[var(--on)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--on)]"
      />
      {/* Tap to insert at the cursor: the syntax this problem needs, in the order it is needed. */}
      <div className="deck -mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-1" role="group" aria-label="Insert syntax at the cursor">
        {chips.map((c) => (
          <button key={c.label} type="button" onClick={() => insert(c.text)} className={chip}>
            {c.label}
          </button>
        ))}
      </div>

      {problem.kind === 'java' ? (
        <fieldset className="mt-4 space-y-2">
          <legend className="text-[14px] font-semibold">Java is not run in the browser. Tick what your code really does:</legend>
          {problem.checklist.map((c, i) => (
            <label key={i} className="flex items-start gap-2.5 text-[14.5px]">
              <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[var(--on)]" disabled={submitted} checked={checked.includes(i)} onChange={(e) => setChecked((s) => (e.target.checked ? [...s, i] : s.filter((x) => x !== i)))} />
              {c}
            </label>
          ))}
          <button type="button" className={cx(action, 'mt-2')} disabled={submitted} onClick={selfReview}>
            Submit self-review
          </button>
          {submitted && (
            <ResultLine ok={checked.length === problem.checklist.length}>
              Recorded as self-reviewed: {checked.length}/{problem.checklist.length}.
            </ResultLine>
          )}
        </fieldset>
      ) : (
        <button type="button" className={cx(action, 'mt-4')} disabled={running} onClick={() => void run()}>
          <Play size={17} aria-hidden="true" /> {running ? 'Running…' : problem.kind === 'sql' ? 'Run and check' : 'Run the tests'}
        </button>
      )}

      <div className="mt-3 space-y-2" role="status">
        {js && <JsResult r={js} />}
        {sql && <SqlResult r={sql} />}
      </div>

      <details className="mt-3 text-[14px]">
        <summary className="cursor-pointer font-semibold">Stuck? Hints</summary>
        <ol className="mt-1 list-decimal space-y-1 pl-5">
          {problem.hints.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ol>
      </details>
      {attempted && (
        <details className="mt-2 text-[14px]">
          <summary className="cursor-pointer font-semibold">Show the reference solution</summary>
          <pre className={cx('mt-1 overflow-x-auto rounded-lg bg-[var(--surface-2)] p-2.5', code)}>{problem.solution.code}</pre>
          <p className="mt-2 leading-relaxed">{problem.solution.explanation}</p>
          <p className="mt-1 font-mono text-[12.5px] text-muted">
            Time {problem.solution.time} · Space {problem.solution.space}
          </p>
        </details>
      )}
    </div>
  );
}

/** One stage of a coding problem as a feed card. */
export function CodeDrill({ id, stage }: { id: string; stage: CodeStage }) {
  const problem = getProblem(id);
  if (!problem) return null;
  return (
    <div data-testid={`code-${id}-${stage}`}>
      <p className="reel-display text-[13px] font-bold uppercase tracking-[0.08em] text-muted">
        {LANG[problem.kind]} · {problem.title}
      </p>
      <h2 className="reel-display mb-4 mt-2 text-[28px] font-extrabold">{STAGE[stage]}</h2>
      {stage === 'order' && <OrderStage problem={problem} />}
      {stage === 'gaps' && <GapsStage problem={problem} />}
      {stage === 'write' && <WriteStage problem={problem} />}
    </div>
  );
}
