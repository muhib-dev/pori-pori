'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { LEVELS } from '@/lib/content/syllabus';
import { TopBar } from '@/components/ui';

// Sticker album: one sticker per lesson, earned the first time the child gets 3 stars there.
export default function Stickers() {
  const stickers = useLiveQuery(() => db.stickers.toArray());
  if (!stickers) return null;
  const have = new Set(stickers.map((s) => s.lessonId));

  return (
    <div className="flex flex-col gap-6">
      <TopBar backHref="/"><span className="text-4xl font-semibold">Stickers</span></TopBar>
      {LEVELS.map((lv) => (
        <section key={lv.id} className="flex flex-col gap-2">
          <h2 className="flex items-center gap-2 text-2xl font-semibold"><span aria-hidden>{lv.emoji}</span>{lv.name}</h2>
          <ul className="grid grid-cols-4 gap-3">
            {lv.lessons.map((l) => {
              const got = have.has(l.id);
              return (
                <li key={l.id} aria-label={got ? `${l.title} sticker` : 'Not yet'}
                  className={`aspect-square rounded-full border-4 flex items-center justify-center text-5xl ${got ? 'bg-sun border-ink shadow-tile animate-pop' : 'bg-paper/50 border-dashed border-ink/30 text-ink/25'}`}>
                  {got ? l.emoji : '?'}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
