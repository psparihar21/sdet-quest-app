import '@fontsource-variable/bricolage-grotesque/wdth.css';
import { createContext, memo, useCallback, useContext, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Bookmark, ChevronDown, ChevronUp, ChevronsUp, Flame, X } from 'lucide-react';
import { getQuestion } from '@/content';
import { answeredCheckSteps, buildFeed, type FeedCard } from '@/lib/feed';
import { useDocumentTitle, useReducedMotion } from '@/lib/hooks';
import { useProgress } from '@/store/progress';
import { FlipCard, LearnCard, OpenCard, TableDeck } from '@/components/feed/ReelCards';
import { ReelQuestion } from '@/components/feed/ReelQuestion';
import { VideoEmbed } from '@/components/VideoEmbed';
import { cx } from '@/components/ui';
import { Visualization } from '@/viz';

/** Reading, watching or stepping through a diagram finishes its lesson step once the last card is on screen. */
const PASSIVE = new Set<FeedCard['kind']>(['learn', 'table', 'visual', 'video']);

const WHY = { due: 'Due for revision', weak: 'Weak spot', new: 'New' } as const;

// Lesson cards rotate through these; one lesson step keeps one colour, so a colour change means a new step.
const LESSON_PAPERS = ['ink', 'cobalt', 'forest', 'clay', 'cream'] as const;
function paperFor(card: FeedCard): string {
  if (card.kind === 'question') return 'cream';
  if (card.kind === 'flashcard') return 'sun';
  if (card.kind === 'visual' || card.kind === 'video') return 'ink';
  const seed = [...(card.lessonId ?? card.key)].reduce((n, ch) => n + ch.charCodeAt(0), card.step?.index ?? 0);
  return LESSON_PAPERS[seed % LESSON_PAPERS.length];
}

/** Check steps complete once every question in them has a stored attempt, wherever it was answered. */
function settleChecks() {
  const { markSection } = useProgress.getState();
  for (const s of answeredCheckSteps(useProgress.getState())) markSection(s.lessonId, s.index, s.total);
}

/** Right answers in a row this session. In context so a new value re-renders only the pills, not every card. */
const Combo = createContext(0);

function ComboPill() {
  const combo = useContext(Combo);
  if (combo < 2) return null;
  return (
    <p key={combo} className="reel-display flex shrink-0 animate-rise items-center gap-1 rounded-full bg-[var(--on)] px-2.5 py-1 text-[13px] font-extrabold tabular-nums text-[var(--paper)]">
      <Flame size={14} aria-hidden="true" />
      <span aria-hidden="true">×{combo}</span>
      <span className="sr-only">{combo} right in a row</span>
    </p>
  );
}

function CardBody({ card, onAnswered }: { card: FeedCard; onAnswered: (correct: boolean) => void }) {
  switch (card.kind) {
    case 'learn':
      return <LearnCard title={card.title} body={card.body} part={card.part} parts={card.parts} />;
    case 'table':
      return <TableDeck title={card.title} head={card.head} rows={card.rows} />;
    case 'visual':
      return (
        <div>
          <h2 className="reel-display text-[28px] font-extrabold">{card.title}</h2>
          {/* Diagrams are drawn with the app's dark tokens, whatever the paper or theme. */}
          <div data-theme="dark" className="mt-4 rounded-2xl bg-bg p-3 text-ink">
            <Visualization vizId={card.vizId} />
          </div>
          <p className="mt-3 text-[15.5px] leading-relaxed text-muted">{card.caption}</p>
        </div>
      );
    case 'video':
      return (
        <div>
          <h2 className="reel-display mb-4 text-[28px] font-extrabold">{card.title}</h2>
          <div data-theme="dark" className="text-ink">
            <VideoEmbed video={card.video} />
          </div>
        </div>
      );
    case 'question': {
      const q = getQuestion(card.id);
      return q ? <ReelQuestion question={q} onAnswered={onAnswered} /> : null;
    }
    case 'flashcard':
      return <FlipCard id={card.id} />;
    case 'open':
      return <OpenCard title={card.title} text={card.text} to={card.to} cta={card.cta} />;
  }
}

/** Story-style bar: one segment per lesson step, filled as steps are finished. */
function Segments({ card }: { card: FeedCard }) {
  const done = useProgress((s) => (card.lessonId ? s.lessons[card.lessonId]?.done : undefined));
  if (!card.step) return <div className="h-1" />;
  const { index, total } = card.step;
  return (
    <div className="flex gap-1" role="img" aria-label={`Lesson step ${index + 1} of ${total}, ${done?.length ?? 0} done`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cx('h-1 flex-1 rounded-full bg-[var(--on)] transition-opacity duration-300', done?.includes(i) ? 'opacity-100' : i === index ? 'opacity-70' : 'opacity-40')} />
      ))}
    </div>
  );
}

function SaveButton({ lessonId }: { lessonId: string }) {
  const saved = useProgress((s) => s.bookmarks.includes(lessonId));
  const toggleBookmark = useProgress((s) => s.toggleBookmark);
  return (
    <button type="button" onClick={() => toggleBookmark(lessonId)} aria-pressed={saved} aria-label="Save this lesson" className="reel-btn flex h-11 w-11 items-center justify-center rounded-full border-2 border-[var(--on)]">
      <Bookmark size={19} aria-hidden="true" fill={saved ? 'currentColor' : 'none'} />
    </button>
  );
}

const PAD = { paddingTop: 'max(14px, env(safe-area-inset-top))', paddingBottom: 'max(14px, env(safe-area-inset-bottom))' };

// Memoised: appending cards or answering a question must not re-render the hundreds of cards already in the feed.
const ReelCard = memo(function ReelCard({ card, index, onAnswered }: { card: FeedCard; index: number; onAnswered: (correct: boolean) => void }) {
  const [popped, setPopped] = useState(false);

  // Double-tap a card to save its lesson, as you would like a reel. The buttons in the footer do the same.
  const save = (e: MouseEvent) => {
    if (!card.lessonId || (e.target as HTMLElement).closest('button, a, input, summary, [role="group"], [data-nosave]')) return;
    const { bookmarks, toggleBookmark } = useProgress.getState();
    if (!bookmarks.includes(card.lessonId)) toggleBookmark(card.lessonId);
    setPopped(true);
  };

  return (
    <article
      data-key={card.key}
      data-testid="feed-card"
      aria-posinset={index + 1}
      aria-setsize={-1}
      aria-label={`${WHY[card.why]}: ${card.label}`}
      onDoubleClick={save}
      className={cx('reel-card paper relative flex flex-col px-5', `paper-${paperFor(card)}`)}
      style={PAD}
    >
      <header>
        <Segments card={card} />
        <div className="mt-3 flex items-center gap-3">
          <Link to="/" aria-label="Close the feed and open the dashboard" className="reel-btn -ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
            <X size={22} aria-hidden="true" />
          </Link>
          <p className="reel-display min-w-0 flex-1 truncate text-[13px] font-bold uppercase tracking-[0.06em]">{card.label}</p>
          <ComboPill />
        </div>
      </header>

      {/* Long content scrolls inside its card; the swipe carries on to the next card at either end. */}
      <div data-inner className="-mx-5 flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-5 py-4">
        <div className="my-auto">
          <CardBody card={card} onAnswered={onAnswered} />
        </div>
      </div>

      <footer className="flex min-h-11 items-center justify-between gap-3">
        <p className="reel-display text-[12px] font-bold uppercase tracking-[0.08em] text-muted">{WHY[card.why]}</p>
        {index === 0 && (
          <p className="flex items-center gap-1 text-[12.5px] font-semibold" data-testid="feed-hint">
            <ChevronsUp size={15} aria-hidden="true" className="animate-bounce [animation-iteration-count:4]" /> Swipe up
          </p>
        )}
        {card.lessonId && card.moduleId && (
          <div className="flex gap-2">
            <SaveButton lessonId={card.lessonId} />
            <Link to={`/learn/${card.moduleId}/${card.lessonId}`} aria-label="Open the full lesson" className="reel-btn flex h-11 w-11 items-center justify-center rounded-full border-2 border-[var(--on)]">
              <BookOpen size={19} aria-hidden="true" />
            </Link>
          </div>
        )}
      </footer>

      {popped && (
        <span aria-hidden="true" onAnimationEnd={() => setPopped(false)} className="pointer-events-none absolute inset-0 flex animate-pop items-center justify-center">
          <Bookmark size={96} fill="currentColor" />
        </span>
      )}
    </article>
  );
});

export default function Feed() {
  useDocumentTitle('Feed');
  const markSection = useProgress((s) => s.markSection);
  // Only `more` changes the list, so the ref is always the list on screen.
  const shown = useRef<FeedCard[]>([]);
  const [cards, setCards] = useState(() => {
    settleChecks();
    return (shown.current = buildFeed(useProgress.getState()));
  });
  const [caughtUp, setCaughtUp] = useState(false);
  const [combo, setCombo] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  // Progress made while scrolling changes what comes next, so more cards are built from the live state.
  const more = useCallback(() => {
    settleChecks();
    const next = buildFeed(useProgress.getState(), { shown: shown.current });
    if (!next.length) return setCaughtUp(true);
    shown.current = [...shown.current, ...next];
    setCards(shown.current);
  }, []);

  const onAnswered = useCallback((correct: boolean) => {
    settleChecks();
    setCombo((c) => (correct ? c + 1 : 0));
  }, []);

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const byKey = new Map(cards.map((c) => [c.key, c]));
    // A card counts as read once it fills most of the screen.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const card = byKey.get((e.target as HTMLElement).dataset.key ?? '');
          if (card?.step?.last && PASSIVE.has(card.kind)) markSection(card.step.lessonId, card.step.index, card.step.total);
        }
      },
      { root, threshold: 0.6 },
    );
    root.querySelectorAll('[data-key]').forEach((el) => io.observe(el));
    // Snap scrolling never scrolls past the last card, so more cards load one screen before the end.
    const end = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && more(), { root, rootMargin: '0px 0px 100% 0px' });
    if (sentinel.current) end.observe(sentinel.current);
    return () => {
      io.disconnect();
      end.disconnect();
    };
  }, [cards, more, markSection]);

  const reduced = useReducedMotion();
  /**
   * Move one card, unless the card on screen still has unread content in that direction:
   * then that content scrolls first, so keys, wheel and buttons never skip the rest of a long card.
   */
  const step = useCallback(
    (dir: 1 | -1) => {
      const root = scroller.current;
      if (!root) return;
      const behavior = reduced ? 'auto' : 'smooth';
      const inner = root.children[Math.round(root.scrollTop / root.clientHeight)]?.querySelector<HTMLElement>('[data-inner]');
      const room = inner && (dir > 0 ? inner.scrollTop + inner.clientHeight < inner.scrollHeight - 1 : inner.scrollTop > 0);
      if (room) inner.scrollBy({ top: dir * inner.clientHeight * 0.8, behavior });
      else root.scrollBy({ top: dir * root.clientHeight, behavior });
    },
    [reduced],
  );

  // A mouse wheel notch is far shorter than a card, so snap scrolling alone would spring back. One notch = one step.
  // Touch and gentle trackpad scrolling are left to the browser's own snapping.
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    let lockedUntil = 0;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 50 || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (e.timeStamp < lockedUntil) return;
      lockedUntil = e.timeStamp + 600;
      step(e.deltaY > 0 ? 1 : -1);
    };
    root.addEventListener('wheel', onWheel, { passive: false });
    return () => root.removeEventListener('wheel', onWheel);
  }, [step]);

  // Keys move a step at a time, but only from the feed itself: Space on a button must still press the button.
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const dir = ['ArrowDown', 'PageDown', ' '].includes(e.key) ? 1 : ['ArrowUp', 'PageUp'].includes(e.key) ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    step(dir);
  };

  return (
    <div className="relative mx-auto h-dvh w-full max-w-[480px]">
      {/* Desktop has no swipe: previous/next buttons beside the column. */}
      <div className="absolute left-full top-1/2 z-10 ml-4 hidden -translate-y-1/2 flex-col gap-3 text-white [--on:#fff] md:flex">
        <button type="button" onClick={() => step(-1)} aria-label="Previous card" className="reel-btn flex h-11 w-11 items-center justify-center rounded-full border border-white/30 hover:bg-white/10">
          <ChevronUp size={20} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => step(1)} aria-label="Next card" className="reel-btn flex h-11 w-11 items-center justify-center rounded-full border border-white/30 hover:bg-white/10">
          <ChevronDown size={20} aria-hidden="true" />
        </button>
      </div>
      <div ref={scroller} role="feed" aria-label="Learning feed. Arrow keys move between cards." tabIndex={0} onKeyDown={onKey} className="reel relative h-dvh overflow-y-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white">
        <Combo.Provider value={combo}>
          {cards.map((card, i) => (
            <ReelCard key={card.key} card={card} index={i} onAnswered={onAnswered} />
          ))}
        </Combo.Provider>
        {caughtUp ? (
          <article aria-posinset={cards.length + 1} aria-setsize={-1} aria-label="All caught up" className="reel-card paper paper-ink flex flex-col justify-center gap-4 px-6">
            <h2 className="reel-display text-[44px] font-extrabold">You're all caught up.</h2>
            <p className="text-[17px] leading-relaxed text-muted">Nothing is due and there is no unread lesson material. Practise on the full pages.</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/lab" className="tile reel-display px-5 py-3 text-[15px] font-extrabold uppercase">
                Coding Lab
              </Link>
              <Link to="/arena" className="tile reel-display px-5 py-3 text-[15px] font-extrabold uppercase">
                Interview Arena
              </Link>
            </div>
          </article>
        ) : (
          <div ref={sentinel} className="h-px" />
        )}
      </div>

    </div>
  );
}
