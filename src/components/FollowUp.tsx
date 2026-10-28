import { MessageCircleQuestion } from 'lucide-react';
import { FOLLOW_UP_ANSWERS } from '@/content/followUpAnswers';

/** An interviewer follow-up question, with its model answer hidden until the learner has thought about it. */
export function FollowUp({ id, question }: { id: string; question: string }) {
  const answer = FOLLOW_UP_ANSWERS[id];
  return (
    <div className="rounded-lg border border-line bg-surface px-3.5 py-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        <MessageCircleQuestion size={14} aria-hidden="true" /> Interviewer follow-up
      </p>
      <p className="mt-1 text-[14px] font-medium text-ink">“{question}”</p>
      {answer && (
        <details className="group mt-2">
          <summary className="cursor-pointer text-[13px] font-medium text-accent-strong hover:underline">
            <span className="group-open:hidden">Think it through, then show a strong answer</span>
            <span className="hidden group-open:inline">Hide answer</span>
          </summary>
          <p className="mt-2 border-l-2 border-accent pl-3 text-[13.5px] leading-relaxed text-ink">{answer}</p>
        </details>
      )}
    </div>
  );
}
