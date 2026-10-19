import { ButtonLink, Empty } from '@/components/ui';
import { useDocumentTitle } from '@/lib/hooks';

export default function NotFound() {
  useDocumentTitle('Not found');
  return (
    <div className="py-10">
      <Empty title="That page doesn't exist" action={<ButtonLink to="/" variant="primary">Back to dashboard</ButtonLink>}>
        The link may be out of date, or the content was renamed.
      </Empty>
    </div>
  );
}
