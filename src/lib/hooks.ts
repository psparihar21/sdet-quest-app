import { useEffect, useState, useSyncExternalStore } from 'react';
import { useProgress } from '@/store/progress';

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

/** True when animations should be skipped: the learner's setting wins, else the OS preference. */
export function useReducedMotion(): boolean {
  const motion = useProgress((s) => s.settings.motion);
  const system = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  );
  return motion === 'reduce' || (motion === 'system' && system);
}

/** Keeps <html data-theme / data-motion> in sync with settings. */
export function useApplySettings() {
  const theme = useProgress((s) => s.settings.theme);
  const motion = useProgress((s) => s.settings.motion);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.motion = motion;
  }, [theme, motion]);
}

/** Today as yyyy-mm-dd, refreshed when the tab regains focus (so "due today" stays right past midnight). */
export function useToday(): string {
  const [day, setDay] = useState(() => new Date().toDateString());
  useEffect(() => {
    const onFocus = () => setDay(new Date().toDateString());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);
  const d = new Date(day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · SDET Quest` : 'SDET Quest';
  }, [title]);
}
