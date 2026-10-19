"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Question } from "@/lib/engine";
import {
  LETTER_BY_CHAR,
  type Item,
  type ReaderMode,
  type StoryItem,
} from "@/lib/content/syllabus";
import { speak, speakSegmented } from "@/lib/speech";
import { ArrowRight, Check, Hand, Headphones, Pause, Play } from "lucide-react";
import { RoundButton, Tile } from "../ui";
import { Burst } from "../Feedback";
import { Speaker } from "../Speaker";
import { Mascot } from "../Mascot";
import { Scene, useScene, type SceneState } from "./Scene";

// Every game receives one question and reports: onResult(correctOnFirstTry)
export interface GameProps {
  q: Question;
  onResult: (firstTry: boolean, missedText?: string) => void;
  mode?: ReaderMode; // 'listen' reads the prompt aloud as soon as the question appears
  onMiss?: () => void; // lets the play bar pulse its replay button after a first-try miss
}

/** Say the prompt on arrival for pre-readers; readers tap the speaker if they want it. */
function useAutoSay(say: () => void, mode?: ReaderMode) {
  useEffect(() => {
    if (mode !== "listen") return;
    const id = setTimeout(say, 400);
    return () => clearTimeout(id);
  }, [say, mode]);
}

const promptFor = (item: Item) => item.say ?? item.text;

/** Picture card: sun tile that repeats the prompt when tapped */
function PicCard({
  emoji,
  onTap,
  size = "md",
}: {
  emoji: string;
  onTap: () => void;
  size?: "md" | "lg";
}) {
  return (
    <Tile
      color="sun"
      onClick={onTap}
      ariaLabel="Picture"
      className={
        size === "lg"
          ? "w-[clamp(110px,20dvh,176px)] h-[clamp(110px,20dvh,176px)] text-[clamp(3.5rem,10dvh,6rem)]"
          : "w-[clamp(96px,17dvh,144px)] h-[clamp(96px,17dvh,144px)] text-[clamp(3rem,8.5dvh,5rem)]"
      }
    >
      {emoji}
    </Tile>
  );
}

// -------- shared choice grid: 2–4 big tiles. Right = grass + check + pop, wrong = wiggle and retry, 2nd miss = glow hint ---
function Choices({
  options,
  answer,
  render,
  onResult,
  s,
  big,
  onCorrect,
}: {
  options: Item[];
  answer: number;
  render: (it: Item) => React.ReactNode;
  onResult: GameProps["onResult"];
  s: SceneState;
  big?: boolean;
  onCorrect?: (i: number) => void;
}) {
  const [wrong, setWrong] = useState<number[]>([]);
  const [done, setDone] = useState<number | null>(null);
  const tried = useRef(false);

  const tap = (i: number) => {
    if (done !== null) return;
    if (i === answer) {
      setDone(i);
      s.react("ok");
      onCorrect?.(i);
      speak(promptFor(options[i]), { rate: 0.9 });
      setTimeout(
        () =>
          onResult(
            !tried.current,
            tried.current ? options[answer].text : undefined,
          ),
        700,
      );
    } else {
      tried.current = true;
      setWrong((w) => [...w, i]);
      s.react("miss");
      speak(promptFor(options[i]), { rate: 0.9 });
      setTimeout(() => setWrong((w) => w.filter((x) => x !== i)), 400);
    }
  };

  const cols =
    options.length <= 2
      ? "grid-cols-2"
      : options.length === 3
        ? "grid-cols-3"
        : "grid-cols-2";
  return (
    <div className={`grid ${cols} gap-4 w-full max-w-xl mx-auto`}>
      {options.map((it, i) => (
        <div
          key={it.text + i}
          className="relative animate-bounceIn"
          style={{ animationDelay: `${i * 90}ms` }}
        >
          {done === i && <Burst />}
          <Tile
            onClick={() => tap(i)}
            state={
              done === i
                ? "correct"
                : wrong.includes(i)
                  ? "retry"
                  : done !== null
                    ? "rest"
                    : "idle"
            }
            className={`w-full ${big ? "min-h-40" : "min-h-[104px]"} ${s.misses >= 2 && i === answer && done === null ? "ring-8 ring-sun animate-pulseSoft" : ""}`}
            ariaLabel={it.text}
          >
            {render(it)}
          </Tile>
        </div>
      ))}
    </div>
  );
}

/** Wires the shared per-question bits every tap game needs */
function useTap(
  q: Question,
  say: () => void,
  props: GameProps,
  auto: "auto" | "delay" = "auto",
) {
  const s = useScene({ say, onMiss: props.onMiss });
  useAutoSay(say, auto === "auto" ? props.mode : undefined);
  useEffect(() => {
    if (auto === "delay") {
      const id = setTimeout(say, 400);
      return () => clearTimeout(id);
    }
  }, [say, auto]);
  return s;
}

// -------- 1. HEAR → TAP: "Feed the frog" (letter sounds, sight words) --------
export function HearTap(props: GameProps) {
  const { q, onResult } = props;
  const say = useCallback(() => {
    const t = q.target;
    const isLetter = !!t.hint;
    speak(isLetter ? `${t.say}. ${t.say}. ${t.hint}` : t.text, {
      clipKey: isLetter ? `sound-${t.text}` : undefined,
    });
  }, [q]);
  const s = useTap(q, say, props, "delay");
  const isLetter = !!q.target.hint;
  return (
    <Scene
      kind="pond"
      s={s}
      stage={
        <div className="flex items-center gap-4">
          <Speaker onSpeak={say} pulse />
          {isLetter && (
            <span className="text-6xl" aria-hidden>
              {q.target.emoji}
            </span>
          )}
        </div>
      }
    >
      <Choices
        s={s}
        options={q.options}
        answer={q.answer}
        onResult={onResult}
        big
        render={(it) => (
          <span className="font-read text-[66px] leading-none">{it.text}</span>
        )}
      />
    </Scene>
  );
}

// -------- 2. PICTURE → WORD: "Feed the frog" ---------------------------------
export function PicWord(props: GameProps) {
  const { q, onResult } = props;
  const say = useCallback(() => speak(q.target.text), [q]);
  const s = useTap(q, say, props);
  return (
    <Scene
      kind="pond"
      s={s}
      stage={<PicCard emoji={q.target.emoji} onTap={say} size="lg" />}
    >
      <Choices
        s={s}
        options={q.options}
        answer={q.answer}
        onResult={onResult}
        render={(it) => (
          <span className="font-read text-[40px] leading-none">{it.text}</span>
        )}
      />
    </Scene>
  );
}

// -------- 3. WORD → PICTURE: "Feed the frog" ---------------------------------
export function WordPic(props: GameProps) {
  const { q, onResult } = props;
  const say = useCallback(() => speak(q.target.text), [q]);
  const s = useTap(q, say, props);
  return (
    <Scene
      kind="pond"
      s={s}
      stage={
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={say}
            className="font-read text-[40px] leading-none bg-card border-4 border-ink rounded-tile px-8 py-4 shadow-tile"
          >
            {q.target.text}
          </button>
          <Speaker onSpeak={say} size="lg" />
        </div>
      }
    >
      <Choices
        s={s}
        options={q.options}
        answer={q.answer}
        onResult={onResult}
        big
        render={(it) => <span className="text-7xl">{it.emoji}</span>}
      />
    </Scene>
  );
}

// -------- 4. BUILD THE WORD: "Build the house" (letters fill the slots) ------
export function BuildWord(props: GameProps) {
  const { q, onResult } = props;
  const word = q.target.text;
  const [placed, setPlaced] = useState<string[]>([]);
  const [used, setUsed] = useState<number[]>([]);
  const [retry, setRetry] = useState<number | null>(null);
  const tried = useRef(false);
  const letters = q.letters!;

  const sayWord = useCallback(() => speakSegmented(word), [word]);
  const s = useTap(q, sayWord, props, "delay");

  const tap = (i: number) => {
    if (used.includes(i)) return;
    const need = word[placed.length];
    if (letters[i] === need) {
      speak(letters[i], { rate: 0.9, clipKey: `sound-${letters[i]}` });
      const next = [...placed, letters[i]];
      setPlaced(next);
      setUsed([...used, i]);
      if (next.length === word.length) {
        s.react("ok");
        setTimeout(() => speak(word), 300);
        setTimeout(
          () => onResult(!tried.current, tried.current ? word : undefined),
          1100,
        );
      }
    } else {
      tried.current = true;
      setRetry(i);
      s.react("miss");
      setTimeout(() => setRetry(null), 400);
    }
  };

  const stage = (
    <div className="flex flex-col items-center gap-0 w-full">
      <div className="flex items-center gap-4">
        <PicCard emoji={q.target.emoji} onTap={sayWord} />
        <Speaker onSpeak={sayWord} size="lg" />
      </div>
      {/* roof + house body with one slot per letter */}
      <div
        aria-hidden
        className="mt-3 w-0 h-0 border-x-[96px] border-x-transparent border-b-[56px] border-b-tangerine drop-shadow-[0_4px_0_rgb(var(--c-ink))]"
      />
      <div className="bg-card border-4 border-ink rounded-card shadow-tile px-4 py-4 flex gap-3 justify-center -mt-1">
        {word.split("").map((_, i) => (
          <Tile
            key={i}
            state={placed[i] ? "correct" : "slot"}
            className="w-[84px] h-[104px] !shadow-none"
            ariaLabel={placed[i] ?? "Empty slot"}
          >
            <span className="font-read text-[64px] leading-none">
              {placed[i] ?? ""}
            </span>
          </Tile>
        ))}
      </div>
    </div>
  );

  return (
    <Scene kind="house" s={s} stage={stage}>
      <div className="flex flex-wrap justify-center gap-3 max-w-md">
        {letters.map((l, i) => (
          <Tile
            key={i}
            onClick={() => tap(i)}
            disabled={used.includes(i)}
            state={used.includes(i) ? "rest" : retry === i ? "retry" : "idle"}
            className="w-[88px] h-[104px]"
            ariaLabel={l}
          >
            <span className="font-read text-[64px] leading-none">{l}</span>
          </Tile>
        ))}
      </div>
    </Scene>
  );
}

// -------- 5. SENTENCE → PICTURE: "Feed the frog" with the sentence on a card -
export function SentencePic(props: GameProps) {
  const { q, onResult } = props;
  const say = useCallback(() => speak(q.target.text, { rate: 0.8 }), [q]);
  const s = useTap(q, say, props);
  const words = q.target.text.split(" ");
  return (
    <Scene
      kind="pond"
      s={s}
      stage={
        <div className="flex items-center gap-3 w-full justify-center">
          <div className="bg-card border-4 border-ink rounded-card shadow-tile px-5 py-4 flex flex-wrap justify-center gap-x-3 gap-y-1">
            {words.map((w, i) => (
              <button
                key={i}
                type="button"
                onClick={() => speak(w.replace(/\.$/, ""))}
                className="font-read text-[34px] leading-snug rounded-xl px-1 active:bg-sun"
              >
                {w}
              </button>
            ))}
          </div>
          <Speaker onSpeak={say} size="lg" />
        </div>
      }
    >
      <Choices
        s={s}
        options={q.options}
        answer={q.answer}
        onResult={onResult}
        big
        render={(it) => (
          <span className="text-6xl tracking-wider">{it.emoji}</span>
        )}
      />
    </Scene>
  );
}

// -------- 6. ORDER THE WORDS: "Word train" (crates fill the cars) ------------
export function OrderWords(props: GameProps) {
  const { q, onResult } = props;
  const target = q.target.text.replace(/\.$/, "").split(" ");
  const bank = q.words!;
  const [placed, setPlaced] = useState<number[]>([]);
  const [retry, setRetry] = useState<number | null>(null);
  const [go, setGo] = useState(false);
  const tried = useRef(false);
  const say = useCallback(() => speak(q.target.text, { rate: 0.8 }), [q]);
  const s = useTap(q, say, props, "delay");

  const tap = (i: number) => {
    if (placed.includes(i)) return;
    if (bank[i] === target[placed.length]) {
      speak(bank[i], { rate: 0.95 });
      const next = [...placed, i];
      setPlaced(next);
      if (next.length === target.length) {
        s.react("ok");
        setTimeout(say, 300);
        setTimeout(() => setGo(true), 700); // the whole train drives off reading the sentence
        setTimeout(
          () =>
            onResult(!tried.current, tried.current ? q.target.text : undefined),
          1400,
        );
      }
    } else {
      tried.current = true;
      setRetry(i);
      s.react("miss");
      setTimeout(() => setRetry(null), 400);
    }
  };

  const stage = (
    <div className="w-full flex flex-col items-center gap-3">
      <div className="flex items-center gap-3">
        <PicCard emoji={q.target.emoji} onTap={say} />
        <Speaker onSpeak={say} size="lg" />
      </div>
      <div
        className={`flex items-end gap-2 flex-wrap justify-center transition-transform duration-700 ease-in ${go ? "translate-x-[130%]" : ""}`}
      >
        <span className="text-6xl" aria-hidden>
          🚂
        </span>
        {target.map((_, i) => (
          <Tile
            key={i}
            state={placed[i] !== undefined ? "correct" : "slot"}
            className="min-w-[88px] h-[88px] px-3 !shadow-none"
            ariaLabel={placed[i] !== undefined ? bank[placed[i]] : "Empty car"}
          >
            <span className="font-read text-[34px] leading-none">
              {placed[i] !== undefined ? bank[placed[i]] : ""}
            </span>
          </Tile>
        ))}
      </div>
    </div>
  );

  return (
    <Scene kind="train" s={s} stage={stage}>
      <div className="flex flex-wrap gap-3 justify-center max-w-xl">
        {bank.map((w, i) => (
          <Tile
            key={i}
            onClick={() => tap(i)}
            disabled={placed.includes(i)}
            state={placed.includes(i) ? "rest" : retry === i ? "retry" : "idle"}
            className="px-5 min-h-[88px] min-w-[88px]"
            ariaLabel={w}
          >
            <span className="font-read text-[34px] leading-none">{w}</span>
          </Tile>
        ))}
      </div>
    </Scene>
  );
}

// -------- 7. STORY KARAOKE ----------------------------------------------------
// Listen: the line is read and each word lights up in turn. Me-read: the finger guide moves as you tap each word; "Done!" always counts.
const wordMs = (w: string) => 260 + w.length * 70;

export function Story({
  story,
  onResult,
  mode,
}: {
  story: StoryItem;
  onResult: GameProps["onResult"];
  mode?: ReaderMode;
}) {
  const [page, setPage] = useState(0); // 0..lines.length-1 then question
  const [listen, setListen] = useState(mode !== "read");
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(-1); // highlighted word
  const [wrong, setWrong] = useState<number | null>(null);
  const [right, setRight] = useState<number | null>(null);
  const tried = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const atQuestion = page >= story.lines.length;
  const text = atQuestion ? story.question : story.lines[page];
  const words = text.split(" ");
  const s = useScene({});

  const stop = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPlaying(false);
  }, []);
  // Reads the whole line while moving the highlight word by word.
  const readAloud = useCallback(() => {
    stop();
    setPlaying(true);
    speak(text, { rate: 0.8 });
    let t = 200;
    words.forEach((w, i) => {
      timers.current.push(setTimeout(() => setCur(i), t));
      t += wordMs(w);
    });
    timers.current.push(
      setTimeout(() => {
        setPlaying(false);
        setCur(-1);
      }, t + 100),
    );
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setCur(listen && !atQuestion ? -1 : 0);
    const id = setTimeout(() => {
      if (listen || atQuestion) readAloud();
      else speak(text, { rate: 0.8 });
    }, 400);
    return () => {
      clearTimeout(id);
      stop();
    };
  }, [page, listen]); // eslint-disable-line react-hooks/exhaustive-deps

  const tapWord = (i: number) => {
    speak(words[i].replace(/[.!?,"”]/g, ""));
    if (!listen && !atQuestion) setCur(Math.min(i + 1, words.length - 1));
  };
  const answer = (i: number) => {
    if (right !== null) return;
    if (i === story.answer) {
      setRight(i);
      s.react("ok");
      speak("Yes!");
      setTimeout(
        () => onResult(!tried.current, tried.current ? story.title : undefined),
        700,
      );
    } else {
      tried.current = true;
      setWrong(i);
      s.react("miss");
      speak(story.options[i]);
      setTimeout(() => setWrong(null), 400);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="relative w-full max-w-xl rounded-card border-4 border-ink bg-card shadow-tile py-5 flex items-center justify-center">
        <span className="text-[96px] leading-none animate-float" aria-hidden>
          {story.emoji}
        </span>
        <span className="absolute -top-8 -right-2">
          <Mascot
            size={72}
            mood={
              atQuestion
                ? s.reaction === "ok"
                  ? "cheer"
                  : s.reaction === "miss"
                    ? "curious"
                    : "happy"
                : playing
                  ? "talk"
                  : "happy"
            }
          />
        </span>
      </div>
      <div className="bg-card border-4 border-ink rounded-card shadow-tile px-5 py-6 w-full max-w-xl min-h-36 flex flex-wrap justify-center items-center gap-x-2 gap-y-3">
        {words.map((w, i) => (
          <button
            key={i}
            type="button"
            onClick={() => tapWord(i)}
            className={`relative font-read text-[34px] leading-snug rounded-xl px-2 border-4 ${i === cur ? "bg-sun border-ink" : "border-transparent"}`}
          >
            {w}
            {!listen && !atQuestion && i === cur && (
              <Hand
                aria-hidden
                className="absolute left-1/2 -bottom-9 -translate-x-1/2 w-8 h-8 text-ink animate-float"
                strokeWidth={2.5}
              />
            )}
          </button>
        ))}
      </div>

      {!atQuestion ? (
        <div className="flex items-center gap-4 flex-wrap justify-center">
          {/* [headphones listen | hand me-read] */}
          <div
            className="flex rounded-full border-4 border-ink bg-card overflow-hidden"
            role="group"
            aria-label="Who reads?"
          >
            <button
              type="button"
              aria-pressed={listen}
              aria-label="Listen"
              onClick={() => setListen(true)}
              className={`w-[72px] h-[72px] flex items-center justify-center ${listen ? "bg-sun" : ""}`}
            >
              <Headphones className="w-9 h-9" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              aria-pressed={!listen}
              aria-label="Me read"
              onClick={() => setListen(false)}
              className={`w-[72px] h-[72px] flex items-center justify-center ${!listen ? "bg-sun" : ""}`}
            >
              <Hand className="w-9 h-9" strokeWidth={2.5} />
            </button>
          </div>
          {listen ? (
            <RoundButton
              onClick={playing ? stop : readAloud}
              ariaLabel={playing ? "Pause" : "Play"}
              color="sun"
              size="xl"
            >
              {playing ? (
                <Pause className="w-12 h-12 fill-ink" strokeWidth={3} />
              ) : (
                <Play className="w-12 h-12 fill-ink" strokeWidth={3} />
              )}
            </RoundButton>
          ) : (
            <RoundButton
              onClick={() => setPage(page + 1)}
              ariaLabel="Done"
              color="grass"
              label="Done!"
            >
              <Check className="w-9 h-9" strokeWidth={4} />
            </RoundButton>
          )}
          {listen && (
            <RoundButton
              onClick={() => setPage(page + 1)}
              ariaLabel="Next page"
              color="grass"
              size="lg"
            >
              <ArrowRight className="w-10 h-10" strokeWidth={3} />
            </RoundButton>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 w-full max-w-xl">
          {story.options.map((o, i) => (
            <Tile
              key={o}
              onClick={() => answer(i)}
              state={
                right === i
                  ? "correct"
                  : wrong === i
                    ? "retry"
                    : right !== null
                      ? "rest"
                      : "idle"
              }
              className="min-h-[104px] px-2"
              ariaLabel={o}
            >
              <span className="font-read text-[28px] leading-tight">{o}</span>
            </Tile>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        {story.lines.map((_, i) => (
          <span
            key={i}
            className={`w-[18px] h-[18px] rounded-full border-[3px] border-ink ${i < page ? "bg-grass" : i === page ? "bg-sun" : "bg-card/55"}`}
          />
        ))}
      </div>
    </div>
  );
}

// -------- 8. FIRST SOUND: hear a word, tap the letter it starts with --------
export function FirstSound(props: GameProps) {
  const { q, onResult } = props;
  const say = useCallback(() => speak(q.target.text), [q]);
  const s = useTap(q, say, props, "delay");
  return (
    <Scene
      kind="pond"
      s={s}
      stage={
        <div className="flex items-center gap-4">
          <PicCard emoji={q.target.emoji} onTap={say} />
          <Speaker onSpeak={say} size="lg" pulse />
        </div>
      }
    >
      <Choices
        s={s}
        options={q.options}
        answer={q.answer}
        onResult={onResult}
        big
        render={(it) => (
          <span className="font-read text-[66px] leading-none">{it.text}</span>
        )}
      />
    </Scene>
  );
}

// -------- 9. RHYME: tap the picture that rhymes with the one shown ----------
export function Rhyme(props: GameProps) {
  const { q, onResult } = props;
  const say = useCallback(() => speak(q.target.text), [q]);
  const s = useTap(q, say, props, "delay");
  return (
    <Scene
      kind="pond"
      s={s}
      stage={
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <PicCard emoji={q.target.emoji} onTap={say} />
            <span className="font-read text-2xl">{q.target.text}</span>
          </div>
          <Speaker onSpeak={say} size="lg" pulse />
        </div>
      }
    >
      <Choices
        s={s}
        options={q.options}
        answer={q.answer}
        onResult={onResult}
        big
        render={(it) => (
          <span className="flex flex-col items-center gap-1">
            <span className="text-7xl leading-none">{it.emoji}</span>
            <span className="font-read text-xl">{it.text}</span>
          </span>
        )}
      />
    </Scene>
  );
}

// -------- 10. CAPITAL → small letter ---------------------------------------
export function CaseMatch(props: GameProps) {
  const { q, onResult } = props;
  const say = useCallback(
    () =>
      speak(q.target.say ?? q.target.text, {
        clipKey: `sound-${q.target.text}`,
      }),
    [q],
  );
  const s = useTap(q, say, props);
  return (
    <Scene
      kind="meadow"
      s={s}
      stage={
        <Tile
          color="sun"
          onClick={say}
          ariaLabel="Capital letter"
          className="w-40 h-40"
        >
          <span className="font-read text-[96px] leading-none">
            {q.target.text.toUpperCase()}
          </span>
        </Tile>
      }
    >
      <Choices
        s={s}
        options={q.options}
        answer={q.answer}
        onResult={onResult}
        big
        render={(it) => (
          <span className="font-read text-[66px] leading-none">{it.text}</span>
        )}
      />
    </Scene>
  );
}

// -------- 11. BLEND-TAP: "Slide to blend" (hear separate sounds, slide, tap the picture) ----
const soundOf = (c: string) => LETTER_BY_CHAR[c]?.say ?? c;
export function BlendTap(props: GameProps) {
  const { q, onResult } = props;
  const letters = q.target.text.split("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const last = useRef(-1);
  const [lit, setLit] = useState(-1);
  const [solved, setSolved] = useState(false);
  const bead = (c: string) =>
    speak(soundOf(c), { rate: 0.8, clipKey: `sound-${c}` });
  // Say each sound on its own (never the whole word: the child blends it).
  const say = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = letters.flatMap((c, i) => [
      setTimeout(() => {
        bead(c);
        setLit(i);
      }, i * 800),
      setTimeout(() => setLit(-1), i * 800 + 600),
    ]);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  const s = useScene({ say, onMiss: props.onMiss });
  useEffect(() => {
    const id = setTimeout(say, 400);
    return () => {
      clearTimeout(id);
      timers.current.forEach(clearTimeout);
    };
  }, [say]);

  // Sliding a finger along the track plays each bead's sound as it is crossed: slide speed = blend speed.
  const slide = (e: React.PointerEvent) => {
    if (e.buttons === 0 && e.pointerType === "mouse") return;
    const el = document.elementFromPoint(
      e.clientX,
      e.clientY,
    ) as HTMLElement | null;
    const i = Number(
      el?.closest("[data-bead]")?.getAttribute("data-bead") ?? -1,
    );
    if (i >= 0 && i !== last.current) {
      last.current = i;
      setLit(i);
      bead(letters[i]);
    }
  };

  const stage = (
    <div className="w-full flex flex-col items-center gap-3">
      <div className="flex items-center gap-4">
        <div
          className="w-36 h-36 rounded-card border-4 border-ink bg-card flex items-center justify-center text-[5rem]"
          aria-label="Mystery picture"
        >
          {solved ? (
            <span className="animate-pop">{q.target.emoji}</span>
          ) : (
            <span className="animate-float">☁️</span>
          )}
        </div>
        <Speaker onSpeak={say} size="lg" pulse />
      </div>
      <div
        onPointerMove={slide}
        onPointerDown={slide}
        onPointerUp={() => {
          last.current = -1;
          setLit(-1);
        }}
        style={{ touchAction: "none" }}
        className="flex gap-2 bg-card/80 border-4 border-ink rounded-full px-3 py-2"
      >
        {letters.map((c, i) => (
          <button
            key={i}
            type="button"
            data-bead={i}
            onClick={() => bead(c)}
            aria-label={c}
            className={`w-[80px] h-[88px] rounded-full border-4 border-ink flex items-center justify-center font-read text-[64px] leading-none transition-transform ${lit === i ? "bg-sun scale-110" : "bg-grass/70"}`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Scene kind="meadow" s={s} stage={stage}>
      <Choices
        s={s}
        options={q.options}
        answer={q.answer}
        onResult={onResult}
        big
        onCorrect={() => setSolved(true)}
        render={(it) => <span className="text-7xl">{it.emoji}</span>}
      />
    </Scene>
  );
}

// -------- 12. FILL THE GAP ---------------------------------------------------
export function FillBlank(props: GameProps) {
  const { q, onResult } = props;
  const focus = q.focus!;
  const words = q.target.text.split(" ");
  const [filled, setFilled] = useState<string | null>(null);
  // The spoken prompt must not give the answer away.
  const say = useCallback(
    () =>
      speak(q.target.text.replace(new RegExp(`\\b${focus}\\b`), "blank"), {
        rate: 0.8,
      }),
    [q, focus],
  );
  const s = useTap(q, say, props);
  return (
    <Scene
      kind="meadow"
      s={s}
      stage={
        <div className="flex flex-col items-center gap-3 w-full">
          <span className="text-6xl" aria-hidden>
            {q.target.emoji}
          </span>
          <div className="flex items-center gap-3 w-full justify-center">
            <div className="bg-card border-4 border-ink rounded-card shadow-tile px-5 py-4 flex flex-wrap justify-center items-center gap-x-3 gap-y-2">
              {words.map((w, i) =>
                i === words.length - 1 ? (
                  <Tile
                    key={i}
                    state={filled ? "correct" : "slot"}
                    className="min-w-[96px] h-[72px] px-3 !shadow-none"
                  >
                    <span className="font-read text-[34px] leading-none">
                      {filled ?? "?"}
                      {w.endsWith(".") ? "." : ""}
                    </span>
                  </Tile>
                ) : (
                  <span key={i} className="font-read text-[34px] leading-snug">
                    {w}
                  </span>
                ),
              )}
            </div>
            <Speaker onSpeak={say} size="lg" />
          </div>
        </div>
      }
    >
      <Choices
        s={s}
        options={q.options}
        answer={q.answer}
        onResult={onResult}
        big
        onCorrect={(i) => setFilled(q.options[i].text)}
        render={(it) => (
          <span className="font-read text-[40px] leading-none">{it.text}</span>
        )}
      />
    </Scene>
  );
}

// -------- 13. SYLLABLE-TAP: tap the chunks of a long word in order ----------
export function SyllableTap(props: GameProps) {
  const { q, onResult } = props;
  const parts = q.target.hint!.split("-");
  const bank = q.chunks!;
  const [placed, setPlaced] = useState<number[]>([]);
  const [retry, setRetry] = useState<number | null>(null);
  const tried = useRef(false);
  const say = useCallback(() => speak(q.target.text, { rate: 0.8 }), [q]);
  const s = useTap(q, say, props, "delay");

  const tap = (i: number) => {
    if (placed.includes(i)) return;
    if (bank[i] === parts[placed.length]) {
      speak(bank[i], { rate: 0.85 });
      const next = [...placed, i];
      setPlaced(next);
      if (next.length === parts.length) {
        s.react("ok");
        setTimeout(say, 500);
        setTimeout(
          () =>
            onResult(!tried.current, tried.current ? q.target.text : undefined),
          1500,
        );
      }
    } else {
      tried.current = true;
      setRetry(i);
      s.react("miss");
      setTimeout(() => setRetry(null), 400);
    }
  };

  return (
    <Scene
      kind="meadow"
      s={s}
      stage={
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="flex items-center gap-4">
            <PicCard emoji={q.target.emoji} onTap={say} />
            <Speaker onSpeak={say} size="lg" />
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            {parts.map((_, i) => (
              <Tile
                key={i}
                state={placed[i] !== undefined ? "correct" : "slot"}
                className="min-w-[112px] h-[96px] px-3 !shadow-none"
              >
                <span className="font-read text-[40px] leading-none">
                  {placed[i] !== undefined ? bank[placed[i]] : ""}
                </span>
              </Tile>
            ))}
          </div>
        </div>
      }
    >
      <div className="flex flex-wrap justify-center gap-3 max-w-md">
        {bank.map((c, i) => (
          <Tile
            key={i}
            onClick={() => tap(i)}
            disabled={placed.includes(i)}
            state={placed.includes(i) ? "rest" : retry === i ? "retry" : "idle"}
            className="px-5 min-h-[96px] min-w-[96px]"
            ariaLabel={c}
          >
            <span className="font-read text-[40px] leading-none">{c}</span>
          </Tile>
        ))}
      </div>
    </Scene>
  );
}

// -------- 14. WORD HUNT: hear a word, find it in the sentence ----------------
export function WordHunt(props: GameProps) {
  const { q, onResult } = props;
  const words = q.words!;
  const focus = q.focus!;
  const [wrong, setWrong] = useState<number | null>(null);
  const [found, setFound] = useState<number | null>(null);
  const tried = useRef(false);
  const say = useCallback(() => speak(focus), [focus]);
  const s = useTap(q, say, props, "delay");

  const tap = (i: number) => {
    if (found !== null) return;
    if (words[i] === focus) {
      setFound(i);
      s.react("ok");
      speak(focus);
      setTimeout(
        () => onResult(!tried.current, tried.current ? focus : undefined),
        700,
      );
    } else {
      tried.current = true;
      setWrong(i);
      s.react("miss");
      speak(words[i]);
      setTimeout(() => setWrong(null), 400);
    }
  };

  return (
    <Scene
      kind="meadow"
      s={s}
      stage={
        <div className="flex items-center gap-4">
          <PicCard emoji={q.target.emoji} onTap={say} />
          <Speaker onSpeak={say} size="lg" pulse />
        </div>
      }
    >
      <div className="flex flex-wrap justify-center gap-3 max-w-xl">
        {words.map((w, i) => (
          <div key={i} className="relative">
            {found === i && <Burst />}
            <Tile
              onClick={() => tap(i)}
              state={
                found === i
                  ? "correct"
                  : wrong === i
                    ? "retry"
                    : found !== null
                      ? "rest"
                      : "idle"
              }
              className={`px-5 min-h-[88px] min-w-[88px] ${s.misses >= 2 && w === focus && found === null ? "ring-8 ring-sun animate-pulseSoft" : ""}`}
              ariaLabel={w}
            >
              <span className="font-read text-[34px] leading-none">{w}</span>
            </Tile>
          </div>
        ))}
      </div>
    </Scene>
  );
}

// -------- dispatcher for every one-question game (story has its own props) ----
export function Game({ q, onResult, mode, onMiss }: GameProps) {
  const p = { q, onResult, mode, onMiss };
  switch (q.kind) {
    case "hear-tap":
      return <HearTap {...p} />;
    case "pic-word":
      return <PicWord {...p} />;
    case "word-pic":
      return <WordPic {...p} />;
    case "build-word":
      return <BuildWord {...p} />;
    case "sentence-pic":
      return <SentencePic {...p} />;
    case "order-words":
      return <OrderWords {...p} />;
    case "first-sound":
      return <FirstSound {...p} />;
    case "rhyme":
      return <Rhyme {...p} />;
    case "case-match":
      return <CaseMatch {...p} />;
    case "blend-tap":
      return <BlendTap {...p} />;
    case "fill-blank":
      return <FillBlank {...p} />;
    case "syllable-tap":
      return <SyllableTap {...p} />;
    case "word-hunt":
      return <WordHunt {...p} />;
    default:
      return null; // 'story' is rendered by <Story>
  }
}
