'use client';
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Delete, FileDown, Lock, Star, Volume2 } from 'lucide-react';
import { db, PROFILE_ID, updateProfile, resetAll, getOrCreateProfile } from '@/lib/db';
import { LEVELS, currentStepId } from '@/lib/content/syllabus';
import { THEMES, applyTheme, DEFAULT_THEME } from '@/lib/themes';
import { applyReducedMotion } from '@/lib/motion';
import { AVATARS } from '@/components/AvatarPicker';
import { speak } from '@/lib/speech';
import { pushPending, SYNC_URL } from '@/lib/sync';

// Grown-ups area: deliberately calm and neutral (not the sticker-board look) so it reads as "not for me" to a child.
const card = 'bg-white border-[1.5px] border-[#E2DED5] rounded-[20px] p-5 flex flex-col gap-3';
const btn = 'rounded-[14px] border-[1.5px] border-[#E2DED5] bg-white px-4 py-3 text-[15px] font-medium active:bg-[#EFEBE2]';
const field = 'border-[1.5px] border-[#E2DED5] rounded-[14px] p-3 text-base bg-white';

function Shell({ children, back = true }: { children: ReactNode; back?: boolean }) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#F6F4EF] text-[#2B2A28] font-sans text-[14px]">
      <div className="max-w-2xl mx-auto px-4 pb-10 pt-4 flex flex-col gap-4">
        <header className="flex items-center gap-3">
          {back && <Link href="/" aria-label="Back" className="w-[72px] h-[72px] -ml-2 flex items-center justify-center rounded-full"><ArrowLeft className="w-6 h-6" strokeWidth={2} /></Link>}
          <h1 className="font-ui font-semibold text-2xl">Grown-ups</h1>
        </header>
        {children}
      </div>
    </div>
  );
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'del'] as const;

export default function Grownups() {
  // Simple gate: a sum a 6-year-old won't solve quickly
  // Picked after mount: a random value during render would mismatch the server HTML.
  const [[a, b], setSum] = useState<[number, number]>([0, 0]);
  useEffect(() => setSum([5 + Math.floor(Math.random() * 5), 6 + Math.floor(Math.random() * 4)]), []);
  const [answer, setAnswer] = useState('');
  const unlocked = a > 0 && Number(answer) === a + b;

  const profile = useLiveQuery(() => db.profiles.get(PROFILE_ID));
  const progress = useLiveQuery(() => db.progress.toArray()) ?? [];
  const attempts = useLiveQuery(() => db.attempts.orderBy('at').reverse().limit(30).toArray()) ?? [];
  const pending = useLiveQuery(() => db.outbox.where('synced').equals(0).count()) ?? 0;
  useEffect(() => { getOrCreateProfile(); }, []);

  if (!unlocked) {
    const press = (k: (typeof KEYS)[number]) => setAnswer((v) => (k === 'clear' ? '' : k === 'del' ? v.slice(0, -1) : (v + k).slice(0, 3)));
    return (
      <Shell>
        <div className={`${card} items-center gap-5 py-8`}>
          <p className="text-[15px] text-[#6B6760]">Solve this to continue</p>
          <p className="font-ui font-semibold text-4xl" aria-live="polite">{a} + {b} = <span className="inline-block min-w-[3ch] border-b-2 border-[#2B2A28]/30 text-center">{answer || '?'}</span></p>
          <div className="grid grid-cols-3 gap-3">
            {KEYS.map((k) => (
              <button key={k} type="button" onClick={() => press(k)} aria-label={k === 'del' ? 'Delete' : k === 'clear' ? 'Clear' : k}
                className="w-[72px] h-[72px] rounded-[18px] border-[1.5px] border-[#E2DED5] bg-white font-ui text-2xl font-medium active:bg-[#EFEBE2] flex items-center justify-center">
                {k === 'del' ? <Delete className="w-6 h-6" strokeWidth={2} /> : k === 'clear' ? <span className="text-sm">Clear</span> : k}
              </button>
            ))}
          </div>
        </div>
      </Shell>
    );
  }
  if (!profile) return null;

  const stepId = currentStepId(progress, profile.startStep);
  const totalStars = progress.reduce((n, p) => n + p.bestStars, 0);
  const minutes = Math.round(attempts.reduce((s, x) => s + x.durationMs, 0) / 60000);
  const weakSpots = Object.entries(attempts.flatMap((x) => x.misses).reduce<Record<string, number>>((m, w) => ((m[w] = (m[w] ?? 0) + 1), m), {}))
    .sort((x, y) => y[1] - x[1]).slice(0, 8);
  const theme = profile.theme ?? DEFAULT_THEME;

  return (
    <Shell>
      <section className={card}>
        <div className="flex items-center gap-4">
          <span className="w-16 h-16 rounded-full bg-[#F6F4EF] border-[1.5px] border-[#E2DED5] flex items-center justify-center text-4xl" aria-hidden>{profile.avatar}</span>
          <label className="flex-1 flex flex-col gap-1 text-[#6B6760]">Name
            <input value={profile.name} onChange={(e) => updateProfile({ name: e.target.value })} className={`${field} text-[#2B2A28] font-ui`} />
          </label>
        </div>
        <div className="flex gap-2 flex-wrap" role="group" aria-label="Avatar">
          {AVATARS.map((av) => (
            <button key={av} type="button" onClick={() => updateProfile({ avatar: av })} aria-pressed={profile.avatar === av}
              className={`text-3xl w-12 h-12 rounded-[14px] border-[1.5px] ${profile.avatar === av ? 'border-[#2B2A28] bg-[#EFEBE2]' : 'border-[#E2DED5] bg-white'}`}>{av}</button>
          ))}
        </div>
        <p className="flex items-center justify-between">Current step <strong>{stepId}. {LEVELS.find((l) => l.id === stepId)?.name}</strong></p>
        <p className="text-[#6B6760]">The child opens the next step by finishing every lesson in the current one (1 star is enough). Earlier steps stay open to replay.</p>
      </section>

      <div className="grid grid-cols-3 gap-3">
        {[[attempts.length, 'Games'], [minutes, 'Minutes'], [totalStars, 'Stars']].map(([n, l]) => (
          <div key={l} className="bg-white border-[1.5px] border-[#E2DED5] rounded-[20px] py-4 flex flex-col items-center">
            <span className="font-ui font-semibold text-3xl">{n}</span><span className="text-[#6B6760]">{l}</span>
          </div>
        ))}
      </div>

      <section className={card}>
        <h2 className="font-ui font-semibold text-lg">Settings</h2>
        <div className="flex flex-col gap-2">
          <span className="text-[#6B6760]">Reading mode</span>
          <div className="flex gap-2">
            {([['listen', '🎧 Listen', 'Reads each question aloud, fewer choices'], ['read', '📖 Read', 'Child reads first, taps the speaker for help']] as const).map(([m, label, hint]) => (
              <button key={m} type="button" title={hint} onClick={() => updateProfile({ readerMode: m })}
                className={`flex-1 ${btn} ${(profile.readerMode ?? 'listen') === m ? '!border-[#2B2A28] !bg-[#EFEBE2]' : ''}`}>{label}</button>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-1">Start at step
          <select value={profile.startStep ?? 1} onChange={(e) => updateProfile({ startStep: Number(e.target.value) })} className={field}>
            {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.id}. {l.name}</option>)}
          </select>
          <span className="text-[#6B6760]">Steps before this one count as done and stay open to replay.</span>
        </label>
        <Link href="/placement/" className="underline">Run the “Show me!” quiz again</Link>
        <label className="flex items-center justify-between gap-3">
          <span>Reduce motion<span className="block text-[#6B6760]">Effects become short fades. Sounds stay.</span></span>
          <input type="checkbox" className="w-6 h-6" checked={!!profile.reducedMotion} onChange={(e) => { applyReducedMotion(e.target.checked); updateProfile({ reducedMotion: e.target.checked }); }} />
        </label>
        <div className="flex flex-col gap-2">
          <span className="text-[#6B6760]">Colours</span>
          <div className="flex gap-3 flex-wrap">
            {THEMES.map((t) => {
              const locked = totalStars < t.stars;
              return (
                <button key={t.id} type="button" disabled={locked} aria-pressed={theme === t.id} aria-label={locked ? `${t.name}, locked` : t.name}
                  onClick={() => { applyTheme(t.id); updateProfile({ theme: t.id }); }} data-theme={t.id}
                  className={`relative w-14 h-14 rounded-full border-2 overflow-hidden flex ${theme === t.id ? 'border-[#2B2A28] ring-2 ring-[#2B2A28]/20' : 'border-[#E2DED5]'} ${locked ? 'opacity-50' : ''}`}>
                  <span className="flex-1 bg-paper" /><span className="flex-1 bg-sun" /><span className="flex-1 bg-grass" />
                  {locked && <Lock aria-hidden className="absolute inset-0 m-auto w-5 h-5 text-[#2B2A28]" strokeWidth={2} />}
                </button>
              );
            })}
          </div>
          <span className="text-[#6B6760]">{THEMES.find((t) => t.id === theme)?.name}. More colours open as stars are earned.</span>
        </div>
      </section>

      <section className={card}>
        <h2 className="font-ui font-semibold text-lg">Progress</h2>
        {LEVELS.map((lv) => (
          <details key={lv.id} className="border-t border-[#E2DED5] pt-2">
            <summary className="cursor-pointer text-[15px] py-1">{lv.emoji} Step {lv.id}: {lv.name} <span className="text-[#6B6760]">— {lv.goal}</span></summary>
            <ul className="pl-2 pt-2 flex flex-col gap-1">
              {lv.lessons.map((l) => {
                const p = progress.find((x) => x.lessonId === l.id);
                return <li key={l.id} className="flex justify-between"><span>{l.title}</span><span>{p?.bestStars ? Array.from({ length: p.bestStars }, (_, k) => <Star key={k} className="inline w-4 h-4 fill-[#FFC93C] text-[#2B2A28]" strokeWidth={2} />) : '—'} <span className="text-[#6B6760] text-xs">{p ? `×${p.plays}` : ''}</span></span></li>;
              })}
            </ul>
          </details>
        ))}
        {weakSpots.length > 0 && (
          <div className="pt-2 flex flex-col gap-2">
            <h3 className="font-medium">Needs practice</h3>
            <div className="flex flex-wrap gap-2">
              {weakSpots.map(([w, n]) => (
                <button key={w} type="button" onClick={() => speak(w)} aria-label={`Hear ${w}`}
                  className="flex items-center gap-2 rounded-full border-[1.5px] border-[#E2DED5] bg-[#F6F4EF] px-3 py-2 font-read text-base"><Volume2 className="w-4 h-4" strokeWidth={2} />{w}<span className="text-xs text-[#6B6760]">{n}</span></button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className={card}>
        <h2 className="font-ui font-semibold text-lg">Data</h2>
        <p className="text-[#6B6760]">Everything is saved on this device. {pending} change{pending === 1 ? '' : 's'} waiting to sync{SYNC_URL ? '' : ' (no server set yet)'}.</p>
        <div className="flex gap-3 flex-wrap">
          <button type="button" onClick={() => pushPending()} className={btn}>Sync now</button>
          <button type="button" onClick={async () => {
            const data = { profile, progress, attempts: await db.attempts.toArray(), stickers: await db.stickers.toArray() };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const u = URL.createObjectURL(blob); const el = document.createElement('a'); el.href = u; el.download = 'pori-pori-backup.json'; el.click(); URL.revokeObjectURL(u);
          }} className={`${btn} flex items-center gap-2`}><FileDown className="w-4 h-4" strokeWidth={2} />Export</button>
          <button type="button" onClick={() => { if (confirm('Erase all progress on this device?')) resetAll(); }} className={`${btn} text-[#8A3B2E]`}>Reset…</button>
        </div>
      </section>
    </Shell>
  );
}
