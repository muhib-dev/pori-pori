'use client';
import { useState } from 'react';
import { Check, Lock, Palette, Star, X } from 'lucide-react';
import { THEMES, applyTheme } from '@/lib/themes';
import { updateProfile } from '@/lib/db';
import { RoundButton } from './ui';

/** `stars` = all stars the child has earned; colours unlock as it grows. */
export function ThemePicker({ current, stars }: { current: string; stars: number }) {
  const [open, setOpen] = useState(false);
  const pick = (id: string) => { applyTheme(id); updateProfile({ theme: id }); };

  return (
    <>
      <RoundButton onClick={() => setOpen(true)} ariaLabel="Change theme" color="bubblegum"><Palette className="w-8 h-8" strokeWidth={2.5} /></RoundButton>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40" onClick={() => setOpen(false)}>
          <div className="bg-paper border-4 border-ink rounded-t-[2rem] sm:rounded-[2rem] shadow-tile w-full max-w-md p-5 animate-bounceIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4">
              <h2 className="text-3xl font-semibold flex items-center gap-2"><Palette className="w-8 h-8" strokeWidth={2.5} /> Colours</h2>
              <RoundButton onClick={() => setOpen(false)} ariaLabel="Close"><X className="w-8 h-8" strokeWidth={3} /></RoundButton>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {THEMES.map((t, i) => (
                // data-theme on the preview re-scopes the CSS variables, so it shows the real palette
                <button key={t.id} type="button" data-theme={t.id} onClick={() => stars >= t.stars && pick(t.id)} disabled={stars < t.stars}
                  aria-label={stars >= t.stars ? t.name : `${t.name}, locked: ${t.stars} stars`}
                  className={`tile bg-sky p-3 flex flex-col items-center gap-2 animate-bounceIn ${stars < t.stars ? 'opacity-60' : ''}`} style={{ animationDelay: `${i * 70}ms` }}>
                  <div className="flex gap-1.5">
                    {['bg-sun', 'bg-tangerine', 'bg-grass', 'bg-berry', 'bg-bubblegum'].map((c) => <span key={c} className={`w-5 h-5 rounded-full border-2 border-ink ${c}`} />)}
                  </div>
                  <span className="text-xl font-semibold text-ink flex items-center gap-1">
                    {stars < t.stars
                      ? <><Lock className="w-5 h-5" strokeWidth={3} /><Star className="w-5 h-5 fill-sun" strokeWidth={2.5} />{t.stars}</>
                      : <>{t.name}{current === t.id && <Check className="w-5 h-5" strokeWidth={4} />}</>}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
