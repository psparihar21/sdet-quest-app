import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Send } from 'lucide-react';
import type { InterviewQuestion } from '@/content/types';
import { LEVEL_LABELS, SKILL_LABELS } from '@/content/types';
import { getModule } from '@/content';
import { evaluateAnswer, scoreFromCovered, seniorityFor, type RubricResult } from '@/lib/evaluate/rubric';
import { useProgress } from '@/store/progress';
import type { InterviewAnswer } from '@/store/types';
import { Markdown } from './Markdown';
import { Badge, Button, Notice, cx } from './ui';

/** Self-adjustment can raise the auto-detected technical score by at most this much. */
export const MAX_SELF_RAISE = 3;

function ScorePill({ label, value }: { label: string; value: number }) {
  const tone = value >= 7 ? 'text-ok' : value >= 5 ? 'text-xp' : 'text-bad';
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2">
      <p className="text-[11px] text-faint">{label}</p>
      <p className={cx('text-xl font-semibold tabular-nums', tone)}>
        {value.toFixed(1)}
        <span className="text-xs text-faint">/10</span>
      </p>
    </div>
  );
}

export function InterviewRunner({
  question,
  timed = false,
  timeLimit = 300,
  onSubmitted,
}: {
  question: InterviewQuestion;
  timed?: boolean;
  timeLimit?: number;
  onSubmitted?: (answer: InterviewAnswer) => void;
}) {
  const recordAttempt = useProgress((s) => s.recordAttempt);
  const cvFacts = useProgress((s) => s.profile.cvFacts);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<RubricResult | null>(null);
  const [covered, setCovered] = useState<string[]>([]);
  const [adjusted, setAdjusted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const started = useRef(Date.now());

  useEffect(() => {
    if (result) return;
    const t = setInterval(() => setSeconds(Math.floor((Date.now() - started.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [result]);

  const remaining = timeLimit - seconds;
  const overtime = timed && remaining < 0;

  const record = (r: RubricResult, coveredIds: string[], selfAdjusted: boolean) => {
    const technical = selfAdjusted ? Math.min(scoreFromCovered(question, coveredIds, r.redFlags.length), r.technical + MAX_SELF_RAISE) : r.technical;
    recordAttempt({
      itemId: question.id,
      itemType: 'interview',
      skill: question.skill,
      score: technical / 10,
      topic: question.prompt.slice(0, 80),
      detail: { covered: coveredIds, depth: r.depth, communication: r.communication, selfAdjusted, words: r.words, seconds },
    });
    const a: InterviewAnswer = { questionId: question.id, answer, at: new Date().toISOString(), technical, depth: r.depth, communication: r.communication, covered: coveredIds, selfAdjusted, seconds };
    onSubmitted?.(a);
    return technical;
  };

  const submit = () => {
    const r = evaluateAnswer(question, answer);
    setResult(r);
    setCovered(r.covered);
    record(r, r.covered, false);
  };

  const [technical, setTechnical] = useState<number | null>(null);
  const applyAdjust = () => {
    if (!result) return;
    setAdjusted(true);
    setTechnical(record(result, covered, true));
  };

  const shownTechnical = technical ?? result?.technical ?? 0;

  return (
    <div className="space-y-4" data-testid={`interview-${question.id}`}>
      <div className="rounded-xl border border-line bg-surface p-4 sm:p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge tone="accent">{SKILL_LABELS[question.skill]}</Badge>
          <Badge>{LEVEL_LABELS[question.level]}</Badge>
          <Badge>{question.kind}</Badge>
          {timed && !result && (
            <Badge tone={overtime ? 'bad' : remaining < 60 ? 'warn' : 'neutral'}>
              <Clock size={12} aria-hidden="true" /> {overtime ? `+${-remaining}s over` : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`}
            </Badge>
          )}
        </div>
        <p className="text-[16px] font-medium leading-relaxed text-ink">{question.prompt}</p>
        {question.context && <p className="mt-2 text-sm text-muted">{question.context}</p>}
        {question.cvGrounded && (
          <div className="mt-3">
            <Notice tone="warn" title="Use your real experience.">
              Answer with a true situation from your work. If you can't remember a number or detail, write <code>[need: …]</code> instead of inventing it — inventing details is the fastest way to fail a follow-up.
              {cvFacts.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer">Facts from your profile pack</summary>
                  <ul className="mt-1 list-disc pl-5">
                    {cvFacts.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </details>
              )}
            </Notice>
          </div>
        )}
      </div>

      {!result ? (
        <div className="space-y-3">
          <label htmlFor={`ans-${question.id}`} className="text-sm font-medium text-ink">
            Your answer <span className="font-normal text-faint">(write it as you would say it)</span>
          </label>
          <textarea
            id={`ans-${question.id}`}
            value={answer}
            onChange={(e) => setAnswer(e.target.value.slice(0, 6000))}
            rows={9}
            className="w-full resize-y rounded-lg border border-line bg-surface px-3 py-2.5 text-[14.5px] leading-relaxed text-ink placeholder:text-faint focus:border-accent"
            placeholder="Structure helps: state the answer, explain why, give an example, mention trade-offs."
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" onClick={submit} disabled={answer.trim().split(/\s+/).length < 5}>
              <Send size={15} aria-hidden="true" /> Submit answer
            </Button>
            <span className="text-xs text-faint">{answer.trim() ? answer.trim().split(/\s+/).length : 0} words · the ideal answer stays hidden until you submit</span>
          </div>
        </div>
      ) : (
        <div className="animate-rise space-y-4" aria-live="polite">
          <Notice>
            <strong>How this is scored:</strong> a deterministic rubric checks your answer for evidence of each expected point, known misconceptions, examples, trade-offs and structure. It does not understand meaning like a human interviewer, so review the checklist below and correct it honestly.
          </Notice>

          <section className="rounded-xl border border-line bg-surface p-4 sm:p-5" aria-labelledby={`fb-${question.id}`}>
            <h3 id={`fb-${question.id}`} className="mb-3 text-[15px] font-semibold text-ink">
              Feedback
            </h3>
            <ol className="space-y-4 text-[14px] text-ink">
              <li>
                <p className="text-xs font-semibold uppercase tracking-wide text-faint">1 · Your answer in brief</p>
                <p className="mt-1">{result.summary}</p>
              </li>
              <li>
                <p className="text-xs font-semibold uppercase tracking-wide text-faint">2–4 · Scores</p>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  <ScorePill label="Technical correctness" value={shownTechnical} />
                  <ScorePill label="Depth & completeness" value={result.depth} />
                  <ScorePill label="Communication" value={result.communication} />
                </div>
              </li>
              <li>
                <p className="text-xs font-semibold uppercase tracking-wide text-faint">5 · Seniority signal</p>
                <p className="mt-1">{seniorityFor(shownTechnical, result.depth)}</p>
                <p className="mt-0.5 text-xs text-muted">
                  Examples {result.signals.examples ? '✓' : '✗'} · Trade-offs {result.signals.tradeoffs ? '✓' : '✗'} · Structure {result.signals.structure ? '✓' : '✗'}
                  {question.kind === 'behavioral' && ` · STAR ${result.signals.star ? '✓' : '✗'}`}
                </p>
              </li>
              <li>
                <p className="text-xs font-semibold uppercase tracking-wide text-faint">6 · Points covered, missing, and misconceptions</p>
                <fieldset className="mt-2 space-y-1.5">
                  <legend className="sr-only">Rubric points</legend>
                  {question.rubric.map((p) => (
                    <label key={p.id} className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-1 accent-[var(--accent)]"
                        checked={covered.includes(p.id)}
                        disabled={adjusted}
                        onChange={(e) => setCovered((c) => (e.target.checked ? [...c, p.id] : c.filter((x) => x !== p.id)))}
                      />
                      <span className={covered.includes(p.id) ? 'text-ink' : 'text-bad'}>
                        {covered.includes(p.id) ? '' : 'Missing: '}
                        {p.point}
                      </span>
                    </label>
                  ))}
                </fieldset>
                {!adjusted && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button size="sm" onClick={applyAdjust} disabled={covered.slice().sort().join() === result.covered.slice().sort().join()}>
                      Update score from my corrections
                    </Button>
                    <span className="text-xs text-faint">Corrections can raise the technical score by at most {MAX_SELF_RAISE} points and are marked as self-assessed.</span>
                  </div>
                )}
                {result.redFlags.map((f) => (
                  <p key={f} className="mt-2 rounded-lg border border-bad/30 bg-bad-soft px-3 py-2 text-[13.5px]">
                    <span className="font-semibold">Misconception: </span>
                    {f}
                  </p>
                ))}
              </li>
              <li>
                <p className="text-xs font-semibold uppercase tracking-wide text-faint">7 · A stronger structure</p>
                <p className="mt-1">{question.structure}</p>
              </li>
              <li>
                <p className="text-xs font-semibold uppercase tracking-wide text-faint">8 · Illustrative model answer</p>
                <div className="mt-1 rounded-lg border border-line bg-surface-2 p-3">
                  <Markdown className="!max-w-none text-[14px]">{question.modelAnswer}</Markdown>
                </div>
                <p className="mt-1 text-xs text-faint">One good answer, not a script — learn the reasoning, then say it your way with your own examples.</p>
              </li>
              <li>
                <p className="text-xs font-semibold uppercase tracking-wide text-faint">9 · Interviewer follow-up</p>
                <p className="mt-1 font-medium">“{question.followUp}”</p>
              </li>
              <li>
                <p className="text-xs font-semibold uppercase tracking-wide text-faint">10 · Revise next</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {question.revision.map((id) => {
                    const m = getModule(id);
                    return m ? (
                      <Link key={id} to={`/learn/${id}`} className="rounded-md border border-line px-2 py-1 text-[13px] text-accent-strong hover:border-accent">
                        M{m.number} · {m.title}
                      </Link>
                    ) : null;
                  })}
                </div>
                {shownTechnical < 6 && <p className="mt-1 text-xs text-muted">Scored below 6 — this question is now in your weakness queue and will come back in revision.</p>}
              </li>
            </ol>
          </section>
        </div>
      )}
    </div>
  );
}
