import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bookmark, BookmarkCheck, CheckCircle2, ChevronLeft, ChevronRight, Hammer, MessagesSquare, PenLine } from 'lucide-react';
import { findLesson, getInterview, getProblem, getQuestion } from '@/content';
import type { Section } from '@/content/types';
import { useProgress } from '@/store/progress';
import { useDocumentTitle } from '@/lib/hooks';
import { Markdown } from '@/components/Markdown';
import { QuestionCard } from '@/components/QuestionCard';
import { ProblemWorkspace } from '@/components/ProblemWorkspace';
import { InterviewRunner } from '@/components/InterviewRunner';
import { VideoEmbed } from '@/components/VideoEmbed';
import { Visualization } from '@/viz';
import { Badge, Button, ButtonLink, Notice, cx } from '@/components/ui';
import NotFound from './NotFound';

/** Each section maps to a stage of the learning cycle. */
const STAGE: Record<Section['kind'], string> = {
  learn: 'Learn',
  visual: 'Visualize',
  video: 'Watch',
  check: 'Understand',
  practice: 'Practice',
  build: 'Build',
  interview: 'Interview',
};

function BuildTask({ section, lessonId, index, onDone }: { section: Extract<Section, { kind: 'build' }>; lessonId: string; index: number; onDone: () => void }) {
  const key = `${lessonId}#${index}`;
  const note = useProgress((s) => s.notes[key] ?? '');
  const setNote = useProgress((s) => s.setNote);
  const recordAttempt = useProgress((s) => s.recordAttempt);
  const lessonModule = findLesson(lessonId)?.module;
  const [checked, setChecked] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const submit = () => {
    setSubmitted(true);
    recordAttempt({
      itemId: key,
      itemType: 'build',
      skill: lessonModule?.skills[0] ?? 'fundamentals',
      moduleId: lessonModule?.id,
      score: checked.length / section.acceptance.length,
      topic: section.title,
      detail: { selfAssessed: true, checked },
    });
    onDone();
  };
  return (
    <div className="space-y-4">
      <Markdown>{section.task}</Markdown>
      <div>
        <label htmlFor={`build-${key}`} className="text-sm font-medium text-ink">
          Your work <span className="font-normal text-faint">(saved automatically on this device)</span>
        </label>
        <textarea id={`build-${key}`} value={note} onChange={(e) => setNote(key, e.target.value.slice(0, 20000))} rows={10} className="mt-1 w-full resize-y rounded-lg border border-line bg-surface px-3 py-2.5 font-mono text-[13px] leading-relaxed text-ink" placeholder="Draft your plan, test cases or design here…" />
      </div>
      <fieldset className="rounded-xl border border-line bg-surface-2 p-4">
        <legend className="px-1 text-sm font-semibold text-ink">Acceptance criteria — tick only what your work actually does</legend>
        <div className="mt-1 space-y-1.5">
          {section.acceptance.map((a, i) => (
            <label key={i} className="flex items-start gap-2 text-[13.5px] text-ink">
              <input type="checkbox" className="mt-1 accent-[var(--accent)]" disabled={submitted} checked={checked.includes(i)} onChange={(e) => setChecked((c) => (e.target.checked ? [...c, i] : c.filter((x) => x !== i)))} />
              {a}
            </label>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={submit} disabled={submitted || note.trim().length < 40 || checked.length === 0}>
            Submit self-review
          </Button>
          <span className="text-xs text-faint">{submitted ? `Recorded as self-assessed: ${checked.length}/${section.acceptance.length} criteria.` : 'Write at least a few lines and tick what your work covers. Self-assessed scores are labelled as such.'}</span>
        </div>
      </fieldset>
    </div>
  );
}

function CheckSection({ ids, onAllAnswered }: { ids: string[]; onAllAnswered: () => void }) {
  // The step completes once every question in it has a stored attempt (from this visit or an earlier one).
  const allAnswered = () => {
    const tried = new Set(useProgress.getState().attempts.filter((a) => a.itemType === 'question').map((a) => a.itemId));
    return ids.every((id) => !getQuestion(id) || tried.has(id));
  };
  return (
    <div className="space-y-4">
      {ids.map((id, i) => {
        const q = getQuestion(id);
        if (!q) return null;
        return (
          <QuestionCard
            key={id}
            question={q}
            index={i}
            onAnswered={() => allAnswered() && onAllAnswered()}
          />
        );
      })}
    </div>
  );
}

function LessonView() {
  const { moduleId = '', lessonId = '' } = useParams();
  const found = findLesson(lessonId);
  useDocumentTitle(found?.lesson.title ?? 'Lesson');
  const progress = useProgress((s) => s.lessons[lessonId]);
  const markSection = useProgress((s) => s.markSection);
  const bookmarked = useProgress((s) => s.bookmarks.includes(lessonId));
  const toggleBookmark = useProgress((s) => s.toggleBookmark);
  const notes = useProgress((s) => s.notes[lessonId] ?? '');
  const setNote = useProgress((s) => s.setNote);
  const [idx, setIdx] = useState(() => {
    if (!found) return 0;
    const done = progress?.done ?? [];
    const first = found.lesson.sections.findIndex((_, i) => !done.includes(i));
    return first === -1 ? 0 : first;
  });
  const [showNotes, setShowNotes] = useState(false);
  const focusOnStep = useRef(false);
  useEffect(() => {
    if (!focusOnStep.current) return;
    focusOnStep.current = false;
    document.getElementById('lesson-section')?.focus();
  }, [idx]);

  if (!found || found.module.id !== moduleId) return <NotFound />;
  const { module: m, lesson, index: lessonIndex } = found;
  const total = lesson.sections.length;
  const section = lesson.sections[idx];
  const done = progress?.done ?? [];
  const isDone = (i: number) => done.includes(i);
  const complete = () => markSection(lesson.id, idx, total);
  const go = (i: number) => {
    focusOnStep.current = true;
    setIdx(Math.max(0, Math.min(total - 1, i)));
  };
  const firstUndone = lesson.sections.findIndex((_, i) => !isDone(i) && i !== idx);
  const nextLesson = m.lessons[lessonIndex + 1];
  const lessonDone = !!progress?.completedAt;
  // Passive sections are completed by moving on; assessed sections complete only when attempted.
  const passive = section.kind === 'learn' || section.kind === 'visual' || section.kind === 'video';

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="min-w-0 xl:sticky xl:top-8 xl:self-start" aria-label="Lesson steps">
        <nav aria-label="Breadcrumb" className="mb-3 text-xs text-faint">
          <Link to="/learn" className="hover:text-ink">
            Curriculum
          </Link>{' '}
          /{' '}
          <Link to={`/learn/${m.id}`} className="hover:text-ink">
            M{m.number}
          </Link>
        </nav>
        <p className="text-sm font-semibold text-ink">{lesson.title}</p>
        <p className="mb-3 text-xs text-muted">
          {lesson.minutes} min · {done.length}/{total} steps
        </p>
        <ol className="flex gap-1 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible">
          {lesson.sections.map((s, i) => (
            <li key={i} className="shrink-0">
              <button
                type="button"
                onClick={() => go(i)}
                aria-current={i === idx ? 'step' : undefined}
                aria-label={`Step ${i + 1}, ${STAGE[s.kind]}: ${s.title}${isDone(i) ? ' (done)' : ''}`}
                className={cx(
                  'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px]',
                  i === idx ? 'bg-accent-soft text-accent-strong' : 'text-muted hover:bg-surface-2 hover:text-ink',
                )}
              >
                {isDone(i) ? <CheckCircle2 size={14} className="shrink-0 text-ok" aria-label="done" /> : <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-line-strong text-[9px]">{i + 1}</span>}
                <span className="whitespace-nowrap xl:whitespace-normal">
                  <span className="text-[10.5px] uppercase tracking-wide text-faint">{STAGE[s.kind]}</span>
                  <span className="hidden xl:block">{s.title}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-3 flex gap-2 xl:mt-4">
          <Button size="sm" variant="ghost" onClick={() => toggleBookmark(lesson.id)} aria-pressed={bookmarked}>
            {bookmarked ? <BookmarkCheck size={14} aria-hidden="true" /> : <Bookmark size={14} aria-hidden="true" />} {bookmarked ? 'Saved' : 'Bookmark'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowNotes((x) => !x)} aria-expanded={showNotes}>
            <PenLine size={14} aria-hidden="true" /> Notes
          </Button>
        </div>
      </aside>

      <article className="min-w-0">
        {showNotes && (
          <div className="mb-4">
            <label htmlFor="lesson-notes" className="text-xs font-semibold text-faint">
              Your notes for this lesson
            </label>
            <textarea id="lesson-notes" value={notes} onChange={(e) => setNote(lesson.id, e.target.value.slice(0, 20000))} rows={4} className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink" />
          </div>
        )}
        <div id="lesson-section" tabIndex={-1} className="outline-none" key={idx}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone="accent">{STAGE[section.kind]}</Badge>
            <span className="text-xs text-faint">
              Step {idx + 1} of {total}
            </span>
          </div>
          <h1 className="mb-4 text-[22px] font-semibold tracking-tight text-ink">{section.title}</h1>

          <div className="animate-rise">
            {section.kind === 'learn' && <Markdown>{section.body}</Markdown>}
            {section.kind === 'visual' && (
              <div className="space-y-2">
                <Visualization vizId={section.vizId} />
                <p className="text-[13px] text-muted">{section.caption}</p>
              </div>
            )}
            {section.kind === 'video' && (
              <div className="max-w-3xl space-y-3">
                <VideoEmbed video={section.video} />
                <p className="text-xs text-faint">Optional. Everything you need is in the lesson text; the video is a curated third-party explanation.</p>
              </div>
            )}
            {section.kind === 'check' && <CheckSection ids={section.questionIds} onAllAnswered={complete} />}
            {section.kind === 'practice' &&
              (() => {
                const p = getProblem(section.problemId);
                return p ? (
                  <div className="space-y-3">
                    <ProblemAttemptWatcher problemId={p.id} onAttempt={complete} />
                    <ProblemWorkspace problem={p} />
                  </div>
                ) : null;
              })()}
            {section.kind === 'build' && (
              <div className="space-y-3">
                <Notice>
                  <Hammer size={13} className="mr-1 inline" aria-hidden="true" />
                  Build tasks are reviewed against acceptance criteria by you (self-assessment). Bring your draft to the Interview Arena to practise explaining it.
                </Notice>
                <BuildTask section={section} lessonId={lesson.id} index={idx} onDone={complete} />
              </div>
            )}
            {section.kind === 'interview' &&
              (() => {
                const q = getInterview(section.interviewId);
                return q ? (
                  <div className="space-y-3">
                    <Notice>
                      <MessagesSquare size={13} className="mr-1 inline" aria-hidden="true" />
                      Answer as if you're in the interview. The model answer stays hidden until you submit.
                    </Notice>
                    <InterviewRunner question={q} onSubmitted={complete} />
                  </div>
                ) : null;
              })()}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <Button onClick={() => go(idx - 1)} disabled={idx === 0}>
            <ChevronLeft size={15} aria-hidden="true" /> Previous
          </Button>
          {idx < total - 1 ? (
            <Button
              variant="primary"
              onClick={() => {
                if (passive) complete();
                go(idx + 1);
              }}
            >
              {passive ? 'Got it, next' : isDone(idx) ? 'Next' : 'Skip for now'} <ChevronRight size={15} aria-hidden="true" />
            </Button>
          ) : (
            // The lesson only completes when every step is done, so send the learner to what's missing instead of a dead button.
            !lessonDone &&
            (firstUndone !== -1 && (passive || isDone(idx)) ? (
              <Button variant="primary" onClick={() => { if (passive) complete(); go(firstUndone); }}>
                Finish skipped step {firstUndone + 1} <ChevronRight size={15} aria-hidden="true" />
              </Button>
            ) : (
              <Button variant="primary" onClick={complete} disabled={!passive}>
                {passive ? 'Finish lesson' : 'Complete this step to finish'}
              </Button>
            ))
          )}
        </div>

        {lessonDone && (
          <div className="mt-6 animate-rise rounded-xl border border-ok/40 bg-ok-soft p-4" role="status">
            <p className="font-semibold text-ink">Lesson complete.</p>
            <p className="mt-0.5 text-sm text-muted">Items you answered are now scheduled for spaced revision. Completion alone doesn't raise mastery — your graded answers do.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {nextLesson ? (
                <ButtonLink to={`/learn/${m.id}/${nextLesson.id}`} variant="primary">
                  Next lesson: {nextLesson.title}
                </ButtonLink>
              ) : (
                <ButtonLink to={`/learn/${m.id}`} variant="primary">
                  Back to module
                </ButtonLink>
              )}
              <ButtonLink to="/arena">Practise in the arena</ButtonLink>
            </div>
          </div>
        )}
      </article>
    </div>
  );
}

/** Marks a practice step done once the learner has made at least one graded attempt on the problem. */
function ProblemAttemptWatcher({ problemId, onAttempt }: { problemId: string; onAttempt: () => void }) {
  const count = useProgress((s) => s.attempts.filter((a) => a.itemType === 'problem' && a.itemId === problemId).length);
  useEffect(() => {
    if (count > 0) onAttempt();
  }, [count, onAttempt]);
  return null;
}

/** Keyed by lesson so moving to the next lesson starts fresh at its first unfinished step. */
export default function LessonPage() {
  const { lessonId = '' } = useParams();
  return <LessonView key={lessonId} />;
}
