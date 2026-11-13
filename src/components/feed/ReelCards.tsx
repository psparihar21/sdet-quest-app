import { useRef, useState } from 'react';
import { ArrowRight, RotateCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getFlashcard } from '@/content';
import { SKILL_LABELS } from '@/content/types';
import { useProgress } from '@/store/progress';
import { Markdown } from '@/components/Markdown';
import { cx } from '@/components/ui';

/** Inline markdown marks removed, for text set in the display face. */
const plain = (s: string) => s.replace(/\*\*|__|`/g, '');

const Kicker = ({ children }: { children: React.ReactNode }) => <p className="reel-display text-[13px] font-bold uppercase tracking-[0.08em] text-muted">{children}</p>;

/** One idea from a lesson: a heading becomes the poster headline, the rest is set at reading size. */
export function LearnCard({ title, body, part, parts }: { title: string; body: string; part: number; parts: number }) {
  const m = body.match(/^#{1,6} ([^\n]+)\n*([\s\S]*)$/);
  // A single short thought is set large, like a pull quote, instead of floating in an empty sheet.
  const short = !m && body.length < 220 && !body.includes('```') && !/^\s*([-*]|\d+\.) /m.test(body);
  return (
    <div>
      <Kicker>
        {title}
        {parts > 1 && ` · ${part}/${parts}`}
      </Kicker>
      {m && <h2 className="reel-display mt-3 text-[36px] font-extrabold">{plain(m[1])}</h2>}
      <Markdown className={cx('reel-prose mt-4', short && '!text-[25px] !leading-[1.32] font-medium')}>{m ? m[2] : body}</Markdown>
    </div>
  );
}

/** A table as a sideways deck: one row per slide, the first column as its title. */
export function TableDeck({ title, head, rows }: { title: string; head: string[]; rows: string[][] }) {
  const [at, setAt] = useState(0);
  const deck = useRef<HTMLDivElement>(null);
  const onScroll = () => {
    const el = deck.current;
    if (!el) return;
    const slide = el.scrollWidth / rows.length;
    setAt(Math.min(rows.length - 1, Math.round(el.scrollLeft / slide)));
  };
  return (
    <div>
      <Kicker>{title}</Kicker>
      <h2 className="reel-display mt-3 text-[28px] font-extrabold">
        {plain(head[0])}: {rows.length} to compare
      </h2>
      {/* Bleeds to the screen edges so the next slide peeks in. */}
      <div ref={deck} onScroll={onScroll} tabIndex={0} role="group" aria-label={`${title}: ${rows.length} rows, scroll sideways`} className="deck -mx-5 mt-5 flex gap-3 overflow-x-auto px-5 pb-1 outline-none focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[var(--on)]">
        {rows.map((r, i) => (
          <div key={i} role="group" aria-roledescription="slide" aria-label={`${plain(r[0])}, ${i + 1} of ${rows.length}`} className="w-[84%] shrink-0 rounded-2xl border-2 border-[var(--on)] p-5">
            <h3 className="reel-display text-[26px] font-extrabold text-[var(--mark-on)]">{plain(r[0])}</h3>
            <dl className="mt-3 space-y-3">
              {head.slice(1).map((h, c) => (
                <div key={c}>
                  <dt className="reel-display text-[12px] font-bold uppercase tracking-[0.08em] text-muted">{plain(h)}</dt>
                  <dd>
                    <Markdown className="reel-prose !text-[16.5px]">{r[c + 1]}</Markdown>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5" aria-hidden="true">
        {rows.map((_, i) => (
          <span key={i} className={cx('h-1.5 rounded-full bg-[var(--on)] transition-[width,opacity] duration-200', i === at ? 'w-5' : 'w-1.5 opacity-35')} />
        ))}
      </p>
    </div>
  );
}

/** A flashcard that turns over. Recall is self-graded and scheduled like any other answer. */
export function FlipCard({ id }: { id: string }) {
  const card = getFlashcard(id);
  const recordAttempt = useProgress((s) => s.recordAttempt);
  const [flipped, setFlipped] = useState(false);
  const [graded, setGraded] = useState(false);
  const [settled, setSettled] = useState(false);
  const back = useRef<HTMLDivElement>(null);
  if (!card) return null;
  // The front is a button that disappears when pressed, so focus moves to the answer.
  const flip = () => {
    setFlipped(true);
    back.current?.focus({ preventScroll: true });
  };
  const grade = (score: number) => {
    recordAttempt({ itemId: id, itemType: 'flashcard', skill: card.skill, moduleId: card.moduleId, score, topic: card.front, detail: { selfGraded: true } });
    setGraded(true);
  };
  const face = 'flip-face flex min-h-[46dvh] flex-col justify-center rounded-3xl border-2 border-[var(--on)] p-6 shadow-[6px_6px_0_var(--on)]';
  return (
    <div data-testid={`flashcard-${id}`}>
      <Kicker>Flashcard · {SKILL_LABELS[card.skill]}</Kicker>
      <div className="flip mt-4">
        <div className="flip-inner" data-flipped={flipped} data-settled={settled} onTransitionEnd={(e) => e.target === e.currentTarget && flipped && setSettled(true)}>
          <button type="button" className={cx(face, 'flip-front bg-white text-left text-[#161514]')} onClick={flip} aria-hidden={flipped} tabIndex={flipped ? -1 : 0}>
            <span className="reel-display text-[27px] font-extrabold">{card.front}</span>
            <span className="mt-6 flex items-center gap-2 text-[13px] font-semibold text-[#5d5850]">
              <RotateCw size={15} aria-hidden="true" /> Say it in your head, then tap to flip
            </span>
          </button>
          <div ref={back} tabIndex={-1} role="group" aria-label="Answer" className={cx(face, 'flip-back bg-[#161514] text-[#f5efe4] outline-none')} aria-hidden={!flipped}>
            <p className="text-[18px] leading-relaxed">{card.back}</p>
          </div>
        </div>
      </div>
      {flipped && !graded && (
        <div className="mt-5 animate-rise">
          <p className="text-center text-[13px] font-semibold">How well did you know it?</p>
          <div className="mt-2 grid grid-cols-3 gap-2.5">
            {(
              [
                ['Blank', 0.2],
                ['Fuzzy', 0.6],
                ['Nailed it', 1],
              ] as const
            ).map(([label, score]) => (
              <button key={label} type="button" className="tile reel-display min-h-12 px-2 py-3 text-[15px] font-extrabold uppercase" onClick={() => grade(score)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
      <p role="status" className="mt-5 text-center text-[14px] font-semibold empty:hidden">{graded && 'Scheduled. It comes back when you are about to forget it.'}</p>
    </div>
  );
}

/** A step that needs the full page (code editor, typed interview answer, build task) or a due item on the revision page. */
export function OpenCard({ title, text, to, cta }: { title: string; text: string; to: string; cta: string }) {
  return (
    <div>
      <Kicker>Needs the full screen</Kicker>
      <h2 className="reel-display mt-3 text-[32px] font-extrabold">{plain(title)}</h2>
      <p className="mt-3 text-[17px] leading-relaxed">{text}</p>
      <Link to={to} className="tile reel-display mt-6 inline-flex min-h-12 items-center gap-2 px-5 py-3 text-[16px] font-extrabold uppercase">
        {cta} <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </div>
  );
}
