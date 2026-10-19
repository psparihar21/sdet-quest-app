import type { StateStorage } from 'zustand/middleware';

/**
 * Persistence boundary. The app only talks to this interface, so the local-first
 * implementation below can later be swapped for a backend (e.g. a REST API or Supabase)
 * without touching components. Browser storage stays on this device: there is no sync.
 */
export interface ProgressRepository extends StateStorage {
  readonly kind: 'local' | 'remote';
}

export const STORAGE_KEY = 'sdet-quest:v1';

function safeLocalStorage(): Storage | null {
  try {
    const ls = window.localStorage;
    const probe = '__sq_probe__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    return null;
  }
}

const memory = new Map<string, string>();

export const localRepository: ProgressRepository = {
  kind: 'local',
  getItem: (name) => {
    const ls = safeLocalStorage();
    return ls ? ls.getItem(name) : (memory.get(name) ?? null);
  },
  setItem: (name, value) => {
    const ls = safeLocalStorage();
    if (ls) {
      try {
        ls.setItem(name, value);
        return;
      } catch {
        // Quota exceeded: keep working in memory for this session.
      }
    }
    memory.set(name, value);
  },
  removeItem: (name) => {
    safeLocalStorage()?.removeItem(name);
    memory.delete(name);
  },
};

/** True when progress cannot be persisted (private mode, blocked storage). Surfaced in the UI. */
export function storageUnavailable(): boolean {
  return safeLocalStorage() === null;
}
