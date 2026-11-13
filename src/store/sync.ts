import type { SupabaseClient } from '@supabase/supabase-js';
import { create } from 'zustand';
import { mergeStates } from '@/lib/merge';
import { exportState, parseBackup, useProgress } from './progress';
import type { ProgressState } from './types';

/**
 * Optional sync of progress between devices through the learner's own Supabase project.
 * Off unless the build was given a project URL and public key, and nothing is loaded or
 * sent until the learner signs in. Row-level security in the database limits each
 * account to its own row; the key in the build is the public one.
 */
const URL: string | undefined = import.meta.env.VITE_SUPABASE_URL;
const KEY: string | undefined = import.meta.env.VITE_SUPABASE_ANON_KEY;
/** Only a real Supabase project address is accepted, so a bad build setting cannot point sync at another host. */
export const syncConfigured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(URL ?? '') && !!KEY;

const AUTH_KEY = 'sdet-quest:auth';
const TABLE = 'progress';
const PUSH_DELAY_MS = 4000;

export interface SyncStatus {
  email?: string;
  busy: boolean;
  lastSynced?: string;
  error?: string;
}
export const useSync = create<SyncStatus>(() => ({ busy: false }));

let client: Promise<SupabaseClient> | undefined;
// The client library is fetched only when sync is actually used.
const supabase = () =>
  (client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(URL!, KEY!, { auth: { storageKey: AUTH_KEY, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }),
  ));

const localState = (): ProgressState => JSON.parse(exportState()).state;
/** Progress without the per-device parts, to tell whether there is anything new to upload. */
const core = ({ settings: _s, profile: _p, ...rest }: ProgressState) => JSON.stringify(rest);
const message = (e: unknown) => (!navigator.onLine ? 'Offline. Sync resumes when you are back online.' : e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e));

let running = false;
let again = false;
let lastCore: string | undefined;

/** Pull the other devices' progress, merge it into this device, and upload the result if it has anything new. */
export async function syncNow(): Promise<void> {
  if (!syncConfigured) return;
  if (running) {
    again = true;
    return;
  }
  running = true;
  useSync.setState({ busy: true });
  try {
    const sb = await supabase();
    const { data: auth } = await sb.auth.getSession();
    const user = auth.session?.user;
    if (!user) {
      useSync.setState({ email: undefined, busy: false });
      return;
    }
    const { data, error } = await sb.from(TABLE).select('state').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    const local = localState();
    // The downloaded copy crosses a trust boundary: it gets the same validation as an imported backup.
    const merged = data?.state ? mergeStates(local, parseBackup(JSON.stringify({ app: 'sdet-quest', state: data.state }))) : local;
    if (JSON.stringify(merged) !== JSON.stringify(local)) useProgress.getState().replaceState(merged);
    if (core(merged) !== lastCore) {
      const { error: pushError } = await sb.from(TABLE).upsert({ user_id: user.id, state: merged, updated_at: new Date().toISOString() });
      if (pushError) throw pushError;
      lastCore = core(merged);
    }
    useSync.setState({ email: user.email, lastSynced: new Date().toISOString(), error: undefined });
  } catch (e) {
    useSync.setState({ error: message(e) });
  } finally {
    running = false;
    useSync.setState({ busy: false });
    if (again) {
      again = false;
      void syncNow();
    }
  }
}

/** Email a one-time sign-in code. No password is ever created or stored. */
export async function sendCode(email: string): Promise<void> {
  const sb = await supabase();
  const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) throw new Error(message(error));
}

export async function verifyCode(email: string, code: string): Promise<void> {
  const sb = await supabase();
  const { error } = await sb.auth.verifyOtp({ email, token: code, type: 'email' });
  if (error) throw new Error(message(error));
  await syncNow();
}

/** Stops syncing on this device. Progress stays on the device and in the cloud copy. */
export async function signOut(): Promise<void> {
  const sb = await supabase();
  await sb.auth.signOut({ scope: 'local' });
  lastCore = undefined;
  useSync.setState({ email: undefined, lastSynced: undefined, error: undefined });
}

/** Called once at startup: syncs on open, when the app comes back to the front, when it comes online, and a few seconds after any change. */
export function startSync(): void {
  if (!syncConfigured) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const signedIn = () => {
    try {
      return !!localStorage.getItem(AUTH_KEY);
    } catch {
      return false;
    }
  };
  const soon = (ms: number) => {
    // Without a saved session there is nothing to sync, and the client library is never downloaded.
    if (!signedIn()) return;
    clearTimeout(timer);
    timer = setTimeout(() => void syncNow(), ms);
  };
  soon(0);
  useProgress.subscribe(() => soon(PUSH_DELAY_MS));
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && soon(0));
  window.addEventListener('online', () => soon(0));
}
