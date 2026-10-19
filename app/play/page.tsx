"use client";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowRight, BookHeart, Home, Plus, RotateCcw } from "lucide-react";
import { isStepDone } from "@/lib/content/syllabus";
import { findAnyLesson, levelOfAnyLesson, startFor, subjectOfLesson } from "@/lib/content/subjects";
import { gameOfLesson, pickLesson } from "@/lib/content/games";
import { buildQuestions, starsFor, shuffle } from "@/lib/engine";
import { isMathGame } from "@/lib/mathEngine";
import { db, PROFILE_ID, recordAttempt } from "@/lib/db";
import { pushPending } from "@/lib/sync";
import { speak, stopSpeaking } from "@/lib/speech";
import { PlayBar, RoundButton, Stars } from "@/components/ui";
import { Celebration, Confetti } from "@/components/Feedback";
import { equippedHat } from "@/lib/content/wardrobe";
import { Mascot } from "@/components/Mascot";
import { Game, Story } from "@/components/games/Games";
import { MathGame } from "@/components/games/MathGames";

// Keyed by lesson so "Next" (same route, new query) resets finished/index/misses state.
function PlayInner() {
  const lessonId = useSearchParams().get("lesson") ?? "";
  return <PlayLesson key={lessonId} lessonId={lessonId} />;
}

function PlayLesson({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const lesson = findAnyLesson(lessonId);
  const level = levelOfAnyLesson(lessonId);
  const [seed, setSeed] = useState(0);
  const [vh, setVh] = useState(800); // viewport height, to scale the results mascot on short screens
  useEffect(() => {
    const on = () => setVh(window.innerHeight);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  const profile = useLiveQuery(() => db.profiles.get(PROFILE_ID));
  const mode = profile?.readerMode ?? 'listen';
  const questions = useMemo(
    () => (lesson ? buildQuestions(lesson, mode) : []),
    [lesson, mode, seed],
  ); // eslint-disable-line react-hooks/exhaustive-deps
  const stories = useMemo(
    () =>
      lesson?.stories
        ? shuffle(lesson.stories).slice(0, lesson.rounds ?? 2)
        : [],
    [lesson, seed],
  ); // eslint-disable-line react-hooks/exhaustive-deps
  const total = lesson?.game === "story" ? stories.length : questions.length;

  // Unknown lessons typed into the URL go home.
  const progress = useLiveQuery(() => db.progress.toArray());
  const start = startFor(profile, subjectOfLesson(lessonId)?.id ?? "reading");
  const allowed = !!lesson && !!progress && !!profile && true; // free play: every lesson is open
  useEffect(() => {
    if (progress && profile && !allowed) router.replace("/");
  }, [progress, profile, allowed, router]);
  const stepDoneAtStart = useRef<boolean | null>(null);
  if (progress && profile && level && stepDoneAtStart.current === null)
    stepDoneAtStart.current = isStepDone(progress, level, start);

  const [i, setI] = useState(0);
  const [cheer, setCheer] = useState(false);
  const [misses, setMisses] = useState<string[]>([]);
  const [firstTryMisses, setFirstTryMisses] = useState(0);
  const [finished, setFinished] = useState(false);
  const [missed, setMissed] = useState(false); // replay button pulses after a first-try miss
  const [newSticker, setNewSticker] = useState(false);
  const started = useRef(Date.now());

  useEffect(() => () => stopSpeaking(), []);

  const onResult = useCallback((firstTry: boolean, missed?: string) => {
    if (!firstTry) {
      setFirstTryMisses((m) => m + 1);
      if (missed) setMisses((m) => [...m, missed]);
    }
    setCheer(true);
  }, []);

  const next = useCallback(() => {
    setCheer(false);
    setMissed(false);
    if (i + 1 >= total) setFinished(true);
    else setI(i + 1);
  }, [i, total]);

  // Save once, when finished
  useEffect(() => {
    if (!finished || !lesson) return;
    const stars = starsFor(total - firstTryMisses, total, firstTryMisses);
    try {
      sessionStorage.setItem("pp-lesson-done", "1");
    } catch {
      /* private mode */
    }
    recordAttempt({
      lessonId: lesson.id,
      correct: total - firstTryMisses,
      total,
      stars,
      durationMs: Date.now() - started.current,
      misses,
    }).then((r) => {
      setNewSticker(r.newSticker);
      if (r.newSticker) speak("A new sticker!");
      return pushPending().catch(() => {});
    });
    speak(
      stars === 3
        ? "Three stars! Amazing!"
        : stars === 2
          ? "Two stars! Well done!"
          : "One star! Good try!",
    );
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lesson || !level)
    return (
      <div className="pt-10 flex flex-col items-center gap-4 text-3xl">
        Lesson not found.{" "}
        <RoundButton href="/" ariaLabel="Home">
          <Home className="w-9 h-9" strokeWidth={2.5} />
        </RoundButton>
      </div>
    );
  if (!progress || !allowed) return null;

  if (finished) {
    const stars = starsFor(total - firstTryMisses, total, firstTryMisses);
    // Step just completed by this play (progress is live, so this flips once the save lands)
    const stepJustDone =
      !stepDoneAtStart.current && isStepDone(progress, level, start);
    const game = gameOfLesson(lesson);
    const nextLesson = game ? pickLesson(game, progress, lesson.id) : undefined;
    const totalStars = progress.reduce((n, p) => n + p.bestStars, 0);
    const again = () => {
      setSeed((s) => s + 1);
      setI(0);
      setMisses([]);
      setFirstTryMisses(0);
      setNewSticker(false);
      setFinished(false);
      setMissed(false);
      started.current = Date.now();
    };
    // sides 92px tilted, centre 120px; they fly in 180ms apart
    const star = (n: number, size: number, tilt: number, delay: number) => (
      <span
        key={n}
        className="animate-fly"
        style={{ ["--fy" as string]: "-120px", animationDelay: `${delay}ms` }}
      >
        <span className="block" style={{ transform: `rotate(${tilt}deg)` }}>
          <Stars
            n={stars >= n ? 1 : 0}
            count={1}
            size={size === 120 ? "text-[120px]" : "text-[92px]"}
          />
        </span>
      </span>
    );
    return (
      <div className="relative flex flex-col items-center justify-center gap-[clamp(8px,2.5dvh,24px)] py-[clamp(8px,3dvh,32px)] min-h-[calc(100dvh-var(--safe-top)-var(--safe-bottom))] overflow-hidden">
        <div
          aria-hidden
          className="absolute -z-10 top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-40 animate-[spin_40s_linear_infinite]"
          style={{
            background:
              "repeating-conic-gradient(rgb(var(--c-sun)) 0 10deg, transparent 10deg 20deg)",
            maskImage: "radial-gradient(circle, #000 20%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(circle, #000 20%, transparent 70%)",
          }}
        />
        {(stars === 3 || stepJustDone) && <Confetti />}
        <div className="flex items-end gap-2" aria-label={`${stars} stars`}>
          {star(1, 92, -12, 0)}
          {star(2, 120, 0, 180)}
          {star(3, 92, 12, 360)}
        </div>
        {newSticker && (
          <div
            className="flex flex-col items-center gap-3"
            aria-label="New sticker"
          >
            <span
              className="w-28 h-28 rounded-tile bg-sun border-4 border-ink shadow-tile flex items-center justify-center text-7xl animate-flip"
              style={{ animationDelay: "700ms" }}
            >
              {lesson.emoji}
            </span>
            <span
              className="flex items-center gap-1 bg-card border-[3px] border-ink rounded-full px-4 py-1 animate-pop"
              style={{ animationDelay: "1100ms" }}
            >
              <Plus className="w-6 h-6" strokeWidth={4} />
              <BookHeart className="w-7 h-7 text-bubblegum" strokeWidth={2.5} />
            </span>
          </div>
        )}
        {stepJustDone && (
          <span aria-label="Step done" className="text-6xl animate-bounceIn">
            🏆
          </span>
        )}
        <Mascot
          size={Math.round(Math.min(140, Math.max(72, vh * 0.16)))}
          mood="dance"
          hat={
            stars === 3
              ? "crown"
              : equippedHat(profile?.wardrobe?.equipped, totalStars)
          }
        />
        <div className="flex items-center justify-center gap-5 w-full pt-2">
          <RoundButton onClick={again} ariaLabel="Play again" color="tangerine">
            <RotateCcw className="w-9 h-9" strokeWidth={3} />
          </RoundButton>
          <RoundButton href="/" ariaLabel="Home" color="sky">
            <Home className="w-9 h-9" strokeWidth={3} />
          </RoundButton>
          <RoundButton
            onClick={() =>
              router.push(nextLesson ? `/play/?lesson=${nextLesson.id}` : "/")
            }
            ariaLabel="Next"
            color="grass"
            size="lg"
          >
            <ArrowRight className="w-12 h-12" strokeWidth={3} />
          </RoundButton>
        </div>
      </div>
    );
  }

  const q = questions[i];
  const key = `${seed}-${i}`;
  return (
    <div className="flex flex-col gap-4 min-h-[calc(100dvh-var(--safe-top)-var(--safe-bottom))]">
      <PlayBar
        total={total}
        done={i}
        current={i}
        homeHref="/"
        onReplay={
          lesson.game === "story"
            ? undefined
            : () => window.dispatchEvent(new Event("pp-replay"))
        }
        missed={missed}
      />

      <section className="flex-1 flex flex-col justify-center py-[clamp(4px,2dvh,24px)]" key={key}>
        {lesson.game === "story" ? (
          <Story story={stories[i]} onResult={onResult} mode={mode} />
        ) : isMathGame(lesson.game) ? (
          <MathGame
            q={q}
            onResult={onResult}
            mode={mode}
            onMiss={() => setMissed(true)}
          />
        ) : (
          <Game
            q={q}
            onResult={onResult}
            mode={mode}
            onMiss={() => setMissed(true)}
          />
        )}
      </section>

      <Celebration show={cheer} onDone={next} />
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={null}>
      <PlayInner />
    </Suspense>
  );
}
