import { useState } from 'react';
import { findLesson } from '@/content';
import type { Section } from '@/content/types';
import { useProgress } from '@/store/progress';
import { Markdown } from './Markdown';
import { Button } from './ui';

/** A build task: the learner drafts their work, then self-reviews it against the acceptance criteria. */
export function BuildTask({ section, lessonId, index, onDone }: { section: Extract<Section, { kind: 'build' }>; lessonId: string; index: number; onDone: () => void }) {
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
