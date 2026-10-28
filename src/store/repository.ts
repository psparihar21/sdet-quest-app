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
let quotaExceeded = false;

/** True once a save failed because browser storage is full. */
export const storageFull = () => quotaExceeded;

export const localRepository: ProgressRepository = {
  kind: 'local',
  getItem: (name) => {
    // After a quota failure the newest data only lives in memory; prefer it over the stale stored copy.
    return memory.get(name) ?? safeLocalStorage()?.getItem(name) ?? null;
  },
  setItem: (name, value) => {
    const ls = safeLocalStorage();
    if (ls) {
      try {
        ls.setItem(name, value);
        memory.delete(name);
        return;
      } catch {
        // Quota exceeded: keep working in memory for this session and tell the UI.
        quotaExceeded = true;
        window.dispatchEvent(new Event('sdet-quest:storage-full'));
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
