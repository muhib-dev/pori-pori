'use client';
import Link from 'next/link';
import { type ReactNode } from 'react';
import { ArrowLeft, Star } from 'lucide-react';

const colorBg: Record<string, string> = {
  sun: 'bg-sun', tangerine: 'bg-tangerine', grass: 'bg-grass', berry: 'bg-berry',
  bubblegum: 'bg-bubblegum', sky: 'bg-sky', paper: 'bg-paper',
};

export function Tile({
  children, onClick, color = 'paper', className = '', disabled, ariaLabel, pressed, href,
}: {
  children: ReactNode; onClick?: () => void; color?: keyof typeof colorBg; className?: string;
  disabled?: boolean; ariaLabel?: string; pressed?: boolean; href?: string;
}) {
  const cls = `tile ${colorBg[color]} ${pressed ? 'is-pressed' : ''} flex items-center justify-center ${className}`;
  if (href) return <Link href={href} aria-label={ariaLabel} className={cls}>{children}</Link>;
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={ariaLabel} className={cls}>
      {children}
    </button>
  );
}

/** Round icon button — always ≥ 64px so small fingers can hit it */
export function RoundButton({ children, onClick, ariaLabel, color = 'paper', size = 'md', href, className = '' }: {
  children: ReactNode; onClick?: () => void; ariaLabel: string; color?: keyof typeof colorBg;
  size?: 'md' | 'lg' | 'xl'; href?: string; className?: string;
}) {
  const s = size === 'xl' ? 'w-28 h-28 text-5xl' : size === 'lg' ? 'w-20 h-20 text-4xl' : 'w-16 h-16 text-3xl';
  const cls = `tile-sm ${colorBg[color]} !rounded-full ${s} flex items-center justify-center ${className}`;
  if (href) return <Link href={href} aria-label={ariaLabel} className={cls}>{children}</Link>;
  return <button type="button" onClick={onClick} aria-label={ariaLabel} className={cls}>{children}</button>;
}

/** Progress as dots, never numbers: children don't need to count */
export function Dots({ total, done, current }: { total: number; done: number; current?: number }) {
  return (
    <div className="flex gap-2 justify-center" aria-label={`${done} of ${total} done`}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`h-4 rounded-full border-[3px] border-ink transition-all ${i < done ? 'bg-grass w-4' : i === current ? 'bg-sun w-8 animate-pulseSoft' : 'bg-paper w-4'}`} />
      ))}
    </div>
  );
}

export function Stars({ n, size = 'text-4xl' }: { n: number; size?: string }) {
  // `size` is a Tailwind text-size class; icons are sized in em so it scales them.
  return (
    <div className={`flex gap-1 ${size}`} aria-label={`${n} stars`}>
      {[1, 2, 3].map((i) => i <= n
        ? <Star key={i} strokeWidth={2.5} className="w-[1em] h-[1em] fill-sun text-ink animate-starIn" style={{ animationDelay: `${i * 150}ms` }} />
        : <Star key={i} strokeWidth={2.5} className="w-[1em] h-[1em] text-ink/25" />)}
    </div>
  );
}

export function TopBar({ backHref, children }: { backHref: string; children?: ReactNode }) {
  return (
    <header className="flex items-center gap-3 px-4 pt-4">
      <RoundButton href={backHref} ariaLabel="Back"><ArrowLeft className="w-8 h-8" strokeWidth={3} /></RoundButton>
      <div className="flex-1 flex justify-center">{children}</div>
      <span className="w-16" />
    </header>
  );
}
