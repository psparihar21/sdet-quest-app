import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronsDown } from 'lucide-react';
import { getQuestion } from '@/content';
import { answeredCheckSteps, buildFeed, type FeedCard } from '@/lib/feed';
import { useDocumentTitle } from '@/lib/hooks';
import { useProgress } from '@/store/progress';
import { Flashcard } from '@/components/Flashcard';
import { Markdown } from '@/components/Markdown';
import { QuestionCard } from '@/components/QuestionCard';
import { VideoEmbed } from '@/components/VideoEmbed';
import { Badge, ButtonLink } from '@/components/ui';
import { Visualization } from '@/viz';

const TONE = { due: 'warn', weak: 'bad', new: 'neutral' } as const;

/** Reading, watching or stepping through a diagram finishes its lesson step once the last card is on screen. */
const PASSIVE = new Set<FeedCard['kind']>(['learn', 'visual', 'video']);

/** Check steps complete once every question in them has a stored attempt, wherever it was answered. */
function settleChecks() {
  const { markSection } = useProgress.getState();
  for (const s of answeredCheckSteps(useProgress.getState())) markSection(s.lessonId, s.index, s.total);
}

// Memoised: appending cards must not re-render the hundreds already in the feed.
const CardBody = memo(function CardBody({ card }: { card: FeedCard }) {
  switch (card.kind) {
    case 'learn':
      return (
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-xs font-medium text-faint">{card.title}</p>
          <Markdown className="mt-2 !max-w-none">{card.body}</Markdown>
        </div>
      );
    case 'visual':
      return (
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-[15px] font-semibold text-ink">{card.title}</p>
          <div className="mt-3">
            <Visualization vizId={card.vizId} />
          </div>
          <p className="mt-3 text-[13.5px] text-muted">{card.caption}</p>
        </div>
      );
    case 'video':
      return (
        <div>
          <p className="mb-2 text-[15px] font-semibold text-ink">{card.title}</p>
          <VideoEmbed video={card.video} />
        </div>
      );
    case 'question': {
      const q = getQuestion(card.id);
      if (!q) return null;
      return <QuestionCard question={q} onAnswered={settleChecks} />;
    }
    case 'flashcard':
      return <Flashcard id={card.id} />;
    case 'open':
      return (
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-[16px] font-semibold text-ink">{card.title}</p>
          <p className="mt-2 text-[14px] text-muted">{card.text}</p>
          <ButtonLink to={card.to} variant="primary" className="mt-4">
            {card.cta} <ArrowRight size={15} aria-hidden="true" />
          </ButtonLink>
        </div>
      );
  }
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
  const scroller = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(0);

  // The feed fills the screen below whatever the shell puts above it (mobile top bar, storage banners).
  useLayoutEffect(() => {
    const measure = () => setTop(scroller.current?.getBoundingClientRect().top ?? 0);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Progress made while scrolling changes what comes next, so more cards are built from the live state.
  const more = useCallback(() => {
    settleChecks();
    const next = buildFeed(useProgress.getState(), { shown: shown.current });
    if (!next.length) return setCaughtUp(true);
    shown.current = [...shown.current, ...next];
    setCards(shown.current);
  }, []);

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const byKey = new Map(cards.map((c) => [c.key, c]));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const card = byKey.get((e.target as HTMLElement).dataset.key ?? '');
          if (card?.step?.last && PASSIVE.has(card.kind)) markSection(card.step.lessonId, card.step.index, card.step.total);
        }
      },
      // A tall card never reaches a high ratio, so "seen" means its end has come into view.
      { root, threshold: 0 },
    );
    root.querySelectorAll('[data-seen]').forEach((el) => io.observe(el));
    // Snap scrolling never scrolls past the last card, so more cards load one screen before the end.
    const end = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && more(), { root, rootMargin: '0px 0px 100% 0px' });
    if (sentinel.current) end.observe(sentinel.current);
    return () => {
      io.disconnect();
      end.disconnect();
    };
  }, [cards, more, markSection]);

  return (
    <div
      ref={scroller}
      role="feed"
      aria-label="Learning feed"
      tabIndex={0}
      style={{ height: `calc(100dvh - ${top}px)` }}
      // `relative`: screen-reader-only (absolutely positioned) text inside cards must scroll with the feed, not stretch the page.
      className="relative -mx-4 -mb-16 snap-y snap-mandatory overflow-y-auto overscroll-contain outline-none sm:-mx-6 lg:-mx-10"
    >
      {cards.map((card, i) => (
        <article
          key={card.key}
          aria-posinset={i + 1}
          aria-setsize={-1}
          aria-label={card.label}
          data-testid="feed-card"
          className="flex min-h-full snap-start flex-col justify-center px-4 py-6 sm:px-6 lg:px-10"
        >
          <div className="mx-auto w-full max-w-2xl">
            <div className="mb-3 flex items-center gap-2">
              <Badge tone={TONE[card.why]}>{card.label}</Badge>
            </div>
            <CardBody card={card} />
            {/* Marks the end of the card: when it scrolls into view the card has been read. */}
            <div data-seen data-key={card.key} className="h-px" />
            {i === 0 && (
              <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-faint">
                <ChevronsDown size={14} aria-hidden="true" /> Scroll for the next card
              </p>
            )}
          </div>
        </article>
      ))}
      {caughtUp ? (
        <article aria-posinset={cards.length + 1} aria-setsize={-1} className="flex min-h-full snap-start flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-lg font-semibold text-ink">You're all caught up</p>
          <p className="max-w-sm text-sm text-muted">Nothing is due and there is no unread lesson material. Practise problems or an interview round on the full pages.</p>
          <div className="flex gap-2">
            <ButtonLink to="/lab">Coding Lab</ButtonLink>
            <ButtonLink to="/arena" variant="primary">
              Interview Arena
            </ButtonLink>
          </div>
        </article>
      ) : (
        <div ref={sentinel} className="h-px" />
      )}
    </div>
  );
}
