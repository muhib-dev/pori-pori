'use client';
import { useEffect, useMemo } from 'react';
import { PartyPopper } from 'lucide-react';

const CHEERS = ['Yay!', 'Super!', 'Wow!', 'You did it!', 'Great!', 'Brilliant!'];
const CONFETTI = ['bg-sun', 'bg-tangerine', 'bg-grass', 'bg-berry', 'bg-bubblegum'];

/** Full-screen confetti rain. Pure CSS, no deps; hidden for reduced-motion users via the global rule. */
export function Confetti({ count = 36 }: { count?: number }) {
  const bits = useMemo(() => Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    size: 8 + Math.random() * 10,
    round: Math.random() > 0.5,
    color: CONFETTI[i % CONFETTI.length],
  })), [count]);
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-40" aria-hidden>
      {bits.map((b, i) => (
        <span key={i} className={`absolute top-0 border-2 border-ink animate-confetti ${b.color} ${b.round ? 'rounded-full' : 'rounded-sm'}`}
          style={{ left: `${b.left}%`, width: b.size, height: b.size, animationDelay: `${b.delay}s` }} />
      ))}
    </div>
  );
}

/** A small radial sparkle burst, placed inside a `relative` parent. */
export function Burst({ n = 10 }: { n?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10" aria-hidden>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2, r = 70 + (i % 3) * 18;
        return <span key={i} className={`absolute w-3 h-3 rounded-full border-2 border-ink animate-burst ${CONFETTI[i % CONFETTI.length]}`}
          style={{ ['--dx' as string]: `${Math.cos(a) * r}px`, ['--dy' as string]: `${Math.sin(a) * r}px` }} />;
      })}
    </div>
  );
}

export function Celebration({ show, onDone }: { show: boolean; onDone: () => void }) {
  useEffect(() => { if (!show) return; const t = setTimeout(onDone, 900); return () => clearTimeout(t); }, [show, onDone]);
  const word = useMemo(() => CHEERS[Math.floor(Math.random() * CHEERS.length)], [show]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-50">
      <Confetti count={20} />
      <div className="animate-pop bg-sun border-4 border-ink rounded-full px-10 py-5 shadow-tile text-5xl font-semibold flex items-center gap-3">
        {word} <PartyPopper className="w-12 h-12 animate-wiggle" strokeWidth={2.5} />
      </div>
    </div>
  );
}
