'use client';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, ChevronRight, FileDown, Lock, Settings, Smartphone, Star, TrendingUp, User, Volume2 } from 'lucide-react';
import { db, PROFILE_ID, updateProfile, resetAll, getOrCreateProfile } from '@/lib/db';
import { LEVELS, currentStepId } from '@/lib/content/syllabus';
import { SUBJECTS } from '@/lib/content/subjects';
import { THEMES, applyTheme, DEFAULT_THEME } from '@/lib/themes';
import { applyReducedMotion } from '@/lib/motion';
import { AVATARS } from '@/components/AvatarPicker';
import { speak } from '@/lib/speech';
import { InstallHelp } from '@/components/InstallHelp';
import { GATE_KEY, SumGate } from '@/components/GrownupsGate';
import { pushPending, SYNC_URL } from '@/lib/sync';

// Grown-ups area: deliberately calm and neutral (not the sticker-board look) so it reads as "not for me" to a child.
const card = 'bg-white border-[1.5px] border-[#E2DED5] rounded-[20px] p-5 flex flex-col gap-3';
const btn = 'rounded-[14px] border-[1.5px] border-[#E2DED5] bg-white px-4 py-3 text-[15px] font-medium active:bg-[#EFEBE2]';
const field = 'border-[1.5px] border-[#E2DED5] rounded-[14px] p-3 text-base bg-white';
const hint = 'text-[#6B6760]';

type View = 'hub' | 'child' | 'progress' | 'settings' | 'data';
const TITLES: Record<View, string> = { hub: 'Grown-ups', child: 'Child', progress: 'Progress', settings: 'Settings', data: 'Install & data' };

function Shell({ title, onBack, children }: { title: string; onBack?: () => void; children: ReactNode }) {
  const backCls = 'w-[72px] h-[72px] -ml-2 flex items-center justify-center rounded-full';
  const icon = <ArrowLeft className="w-6 h-6" strokeWidth={2} />;
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#F6F4EF] text-[#2B2A28] font-sans text-[14px]">
      <div className="max-w-2xl mx-auto px-4 pb-10 pt-4 flex flex-col gap-4">
        <header className="flex items-center gap-3">
          {onBack ? (
            <button type="button" onClick={onBack} aria-label="Back" className={backCls}>{icon}</button>
          ) : (
            <Link href="/" aria-label="Back" className={backCls}
              onClick={() => { try { sessionStorage.removeItem(GATE_KEY); } catch { /* private mode */ } }}>{icon}</Link>
          )}
          <h1 className="font-ui font-semibold text-2xl">{title}</h1>
        </header>
        {children}
      </div>
    </div>
  );
}

export default function Grownups() {
  const [gate, setGate] = useState<'checking' | 'locked' | 'open'>('checking');
  const [view, setView] = useState<View>('hub');
  useEffect(() => {
    try {
      if (sessionStorage.getItem(GATE_KEY)) return setGate('open');
    } catch { /* private mode */ }
    setGate('locked');
  }, []);
  const unlock = useCallback(() => setGate('open'), []);

  const profile = useLiveQuery(() => db.profiles.get(PROFILE_ID));
  const progress = useLiveQuery(() => db.progress.toArray()) ?? [];
  const attempts = useLiveQuery(() => db.attempts.orderBy('at').reverse().limit(30).toArray()) ?? [];
  const pending = useLiveQuery(() => db.outbox.where('synced').equals(0).count()) ?? 0;
  useEffect(() => { getOrCreateProfile(); }, []);

  if (gate === 'checking') return null;
  if (gate === 'locked') {
    return (
      <Shell title="Grown-ups">
        <div className={`${card} items-center py-8`}><SumGate onSolved={unlock} /></div>
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
  const stepName = LEVELS.find((l) => l.id === stepId)?.name;

  const rows: [View, ReactNode, string, string][] = [
    ['child', <User key="c" className="w-6 h-6" strokeWidth={2} />, 'Child', 'Name and picture'],
    ['progress', <TrendingUp key="p" className="w-6 h-6" strokeWidth={2} />, 'Progress', weakSpots.length ? 'Stars and words to practise' : 'Stars per lesson'],
    ['settings', <Settings key="s" className="w-6 h-6" strokeWidth={2} />, 'Settings', 'Reading mode, start step, colours'],
    ['data', <Smartphone key="d" className="w-6 h-6" strokeWidth={2} />, 'Install & data', 'Add to phone, backup, reset'],
  ];

  return (
    <Shell title={TITLES[view]} onBack={view === 'hub' ? undefined : () => setView('hub')}>
      {view === 'hub' && (
        <>
          <div className={`${card} flex-row items-center gap-4`}>
            <span className="w-16 h-16 rounded-full bg-[#F6F4EF] border-[1.5px] border-[#E2DED5] flex items-center justify-center text-4xl" aria-hidden>{profile.avatar}</span>
            <div className="flex flex-col">
              <span className="font-ui font-semibold text-xl">{profile.name}</span>
              <span className={hint}>Step {stepId}. {stepName}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[[attempts.length, 'Games'], [minutes, 'Minutes'], [totalStars, 'Stars']].map(([n, l]) => (
              <div key={l} className="bg-white border-[1.5px] border-[#E2DED5] rounded-[20px] py-4 flex flex-col items-center">
                <span className="font-ui font-semibold text-3xl">{n}</span><span className={hint}>{l}</span>
              </div>
            ))}
          </div>
          <nav className="flex flex-col gap-3">
            {rows.map(([v, icon, label, sub]) => (
              <button key={v} type="button" onClick={() => setView(v)}
                className="bg-white border-[1.5px] border-[#E2DED5] rounded-[20px] px-5 min-h-[72px] flex items-center gap-4 text-left active:bg-[#EFEBE2]">
                {icon}
                <span className="flex-1 flex flex-col"><span className="font-ui font-semibold text-base">{label}</span><span className={hint}>{sub}</span></span>
                <ChevronRight className="w-5 h-5 text-[#6B6760]" strokeWidth={2} />
              </button>
            ))}
          </nav>
        </>
      )}

      {view === 'child' && (
        <section className={card}>
          <label className={`flex flex-col gap-1 ${hint}`}>Name
            <input value={profile.name} onChange={(e) => updateProfile({ name: e.target.value })} className={`${field} text-[#2B2A28] font-ui`} />
          </label>
          <span className={hint}>Picture</span>
          <div className="flex gap-2 flex-wrap" role="group" aria-label="Avatar">
            {AVATARS.map((av) => (
              <button key={av} type="button" onClick={() => updateProfile({ avatar: av })} aria-pressed={profile.avatar === av}
                className={`text-3xl w-12 h-12 rounded-[14px] border-[1.5px] ${profile.avatar === av ? 'border-[#2B2A28] bg-[#EFEBE2]' : 'border-[#E2DED5] bg-white'}`}>{av}</button>
            ))}
          </div>
        </section>
      )}

      {view === 'progress' && (
        <>
          {weakSpots.length > 0 && (
            <section className={card}>
              <h2 className="font-ui font-semibold text-lg">Needs practice</h2>
              <div className="flex flex-wrap gap-2">
                {weakSpots.map(([w, n]) => (
                  <button key={w} type="button" onClick={() => speak(w)} aria-label={`Hear ${w}`}
                    className="flex items-center gap-2 rounded-full border-[1.5px] border-[#E2DED5] bg-[#F6F4EF] px-3 py-2 font-read text-base"><Volume2 className="w-4 h-4" strokeWidth={2} />{w}<span className="text-xs text-[#6B6760]">{n}</span></button>
                ))}
              </div>
            </section>
          )}
          <section className={card}>
            <h2 className="font-ui font-semibold text-lg">Steps</h2>
            {SUBJECTS.flatMap((sub) => sub.levels.map((lv) => ({ sub, lv }))).map(({ sub, lv }) => (
              <details key={`${sub.id}-${lv.id}`} className="border-t border-[#E2DED5] pt-2">
                <summary className="cursor-pointer text-[15px] py-1">{sub.id === 'reading' ? '' : `${sub.emoji} `}{lv.emoji} {lv.id}. {lv.name}</summary>
                <ul className="pl-2 pt-2 flex flex-col gap-1">
                  {lv.lessons.map((l) => {
                    const p = progress.find((x) => x.lessonId === l.id);
                    return <li key={l.id} className="flex justify-between"><span>{l.title}</span><span>{p?.bestStars ? Array.from({ length: p.bestStars }, (_, k) => <Star key={k} className="inline w-4 h-4 fill-[#FFC93C] text-[#2B2A28]" strokeWidth={2} />) : '—'} <span className="text-[#6B6760] text-xs">{p ? `×${p.plays}` : ''}</span></span></li>;
                  })}
                </ul>
              </details>
            ))}
          </section>
        </>
      )}

      {view === 'settings' && (
        <>
          <section className={card}>
            <h2 className="font-ui font-semibold text-lg">Reading mode</h2>
            <div className="flex gap-2">
              {([['listen', '🎧 Listen', 'Reads each question aloud, fewer choices'], ['read', '📖 Read', 'Child reads first, taps the speaker for help']] as const).map(([m, label, tip]) => (
                <button key={m} type="button" title={tip} onClick={() => updateProfile({ readerMode: m })}
                  className={`flex-1 ${btn} ${(profile.readerMode ?? 'listen') === m ? '!border-[#2B2A28] !bg-[#EFEBE2]' : ''}`}>{label}</button>
              ))}
            </div>
            <span className={hint}>{(profile.readerMode ?? 'listen') === 'listen' ? 'Reads each question aloud, fewer choices.' : 'Child reads first, taps the speaker for help.'}</span>
          </section>
          <section className={card}>
            <label className="flex flex-col gap-2"><span className="font-ui font-semibold text-lg">Start at step</span>
              <select value={profile.startStep ?? 1} onChange={(e) => updateProfile({ startStep: Number(e.target.value) })} className={field}>
                {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.id}. {l.name}</option>)}
              </select>
              <span className={hint}>Earlier steps count as done.</span>
            </label>
          </section>
          <section className={card}>
            <label className="flex items-center justify-between gap-3">
              <span><span className="font-ui font-semibold text-lg">Reduce motion</span><span className={`block ${hint}`}>Short fades. Sounds stay.</span></span>
              <input type="checkbox" className="w-6 h-6" checked={!!profile.reducedMotion} onChange={(e) => { applyReducedMotion(e.target.checked); updateProfile({ reducedMotion: e.target.checked }); }} />
            </label>
          </section>
          <section className={card}>
            <h2 className="font-ui font-semibold text-lg">Colours</h2>
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
            <span className={hint}>{THEMES.find((t) => t.id === theme)?.name}. More open as stars are earned.</span>
          </section>
        </>
      )}

      {view === 'data' && (
        <>
          <section className={card}>
            <h2 className="font-ui font-semibold text-lg">Install on a phone</h2>
            <InstallHelp showQr />
          </section>
          <section className={card}>
            <h2 className="font-ui font-semibold text-lg">Data</h2>
            <p className={hint}>Saved on this device. {pending} change{pending === 1 ? '' : 's'} waiting to sync{SYNC_URL ? '' : ' (no server set yet)'}.</p>
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
        </>
      )}
    </Shell>
  );
}
