import { useState } from 'react';
import { Button, cx } from '@/components/ui';

/** Java-style String.hashCode, so learners can check the numbers in jshell. */
export function javaHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

/** HashMap spreads the hash (h ^ h>>>16) and masks with (capacity − 1). */
export function bucketFor(key: string, capacity: number): number {
  const h = javaHash(key);
  return (h ^ (h >>> 16)) & (capacity - 1);
}

const SAMPLE = ['Leave', 'Attendance', 'Payroll', 'Shift', 'CompOff', 'Overtime', 'Holiday', 'Permission', 'Muster', 'Swipe', 'Roster', 'Policy', 'Aa', 'BB'];

export function HashMapBuckets() {
  const [keys, setKeys] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [last, setLast] = useState<string | null>(null);
  const capacity = keys.length + 1 > 16 * 0.75 ? 32 : 16;
  const buckets: string[][] = Array.from({ length: capacity }, () => []);
  for (const k of keys) buckets[bucketFor(k, capacity)].push(k);
  const resized = capacity === 32;

  const add = (k: string) => {
    const key = k.trim().slice(0, 18);
    if (!key || keys.includes(key)) return;
    setKeys((ks) => [...ks, key]);
    setLast(key);
    setInput('');
  };
  const nextSample = SAMPLE.find((s) => !keys.includes(s));

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add(input);
        }}
      >
        <label htmlFor="hm-key" className="sr-only">
          Key to put
        </label>
        <input id="hm-key" value={input} onChange={(e) => setInput(e.target.value)} placeholder='map.put("…", v)' className="h-9 w-44 rounded-lg border border-line bg-surface-2 px-3 font-mono text-sm text-ink" />
        <Button size="sm" variant="primary" type="submit" disabled={!input.trim()}>
          put
        </Button>
        <Button size="sm" onClick={() => nextSample && add(nextSample)} disabled={!nextSample}>
          Add sample key
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setKeys([]); setLast(null); }}>
          Clear
        </Button>
      </form>
      <div className="mt-3 text-[13px] text-muted" aria-live="polite">
        {last ? (
          <>
            <code className="font-mono text-ink">"{last}".hashCode()</code> = {javaHash(last)} → spread & mask with {capacity - 1} → <strong className="text-ink">bucket {bucketFor(last, capacity)}</strong>
            {buckets[bucketFor(last, capacity)].length > 1 && <span className="text-xp"> · collision: chained in the same bucket</span>}
          </>
        ) : (
          'Add keys to see where they land. Try "Aa" and "BB": different strings, identical hashCode.'
        )}
      </div>
      <p className="mt-1 text-xs text-faint">
        {keys.length} entries · capacity {capacity} · load factor 0.75 → resize at {capacity === 16 ? 13 : 25} entries{resized && ' · resized from 16 to 32: every key was rehashed into a new bucket'}
      </p>
      <ol className={cx('mt-3 grid gap-1.5', capacity === 16 ? 'grid-cols-4 sm:grid-cols-8' : 'grid-cols-4 sm:grid-cols-8')} aria-label="Buckets">
        {buckets.map((b, i) => (
          <li key={i} className={cx('min-h-[64px] rounded-lg border p-1.5', b.length > 1 ? 'border-xp/60 bg-xp-soft' : b.length ? 'border-accent/50 bg-accent-soft' : 'border-line bg-surface-2')}>
            <p className="text-[10px] text-faint">[{i}]</p>
            {b.map((k) => (
              <p key={k} className={cx('truncate font-mono text-[11px] text-ink', k === last && 'font-bold')}>
                {k}
              </p>
            ))}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-muted">Java 8+: once one bucket holds more than 8 entries (and capacity ≥ 64) it becomes a red-black tree, so worst-case lookups are O(log n) instead of O(n). equals() decides key identity inside a bucket — which is why overriding equals without hashCode breaks maps.</p>
    </div>
  );
}
