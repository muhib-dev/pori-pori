'use client';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Mascot, type Mood } from '../Mascot';

export type SceneKind = 'pond' | 'house' | 'train' | 'meadow';
type Reaction = 'idle' | 'ok' | 'miss';

export interface SceneState {
  reaction: Reaction;
  n: number;                 // bumps on every reaction so animations restart
  misses: number;            // first-try misses so far on this question
  react: (r: 'ok' | 'miss') => void;
}

/** Per-question reaction state. Miss: Bulbul curious, onMiss (replay pulse) and the prompt auto-replays at 600ms. */
export function useScene({ say, onMiss }: { say?: () => void; onMiss?: () => void }): SceneState {
  const [reaction, setReaction] = useState<Reaction>('idle');
  const [n, setN] = useState(0);
  const [misses, setMisses] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  // The play bar's replay button fires this so the current question repeats its prompt.
  useEffect(() => {
    if (!say) return;
    window.addEventListener('pp-replay', say);
    return () => window.removeEventListener('pp-replay', say);
  }, [say]);
  const react = useCallback((r: 'ok' | 'miss') => {
    setReaction(r);
    setN((x) => x + 1);
    if (r === 'miss') {
      setMisses((m) => m + 1);
      onMiss?.();
      if (say) timers.current.push(setTimeout(say, 600));
      timers.current.push(setTimeout(() => setReaction('idle'), 1300));
    }
  }, [say, onMiss]);
  return { reaction, n, misses, react };
}

const moodOf = (r: Reaction): Mood => (r === 'ok' ? 'cheer' : r === 'miss' ? 'curious' : 'happy');

const stage: Record<SceneKind, string> = {
  pond: 'bg-sky/25',
  house: 'bg-ground',
  train: 'bg-sky/20',
  meadow: 'bg-ground/70',
};

/** Story-skin frame shared by every game: a stage card with a theme backdrop, Bulbul in the corner, then the controls underneath. */
export function Scene({ kind, s, stage: top, children }: { kind: SceneKind; s: SceneState; stage?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className={`relative w-full max-w-xl rounded-card border-4 border-ink ${stage[kind]} px-4 pt-5 pb-4 flex flex-col items-center gap-3`}>
        <span className="absolute -top-8 -right-2 z-10"><Mascot size={72} mood={moodOf(s.reaction)} /></span>
        {kind === 'pond' && <Frog s={s} />}
        {top}
        {kind === 'pond' && <span aria-hidden className="w-60 h-8 rounded-[50%] bg-sky border-4 border-ink -mt-2" />}
        {kind === 'train' && <span aria-hidden className="w-full h-2 rounded-full bg-ink/70 mt-1" />}
      </div>
      {children}
    </div>
  );
}

/** Frog: pops on a right answer, tilts and shows an ear bubble after a miss. Emoji is a placeholder for art. */
function Frog({ s }: { s: SceneState }) {
  return (
    <div className="relative h-28 flex items-end justify-center">
      <span key={s.n} aria-hidden className={`text-[88px] leading-none inline-block ${s.reaction === 'ok' ? 'animate-pop' : s.reaction === 'miss' ? '-rotate-6 animate-wiggle' : 'animate-float'}`}>🐸</span>
      {s.reaction === 'miss' && <span aria-hidden className="absolute -right-8 top-0 text-3xl animate-pop">👂</span>}
      {s.reaction === 'ok' && <span aria-hidden className="absolute -left-8 top-0 text-3xl animate-twinkle">✨</span>}
    </div>
  );
}
