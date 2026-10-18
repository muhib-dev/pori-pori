'use client';
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, ChevronRight, Lock, Shirt, Star } from 'lucide-react';
import { db, PROFILE_ID, updateProfile } from '@/lib/db';
import { ALL_LESSONS } from '@/lib/content/syllabus';
import { WARDROBE, equippedHat, isOwned } from '@/lib/content/wardrobe';
import { speak } from '@/lib/speech';
import { Mascot } from '@/components/Mascot';
import { RoundButton, StickerCard, TopBar } from '@/components/ui';

const PER_PAGE = 9; // ring-binder page: 3 x 3
const DAY = 24 * 3600 * 1000;

// Sticker book (one sticker per lesson, earned on the first 3 stars) + Bulbul's wardrobe (unlocked by total stars, never spent).
export default function Stickers() {
  const [tab, setTab] = useState<'stickers' | 'wardrobe'>('stickers');
  const [page, setPage] = useState(0);
  const stickers = useLiveQuery(() => db.stickers.toArray());
  const progress = useLiveQuery(() => db.progress.toArray());
  const profile = useLiveQuery(() => db.profiles.get(PROFILE_ID));
  if (!stickers || !progress || !profile) return null;

  const have = new Map(stickers.map((s) => [s.lessonId, s.earnedAt]));
  const totalStars = progress.reduce((n, p) => n + p.bestStars, 0);
  const pages = Math.ceil(ALL_LESSONS.length / PER_PAGE);
  const slice = ALL_LESSONS.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const hat = equippedHat(profile.wardrobe?.equipped, totalStars);

  const tabCls = (on: boolean) => `w-24 h-[72px] rounded-t-tile border-4 border-b-0 border-ink flex items-center justify-center ${on ? 'bg-card' : 'bg-sun/60'}`;
  return (
    <div className="flex flex-col gap-4 pb-8 w-full max-w-xl mx-auto">
      <TopBar backHref="/">
        <div className="flex gap-2 items-end">
          <button type="button" aria-label="Stickers" aria-pressed={tab === 'stickers'} onClick={() => setTab('stickers')} className={tabCls(tab === 'stickers')}><Star className="w-9 h-9 fill-sun" strokeWidth={2.5} /></button>
          <button type="button" aria-label="Wardrobe" aria-pressed={tab === 'wardrobe'} onClick={() => setTab('wardrobe')} className={tabCls(tab === 'wardrobe')}><Shirt className="w-9 h-9" strokeWidth={2.5} /></button>
        </div>
      </TopBar>

      {tab === 'stickers' ? (
        <>
          <div className="relative bg-card border-4 border-ink rounded-card shadow-tile px-6 py-8 pl-12">
            {/* binder rings */}
            <div aria-hidden className="absolute left-3 top-6 bottom-6 flex flex-col justify-around">
              {[0, 1, 2].map((r) => <span key={r} className="w-5 h-5 rounded-full bg-ground border-[3px] border-ink" />)}
            </div>
            <ul className="grid grid-cols-3 gap-4 place-items-center">
              {slice.map((l, i) => {
                const at = have.get(l.id);
                return (
                  <li key={l.id}>
                    <StickerCard state={at === undefined ? 'find' : Date.now() - at < DAY ? 'new' : 'owned'} emoji={l.emoji} tilt={i % 2 ? -4 : 4} label={at === undefined ? undefined : `${l.title} sticker`} />
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="flex items-center justify-center gap-4">
            <RoundButton onClick={() => setPage((p) => Math.max(0, p - 1))} ariaLabel="Previous page" color="sky"><ChevronLeft className="w-9 h-9" strokeWidth={3} /></RoundButton>
            <div className="flex gap-2">
              {Array.from({ length: pages }).map((_, i) => <span key={i} className={`rounded-full border-[3px] border-ink ${i === page ? 'bg-sun w-7 h-7' : 'bg-card/55 w-[18px] h-[18px]'}`} />)}
            </div>
            <RoundButton onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} ariaLabel="Next page" color="sky"><ChevronRight className="w-9 h-9" strokeWidth={3} /></RoundButton>
          </div>
        </>
      ) : (
        <>
          <div className="bg-ground border-4 border-ink rounded-card shadow-tile py-8 flex justify-center">
            <Mascot size={220} mood="happy" hat={hat} />
          </div>
          <ul className="grid grid-cols-3 gap-4 place-items-center">
            {WARDROBE.map((w) => {
              const owned = isOwned(w, totalStars);
              const on = hat === w.id;
              return (
                <li key={w.id} className="flex flex-col items-center gap-2">
                  <button type="button" disabled={!owned} aria-pressed={on} aria-label={owned ? `Wear ${w.id}` : `${w.id}, keep collecting stars`}
                    onClick={() => { updateProfile({ wardrobe: { equipped: w.id } }); speak(w.id === 'none' ? 'Bird' : w.id); }}
                    className={`tile relative w-24 h-24 !rounded-full text-5xl ${on ? '!bg-sun ring-8 ring-ink/20' : ''} ${owned ? '' : 'opacity-60'}`}>
                    <span className={owned ? '' : 'grayscale opacity-40'}>{w.emoji}</span>
                    {!owned && <Lock aria-hidden className="absolute -bottom-2 -right-2 w-8 h-8 bg-card rounded-full border-[3px] border-ink p-1" strokeWidth={3} />}
                  </button>
                  {/* star progress: a filling bar, never a price or a number */}
                  {!owned && (
                    <span aria-hidden className="flex items-center gap-1 w-24">
                      <Star className="w-5 h-5 fill-sun shrink-0" strokeWidth={2.5} />
                      <span className="flex-1 h-3 rounded-full border-[3px] border-ink bg-card overflow-hidden"><span className="block h-full bg-sun" style={{ width: `${Math.min(100, (totalStars / w.stars) * 100)}%` }} /></span>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
