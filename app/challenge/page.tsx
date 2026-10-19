"use client";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { Home, Play, Rocket } from "lucide-react";
import { LEVELS, canChallenge, currentStepId } from "@/lib/content/syllabus";
import { buildQuestions, shuffle } from "@/lib/engine";
import { db, PROFILE_ID, updateProfile } from "@/lib/db";
import { pushPending } from "@/lib/sync";
import { speak, stopSpeaking } from "@/lib/speech";
import { PlayBar, RoundButton } from "@/components/ui";
import { Celebration, Confetti } from "@/components/Feedback";
import { Mascot } from "@/components/Mascot";
import { Game } from "@/components/games/Games";

// 🚀 Skip-ahead challenge: 5 mixed questions from the NEXT step. 4 first-try right opens it
// (and counts every step before it as done). Otherwise: "Let's practise first", no penalty.
const QUESTIONS = 5;
const NEEDED = 4;

function ChallengeInner() {
  const router = useRouter();
  const stepParam = Number(useSearchParams().get("step") ?? 0);
  const step = LEVELS.find((l) => l.id === stepParam);
  const progress = useLiveQuery(() => db.progress.toArray());
  const profile = useLiveQuery(() => db.profiles.get(PROFILE_ID));
  const start = profile?.startStep ?? 1;
  const mode = profile?.readerMode ?? 'listen';
  const [i, setI] = useState(0);
  const [misses, setMisses] = useState(0);
  const [cheer, setCheer] = useState(false);
  const [missed, setMissed] = useState(false);
  const [result, setResult] = useState<"pass" | "practise" | null>(null);

  // Only the step right after the current one can be challenged.
  const allowed =
    !!step &&
    !!progress &&
    !!profile &&
    step.id === currentStepId(progress, start) + 1 &&
    canChallenge(step);
  // After a pass startStep moves up, so `allowed` turns false: only redirect while still quizzing.
  useEffect(() => {
    if (progress && profile && !allowed && result === null) router.replace("/");
  }, [progress, profile, allowed, result, router]);

  // One question from each (non-story) lesson in turn, so the quiz samples the whole step.
  const questions = useMemo(() => {
    if (!step) return [];
    const lessons = step.lessons.filter((l) => l.game !== "story");
    const out = [];
    for (let i = 0; out.length < QUESTIONS && lessons.length; i++)
      out.push(buildQuestions(lessons[i % lessons.length], mode, 1)[0]);
    return shuffle(out);
  }, [step, mode]);

  const saved = useRef(false);
  useEffect(() => () => stopSpeaking(), []);

  const onResult = useCallback((firstTry: boolean) => {
    if (!firstTry) setMisses((m) => m + 1);
    setCheer(true);
  }, []);

  const next = useCallback(() => {
    setCheer(false);
    setMissed(false);
    if (i + 1 < questions.length) {
      setI(i + 1);
      return;
    }
    const pass = questions.length - misses >= NEEDED;
    setResult(pass ? "pass" : "practise");
    speak(pass ? "You did it! New step!" : "Let’s practise first!");
    if (pass && step && !saved.current) {
      saved.current = true;
      updateProfile({ startStep: step.id }).then(() =>
        pushPending().catch(() => {}),
      );
    }
  }, [i, questions.length, misses, step]);

  if (!step || !progress || !profile || (!allowed && result === null))
    return null;

  if (result) {
    return (
      <div className="flex flex-col items-center gap-8 pt-16">
        {result === "pass" && <Confetti />}
        <Rocket
          className="w-32 h-32 text-ink fill-sun animate-pop"
          strokeWidth={2}
        />
        <Mascot
          size={140}
          mood={result === "pass" ? "dance" : "happy"}
          say={result === "pass" ? "New step!" : "Let’s practise first!"}
          hat={result === "pass" ? "crown" : "none"}
        />
        <div className="flex items-center gap-4 text-5xl font-semibold">
          <span className="animate-float">{step.emoji}</span>
          {step.name}
        </div>
        {result === "pass" ? (
          <RoundButton
            href={`/level/?id=${step.id}`}
            ariaLabel="Go"
            color="grass"
            label="Go!"
          >
            <Play className="w-10 h-10 fill-ink" strokeWidth={3} />
          </RoundButton>
        ) : (
          <RoundButton href="/" ariaLabel="Home" color="sky" size="lg">
            <Home className="w-10 h-10" strokeWidth={3} />
          </RoundButton>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 min-h-[100dvh]">
      <PlayBar
        total={questions.length}
        done={i}
        current={i}
        homeHref="/"
        onReplay={() => window.dispatchEvent(new Event("pp-replay"))}
        missed={missed}
      />
      <section className="flex-1 flex flex-col justify-center py-6" key={i}>
        <Game
          q={questions[i]}
          onResult={onResult}
          mode={mode}
          onMiss={() => setMissed(true)}
        />
      </section>
      <Celebration show={cheer} onDone={next} />
    </div>
  );
}

export default function ChallengePage() {
  return (
    <Suspense fallback={null}>
      <ChallengeInner />
    </Suspense>
  );
}
