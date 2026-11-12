import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { FLASHCARDS, getFlashcard, getInterview, getProblem, getQuestion, itemLabel, QUESTIONS } from '@/content';
import { lessonPath, locate, moduleForSkill } from '@/content/locate';
import { SKILL_LABELS } from '@/content/types';
import { useProgress } from '@/store/progress';
import type { SrsCard } from '@/store/types';
import { dueCards, upcoming } from '@/lib/srs';
import { activeQueue, repeatedMistakes } from '@/lib/weakness';
import { weaknessItemType } from '@/lib/recommend';
import { useDocumentTitle, useToday } from '@/lib/hooks';
import { QuestionCard } from '@/components/QuestionCard';
import { Flashcard } from '@/components/Flashcard';
import { InterviewRunner } from '@/components/InterviewRunner';
import { Badge, Button, ButtonLink, Card, Empty, Notice, PageHeader, SectionTitle, cx } from '@/components/ui';

type Tab = 'due' | 'weak' | 'mistakes' | 'cards' | 'mixed';

const REVIEWABLE = new Set(['question', 'flashcard', 'problem', 'interview']);

const hasContent = (c: SrsCard) =>
  !!(c.itemType === 'question' ? getQuestion(c.itemId) : c.itemType === 'flashcard' ? getFlashcard(c.itemId) : c.itemType === 'problem' ? getProblem(c.itemId) : getInterview(c.itemId));

function DueItem({ card, onDone }: { card: SrsCard; onDone: () => void }) {
  if (card.itemType === 'question') {
    const q = getQuestion(card.itemId);
    return q ? <QuestionCard question={q} onAnswered={onDone} /> : null;
  }
  if (card.itemType === 'flashcard') return <Flashcard id={card.itemId} onDone={onDone} />;
  if (card.itemType === 'interview') {
    const q = getInterview(card.itemId);
    return q ? <InterviewRunner question={q} onSubmitted={onDone} /> : null;
  }
  if (card.itemType === 'problem') {
    const p = getProblem(card.itemId);
    return p ? (
      <Card>
        <p className="text-xs text-faint">Coding problem · solve it again from scratch</p>
        <p className="mt-1 font-semibold text-ink">{p.title}</p>
        <p className="mt-1 text-sm text-muted">Your new attempt in the lab reschedules this card.</p>
        <ButtonLink to={`/lab/${p.id}`} variant="primary" className="mt-3">
          Open in Coding Lab <ArrowRight size={14} aria-hidden="true" />
        </ButtonLink>
      </Card>
    ) : null;
  }
  return null;
}

function DueSession({ cards }: { cards: SrsCard[] }) {
  // Snapshot the queue at the start so answering doesn't reshuffle it mid-session.
  const [queue] = useState(cards);
  const [i, setI] = useState(0);
  const [answered, setAnswered] = useState(false);
  if (queue.length === 0) return <Empty title="Nothing due right now">New items are scheduled as you answer questions. Come back tomorrow, or try a mixed quiz.</Empty>;
  if (i >= queue.length)
    return (
      <Empty title="Revision session complete" action={<ButtonLink to="/" variant="primary">Back to dashboard</ButtonLink>}>
        {queue.length} item{queue.length > 1 ? 's' : ''} reviewed. Correct answers move further out on the 1 → 3 → 7 → 21-day ladder; misses come back tomorrow.
      </Empty>
    );
  const card = queue[i];
  const loc = locate(card.itemType, card.itemId);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>
          Item {i + 1} of {queue.length} · {SKILL_LABELS[card.skill]} · {card.lapses ? `missed ${card.lapses}×` : `review #${card.reviews + 1}`}
        </span>
        {loc && (
          <Link to={lessonPath(loc)} className="text-accent-strong hover:underline">
            Re-read the lesson
          </Link>
        )}
      </div>
      <DueItem key={card.id} card={card} onDone={() => setAnswered(true)} />
      <div className="flex justify-end gap-2">
        {!answered && card.itemType === 'problem' && <Button onClick={() => setI((x) => x + 1)}>Skip for now</Button>}
        {(answered || card.itemType === 'problem') && (
          <Button variant="primary" onClick={() => { setAnswered(false); setI((x) => x + 1); }}>
            Next <ArrowRight size={14} aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}

function MixedQuiz() {
  const [seed, setSeed] = useState(() => (Date.now() % 100000) + 1);
  // Weak skills are read once per set, so answering a question can't reshuffle the cards you're reading.
  const picks = useMemo(() => {
    const weakSkills = new Set(activeQueue(useProgress.getState().weaknesses).map((w) => w.skill));
    let x = seed * 9301 + 49297;
    const rand = () => ((x = (x * 16807) % 2147483647) / 2147483647);
    return [...QUESTIONS]
      .map((q) => ({ q, k: rand() - (weakSkills.has(q.skill) ? 0.35 : 0) }))
      .sort((a, b) => a.k - b.k)
      .slice(0, 5)
      .map((r) => r.q);
  }, [seed]);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Five questions across modules, weighted toward your weak skills. Interleaving topics is harder than blocked practice — and better for retention.</p>
      {picks.map((q, i) => (
        <QuestionCard key={`${seed}-${q.id}`} question={q} index={i} />
      ))}
      <Button onClick={() => setSeed((s) => s + 1)}>New mixed set</Button>
    </div>
  );
}

export default function Revision() {
  useDocumentTitle('Revision');
  const today = useToday();
  const srs = useProgress((s) => s.srs);
  const weaknesses = useProgress((s) => s.weaknesses);
  const attempts = useProgress((s) => s.attempts);
  const due = dueCards(srs, today).filter((c) => REVIEWABLE.has(c.itemType) && hasContent(c));
  const queue = activeQueue(weaknesses);
  const repeated = repeatedMistakes(weaknesses);
  const resolved = Object.values(weaknesses).filter((w) => w.status === 'resolved');
  const cal = upcoming(srs, 13, today);
  const [tab, setTab] = useState<Tab>('due');
  // Snapshot when the page opens, so a card answered correctly stays visible with its feedback.
  const [wrongQuestions] = useState(() =>
    [...new Set(attempts.filter((a) => a.itemType === 'question' && !a.correct).map((a) => a.itemId))].filter((id) => {
      const latest = [...attempts].reverse().find((a) => a.itemType === 'question' && a.itemId === id);
      return latest && !latest.correct && getQuestion(id);
    }),
  );

  // Standard tab pattern: arrows/Home/End move between tabs, Tab moves into the panel.
  const onTabKey = (e: React.KeyboardEvent) => {
    const ids = TABS.map(([id]) => id);
    const i = ids.indexOf(tab);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: ids.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const t = ids[(next + ids.length) % ids.length];
    setTab(t);
    document.getElementById(`tab-${t}`)?.focus();
  };

  const TABS: [Tab, string, number?][] = [
    ['due', 'Due now', due.length],
    ['weak', 'Weakness queue', queue.length],
    ['mistakes', 'Previous mistakes', wrongQuestions.length],
    ['cards', 'Flashcards', FLASHCARDS.length],
    ['mixed', 'Mixed quiz'],
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Revision Center" kicker="Spaced repetition · weakness queue" />

      <Card aria-labelledby="cal-title">
        <SectionTitle id="cal-title">Next two weeks</SectionTitle>
        <ol className="grid grid-cols-7 gap-1.5 sm:grid-cols-14" aria-label="Items due per day">
          {Object.entries(cal).map(([day, n]) => (
            <li key={day} className={cx('rounded-md border px-1 py-1.5 text-center', day === today ? 'border-accent' : 'border-line')} title={`${day}: ${n} due`}>
              <p className="text-[10px] text-faint">{new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' })}</p>
              <p className={cx('text-sm font-semibold tabular-nums', n ? 'text-ink' : 'text-faint')}>{n}</p>
            </li>
          ))}
        </ol>
      </Card>

      <div className="flex flex-wrap gap-1 border-b border-line" role="tablist" aria-label="Revision views" onKeyDown={onTabKey}>
        {TABS.map(([id, label, n]) => (
          <button key={id} type="button" role="tab" id={`tab-${id}`} tabIndex={tab === id ? 0 : -1} aria-selected={tab === id} aria-controls={`panel-${id}`} onClick={() => setTab(id)} className={cx('-mb-px border-b-2 px-3 py-2 text-[13.5px]', tab === id ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink')}>
            {label}
            {n !== undefined && <span className="ml-1.5 text-xs text-faint">{n}</span>}
          </button>
        ))}
      </div>

      <div role="tabpanel" tabIndex={0} id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'due' && <DueSession cards={due} />}

        {tab === 'weak' && (
          <div className="space-y-4">
            {repeated.length > 0 && (
              <Notice tone="warn" title="Repeated mistakes block progress.">
                You've missed {repeated.length} item{repeated.length > 1 ? 's' : ''} more than once. Re-learn those before new material — same mistake twice means the explanation didn't land, so try the visual or video this time.
              </Notice>
            )}
            {queue.length === 0 ? (
              <Empty title="No active weaknesses">Items you miss (score under 60%) appear here and leave after you get them right on two different days.</Empty>
            ) : (
              <ul className="space-y-2">
                {queue.map((w) => {
                  const loc = w.itemId ? locate(weaknessItemType(w.id), w.itemId) : undefined;
                  const m = !w.itemId ? moduleForSkill(w.skill) : undefined;
                  const to = loc ? lessonPath(loc) : m ? `/learn/${m.id}` : '/learn';
                  return (
                    <li key={w.id} className="card flex flex-wrap items-center gap-3 p-3">
                      {w.mistakes >= 2 && <AlertTriangle size={16} className="text-warn" aria-label="Repeated mistake" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink">{w.itemId ? itemLabel(weaknessItemType(w.id), w.itemId) : w.topic}</p>
                        <p className="text-xs text-muted">
                          {SKILL_LABELS[w.skill]} · {w.source === 'assessment' ? `missed ${w.mistakes}×` : w.source === 'calibration' ? `baseline diagnostic ${Math.round(w.score * 10)}/10` : `self-rated ${Math.round(w.score * 5)}/5`} · passes {w.passes}/2
                        </p>
                      </div>
                      <Badge tone={w.source === 'assessment' ? 'bad' : 'warn'}>{w.source}</Badge>
                      <Link to={to} className="text-sm text-accent-strong hover:underline">
                        Study
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {resolved.length > 0 && <p className="text-xs text-ok">{resolved.length} weakness{resolved.length > 1 ? 'es' : ''} resolved so far.</p>}
          </div>
        )}

        {tab === 'mistakes' && (
          <div className="space-y-4">
            {wrongQuestions.length === 0 ? (
              <Empty title="No open mistakes">Questions whose latest answer was wrong show up here for another try.</Empty>
            ) : (
              wrongQuestions.map((id, i) => {
                const q = getQuestion(id);
                return q ? <QuestionCard key={id} question={q} index={i} /> : null;
              })
            )}
          </div>
        )}

        {tab === 'cards' && (
          <div className="grid gap-3 md:grid-cols-2">
            {FLASHCARDS.map((c) => (
              <Flashcard key={c.id} id={c.id} />
            ))}
          </div>
        )}

        {tab === 'mixed' && <MixedQuiz />}
      </div>
    </div>
  );
}
