import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/lib/hooks';
import { Button, cx } from '@/components/ui';
import { IconBtn } from './StepDiagram';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';

/* ---------- Sliding window ---------- */

export function slidingWindowTrace(s: string) {
  const steps: { start: number; end: number; best: number; note: string }[] = [];
  const last = new Map<string, number>();
  let start = 0;
  let best = 0;
  for (let end = 0; end < s.length; end++) {
    const prev = last.get(s[end]);
    let note = `Extend: add '${s[end]}'.`;
    if (prev !== undefined && prev >= start) {
      note = `'${s[end]}' already in window at ${prev} → move start to ${prev + 1}.`;
      start = prev + 1;
    }
    last.set(s[end], end);
    if (end - start + 1 > best) {
      best = end - start + 1;
      note += ` New best = ${best}.`;
    }
    steps.push({ start, end, best, note });
  }
  return steps;
}

export function SlidingWindow() {
  const [text, setText] = useState('abcabcbb');
  const steps = slidingWindowTrace(text);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reduced = useReducedMotion();
  const s = steps[Math.min(i, steps.length - 1)];

  useEffect(() => {
    if (!playing) return;
    if (i >= steps.length - 1) return setPlaying(false);
    const t = setTimeout(() => setI((x) => x + 1), reduced ? 1600 : 900);
    return () => clearTimeout(t);
  }, [playing, i, steps.length, reduced]);

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <label className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
        Input string
        <input value={text} onChange={(e) => { setText(e.target.value.slice(0, 16) || 'a'); setI(0); setPlaying(false); }} className="h-8 w-44 rounded-lg border border-line bg-surface-2 px-2 font-mono text-ink" />
      </label>
      <div className="mt-4 flex flex-wrap gap-1" role="img" aria-label={`Window from ${s?.start} to ${s?.end}`}>
        {[...text].map((c, k) => {
          const inWin = s && k >= s.start && k <= s.end;
          return (
            <div key={k} className="text-center">
              <div className={cx('flex h-10 w-10 items-center justify-center rounded-lg border font-mono text-[15px] transition-colors', inWin ? 'border-accent bg-accent-soft text-ink' : 'border-line bg-surface-2 text-faint', s && k === s.end && 'ring-2 ring-accent')}>{c}</div>
              <div className="mt-0.5 text-[10px] text-faint">{k}</div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 min-h-[40px] text-[13.5px] text-ink" aria-live="polite">
        {s ? <>Step {i + 1}/{steps.length}: {s.note} <span className="text-muted">(window = [{s.start}..{s.end}], best = {s.best})</span></> : 'Empty input.'}
      </p>
      <div className="mt-2 flex gap-1.5">
        <IconBtn label="Previous step" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}><ChevronLeft size={16} /></IconBtn>
        <IconBtn label={playing ? 'Pause' : 'Play'} onClick={() => (i >= steps.length - 1 ? (setI(0), setPlaying(true)) : setPlaying((p) => !p))}>{playing ? <Pause size={16} /> : <Play size={16} />}</IconBtn>
        <IconBtn label="Next step" onClick={() => setI((x) => Math.min(steps.length - 1, x + 1))} disabled={i >= steps.length - 1}><ChevronRight size={16} /></IconBtn>
        <IconBtn label="Replay" onClick={() => { setI(0); setPlaying(false); }}><RotateCcw size={15} /></IconBtn>
      </div>
    </div>
  );
}

/* ---------- SQL joins ---------- */

const EMP = [
  { id: 1, name: 'Asha', dept: 1 },
  { id: 2, name: 'Vikram', dept: 1 },
  { id: 5, name: 'Priya', dept: 2 },
  { id: 11, name: 'Isha', dept: null as number | null },
];
const DEPT = [
  { id: 1, name: 'Engineering' },
  { id: 2, name: 'Quality' },
  { id: 5, name: 'Design' },
];
type Join = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';

export function joinRows(kind: Join) {
  const rows: { e?: string; d?: string }[] = [];
  for (const e of EMP) {
    const d = DEPT.find((x) => x.id === e.dept);
    if (d) rows.push({ e: e.name, d: d.name });
    else if (kind === 'LEFT' || kind === 'FULL') rows.push({ e: e.name });
  }
  if (kind === 'RIGHT' || kind === 'FULL') for (const d of DEPT) if (!EMP.some((e) => e.dept === d.id)) rows.push({ d: d.name });
  return rows;
}

export function SqlJoins() {
  const [kind, setKind] = useState<Join>('INNER');
  const rows = joinRows(kind);
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Join type">
        {(['INNER', 'LEFT', 'RIGHT', 'FULL'] as Join[]).map((k) => (
          <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={cx('rounded-md border px-3 py-1 font-mono text-xs', kind === k ? 'border-accent bg-accent-soft text-accent-strong' : 'border-line text-muted hover:text-ink')}>
            {k} JOIN
          </button>
        ))}
      </div>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-code p-2 font-mono text-[12px] text-ink">{`SELECT e.name, d.name FROM employees e ${kind === 'FULL' ? 'FULL OUTER' : kind} JOIN departments d ON d.id = e.department_id;`}</pre>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <MiniTable title="employees" cols={['id', 'name', 'dept_id']} rows={EMP.map((e) => [e.id, e.name, e.dept ?? 'NULL'])} />
        <MiniTable title="departments" cols={['id', 'name']} rows={DEPT.map((d) => [d.id, d.name])} />
        <MiniTable title={`result · ${rows.length} rows`} cols={['e.name', 'd.name']} rows={rows.map((r) => [r.e ?? 'NULL', r.d ?? 'NULL'])} highlight />
      </div>
      <p className="mt-3 text-[13px] text-muted" aria-live="polite">
        {kind === 'INNER' && 'Only matching pairs. Isha (no department) and Design (no employees) disappear — a silent data loss if you meant to validate them.'}
        {kind === 'LEFT' && 'Every employee is kept; Isha gets NULL. Add WHERE d.id IS NULL to list employees without a department.'}
        {kind === 'RIGHT' && 'Every department is kept; Design gets NULL. Same as swapping the tables in a LEFT JOIN.'}
        {kind === 'FULL' && 'Everything from both sides. SQLite supports FULL OUTER JOIN from 3.39; MySQL needs LEFT UNION RIGHT.'}
      </p>
    </div>
  );
}

function MiniTable({ title, cols, rows, highlight }: { title: string; cols: string[]; rows: (string | number)[][]; highlight?: boolean }) {
  return (
    <div className={cx('overflow-hidden rounded-lg border', highlight ? 'border-accent/50' : 'border-line')}>
      <p className={cx('px-2 py-1 text-[11px] font-semibold', highlight ? 'bg-accent-soft text-accent-strong' : 'bg-surface-2 text-faint')}>{title}</p>
      <table className="w-full font-mono text-[11.5px]">
        <thead>
          <tr>{cols.map((c) => <th key={c} className="px-2 py-1 text-left text-faint">{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-line">
              {r.map((v, j) => <td key={j} className={cx('px-2 py-1', v === 'NULL' ? 'text-faint' : 'text-ink')}>{v}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Risk matrix ---------- */

const FEATURES = [
  { id: 'payroll', label: 'Payroll tax calculation', fit: { l: 1, i: 2 } },
  { id: 'leave', label: 'Leave balance deduction', fit: { l: 2, i: 2 } },
  { id: 'sso', label: 'SSO login', fit: { l: 1, i: 2 } },
  { id: 'export', label: 'CSV export of reports', fit: { l: 1, i: 1 } },
  { id: 'theme', label: 'Dark-mode colours', fit: { l: 1, i: 0 } },
  { id: 'shift', label: 'New night-shift rules (just built)', fit: { l: 2, i: 1 } },
];
const LVL = ['Low', 'Medium', 'High'];

export function RiskMatrix() {
  const [place, setPlace] = useState<Record<string, { l: number; i: number }>>({});
  const [checked, setChecked] = useState(false);
  const score = (p: { l: number; i: number }) => (p.l + 1) * (p.i + 1);
  const all = FEATURES.every((f) => place[f.id]);
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-[13px] text-muted">Rate each feature's likelihood of failure and impact if it fails. Then compare with a QA lead's rating.</p>
      <ul className="mt-3 space-y-2">
        {FEATURES.map((f) => {
          const p = place[f.id];
          return (
            <li key={f.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2">
              <span className="min-w-[180px] flex-1 text-[13.5px] text-ink">{f.label}</span>
              {(['l', 'i'] as const).map((axis) => (
                <label key={axis} className="flex items-center gap-1 text-xs text-muted">
                  {axis === 'l' ? 'Likelihood' : 'Impact'}
                  <select value={p?.[axis] ?? ''} onChange={(e) => setPlace((s) => ({ ...s, [f.id]: { l: s[f.id]?.l ?? 0, i: s[f.id]?.i ?? 0, [axis]: Number(e.target.value) } }))} className="rounded-md border border-line bg-surface px-1.5 py-1 text-xs text-ink">
                    <option value="" disabled>–</option>
                    {LVL.map((v, k) => <option key={v} value={k}>{v}</option>)}
                  </select>
                </label>
              ))}
              {p && <span className={cx('rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums', score(p) >= 6 ? 'bg-bad-soft text-bad' : score(p) >= 3 ? 'bg-xp-soft text-xp' : 'bg-ok-soft text-ok')}>risk {score(p)}</span>}
              {checked && <span className="text-xs text-faint">lead: risk {score(f.fit)}</span>}
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex items-center gap-3">
        <Button size="sm" variant="primary" onClick={() => setChecked(true)} disabled={!all}>Compare with a lead's rating</Button>
        {!all && <span className="text-xs text-faint">Rate all six first.</span>}
      </div>
      {checked && (
        <p className="mt-3 text-[13.5px] text-ink" aria-live="polite">
          Highest risk: leave deduction and the new night-shift rules (new code + money/compliance), then payroll and SSO (high impact, mature code). Theme colours get the least effort. Your exact numbers matter less than the ordering and your reasoning.
        </p>
      )}
    </div>
  );
}

/* ---------- Race condition ---------- */

type Mode = 'unsafe' | 'synchronized';
const SCRIPT: Record<Mode, { t1: string; t2: string; balance: number; note: string }[]> = {
  unsafe: [
    { t1: 'read balance = 5', t2: '', balance: 5, note: 'Thread 1 reads the balance (5 days).' },
    { t1: '', t2: 'read balance = 5', balance: 5, note: 'Before T1 writes, Thread 2 also reads 5.' },
    { t1: '5 ≥ 4 ✓ → write 5−4 = 1', t2: '', balance: 1, note: 'T1 approves 4 days and writes 1.' },
    { t1: '', t2: '5 ≥ 3 ✓ → write 5−3 = 2', balance: 2, note: 'T2 checked a stale value, approves 3 days and overwrites with 2.' },
    { t1: 'done', t2: 'done', balance: 2, note: 'Lost update: 7 days approved from a 5-day balance, and the stored balance says 2. A check-then-act race.' },
  ],
  synchronized: [
    { t1: 'lock 🔒 · read 5', t2: 'waiting for lock…', balance: 5, note: 'T1 enters the critical section; T2 must wait.' },
    { t1: '5 ≥ 4 ✓ → write 1 · unlock', t2: 'waiting…', balance: 1, note: 'T1 finishes its read-check-write atomically.' },
    { t1: '', t2: 'lock 🔒 · read 1', balance: 1, note: 'T2 now reads the fresh value.' },
    { t1: '', t2: '1 ≥ 3 ✗ → reject · unlock', balance: 1, note: 'The second request is correctly rejected.' },
    { t1: 'done', t2: 'done', balance: 1, note: 'Correct. In Java: synchronized, a ReentrantLock, AtomicInteger.compareAndSet — or in the DB: SELECT … FOR UPDATE / optimistic versioning.' },
  ],
};

export function RaceCondition() {
  const [mode, setMode] = useState<Mode>('unsafe');
  const [i, setI] = useState(0);
  const steps = SCRIPT[mode];
  const s = steps[i];
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Version">
        {(['unsafe', 'synchronized'] as Mode[]).map((m) => (
          <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => { setMode(m); setI(0); }} className={cx('rounded-md border px-3 py-1 text-xs', mode === m ? 'border-accent bg-accent-soft text-accent-strong' : 'border-line text-muted hover:text-ink')}>
            {m === 'unsafe' ? 'No locking' : 'With a lock'}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Lane title="Thread 1 · request 4 days" lines={steps.slice(0, i + 1).map((x) => x.t1)} />
        <div className="flex flex-col items-center justify-center rounded-lg border border-line bg-surface-2 p-3">
          <p className="text-[11px] text-faint">shared balance (heap)</p>
          <p className={cx('text-3xl font-semibold tabular-nums', mode === 'unsafe' && i === steps.length - 1 ? 'text-bad' : 'text-ink')}>{s.balance}</p>
        </div>
        <Lane title="Thread 2 · request 3 days" lines={steps.slice(0, i + 1).map((x) => x.t2)} />
      </div>
      <p className="mt-3 min-h-[40px] text-[13.5px] text-ink" aria-live="polite">{s.note}</p>
      <div className="mt-2 flex gap-1.5">
        <IconBtn label="Previous step" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}><ChevronLeft size={16} /></IconBtn>
        <IconBtn label="Next step" onClick={() => setI((x) => Math.min(steps.length - 1, x + 1))} disabled={i === steps.length - 1}><ChevronRight size={16} /></IconBtn>
        <IconBtn label="Replay" onClick={() => setI(0)}><RotateCcw size={15} /></IconBtn>
      </div>
    </div>
  );
}

function Lane({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 p-2 text-left">
      <p className="mb-1 text-[11px] font-semibold text-faint">{title}</p>
      <ol className="space-y-1">
        {lines.filter(Boolean).map((l, k) => (
          <li key={k} className="animate-rise rounded bg-surface px-1.5 py-1 font-mono text-[11px] text-ink">{l}</li>
        ))}
      </ol>
    </div>
  );
}
