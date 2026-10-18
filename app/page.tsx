'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Dumbbell, Flame, Lock, Play, Rocket, ShieldCheck, Sticker } from 'lucide-react';
import { db, getOrCreateProfile, PROFILE_ID, streakAlive } from '@/lib/db';
import { LEVELS, ZONES, canChallenge, currentStepId, findLesson, isLessonUnlocked, isStepDone, isStepUnlocked } from '@/lib/content/syllabus';
import { Tile, RoundButton, Stars } from '@/components/ui';
import { BrandHeader } from '@/components/BrandHeader';
import { ThemePicker } from '@/components/ThemePicker';
import { Mascot } from '@/components/Mascot';
import { DEFAULT_THEME } from '@/lib/themes';

export default function Home() {
  const router = useRouter();
  const profile = useLiveQuery(() => db.profiles.get(PROFILE_ID));
  const progress = useLiveQuery(() => db.progress.toArray());
  const recent = useLiveQuery(() => db.attempts.orderBy('at').reverse().limit(30).toArray());
  const [ready, setReady] = useState(false);
  useEffect(() => { getOrCreateProfile().then(() => setReady(true)); }, []);
  // A child who has not done "Show me!" yet (and has no saved progress from before it existed) goes there first.
  const needsPlacement = !!profile && profile.startStep === undefined;
  useEffect(() => { if (needsPlacement) router.replace('/placement/'); }, [needsPlacement, router]);

  if (!ready || !profile || !progress || !recent || needsPlacement) return null;
  // The current step is derived from progress: the first step not yet finished (steps below startStep count as skipped).
  const start = profile.startStep ?? 1;
  const stepId = currentStepId(progress, start);
  const step = LEVELS.find((l) => l.id === stepId)!;
  const starsIn = step.lessons.reduce((s, l) => s + (progress.find((p) => p.lessonId === l.id)?.bestStars ?? 0), 0);
  const allDone = LEVELS.every((l) => isStepDone(progress, l, start));
  const streak = streakAlive(profile) ? profile.streak ?? 0 : 0;

  // "Practice": the unlocked lesson the child missed the most in their last 30 plays.
  const missesByLesson = recent.reduce<Record<string, number>>((m, a) => ((m[a.lessonId] = (m[a.lessonId] ?? 0) + a.misses.length), m), {});
  const practiceId = Object.entries(missesByLesson).filter(([id, n]) => n > 0 && isLessonUnlocked(progress, id, start)).sort((a, b) => b[1] - a[1])[0]?.[0];
  const practice = practiceId ? findLesson(practiceId) : undefined;

  return (
    <div className="flex flex-col items-center gap-6 pt-4">
      <header className="w-full flex items-center justify-between">
        <RoundButton href="/grownups/" ariaLabel="Grown-ups area"><ShieldCheck className="w-8 h-8" strokeWidth={2.5} /></RoundButton>
        <BrandHeader />
        <ThemePicker current={profile.theme ?? DEFAULT_THEME} stars={progress.reduce((n, p) => n + p.bestStars, 0)} />
      </header>

      <div className="flex items-center gap-4">
        <div className="text-6xl animate-wave origin-bottom" aria-hidden>{profile.avatar}</div>
        <h2 className="text-4xl font-semibold leading-tight animate-bounceIn">{profile.name ? `Hi ${profile.name}!` : 'Let’s read!'}</h2>
      </div>

      <div className="flex items-center gap-4">
        {streak > 0 && <span className="flex items-center gap-1 bg-paper border-4 border-ink rounded-full px-4 py-1 text-3xl font-semibold shadow-tileSm" aria-label={`${streak} days in a row`}><Flame className="w-8 h-8 fill-tangerine" strokeWidth={2.5} />{streak}</span>}
        <RoundButton href="/stickers/" ariaLabel="Stickers"><Sticker className="w-8 h-8" strokeWidth={2.5} /></RoundButton>
      </div>
      {streak >= 2 && <Mascot say={`${streak} days in a row!`} />}

      <Tile href={`/level/?id=${step.id}`} color={step.color === 'sky' ? 'paper' : step.color} className="w-full flex-col gap-3 py-8 min-h-64 animate-bounceIn" ariaLabel={`Play step ${step.id}: ${step.name}`}>
        <span className="text-xl font-semibold bg-paper border-4 border-ink rounded-full px-4 py-0.5">{allDone ? 'All done! Replay' : `Step ${step.id}`}</span>
        <span className="text-8xl animate-float">{step.emoji}</span>
        <span className="text-4xl font-semibold">{step.name}</span>
        <Stars n={Math.round((starsIn / (step.lessons.length * 3)) * 3)} />
      </Tile>

      <Tile href={`/level/?id=${step.id}`} color="grass" className="w-full h-24 gap-3 animate-pulseSoft" ariaLabel="Play">
        <Play className="w-12 h-12 fill-paper" strokeWidth={3} />
        <span className="text-5xl font-semibold">Play</span>
      </Tile>

      {practice && (
        <Tile href={`/play/?lesson=${practice.id}`} color="sun" className="w-full h-20 gap-3" ariaLabel={`Practice ${practice.title}`}>
          <Dumbbell className="w-9 h-9" strokeWidth={3} /><span className="text-5xl">{practice.emoji}</span><span className="text-3xl font-semibold">Practice</span>
        </Tile>
      )}

      {/* Reading trail: every step is visible. Done and current steps open (replay any); later ones show a lock. */}
      <div className="w-full flex flex-col gap-5 pt-2" aria-label="Reading trail">
        {ZONES.map((z) => {
          const steps = LEVELS.filter((l) => l.zone === z.id);
          if (!steps.length) return null;
          return (
            <section key={z.id} className="flex flex-col gap-2">
              <h3 className="flex items-baseline gap-2 text-2xl font-semibold"><span aria-hidden>{z.emoji}</span>{z.name}<span className="text-base text-ink/60">{z.blurb}</span></h3>
              <ol className="grid grid-cols-3 gap-3">
                {steps.map((l) => {
                  const open = isStepUnlocked(progress, l.id, start);
                  const done = isStepDone(progress, l, start);
                  const current = l.id === stepId && !allDone;
                  const jump = !open && l.id === stepId + 1 && canChallenge(l); // 🚀 skip-ahead quiz
                  return (
                    <li key={l.id}>
                      <Tile href={open ? `/level/?id=${l.id}` : jump ? `/challenge/?step=${l.id}` : undefined} disabled={!open && !jump} color={open ? (l.color === 'sky' ? 'paper' : l.color) : 'paper'}
                        className={`relative w-full aspect-square flex-col gap-1 p-2 ${current ? 'animate-pulseSoft' : ''} ${open || jump ? '' : 'opacity-60'}`}
                        ariaLabel={`Step ${l.id}: ${l.name}${done ? ', done' : current ? ', now' : open ? '' : jump ? ', jump ahead' : ', locked'}`}>
                        {open ? <span className="text-5xl">{l.emoji}</span> : jump ? <Rocket className="w-10 h-10" strokeWidth={2.5} /> : <Lock className="w-10 h-10" strokeWidth={2.5} />}
                        <span className="text-base font-semibold leading-tight text-center">{l.name}</span>
                        {done && <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-grass border-4 border-ink flex items-center justify-center"><Check className="w-4 h-4" strokeWidth={4} /></span>}
                      </Tile>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
