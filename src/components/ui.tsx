import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

/** Shortens text to n characters on a word boundary, with an ellipsis. */
export function clip(text: string, n: number): string {
  if (text.length <= n) return text;
  const cut = text.slice(0, n - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > n / 2 ? cut.lastIndexOf(" ") : cut.length).trimEnd().replace(/[.,;:!?]+$/, "")}…`;
}

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink hover:bg-accent-strong font-semibold',
  secondary: 'bg-surface-2 text-ink border border-line hover:border-line-strong',
  ghost: 'text-muted hover:text-ink hover:bg-surface-2',
  danger: 'bg-bad-soft text-bad border border-bad/30 hover:border-bad',
};
const SIZES = { sm: 'h-8 px-3 text-[13px]', md: 'h-10 px-4 text-sm' };

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: keyof typeof SIZES }) {
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    />
  );
}

export function ButtonLink({ variant = 'secondary', size = 'md', className, ...rest }: LinkProps & { variant?: Variant; size?: keyof typeof SIZES }) {
  return (
    <Link
      {...rest}
      className={cx('inline-flex items-center justify-center gap-2 rounded-lg transition-colors whitespace-nowrap', VARIANTS[variant], SIZES[size], className)}
    />
  );
}

export function Card({ className, children, as: As = 'section', ...rest }: { className?: string; children: ReactNode; as?: 'section' | 'div' | 'article' | 'li'; 'aria-label'?: string; 'aria-labelledby'?: string }) {
  return (
    <As className={cx('card p-5', className)} {...rest}>
      {children}
    </As>
  );
}

const TONES = {
  neutral: 'bg-surface-2 text-muted border-line',
  accent: 'bg-accent-soft text-accent-strong border-transparent',
  ok: 'bg-ok-soft text-ok border-transparent',
  bad: 'bg-bad-soft text-bad border-transparent',
  warn: 'bg-warn-soft text-warn border-transparent',
  info: 'bg-info-soft text-info border-transparent',
  xp: 'bg-xp-soft text-xp border-transparent',
};
export type Tone = keyof typeof TONES;

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11.5px] font-medium', TONES[tone], className)}>{children}</span>;
}

export function ProgressBar({ value, tone = 'accent', label, className }: { value: number; tone?: 'accent' | 'xp' | 'ok' | 'bad' | 'warn'; label: string; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = { accent: 'bg-accent', xp: 'bg-xp', ok: 'bg-ok', bad: 'bg-bad', warn: 'bg-warn' }[tone];
  return (
    <div className={cx('h-1.5 w-full overflow-hidden rounded-full bg-surface-2', className)} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
      <div className={cx('h-full rounded-full transition-[width] duration-500', color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function PageHeader({ title, kicker, children }: { title: string; kicker?: string; children?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {kicker && <p className="mb-1 text-xs font-medium uppercase tracking-[0.12em] text-faint">{kicker}</p>}
        <h1 className="text-[26px] font-semibold tracking-tight text-ink">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

export function SectionTitle({ children, id, action }: { children: ReactNode; id?: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 id={id} className="text-[15px] font-semibold text-ink">
        {children}
      </h2>
      {action}
    </div>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line px-5 py-8 text-center">
      <p className="font-medium text-ink">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-md text-sm text-muted">{children}</div>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'xp' | 'accent' | 'ok' | 'bad' }) {
  const color = tone ? { xp: 'text-xp', accent: 'text-accent-strong', ok: 'text-ok', bad: 'text-bad' }[tone] : 'text-ink';
  return (
    <div>
      <p className="text-xs text-faint">{label}</p>
      <p className={cx('mt-0.5 text-2xl font-semibold tabular-nums tracking-tight', color)}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

/** Honest labelling for simulated or not-yet-built features. */
export function Notice({ tone = 'info', title, children }: { tone?: 'info' | 'warn' | 'ok'; title?: string; children: ReactNode }) {
  const cls = { info: 'border-info/30 bg-info-soft', warn: 'border-warn/30 bg-warn-soft', ok: 'border-ok/30 bg-ok-soft' }[tone];
  return (
    <div className={cx('rounded-lg border px-3.5 py-2.5 text-[13px] leading-relaxed text-ink', cls)} role="note">
      {title && <span className="font-semibold">{title} </span>}
      {children}
    </div>
  );
}
