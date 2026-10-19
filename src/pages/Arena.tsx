import { Link } from 'react-router-dom';
import { Lock, Swords } from 'lucide-react';
import { INTERVIEW_MODES } from '@/content/types';
import { useProgress } from '@/store/progress';
import { BOSS_UNLOCK, MODE_INFO, poolFor } from '@/lib/arena';
import { useDocumentTitle } from '@/lib/hooks';
import { Badge, Card, Empty, Notice, PageHeader, SectionTitle, cx } from '@/components/ui';
import { StoryBank } from '@/components/StoryBank';

export default function Arena() {
  useDocumentTitle('Interview Arena');
  const attempts = useProgress((s) => s.attempts);
  const interviews = useProgress((s) => s.interviews);
  const answered = attempts.filter((a) => a.itemType === 'interview').length;
  const bossReady = answered >= BOSS_UNLOCK;
  const history = [...interviews].filter((i) => i.answers.length > 0).reverse().slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader title="Interview Arena" kicker="One question at a time · rubric feedback" />
      <Notice>
        Answers are scored by a transparent, deterministic rubric (not an AI). Each answer gets technical, depth and communication scores, a seniority signal, missing points, a better structure, an illustrative model answer and a realistic follow-up.
      </Notice>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {INTERVIEW_MODES.map((mode) => {
          const info = MODE_INFO[mode];
          const n = poolFor(mode).length;
          const locked = info.boss && !bossReady;
          return (
            <li key={mode}>
              <Card className={cx('flex h-full flex-col', info.boss && 'border-xp/40')}>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-ink">{info.title}</h2>
                  {info.boss && (
                    <Badge tone="xp">
                      <Swords size={12} aria-hidden="true" /> Boss
                    </Badge>
                  )}
                </div>
                <p className="mt-1 flex-1 text-[13px] text-muted">{info.blurb}</p>
                <p className="mt-2 text-xs text-faint">{n ? `${n} question${n > 1 ? 's' : ''} available` : 'Questions planned'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {n === 0 ? (
                    <span className="text-xs text-faint">Coming with later modules</span>
                  ) : locked ? (
                    <>
                      <span className="inline-flex items-center gap-1 text-xs text-muted">
                        <Lock size={12} aria-hidden="true" /> Unlocks after {BOSS_UNLOCK} scored answers ({answered}/{BOSS_UNLOCK})
                      </span>
                      <Link to={`/arena/${mode}?timed=1`} className="text-xs text-accent-strong hover:underline">
                        Attempt anyway
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to={`/arena/${mode}`} className="rounded-lg bg-accent px-3 py-1.5 text-[13px] font-semibold text-accent-ink hover:bg-accent-strong" data-testid={`arena-${mode}`}>
                        Start
                      </Link>
                      <Link to={`/arena/${mode}?timed=1`} className="rounded-lg border border-line px-3 py-1.5 text-[13px] text-ink hover:border-line-strong">
                        Timed
                      </Link>
                    </>
                  )}
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <Card aria-labelledby="history-title">
        <SectionTitle id="history-title">Session history</SectionTitle>
        {history.length === 0 ? (
          <Empty title="No sessions yet">Your mock interview scores will appear here and feed your readiness estimate.</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {history.map((s) => {
              const avg = s.answers.reduce((t, a) => t + a.technical, 0) / s.answers.length;
              return (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[13px]">
                  <span className="text-ink">{MODE_INFO[s.mode].title}</span>
                  <span className="text-muted">
                    {new Date(s.startedAt).toLocaleDateString()} · {s.answers.length}/{s.questionIds.length} answered{s.timed ? ' · timed' : ''}
                  </span>
                  <Badge tone={avg >= 7 ? 'ok' : avg >= 5 ? 'xp' : 'bad'}>avg {avg.toFixed(1)}/10</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <Card aria-labelledby="stories-title">
        <SectionTitle id="stories-title">STAR story bank</SectionTitle>
        <StoryBank />
      </Card>
    </div>
  );
}
