"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CarouselDots, GameCard, RoundButton, SurpriseButton } from "./ui";
import { Mascot, type Hat } from "./Mascot";
import { speak } from "@/lib/speech";
import { starsOf, type HomeGame } from "@/lib/content/games";
import type { LessonProgress } from "@/lib/db";

const wrap = (i: number, n: number) => ((i % n) + n) % n;

/** Free-play carousel: no locks, no order. Swipe, arrows, dots, tap a card or spin Surprise. Bulbul talks above Surprise. */
export function PlayCarousel({
  games,
  progress,
  startIndex,
  hat,
  reduced,
  onIndexChange,
  onPlay,
}: {
  games: HomeGame[];
  progress: LessonProgress[];
  startIndex: number;
  hat: Hat;
  reduced: boolean;
  onIndexChange: (i: number) => void;
  onPlay: (g: HomeGame) => void;
}) {
  const n = games.length;
  const [idx, setIdx] = useState(wrap(startIndex, n));
  const [spinning, setSpinning] = useState(false);
  const [landed, setLanded] = useState(false);
  const [dice, setDice] = useState(0);
  const [wide, setWide] = useState(false); // tablet landscape: three full cards
  const [k, setK] = useState(1); // stage scale: cards are designed at 400px tall and shrink to fit short screens
  const stage = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const x0 = useRef(0);
  const swiped = useRef(false);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setK(Math.min(1, Math.max(0.4, el.clientHeight / 400))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const go = useCallback(
    (i: number) => {
      const w = wrap(i, n);
      setIdx(w);
      setLanded(false);
      onIndexChange(w);
    },
    [n, onIndexChange],
  );

  const step = useCallback(
    (d: number) => {
      if (!spinning) go(idx + d);
    },
    [spinning, go, idx],
  );

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [step]);

  const announce = (g: HomeGame) =>
    speak(`Yay! Let's play ${g.name}!`, { clipKey: `yay-${g.id}` });

  const surprise = () => {
    if (spinning) return;
    setDice((d) => d + 1);
    setLanded(false);
    const total = 9 + Math.floor(Math.random() * n);
    if (reduced) {
      const to = wrap(idx + total, n);
      go(to);
      setLanded(true);
      announce(games[to]);
      return;
    }

    setSpinning(true);

    let t = 0,
      cur = idx;
    const tick = () => {
      t++;
      cur = wrap(cur + 1, n);
      setIdx(cur);
      if (t < total) timer.current = setTimeout(tick, 60 + t * t * 2.2);
      else {
        setSpinning(false);
        setLanded(true);
        onIndexChange(cur);
        announce(games[cur]);
      }
    };
    timer.current = setTimeout(tick, 60);
  };

  const tap = (i: number) => {
    if (swiped.current || spinning) return;
    if (i !== idx) go(i);
    else onPlay(games[i]);
  };

  const gap = (wide ? 300 : 250) * k;
  const mascotSize = Math.round(56 + 36 * k);
  const msg = spinning
    ? "Hmm… which one?"
    : landed
      ? `Yay! Let's play ${games[idx].name}!`
      : "Pick any game — or spin!";

  return (
    <div className="flex-1 min-h-0 w-full flex flex-col items-center select-none">
      <div
        className="relative flex-1 min-h-0 w-full flex flex-col items-center gap-[clamp(4px,1.5dvh,20px)] touch-pan-y"
        onPointerDown={(e) => {
          x0.current = e.clientX;
          swiped.current = false;
        }}
        onPointerUp={(e) => {
          const dx = e.clientX - x0.current;
          if (Math.abs(dx) > 40) {
            swiped.current = true;
            step(dx < 0 ? 1 : -1);
          }
        }}
      >
        <div
          ref={stage}
          className="relative w-full flex-1 min-h-0 overflow-hidden"
          aria-roledescription="carousel"
        >
          {games.map((g, i) => {
            let off = i - idx;
            if (off > n / 2) off -= n;
            if (off < -n / 2) off += n;
            const abs = Math.abs(off);
            const sc = (off === 0 ? (landed ? 1.06 : 1) : wide ? 0.92 : 0.82) * k;
            const op = abs > 1 ? 0 : off === 0 ? 1 : wide ? 0.9 : 0.55;
            return (
              <div
                key={g.id}
                className="absolute left-1/2 top-1/2 -ml-[130px] -mt-[196px]"
                aria-hidden={abs > 1}
                style={{
                  transform: `translateX(${off * gap}px) scale(${sc})`,
                  opacity: op,
                  zIndex: 10 - abs,
                  pointerEvents: abs > 1 ? "none" : "auto",
                  transition: reduced
                    ? "opacity .2s"
                    : "transform .38s cubic-bezier(.3,1.5,.5,1), opacity .3s",
                }}
              >
                <GameCard
                  name={g.name}
                  emoji={g.emoji}
                  color={g.color}
                  stars={starsOf(g, progress)}
                  isNew={g.isNew}
                  active={off === 0}
                  onClick={() => tap(i)}
                />
              </div>
            );
          })}
        </div>
        <div className="shrink-0 w-full max-w-md md:max-w-3xl flex items-center justify-between">
          <RoundButton
            onClick={() => step(-1)}
            ariaLabel="Previous game"
            color="card"
          >
            <ChevronLeft className="w-[34px] h-[34px]" strokeWidth={3.5} />
          </RoundButton>
          <CarouselDots
            total={n}
            current={idx}
            onSelect={(i) => {
              if (!spinning) go(i);
            }}
          />
          <RoundButton
            onClick={() => step(1)}
            ariaLabel="Next game"
            color="card"
          >
            <ChevronRight className="w-[34px] h-[34px]" strokeWidth={3.5} />
          </RoundButton>
        </div>
      </div>

      <div className="relative shrink-0 w-full max-w-md md:max-w-2xl flex items-end gap-3 pt-1">
        <span
          role="status"
          aria-live="polite"
          style={{ bottom: mascotSize + 12 }}
          className="absolute left-1 max-w-[200px] md:max-w-[260px] bg-card border-4 border-ink rounded-[22px_22px_22px_6px] px-3.5 py-2.5 font-ui font-semibold text-[19px] leading-[1.15] shadow-tileSm"
        >
          {msg}
        </span>
        <Mascot
          size={mascotSize}
          mood={spinning ? "dance" : landed ? "cheer" : "curious"}
          hat={hat}
        />
        <SurpriseButton
          onClick={surprise}
          turns={dice}
          disabled={spinning}
          reduced={reduced}
        />
        <span className="w-[52px] shrink-0" aria-hidden />
      </div>
    </div>
  );
}
