import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getInterview } from '@/content';
import { INTERVIEW_MODES, type InterviewMode } from '@/content/types';
import { useProgress } from '@/store/progress';
import { MODE_INFO, pickQuestions } from '@/lib/arena';
import { useDocumentTitle } from '@/lib/hooks';
import { uid } from '@/lib/dates';
import { InterviewRunner } from '@/components/InterviewRunner';
import { Badge, Button, ButtonLink, Card, Empty, PageHeader } from '@/components/ui';
import NotFound from './NotFound';

export default function ArenaSession() {
  const { mode = '' } = useParams();
  const [params] = useSearchParams();
  const timed = params.get('timed') === '1';
  const valid = (INTERVIEW_MODES as readonly string[]).includes(mode);
  useDocumentTitle(valid ? MODE_INFO[mode as InterviewMode].title : 'Arena');
  if (!valid) return <NotFound />;
  return <Session key={`${mode}-${timed}`} mode={mode as InterviewMode} timed={timed} />;
}

function Session({ mode, timed }: { mode: InterviewMode; timed: boolean }) {
  const attempts = useProgress((s) => s.attempts);
  const startInterview = useProgress((s) => s.startInterview);
  const answerInterview = useProgress((s) => s.answerInterview);
  const finishInterview = useProgress((s) => s.finishInterview);
  const full = mode === 'full-sdet3' || mode === 'full-qa-lead';
  const [questionIds] = useState(() => pickQuestions(mode, attempts, full ? 6 : 4));
  // The session is only persisted once the first answer is submitted, so abandoned visits leave no empty records.
  const [sessionId] = useState(() => uid('iv'));
  const session = useProgress((s) => s.interviews.find((iv) => iv.id === sessionId));
  const [i, setI] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const info = MODE_INFO[mode];

  if (questionIds.length === 0) {
    return (
      <div>
        <PageHeader title={info.title} kicker="Interview Arena" />
        <Empty title="No questions for this mode yet" action={<ButtonLink to="/arena">Back to arena</ButtonLink>}>
          Questions for this round are added as their modules are written.
        </Empty>
      </div>
    );
  }

  const finished = i >= questionIds.length;
  const q = !finished ? getInterview(questionIds[i]) : undefined;

  if (finished) {
    const answers = session?.answers ?? [];
    const avg = (k: 'technical' | 'depth' | 'communication') => (answers.length ? answers.reduce((t, a) => t + a[k], 0) / answers.length : 0);
    return (
      <div className="space-y-5">
        <PageHeader title={`${info.title} — results`} kicker="Interview Arena" />
        <Card>
          <div className="grid grid-cols-3 gap-3">
            {(['technical', 'depth', 'communication'] as const).map((k) => (
              <div key={k} className="rounded-lg bg-surface-2 p-3">
                <p className="text-xs capitalize text-faint">{k}</p>
                <p className="text-2xl font-semibold tabular-nums text-ink">{avg(k).toFixed(1)}</p>
              </div>
            ))}
          </div>
          <ul className="mt-4 divide-y divide-line">
            {answers.map((a) => {
              const iq = getInterview(a.questionId);
              return (
                <li key={a.questionId} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
                  <span className="min-w-0 truncate text-ink">{iq?.prompt}</span>
                  <Badge tone={a.technical >= 7 ? 'ok' : a.technical >= 5 ? 'xp' : 'bad'}>{a.technical.toFixed(1)}</Badge>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-sm text-muted">
            {avg('technical') >= 7 ? 'Strong round. Next: a timed run or a harder mode.' : 'Questions under 6 are now in your weakness queue and revision schedule. Revisit the linked modules, then retry this round.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink to="/arena" variant="primary">
              Back to arena
            </ButtonLink>
            <ButtonLink to="/revision">Go to revision</ButtonLink>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <nav aria-label="Breadcrumb" className="text-xs text-faint">
        <Link to="/arena" className="hover:text-ink">
          Interview Arena
        </Link>{' '}
        / {info.title}
      </nav>
      <PageHeader title={info.title} kicker={`Question ${i + 1} of ${questionIds.length}${timed ? ' · timed (5 min guide)' : ''}`} />
      {q && (
        <InterviewRunner
          key={q.id}
          question={q}
          timed={timed}
          onSubmitted={(a) => {
            startInterview(mode, questionIds, timed, sessionId);
            answerInterview(sessionId, a);
            setSubmitted(true);
          }}
        />
      )}
      {submitted && (
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={() => {
              setSubmitted(false);
              if (i + 1 >= questionIds.length) finishInterview(sessionId);
              setI((x) => x + 1);
              window.scrollTo(0, 0);
            }}
          >
            {i + 1 >= questionIds.length ? 'See results' : 'Next question'} <ArrowRight size={15} aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}
