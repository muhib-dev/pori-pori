'use client';
import { useEffect, useState, type CSSProperties } from 'react';
import { speak } from '@/lib/speech';

export type Mood = 'happy' | 'talk' | 'cheer' | 'curious' | 'sleepy' | 'dance';
export type Hat = 'none' | 'crown' | 'cap' | 'flower' | 'bow' | 'tophat';

const HATS: Record<Exclude<Hat, 'none'>, string> = { crown: '👑', cap: '🧢', flower: '🌸', bow: '🎀', tophat: '🎩' };

const ink = 'rgb(var(--c-ink))';
const tang = 'rgb(var(--c-tangerine))';
const bubble = 'rgb(var(--c-bubblegum))';
const sky = 'rgb(var(--c-sky))';
const berry = 'rgb(var(--c-berry))';

/** Idle for `ms` with no tap/key → true (UI only). Any input wakes it. */
export function useIdle(ms = 20000) {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const arm = () => { setIdle(false); clearTimeout(t); t = setTimeout(() => setIdle(true), ms); };
    arm();
    const evs = ['pointerdown', 'keydown'] as const;
    evs.forEach((e) => window.addEventListener(e, arm));
    return () => { clearTimeout(t); evs.forEach((e) => window.removeEventListener(e, arm)); };
  }, [ms]);
  return idle;
}

const box = (s: CSSProperties): CSSProperties => ({ position: 'absolute', ...s });

/** Bulbul the bird: CSS-built (body sun, wings/feet/tuft tangerine, cheeks bubblegum). Proportions from design/Mascot.dc.html. */
export function Mascot({ size = 120, mood = 'happy', hat = 'none', say, className = '', sleepy: autoSleep }: {
  size?: number; mood?: Mood; hat?: Hat; say?: string; className?: string; sleepy?: boolean;
}) {
  const idle = useIdle();
  const m: Mood = autoSleep && idle && mood === 'happy' ? 'sleepy' : mood;
  const bw = Math.max(2, Math.round(size * 0.032));
  const bw2 = Math.max(3, Math.round(size * 0.045));
  const b = `${bw}px solid ${ink}`;
  const up = m === 'cheer' || m === 'dance';
  const eyesOpen = m === 'happy' || m === 'curious' || m === 'talk';
  const pupilL = m === 'curious' ? '40%' : '26%';
  const zf = Math.round(size * 0.2), zf2 = Math.round(size * 0.14);
  const tilt = m === 'curious' ? '-12deg' : '0deg';
  const anim = m === 'dance' ? 'mdance .9s ease-in-out infinite' : m === 'sleepy' ? 'mbob 3s ease-in-out infinite' : 'none';
  const eye = (left: string) => (
    <div style={box({ left, top: '32%', width: '17%', height: '19%', background: '#fff', border: b, borderRadius: '50%' })}>
      <div style={box({ left: pupilL, top: '28%', width: '48%', height: '48%', background: ink, borderRadius: '50%' })}>
        <div style={box({ left: '18%', top: '14%', width: '34%', height: '34%', background: '#fff', borderRadius: '50%' })} />
      </div>
    </div>
  );
  const body = (
    <div className="relative flex-none"
      style={{ width: size, height: size, transform: `rotate(${tilt})`, animation: anim, ['--mt' as string]: tilt }} aria-hidden>
      {/* feet */}
      <div style={box({ left: '30%', top: '86%', width: '16%', height: '9%', background: tang, border: b, borderRadius: '50%' })} />
      <div style={box({ left: '54%', top: '86%', width: '16%', height: '9%', background: tang, border: b, borderRadius: '50%' })} />
      {/* wings */}
      {up ? (<>
        <div style={box({ left: '0%', top: '24%', width: '24%', height: '34%', background: tang, border: b, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', transform: 'rotate(-35deg)' })} />
        <div style={box({ right: '0%', top: '24%', width: '24%', height: '34%', background: tang, border: b, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', transform: 'rotate(35deg)' })} />
      </>) : (<>
        <div style={box({ left: '4%', top: '50%', width: '20%', height: '30%', background: tang, border: b, borderRadius: '50%', transform: 'rotate(20deg)' })} />
        <div style={box({ right: '4%', top: '50%', width: '20%', height: '30%', background: tang, border: b, borderRadius: '50%', transform: 'rotate(-20deg)' })} />
      </>)}
      {/* tuft */}
      <div style={box({ left: '40%', top: '6%', width: '9%', height: '16%', background: tang, border: b, borderRadius: '50%', transform: 'rotate(-18deg)' })} />
      <div style={box({ left: '50%', top: '4%', width: '9%', height: '18%', background: bubble, border: b, borderRadius: '50%', transform: 'rotate(14deg)' })} />
      {/* body + belly */}
      <div style={box({ left: '13%', top: '16%', width: '74%', height: '74%', background: 'rgb(var(--c-sun))', border: b, borderRadius: '50% 50% 46% 46%' })} />
      <div style={box({ left: '30%', top: '52%', width: '40%', height: '34%', background: 'rgba(255,255,255,.55)', borderRadius: '50%' })} />
      {/* eyes */}
      {eyesOpen && <>{eye('27%')}{eye('56%')}</>}
      {up && <>
        <div style={box({ left: '28%', top: '36%', width: '15%', height: '12%', borderTop: `${bw2}px solid ${ink}`, borderRadius: '50% 50% 0 0' })} />
        <div style={box({ left: '57%', top: '36%', width: '15%', height: '12%', borderTop: `${bw2}px solid ${ink}`, borderRadius: '50% 50% 0 0' })} />
      </>}
      {m === 'sleepy' && <>
        <div style={box({ left: '28%', top: '34%', width: '15%', height: '8%', borderBottom: `${bw2}px solid ${ink}`, borderRadius: '0 0 50% 50%' })} />
        <div style={box({ left: '57%', top: '34%', width: '15%', height: '8%', borderBottom: `${bw2}px solid ${ink}`, borderRadius: '0 0 50% 50%' })} />
      </>}
      {/* cheeks + beak */}
      <div style={box({ left: '21%', top: '52%', width: '12%', height: '8%', background: bubble, opacity: .75, borderRadius: '50%' })} />
      <div style={box({ left: '67%', top: '52%', width: '12%', height: '8%', background: bubble, opacity: .75, borderRadius: '50%' })} />
      <div style={box({ left: '43%', top: '50%', width: '14%', height: m === 'talk' || m === 'cheer' ? '15%' : '9%', background: tang, border: b, borderRadius: '20% 20% 50% 50%' })} />
      {/* mood extras */}
      {m === 'sleepy' && <>
        <div style={box({ right: '-6%', top: '-4%', font: `700 ${zf}px/1 Fredoka, sans-serif`, color: berry, animation: 'mzz 2.4s ease-in-out infinite' })}>z</div>
        <div style={box({ right: '8%', top: '8%', font: `700 ${zf2}px/1 Fredoka, sans-serif`, color: berry, animation: 'mzz 2.4s 1.2s ease-in-out infinite' })}>z</div>
      </>}
      {m === 'dance' && <>
        <div style={box({ left: '-10%', top: '2%', font: `700 ${zf}px/1 Fredoka, sans-serif`, color: berry })}>♪</div>
        <div style={box({ right: '-10%', top: '12%', font: `700 ${zf}px/1 Fredoka, sans-serif`, color: sky })}>♫</div>
      </>}
      {m === 'talk' && <>
        <div style={box({ left: '58%', top: '44%', width: '30%', height: '30%', border: `${bw}px solid ${sky}`, borderLeftColor: 'transparent', borderBottomColor: 'transparent', borderRadius: '50%', transform: 'rotate(45deg)' })} />
        <div style={box({ left: '62%', top: '36%', width: '46%', height: '46%', border: `${bw}px solid ${sky}`, borderLeftColor: 'transparent', borderBottomColor: 'transparent', borderRadius: '50%', transform: 'rotate(45deg)', opacity: .6 })} />
      </>}
      {m === 'curious' && (
        <div style={box({ right: '-8%', top: '-2%', width: '30%', height: '30%', background: '#fff', border: b, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', font: `700 ${zf2}px/1 Fredoka, sans-serif`, color: ink })}>?</div>
      )}
      {hat !== 'none' && (
        <div style={box({ left: 0, right: 0, top: Math.round(-size * 0.12), textAlign: 'center', fontSize: Math.round(size * 0.34), lineHeight: 1 })}>{HATS[hat]}</div>
      )}
    </div>
  );
  if (!say) return <span className={`inline-block ${className}`} style={{ width: size, height: size }}>{body}</span>;
  return (
    <button type="button" onClick={() => speak(say)} aria-label={say} className={`inline-block ${className}`}>{body}</button>
  );
}
