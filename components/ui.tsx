'use client';
import Link from 'next/link';
import { type CSSProperties, type ReactNode } from 'react';
import { ArrowLeft, Check, House, RotateCcw, Sparkles } from 'lucide-react';

const colorBg: Record<string, string> = {
  sun: 'bg-sun', tangerine: 'bg-tangerine', grass: 'bg-grass', berry: 'bg-berry',
  bubblegum: 'bg-bubblegum', sky: 'bg-sky', paper: 'bg-card', card: 'bg-card',
};

export type TileState = 'idle' | 'correct' | 'retry' | 'slot' | 'rest' | 'lift';

/** Small white badge with a check: colour never carries "correct" alone */
export function CheckBadge({ className = '' }: { className?: string }) {
  return (
    <span aria-hidden className={`absolute -top-3 -right-3 w-9 h-9 rounded-full bg-card border-[3px] border-ink flex items-center justify-center animate-pop ${className}`}>
      <Check className="w-6 h-6 text-grass" strokeWidth={4} />
    </span>
  );
}

/** Sticker tile. `state` drives the skins: correct (grass + check badge), retry (wiggle), slot (dashed), rest (35%), lift (dragging). */
export function Tile({
  children, onClick, color = 'paper', className = '', disabled, ariaLabel, pressed, href, state = 'idle', style,
}: {
  children: ReactNode; onClick?: () => void; color?: keyof typeof colorBg; className?: string;
  disabled?: boolean; ariaLabel?: string; pressed?: boolean; href?: string; state?: TileState; style?: CSSProperties;
}) {
  const bg = state === 'correct' ? 'bg-grass scale-[1.06]' : colorBg[color];
  const st = state === 'retry' ? 'animate-wiggle' : state === 'slot' ? 'is-slot' : state === 'rest' ? 'is-rest' : state === 'lift' ? 'is-lift' : '';
  const cls = `tile relative ${bg} ${st} ${pressed ? 'is-pressed' : ''} flex items-center justify-center ${className}`;
  const inner = <>{children}{state === 'correct' && <CheckBadge />}</>;
  if (href) return <Link href={href} aria-label={ariaLabel} className={cls} style={style}>{inner}</Link>;
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={ariaLabel} className={cls} style={style}>
      {inner}
    </button>
  );
}

/** Round icon button: 72px secondary, 96/104px primary. With `label` it becomes a 96px pill (icon + <=2 words). */
export function RoundButton({ children, onClick, ariaLabel, color = 'paper', size = 'md', href, className = '', label, pulse, style }: {
  children: ReactNode; onClick?: () => void; ariaLabel: string; color?: keyof typeof colorBg;
  size?: 'md' | 'lg' | 'xl'; href?: string; className?: string; label?: string; pulse?: boolean; style?: CSSProperties;
}) {
  const s = label
    ? 'h-24 px-8 gap-3 font-ui font-bold text-[30px] leading-none !rounded-full'
    : `!rounded-full ${size === 'xl' ? 'w-[104px] h-[104px] text-5xl' : size === 'lg' ? 'w-24 h-24 text-4xl' : 'w-[72px] h-[72px] text-3xl'}`;
  const cls = `tile-sm ${colorBg[color]} ${s} ${pulse ? 'animate-ring' : ''} flex items-center justify-center ${className}`;
  const inner = <>{children}{label && <span>{label}</span>}</>;
  if (href) return <Link href={href} aria-label={ariaLabel} className={cls} style={style}>{inner}</Link>;
  return <button type="button" onClick={onClick} aria-label={ariaLabel} className={cls} style={style}>{inner}</button>;
}

/** Progress as dots, never numbers: done 18px grass, current 28px sun with ring, upcoming 18px card */
export function Dots({ total, done, current }: { total: number; done: number; current?: number }) {
  return (
    <div className="flex gap-2 justify-center items-center" aria-label={`${done} of ${total} done`}>
      {Array.from({ length: total }).map((_, i) => {
        const cur = i === current && i >= done;
        return (
          <span key={i}
            className={`rounded-full border-[3px] border-ink transition-all duration-200 ${i < done ? 'bg-grass w-[18px] h-[18px]' : cur ? 'bg-sun w-7 h-7 ring-4 ring-sun/40' : 'bg-card/55 w-[18px] h-[18px]'}`} />
        );
      })}
    </div>
  );
}

/** [home 72] [dots] [replay 72]. Replay gets a pulsing sun ring after a miss. */
export function PlayBar({ total, done, current, homeHref = '/', onReplay, missed, replayLabel = 'Hear again' }: {
  total: number; done: number; current?: number; homeHref?: string | null; onReplay?: () => void; missed?: boolean; replayLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 pt-4 w-full max-w-xl mx-auto">
      {homeHref ? <RoundButton href={homeHref} ariaLabel="Home" color="sky"><House className="w-9 h-9" strokeWidth={3} /></RoundButton> : <span className="w-[72px]" />}
      <Dots total={total} done={done} current={current ?? done} />
      {onReplay
        ? <RoundButton onClick={onReplay} ariaLabel={replayLabel} color="sun" pulse={missed}><RotateCcw className="w-9 h-9" strokeWidth={3} /></RoundButton>
        : <span className="w-[72px]" />}
    </div>
  );
}

/** CSS star: ink outer, sun (or card when empty) inner inset 16% */
export function Stars({ n, size = 'text-4xl', count = 3 }: { n: number; size?: string; count?: number }) {
  // `size` is a Tailwind text-size class; stars are sized in em so it scales them.
  const clip = 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)';
  return (
    <div className={`flex gap-1 ${size}`} aria-label={`${n} stars`}>
      {Array.from({ length: count }, (_, k) => k + 1).map((i) => (
        <span key={i} className={`relative w-[1em] h-[1em] bg-ink ${i <= n ? 'animate-starIn' : 'opacity-30'}`}
          style={{ clipPath: clip, animationDelay: i <= n ? `${i * 180}ms` : undefined }}>
          <span className={`absolute inset-[16%] ${i <= n ? 'bg-sun' : 'bg-card'}`} style={{ clipPath: clip }} />
        </span>
      ))}
    </div>
  );
}

export function TopBar({ backHref, children }: { backHref: string; children?: ReactNode }) {
  return (
    <header className="flex items-center gap-3 px-4 pt-4">
      <RoundButton href={backHref} ariaLabel="Back"><ArrowLeft className="w-9 h-9" strokeWidth={3} /></RoundButton>
      <div className="flex-1 flex justify-center">{children}</div>
      <span className="w-[72px]" />
    </header>
  );
}

/** Three white puffs on a locked node's bottom edge */
function CloudCap() {
  return (
    <span aria-hidden className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-end gap-0.5 pointer-events-none">
      <span className="w-5 h-5 rounded-full bg-card border-2 border-ink/20" />
      <span className="w-7 h-7 rounded-full bg-card border-2 border-ink/20 -mx-1" />
      <span className="w-5 h-5 rounded-full bg-card border-2 border-ink/20" />
    </span>
  );
}

/** Reading Road landmark. done: 84px coloured + stars below. next: 100px card, glow, avatar above, label pill. locked: 84px dashed, greyed picture, cloud cap. */
export function MapNode({ id, state, emoji, label, stars, avatar, color = 'sun', href, onClick, ariaLabel, className = '', style }: {
  id?: string;
  state: 'done' | 'next' | 'locked'; emoji: ReactNode; label?: string; stars?: ReactNode; avatar?: ReactNode;
  color?: keyof typeof colorBg; href?: string; onClick?: () => void; ariaLabel: string; className?: string; style?: CSSProperties;
}) {
  const size = state === 'next' ? 'w-[100px] h-[100px] !border-[5px] animate-ring' : 'w-[84px] h-[84px]';
  const look = state === 'done' ? colorBg[color] : state === 'next' ? 'bg-card' : 'bg-card !border-dashed !border-ink/35 !shadow-none';
  const cls = `tile relative ${size} ${look} !rounded-full flex items-center justify-center text-5xl`;
  const pic = <span className={state === 'locked' ? 'grayscale opacity-30' : ''}>{emoji}</span>;
  const inner = <>{pic}{state === 'locked' && <CloudCap />}</>;
  return (
    <div id={id} className={`absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 ${className}`} style={style}>
      {state === 'next' && avatar && <span className="absolute -top-12 text-5xl animate-float" aria-hidden>{avatar}</span>}
      {href
        ? <Link href={href} aria-label={ariaLabel} className={cls}>{inner}</Link>
        : <button type="button" onClick={onClick} aria-label={ariaLabel} className={cls}>{inner}</button>}
      {state === 'done' && stars && <div className="mt-2">{stars}</div>}
      {state === 'next' && label && <span className="mt-2 px-4 py-0.5 rounded-full bg-card border-[3px] border-ink font-ui font-semibold text-lg">{label}</span>}
    </div>
  );
}

/** Sticker book entry: owned (tilted), new (sun + sparkle), to-find (dashed ?) */
export function StickerCard({ state, emoji, tilt = 0, label }: {
  state: 'owned' | 'new' | 'find'; emoji?: ReactNode; tilt?: number; label?: string;
}) {
  if (state === 'find') {
    return (
      <div className="w-24 h-24 rounded-tile border-4 border-dashed border-ink/40 flex items-center justify-center text-4xl font-bold text-ink/40" aria-label="Not found yet">?</div>
    );
  }
  return (
    <div className={`relative w-24 h-24 rounded-tile border-4 border-ink shadow-tileSm flex flex-col items-center justify-center text-5xl ${state === 'new' ? 'bg-sun animate-pop' : 'bg-card'}`}
      style={{ transform: `rotate(${tilt || (state === 'owned' ? 4 : 0)}deg)` }} aria-label={label}>
      {emoji}
      {state === 'new' && (
        <span aria-hidden className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-bubblegum border-[3px] border-ink flex items-center justify-center animate-twinkle">
          <Sparkles className="w-5 h-5 text-card" strokeWidth={3} />
        </span>
      )}
    </div>
  );
}

/** Speech bubble (r 26/26/26/6) holding only an icon, sound or letter: never sentences */
export function MascotBubble({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center min-w-[56px] min-h-[56px] px-3 bg-card border-4 border-ink shadow-tileSm font-read text-3xl ${className}`}
      style={{ borderRadius: '26px 26px 26px 6px' }}>
      {children}
    </span>
  );
}
