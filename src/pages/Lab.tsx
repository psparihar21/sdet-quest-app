import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, CircleDashed } from 'lucide-react';
import { getModule, PROBLEMS } from '@/content';
import { SKILL_LABELS } from '@/content/types';
import { useProgress } from '@/store/progress';
import { latestByItem } from '@/lib/mastery';
import { useDocumentTitle } from '@/lib/hooks';
import { Badge, Card, Notice, PageHeader, cx } from '@/components/ui';

const KIND_LABEL = { js: 'JS / TS · runs', sql: 'SQL · runs', java: 'Java · self-review' } as const;

export default function Lab() {
  useDocumentTitle('Coding Lab');
  const attempts = useProgress((s) => s.attempts);
  const latest = latestByItem(attempts.filter((a) => a.itemType === 'problem'));
  const best = new Map<string, number>();
  for (const a of attempts) if (a.itemType === 'problem') best.set(a.itemId, Math.max(best.get(a.itemId) ?? 0, a.score));
  const [kind, setKind] = useState<'all' | 'js' | 'sql' | 'java'>('all');
  const [diff, setDiff] = useState(0);
  const list = PROBLEMS.filter((p) => (kind === 'all' || p.kind === kind) && (!diff || p.difficulty === diff)).sort((a, b) => a.difficulty - b.difficulty);
  const solved = PROBLEMS.filter((p) => (best.get(p.id) ?? 0) >= 1).length;

  return (
    <div>
      <PageHeader title="Coding Lab" kicker={`${solved}/${PROBLEMS.length} solved`} />
      <div className="mb-4">
        <Notice>
          JavaScript/TypeScript and SQL problems <strong>really execute in your browser</strong> (isolated Web Worker; in-browser SQLite). Nothing is sent to a server. Java problems are code-reading and self-review exercises — Java does not run here.
        </Notice>
      </div>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter problems">
        {(['all', 'js', 'sql', 'java'] as const).map((k) => (
          <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={cx('rounded-md border px-3 py-1 text-xs', kind === k ? 'border-accent bg-accent-soft text-accent-strong' : 'border-line text-muted hover:text-ink')}>
            {k === 'all' ? 'All' : KIND_LABEL[k]}
          </button>
        ))}
        <span className="mx-1 w-px bg-line" aria-hidden="true" />
        {[0, 1, 2, 3, 4].map((d) => (
          <button key={d} type="button" aria-pressed={diff === d} onClick={() => setDiff(d)} className={cx('rounded-md border px-3 py-1 text-xs', diff === d ? 'border-accent bg-accent-soft text-accent-strong' : 'border-line text-muted hover:text-ink')}>
            {d === 0 ? 'Any difficulty' : `Level ${d}`}
          </button>
        ))}
      </div>
      <Card className="p-0">
        <ul className="divide-y divide-line">
          {list.map((p) => {
            const b = best.get(p.id);
            const l = latest.get(`problem:${p.id}`);
            const m = getModule(p.moduleId);
            return (
              <li key={p.id}>
                <Link to={`/lab/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
                  {b === undefined ? <Circle size={17} className="shrink-0 text-faint" aria-label="Not attempted" /> : b >= 1 ? <CheckCircle2 size={17} className="shrink-0 text-ok" aria-label="Solved" /> : <CircleDashed size={17} className="shrink-0 text-xp" aria-label="Attempted" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{p.title}</p>
                    <p className="truncate text-xs text-muted">
                      M{m?.number} · {SKILL_LABELS[p.skill]}
                      {l && b !== undefined && b < 1 ? ` · last ${Math.round(l.score * 100)}%` : ''}
                    </p>
                  </div>
                  <Badge tone={p.kind === 'java' ? 'neutral' : 'accent'}>{KIND_LABEL[p.kind]}</Badge>
                  <Badge>L{p.difficulty}</Badge>
                </Link>
              </li>
            );
          })}
          {list.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">No problems match these filters.</li>}
        </ul>
      </Card>
    </div>
  );
}
