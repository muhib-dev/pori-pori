"use client";
import { useEffect, useRef, useState } from "react";
import { BookOpen, RotateCcw, Volume2 } from "lucide-react";
import { bnLessonId, type BnStory } from "@/lib/content/stories-bn";
import type { ReaderMode } from "@/lib/content/syllabus";
import { recordAttempt } from "@/lib/db";
import { pushPending } from "@/lib/sync";
import { speak, stopSpeaking } from "@/lib/speech";
import { RoundButton, Stars, StickerCard, Tile } from "@/components/ui";
import { Confetti } from "@/components/Feedback";
import { Mascot } from "@/components/Mascot";

// After the last page: picture questions (wrong → wiggle and try again), then stars + sticker.
export function StoryQuiz({ story, mode, startedAt, onAgain }: { story: BnStory; mode: ReaderMode; startedAt: number; onAgain: () => void }) {
  const [i, setI] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const [right, setRight] = useState<number | null>(null);
  const [result, setResult] = useState<{ stars: 0 | 1 | 2 | 3; newSticker: boolean } | null>(null);
  const missed = useRef(new Set<number>()); // questions not answered on the first try
  const saved = useRef(false);
  const q = story.quiz[i];

  const sayQuestion = () => speak(q.question, { lang: "bn", clipKey: q.clipKey, rate: 0.9 });
  useEffect(() => {
    if (result) return;
    const t = setTimeout(() => {
      if (mode === "listen") sayQuestion();
    }, 500);
    return () => clearTimeout(t);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopSpeaking(), []);

  const finish = async () => {
    if (saved.current) return;
    saved.current = true;
    const total = story.quiz.length;
    const firstTryMisses = missed.current.size;
    // Only 2 questions, so starsFor's 80% rule would turn a single miss into 1 star: one miss is 2 here.
    const stars = firstTryMisses === 0 ? 3 : firstTryMisses === 1 ? 2 : 1;
    speak("সাবাশ! গল্প শেষ!", { lang: "bn", clipKey: "bn-done" });
    // misses stay empty: "needs practice" and the home practice button are for phonics words.
    const { newSticker } = await recordAttempt({ lessonId: bnLessonId(story.id), correct: total - firstTryMisses, total, stars, durationMs: Date.now() - startedAt, misses: [] });
    setResult({ stars, newSticker });
    pushPending().catch(() => {});
  };

  const answer = (k: number) => {
    if (right !== null) return;
    if (k === q.answer) {
      setRight(k);
      speak(q.options[k].label, { lang: "bn" });
      setTimeout(() => {
        setRight(null);
        if (i + 1 < story.quiz.length) setI(i + 1);
        else finish();
      }, 1100);
    } else {
      missed.current.add(i);
      setWrong(k);
      speak(q.options[k].label, { lang: "bn" });
      setTimeout(() => setWrong(null), 400);
    }
  };

  if (result)
    return (
      <div className="flex flex-col items-center gap-6 pt-10 pb-8">
        <Confetti />
        <Mascot size={140} mood="dance" />
        <h2 lang="bn" className="font-bn font-extrabold text-4xl text-center animate-pop">
          {story.title}
        </h2>
        <Stars n={result.stars} size="text-6xl" />
        {result.newSticker && <StickerCard state="new" emoji={story.emoji} label={`${story.titleEn} sticker`} />}
        <div className="flex gap-5">
          <RoundButton onClick={onAgain} ariaLabel="Read again" color="sun" size="lg">
            <RotateCcw className="w-10 h-10" strokeWidth={3} />
          </RoundButton>
          <RoundButton href="/story/" ariaLabel="More stories" color="grass" size="xl">
            <BookOpen className="w-12 h-12" strokeWidth={3} />
          </RoundButton>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col items-center gap-6 pt-8 pb-8 w-full max-w-xl mx-auto" key={i}>
      <div className="flex gap-2" aria-label={`${i} of ${story.quiz.length} done`}>
        {story.quiz.map((_, k) => (
          <span key={k} className={`w-[18px] h-[18px] rounded-full border-[3px] border-ink ${k < i ? "bg-grass" : k === i ? "bg-sun" : "bg-card/55"}`} />
        ))}
      </div>
      <Mascot size={96} mood={right !== null ? "cheer" : wrong !== null ? "curious" : "happy"} />
      <div className="flex items-center gap-3 bg-card border-4 border-ink rounded-card shadow-tile px-5 py-4 animate-bounceIn">
        <h2 lang="bn" className="font-bn font-bold text-[28px] leading-snug">
          {q.question}
        </h2>
        <RoundButton onClick={sayQuestion} ariaLabel="Hear the question" color="sun">
          <Volume2 className="w-9 h-9" strokeWidth={3} />
        </RoundButton>
      </div>
      <div className="grid grid-cols-3 gap-3 w-full">
        {q.options.map((o, k) => (
          <Tile
            key={o.label}
            onClick={() => answer(k)}
            state={right === k ? "correct" : wrong === k ? "retry" : right !== null ? "rest" : "idle"}
            className="min-h-[136px] flex-col gap-1 px-2"
            ariaLabel={o.label}
          >
            <span className="text-[56px] leading-none" aria-hidden>
              {o.emoji}
            </span>
            <span lang="bn" className="font-bn font-semibold text-[22px] leading-tight">
              {o.label}
            </span>
          </Tile>
        ))}
      </div>
    </div>
  );
}
