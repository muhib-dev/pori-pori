"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import {
  AudioLines,
  BookOpen,
  Blocks,
  Hand,
  Lock,
  TrainFront,
} from "lucide-react";
import { db, PROFILE_ID } from "@/lib/db";
import {
  LEVELS,
  isLessonDone,
  isStepUnlocked,
  type GameType,
} from "@/lib/content/syllabus";
import { speak } from "@/lib/speech";
import { Stars, Tile, TopBar } from "@/components/ui";

// Game-type badge: hand = tap, blocks = build, audio-lines = listen, train = order words, book = story
const BADGE: Partial<Record<GameType, typeof Hand>> = {
  "build-word": Blocks,
  "syllable-tap": Blocks,
  "order-words": TrainFront,
  story: BookOpen,
  "hear-tap": AudioLines,
  "first-sound": AudioLines,
  rhyme: AudioLines,
  "blend-tap": AudioLines,
};

function LevelInner() {
  const router = useRouter();
  const id = Number(useSearchParams().get("id") ?? 1);
  const level = LEVELS.find((l) => l.id === id);
  const progress = useLiveQuery(() => db.progress.toArray());
  const profile = useLiveQuery(() => db.profiles.get(PROFILE_ID));
  const [armed, setArmed] = useState<string | null>(null); // first tap plays the word, second opens
  const start = profile?.startStep ?? 1;
  const allowed =
    !!level &&
    !!progress &&
    !!profile &&
    isStepUnlocked(progress, level.id, start);
  // A locked step id typed into the URL goes home. Done and skipped steps stay open for replay.
  useEffect(() => {
    if (progress && profile && !allowed) router.replace("/");
  }, [progress, profile, allowed, router]);
  if (!progress || !level || !allowed) return null;

  const stars = (lid: string) =>
    progress.find((p) => p.lessonId === lid)?.bestStars ?? 0;
  // A lesson opens once the previous one has at least 1 star; every lesson of a skipped step is open.
  const open = (i: number) =>
    level.id < start ||
    i === 0 ||
    isLessonDone(progress, level.lessons[i - 1].id);
  const currentIdx = level.lessons.findIndex(
    (l) => !isLessonDone(progress, l.id),
  );

  const tap = (lessonId: string, label: string) => {
    if (armed === lessonId) {
      router.push(`/play/?lesson=${lessonId}`);
      return;
    }
    setArmed(lessonId);
    speak(label);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-xl mx-auto">
      <TopBar backHref="/">
        <span className="flex items-center gap-3 bg-card border-4 border-ink rounded-full shadow-tileSm pl-3 pr-6 py-1 text-3xl font-semibold">
          <span className="text-4xl leading-none animate-float" aria-hidden>
            {level.emoji}
          </span>
          {level.name}
        </span>
      </TopBar>

      {/* Lesson bubbles in two staggered columns */}
      <ol className="grid grid-cols-2 gap-x-4 gap-y-6 pb-[max(6rem,calc(var(--safe-bottom)+3rem))]">
        {level.lessons.map((lesson, i) => {
          const s = stars(lesson.id);
          const unlocked = open(i);
          const isNext = i === currentIdx;
          const Badge = BADGE[lesson.game] ?? Hand;
          const size = isNext
            ? "w-[124px] h-[124px] text-7xl"
            : "w-[104px] h-[104px] text-6xl";
          return (
            <li
              key={lesson.id}
              className={`flex flex-col items-center gap-2 animate-bounceIn ${i % 2 ? "mt-12" : ""}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="relative">
                <Tile
                  onClick={
                    unlocked ? () => tap(lesson.id, lesson.label) : undefined
                  }
                  disabled={!unlocked}
                  color={s === 3 ? "sun" : "paper"}
                  className={`${size} !rounded-full ${isNext ? "animate-ring !border-[5px]" : ""} ${armed === lesson.id ? "ring-8 ring-sun" : ""}`}
                  ariaLabel={lesson.title}
                >
                  {unlocked ? (
                    <span aria-hidden>{lesson.emoji}</span>
                  ) : (
                    <Lock className="w-10 h-10 opacity-40" strokeWidth={2.5} />
                  )}
                </Tile>
                {unlocked && (
                  <span
                    aria-hidden
                    className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-card border-[3px] border-ink flex items-center justify-center"
                  >
                    <Badge className="w-5 h-5" strokeWidth={2.5} />
                  </span>
                )}
              </div>
              <span className="font-read text-2xl leading-tight text-center">
                {lesson.label}
              </span>
              {unlocked && <Stars n={s} size="text-2xl" />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function LevelPage() {
  return (
    <Suspense fallback={null}>
      <LevelInner />
    </Suspense>
  );
}
