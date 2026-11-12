import { useState } from 'react';
import { RotateCw } from 'lucide-react';
import { getFlashcard } from '@/content';
import { SKILL_LABELS } from '@/content/types';
import { useProgress } from '@/store/progress';
import { Button } from './ui';

export function Flashcard({ id, onDone }: { id: string; onDone?: () => void }) {
  const card = getFlashcard(id);
  const recordAttempt = useProgress((s) => s.recordAttempt);
  const [flipped, setFlipped] = useState(false);
  const [graded, setGraded] = useState(false);
  if (!card) return null;
  const grade = (score: number) => {
    recordAttempt({ itemId: id, itemType: 'flashcard', skill: card.skill, moduleId: card.moduleId, score, topic: card.front, detail: { selfGraded: true } });
    setGraded(true);
    onDone?.();
  };
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <p className="text-xs text-faint">Flashcard · {SKILL_LABELS[card.skill]} · recall first, then reveal</p>
      <p className="mt-2 text-[16px] font-medium text-ink">{card.front}</p>
      {flipped ? (
        <div className="mt-3 animate-rise rounded-lg bg-surface-2 p-3 text-[14.5px] text-ink">{card.back}</div>
      ) : (
        <Button className="mt-3" onClick={() => setFlipped(true)}>
          <RotateCw size={14} aria-hidden="true" /> Reveal answer
        </Button>
      )}
      {flipped && !graded && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">How well did you recall it?</span>
          <Button size="sm" variant="danger" onClick={() => grade(0.2)}>
            Didn't know
          </Button>
          <Button size="sm" onClick={() => grade(0.6)}>
            Partly
          </Button>
          <Button size="sm" variant="primary" onClick={() => grade(1)}>
            Knew it
          </Button>
        </div>
      )}
      {graded && <p className="mt-3 text-xs text-ok">Scheduled. Flashcards are self-graded and count lightly toward mastery.</p>}
    </div>
  );
}
