import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { MODULES } from '@/content';
import { AREAS, LEVEL_LABELS, LEVELS, SKILL_LABELS, type Area } from '@/content/types';
import { useProgress } from '@/store/progress';
import { allMastery } from '@/lib/mastery';
import { isUnlocked, moduleProgress } from '@/lib/recommend';
import { useDocumentTitle } from '@/lib/hooks';
import { Badge, PageHeader, ProgressBar, cx } from '@/components/ui';

type Status = 'all' | 'not-started' | 'in-progress' | 'done' | 'planned';

export default function Curriculum() {
  useDocumentTitle('Curriculum');
  const lessons = useProgress((s) => s.lessons);
  const attempts = useProgress((s) => s.attempts);
  const mastery = allMastery(attempts);
  const [q, setQ] = useState('');
  const [area, setArea] = useState<Area | 'all'>('all');
  const [level, setLevel] = useState<string>('all');
  const [status, setStatus] = useState<Status>('all');

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return MODULES.filter((m) => {
      if (area !== 'all' && m.area !== area) return false;
      if (level !== 'all' && m.level !== level) return false;
      const p = moduleProgress(m, lessons);
      const st: Status = m.lessons.length === 0 ? 'planned' : p.done === 0 ? 'not-started' : p.done === p.total ? 'done' : 'in-progress';
      if (status !== 'all' && st !== status) return false;
      if (!needle) return true;
      const hay = [m.title, m.summary, ...m.topics, ...m.tags, ...m.lessons.map((l) => l.title)].join(' ').toLowerCase();
      return hay.includes(needle);
    });
  }, [q, area, level, status, lessons]);

  return (
    <div>
      <PageHeader title="Curriculum" kicker={`${MODULES.length} modules · ${MODULES.reduce((s, m) => s + m.topics.length, 0)} mapped topics`} />

      <div className="card mb-5 flex flex-wrap items-end gap-3 p-3">
        <label className="relative min-w-[220px] flex-1">
          <span className="sr-only">Search the curriculum</span>
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search topics: ThreadLocal, JWT, sharding, STAR…" className="h-9 w-full rounded-lg border border-line bg-surface-2 pl-9 pr-3 text-sm text-ink placeholder:text-faint" />
        </label>
        <Select label="Area" value={area} onChange={(v) => setArea(v as Area | 'all')} options={[['all', 'All areas'], ...Object.entries(AREAS).map(([k, v]) => [k, `${k} · ${v}`] as [string, string])]} />
        <Select label="Level" value={level} onChange={setLevel} options={[['all', 'All levels'], ...LEVELS.map((l) => [l, `${l} · ${LEVEL_LABELS[l]}`] as [string, string])]} />
        <Select label="Status" value={status} onChange={(v) => setStatus(v as Status)} options={[['all', 'Any status'], ['not-started', 'Not started'], ['in-progress', 'In progress'], ['done', 'Completed'], ['planned', 'Planned']]} />
      </div>

      <p className="mb-3 text-xs text-faint" aria-live="polite">
        {rows.length} module{rows.length === 1 ? '' : 's'}
      </p>
      <ul className="grid gap-3 md:grid-cols-2">
        {rows.map((m) => {
          const p = moduleProgress(m, lessons);
          const unlocked = isUnlocked(m, { lessons, attempts });
          const planned = m.lessons.length === 0;
          const mins = m.lessons.reduce((s, l) => s + l.minutes, 0);
          const best = Math.max(...m.skills.map((s) => mastery[s].mastery));
          return (
            <li key={m.id}>
              <Link to={`/learn/${m.id}`} className={cx('card block h-full p-4 transition-colors hover:border-line-strong', planned && 'opacity-80')} data-testid={`module-${m.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-faint">
                      Module {m.number} · Area {m.area}
                    </p>
                    <h2 className="mt-0.5 font-semibold text-ink">{m.title}</h2>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge>{m.level}</Badge>
                    {planned ? <Badge tone="warn">Planned</Badge> : p.done === p.total ? <Badge tone="ok">Done</Badge> : !unlocked ? <Badge tone="neutral">Prereqs first</Badge> : null}
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-[13px] text-muted">{m.summary}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.skills.map((s) => (
                    <Badge key={s} tone="accent">
                      {SKILL_LABELS[s]}
                    </Badge>
                  ))}
                  {!planned && <Badge>{mins} min</Badge>}
                  {m.prerequisites.length > 0 && <Badge>after {m.prerequisites.map((x) => 'M' + Number(x.slice(1))).join(', ')}</Badge>}
                </div>
                {!planned && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[11px] text-faint">
                        Lessons {p.done}/{p.total}
                      </p>
                      <ProgressBar value={p.pct} label={`${m.title} lessons completed`} className="mt-1" />
                    </div>
                    <div>
                      <p className="text-[11px] text-faint">Mastery {best}</p>
                      <ProgressBar value={best} tone="xp" label={`${m.title} mastery`} className="mt-1" />
                    </div>
                  </div>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="text-xs text-faint">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 block h-9 rounded-lg border border-line bg-surface-2 px-2 text-sm text-ink">
        {options.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}
