import { Component, lazy, Suspense, type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppShell } from './layout/AppShell';
import { Dashboard } from './pages/Dashboard';

const Feed = lazy(() => import('./pages/Feed'));
const Curriculum = lazy(() => import('./pages/Curriculum'));
const ModulePage = lazy(() => import('./pages/ModulePage'));
const LessonPage = lazy(() => import('./pages/LessonPage'));
const Lab = lazy(() => import('./pages/Lab'));
const ProblemPage = lazy(() => import('./pages/ProblemPage'));
const Arena = lazy(() => import('./pages/Arena'));
const ArenaSession = lazy(() => import('./pages/ArenaSession'));
const Revision = lazy(() => import('./pages/Revision'));
const Projects = lazy(() => import('./pages/Projects'));
const Progress = lazy(() => import('./pages/Progress'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

function Loading() {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="h-7 w-56 animate-pulse rounded-lg bg-surface-2" />
      <div className="h-40 animate-pulse rounded-xl bg-surface-2" />
    </div>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error('SDET Quest error:', error);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="card p-6" role="alert">
          <h1 className="text-lg font-semibold text-ink">Something went wrong on this page</h1>
          <p className="mt-1 text-sm text-muted">Your progress is saved. Try reloading; if this keeps happening, export a backup from Settings.</p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-code p-3 text-xs text-bad">{this.state.error.message}</pre>
          <button type="button" className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink" onClick={() => location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  return (
    <AppShell>
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/learn" element={<Curriculum />} />
            <Route path="/learn/:moduleId" element={<ModulePage />} />
            <Route path="/learn/:moduleId/:lessonId" element={<LessonPage />} />
            <Route path="/lab" element={<Lab />} />
            <Route path="/lab/:problemId" element={<ProblemPage />} />
            <Route path="/arena" element={<Arena />} />
            <Route path="/arena/:mode" element={<ArenaSession />} />
            <Route path="/revision" element={<Revision />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </AppShell>
  );
}
