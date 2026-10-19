"use client";
import Link from "next/link";
import { type CSSProperties, type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  House,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";

const colorBg: Record<string, string> = {
  sun: "bg-sun",
  tangerine: "bg-tangerine",
  grass: "bg-grass",
  berry: "bg-berry",
  bubblegum: "bg-bubblegum",
  sky: "bg-sky",
  paper: "bg-card",
  card: "bg-card",
};

export type TileState = "idle" | "correct" | "retry" | "slot" | "rest" | "lift";

/** Small white badge with a check: colour never carries "correct" alone */
export function CheckBadge({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`absolute -top-3 -right-3 w-9 h-9 rounded-full bg-card border-[3px] border-ink flex items-center justify-center animate-pop ${className}`}
    >
      <Check className="w-6 h-6 text-grass" strokeWidth={4} />
    </span>
  );
}

/** Sticker tile. `state` drives the skins: correct (grass + check badge), retry (wiggle), slot (dashed), rest (35%), lift (dragging). */
export function Tile({
  children,
  onClick,
  color = "paper",
  className = "",
  disabled,
  ariaLabel,
  pressed,
  href,
  state = "idle",
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  color?: keyof typeof colorBg;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  pressed?: boolean;
  href?: string;
  state?: TileState;
  style?: CSSProperties;
}) {
  const bg = state === "correct" ? "bg-grass scale-[1.06]" : colorBg[color];
  const st =
    state === "retry"
      ? "animate-wiggle"
      : state === "slot"
        ? "is-slot"
        : state === "rest"
          ? "is-rest"
          : state === "lift"
            ? "is-lift"
            : "";
  const cls = `tile relative ${bg} ${st} ${pressed ? "is-pressed" : ""} flex items-center justify-center ${className}`;
  const inner = (
    <>
      {children}
      {state === "correct" && <CheckBadge />}
    </>
  );
  if (href)
    return (
      <Link href={href} aria-label={ariaLabel} className={cls} style={style}>
        {inner}
      </Link>
    );
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cls}
      style={style}
    >
      {inner}
    </button>
  );
}

/** Round icon button: 72px secondary, 96/104px primary. With `label` it becomes a 96px pill (icon + <=2 words). */
export function RoundButton({
  children,
  onClick,
  ariaLabel,
  color = "paper",
  size = "md",
  href,
  className = "",
  label,
  pulse,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  ariaLabel: string;
  color?: keyof typeof colorBg;
  size?: "md" | "lg" | "xl";
  href?: string;
  className?: string;
  label?: string;
  pulse?: boolean;
  style?: CSSProperties;
}) {
  const s = label
    ? "h-24 px-8 gap-3 font-ui font-bold text-[30px] leading-none !rounded-full"
    : `!rounded-full ${size === "xl" ? "w-[104px] h-[104px] text-5xl" : size === "lg" ? "w-24 h-24 text-4xl" : "w-[72px] h-[72px] text-3xl"}`;
  const cls = `tile-sm ${colorBg[color]} ${s} ${pulse ? "animate-ring" : ""} flex items-center justify-center ${className}`;
  const inner = (
    <>
      {children}
      {label && <span>{label}</span>}
    </>
  );
  if (href)
    return (
      <Link href={href} aria-label={ariaLabel} className={cls} style={style}>
        {inner}
      </Link>
    );
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cls}
      style={style}
    >
      {inner}
    </button>
  );
}

/** Progress as dots, never numbers: done 18px grass, current 28px sun with ring, upcoming 18px card */
export function Dots({
  total,
  done,
  current,
}: {
  total: number;
  done: number;
  current?: number;
}) {
  return (
    <div
      className="flex gap-2 justify-center items-center"
      aria-label={`${done} of ${total} done`}
    >
      {Array.from({ length: total }).map((_, i) => {
        const cur = i === current && i >= done;
        return (
          <span
            key={i}
            className={`rounded-full border-[3px] border-ink transition-all duration-200 ${i < done ? "bg-grass w-[18px] h-[18px]" : cur ? "bg-sun w-7 h-7 ring-4 ring-sun/40" : "bg-card/55 w-[18px] h-[18px]"}`}
          />
        );
      })}
    </div>
  );
}

/** [home 72] [dots] [replay 72]. Replay gets a pulsing sun ring after a miss. */
export function PlayBar({
  total,
  done,
  current,
  homeHref = "/",
  onReplay,
  missed,
  replayLabel = "Hear again",
}: {
  total: number;
  done: number;
  current?: number;
  homeHref?: string | null;
  onReplay?: () => void;
  missed?: boolean;
  replayLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 pt-4 w-full max-w-xl mx-auto">
      {homeHref ? (
        <RoundButton href={homeHref} ariaLabel="Home" color="sky">
          <House className="w-9 h-9" strokeWidth={3} />
        </RoundButton>
      ) : (
        <span className="w-[72px]" />
      )}
      <Dots total={total} done={done} current={current ?? done} />
      {onReplay ? (
        <RoundButton
          onClick={onReplay}
          ariaLabel={replayLabel}
          color="sun"
          pulse={missed}
        >
          <RotateCcw className="w-9 h-9" strokeWidth={3} />
        </RoundButton>
      ) : (
        <span className="w-[72px]" />
      )}
    </div>
  );
}

/** CSS star: ink outer, sun (or card when empty) inner inset 16% */
export function Stars({
  n,
  size = "text-4xl",
  count = 3,
}: {
  n: number;
  size?: string;
  count?: number;
}) {
  // `size` is a Tailwind text-size class; stars are sized in em so it scales them.
  const clip =
    "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)";
  return (
    <div className={`flex gap-1 ${size}`} aria-label={`${n} stars`}>
      {Array.from({ length: count }, (_, k) => k + 1).map((i) => (
        <span
          key={i}
          className={`relative w-[1em] h-[1em] bg-ink ${i <= n ? "animate-starIn" : "opacity-30"}`}
          style={{
            clipPath: clip,
            animationDelay: i <= n ? `${i * 180}ms` : undefined,
          }}
        >
          <span
            className={`absolute inset-[16%] ${i <= n ? "bg-sun" : "bg-card"}`}
            style={{ clipPath: clip }}
          />
        </span>
      ))}
    </div>
  );
}

export function TopBar({
  backHref,
  children,
}: {
  backHref: string;
  children?: ReactNode;
}) {
  return (
    <header className="flex items-center gap-3 px-4 pt-4">
      <RoundButton href={backHref} ariaLabel="Back">
        <ArrowLeft className="w-9 h-9" strokeWidth={3} />
      </RoundButton>
      <div className="flex-1 flex justify-center">{children}</div>
      <span className="w-[72px]" />
    </header>
  );
}

/** Free-play carousel card: art on the game's colour, name, stars, ▶ Play. The pill is decorative; the whole card is the button. */
export function GameCard({
  name,
  emoji,
  color,
  stars,
  isNew,
  onClick,
  active,
  className = "",
  style,
}: {
  name: string;
  emoji: ReactNode;
  color: keyof typeof colorBg;
  stars: number;
  isNew?: boolean;
  onClick: () => void;
  active: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={active ? `Play ${name}` : name}
      tabIndex={active ? 0 : -1}
      className={`flex flex-col items-center w-[260px] h-[384px] bg-card border-[5px] border-ink rounded-[38px] shadow-[0_9px_0_0_rgb(var(--c-ink))] overflow-hidden ${className}`}
      style={style}
    >
      <span
        className={`relative w-full h-[206px] border-b-[5px] border-ink flex items-center justify-center text-[112px] leading-none ${colorBg[color]}`}
        aria-hidden
      >
        {emoji}
        {isNew && (
          <span className="absolute right-3.5 top-3.5 bg-bubblegum border-[3px] border-ink rounded-full px-3 py-1 font-ui font-bold text-base leading-none rotate-[8deg]">
            NEW
          </span>
        )}
      </span>
      <span className="font-ui font-bold text-[34px] leading-none mt-4">
        {name}
      </span>
      <span className="mt-2.5">
        <Stars n={stars} size="text-2xl" />
      </span>
      <span
        aria-hidden
        className="mt-auto mb-[18px] flex items-center gap-2 h-[58px] pl-5 pr-[26px] rounded-full bg-sun border-4 border-ink shadow-tileSm font-ui font-bold text-2xl leading-none"
      >
        <Play className="w-6 h-6 fill-ink" strokeWidth={3} />
        Play
      </span>
    </button>
  );
}

/** One dot per game; active = 30px sun pill, others 14px. Tap to jump. */
export function CarouselDots({
  total,
  current,
  onSelect,
}: {
  total: number;
  current: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div
      className="flex items-center gap-[7px]"
      role="tablist"
      aria-label="Games"
    >
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === current}
          aria-label={`Game ${i + 1}`}
          onClick={() => onSelect(i)}
          className="p-2 -m-2 flex items-center"
        >
          <span
            className={`block h-3.5 rounded-full border-[2.5px] border-ink transition-[width] duration-[250ms] ${i === current ? "w-[30px] bg-sun" : "w-3.5 bg-card"}`}
          />
        </button>
      ))}
    </div>
  );
}

/** Berry pill (84px) next to Bulbul. The dice turns 720° on every press. */
export function SurpriseButton({
  onClick,
  turns,
  disabled,
  reduced,
}: {
  onClick: () => void;
  turns: number;
  disabled?: boolean;
  reduced?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Surprise! Pick a game for me"
      className="flex-1 flex items-center justify-center gap-2.5 h-[clamp(60px,9dvh,84px)] rounded-full bg-berry text-white border-[5px] border-ink shadow-[0_7px_0_0_rgb(var(--c-ink))] font-ui font-bold text-[25px] leading-none active:translate-y-[5px] active:shadow-[0_2px_0_0_rgb(var(--c-ink))] transition-[transform,box-shadow] duration-100 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-sun"
    >
      <span
        aria-hidden
        className="inline-block text-[38px]"
        style={{
          transform: `rotate(${turns * 720}deg)`,
          transition: reduced
            ? "none"
            : "transform 1.1s cubic-bezier(.2,.9,.3,1)",
        }}
      >
        🎲
      </span>
      Surprise!
    </button>
  );
}

/** Sticker book entry: owned (tilted), new (sun + sparkle), to-find (dashed ?) */
export function StickerCard({
  state,
  emoji,
  tilt = 0,
  label,
}: {
  state: "owned" | "new" | "find";
  emoji?: ReactNode;
  tilt?: number;
  label?: string;
}) {
  if (state === "find") {
    return (
      <div
        className="w-24 h-24 rounded-tile border-4 border-dashed border-ink/40 flex items-center justify-center text-4xl font-bold text-ink/40"
        aria-label="Not found yet"
      >
        ?
      </div>
    );
  }
  return (
    <div
      className={`relative w-24 h-24 rounded-tile border-4 border-ink shadow-tileSm flex flex-col items-center justify-center text-5xl ${state === "new" ? "bg-sun animate-pop" : "bg-card"}`}
      style={{ transform: `rotate(${tilt || (state === "owned" ? 4 : 0)}deg)` }}
      aria-label={label}
    >
      {emoji}
      {state === "new" && (
        <span
          aria-hidden
          className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-bubblegum border-[3px] border-ink flex items-center justify-center animate-twinkle"
        >
          <Sparkles className="w-5 h-5 text-card" strokeWidth={3} />
        </span>
      )}
    </div>
  );
}

/** Speech bubble (r 26/26/26/6) holding only an icon, sound or letter: never sentences */
export function MascotBubble({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[56px] min-h-[56px] px-3 bg-card border-4 border-ink shadow-tileSm font-read text-3xl ${className}`}
      style={{ borderRadius: "26px 26px 26px 6px" }}
    >
      {children}
    </span>
  );
}
