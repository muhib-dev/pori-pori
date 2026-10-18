'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CarouselDots, GameCard, RoundButton, SurpriseButton } from './ui';
import { Mascot, type Hat } from './Mascot';
import { speak } from '@/lib/speech';
import { starsOf, type HomeGame } from '@/lib/content/games';
import type { LessonProgress } from '@/lib/db';

const wrap = (i: number, n: number) => ((i % n) + n) % n;

/** Free-play carousel: no locks, no order. Swipe, arrows, dots, tap a card or spin Surprise. Bulbul talks above Surprise. */
export function PlayCarousel({ games, progress, startIndex, hat, reduced, onIndexChange, onPlay }: {
  games: HomeGame[]; progress: LessonProgress[]; startIndex: number; hat: Hat; reduced: boolean;
  onIndexChange: (i: number) => void; onPlay: (g: HomeGame) => void;
}) {
  const n = games.length;
  const [idx, setIdx] = useState(wrap(startIndex, n));
  const [spinning, setSpinning] = useState(false);
  const [landed, setLanded] = useState(false);
  const [dice, setDice] = useState(0);
  const [wide, setWide] = useState(false); // tablet landscape: three full cards
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const x0 = useRef(0);
  const swiped = useRef(false);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)');
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const go = useCallback((i: number) => { const w = wrap(i, n); setIdx(w); setLanded(false); onIndexChange(w); }, [n, onIndexChange]);
  const step = useCallback((d: number) => { if (!spinning) go(idx + d); }, [spinning, go, idx]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [step]);

  const announce = (g: HomeGame) => speak(`Yay! Let's play ${g.name}!`, { clipKey: `yay-${g.id}` });

  const surprise = () => {
    if (spinning) return;
    setDice((d) => d + 1);
    setLanded(false);
    const total = 9 + Math.floor(Math.random() * n);
    if (reduced) { const to = wrap(idx + total, n); go(to); setLanded(true); announce(games[to]); return; }
    setSpinning(true);
    let t = 0, cur = idx;
    const tick = () => {
      t++;
      cur = wrap(cur + 1, n);
      setIdx(cur);
      if (t < total) timer.current = setTimeout(tick, 60 + t * t * 2.2);
      else { setSpinning(false); setLanded(true); onIndexChange(cur); announce(games[cur]); }
    };
    timer.current = setTimeout(tick, 60);
  };

  const tap = (i: number) => {
    if (swiped.current || spinning) return;
    if (i !== idx) go(i); else onPlay(games[i]);
  };

  const gap = wide ? 300 : 250;
  const msg = spinning ? 'Hmm… which one?' : landed ? `Yay! Let's play ${games[idx].name}!` : 'Pick any game — or spin!';

  return (
    <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-between select-none">
      <div className="relative w-full flex flex-col items-center gap-5 touch-pan-y"
        onPointerDown={(e) => { x0.current = e.clientX; swiped.current = false; }}
        onPointerUp={(e) => { const dx = e.clientX - x0.current; if (Math.abs(dx) > 40) { swiped.current = true; step(dx < 0 ? 1 : -1); } }}>
        <div className="relative w-full h-[400px] overflow-hidden" aria-roledescription="carousel">
          {games.map((g, i) => {
            let off = i - idx; if (off > n / 2) off -= n; if (off < -n / 2) off += n;
            const abs = Math.abs(off);
            const sc = off === 0 ? (landed ? 1.06 : 1) : wide ? 0.92 : 0.82;
            const op = abs > 1 ? 0 : off === 0 ? 1 : wide ? 0.9 : 0.55;
            return (
              <div key={g.id} className="absolute left-1/2 top-0 -ml-[130px]" aria-hidden={abs > 1}
                style={{ transform: `translateX(${off * gap}px) scale(${sc})`, opacity: op, zIndex: 10 - abs, pointerEvents: abs > 1 ? 'none' : 'auto',
                  transition: reduced ? 'opacity .2s' : 'transform .38s cubic-bezier(.3,1.5,.5,1), opacity .3s' }}>
                <GameCard name={g.name} emoji={g.emoji} color={g.color} stars={starsOf(g, progress)} isNew={g.isNew} active={off === 0} onClick={() => tap(i)} />
              </div>
            );
          })}
        </div>
        <div className="w-full max-w-md md:max-w-3xl flex items-center justify-between">
          <RoundButton onClick={() => step(-1)} ariaLabel="Previous game" color="card"><ChevronLeft className="w-[34px] h-[34px]" strokeWidth={3.5} /></RoundButton>
          <CarouselDots total={n} current={idx} onSelect={(i) => { if (!spinning) go(i); }} />
          <RoundButton onClick={() => step(1)} ariaLabel="Next game" color="card"><ChevronRight className="w-[34px] h-[34px]" strokeWidth={3.5} /></RoundButton>
        </div>
      </div>

      <div className="relative w-full max-w-md md:max-w-2xl flex items-end gap-3 pt-2">
        <span role="status" aria-live="polite" className="absolute left-1 bottom-[104px] max-w-[200px] md:max-w-[260px] bg-card border-4 border-ink rounded-[22px_22px_22px_6px] px-3.5 py-2.5 font-ui font-semibold text-[19px] leading-[1.15] shadow-tileSm">{msg}</span>
        <Mascot size={92} mood={spinning ? 'dance' : landed ? 'cheer' : 'curious'} hat={hat} />
        <SurpriseButton onClick={surprise} turns={dice} disabled={spinning} reduced={reduced} />
        <span className="w-[52px] shrink-0" aria-hidden />
      </div>
    </div>
  );
}
