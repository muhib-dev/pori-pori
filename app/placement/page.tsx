"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, SkipForward } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import {
  LEVELS,
  PLACEMENT,
  PLACEMENT_PASSED_STEP,
  findLesson,
  modeForStep,
} from "@/lib/content/syllabus";
import { buildQuestions, shuffle } from "@/lib/engine";
import { getOrCreateProfile, updateProfile } from "@/lib/db";
import { pushPending } from "@/lib/sync";
import { speak, stopSpeaking } from "@/lib/speech";
import { PlayBar, RoundButton, Tile } from "@/components/ui";
import { Celebration } from "@/components/Feedback";
import {
  HearTap,
  WordPic,
  SentencePic,
  PicWord,
  Story,
} from "@/components/games/Games";

// "Show me!": a short, friendly check that picks where the child starts. It never says
// "wrong": missing a stage just ends the quiz and says "Let's start here!".
const QUESTIONS_PER_STAGE = 3;

export default function PlacementPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"ask" | "check" | "done">("ask");
  const [stage, setStage] = useState(0);
  const [qi, setQi] = useState(0);
  const [stageMisses, setStageMisses] = useState(0);
  const [cheer, setCheer] = useState(false);
  const [startStep, setStartStep] = useState(1);
  const saved = useRef(false);

  useEffect(() => {
    getOrCreateProfile();
    return () => stopSpeaking();
  }, []);
  useEffect(() => {
    if (phase === "ask") speak("Are you new? Or can you read?");
  }, [phase]);

  const lesson = findLesson(PLACEMENT[stage].lessonId)!;
  const questions = useMemo(
    () =>
      lesson.game === "story"
        ? []
        : buildQuestions(lesson, undefined, QUESTIONS_PER_STAGE),
    [lesson],
  );
  const story = useMemo(
    () => (lesson.stories ? shuffle(lesson.stories)[0] : null),
    [lesson],
  );
  const count = lesson.game === "story" ? 1 : questions.length;

  const finish = useCallback((step: number) => {
    if (saved.current) return;
    saved.current = true;
    setStartStep(step);
    setPhase("done");
    speak("Let’s start here!");
    updateProfile({ startStep: step, readerMode: modeForStep(step) }).then(() =>
      pushPending().catch(() => {}),
    );
  }, []);

  const begin = (firstStage: number) => {
    setStage(firstStage);
    setQi(0);
    setStageMisses(0);
    setPhase("check");
  };

  const onResult = useCallback((firstTry: boolean) => {
    if (!firstTry) setStageMisses((m) => m + 1);
    setCheer(true);
  }, []);

  const next = useCallback(() => {
    setCheer(false);
    if (qi + 1 < count) {
      setQi(qi + 1);
      return;
    }
    if (stageMisses > 1) return finish(PLACEMENT[stage].startIfMissed);
    if (stage + 1 < PLACEMENT.length) {
      setStage(stage + 1);
      setQi(0);
      setStageMisses(0);
      return;
    }
    finish(PLACEMENT_PASSED_STEP);
  }, [qi, count, stageMisses, stage, finish]);

  if (phase === "ask") {
    return (
      <div className="flex flex-col items-center gap-8 pt-10">
        <Mascot size={120} mood="talk" say="Show me!" />
        <h1 className="text-4xl font-semibold text-center">Show me!</h1>
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          <Tile
            color="sun"
            className="h-56 flex-col gap-3"
            ariaLabel="I am new"
            onClick={() => begin(0)}
          >
            <span className="text-8xl">🐣</span>
            <span className="text-3xl font-semibold">New</span>
          </Tile>
          <Tile
            color="grass"
            className="h-56 flex-col gap-3"
            ariaLabel="I can read"
            onClick={() => begin(1)}
          >
            <span className="text-8xl">📖</span>
            <span className="text-3xl font-semibold">I read</span>
          </Tile>
        </div>
        <RoundButton ariaLabel="Skip" onClick={() => finish(1)}>
          <SkipForward className="w-9 h-9" strokeWidth={2.5} />
        </RoundButton>
      </div>
    );
  }

  if (phase === "done") {
    const step = LEVELS.find((l) => l.id === startStep) ?? LEVELS[0];
    return (
      <div className="flex flex-col items-center gap-8 pt-16">
        <Mascot size={160} mood="dance" hat="flower" />
        <h1 className="text-4xl font-semibold text-center animate-bounceIn">
          Let’s start here!
        </h1>
        <div className="flex items-center gap-4 text-5xl font-semibold">
          <span className="animate-float">{step.emoji}</span>
          {step.name}
        </div>
        <RoundButton href="/" ariaLabel="Go" color="grass" label="Go!">
          <Play className="w-10 h-10 fill-ink" strokeWidth={3} />
        </RoundButton>
      </div>
    );
  }

  const q = questions[qi];
  return (
    <div className="flex flex-col gap-4 min-h-[100dvh]">
      <PlayBar total={count} done={qi} current={qi} homeHref={null} />
      <section
        className="flex-1 flex flex-col justify-center py-6"
        key={`${stage}-${qi}`}
      >
        {lesson.game === "story" ? (
          <Story story={story!} onResult={onResult} />
        ) : lesson.game === "hear-tap" ? (
          <HearTap q={q} onResult={onResult} />
        ) : lesson.game === "word-pic" ? (
          <WordPic q={q} onResult={onResult} />
        ) : lesson.game === "pic-word" ? (
          <PicWord q={q} onResult={onResult} />
        ) : (
          <SentencePic q={q} onResult={onResult} />
        )}
      </section>
      <Celebration show={cheer} onDone={next} />
    </div>
  );
}
