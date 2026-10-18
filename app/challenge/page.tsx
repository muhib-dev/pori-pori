'use client';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { Home, Rocket } from 'lucide-react';
import { LEVELS, canChallenge, currentStepId } from '@/lib/content/syllabus';
import { buildQuestions, shuffle } from '@/lib/engine';
import { db, PROFILE_ID, updateProfile } from '@/lib/db';
import { pushPending } from '@/lib/sync';
import { speak, stopSpeaking } from '@/lib/speech';
import { Dots, RoundButton, Tile } from '@/components/ui';
import { Celebration, Confetti } from '@/components/Feedback';
import { Mascot } from '@/components/Mascot';
import { Game } from '@/components/games/Games';

// 🚀 Skip-ahead challenge: 5 mixed questions from the NEXT step. 4 first-try right opens it
// (and counts every step before it as done). Otherwise: "Let's practise first", no penalty.
const QUESTIONS = 5;
const NEEDED = 4;

function ChallengeInner() {
  const router = useRouter();
  const stepParam = Number(useSearchParams().get('step') ?? 0);
  const step = LEVELS.find((l) => l.id === stepParam);
  const progress = useLiveQuery(() => db.progress.toArray());
  const profile = useLiveQuery(() => db.profiles.get(PROFILE_ID));
  const start = profile?.startStep ?? 1;
  const mode = profile?.readerMode;
  const [i, setI] = useState(0);
  const [misses, setMisses] = useState(0);
  const [cheer, setCheer] = useState(false);
  const [result, setResult] = useState<'pass' | 'practise' | null>(null);

  // Only the step right after the current one can be challenged.
  const allowed = !!step && !!progress && !!profile && step.id === currentStepId(progress, start) + 1 && canChallenge(step);
  // After a pass startStep moves up, so `allowed` turns false: only redirect while still quizzing.
  useEffect(() => { if (progress && profile && !allowed && result === null) router.replace('/'); }, [progress, profile, allowed, result, router]);

  // One question from each (non-story) lesson in turn, so the quiz samples the whole step.
  const questions = useMemo(() => {
    if (!step) return [];
    const lessons = step.lessons.filter((l) => l.game !== 'story');
    const out = [];
    for (let i = 0; out.length < QUESTIONS && lessons.length; i++) out.push(buildQuestions(lessons[i % lessons.length], mode, 1)[0]);
    return shuffle(out);
  }, [step, mode]);

  const saved = useRef(false);
  useEffect(() => () => stopSpeaking(), []);

  const onResult = useCallback((firstTry: boolean) => {
    if (!firstTry) setMisses((m) => m + 1);
    setCheer(true);
  }, []);

  const next = useCallback(() => {
    setCheer(false);
    if (i + 1 < questions.length) { setI(i + 1); return; }
    const pass = questions.length - misses >= NEEDED;
    setResult(pass ? 'pass' : 'practise');
    speak(pass ? 'You did it! New step!' : 'Let’s practise first!');
    if (pass && step && !saved.current) {
      saved.current = true;
      updateProfile({ startStep: step.id }).then(() => pushPending().catch(() => {}));
    }
  }, [i, questions.length, misses, step]);

  if (!step || !progress || !profile || !allowed && result === null) return null;

  if (result) {
    return (
      <div className="flex flex-col items-center gap-8 pt-16">
        {result === 'pass' && <Confetti />}
        <Rocket className="w-32 h-32 text-ink fill-sun animate-pop" strokeWidth={2} />
        <Mascot say={result === 'pass' ? 'New step!' : 'Let’s practise first!'} />
        <div className="flex items-center gap-4 text-5xl font-semibold"><span className="animate-float">{step.emoji}</span>{step.name}</div>
        <Tile href={result === 'pass' ? `/level/?id=${step.id}` : '/'} color="grass" className="w-full max-w-md h-24 gap-3" ariaLabel={result === 'pass' ? 'Go' : 'Home'}>
          {result === 'pass' ? <span className="text-5xl font-semibold">Go!</span> : <Home className="w-12 h-12" strokeWidth={3} />}
        </Tile>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 min-h-[100dvh]">
      <header className="flex items-center gap-3 pt-4">
        <RoundButton href="/" ariaLabel="Back"><Home className="w-8 h-8" strokeWidth={3} /></RoundButton>
        <div className="flex-1"><Dots total={questions.length} done={i} current={i} /></div>
        <span className="w-16" />
      </header>
      <section className="flex-1 flex flex-col justify-center py-4" key={i}>
        <Game q={questions[i]} onResult={onResult} mode={mode} />
      </section>
      <Celebration show={cheer} onDone={next} />
    </div>
  );
}

export default function ChallengePage() {
  return <Suspense fallback={null}><ChallengeInner /></Suspense>;
}
