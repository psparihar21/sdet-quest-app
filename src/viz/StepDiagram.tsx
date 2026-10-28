import { useEffect, useId, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import { useReducedMotion } from '@/lib/hooks';
import { cx } from '@/components/ui';

export interface DNode {
  id: string;
  label: string;
  sub?: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  /** Group boxes are drawn behind regular nodes. */
  group?: boolean;
}
export interface DEdge {
  from: string;
  to: string;
  label?: string;
  /** Curve the edge sideways (px) so back-and-forth arrows don't overlap. */
  bend?: number;
}
export interface DStep {
  title: string;
  text: string;
  nodes: string[];
  edges?: string[]; // "from>to"
}
export interface DiagramSpec {
  width: number;
  height: number;
  nodes: DNode[];
  edges: DEdge[];
  steps: DStep[];
}

function center(n: DNode) {
  return { x: n.x + (n.w ?? 120) / 2, y: n.y + (n.h ?? 44) / 2 };
}

/** Point where the line from a node's centre toward (tx, ty) leaves its box. */
function boxExit(n: DNode, tx: number, ty: number) {
  const c = center(n);
  const w = (n.w ?? 120) / 2 + 3;
  const h = (n.h ?? 44) / 2 + 3;
  const dx = tx - c.x;
  const dy = ty - c.y;
  const s = Math.min(Math.abs(dx) > 0 ? w / Math.abs(dx) : Infinity, Math.abs(dy) > 0 ? h / Math.abs(dy) : Infinity);
  return { x: c.x + dx * s, y: c.y + dy * s };
}

/**
 * A step-through animated diagram with play / pause / step / replay controls.
 * Each step highlights nodes and animates the active edges; the step text is announced to screen readers.
 */
export function StepDiagram({ spec, label }: { spec: DiagramSpec; label: string }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reduced = useReducedMotion();
  const markerId = useId().replace(/:/g, '');
  const s = spec.steps[step];
  const last = spec.steps.length - 1;

  useEffect(() => {
    if (!playing) return;
    if (step >= last) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStep((x) => x + 1), reduced ? 3500 : 2400);
    return () => clearTimeout(t);
  }, [playing, step, last, reduced]);

  const byId = new Map(spec.nodes.map((n) => [n.id, n]));
  const activeEdges = new Set(s.edges ?? []);
  const activeNodes = new Set(s.nodes);

  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="overflow-x-auto p-3">
        <svg viewBox={`0 0 ${spec.width} ${spec.height}`} className="mx-auto block h-auto w-full min-w-[520px] max-w-[880px]" role="img" aria-label={`${label}. Step ${step + 1} of ${spec.steps.length}: ${s.title}`}>
          <defs>
            <marker id={`arrow-${markerId}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--text-faint)" />
            </marker>
            <marker id={`arrow-on-${markerId}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
            </marker>
          </defs>
          {spec.nodes
            .filter((n) => n.group)
            .map((n) => (
              <g key={n.id}>
                <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={12} fill={activeNodes.has(n.id) ? 'var(--accent-soft)' : 'var(--surface-2)'} stroke="var(--border)" strokeDasharray="4 4" />
                <text x={n.x + 10} y={n.y + 18} fontSize="11" fill="var(--text-faint)" fontWeight={600}>
                  {n.label}
                </text>
              </g>
            ))}
          {spec.edges.map((e) => {
            const a = byId.get(e.from)!;
            const b = byId.get(e.to)!;
            const ca = center(a);
            const cb = center(b);
            const bend = e.bend ?? 0;
            const mx = (ca.x + cb.x) / 2;
            const my = (ca.y + cb.y) / 2;
            const len = Math.hypot(cb.x - ca.x, cb.y - ca.y) || 1;
            const cx1 = mx + (-(cb.y - ca.y) / len) * bend;
            const cy1 = my + ((cb.x - ca.x) / len) * bend;
            const p1 = boxExit(a, cx1, cy1);
            const p2 = boxExit(b, cx1, cy1);
            const on = activeEdges.has(`${e.from}>${e.to}`);
            const d = bend ? `M${p1.x},${p1.y} Q${cx1},${cy1} ${p2.x},${p2.y}` : `M${p1.x},${p1.y} L${p2.x},${p2.y}`;
            return (
              <g key={`${e.from}>${e.to}`}>
                <path d={d} fill="none" stroke={on ? 'var(--accent)' : 'var(--text-faint)'} strokeWidth={on ? 2.2 : 1.3} markerEnd={`url(#${on ? 'arrow-on-' : 'arrow-'}${markerId})`} className={cx(on && !reduced && 'flow-line')} />
                {e.label && (
                  <text x={bend ? cx1 : mx} y={(bend ? cy1 : my) - 6} fontSize="10.5" textAnchor="middle" fill={on ? 'var(--accent-strong)' : 'var(--text-faint)'}>
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}
          {spec.nodes
            .filter((n) => !n.group)
            .map((n) => {
              const on = activeNodes.has(n.id);
              const w = n.w ?? 120;
              const h = n.h ?? 44;
              return (
                <g key={n.id} style={{ transition: 'opacity .3s' }} opacity={s.nodes.length && !on ? 0.8 : 1}>
                  <rect x={n.x} y={n.y} width={w} height={h} rx={9} fill={on ? 'var(--accent-soft)' : 'var(--surface-2)'} stroke={on ? 'var(--accent)' : 'var(--border)'} strokeWidth={on ? 2 : 1} />
                  <text x={n.x + w / 2} y={n.y + (n.sub ? h / 2 - 3 : h / 2 + 4)} fontSize="12.5" textAnchor="middle" fill="var(--text)" fontWeight={600}>
                    {n.label}
                  </text>
                  {n.sub && (
                    <text x={n.x + w / 2} y={n.y + h / 2 + 12} fontSize="10.5" textAnchor="middle" fill="var(--text-muted)">
                      {n.sub}
                    </text>
                  )}
                </g>
              );
            })}
        </svg>
      </div>
      <div className="border-t border-line px-4 py-3">
        <div className="min-h-[64px]" aria-live="polite">
          <p className="text-sm font-semibold text-ink">
            <span className="mr-2 text-xs font-medium text-faint">
              {step + 1}/{spec.steps.length}
            </span>
            {s.title}
          </p>
          <p className="mt-0.5 text-[13.5px] leading-relaxed text-muted">{s.text}</p>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <IconBtn label="Previous step" onClick={() => setStep((x) => Math.max(0, x - 1))} disabled={step === 0}>
            <ChevronLeft size={16} />
          </IconBtn>
          <IconBtn label={playing ? 'Pause' : 'Play'} onClick={() => (step >= last ? (setStep(0), setPlaying(true)) : setPlaying((p) => !p))}>
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </IconBtn>
          <IconBtn label="Next step" onClick={() => setStep((x) => Math.min(last, x + 1))} disabled={step === last}>
            <ChevronRight size={16} />
          </IconBtn>
          <IconBtn label="Replay from start" onClick={() => { setStep(0); setPlaying(false); }}>
            <RotateCcw size={15} />
          </IconBtn>
          <div className="ml-2 flex gap-1" aria-hidden="true">
            {spec.steps.map((_, i) => (
              <span key={i} className={cx('h-1.5 w-4 rounded-full', i <= step ? 'bg-accent' : 'bg-surface-2')} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function IconBtn({ label, children, onClick, disabled }: { label: string; children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink hover:border-line-strong hover:bg-surface-2 disabled:opacity-40">
      {children}
    </button>
  );
}
