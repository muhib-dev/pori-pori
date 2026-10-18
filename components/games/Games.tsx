'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Question } from '@/lib/engine';
import { LETTER_BY_CHAR, type Item, type ReaderMode, type StoryItem } from '@/lib/content/syllabus';
import { speak, speakSegmented } from '@/lib/speech';
import { ArrowRight } from 'lucide-react';
import { Tile } from '../ui';
import { Burst } from '../Feedback';
import { Speaker } from '../Speaker';

// Every game receives one question and reports: onResult(correctOnFirstTry)
export interface GameProps {
  q: Question;
  onResult: (firstTry: boolean, missedText?: string) => void;
  mode?: ReaderMode; // 'listen' reads the prompt aloud as soon as the question appears
}

/** Say the prompt on arrival for pre-readers; readers tap the speaker if they want it. */
function useAutoSay(say: () => void, mode?: ReaderMode) {
  useEffect(() => {
    if (mode !== 'listen') return;
    const id = setTimeout(say, 400);
    return () => clearTimeout(id);
  }, [say, mode]);
}

const promptFor = (item: Item) => item.say ?? item.text;

// -------- shared choice grid: 2–4 big tiles, wrong answers shake, right pops ---
function Choices({
  options, answer, render, onResult, big,
}: {
  options: Item[]; answer: number; render: (it: Item) => React.ReactNode;
  onResult: GameProps['onResult']; big?: boolean;
}) {
  const [wrong, setWrong] = useState<number[]>([]);
  const [done, setDone] = useState<number | null>(null);
  const tried = useRef(false);

  const tap = (i: number) => {
    if (done !== null) return;
    if (i === answer) {
      setDone(i);
      speak(promptFor(options[i]), { rate: 0.9 });
      setTimeout(() => onResult(!tried.current, tried.current ? options[answer].text : undefined), 450);
    } else {
      tried.current = true;
      setWrong((w) => [...w, i]);
      speak(promptFor(options[i]), { rate: 0.9 });
      setTimeout(() => setWrong((w) => w.filter((x) => x !== i)), 400);
    }
  };

  const cols = options.length <= 2 ? 'grid-cols-2' : options.length === 3 ? 'grid-cols-3' : 'grid-cols-2';
  return (
    <div className={`grid ${cols} gap-4 w-full max-w-xl mx-auto`}>
      {options.map((it, i) => (
        <div key={it.text + i} className="relative animate-bounceIn" style={{ animationDelay: `${i * 90}ms` }}>
        {done === i && <Burst />}
        <Tile
          onClick={() => tap(i)}
          color={done === i ? 'grass' : 'paper'}
          className={`w-full ${big ? 'min-h-40' : 'min-h-28'} ${wrong.includes(i) ? 'animate-shake' : ''} ${done === i ? 'animate-pop' : ''}`}
          ariaLabel={it.text}
        >
          {render(it)}
        </Tile>
        </div>
      ))}
    </div>
  );
}

// -------- 1. HEAR → TAP (letter sounds, sight words) -------------------------
export function HearTap({ q, onResult }: GameProps) {
  const say = useCallback(() => {
    const t = q.target;
    const isLetter = !!t.hint;
    speak(isLetter ? `${t.say}. ${t.say}. ${t.hint}` : t.text, { clipKey: isLetter ? `sound-${t.text}` : undefined });
  }, [q]);
  useEffect(() => { const id = setTimeout(say, 350); return () => clearTimeout(id); }, [say]);
  const isLetter = !!q.target.hint;
  return (
    <div className="flex flex-col items-center gap-8">
      <Speaker onSpeak={say} pulse />
      {isLetter && <div className="text-6xl" aria-hidden>{q.target.emoji}</div>}
      <Choices
        options={q.options} answer={q.answer} onResult={onResult} big
        render={(it) => <span className="font-read text-7xl leading-none">{it.text}</span>}
      />
    </div>
  );
}

// -------- 2. PICTURE → WORD -------------------------------------------------
export function PicWord({ q, onResult, mode }: GameProps) {
  const say = useCallback(() => speak(q.target.text), [q]);
  useAutoSay(say, mode);
  return (
    <div className="flex flex-col items-center gap-8">
      <Tile className="w-56 h-56 text-[7rem]" color="sun" onClick={say} ariaLabel="Picture">{q.target.emoji}</Tile>
      <Choices
        options={q.options} answer={q.answer} onResult={onResult}
        render={(it) => <span className="font-read text-5xl">{it.text}</span>}
      />
    </div>
  );
}

// -------- 3. WORD → PICTURE -------------------------------------------------
export function WordPic({ q, onResult, mode }: GameProps) {
  const say = useCallback(() => speak(q.target.text), [q]);
  useAutoSay(say, mode);
  return (
    <div className="flex flex-col items-center gap-8">
      <button type="button" onClick={say} className="font-read text-7xl bg-paper border-4 border-ink rounded-3xl px-10 py-4 shadow-tile">
        {q.target.text}
      </button>
      <Speaker onSpeak={say} size="lg" />
      <Choices
        options={q.options} answer={q.answer} onResult={onResult} big
        render={(it) => <span className="text-7xl">{it.emoji}</span>}
      />
    </div>
  );
}

// -------- 4. BUILD THE WORD (blending) --------------------------------------
export function BuildWord({ q, onResult }: GameProps) {
  const word = q.target.text;
  const [placed, setPlaced] = useState<string[]>([]);
  const [used, setUsed] = useState<number[]>([]);
  const [shakeIdx, setShakeIdx] = useState<number | null>(null);
  const tried = useRef(false);
  const letters = q.letters!;

  const sayWord = useCallback(() => speakSegmented(word), [word]);
  useEffect(() => { const id = setTimeout(sayWord, 400); return () => clearTimeout(id); }, [sayWord]);

  const tap = (i: number) => {
    if (used.includes(i)) return;
    const need = word[placed.length];
    if (letters[i] === need) {
      speak(letters[i], { rate: 0.9, clipKey: `sound-${letters[i]}` });
      const next = [...placed, letters[i]];
      setPlaced(next); setUsed([...used, i]);
      if (next.length === word.length) {
        setTimeout(() => speak(word), 300);
        setTimeout(() => onResult(!tried.current, tried.current ? word : undefined), 1100);
      }
    } else {
      tried.current = true;
      setShakeIdx(i);
      setTimeout(() => setShakeIdx(null), 400);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-5">
        <Tile className="w-40 h-40 text-[5.5rem]" color="sun" onClick={sayWord} ariaLabel="Picture">{q.target.emoji}</Tile>
        <Speaker onSpeak={sayWord} size="lg" />
      </div>
      {/* slots */}
      <div className="flex gap-3">
        {word.split('').map((_, i) => (
          <div key={i} className={`w-20 h-24 rounded-2xl border-4 border-dashed flex items-center justify-center font-read text-6xl ${placed[i] ? 'bg-grass border-ink border-solid animate-pop' : 'border-ink/40 bg-paper/60'}`}>
            {placed[i] ?? ''}
          </div>
        ))}
      </div>
      {/* letter bank */}
      <div className="flex flex-wrap justify-center gap-3 max-w-md">
        {letters.map((l, i) => (
          <Tile key={i} onClick={() => tap(i)} disabled={used.includes(i)}
            className={`w-20 h-24 ${shakeIdx === i ? 'animate-shake' : ''}`} ariaLabel={l}>
            <span className="font-read text-6xl">{l}</span>
          </Tile>
        ))}
      </div>
    </div>
  );
}

// -------- 5. SENTENCE → PICTURE ---------------------------------------------
export function SentencePic({ q, onResult, mode }: GameProps) {
  const say = useCallback(() => speak(q.target.text, { rate: 0.8 }), [q]);
  useAutoSay(say, mode);
  const words = q.target.text.split(' ');
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="bg-paper border-4 border-ink rounded-3xl shadow-tile px-6 py-5 max-w-xl flex flex-wrap justify-center gap-x-3 gap-y-2">
        {words.map((w, i) => (
          <button key={i} type="button" onClick={() => speak(w.replace(/\.$/, ''))} className="font-read text-4xl sm:text-5xl rounded-xl px-1 active:bg-sun">
            {w}
          </button>
        ))}
      </div>
      <Speaker onSpeak={say} size="lg" />
      <Choices
        options={q.options} answer={q.answer} onResult={onResult} big
        render={(it) => <span className="text-6xl tracking-wider">{it.emoji}</span>}
      />
    </div>
  );
}

// -------- 6. ORDER THE WORDS ------------------------------------------------
export function OrderWords({ q, onResult }: GameProps) {
  const target = q.target.text.replace(/\.$/, '').split(' ');
  const bank = q.words!;
  const [placed, setPlaced] = useState<number[]>([]);
  const [shake, setShake] = useState<number | null>(null);
  const tried = useRef(false);
  const say = useCallback(() => speak(q.target.text, { rate: 0.8 }), [q]);
  useEffect(() => { const id = setTimeout(say, 400); return () => clearTimeout(id); }, [say]);

  const tap = (i: number) => {
    if (placed.includes(i)) return;
    if (bank[i] === target[placed.length]) {
      speak(bank[i], { rate: 0.95 });
      const next = [...placed, i];
      setPlaced(next);
      if (next.length === target.length) {
        setTimeout(say, 300);
        setTimeout(() => onResult(!tried.current, tried.current ? q.target.text : undefined), 1400);
      }
    } else { tried.current = true; setShake(i); setTimeout(() => setShake(null), 400); }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-4">
        <div className="text-6xl">{q.target.emoji}</div>
        <Speaker onSpeak={say} size="lg" />
      </div>
      <div className="min-h-24 w-full max-w-xl bg-paper/70 border-4 border-dashed border-ink/40 rounded-3xl p-4 flex flex-wrap gap-3 justify-center items-center">
        {placed.length === 0 && <span className="text-ink/40 text-2xl">Tap the words in order</span>}
        {placed.map((i) => <span key={i} className="font-read text-4xl bg-grass border-4 border-ink rounded-2xl px-4 py-1 animate-pop">{bank[i]}</span>)}
      </div>
      <div className="flex flex-wrap gap-3 justify-center max-w-xl">
        {bank.map((w, i) => (
          <Tile key={i} onClick={() => tap(i)} disabled={placed.includes(i)} className={`px-5 py-3 ${shake === i ? 'animate-shake' : ''}`} ariaLabel={w}>
            <span className="font-read text-4xl">{w}</span>
          </Tile>
        ))}
      </div>
    </div>
  );
}

// -------- 7. TINY STORY -----------------------------------------------------
export function Story({ story, onResult }: { story: StoryItem; onResult: GameProps['onResult'] }) {
  const [page, setPage] = useState(0); // 0..lines.length-1 then question
  const [wrong, setWrong] = useState<number | null>(null);
  const tried = useRef(false);
  const line = story.lines[page];
  const atQuestion = page >= story.lines.length;

  const say = useCallback(() => speak(atQuestion ? story.question : line, { rate: 0.8 }), [atQuestion, line, story.question]);
  useEffect(() => { const id = setTimeout(say, 400); return () => clearTimeout(id); }, [say]);

  const answer = (i: number) => {
    if (i === story.answer) { speak('Yes!'); setTimeout(() => onResult(!tried.current, tried.current ? story.title : undefined), 500); }
    else { tried.current = true; setWrong(i); speak(story.options[i]); setTimeout(() => setWrong(null), 400); }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="text-7xl animate-float">{story.emoji}</div>
      <div className="bg-paper border-4 border-ink rounded-3xl shadow-tile px-6 py-6 w-full max-w-xl min-h-36 flex flex-wrap justify-center items-center gap-x-3 gap-y-2">
        {(atQuestion ? story.question : line).split(' ').map((w, i) => (
          <button key={i} type="button" onClick={() => speak(w.replace(/[.!?,"”]/g, ''))} className="font-read text-4xl rounded-xl px-1 active:bg-sun">{w}</button>
        ))}
      </div>
      {!atQuestion ? (
        <div className="flex items-center gap-6">
          <Speaker onSpeak={say} size="lg" />
          <Tile color="grass" className="px-8 h-20" onClick={() => setPage(page + 1)} ariaLabel="Next page">
            <ArrowRight className="w-10 h-10" strokeWidth={3} />
          </Tile>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 w-full max-w-xl">
          {story.options.map((o, i) => (
            <Tile key={o} onClick={() => answer(i)} className={`min-h-24 ${wrong === i ? 'animate-shake' : ''}`}>
              <span className="font-read text-3xl">{o}</span>
            </Tile>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        {story.lines.map((_, i) => <span key={i} className={`w-3 h-3 rounded-full border-2 border-ink ${i <= page ? 'bg-ink' : 'bg-paper'}`} />)}
      </div>
    </div>
  );
}

// -------- 8. FIRST SOUND: hear a word, tap the letter it starts with --------
export function FirstSound({ q, onResult }: GameProps) {
  const say = useCallback(() => speak(q.target.text), [q]);
  useEffect(() => { const id = setTimeout(say, 350); return () => clearTimeout(id); }, [say]);
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-5">
        <Tile className="w-40 h-40 text-[5.5rem]" color="sun" onClick={say} ariaLabel="Picture">{q.target.emoji}</Tile>
        <Speaker onSpeak={say} size="lg" pulse />
      </div>
      <Choices options={q.options} answer={q.answer} onResult={onResult} big
        render={(it) => <span className="font-read text-7xl leading-none">{it.text}</span>} />
    </div>
  );
}

// -------- 9. RHYME: tap the picture that rhymes with the one shown ----------
export function Rhyme({ q, onResult }: GameProps) {
  const say = useCallback(() => speak(q.target.text), [q]);
  useEffect(() => { const id = setTimeout(say, 350); return () => clearTimeout(id); }, [say]);
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-5">
        <Tile className="w-44 h-44 text-[6rem]" color="sun" onClick={say} ariaLabel="Picture">{q.target.emoji}</Tile>
        <Speaker onSpeak={say} size="lg" pulse />
      </div>
      <Choices options={q.options} answer={q.answer} onResult={onResult} big
        render={(it) => <span className="text-7xl">{it.emoji}</span>} />
    </div>
  );
}

// -------- 10. CAPITAL → small letter ---------------------------------------
export function CaseMatch({ q, onResult, mode }: GameProps) {
  const say = useCallback(() => speak(q.target.say ?? q.target.text, { clipKey: `sound-${q.target.text}` }), [q]);
  useAutoSay(say, mode);
  return (
    <div className="flex flex-col items-center gap-8">
      <Tile className="w-44 h-44" color="sun" onClick={say} ariaLabel="Capital letter">
        <span className="font-read text-[7rem] leading-none">{q.target.text.toUpperCase()}</span>
      </Tile>
      <Choices options={q.options} answer={q.answer} onResult={onResult} big
        render={(it) => <span className="font-read text-7xl leading-none">{it.text}</span>} />
    </div>
  );
}

// -------- 11. BLEND-TAP: hear the separate sounds, blend, tap the picture ----
const soundOf = (c: string) => LETTER_BY_CHAR[c]?.say ?? c;
export function BlendTap({ q, onResult }: GameProps) {
  const letters = q.target.text.split('');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Say each sound on its own (never the whole word: the child blends it).
  const say = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = letters.map((c, i) => setTimeout(() => speak(soundOf(c), { rate: 0.8, clipKey: `sound-${c}` }), i * 800));
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const id = setTimeout(say, 400); return () => { clearTimeout(id); timers.current.forEach(clearTimeout); }; }, [say]);
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-5">
        <div className="flex gap-2">
          {letters.map((c, i) => (
            <Tile key={i} color="sun" className="w-20 h-24" onClick={() => speak(soundOf(c), { rate: 0.8, clipKey: `sound-${c}` })} ariaLabel={c}>
              <span className="font-read text-6xl">{c}</span>
            </Tile>
          ))}
        </div>
        <Speaker onSpeak={say} size="lg" pulse />
      </div>
      <Choices options={q.options} answer={q.answer} onResult={onResult} big
        render={(it) => <span className="text-7xl">{it.emoji}</span>} />
    </div>
  );
}

// -------- 12. FILL THE GAP ---------------------------------------------------
export function FillBlank({ q, onResult, mode }: GameProps) {
  const focus = q.focus!;
  const words = q.target.text.split(' ');
  // The spoken prompt must not give the answer away.
  const say = useCallback(() => speak(q.target.text.replace(new RegExp(`\\b${focus}\\b`), 'blank'), { rate: 0.8 }), [q, focus]);
  useAutoSay(say, mode);
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-6xl" aria-hidden>{q.target.emoji}</div>
      <div className="bg-paper border-4 border-ink rounded-3xl shadow-tile px-6 py-5 max-w-xl flex flex-wrap justify-center items-end gap-x-3 gap-y-2">
        {words.map((w, i) => i === words.length - 1
          ? <span key={i} className="inline-block min-w-24 border-b-8 border-ink/40 font-read text-4xl sm:text-5xl text-center">{w.endsWith('.') ? '?.' : '?'}</span>
          : <span key={i} className="font-read text-4xl sm:text-5xl">{w}</span>)}
      </div>
      <Speaker onSpeak={say} size="lg" />
      <Choices options={q.options} answer={q.answer} onResult={onResult} big
        render={(it) => <span className="font-read text-5xl">{it.text}</span>} />
    </div>
  );
}

// -------- 13. SYLLABLE-TAP: tap the chunks of a long word in order ----------
export function SyllableTap({ q, onResult }: GameProps) {
  const parts = q.target.hint!.split('-');
  const bank = q.chunks!;
  const [placed, setPlaced] = useState<number[]>([]);
  const [shake, setShake] = useState<number | null>(null);
  const tried = useRef(false);
  const say = useCallback(() => speak(q.target.text, { rate: 0.8 }), [q]);
  useEffect(() => { const id = setTimeout(say, 400); return () => clearTimeout(id); }, [say]);

  const tap = (i: number) => {
    if (placed.includes(i)) return;
    if (bank[i] === parts[placed.length]) {
      speak(bank[i], { rate: 0.85 });
      const next = [...placed, i];
      setPlaced(next);
      if (next.length === parts.length) {
        setTimeout(say, 500);
        setTimeout(() => onResult(!tried.current, tried.current ? q.target.text : undefined), 1500);
      }
    } else { tried.current = true; setShake(i); setTimeout(() => setShake(null), 400); }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-5">
        <Tile className="w-40 h-40 text-[5.5rem]" color="sun" onClick={say} ariaLabel="Picture">{q.target.emoji}</Tile>
        <Speaker onSpeak={say} size="lg" />
      </div>
      <div className="flex gap-3">
        {parts.map((_, i) => (
          <div key={i} className={`min-w-28 h-24 px-3 rounded-2xl border-4 flex items-center justify-center font-read text-5xl ${placed[i] !== undefined ? 'bg-grass border-ink animate-pop' : 'border-dashed border-ink/40 bg-paper/60'}`}>
            {placed[i] !== undefined ? bank[placed[i]] : ''}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-3 max-w-md">
        {bank.map((c, i) => (
          <Tile key={i} onClick={() => tap(i)} disabled={placed.includes(i)} className={`px-5 h-24 ${shake === i ? 'animate-shake' : ''}`} ariaLabel={c}>
            <span className="font-read text-5xl">{c}</span>
          </Tile>
        ))}
      </div>
    </div>
  );
}

// -------- 14. WORD HUNT: hear a word, find it in the sentence ----------------
export function WordHunt({ q, onResult }: GameProps) {
  const words = q.words!;
  const focus = q.focus!;
  const [wrong, setWrong] = useState<number | null>(null);
  const [found, setFound] = useState<number | null>(null);
  const tried = useRef(false);
  const say = useCallback(() => speak(focus), [focus]);
  useEffect(() => { const id = setTimeout(say, 350); return () => clearTimeout(id); }, [say]);

  const tap = (i: number) => {
    if (found !== null) return;
    if (words[i] === focus) {
      setFound(i);
      speak(focus);
      setTimeout(() => onResult(!tried.current, tried.current ? focus : undefined), 700);
    } else {
      tried.current = true;
      setWrong(i);
      speak(words[i]);
      setTimeout(() => setWrong(null), 400);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-4">
        <div className="text-6xl" aria-hidden>{q.target.emoji}</div>
        <Speaker onSpeak={say} size="lg" pulse />
      </div>
      <div className="flex flex-wrap justify-center gap-3 max-w-xl">
        {words.map((w, i) => (
          <Tile key={i} onClick={() => tap(i)} color={found === i ? 'grass' : 'paper'}
            className={`px-4 h-20 ${wrong === i ? 'animate-shake' : ''} ${found === i ? 'animate-pop' : ''}`} ariaLabel={w}>
            <span className="font-read text-4xl">{w}</span>
          </Tile>
        ))}
      </div>
    </div>
  );
}

// -------- dispatcher for every one-question game (story has its own props) ----
export function Game({ q, onResult, mode }: GameProps) {
  switch (q.kind) {
    case 'hear-tap': return <HearTap q={q} onResult={onResult} mode={mode} />;
    case 'pic-word': return <PicWord q={q} onResult={onResult} mode={mode} />;
    case 'word-pic': return <WordPic q={q} onResult={onResult} mode={mode} />;
    case 'build-word': return <BuildWord q={q} onResult={onResult} mode={mode} />;
    case 'sentence-pic': return <SentencePic q={q} onResult={onResult} mode={mode} />;
    case 'order-words': return <OrderWords q={q} onResult={onResult} mode={mode} />;
    case 'first-sound': return <FirstSound q={q} onResult={onResult} mode={mode} />;
    case 'rhyme': return <Rhyme q={q} onResult={onResult} mode={mode} />;
    case 'case-match': return <CaseMatch q={q} onResult={onResult} mode={mode} />;
    case 'blend-tap': return <BlendTap q={q} onResult={onResult} mode={mode} />;
    case 'fill-blank': return <FillBlank q={q} onResult={onResult} mode={mode} />;
    case 'syllable-tap': return <SyllableTap q={q} onResult={onResult} mode={mode} />;
    case 'word-hunt': return <WordHunt q={q} onResult={onResult} mode={mode} />;
    default: return null; // 'story' is rendered by <Story>
  }
}
