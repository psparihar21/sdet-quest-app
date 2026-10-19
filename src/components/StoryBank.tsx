import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useProgress } from '@/store/progress';
import type { StarStory } from '@/store/types';
import { uid } from '@/lib/dates';
import { Badge, Button, Empty, Notice } from './ui';

/** The behavioral prompts every candidate should have a real story for (from the original study plan). */
const STORY_PROMPTS = [
  'Tell me about yourself',
  'Tell me about your automation framework',
  'Biggest automation challenge',
  'Biggest production bug',
  'How did you reduce flaky tests?',
  'How do you decide what to automate?',
  'Developer disagrees with QA',
  'Release with critical defects',
  'Mentoring junior engineers',
  'Estimating testing',
  'Prioritising under deadlines',
  'Convincing management to invest in automation',
  'Tell me about a failure',
  'Tell me about a conflict',
  'A project you led',
];

const EMPTY = { title: '', situation: '', task: '', action: '', result: '', prompts: [] as string[] };

function Field({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span> <span className="text-xs text-faint">{hint}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value.slice(0, 3000))} rows={3} className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-[14px] text-ink" />
    </label>
  );
}

export function StoryBank() {
  const stories = useProgress((s) => s.stories);
  const saveStory = useProgress((s) => s.saveStory);
  const deleteStory = useProgress((s) => s.deleteStory);
  const [draft, setDraft] = useState<(typeof EMPTY & { id?: string }) | null>(null);
  const covered = new Set(stories.flatMap((s) => s.prompts));
  const set = (k: keyof typeof EMPTY) => (v: string) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  const missingNumbers = draft && !/\d/.test(draft.result);

  const save = () => {
    if (!draft || !draft.title.trim()) return;
    const story: Omit<StarStory, 'updatedAt'> = { id: draft.id ?? uid('story'), title: draft.title.trim(), situation: draft.situation, task: draft.task, action: draft.action, result: draft.result, prompts: draft.prompts };
    saveStory(story);
    setDraft(null);
  };

  return (
    <div className="space-y-4">
      <Notice tone="warn" title="Real stories only.">
        Write what actually happened. Where you don't remember a number, write <code>[need: …]</code> and go find it (old tickets, dashboards, release notes) rather than estimating. Interviewers probe numbers.
      </Notice>
      <div>
        <p className="text-xs font-semibold text-faint">
          Prompt coverage {covered.size}/{STORY_PROMPTS.length}
        </p>
        <ul className="mt-1 flex flex-wrap gap-1.5">
          {STORY_PROMPTS.map((p) => (
            <li key={p}>
              <Badge tone={covered.has(p) ? 'ok' : 'neutral'}>{p}</Badge>
            </li>
          ))}
        </ul>
      </div>

      {draft ? (
        <div className="space-y-3 rounded-xl border border-line bg-surface-2 p-4">
          <label className="block">
            <span className="text-sm font-medium text-ink">Story title</span>
            <input value={draft.title} onChange={(e) => set('title')(e.target.value.slice(0, 120))} className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" placeholder="e.g. Cutting leave regression time with API tests" />
          </label>
          <Field label="Situation" hint="Team, product, timeline, what was at stake" value={draft.situation} onChange={set('situation')} />
          <Field label="Task" hint="Your specific responsibility" value={draft.task} onChange={set('task')} />
          <Field label="Action" hint='What YOU did — use "I", not "we"' value={draft.action} onChange={set('action')} />
          <Field label="Result" hint="Measured outcome and what you learned" value={draft.result} onChange={set('result')} />
          {missingNumbers && draft.result.length > 20 && <p className="text-xs text-warn">The result has no numbers yet. Can you quantify it (time saved, defects, %, users)?</p>}
          <fieldset>
            <legend className="text-sm font-medium text-ink">Which questions does it answer?</legend>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {STORY_PROMPTS.map((p) => {
                const on = draft.prompts.includes(p);
                return (
                  <button key={p} type="button" aria-pressed={on} onClick={() => setDraft((d) => (d ? { ...d, prompts: on ? d.prompts.filter((x) => x !== p) : [...d.prompts, p] } : d))} className={`rounded-md border px-2 py-0.5 text-xs ${on ? 'border-accent bg-accent-soft text-accent-strong' : 'border-line text-muted hover:text-ink'}`}>
                    {p}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="flex gap-2">
            <Button variant="primary" onClick={save} disabled={!draft.title.trim()}>
              Save story
            </Button>
            <Button variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setDraft({ ...EMPTY })}>
          <Plus size={14} aria-hidden="true" /> New STAR story
        </Button>
      )}

      {stories.length === 0 && !draft ? (
        <Empty title="No stories yet">Aim for 6–8 stories that together cover all 15 prompts. One strong story can answer several.</Empty>
      ) : (
        <ul className="space-y-2">
          {stories.map((s) => (
            <li key={s.id} className="rounded-lg border border-line p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{s.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">{s.result || s.action || s.situation}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {s.prompts.map((p) => (
                      <Badge key={p}>{p}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button size="sm" variant="ghost" aria-label={`Edit ${s.title}`} onClick={() => setDraft({ ...s })}>
                    <Pencil size={14} aria-hidden="true" />
                  </Button>
                  <Button size="sm" variant="ghost" aria-label={`Delete ${s.title}`} onClick={() => window.confirm(`Delete "${s.title}"?`) && deleteStory(s.id)}>
                    <Trash2 size={14} aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
