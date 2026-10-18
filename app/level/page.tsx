'use client';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { Lock } from 'lucide-react';
import { db, PROFILE_ID } from '@/lib/db';
import { LEVELS, isLessonDone, isStepUnlocked } from '@/lib/content/syllabus';
import { Tile, TopBar, Stars } from '@/components/ui';

function LevelInner() {
  const router = useRouter();
  const id = Number(useSearchParams().get('id') ?? 1);
  const level = LEVELS.find((l) => l.id === id);
  const progress = useLiveQuery(() => db.progress.toArray());
  const profile = useLiveQuery(() => db.profiles.get(PROFILE_ID));
  const start = profile?.startStep ?? 1;
  const allowed = !!level && !!progress && !!profile && isStepUnlocked(progress, level.id, start);
  // A locked step id typed into the URL goes home. Done and skipped steps stay open for replay.
  useEffect(() => { if (progress && profile && !allowed) router.replace('/'); }, [progress, profile, allowed, router]);
  if (!progress || !level || !allowed) return null;

  const stars = (lid: string) => progress.find((p) => p.lessonId === lid)?.bestStars ?? 0;
  // A lesson opens once the previous one has at least 1 star; every lesson of a skipped step is open.
  const open = (i: number) => level.id < start || i === 0 || isLessonDone(progress, level.lessons[i - 1].id);
  const currentIdx = level.lessons.findIndex((l) => !isLessonDone(progress, l.id));

  return (
    <div className="flex flex-col gap-6">
      <TopBar backHref="/">
        <div className="flex items-center gap-3 text-4xl font-semibold"><span className="animate-float">{level.emoji}</span>{level.name}</div>
      </TopBar>

      {/* A winding trail of lesson stickers */}
      <ol className="relative flex flex-col gap-5 py-2">
        {level.lessons.map((lesson, i) => {
          const s = stars(lesson.id);
          const unlocked = open(i);
          const side = i % 2 === 0 ? 'self-start' : 'self-end';
          return (
            <li key={lesson.id} className={`${side} w-[78%] animate-bounceIn`} style={{ animationDelay: `${i * 80}ms` }}>
              <Tile href={unlocked ? `/play/?lesson=${lesson.id}` : undefined} disabled={!unlocked}
                color={s === 3 ? 'sun' : 'paper'} className={`w-full h-28 justify-between px-6 ${i === currentIdx ? 'animate-pulseSoft' : ''}`} ariaLabel={lesson.title}>
                {unlocked ? <span className="text-6xl">{lesson.emoji}</span> : <Lock className="w-12 h-12" strokeWidth={2.5} />}
                <span className="font-read text-4xl">{lesson.label}</span>
                <Stars n={s} size="text-2xl" />
              </Tile>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function LevelPage() {
  return <Suspense fallback={null}><LevelInner /></Suspense>;
}
