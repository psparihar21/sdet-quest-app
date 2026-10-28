import { useRef, useState } from 'react';
import { Download, Trash2, Upload } from 'lucide-react';
import { exportState, parseBackup, useProgress } from '@/store/progress';
import { profilePackSchema } from '@/store/profilePack';
import { useDocumentTitle } from '@/lib/hooks';
import { Button, Card, Notice, PageHeader, SectionTitle, cx } from '@/components/ui';

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function readFile(file: File): Promise<string> {
  if (file.size > 5_000_000) throw new Error('File is larger than 5 MB.');
  return file.text();
}

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-ink">{label}</legend>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {options.map(([v, t]) => (
          <label key={v} className={cx('cursor-pointer rounded-lg border px-3 py-1.5 text-[13px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)] has-[:focus-visible]:outline', value === v ? 'border-accent bg-accent-soft text-accent-strong' : 'border-line text-muted hover:text-ink')}>
            <input type="radio" className="sr-only" name={label} checked={value === v} onChange={() => onChange(v)} />
            {t}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function SettingsPage() {
  useDocumentTitle('Settings');
  const settings = useProgress((s) => s.settings);
  const profile = useProgress((s) => s.profile);
  const updateSettings = useProgress((s) => s.updateSettings);
  const importProfilePack = useProgress((s) => s.importProfilePack);
  const replaceState = useProgress((s) => s.replaceState);
  const reset = useProgress((s) => s.reset);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'warn'; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState('');
  const packRef = useRef<HTMLInputElement>(null);
  const backupRef = useRef<HTMLInputElement>(null);

  const onPack = async (file?: File) => {
    if (!file) return;
    try {
      const pack = profilePackSchema.parse(JSON.parse(await readFile(file)));
      importProfilePack(pack);
      setMsg({ tone: 'ok', text: `Profile pack imported: ${pack.diagnostics.length} diagnostic scores and ${pack.selfRatings.length} self-ratings added to your weakness queue and revision schedule.` });
    } catch (e) {
      setMsg({ tone: 'warn', text: `That file isn't a valid profile pack: ${(e as Error).message.slice(0, 200)}` });
    } finally {
      if (packRef.current) packRef.current.value = '';
    }
  };

  const onBackup = async (file?: File) => {
    if (!file) return;
    try {
      const state = parseBackup(await readFile(file));
      replaceState(state);
      setMsg({ tone: 'ok', text: `Backup restored (${state.attempts.length} attempts).` });
    } catch (e) {
      setMsg({ tone: 'warn', text: `Could not restore: ${(e as Error).message.slice(0, 200)}` });
    } finally {
      if (backupRef.current) backupRef.current.value = '';
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" />
      {msg && (
        <div role="status">
          <Notice tone={msg.tone}>{msg.text}</Notice>
        </div>
      )}

      <Card aria-labelledby="profile" className="scroll-mt-6">
        <SectionTitle id="profile">Profile</SectionTitle>
        {profile.importedAt ? (
          <div className="text-sm text-ink">
            <p className="font-medium">{profile.name}</p>
            <p className="text-muted">{profile.headline}</p>
            <p className="mt-1 text-xs text-faint">
              Imported {new Date(profile.importedAt).toLocaleString()} · primary language {profile.primaryLanguage} · targets {profile.targetRoles.join(', ')}
            </p>
            {profile.cvFacts.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-[13px] text-muted">{profile.cvFacts.length} facts used for behavioral prompts</summary>
                <ul className="mt-1 list-disc pl-5 text-[13px]">
                  {profile.cvFacts.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted">No profile imported. The app works without one; a profile pack personalises behavioral prompts and seeds your weakness queue with baseline diagnostic scores.</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <input ref={packRef} type="file" accept="application/json,.json" className="sr-only" id="pack-file" onChange={(e) => onPack(e.target.files?.[0])} />
          <Button onClick={() => packRef.current?.click()}>
            <Upload size={14} aria-hidden="true" /> Import profile pack (.json)
          </Button>
        </div>
        <p className="mt-2 text-xs text-faint">The pack stays in this browser only. It is never uploaded, and the public build of SDET Quest contains no personal data. See README → “Profile pack”.</p>
      </Card>

      <Card aria-labelledby="appearance">
        <SectionTitle id="appearance">Appearance and accessibility</SectionTitle>
        <div className="space-y-4">
          <Choice label="Theme" value={settings.theme} options={[['dark', 'Dark'], ['light', 'Light']]} onChange={(theme) => updateSettings({ theme })} />
          <Choice label="Motion" value={settings.motion} options={[['system', 'Follow system'], ['reduce', 'Reduce motion'], ['full', 'Full motion']]} onChange={(motion) => updateSettings({ motion })} />
          <Choice label="YouTube videos" value={settings.loadVideos} options={[['ask', 'Load on click (privacy)'], ['always', 'Load automatically']]} onChange={(loadVideos) => updateSettings({ loadVideos })} />
        </div>
      </Card>

      <Card aria-labelledby="learning">
        <SectionTitle id="learning">Learning preferences</SectionTitle>
        <label className="text-sm text-ink">
          Daily goal (graded items)
          <input type="number" min={1} max={100} value={settings.dailyGoal} onChange={(e) => updateSettings({ dailyGoal: Math.max(1, Math.min(100, Number(e.target.value) || 1)) })} className="ml-3 h-9 w-20 rounded-lg border border-line bg-surface-2 px-2 text-ink" />
        </label>
        <p className="mt-1 text-xs text-faint">A target, not a streak to protect. Missing a day has no penalty.</p>
      </Card>

      <Card aria-labelledby="data">
        <SectionTitle id="data">Your data</SectionTitle>
        <p className="text-sm text-muted">Progress is stored in this browser's local storage on this device. It does not sync between devices or browsers. Export a backup regularly.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => download(`sdet-quest-backup-${new Date().toISOString().slice(0, 10)}.json`, exportState())}>
            <Download size={14} aria-hidden="true" /> Export backup
          </Button>
          <input ref={backupRef} type="file" accept="application/json,.json" className="sr-only" id="backup-file" onChange={(e) => onBackup(e.target.files?.[0])} />
          <Button onClick={() => backupRef.current?.click()}>
            <Upload size={14} aria-hidden="true" /> Restore backup
          </Button>
        </div>
        <div className="mt-5 rounded-lg border border-bad/30 p-3">
          <p className="text-sm font-medium text-ink">Reset all progress</p>
          <p className="text-xs text-muted">Deletes attempts, revision schedule, notes, stories and settings on this device. Export first if you might want them back.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label htmlFor="confirm-reset" className="text-xs text-muted">
              Type RESET to confirm
            </label>
            <input id="confirm-reset" value={confirmReset} onChange={(e) => setConfirmReset(e.target.value)} className="h-8 w-28 rounded-lg border border-line bg-surface-2 px-2 text-sm text-ink" />
            <Button
              variant="danger"
              size="sm"
              disabled={confirmReset !== 'RESET'}
              onClick={() => {
                reset();
                setConfirmReset('');
                setMsg({ tone: 'ok', text: 'All progress was reset.' });
              }}
            >
              <Trash2 size={14} aria-hidden="true" /> Reset
            </Button>
          </div>
        </div>
      </Card>

      <Card aria-labelledby="about">
        <SectionTitle id="about">About this build</SectionTitle>
        <ul className="list-disc space-y-1 pl-5 text-[13px] text-muted">
          <li>No account, no server, no analytics, no AI API calls. Everything runs in your browser.</li>
          <li>Interview answers are scored with a deterministic rubric — not AI. The app says so wherever scores appear.</li>
          <li>JS/TS and SQL exercises execute locally; Java exercises are self-reviewed.</li>
          <li>Third-party YouTube videos load only when you choose to.</li>
        </ul>
      </Card>
    </div>
  );
}
