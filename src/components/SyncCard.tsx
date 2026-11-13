import { useEffect, useState, type FormEvent } from 'react';
import { RefreshCw } from 'lucide-react';
import { sendLink, signOut, syncConfigured, syncNow, useSync } from '@/store/sync';
import { Button, Card, Notice, SectionTitle } from './ui';

const input = 'h-10 w-full rounded-lg border border-line bg-surface-2 px-3 text-sm text-ink';

/** Settings section for syncing progress between devices. Signing in uses a one-time link sent by email. */
export function SyncCard() {
  const { email: account, busy, lastSynced, error } = useSync();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [working, setWorking] = useState(false);
  const [problem, setProblem] = useState<string>();

  // Show the signed-in state as soon as Settings opens, not only after the next automatic sync.
  useEffect(() => void syncNow(), []);

  const run = async (e: FormEvent, action: () => Promise<void>) => {
    e.preventDefault();
    setWorking(true);
    setProblem(undefined);
    try {
      await action();
    } catch (err) {
      setProblem(err instanceof Error ? err.message : String(err));
    } finally {
      setWorking(false);
    }
  };

  return (
    <Card aria-labelledby="sync">
      <SectionTitle id="sync">Sync between devices</SectionTitle>
      {!syncConfigured ? (
        <p className="text-sm text-muted">Sync is not set up in this build. Progress stays on this device; use the backup below to move it.</p>
      ) : account ? (
        <div className="space-y-3">
          <p className="text-sm text-ink">
            Signed in as <span className="font-medium">{account}</span>. Progress on this device is merged with your other devices; nothing answered on either is lost.
          </p>
          <p className="text-xs text-muted" role="status">
            {busy ? 'Syncing…' : lastSynced ? `Last synced ${new Date(lastSynced).toLocaleTimeString()}` : 'Not synced yet'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void syncNow()} disabled={busy}>
              <RefreshCw size={14} aria-hidden="true" /> Sync now
            </Button>
            <Button variant="ghost" onClick={() => void signOut()}>
              Sign out on this device
            </Button>
          </div>
        </div>
      ) : !sent ? (
        <form className="space-y-3" onSubmit={(e) => run(e, async () => (await sendLink(email.trim()), setSent(true)))}>
          <p className="text-sm text-muted">Sign in with the same email on your phone and laptop. You get a one-time sign-in link by email; there is no password.</p>
          <div>
            <label htmlFor="sync-email" className="text-sm font-medium text-ink">
              Email
            </label>
            <input id="sync-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${input} mt-1 max-w-sm`} />
          </div>
          <Button variant="primary" type="submit" disabled={working}>
            {working ? 'Sending…' : 'Email me a sign-in link'}
          </Button>
        </form>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-ink" role="status">
            A sign-in link was sent to <span className="font-medium">{email}</span>. Open it <strong>on this device</strong>; it brings you back here signed in.
          </p>
          <p className="text-xs text-muted">It can take a minute; check spam too. The link works once and expires after an hour. Only a couple of emails can be sent per hour.</p>
          <Button variant="ghost" onClick={() => setSent(false)}>
            Use another email
          </Button>
        </div>
      )}
      {(problem ?? error) && (
        <div className="mt-3">
          <Notice tone="warn" title="Sync problem">
            {problem ?? error}
          </Notice>
        </div>
      )}
    </Card>
  );
}
