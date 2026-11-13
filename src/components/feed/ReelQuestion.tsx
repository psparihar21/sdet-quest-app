import { useRef, useState, type PointerEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import type { Question } from '@/content/types';
import { evaluateChoice, type ChoiceResult } from '@/lib/evaluate/choice';
import { useProgress } from '@/store/progress';
import { FollowUp } from '@/components/FollowUp';
import { Markdown } from '@/components/Markdown';
import { clip, cx } from '@/components/ui';

const KIND: Record<Question['type'], string> = {
  mcq: 'Pick one',
  multi: 'Pick every right one',
  tf: 'True or false?',
  predict: 'Predict the output',
  debug: 'Find the bug',
  scenario: 'What would you do?',
};

/** How far a true/false card must be dragged before it counts as an answer. */
const SWIPE_PX = 80;

function Stamp({ result }: { result: ChoiceResult }) {
  const [text, color] = result.correct ? ['Correct', '#1c6b33'] : result.score > 0 ? [`Partly · ${Math.round(result.score * 100)}%`, '#8f5600'] : ['Not quite', '#b3311b'];
  return (
    <p className="reel-display text-[30px] font-extrabold uppercase" style={{ color }}>
      <span className="stamp">{text}</span>
    </p>
  );
}

/** True/false as a card you throw: right for True, left for False. The two buttons do the same for keyboard and screen readers. */
function SwipeStatement({ text, onPick, locked, picked }: { text: string; onPick: (isTrue: boolean) => void; locked: boolean; picked?: boolean }) {
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (locked) return;
    start.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => start.current !== null && setDx(e.clientX - start.current);
  const up = () => {
    if (start.current === null) return;
    start.current = null;
    if (Math.abs(dx) >= SWIPE_PX) onPick(dx > 0);
    setDx(0);
  };
  // A gesture the browser or system took over is not an answer: put the card back.
  const cancel = () => {
    start.current = null;
    setDx(0);
  };
  // Once answered, the card rests on the side it was thrown to.
  const rest = locked && picked !== undefined ? (picked ? 14 : -14) : dx;
  const lean = Math.max(-1, Math.min(1, rest / SWIPE_PX));
  return (
    <div className="relative mt-5">
      <div
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={cancel}
        onLostPointerCapture={cancel}
        data-nosave
        // pan-y: a vertical swipe still scrolls the feed; only sideways movement drags the card.
        style={{ transform: `translateX(${rest}px) rotate(${lean * 5}deg)`, touchAction: 'pan-y', transition: start.current === null ? 'transform 180ms ease-out' : 'none' }}
        className={cx('relative select-none rounded-2xl border-2 border-[var(--on)] bg-white px-5 py-7 text-[#161514] shadow-[5px_5px_0_var(--on)]', !locked && 'cursor-grab active:cursor-grabbing')}
      >
        <p className="reel-display text-[24px] font-bold">{text}</p>
        <span aria-hidden="true" style={{ opacity: locked ? 0 : Math.max(0, lean) }} className="reel-display absolute right-3 top-3 rounded-md border-2 border-[#1c6b33] px-2 text-[15px] font-extrabold uppercase text-[#1c6b33]">
          True
        </span>
        <span aria-hidden="true" style={{ opacity: locked ? 0 : Math.max(0, -lean) }} className="reel-display absolute left-3 top-3 rounded-md border-2 border-[#b3311b] px-2 text-[15px] font-extrabold uppercase text-[#b3311b]">
          False
        </span>
      </div>
      {!locked && (
        <p aria-hidden="true" className="mt-4 flex items-center justify-center gap-2 text-[13px] font-medium text-muted">
          <ArrowLeft size={14} /> drag the card, or tap <ArrowRight size={14} />
        </p>
      )}
    </div>
  );
}

/**
 * A question as a phone-sized exam paper. One-answer questions lock in on the first tap,
 * true/false is a card you throw, multi-select needs "Lock in". Only this first answer is graded.
 */
export function ReelQuestion({ question, onAnswered }: { question: Question; onAnswered?: (correct: boolean) => void }) {
  const recordAttempt = useProgress((s) => s.recordAttempt);
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<ChoiceResult | null>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const multi = question.type === 'multi';
  const trueId = question.options.find((o) => /^true$/i.test(o.text.trim()))?.id;
  const falseId = question.options.find((o) => /^false$/i.test(o.text.trim()))?.id;
  const swipe = question.type === 'tf' && question.options.length === 2 && trueId && falseId;

  const lock = (picked: string[]) => {
    if (result || picked.length === 0) return;
    const r = evaluateChoice(question, picked);
    setSelected(picked);
    setResult(r);
    recordAttempt({
      itemId: question.id,
      itemType: 'question',
      skill: question.skill,
      moduleId: question.moduleId,
      score: r.score,
      topic: clip(question.prompt.replace(/\*\*/g, '').replace(/`/g, ''), 80),
      detail: { selected: picked },
    });
    onAnswered?.(r.correct);
    // The tiles are now disabled: move focus to the result and bring it into view inside the card.
    requestAnimationFrame(() => {
      feedback.current?.focus({ preventScroll: true });
      feedback.current?.scrollIntoView({ block: 'nearest' });
    });
  };

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const stateOf = (id: string) => (!result ? undefined : question.answer.includes(id) ? 'correct' : selected.includes(id) ? 'wrong' : 'idle');

  return (
    <div data-testid={`question-${question.id}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="reel-display text-[15px] font-extrabold uppercase tracking-wide">{KIND[question.type]}</p>
        <p className="flex gap-1" role="img" aria-label={`Difficulty ${question.difficulty} of 5`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={cx('h-2 w-2 rounded-full border border-[var(--on)]', n <= question.difficulty && 'bg-[var(--on)]')} />
          ))}
        </p>
      </div>

      {swipe ? (
        <SwipeStatement
          text={question.prompt.replace(/^true or false[:?,]?\s*/i, '').replace(/^./, (c) => c.toUpperCase())}
          onPick={(isTrue) => lock([isTrue ? trueId : falseId])}
          locked={!!result}
          picked={result ? selected[0] === trueId : undefined}
        />
      ) : (
        <Markdown className="reel-prose mt-3 !text-[21px] !leading-snug font-semibold">{question.prompt}</Markdown>
      )}
      {question.code && (
        <pre className="mt-3 overflow-x-auto rounded-xl border-2 border-[var(--on)] bg-[#161514] p-3 font-mono text-[12.5px] leading-relaxed text-[#f5efe4]">
          <code>{question.code}</code>
        </pre>
      )}

      <div className={cx('mt-5 grid gap-3', swipe && 'grid-cols-2')} role="group" aria-label={multi ? 'Answers: select every correct one' : 'Answers: choose one'}>
        {(swipe ? [question.options.find((o) => o.id === falseId)!, question.options.find((o) => o.id === trueId)!] : question.options).map((o) => {
          const state = stateOf(o.id);
          const picked = selected.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              className="tile flex min-h-12 w-full items-center gap-3 px-3.5 py-3 text-left text-[15.5px] font-medium leading-snug"
              {...(multi ? { role: 'checkbox', 'aria-checked': picked } : {})}
              data-state={state}
              disabled={!!result}
              onClick={() => (multi ? toggle(o.id) : lock([o.id]))}
            >
              {!swipe && (
                <span aria-hidden="true" className={cx('reel-display flex h-7 w-7 shrink-0 items-center justify-center border-2 border-[#161514] text-[13px] font-extrabold uppercase', multi ? 'rounded-md' : 'rounded-full', picked && !result && 'bg-[#161514] text-white')}>
                  {multi && picked ? <Check size={15} strokeWidth={3.5} /> : o.id}
                </span>
              )}
              <span className={cx('flex-1', swipe && 'reel-display text-center text-[18px] font-extrabold uppercase')}>{o.text}</span>
              {state === 'correct' && (
                <>
                  <Check size={20} strokeWidth={3} aria-hidden="true" />
                  <span className="sr-only">(correct answer)</span>
                </>
              )}
              {state === 'wrong' && (
                <>
                  <X size={20} strokeWidth={3} aria-hidden="true" />
                  <span className="sr-only">(your choice, incorrect)</span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {multi && !result && (
        <button type="button" className="reel-btn reel-display mt-4 w-full rounded-full bg-[var(--on)] px-5 py-3.5 text-[16px] font-extrabold uppercase tracking-wide text-[var(--paper)] disabled:opacity-40" disabled={selected.length === 0} onClick={() => lock(selected)}>
          Lock in {selected.length > 0 && `(${selected.length})`}
        </button>
      )}

      {/* Always in the page, so screen readers announce the result the moment it is filled in. */}
      <p role="status" className="sr-only">
        {result && `${result.correct ? 'Correct.' : result.score > 0 ? 'Partly right.' : 'Not quite.'} Correct answer: ${question.options.filter((o) => question.answer.includes(o.id)).map((o) => o.text).join('; ')}.`}
      </p>
      {result && (
        <div ref={feedback} tabIndex={-1} role="group" aria-label="Result and explanation" className="mt-6 space-y-3 pb-2 outline-none">
          <Stamp result={result} />
          {!result.correct && <p className="text-[14px] font-semibold">Added to your revision queue.</p>}
          {result.notes.map((n) => (
            <p key={n} className="text-[15px]">
              <span className="font-semibold">Why that one is tempting: </span>
              {n}
            </p>
          ))}
          <Markdown className="reel-prose !text-[16px]">{question.explanation}</Markdown>
          {question.followUp && <FollowUp id={question.id} question={question.followUp} />}
        </div>
      )}
    </div>
  );
}
