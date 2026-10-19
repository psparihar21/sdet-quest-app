import { useId, useState } from 'react';
import { cx } from '@/components/ui';

const LAYERS = [
  { key: 'ui', label: 'E2E / UI', secs: 20, flaky: 0.01, color: 'var(--bad)' },
  { key: 'api', label: 'Integration / API', secs: 0.4, flaky: 0.001, color: 'var(--xp)' },
  { key: 'unit', label: 'Unit', secs: 0.02, flaky: 0.0001, color: 'var(--ok)' },
] as const;

const PRESETS = {
  'Healthy pyramid': { ui: 5, api: 25, unit: 70 },
  'Ice-cream cone': { ui: 80, api: 10, unit: 10 },
  'Honeycomb (services)': { ui: 10, api: 70, unit: 20 },
};

export function shapeName(mix: { ui: number; api: number; unit: number }): string {
  if (mix.unit >= mix.api && mix.api >= mix.ui) return 'Pyramid';
  if (mix.ui > mix.api && mix.ui > mix.unit) return 'Ice-cream cone (inverted)';
  if (mix.api > mix.unit && mix.api > mix.ui) return 'Diamond / honeycomb';
  return 'Irregular';
}

/** Simple model: 500 tests, serial run time and the chance at least one test fails for non-code reasons. */
export function suiteModel(mix: { ui: number; api: number; unit: number }, total = 500) {
  const sum = mix.ui + mix.api + mix.unit || 1;
  let seconds = 0;
  let pass = 1;
  const counts: Record<string, number> = {};
  for (const l of LAYERS) {
    const n = Math.round((mix[l.key] / sum) * total);
    counts[l.key] = n;
    seconds += n * l.secs;
    pass *= Math.pow(1 - l.flaky, n);
  }
  return { counts, minutes: seconds / 60, flakyRun: 1 - pass };
}

export function TestPyramid() {
  const [mix, setMix] = useState<{ ui: number; api: number; unit: number }>(PRESETS['Ice-cream cone']);
  const id = useId();
  const model = suiteModel(mix);
  const sum = mix.ui + mix.api + mix.unit || 1;

  // Draw three stacked bands; each band's width is proportional to its share.
  const W = 360;
  const bandH = 52;
  const bands = LAYERS.map((l, i) => {
    const share = mix[l.key] / sum;
    const w = 170 + share * (W - 170);
    return { ...l, w, y: 12 + i * (bandH + 6), share };
  });

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Presets">
        {Object.entries(PRESETS).map(([name, p]) => (
          <button key={name} type="button" onClick={() => setMix(p)} className={cx('rounded-md border px-2.5 py-1 text-xs', JSON.stringify(p) === JSON.stringify(mix) ? 'border-accent bg-accent-soft text-accent-strong' : 'border-line text-muted hover:text-ink')}>
            {name}
          </button>
        ))}
      </div>
      <div className="grid items-center gap-5 md:grid-cols-[minmax(0,380px)_1fr]">
        <svg viewBox={`0 0 ${W + 20} 190`} className="w-full" role="img" aria-label={`Test distribution shape: ${shapeName(mix)}. UI ${Math.round((mix.ui / sum) * 100)}%, API ${Math.round((mix.api / sum) * 100)}%, unit ${Math.round((mix.unit / sum) * 100)}%.`}>
          {bands.map((b) => (
            <g key={b.key}>
              <rect x={(W + 20 - b.w) / 2} y={b.y} width={b.w} height={bandH} rx={8} fill={b.color} opacity={0.18} stroke={b.color} style={{ transition: 'all .4s ease' }} />
              <text x={(W + 20) / 2} y={b.y + bandH / 2 - 2} textAnchor="middle" fontSize="12.5" fontWeight={600} fill="var(--text)">
                {b.label}
              </text>
              <text x={(W + 20) / 2} y={b.y + bandH / 2 + 14} textAnchor="middle" fontSize="11" fill="var(--text-muted)">
                {model.counts[b.key]} tests · {Math.round(b.share * 100)}%
              </text>
            </g>
          ))}
        </svg>
        <div className="space-y-3">
          {LAYERS.map((l) => (
            <div key={l.key}>
              <label htmlFor={`${id}-${l.key}`} className="flex justify-between text-[13px] text-ink">
                <span>{l.label}</span>
                <span className="tabular-nums text-muted">{mix[l.key]}</span>
              </label>
              <input id={`${id}-${l.key}`} type="range" min={0} max={100} value={mix[l.key]} onChange={(e) => setMix((m) => ({ ...m, [l.key]: Number(e.target.value) }))} className="w-full accent-[var(--accent)]" />
            </div>
          ))}
          <div className="grid grid-cols-3 gap-2 pt-1" aria-live="polite">
            <div className="rounded-lg bg-surface-2 p-2.5">
              <p className="text-[11px] text-faint">Shape</p>
              <p className="text-[13px] font-semibold text-ink">{shapeName(mix)}</p>
            </div>
            <div className="rounded-lg bg-surface-2 p-2.5">
              <p className="text-[11px] text-faint">Serial run time</p>
              <p className={cx('text-[13px] font-semibold tabular-nums', model.minutes > 60 ? 'text-bad' : model.minutes > 20 ? 'text-xp' : 'text-ok')}>{model.minutes < 1 ? '<1' : Math.round(model.minutes)} min</p>
            </div>
            <div className="rounded-lg bg-surface-2 p-2.5">
              <p className="text-[11px] text-faint">Runs with a flaky failure</p>
              <p className={cx('text-[13px] font-semibold tabular-nums', model.flakyRun > 0.5 ? 'text-bad' : model.flakyRun > 0.1 ? 'text-xp' : 'text-ok')}>{Math.round(model.flakyRun * 100)}%</p>
            </div>
          </div>
          <p className="text-xs text-faint">Model assumptions: 500 tests; UI 20 s / 1% flaky, API 0.4 s / 0.1%, unit 0.02 s / 0.01% per test.</p>
        </div>
      </div>
    </div>
  );
}
