import { useState } from 'react';
import { ExternalLink, PlayCircle } from 'lucide-react';
import type { Video } from '@/content/types';
import { useProgress } from '@/store/progress';
import { Badge } from './ui';

/**
 * Privacy-friendly YouTube embed: nothing loads from YouTube until the learner clicks
 * (or opts in to auto-load in Settings). Uses youtube-nocookie.com and always offers a direct link.
 */
export function VideoEmbed({ video }: { video: Video }) {
  const always = useProgress((s) => s.settings.loadVideos === 'always');
  const [loaded, setLoaded] = useState(false);
  const show = loaded || always;
  return (
    <figure className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="relative aspect-video w-full bg-code">
        {show ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}`}
            title={video.title}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setLoaded(true)}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-muted hover:text-ink"
            aria-label={`Load YouTube video: ${video.title}`}
          >
            <PlayCircle size={44} className="text-accent" aria-hidden="true" />
            <span className="text-sm font-medium text-ink">Load video from YouTube</span>
            <span className="max-w-sm text-xs">Nothing is requested from YouTube until you click. Third-party privacy policy applies.</span>
          </button>
        )}
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink" title={video.title}>
            {video.title}
          </p>
          <p className="text-xs text-muted">
            {video.channel} · {video.why}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>Third-party video</Badge>
          <a href={video.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent-strong hover:underline">
            Open on YouTube <ExternalLink size={12} aria-hidden="true" />
          </a>
        </div>
      </figcaption>
    </figure>
  );
}
