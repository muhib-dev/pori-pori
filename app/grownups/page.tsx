'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, PROFILE_ID, updateProfile, resetAll, getOrCreateProfile } from '@/lib/db';
import { Star } from 'lucide-react';
import { LEVELS, currentStepId } from '@/lib/content/syllabus';
import { TopBar } from '@/components/ui';
import { pushPending, SYNC_URL } from '@/lib/sync';

const AVATARS = ['🦊', '🐰', '🐼', '🦄', '🐸', '🐱', '🦋', '🐧'];

export default function Grownups() {
  // Simple gate: a sum a 6-year-old won't solve quickly
  const [a, b] = useMemo(() => [5 + Math.floor(Math.random() * 5), 6 + Math.floor(Math.random() * 4)], []);
  const [answer, setAnswer] = useState('');
  const unlocked = Number(answer) === a + b;

  const profile = useLiveQuery(() => db.profiles.get(PROFILE_ID));
  const progress = useLiveQuery(() => db.progress.toArray()) ?? [];
  const attempts = useLiveQuery(() => db.attempts.orderBy('at').reverse().limit(30).toArray()) ?? [];
  const pending = useLiveQuery(() => db.outbox.where('synced').equals(0).count()) ?? 0;
  useEffect(() => { getOrCreateProfile(); }, []);

  if (!unlocked) {
    return (
      <div className="flex flex-col gap-6">
        <TopBar backHref="/"><span className="text-3xl font-semibold">Grown-ups</span></TopBar>
        <div className="bg-paper border-4 border-ink rounded-3xl shadow-tile p-6 flex flex-col gap-4 items-center">
          <p className="text-2xl">What is {a} + {b}?</p>
          <input inputMode="numeric" value={answer} onChange={(e) => setAnswer(e.target.value)} autoFocus
            className="text-4xl text-center w-32 border-4 border-ink rounded-2xl p-2" aria-label="Answer" />
        </div>
      </div>
    );
  }
  if (!profile) return null;

  const minutes = Math.round(attempts.reduce((s, x) => s + x.durationMs, 0) / 60000);
  const weakSpots = Object.entries(attempts.flatMap((x) => x.misses).reduce<Record<string, number>>((m, w) => ((m[w] = (m[w] ?? 0) + 1), m), {}))
    .sort((x, y) => y[1] - x[1]).slice(0, 8);

  return (
    <div className="flex flex-col gap-6 text-lg">
      <TopBar backHref="/"><span className="text-3xl font-semibold">Grown-ups</span></TopBar>

      <section className="bg-paper border-4 border-ink rounded-3xl shadow-tile p-5 flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">Child</h2>
        <label className="flex flex-col gap-1">Name
          <input value={profile.name} onChange={(e) => updateProfile({ name: e.target.value })} className="border-4 border-ink rounded-2xl p-2 text-2xl" />
        </label>
        <div className="flex gap-2 flex-wrap">
          {AVATARS.map((av) => (
            <button key={av} type="button" onClick={() => updateProfile({ avatar: av })}
              className={`text-4xl w-16 h-16 rounded-2xl border-4 ${profile.avatar === av ? 'border-ink bg-sun' : 'border-transparent'}`}>{av}</button>
          ))}
        </div>
        <p className="flex items-center justify-between">Current step <strong>{currentStepId(progress, profile.startStep)}. {LEVELS.find((l) => l.id === currentStepId(progress, profile.startStep))?.name}</strong></p>
        <p className="text-ink/70">The child opens the next step by finishing every lesson in the current one (1 star is enough). Earlier steps stay open to replay.</p>
        <div className="flex flex-col gap-2">
          <span>Reading mode</span>
          <div className="flex gap-2">
            {([['listen', '🎧 Listen', 'Reads each question aloud, fewer choices'], ['read', '📖 Read', 'Child reads first, taps the speaker for help']] as const).map(([m, label, hint]) => (
              <button key={m} type="button" title={hint} onClick={() => updateProfile({ readerMode: m })}
                className={`flex-1 rounded-2xl border-4 p-2 text-xl ${(profile.readerMode ?? 'listen') === m ? 'border-ink bg-sun' : 'border-ink/20'}`}>{label}</button>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-1">Start at step
          <select value={profile.startStep ?? 1} onChange={(e) => updateProfile({ startStep: Number(e.target.value) })} className="border-4 border-ink rounded-2xl p-2 text-xl bg-paper">
            {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.id}. {l.name}</option>)}
          </select>
          <span className="text-ink/70 text-base">Steps before this one count as done and stay open to replay.</span>
        </label>
        <Link href="/placement/" className="underline text-xl">Run the “Show me!” quiz again</Link>
      </section>

      <section className="bg-paper border-4 border-ink rounded-3xl shadow-tile p-5 flex flex-col gap-3">
        <h2 className="text-2xl font-semibold">Progress</h2>
        <p>{attempts.length} games played recently · about {minutes} min</p>
        {LEVELS.map((lv) => (
          <details key={lv.id} className="border-t-2 border-ink/10 pt-2">
            <summary className="cursor-pointer text-xl">{lv.emoji} Step {lv.id}: {lv.name} <span className="text-ink/60">— {lv.goal}</span></summary>
            <ul className="pl-2 pt-2 flex flex-col gap-1">
              {lv.lessons.map((l) => {
                const p = progress.find((x) => x.lessonId === l.id);
                return <li key={l.id} className="flex justify-between"><span>{l.title}</span><span>{p?.bestStars ? Array.from({ length: p.bestStars }, (_, k) => <Star key={k} className="inline w-5 h-5 fill-sun text-ink" strokeWidth={2.5} />) : '—'} <span className="text-ink/50 text-sm">{p ? `×${p.plays}` : ''}</span></span></li>;
              })}
            </ul>
          </details>
        ))}
        {weakSpots.length > 0 && (
          <div className="pt-2">
            <h3 className="font-semibold">Needs more practice</h3>
            <p className="font-read text-2xl">{weakSpots.map(([w, n]) => `${w} (${n})`).join(', ')}</p>
          </div>
        )}
      </section>

      <section className="bg-paper border-4 border-ink rounded-3xl shadow-tile p-5 flex flex-col gap-3">
        <h2 className="text-2xl font-semibold">Data</h2>
        <p>Everything is saved on this device. {pending} change{pending === 1 ? '' : 's'} waiting to sync{SYNC_URL ? '' : ' (no server set yet)'}.</p>
        <div className="flex gap-3 flex-wrap">
          <button type="button" onClick={() => pushPending()} className="tile-sm px-5 py-3 text-xl">Sync now</button>
          <button type="button" onClick={async () => {
            const data = { profile, progress, attempts: await db.attempts.toArray() };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const u = URL.createObjectURL(blob); const el = document.createElement('a'); el.href = u; el.download = 'pori-pori-backup.json'; el.click(); URL.revokeObjectURL(u);
          }} className="tile-sm px-5 py-3 text-xl">Export backup</button>
          <button type="button" onClick={() => { if (confirm('Erase all progress on this device?')) resetAll(); }} className="tile-sm bg-bubblegum px-5 py-3 text-xl">Reset</button>
        </div>
      </section>
    </div>
  );
}
