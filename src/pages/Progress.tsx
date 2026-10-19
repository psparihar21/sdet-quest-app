import { Link } from 'react-router-dom';
import { Award, Lock } from 'lucide-react';
import { MODULES } from '@/content';
import { LEVEL_LABELS, LEVELS, SKILL_LABELS, SKILLS } from '@/content/types';
import { useProgress } from '@/store/progress';
import { allMastery, masteryLabel } from '@/lib/mastery';
import { allReadiness } from '@/lib/readiness';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { isUnlocked, moduleProgress } from '@/lib/recommend';
import { repeatedMistakes } from '@/lib/weakness';
import { activeDays, levelFor, totalXp } from '@/lib/xp';
import { toDay, addDays } from '@/lib/dates';
import { useDocumentTitle, useToday } from '@/lib/hooks';
import { Badge, Card, Empty, Notice, PageHeader, ProgressBar, SectionTitle, Stat, cx } from '@/components/ui';

function weekStart(day: string) {
  const d = new Date(`${day}T12:00:00`);
  const dow = (d.getDay() + 6) % 7;
  return addDays(day, -dow);
}

export default function Progress() {
  useDocumentTitle('Progress');
  const state = useProgress();
  const today = useToday();
  const mastery = allMastery(state.attempts);
  const readiness = allReadiness(state.attempts);
  const graded = state.attempts.filter((a) => a.itemType !== 'diagnostic');
  const xp = totalXp(state.attempts);
  const lvl = levelFor(xp);

  // Weekly activity for the last 8 weeks.
  const thisWeek = weekStart(today);
  const weeks = Array.from({ length: 8 }, (_, i) => addDays(thisWeek, -7 * (7 - i)));
  const perWeek = weeks.map((w) => {
    const inWeek = graded.filter((a) => {
      const d = toDay(new Date(a.at));
      return d >= w && d < addDays(w, 7);
    });
    return { w, total: inWeek.length, reviews: inWeek.filter((a) => a.detail?.review === true).length };
  });
  const maxWeek = Math.max(1, ...perWeek.map((p) => p.total));

  const byType = (['question', 'problem', 'interview', 'flashcard'] as const).map((t) => {
    const xs = graded.filter((a) => a.itemType === t);
    return { t, n: xs.length, acc: xs.length ? Math.round((xs.filter((a) => a.correct).length / xs.length) * 100) : 0 };
  });
  const mocks = state.interviews.filter((i) => i.answers.length).map((i) => ({ at: i.startedAt, avg: i.answers.reduce((s, a) => s + a.technical, 0) / i.answers.length, mode: i.mode }));
  const repeated = repeatedMistakes(state.weaknesses);

  return (
    <div className="space-y-5">
      <PageHeader title="Progress & analytics" kicker="Built only from your graded attempts" />
      <Notice>Lesson completion is shown separately and never counts as readiness. Mastery and readiness come from scored answers, solved problems and interview feedback.</Notice>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><Stat label="Level" value={lvl.level} sub={`${xp} XP`} tone="xp" /></Card>
        <Card><Stat label="Graded attempts" value={graded.length} sub={`${activeDays(state.attempts).length} active days`} /></Card>
        <Card><Stat label="Skills with evidence" value={`${SKILLS.filter((s) => mastery[s].items > 0).length}/${SKILLS.length}`} /></Card>
        <Card><Stat label="Repeated mistakes" value={repeated.length} tone={repeated.length ? 'bad' : 'ok'} sub="Same item missed 2+ times" /></Card>
      </div>

      <Card aria-labelledby="readiness-t">
        <SectionTitle id="readiness-t">Readiness by role (estimate)</SectionTitle>
        <div className="grid gap-5 md:grid-cols-3">
          {readiness.map((r) => (
            <div key={r.role}>
              <div className="flex items-baseline justify-between">
                <p className="font-medium text-ink">{r.label}</p>
                <p className="text-xl font-semibold tabular-nums text-ink">{r.score}%</p>
              </div>
              <ProgressBar value={r.score} tone={r.score >= 70 ? 'ok' : r.score >= 40 ? 'xp' : 'bad'} label={`${r.label} readiness`} className="mt-1" />
              <p className="mt-1 text-xs text-faint">
                Evidence coverage {r.coverage}%{r.mockAverage !== undefined ? ` · mock avg ${r.mockAverage}/10` : ' · no mock answers yet'}
              </p>
              <p className="mt-2 text-xs font-semibold text-faint">Biggest gaps (weight)</p>
              <ul className="mt-1 space-y-0.5 text-[12.5px]">
                {r.gaps.slice(0, 3).map((g) => (
                  <li key={g.skill} className="flex justify-between">
                    <span className="text-ink">{SKILL_LABELS[g.skill]}</span>
                    <span className="text-muted">
                      {g.mastery} ({g.weight}%)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <Card aria-labelledby="tree-t">
        <SectionTitle id="tree-t">Skill tree</SectionTitle>
        <div className="overflow-x-auto">
          <div className="grid min-w-[760px] grid-cols-8 gap-2">
            {LEVELS.map((l) => (
              <div key={l}>
                <p className="mb-2 text-center text-[11px] font-semibold text-faint" title={LEVEL_LABELS[l]}>
                  {l}
                  <span className="block font-normal">{LEVEL_LABELS[l]}</span>
                </p>
                <ul className="space-y-2">
                  {MODULES.filter((m) => m.level === l).map((m) => {
                    const p = moduleProgress(m, state.lessons);
                    const unlocked = isUnlocked(m, state);
                    const best = Math.max(...m.skills.map((s) => mastery[s].mastery));
                    return (
                      <li key={m.id}>
                        <Link
                          to={`/learn/${m.id}`}
                          className={cx(
                            'block rounded-lg border p-2 text-[11.5px] leading-tight hover:border-line-strong',
                            m.lessons.length === 0 ? 'border-dashed border-line text-faint' : p.pct === 100 ? 'border-ok/50 bg-ok-soft text-ink' : p.done ? 'border-accent/50 bg-accent-soft text-ink' : 'border-line text-ink',
                          )}
                          title={`${m.title}: ${p.done}/${p.total} lessons, mastery ${best}`}
                        >
                          <span className="flex items-center gap-1 font-semibold">
                            M{m.number} {!unlocked && <Lock size={10} aria-label="prerequisites recommended" />}
                          </span>
                          <span className="line-clamp-2">{m.title}</span>
                          {m.lessons.length > 0 && <span className="mt-1 block h-1 rounded-full bg-surface-2"><span className="block h-1 rounded-full bg-xp" style={{ width: `${best}%` }} /></span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs text-faint">Green = completed · teal = in progress · dashed = planned · bar = best skill mastery · lock = prerequisites recommended first (never enforced).</p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card aria-labelledby="skills-t">
          <SectionTitle id="skills-t">Skill mastery</SectionTitle>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-faint">
                <th className="py-1 font-medium">Skill</th>
                <th className="py-1 font-medium">Mastery</th>
                <th className="py-1 text-right font-medium">Accuracy</th>
                <th className="py-1 text-right font-medium">Items</th>
              </tr>
            </thead>
            <tbody>
              {SKILLS.map((s) => (
                <tr key={s} className="border-t border-line">
                  <td className="py-1.5 text-ink">{SKILL_LABELS[s]}</td>
                  <td className="py-1.5">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={mastery[s].mastery} label={`${SKILL_LABELS[s]} mastery`} className="w-20" />
                      <span className="text-muted">{masteryLabel(mastery[s])}</span>
                    </div>
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-muted">{mastery[s].items ? `${mastery[s].accuracy}%` : '–'}</td>
                  <td className="py-1.5 text-right tabular-nums text-muted">{mastery[s].items}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="space-y-4">
          <Card aria-labelledby="week-t">
            <SectionTitle id="week-t">Practice and revision per week</SectionTitle>
            <div className="flex h-32 items-end gap-2" role="img" aria-label={`Graded attempts per week, last 8 weeks: ${perWeek.map((p) => p.total).join(', ')}`}>
              {perWeek.map((p) => (
                <div key={p.w} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex w-full flex-1 flex-col justify-end">
                    <div className="w-full rounded-t bg-accent/70" style={{ height: `${((p.total - p.reviews) / maxWeek) * 100}%` }} title={`${p.total - p.reviews} new`} />
                    <div className="w-full bg-xp/80" style={{ height: `${(p.reviews / maxWeek) * 100}%` }} title={`${p.reviews} reviews`} />
                  </div>
                  <span className="text-[10px] text-faint">{new Date(`${p.w}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-faint">
              <span className="text-accent-strong">■</span> new attempts · <span className="text-xp">■</span> spaced reviews
            </p>
          </Card>
          <Card aria-labelledby="type-t">
            <SectionTitle id="type-t">Assessment performance</SectionTitle>
            <ul className="grid grid-cols-2 gap-3">
              {byType.map((b) => (
                <li key={b.t} className="rounded-lg bg-surface-2 p-3">
                  <p className="text-xs capitalize text-faint">{b.t === 'problem' ? 'coding problems' : b.t + 's'}</p>
                  <p className="text-lg font-semibold tabular-nums text-ink">{b.n ? `${b.acc}%` : '–'}</p>
                  <p className="text-[11px] text-muted">{b.n} attempts</p>
                </li>
              ))}
            </ul>
          </Card>
          <Card aria-labelledby="mock-t">
            <SectionTitle id="mock-t">Mock interview scores</SectionTitle>
            {mocks.length === 0 ? (
              <p className="text-sm text-muted">No mock interview answers yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {mocks.slice(-8).map((m, i) => (
                  <li key={i} className="flex items-center gap-2 text-[12.5px]">
                    <span className="w-20 shrink-0 text-faint">{new Date(m.at).toLocaleDateString()}</span>
                    <ProgressBar value={m.avg * 10} tone={m.avg >= 7 ? 'ok' : m.avg >= 5 ? 'xp' : 'bad'} label={`Mock ${i + 1}`} />
                    <span className="w-10 text-right tabular-nums text-ink">{m.avg.toFixed(1)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card aria-labelledby="ach-t">
        <SectionTitle id="ach-t">Achievements</SectionTitle>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((a) => {
            const p = a.progress(state);
            const earned = p >= 1;
            return (
              <li key={a.id} className={cx('rounded-lg border p-3', earned ? 'border-xp/50 bg-xp-soft' : 'border-line')}>
                <div className="flex items-center gap-2">
                  <Award size={16} className={earned ? 'text-xp' : 'text-faint'} aria-hidden="true" />
                  <p className="text-sm font-medium text-ink">{a.title}</p>
                  {earned && <Badge tone="xp">Earned</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted">{a.description}</p>
                {!earned && <ProgressBar value={p * 100} tone="xp" label={`${a.title} progress`} className="mt-2" />}
              </li>
            );
          })}
        </ul>
      </Card>
      {graded.length === 0 && <Empty title="No data yet">Analytics fill in as you answer questions, solve problems and practise interviews.</Empty>}
    </div>
  );
}
