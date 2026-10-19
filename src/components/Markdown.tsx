import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cx } from './ui';

/**
 * Renders authored lesson markdown. Raw HTML is not enabled (no rehype-raw),
 * so markdown can never inject markup or scripts. Links open safely in a new tab.
 */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cx('prose-lesson', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children: c }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {c}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
