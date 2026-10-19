import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Target } from 'lucide-react';
import { useProgress } from '@/store/progress';
import { allMastery, masteryLabel, weakestSkills } from '@/lib/mastery';
import { allReadiness } from '@/lib/readiness';
import { recommendations } from '@/lib/recommend';
import { dailyQuests } from '@/lib/achievements';
import { dueCards } from '@/lib/srs';
import { activeQueue } from '@/lib/weakness';
import { currentStreak, levelFor, totalXp } from '@/lib/xp';
import { useDocumentTitle, useToday } from '@/lib/hooks';
import { itemLabel, MODULES } from '@/content';
import { SKILL_LABELS } from '@/content/types';
import { Badge, ButtonLink, Card, Empty, Notice, ProgressBar, SectionTitle, Stat, cx } from '@/components/ui';

export function Dashboard() {
  useDocumentTitle('Dashboard');
  const state = useProgress();
  const today = useToday();
  const xp = totalXp(state.attempts);
  const lvl = levelFor(xp);
  const due = dueCards(state.srs, today);
  const recs = recommendations(state, today);
  const quests = dailyQuests(state, due.length, today);
  const readiness = allReadiness(state.attempts);
  const weakest = weakestSkills(state.attempts, 4);
  const queue = activeQueue(state.weaknesses).slice(0, 5);
  const mastery = allMastery(state.attempts);
  const recent = [...state.attempts].filter((a) => a.itemType !== 'diagnostic').slice(-6).reverse();
  const lessonsDone = Object.values(state.lessons).filter((l) => l.completedAt).length;
  const totalLessons = MODULES.reduce((s, m) => s + m.lessons.length, 0);
  const streak = currentStreak(state.attempts, today);
  const isNew = state.attempts.length === 0;
  const primary = recs[0];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-faint">Dashboard</p>
          <h1 className="text-[26px] font-semibold tracking-tight text-ink">{state.profile.name ? `Welcome back, ${state.profile.name.split(' ')[0]}` : 'Your SDET 3 + QA Lead prep'}</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          {streak > 0 && (
            <Badge tone="xp">
              <Flame size={12} aria-hidden="true" /> {streak}-day rhythm
            </Badge>
          )}
          <Badge tone="neutral">Level {lvl.level} · {xp} XP</Badge>
        </div>
      </header>

      {isNew && (
        <Card className="border-accent/40">
          <h2 className="text-lg font-semibold text-ink">Start here</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            SDET Quest teaches through active practice: short lessons, questions that are graded, real code and SQL that runs in your browser, and interview answers with rubric feedback. Mastery comes only from assessed work — reading alone doesn't move the numbers.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink to="/learn/m01/m01-l1" variant="primary">
              Start Lesson 1: the test pyramid <ArrowRight size={15} aria-hidden="true" />
            </ButtonLink>
            <ButtonLink to="/settings#profile">Import your profile pack</ButtonLink>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" aria-labelledby="next-title">
          <SectionTitle id="next-title">Recommended next</SectionTitle>
          {primary ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent-soft p-4">
              <div className="min-w-0">
                <p className="font-semibold text-ink">{primary.title}</p>
                <p className="text-sm text-muted">{primary.reason}</p>
              </div>
              <ButtonLink to={primary.to} variant="primary" data-testid="continue-learning">
                {primary.cta} <ArrowRight size={15} aria-hidden="true" />
              </ButtonLink>
            </div>
          ) : (
            <Empty title="All caught up">Nothing due. Pick any module from the curriculum.</Empty>
          )}
          {recs.length > 1 && (
            <ul className="mt-3 divide-y divide-line">
              {recs.slice(1, 4).map((r) => (
                <li key={r.title} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink">{r.title}</p>
                    <p className="truncate text-xs text-muted">{r.reason}</p>
                  </div>
                  <Link to={r.to} className="shrink-0 text-sm text-accent-strong hover:underline">
                    {r.cta}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card aria-labelledby="quest-title">
          <SectionTitle id="quest-title">
            <span className="inline-flex items-center gap-1.5">
              <Target size={15} className="text-xp" aria-hidden="true" /> Today's quests
            </span>
          </SectionTitle>
          <ul className="space-y-3">
            {quests.map((q) => (
              <li key={q.id}>
                <Link to={q.to} className="block rounded-lg hover:bg-surface-2">
                  <div className="flex justify-between text-[13px]">
                    <span className={cx(q.current >= q.target ? 'text-ok' : 'text-ink')}>{q.title}</span>
                    <span className="tabular-nums text-muted">
                      {Math.min(q.current, q.target)}/{q.target}
                    </span>
                  </div>
                  <ProgressBar value={(q.current / q.target) * 100} tone={q.current >= q.target ? 'ok' : 'xp'} label={q.title} className="mt-1" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-faint">Quests reset daily. Missing a day costs nothing.</p>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <Stat label="Revision due" value={due.length} sub={due.length ? 'Spaced repetition' : 'Nothing due today'} tone={due.length ? 'bad' : 'ok'} />
          {due.length > 0 && (
            <Link to="/revision" className="mt-2 inline-block text-xs text-accent-strong hover:underline">
              Review now →
            </Link>
          )}
        </Card>
        <Card>
          <Stat label="Lessons completed" value={`${lessonsDone}/${totalLessons}`} sub="Completion ≠ readiness" />
        </Card>
        <Card>
          <Stat label="Assessed items" value={new Set(state.attempts.filter((a) => a.itemType !== 'diagnostic').map((a) => a.itemId)).size} sub="Questions, problems, interviews" />
        </Card>
        <Card>
          <Stat label="Active weaknesses" value={queue.length ? activeQueue(state.weaknesses).length : 0} sub="From your own mistakes" tone={queue.length ? 'bad' : undefined} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" aria-labelledby="ready-title">
          <SectionTitle id="ready-title" action={<Link to="/progress" className="text-xs text-accent-strong hover:underline">Details</Link>}>
            Interview readiness estimate
          </SectionTitle>
          <div className="grid gap-4 sm:grid-cols-3">
            {readiness.map((r) => (
              <div key={r.role}>
                <div className="flex items-baseline justify-between">
                  <p className="text-sm text-ink">{r.label}</p>
                  <p className="text-lg font-semibold tabular-nums text-ink">{r.score}%</p>
                </div>
                <ProgressBar value={r.score} tone={r.score >= 70 ? 'ok' : r.score >= 40 ? 'xp' : 'bad'} label={`${r.label} readiness`} className="mt-1" />
                <p className="mt-1 text-[11px] text-faint">Evidence covers {r.coverage}% of this role's skills</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Notice>Estimated from your graded answers, weighted by role. It is a study signal, not a prediction — target 70%+ with full evidence coverage and strong mock interviews before you book interviews.</Notice>
          </div>
        </Card>

        <Card aria-labelledby="weak-title">
          <SectionTitle id="weak-title" action={<Link to="/revision" className="text-xs text-accent-strong hover:underline">Queue</Link>}>
            Weakest areas
          </SectionTitle>
          {weakest.length === 0 && queue.length === 0 ? (
            <p className="text-sm text-muted">Answer a few questions and your weakest skills will show up here.</p>
          ) : (
            <ul className="space-y-2.5">
              {weakest.map((m) => (
                <li key={m.skill}>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-ink">{SKILL_LABELS[m.skill]}</span>
                    <span className="text-muted">
                      {m.accuracy}% · {masteryLabel(m)}
                    </span>
                  </div>
                  <ProgressBar value={m.accuracy} tone={m.accuracy >= 70 ? 'ok' : m.accuracy >= 40 ? 'xp' : 'bad'} label={`${SKILL_LABELS[m.skill]} accuracy`} className="mt-1" />
                </li>
              ))}
              {queue.slice(0, 3).map((w) => (
                <li key={w.id} className="text-[12.5px] text-muted">
                  <Badge tone="bad">{w.source === 'assessment' ? 'missed' : w.source}</Badge> <span className="text-ink">{w.topic}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card aria-labelledby="recent-title">
          <SectionTitle id="recent-title">Recent performance</SectionTitle>
          {recent.length === 0 ? (
            <p className="text-sm text-muted">No graded attempts yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-[13px]">
                  <span className="min-w-0 truncate text-ink">{itemLabel(a.itemType, a.itemId)}</span>
                  <Badge tone={a.score >= 0.7 ? 'ok' : a.score >= 0.5 ? 'xp' : 'bad'}>{a.itemType === 'interview' ? `${(a.score * 10).toFixed(1)}/10` : `${Math.round(a.score * 100)}%`}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card aria-labelledby="skills-title">
          <SectionTitle id="skills-title" action={<Link to="/learn" className="text-xs text-accent-strong hover:underline">Curriculum</Link>}>
            Skill mastery
          </SectionTitle>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
            {(['fundamentals', 'java', 'dsa', 'sql', 'selenium', 'playwright', 'api', 'framework', 'cicd', 'systemDesign', 'leadership', 'agents'] as const).map((s) => (
              <li key={s}>
                <div className="flex justify-between text-[12px]">
                  <span className="text-ink">{SKILL_LABELS[s]}</span>
                  <span className="tabular-nums text-faint">{mastery[s].mastery}</span>
                </div>
                <ProgressBar value={mastery[s].mastery} label={`${SKILL_LABELS[s]} mastery`} className="mt-0.5" />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
