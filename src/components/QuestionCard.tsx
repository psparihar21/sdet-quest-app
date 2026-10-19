import { useId, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { Question } from '@/content/types';
import { evaluateChoice, type ChoiceResult } from '@/lib/evaluate/choice';
import { useProgress } from '@/store/progress';
import { Markdown } from './Markdown';
import { Badge, Button, cx } from './ui';

const TYPE_LABEL: Record<Question['type'], string> = {
  mcq: 'Single choice',
  multi: 'Select all that apply',
  tf: 'True / false',
  predict: 'Predict the output',
  debug: 'Debug it',
  scenario: 'Scenario',
};

/**
 * One assessable question. The explanation is hidden until the learner submits,
 * and every submission is recorded (mastery, revision schedule, weakness queue).
 */
export function QuestionCard({
  question,
  review = false,
  onAnswered,
  index,
}: {
  question: Question;
  review?: boolean;
  onAnswered?: (r: ChoiceResult) => void;
  index?: number;
}) {
  const recordAttempt = useProgress((s) => s.recordAttempt);
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<ChoiceResult | null>(null);
  const groupId = useId();
  const multi = question.type === 'multi';

  const toggle = (id: string) => {
    if (result) return;
    setSelected((s) => (multi ? (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]) : [id]));
  };

  const submit = () => {
    const r = evaluateChoice(question, selected);
    setResult(r);
    recordAttempt({
      itemId: question.id,
      itemType: 'question',
      skill: question.skill,
      moduleId: question.moduleId,
      score: r.score,
      topic: question.prompt.replace(/\*\*/g, '').replace(/`/g, '').slice(0, 80),
      detail: { selected },
      review,
    });
    onAnswered?.(r);
  };

  const retry = () => {
    setSelected([]);
    setResult(null);
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-4 sm:p-5" data-testid={`question-${question.id}`}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {index !== undefined && <span className="text-xs font-medium text-faint">Q{index + 1}</span>}
        <Badge>{TYPE_LABEL[question.type]}</Badge>
        <Badge tone="neutral">Difficulty {question.difficulty}/5</Badge>
      </div>
      <div id={`${groupId}-prompt`}>
        <Markdown className="!max-w-none text-[15px] font-medium">{question.prompt}</Markdown>
      </div>
      {question.code && (
        <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-code p-3 font-mono text-[12.5px] leading-relaxed text-ink">
          <code>{question.code}</code>
        </pre>
      )}

      <div className="mt-4 space-y-2" role={multi ? 'group' : 'radiogroup'} aria-labelledby={`${groupId}-prompt`}>
        {question.options.map((o) => {
          const picked = selected.includes(o.id);
          const isAnswer = question.answer.includes(o.id);
          const state = result ? (isAnswer ? 'correct' : picked ? 'wrong' : 'idle') : picked ? 'picked' : 'idle';
          return (
            <button
              key={o.id}
              type="button"
              role={multi ? 'checkbox' : 'radio'}
              aria-checked={picked}
              disabled={!!result}
              onClick={() => toggle(o.id)}
              className={cx(
                'flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-[14px] transition-colors',
                state === 'idle' && 'border-line hover:border-line-strong hover:bg-surface-2',
                state === 'picked' && 'border-accent bg-accent-soft',
                state === 'correct' && 'border-ok/60 bg-ok-soft',
                state === 'wrong' && 'border-bad/60 bg-bad-soft',
                result && 'cursor-default',
              )}
            >
              <span
                aria-hidden="true"
                className={cx(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border text-[11px] font-semibold uppercase',
                  multi ? 'rounded-md' : 'rounded-full',
                  picked ? 'border-accent bg-accent text-accent-ink' : 'border-line-strong text-faint',
                )}
              >
                {o.id}
              </span>
              <span className="flex-1 text-ink">{o.text}</span>
              {state === 'correct' && <CheckCircle2 size={18} className="text-ok" aria-label="Correct option" />}
              {state === 'wrong' && <XCircle size={18} className="text-bad" aria-label="Incorrect choice" />}
            </button>
          );
        })}
      </div>

      {!result ? (
        <div className="mt-4 flex items-center gap-3">
          <Button variant="primary" onClick={submit} disabled={selected.length === 0}>
            Check answer
          </Button>
          {multi && <span className="text-xs text-faint">Partial credit; wrong picks cost points.</span>}
        </div>
      ) : (
        <div className="mt-4 animate-rise space-y-3" aria-live="polite">
          <div className={cx('rounded-lg border px-3.5 py-3', result.correct ? 'border-ok/40 bg-ok-soft' : 'border-bad/40 bg-bad-soft')}>
            <p className="text-sm font-semibold text-ink">
              {result.correct ? 'Correct.' : result.score > 0 ? `Partly right (${Math.round(result.score * 100)}%).` : 'Not quite.'}
              {!result.correct && ' Added to your revision queue.'}
            </p>
            {result.notes.map((n) => (
              <p key={n} className="mt-1 text-[13.5px] text-ink">
                <span className="font-medium">Why that option is tempting: </span>
                {n}
              </p>
            ))}
            <div className="mt-2 text-[13.5px] text-ink">
              <Markdown className="!max-w-none text-[13.5px]">{question.explanation}</Markdown>
            </div>
            {question.followUp && <p className="mt-2 text-[13px] text-muted">Interviewer follow-up: {question.followUp}</p>}
          </div>
          {!result.correct && (
            <Button size="sm" onClick={retry}>
              Try again
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
