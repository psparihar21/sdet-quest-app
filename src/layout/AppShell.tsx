import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Code2,
  FolderKanban,
  LayoutDashboard,
  Menu,
  MessagesSquare,
  Moon,
  RotateCcw,
  Settings,
  Sun,
  X,
} from 'lucide-react';
import { useProgress } from '@/store/progress';
import { totalXp, levelFor } from '@/lib/xp';
import { dueCards } from '@/lib/srs';
import { useApplySettings, useToday } from '@/lib/hooks';
import { storageUnavailable } from '@/store/repository';
import { cx } from '@/components/ui';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/learn', label: 'Curriculum', icon: BookOpen },
  { to: '/lab', label: 'Coding Lab', icon: Code2 },
  { to: '/arena', label: 'Interview Arena', icon: MessagesSquare },
  { to: '/revision', label: 'Revision', icon: RotateCcw },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="var(--surface-2)" stroke="var(--border)" />
        <path d="M8 21l5-10 4 7 2-3 5 6" fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="leading-tight">
        <p className="text-[15px] font-semibold tracking-tight text-ink">SDET Quest</p>
        <p className="text-[11px] text-faint">SDET 3 · QA Lead prep</p>
      </div>
    </div>
  );
}

function NavItems({ dueCount, onNavigate }: { dueCount: number; onNavigate?: () => void }) {
  return (
    <ul className="space-y-0.5">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] transition-colors',
                isActive ? 'bg-accent-soft text-accent-strong font-medium' : 'text-muted hover:bg-surface-2 hover:text-ink',
              )
            }
          >
            <Icon size={17} aria-hidden="true" />
            <span className="flex-1">{label}</span>
            {to === '/revision' && dueCount > 0 && (
              <span className="rounded-md bg-warn-soft px-1.5 text-[11px] font-semibold text-warn" aria-label={`${dueCount} due`}>
                {dueCount}
              </span>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

function XpChip() {
  const attempts = useProgress((s) => s.attempts);
  const xp = totalXp(attempts);
  const lvl = levelFor(xp);
  return (
    <div className="rounded-xl border border-line bg-surface p-3" aria-label={`Level ${lvl.level}, ${xp} XP`}>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-faint">Level</span>
        <span className="text-xs tabular-nums text-xp">{xp} XP</span>
      </div>
      <p className="text-lg font-semibold tabular-nums text-ink">{lvl.level}</p>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-xp" style={{ width: `${Math.round(lvl.progress * 100)}%` }} />
      </div>
      <p className="mt-1 text-[11px] text-faint">
        {lvl.next - lvl.current} XP to level {lvl.level + 1} · earned by correct work only
      </p>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  useApplySettings();
  const today = useToday();
  const srs = useProgress((s) => s.srs);
  const theme = useProgress((s) => s.settings.theme);
  const updateSettings = useProgress((s) => s.updateSettings);
  const dueCount = dueCards(srs, today).length;
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const [noStorage] = useState(storageUnavailable);

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const toggleTheme = () => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' });

  return (
    <div className="min-h-dvh bg-bg">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-elev px-3 py-4 lg:flex" aria-label="Primary">
        <div className="px-2 pb-5">
          <Logo />
        </div>
        <nav aria-label="Main navigation">
          <NavItems dueCount={dueCount} />
        </nav>
        <div className="mt-auto space-y-3">
          <XpChip />
          <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-muted hover:bg-surface-2 hover:text-ink"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
            {theme === 'dark' ? 'Light theme' : 'Dark theme'}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-elev/95 px-4 py-2.5 backdrop-blur lg:hidden">
        <Logo />
        <div className="flex items-center gap-1">
          <button type="button" onClick={toggleTheme} className="rounded-lg p-2 text-muted hover:bg-surface-2" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>
          <button type="button" onClick={() => setOpen(true)} className="rounded-lg p-2 text-ink hover:bg-surface-2" aria-label="Open menu" aria-expanded={open} aria-controls="mobile-nav">
            <Menu size={20} aria-hidden="true" />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close menu" onClick={() => setOpen(false)} />
          <nav id="mobile-nav" className="absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col gap-4 overflow-y-auto border-l border-line bg-elev p-4" aria-label="Main navigation">
            <div className="flex items-center justify-between">
              <Logo />
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-muted hover:bg-surface-2" aria-label="Close menu">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <NavItems dueCount={dueCount} onNavigate={() => setOpen(false)} />
            <XpChip />
          </nav>
        </div>
      )}

      <main id="main" className="px-4 pb-16 pt-6 sm:px-6 lg:ml-60 lg:px-10 lg:pt-8">
        <div className="mx-auto max-w-6xl">
          {noStorage && (
            <div className="mb-4 rounded-lg border border-warn/30 bg-warn-soft px-3 py-2 text-[13px] text-ink" role="alert">
              Browser storage is blocked (private mode or site settings), so progress will be lost when you close this tab. Export a backup from Settings.
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
