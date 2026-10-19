import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Circle, PlayCircle } from 'lucide-react';
import { getModule, getProblem, INTERVIEWS, MODULES, PROBLEMS } from '@/content';
import { LEVEL_LABELS, SKILL_LABELS, AREAS } from '@/content/types';
import { useProgress } from '@/store/progress';
import { allMastery, masteryLabel } from '@/lib/mastery';
import { isUnlocked, moduleProgress } from '@/lib/recommend';
import { useDocumentTitle } from '@/lib/hooks';
import { Badge, ButtonLink, Card, Empty, Notice, PageHeader, ProgressBar, SectionTitle } from '@/components/ui';
import NotFound from './NotFound';

export default function ModulePage() {
  const { moduleId = '' } = useParams();
  const m = getModule(moduleId);
  useDocumentTitle(m?.title ?? 'Module');
  const lessons = useProgress((s) => s.lessons);
  const attempts = useProgress((s) => s.attempts);
  if (!m) return <NotFound />;
  const p = moduleProgress(m, lessons);
  const mastery = allMastery(attempts);
  const unlocked = isUnlocked(m, { lessons, attempts });
  const problems = PROBLEMS.filter((x) => x.moduleId === m.id);
  const interviews = INTERVIEWS.filter((q) => q.revision[0] === m.id);
  const next = m.lessons.find((l) => !lessons[l.id]?.completedAt);
  const prereqs = m.prerequisites.map((id) => MODULES.find((x) => x.id === id)!).filter(Boolean);

  return (
    <div className="space-y-5">
      <nav aria-label="Breadcrumb" className="text-xs text-faint">
        <Link to="/learn" className="hover:text-ink">
          Curriculum
        </Link>{' '}
        / Module {m.number}
      </nav>
      <PageHeader title={m.title} kicker={`Module ${m.number} · ${AREAS[m.area]} · ${m.level} ${LEVEL_LABELS[m.level]}`}>
        {next && (
          <ButtonLink to={`/learn/${m.id}/${next.id}`} variant="primary">
            <PlayCircle size={16} aria-hidden="true" /> {p.done ? 'Continue' : 'Start'} module
          </ButtonLink>
        )}
      </PageHeader>
      <p className="max-w-3xl text-[15px] text-muted">{m.summary}</p>

      {!unlocked && prereqs.length > 0 && (
        <Notice tone="warn" title="Recommended order:">
          this module builds on {prereqs.map((x) => `M${x.number} ${x.title}`).join(' and ')}. You can open it anyway.
        </Notice>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" aria-labelledby="lessons-title">
          <SectionTitle id="lessons-title">Lessons</SectionTitle>
          {m.lessons.length === 0 ? (
            <Empty title="This module is planned">
              Its topics are mapped in the roadmap below and in <code>docs/requirements-traceability.md</code>, but lessons haven't been written yet. The original study notes live in <code>{m.source}</code>.
            </Empty>
          ) : (
            <ol className="space-y-2">
              {m.lessons.map((l, i) => {
                const lp = lessons[l.id];
                const done = !!lp?.completedAt;
                return (
                  <li key={l.id}>
                    <Link to={`/learn/${m.id}/${l.id}`} className="flex items-center gap-3 rounded-lg border border-line px-3 py-3 hover:border-line-strong hover:bg-surface-2">
                      {done ? <CheckCircle2 size={18} className="shrink-0 text-ok" aria-label="Completed" /> : <Circle size={18} className="shrink-0 text-faint" aria-label="Not completed" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">
                          {i + 1}. {l.title}
                        </p>
                        <p className="text-xs text-muted">
                          {l.minutes} min · {l.sections.length} steps{lp && !done ? ` · ${lp.done.length} done` : ''}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>
        <Card aria-labelledby="mod-progress">
          <SectionTitle id="mod-progress">Your progress</SectionTitle>
          <p className="text-xs text-faint">
            Lessons {p.done}/{p.total}
          </p>
          <ProgressBar value={p.pct} label="Lessons completed" className="mt-1" />
          <ul className="mt-4 space-y-2">
            {m.skills.map((s) => (
              <li key={s}>
                <div className="flex justify-between text-[13px]">
                  <span className="text-ink">{SKILL_LABELS[s]}</span>
                  <span className="text-muted">
                    {mastery[s].mastery} · {masteryLabel(mastery[s])}
                  </span>
                </div>
                <ProgressBar value={mastery[s].mastery} tone="xp" label={`${SKILL_LABELS[s]} mastery`} className="mt-1" />
              </li>
            ))}
          </ul>
          {problems.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-faint">Coding Lab problems</p>
              <ul className="mt-1 space-y-1">
                {problems.map((x) => (
                  <li key={x.id}>
                    <Link to={`/lab/${x.id}`} className="text-[13px] text-accent-strong hover:underline">
                      {getProblem(x.id)?.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {interviews.length > 0 && <p className="mt-3 text-xs text-muted">{interviews.length} interview question(s) from this module are in the Interview Arena.</p>}
        </Card>
      </div>

      <Card aria-labelledby="topics-title">
        <SectionTitle id="topics-title">Topics covered ({m.topics.length})</SectionTitle>
        <ul className="flex flex-wrap gap-1.5">
          {m.topics.map((t) => (
            <li key={t}>
              <Badge>{t}</Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
