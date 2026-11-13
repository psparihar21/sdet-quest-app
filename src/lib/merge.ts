import type { ProgressState } from '@/store/types';

const byId = <T extends { id: string }>(a: T[], b: T[], pick: (x: T, y: T) => T): T[] => {
  const out = new Map(a.map((x) => [x.id, x]));
  for (const y of b) {
    const x = out.get(y.id);
    out.set(y.id, x ? pick(x, y) : y);
  }
  return [...out.values()];
};

const byKey = <T>(a: Record<string, T>, b: Record<string, T>, pick: (x: T, y: T) => T): Record<string, T> => {
  const out: Record<string, T> = { ...a };
  for (const [k, y] of Object.entries(b)) out[k] = k in a ? pick(a[k], y) : y;
  return out;
};

/**
 * Combine the progress on this device with the copy from another device. Nothing answered on
 * either side is lost: graded attempts are a union, and everything else keeps the entry that
 * shows more work. `local` wins ties and keeps its own device settings (theme, motion).
 *
 * shortcut: deletions do not travel (a reset on one device is undone by the next sync),
 * add per-item tombstones if that matters.
 */
export function mergeStates(local: ProgressState, remote: ProgressState): ProgressState {
  return {
    ...local,
    createdAt: local.createdAt < remote.createdAt ? local.createdAt : remote.createdAt,
    // CV facts are imported per device; fall back to the other device's profile only if this one has none.
    profile: local.profile.importedAt || !remote.profile.importedAt ? local.profile : remote.profile,
    attempts: byId(local.attempts, remote.attempts, (x) => x).sort((x, y) => x.at.localeCompare(y.at)),
    // The card reviewed more often is the newer one; a reset after a miss counts as a review too.
    srs: byKey(local.srs, remote.srs, (x, y) => (y.reviews > x.reviews || (y.reviews === x.reviews && y.lapses > x.lapses) ? y : x)),
    weaknesses: byKey(local.weaknesses, remote.weaknesses, (x, y) => (y.mistakes + y.passes > x.mistakes + x.passes || (x.status === 'active' && y.status === 'resolved' && y.passes >= x.passes) ? y : x)),
    lessons: byKey(local.lessons, remote.lessons, (x, y) => {
      const completed = [x.completedAt, y.completedAt].filter((d): d is string => !!d).sort()[0];
      return { done: [...new Set([...x.done, ...y.done])].sort((p, q) => p - q), ...(completed ? { completedAt: completed } : {}) };
    }),
    interviews: byId(local.interviews, remote.interviews, (x, y) => (y.answers.length > x.answers.length || (!x.finishedAt && !!y.finishedAt) ? y : x)).sort((x, y) => x.startedAt.localeCompare(y.startedAt)),
    projectTasks: byKey(local.projectTasks, remote.projectTasks, (x, y) => (y.at > x.at ? y : x)),
    notes: byKey(local.notes, remote.notes, (x, y) => x || y),
    bookmarks: [...new Set([...local.bookmarks, ...remote.bookmarks])],
    stories: byId(local.stories, remote.stories, (x, y) => (y.updatedAt > x.updatedAt ? y : x)),
    drafts: byKey(local.drafts, remote.drafts, (x, y) => x || y),
  };
}
