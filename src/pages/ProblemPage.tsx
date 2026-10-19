import { Link, useParams } from 'react-router-dom';
import { getModule, getProblem } from '@/content';
import { SKILL_LABELS } from '@/content/types';
import { useDocumentTitle } from '@/lib/hooks';
import { ProblemWorkspace } from '@/components/ProblemWorkspace';
import { Badge, PageHeader } from '@/components/ui';
import NotFound from './NotFound';

export default function ProblemPage() {
  const { problemId = '' } = useParams();
  const p = getProblem(problemId);
  useDocumentTitle(p?.title ?? 'Problem');
  if (!p) return <NotFound />;
  const m = getModule(p.moduleId);
  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-2 text-xs text-faint">
        <Link to="/lab" className="hover:text-ink">
          Coding Lab
        </Link>{' '}
        / {p.title}
      </nav>
      <PageHeader title={p.title} kicker={`Module ${m?.number} · ${SKILL_LABELS[p.skill]}`}>
        <Badge>Difficulty {p.difficulty}/5</Badge>
        <Badge tone="accent">{p.kind.toUpperCase()}</Badge>
      </PageHeader>
      <ProblemWorkspace problem={p} />
    </div>
  );
}
