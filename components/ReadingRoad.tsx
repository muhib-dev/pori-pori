'use client';
import { useEffect, useMemo, useState } from 'react';
import { Rocket } from 'lucide-react';
import { LEVELS, ZONES, canChallenge, currentStepId, isStepDone, isStepUnlocked, type ProgressLike } from '@/lib/content/syllabus';
import { MapNode, Stars } from '@/components/ui';
import { Mascot } from '@/components/Mascot';

const GAP = 130;   // distance between landmarks along the road
const PAD = 90;
const SIDE = 420;  // landscape canvas height

interface Pt { x: number; y: number }

/** S-curve through every landmark, as in design/WorldMap.dc.html */
function curve(pts: Pt[], horizontal: boolean) {
  if (!pts.length) return '';
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    d += horizontal
      ? ` C${(a.x + b.x) / 2} ${a.y} ${(a.x + b.x) / 2} ${b.y} ${b.x} ${b.y}`
      : ` C${a.x} ${(a.y + b.y) / 2} ${b.x} ${(a.y + b.y) / 2} ${b.x} ${b.y}`;
  }
  return d;
}

/** The Reading Road: every step is a landmark on a winding road. Portrait runs bottom->top, tablet landscape left->right. */
export function ReadingRoad({ progress, start, avatar, allDone }: { progress: ProgressLike[]; start: number; avatar: string; allDone: boolean }) {
  // phone: tall road · tablet landscape (768-1099): road runs left→right · desktop and tablet portrait: wide tall road
  const [horizontal, setHorizontal] = useState(false);
  const [wide, setWide] = useState(false);
  const [nudge, setNudge] = useState(false);
  useEffect(() => {
    const h = window.matchMedia('(min-width: 768px) and (max-width: 1099px) and (orientation: landscape)');
    const w = window.matchMedia('(min-width: 768px)');
    const on = () => { setHorizontal(h.matches); setWide(w.matches && !h.matches); };
    on();
    h.addEventListener('change', on); w.addEventListener('change', on);
    return () => { h.removeEventListener('change', on); w.removeEventListener('change', on); };
  }, []);

  const n = LEVELS.length;
  const stepId = currentStepId(progress, start);
  const curIdx = LEVELS.findIndex((l) => l.id === stepId);
  const long = PAD * 2 + GAP * (n - 1);
  const W = horizontal ? long : wide ? 640 : 390;
  const H = horizontal ? SIDE : long;
  const pts = useMemo<Pt[]>(() => LEVELS.map((_, i) => horizontal
    ? { x: PAD + i * GAP, y: i % 2 ? SIDE * 0.3 : SIDE * 0.7 }
    : { x: i % 2 ? (wide ? 470 : 290) : (wide ? 170 : 100), y: H - PAD - i * GAP }), [horizontal, wide, H]);

  const walkedTo = allDone ? n - 1 : curIdx;
  const walked = curve(pts.slice(0, walkedTo + 1), horizontal);
  const ahead = allDone ? '' : curve(pts.slice(curIdx), horizontal);

  useEffect(() => { document.getElementById('road-next')?.scrollIntoView({ block: 'nearest', inline: 'center' }); }, [horizontal, wide, stepId]);

  const lockedTap = () => {
    setNudge(true);
    setTimeout(() => setNudge(false), 1200);
    document.getElementById('road-next')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  };

  // zone bands: ground tints behind each group of steps
  const bands = ZONES.map((z) => {
    const idx = LEVELS.map((l, i) => (l.zone === z.id ? i : -1)).filter((i) => i >= 0);
    if (!idx.length) return null;
    const a = pts[idx[0]], b = pts[idx[idx.length - 1]];
    return { z, a, b };
  }).filter(Boolean) as { z: (typeof ZONES)[number]; a: Pt; b: Pt }[];

  const outer = horizontal ? { width: W, height: H } : { width: '100%', maxWidth: W + 30, aspectRatio: `${W}/${H}` };

  return (
    // flex + m-auto: centred when there is room, start-aligned (still scrollable) when the road is wider than the screen
    <div className={horizontal ? 'w-full overflow-x-auto flex pb-2' : 'w-full'}>
      <div className="relative m-auto shrink-0" style={outer} aria-label="Reading road">
        {bands.map(({ z, a, b }, k) => {
          const lo = horizontal ? Math.min(a.x, b.x) - GAP / 2 : Math.min(a.y, b.y) - GAP / 2;
          const hi = horizontal ? Math.max(a.x, b.x) + GAP / 2 : Math.max(a.y, b.y) + GAP / 2;
          const style = horizontal
            ? { left: `${(lo / W) * 100}%`, width: `${((hi - lo) / W) * 100}%`, top: 0, bottom: 0 }
            : { top: `${(lo / H) * 100}%`, height: `${((hi - lo) / H) * 100}%`, left: 0, right: 0 };
          return (
            <div key={z.id} className={`absolute bg-ground ${k % 2 ? 'opacity-60' : ''} ${horizontal ? '' : 'rounded-card'}`} style={style}>
              <span className="absolute top-2 left-3 text-4xl opacity-70" aria-hidden>{z.emoji}</span>
            </div>
          );
        })}
        <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
          {ahead && <>
            <path d={ahead} fill="none" stroke="rgb(var(--c-ink))" strokeOpacity=".12" strokeWidth="40" strokeLinecap="round" />
            <path d={ahead} fill="none" stroke="rgb(var(--c-ink))" strokeOpacity=".35" strokeWidth="4" strokeLinecap="round" strokeDasharray="3 14" />
          </>}
          {walkedTo > 0 && <>
            <path d={walked} fill="none" stroke="rgb(var(--c-ink))" strokeWidth="44" strokeLinecap="round" />
            <path d={walked} fill="none" stroke="rgb(var(--c-sun))" strokeWidth="34" strokeLinecap="round" />
          </>}
        </svg>
        {LEVELS.map((l, i) => {
          const done = isStepDone(progress, l, start);
          const open = isStepUnlocked(progress, l.id, start);
          const isNext = l.id === stepId && !allDone;
          const jump = !open && l.id === stepId + 1 && canChallenge(l);
          const total = l.lessons.reduce((s, x) => s + (progress.find((p) => p.lessonId === x.id)?.bestStars ?? 0), 0);
          const avg = Math.min(3, Math.max(0, Math.round(total / l.lessons.length)));
          // scroll margins keep the next node clear of the fixed header area and the bottom Play bar
          const style = { left: `${(pts[i].x / W) * 100}%`, top: `${(pts[i].y / H) * 100}%`, scrollMarginTop: 160, scrollMarginBottom: 300 };
          if (jump) {
            return <MapNode key={l.id} state="locked" style={style} emoji={<Rocket className="w-10 h-10 text-ink" strokeWidth={2.5} />} href={`/challenge/?step=${l.id}`} ariaLabel={`Jump ahead to step ${l.id}`} />;
          }
          if (!open) return <MapNode key={l.id} state="locked" style={style} emoji={l.emoji} onClick={lockedTap} ariaLabel={`Step ${l.id}, locked`} />;
          return (
            <MapNode key={l.id} id={isNext ? 'road-next' : undefined} state={isNext ? 'next' : 'done'} style={style} emoji={l.emoji}
              color={l.color === 'sky' ? 'sky' : l.color} label={isNext ? l.name : undefined} avatar={avatar}
              stars={done && avg > 0 ? <Stars n={avg} size="text-xl" /> : undefined}
              href={`/level/?id=${l.id}`} ariaLabel={`Step ${l.id}: ${l.name}${done ? ', done' : ''}`} />
          );
        })}
        {nudge && (
          <div className="absolute pointer-events-none" style={{ left: `${(pts[Math.max(curIdx, 0)].x / W) * 100}%`, top: `${(pts[Math.max(curIdx, 0)].y / H) * 100}%`, transform: 'translate(-50%, 60px)' }}>
            <Mascot size={64} mood="curious" />
          </div>
        )}
      </div>
    </div>
  );
}
