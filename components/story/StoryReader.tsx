"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Headphones, House, Pause, Play, Volume2, VolumeX } from "lucide-react";
import type { BnStory } from "@/lib/content/stories-bn";
import type { ReaderMode } from "@/lib/content/syllabus";
import { hasVoice, prepareClips, speak, stopSpeaking } from "@/lib/speech";
import { Dots, RoundButton } from "@/components/ui";
import { Mascot } from "@/components/Mascot";
import { StoryScene } from "./StoryScene";

// One page per screen: animated scene + Bengali text. Listen: the page is narrated, words light up in turn and
// the book turns itself. Read: the child reads, taps a word to hear it, and turns the page with ▶.
const wordMs = (w: string) => 320 + w.length * 55; // estimate for the highlight (TTS has no reliable word events for bn)
const TURN_MS = 1400;

export function StoryReader({
  story,
  mode,
  onMode,
  onFinish,
}: {
  story: BnStory;
  mode: ReaderMode;
  onMode: (m: ReaderMode) => void;
  onFinish: () => void;
}) {
  const [page, setPage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(-1);
  const [noVoice, setNoVoice] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const p = story.pages[page];
  const words = p.text.split(/\s+/);
  const last = page === story.pages.length - 1;
  const listen = mode === "listen";

  useEffect(() => {
    prepareClips(story.pages.map((x) => x.clipKey).concat(story.quiz.map((q) => q.clipKey)), "bn");
    const t = setTimeout(() => setNoVoice(!hasVoice("bn")), 800); // voices load late on some browsers
    return () => {
      clearTimeout(t);
      stopSpeaking();
    };
  }, [story]);

  const stop = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    stopSpeaking();
    setPlaying(false);
  }, []);

  const go = useCallback(
    (to: number) => {
      stop();
      setCur(-1);
      if (to >= story.pages.length) onFinish();
      else setPage(Math.max(0, to));
    },
    [stop, story.pages.length, onFinish],
  );

  // Reads the page with the word highlight. In listen mode the book turns when the voice ends
  // (or when the estimate runs out, for devices without a Bengali voice).
  const readAloud = useCallback(
    (autoTurn: boolean) => {
      stop();
      setPlaying(true);
      let finished = false;
      const done = () => {
        if (finished) return;
        finished = true;
        setPlaying(false);
        setCur(-1);
        if (autoTurn) timers.current.push(setTimeout(() => go(page + 1), TURN_MS));
      };
      speak(p.text, { lang: "bn", clipKey: p.clipKey, rate: 0.9, onEnd: done });
      let t = 250;
      words.forEach((w, i) => {
        timers.current.push(setTimeout(() => setCur(i), t));
        t += wordMs(w);
      });
      // Fallback when no end event arrives (no voice, or a browser that drops onend).
      timers.current.push(setTimeout(done, t + (hasVoice("bn") ? 4000 : 300)));
    },
    [p, words, page, go, stop], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (!listen) return;
    const id = setTimeout(() => readAloud(true), 700);
    return () => {
      clearTimeout(id);
      stop();
    };
  }, [page, listen]); // eslint-disable-line react-hooks/exhaustive-deps

  const tapWord = (i: number) => {
    stop();
    setCur(i);
    speak(words[i].replace(/[।,!?“”"‘’…]/g, ""), { lang: "bn", rate: 0.85 });
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto pb-6">
      <div className="flex items-center justify-between gap-3 pt-4">
        <RoundButton href="/story/" ariaLabel="All stories" color="sky">
          <House className="w-9 h-9" strokeWidth={3} />
        </RoundButton>
        <Dots total={story.pages.length} done={page} current={page} />
        <div className="flex rounded-full border-4 border-ink bg-card overflow-hidden shrink-0" role="group" aria-label="Who reads?">
          <button
            type="button"
            aria-pressed={listen}
            aria-label="Listen"
            onClick={() => onMode("listen")}
            className={`w-16 h-16 flex items-center justify-center ${listen ? "bg-sun" : ""}`}
          >
            <Headphones className="w-8 h-8" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            aria-pressed={!listen}
            aria-label="Me read"
            onClick={() => onMode("read")}
            className={`w-16 h-16 flex items-center justify-center ${!listen ? "bg-sun" : ""}`}
          >
            <BookOpen className="w-8 h-8" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="relative" key={page}>
        <StoryScene {...p} />
        <span className="absolute -bottom-6 -right-2 z-10">
          <Mascot size={72} mood={playing ? "talk" : listen ? "happy" : "curious"} />
        </span>
        {listen && noVoice && (
          <span className="absolute top-3 left-3 w-11 h-11 rounded-full bg-card/90 border-[3px] border-ink flex items-center justify-center" aria-label="No Bengali voice on this device">
            <VolumeX className="w-6 h-6" strokeWidth={2.5} />
          </span>
        )}
      </div>

      <p
        lang="bn"
        className="bg-card border-4 border-ink rounded-card shadow-tile px-4 py-5 min-h-32 flex flex-wrap justify-center items-center gap-x-1.5 gap-y-2 animate-bounceIn"
        key={`t${page}`}
      >
        {words.map((w, i) => (
          <button
            key={i}
            type="button"
            onClick={() => tapWord(i)}
            className={`font-bn font-semibold text-[26px] md:text-[32px] leading-normal rounded-xl px-1.5 border-[3px] transition-colors ${i === cur ? "bg-sun border-ink" : "border-transparent"}`}
          >
            {w}
          </button>
        ))}
      </p>

      <div className="flex items-center justify-center gap-5">
        <RoundButton onClick={() => go(page - 1)} ariaLabel="Previous page" color="card" size="lg" className={page === 0 ? "invisible" : ""}>
          <ArrowLeft className="w-10 h-10" strokeWidth={3} />
        </RoundButton>
        {listen ? (
          <RoundButton onClick={playing ? stop : () => readAloud(true)} ariaLabel={playing ? "Pause" : "Play"} color="sun" size="xl">
            {playing ? <Pause className="w-12 h-12 fill-ink" strokeWidth={3} /> : <Play className="w-12 h-12 fill-ink" strokeWidth={3} />}
          </RoundButton>
        ) : (
          <RoundButton onClick={playing ? stop : () => readAloud(false)} ariaLabel={playing ? "Stop" : "Read to me"} color="sun" size="xl">
            {playing ? <Pause className="w-12 h-12 fill-ink" strokeWidth={3} /> : <Volume2 className="w-12 h-12" strokeWidth={3} />}
          </RoundButton>
        )}
        <RoundButton onClick={() => go(page + 1)} ariaLabel={last ? "Finish" : "Next page"} color="grass" size="lg" pulse={!listen && last}>
          <ArrowRight className="w-10 h-10" strokeWidth={3} />
        </RoundButton>
      </div>
    </div>
  );
}
