'use client';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight, Home, Medal, PartyPopper, RotateCcw, ThumbsUp, Trophy, ArrowLeft } from 'lucide-react';
import { LEVELS, findLesson, isLessonUnlocked, isStepDone, levelOfLesson } from '@/lib/content/syllabus';
import { buildQuestions, starsFor, shuffle } from '@/lib/engine';
import { db, PROFILE_ID, recordAttempt } from '@/lib/db';
import { pushPending } from '@/lib/sync';
import { speak, stopSpeaking } from '@/lib/speech';
import { Dots, Tile, RoundButton, Stars } from '@/components/ui';
import { Celebration, Confetti } from '@/components/Feedback';
import { Mascot } from '@/components/Mascot';
import { Game, Story } from '@/components/games/Games';

function PlayInner() {
  const router = useRouter();
  const lessonId = useSearchParams().get('lesson') ?? '';
  const lesson = findLesson(lessonId);
  const level = levelOfLesson(lessonId);
  const [seed, setSeed] = useState(0);
  const profile = useLiveQuery(() => db.profiles.get(PROFILE_ID));
  const mode = profile?.readerMode;
  const questions = useMemo(() => (lesson ? buildQuestions(lesson, mode) : []), [lesson, mode, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const stories = useMemo(() => (lesson?.stories ? shuffle(lesson.stories).slice(0, lesson.rounds ?? 2) : []), [lesson, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = lesson?.game === 'story' ? stories.length : questions.length;

  // Locked lessons typed into the URL go home.
  const progress = useLiveQuery(() => db.progress.toArray());
  const start = profile?.startStep ?? 1;
  const allowed = !!lesson && !!progress && !!profile && isLessonUnlocked(progress, lesson.id, start);
  useEffect(() => { if (progress && profile && !allowed) router.replace('/'); }, [progress, profile, allowed, router]);
  const stepDoneAtStart = useRef<boolean | null>(null);
  if (progress && profile && level && stepDoneAtStart.current === null) stepDoneAtStart.current = isStepDone(progress, level, start);

  const [i, setI] = useState(0);
  const [cheer, setCheer] = useState(false);
  const [misses, setMisses] = useState<string[]>([]);
  const [firstTryMisses, setFirstTryMisses] = useState(0);
  const [finished, setFinished] = useState(false);
  const [newSticker, setNewSticker] = useState(false);
  const started = useRef(Date.now());

  useEffect(() => () => stopSpeaking(), []);

  const onResult = useCallback((firstTry: boolean, missed?: string) => {
    if (!firstTry) { setFirstTryMisses((m) => m + 1); if (missed) setMisses((m) => [...m, missed]); }
    setCheer(true);
  }, []);

  const next = useCallback(() => {
    setCheer(false);
    if (i + 1 >= total) setFinished(true); else setI(i + 1);
  }, [i, total]);

  // Save once, when finished
  useEffect(() => {
    if (!finished || !lesson) return;
    const stars = starsFor(total - firstTryMisses, total, firstTryMisses);
    recordAttempt({ lessonId: lesson.id, correct: total - firstTryMisses, total, stars, durationMs: Date.now() - started.current, misses })
      .then((r) => { setNewSticker(r.newSticker); if (r.newSticker) speak('A new sticker!'); return pushPending().catch(() => {}); });
    speak(stars === 3 ? 'Three stars! Amazing!' : stars === 2 ? 'Two stars! Well done!' : 'One star! Good try!');
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lesson || !level) return <div className="pt-10 flex flex-col items-center gap-4 text-3xl">Lesson not found. <RoundButton href="/" ariaLabel="Home"><Home className="w-8 h-8" strokeWidth={2.5} /></RoundButton></div>;
  if (!progress || !allowed) return null;

  if (finished) {
    const stars = starsFor(total - firstTryMisses, total, firstTryMisses);
    // Step just completed by this play (progress is live, so this flips once the save lands)
    const stepJustDone = !stepDoneAtStart.current && isStepDone(progress, level, start);
    const nextStep = LEVELS.find((l) => l.id === level.id + 1);
    const Hero = stepJustDone ? Medal : stars === 3 ? Trophy : stars === 2 ? PartyPopper : ThumbsUp;
    return (
      <div className="flex flex-col items-center gap-8 pt-16">
        {(stars === 3 || stepJustDone) && <Confetti />}
        <Hero className="w-32 h-32 text-ink fill-sun animate-pop" strokeWidth={2} />
        {stepJustDone && <h2 className="text-4xl font-semibold animate-bounceIn">{nextStep ? 'Step done! New step open!' : 'You finished every step!'}</h2>}
        <Stars n={stars} size="text-7xl" />
        {newSticker && (
          <div className="flex items-center gap-4 animate-bounceIn" aria-label="New sticker">
            <span className="w-24 h-24 rounded-full bg-sun border-4 border-ink shadow-tile flex items-center justify-center text-6xl animate-wiggle">{lesson.emoji}</span>
            <Mascot say="New sticker!" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 w-full max-w-md pt-4">
          <Tile color="sun" className="h-28 flex-col gap-1" ariaLabel="Play again"
            onClick={() => { setSeed((s) => s + 1); setI(0); setMisses([]); setFirstTryMisses(0); setNewSticker(false); setFinished(false); started.current = Date.now(); }}>
            <RotateCcw className="w-12 h-12" strokeWidth={3} /><span className="text-xl font-semibold">Again</span>
          </Tile>
          <Tile color="grass" className="h-28 flex-col gap-1" ariaLabel="Next" onClick={() => router.push(stepJustDone ? (nextStep ? `/level/?id=${nextStep.id}` : '/') : `/level/?id=${level.id}`)}>
            <ArrowRight className="w-12 h-12" strokeWidth={3} /><span className="text-xl font-semibold">Next</span>
          </Tile>
        </div>
      </div>
    );
  }

  const q = questions[i];
  const key = `${seed}-${i}`;
  return (
    <div className="flex flex-col gap-6 min-h-[100dvh]">
      <header className="flex items-center gap-3 pt-4">
        <RoundButton href={`/level/?id=${level.id}`} ariaLabel="Back"><ArrowLeft className="w-8 h-8" strokeWidth={3} /></RoundButton>
        <div className="flex-1"><Dots total={total} done={i} current={i} /></div>
        <span className="w-16" />
      </header>

      <section className="flex-1 flex flex-col justify-center py-4" key={key}>
        {lesson.game === 'story' ? <Story story={stories[i]} onResult={onResult} /> : <Game q={q} onResult={onResult} mode={mode} />}
      </section>

      <Celebration show={cheer} onDone={next} />
    </div>
  );
}

export default function PlayPage() {
  return <Suspense fallback={null}><PlayInner /></Suspense>;
}
