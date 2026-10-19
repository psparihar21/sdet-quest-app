import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronDown, Circle } from 'lucide-react';
import { PROJECT, PROJECT_TASKS, type ProjectTask } from '@/content/projects';
import { getModule } from '@/content';
import { useProgress } from '@/store/progress';
import { useDocumentTitle } from '@/lib/hooks';
import { Markdown } from '@/components/Markdown';
import { Badge, Card, Notice, PageHeader, ProgressBar, SectionTitle, cx } from '@/components/ui';

function TaskRow({ task }: { task: ProjectTask }) {
  const state = useProgress((s) => s.projectTasks[task.id]);
  const setTask = useProgress((s) => s.setProjectTask);
  const [open, setOpen] = useState(false);
  const done = !!state?.done;
  return (
    <li className="rounded-lg border border-line">
      <div className="flex items-start gap-3 p-3">
        <button type="button" onClick={() => setTask(task.id, !done)} aria-pressed={done} aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`} className="mt-0.5">
          {done ? <CheckCircle2 size={19} className="text-ok" /> : <Circle size={19} className="text-faint hover:text-ink" />}
        </button>
        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <p className={cx('text-sm font-medium', done ? 'text-muted line-through' : 'text-ink')}>{task.title}</p>
          <p className="text-xs text-muted">{task.brief}</p>
        </button>
        <ChevronDown size={16} className={cx('mt-1 shrink-0 text-faint transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </div>
      {open && (
        <div className="space-y-3 border-t border-line px-4 py-3 text-[13.5px]">
          <div className="flex flex-wrap gap-1.5">
            {task.modules.map((id) => {
              const m = getModule(id);
              return m ? (
                <Link key={id} to={`/learn/${id}`} className="rounded-md border border-line px-2 py-0.5 text-xs text-accent-strong hover:border-accent">
                  M{m.number} {m.title}
                </Link>
              ) : null;
            })}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-faint">Deliverables</p>
            <ul className="mt-1 list-disc pl-5 text-ink">{task.deliverables.map((d) => <li key={d}>{d}</li>)}</ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-faint">Acceptance criteria</p>
            <ul className="mt-1 list-disc pl-5 text-ink">{task.acceptance.map((d) => <li key={d}>{d}</li>)}</ul>
          </div>
          <p className="rounded-lg bg-surface-2 px-3 py-2 text-ink">
            <span className="font-semibold">Review checkpoint: </span>
            {task.review}
          </p>
          <label className="block">
            <span className="text-xs font-semibold text-faint">Notes, links to your repo, measured results</span>
            <textarea value={state?.notes ?? ''} onChange={(e) => setTask(task.id, done, e.target.value.slice(0, 10000))} rows={3} className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink" />
          </label>
        </div>
      )}
    </li>
  );
}

export default function Projects() {
  useDocumentTitle('Projects');
  const tasks = useProgress((s) => s.projectTasks);
  const done = PROJECT_TASKS.filter((t) => tasks[t.id]?.done).length;
  return (
    <div className="space-y-5">
      <PageHeader title={`Capstone: ${PROJECT.name}`} kicker={PROJECT.tagline}>
        <Badge tone={done === PROJECT_TASKS.length ? 'ok' : 'neutral'}>
          {done}/{PROJECT_TASKS.length} tasks
        </Badge>
      </PageHeader>
      <ProgressBar value={(done / PROJECT_TASKS.length) * 100} label="Capstone progress" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card aria-labelledby="arch-title">
          <SectionTitle id="arch-title">System under test</SectionTitle>
          <Markdown className="!max-w-none text-[14px]">{PROJECT.architecture}</Markdown>
        </Card>
        <Card aria-labelledby="opt-title">
          <SectionTitle id="opt-title">How to build it</SectionTitle>
          <Markdown className="!max-w-none text-[14px]">{PROJECT.buildOptions}</Markdown>
        </Card>
      </div>
      <Notice>Tasks are checked off by you. Treat each review checkpoint as the question a senior engineering manager would ask — then practise answering it in the Interview Arena.</Notice>
      {PROJECT.phases.map((p) => (
        <Card key={p.id} aria-labelledby={`${p.id}-t`}>
          <SectionTitle id={`${p.id}-t`}>{p.title}</SectionTitle>
          <p className="-mt-2 mb-3 text-[13px] text-muted">{p.goal}</p>
          <ul className="space-y-2">
            {p.tasks.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </ul>
        </Card>
      ))}
      <Card aria-labelledby="score-title">
        <SectionTitle id="score-title">How a reviewer will weigh it</SectionTitle>
        <ul className="grid gap-2 sm:grid-cols-2">
          {PROJECT.scoring.map(([k, w]) => (
            <li key={k} className="flex justify-between rounded-lg bg-surface-2 px-3 py-2 text-[13px]">
              <span className="text-ink">{k}</span>
              <span className="tabular-nums text-muted">{w}%</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
