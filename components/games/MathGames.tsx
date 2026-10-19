"use client";
import { useCallback, useRef, useState } from "react";
import { speak } from "@/lib/speech";
import { numWord } from "@/lib/mathEngine";
import { Tile } from "../ui";
import { Speaker } from "../Speaker";
import { Scene } from "./Scene";
import { Choices, useTap, type GameProps } from "./Games";

// Number Land: the maths games. Every prompt is spoken on arrival (numbers never need reading),
// every tap speaks the number it touches, a miss wiggles and retries. Same props and
// reporting contract as the reading games: onResult(firstTry, missedText?).

const numeralTile = (text: string) => <span className="font-read text-[66px] leading-none">{text}</span>;

/** A row of n emoji, shrinking as the group grows. `faded` of them (from the end) are greyed out: they flew away. */
function Emojis({ emoji, n, faded = 0, big }: { emoji: string; n: number; faded?: number; big?: boolean }) {
  const size = n <= 5 ? (big ? "text-6xl" : "text-5xl") : n <= 10 ? (big ? "text-5xl" : "text-4xl") : "text-3xl";
  return (
    <span className={`flex flex-wrap justify-center gap-x-1 leading-tight ${size}`} aria-label={`${n}`}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} aria-hidden className={i >= n - faded ? "opacity-25 grayscale" : ""}>
          {emoji}
        </span>
      ))}
    </span>
  );
}

// -------- COUNT: tap every object, hearing 1, 2, 3 … then pick the numeral ---------------
export function CountTap(props: GameProps) {
  const { q, onResult } = props;
  const n = q.count ?? Number(q.target.text);
  const [counted, setCounted] = useState<number[]>([]);
  const say = useCallback(() => speak("How many? Tap and count!"), []);
  const s = useTap(q, say, props, "delay");
  const tapObject = (i: number) => {
    if (counted.includes(i)) return;
    const next = [...counted, i];
    setCounted(next);
    speak(numWord(next.length), { rate: 0.9 });
  };
  return (
    <Scene
      kind="shop"
      s={s}
      stage={
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="flex flex-wrap justify-center gap-2 pt-3">
            {Array.from({ length: n }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => tapObject(i)}
                aria-label={`Count ${i + 1}`}
                className={`${n <= 5 ? "text-6xl" : n <= 10 ? "text-5xl" : "text-4xl"} leading-none p-1 rounded-tile transition-transform ${counted.includes(i) ? "animate-pop bg-sun/60" : "active:scale-90"}`}
              >
                {q.target.emoji}
              </button>
            ))}
          </div>
          <Speaker onSpeak={say} size="lg" />
        </div>
      }
    >
      <Choices s={s} options={q.options} answer={q.answer} onResult={onResult} big render={(it) => numeralTile(it.text)} />
    </Scene>
  );
}

// -------- HEAR A NUMBER: tap the numeral ---------------------------------------------------
export function HearNum(props: GameProps) {
  const { q, onResult } = props;
  const say = useCallback(() => speak(`Find ${q.target.say ?? q.target.text}`), [q]);
  const s = useTap(q, say, props, "delay");
  return (
    <Scene kind="shop" s={s} stage={<Speaker onSpeak={say} pulse />}>
      <Choices s={s} options={q.options} answer={q.answer} onResult={onResult} big render={(it) => numeralTile(it.text)} />
    </Scene>
  );
}

// -------- SHOW ME: see a numeral, tap the group with that many ------------------------------------
export function NumGroup(props: GameProps) {
  const { q, onResult } = props;
  const say = useCallback(() => speak(`Bulbul wants ${q.target.say ?? q.target.text}! Find ${q.target.say ?? q.target.text}.`), [q]);
  const s = useTap(q, say, props, "delay");
  return (
    <Scene
      kind="farm"
      s={s}
      stage={
        <div className="flex items-center gap-4">
          <Tile color="sun" onClick={say} ariaLabel={q.target.text} className="w-[clamp(96px,17dvh,144px)] h-[clamp(96px,17dvh,144px)]">
            <span className="font-read text-[clamp(3.5rem,10dvh,6rem)] leading-none">{q.target.text}</span>
          </Tile>
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
        render={(it) => <Emojis emoji={q.target.emoji} n={Number(it.text)} />}
      />
    </Scene>
  );
}

// -------- BIGGER / FEWER: two groups side by side ----------------------------------------------------
export function Compare(props: GameProps) {
  const { q, onResult } = props;
  const fewer = q.focus === "fewer";
  const say = useCallback(() => speak(fewer ? "Which has fewer?" : "Which has more?"), [fewer]);
  const s = useTap(q, say, props, "delay");
  return (
    <Scene
      kind="zoo"
      s={s}
      stage={
        <div className="flex items-center gap-4">
          <Speaker onSpeak={say} pulse />
          <span className="font-read text-4xl bg-card border-4 border-ink rounded-tile px-6 py-2 shadow-tile">{fewer ? "fewer?" : "more?"}</span>
        </div>
      }
    >
      <Choices
        s={s}
        options={q.options}
        answer={q.answer}
        onResult={onResult}
        big
        render={(it) => <Emojis emoji={q.target.emoji} n={Number(it.text)} />}
      />
    </Scene>
  );
}

// -------- ADD / FLY AWAY: pictures join or leave, pick the answer ---------------------------------------
export function AddSub(props: GameProps & { op: "+" | "-" }) {
  const { q, onResult, op } = props;
  const a = q.a ?? 1;
  const b = q.b ?? 1;
  const emoji = q.target.emoji;
  const say = useCallback(
    () => speak(op === "+" ? `${numWord(a)} and ${numWord(b)}. How many altogether?` : `${numWord(a)}. ${numWord(b)} fly away. How many are left?`),
    [a, b, op],
  );
  const s = useTap(q, say, props, "delay");
  return (
    <Scene
      kind={op === "+" ? "bakery" : "island"}
      s={s}
      stage={
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="flex items-center justify-center gap-3 flex-wrap pt-3">
            {op === "+" ? (
              <>
                <Emojis emoji={emoji} n={a} big />
                <span className="font-read text-5xl" aria-label="plus">+</span>
                <Emojis emoji={emoji} n={b} big />
              </>
            ) : (
              <Emojis emoji={emoji} n={a} faded={b} big />
            )}
          </div>
          <Speaker onSpeak={say} size="lg" />
        </div>
      }
    >
      <Choices s={s} options={q.options} answer={q.answer} onResult={onResult} big render={(it) => numeralTile(it.text)} />
    </Scene>
  );
}

// -------- IN ORDER: tap the numbers smallest to biggest ---------------------------------------------------
export function NumSeq(props: GameProps) {
  const { q, onResult } = props;
  const bank = q.chunks ?? [];
  const sorted = [...bank].sort((x, y) => Number(x) - Number(y));
  const [placed, setPlaced] = useState<number[]>([]);
  const [retry, setRetry] = useState<number | null>(null);
  const tried = useRef(false);
  const say = useCallback(() => speak("Tap the numbers, smallest first!"), []);
  const s = useTap(q, say, props, "delay");
  const tap = (i: number) => {
    if (placed.includes(i)) return;
    if (bank[i] === sorted[placed.length]) {
      speak(numWord(Number(bank[i])), { rate: 0.9 });
      const next = [...placed, i];
      setPlaced(next);
      if (next.length === sorted.length) {
        s.react("ok");
        setTimeout(() => onResult(!tried.current, tried.current ? sorted.join(" ") : undefined), 800);
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
      kind="island"
      s={s}
      stage={
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="flex items-end gap-2 flex-wrap justify-center pt-3">
            {sorted.map((v, i) => (
              <Tile key={i} state={placed[i] !== undefined ? "correct" : "slot"} className="min-w-[80px] h-[80px] px-3 !shadow-none" ariaLabel={placed[i] !== undefined ? v : "Empty stone"}>
                <span className="font-read text-[40px] leading-none">{placed[i] !== undefined ? v : ""}</span>
              </Tile>
            ))}
          </div>
          <Speaker onSpeak={say} size="lg" />
        </div>
      }
    >
      <div className="flex flex-wrap gap-3 justify-center max-w-xl">
        {bank.map((v, i) => (
          <Tile
            key={i}
            onClick={() => tap(i)}
            disabled={placed.includes(i)}
            state={placed.includes(i) ? "rest" : retry === i ? "retry" : "idle"}
            className="px-5 min-h-[96px] min-w-[96px]"
            ariaLabel={v}
          >
            <span className="font-read text-[56px] leading-none">{v}</span>
          </Tile>
        ))}
      </div>
    </Scene>
  );
}

// -------- MISSING NUMBER: a row of stepping stones with one gap -------------------------------------------------
export function MissingNum(props: GameProps) {
  const { q, onResult } = props;
  const seq = q.seq ?? [];
  const [found, setFound] = useState(false);
  const say = useCallback(() => speak(`${seq.map((v) => (v === q.focus ? "what" : numWord(Number(v)))).join(", ")}. Which number is missing?`), [seq, q.focus]);
  const s = useTap(q, say, props, "delay");
  return (
    <Scene
      kind="rocket"
      s={s}
      stage={
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="flex items-end gap-2 flex-wrap justify-center pt-3">
            {seq.map((v, i) => (
              <Tile
                key={i}
                color="card"
                state={v === q.focus ? (found ? "correct" : "slot") : "idle"}
                className="min-w-[72px] h-[88px] px-3 !shadow-none"
                ariaLabel={v === q.focus && !found ? "Missing number" : v}
              >
                <span className="font-read text-[40px] leading-none">{v === q.focus && !found ? "?" : v}</span>
              </Tile>
            ))}
          </div>
          <Speaker onSpeak={say} size="lg" />
        </div>
      }
    >
      <Choices s={s} options={q.options} answer={q.answer} onResult={onResult} onCorrect={() => setFound(true)} big render={(it) => numeralTile(it.text)} />
    </Scene>
  );
}

/** Dispatcher for the maths game types (the reading `<Game>` ignores them). */
export function MathGame({ q, onResult, mode, onMiss }: GameProps) {
  const p = { q, onResult, mode, onMiss };
  switch (q.kind) {
    case "count-tap":
      return <CountTap {...p} />;
    case "hear-num":
      return <HearNum {...p} />;
    case "num-group":
      return <NumGroup {...p} />;
    case "compare":
      return <Compare {...p} />;
    case "add-pics":
      return <AddSub {...p} op="+" />;
    case "sub-pics":
      return <AddSub {...p} op="-" />;
    case "num-seq":
      return <NumSeq {...p} />;
    case "missing-num":
      return <MissingNum {...p} />;
    default:
      return null;
  }
}
