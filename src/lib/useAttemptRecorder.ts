import type { Problem } from '@/content/types';
import { useProgress } from '@/store/progress';

/** Records a problem attempt with the scoring rules shared by the full workspace and the phone feed. */
export function useAttemptRecorder(problem: Problem) {
  const recordAttempt = useProgress((s) => s.recordAttempt);
  return (pass: boolean, fraction: number, revealedEarly: boolean, detail: Record<string, unknown>) => {
    // Anything short of all tests passing stays below the 0.7 "correct" line.
    const raw = pass ? 1 : Math.min(fraction, 0.69);
    recordAttempt({
      itemId: problem.id,
      itemType: 'problem',
      skill: problem.skill,
      moduleId: problem.moduleId,
      score: revealedEarly ? Math.min(raw, 0.5) : raw,
      topic: problem.title,
      detail: { ...detail, revealedEarly },
    });
  };
}
