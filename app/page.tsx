"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookHeart, BookOpen, Dumbbell, Flame, Lock } from "lucide-react";
import {
  db,
  getOrCreateProfile,
  PROFILE_ID,
  streakAlive,
  updateProfile,
} from "@/lib/db";
import { useReducedMotion } from "@/lib/motion";
import { activeSubjectOf, findAnyLesson } from "@/lib/content/subjects";
import { pickLesson } from "@/lib/content/games";
import { RoundButton } from "@/components/ui";
import { BrandHeader, DevCredit } from "@/components/BrandHeader";
import { PlayCarousel } from "@/components/PlayCarousel";
import { SubjectBadge, SubjectSheet } from "@/components/SubjectSwitcher";
import { AvatarPicker } from "@/components/AvatarPicker";
import { OfflinePill } from "@/components/OfflinePill";
import { InstallSheet } from "@/components/InstallSheet";
import { GrownupsGate } from "@/components/GrownupsGate";
import { equippedHat } from "@/lib/content/wardrobe";

export default function Home() {
  const router = useRouter();
  const profile = useLiveQuery(() => db.profiles.get(PROFILE_ID));
  const progress = useLiveQuery(() => db.progress.toArray());
  const recent = useLiveQuery(() =>
    db.attempts.orderBy("at").reverse().limit(30).toArray(),
  );
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [picking, setPicking] = useState(false);
  const [subjects, setSubjects] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [justFinished, setJustFinished] = useState(false); // install sheet only after a completed lesson
  // Phone opened via the desktop QR (?install=1): remember it so InstallSheet can offer install once it is ready.
  useEffect(() => {
    try {
      if (new URLSearchParams(location.search).get("install") === "1")
        sessionStorage.setItem("pp-install", "1");
    } catch {
      /* private mode */
    }
  }, []);
  useEffect(() => {
    try {
      if (sessionStorage.getItem("pp-lesson-done")) {
        setJustFinished(true);
        sessionStorage.removeItem("pp-lesson-done");
      }
    } catch {
      /* private mode */
    }
  }, []);
  useEffect(() => {
    getOrCreateProfile().then(() => setReady(true));
  }, []);

  if (!ready || !profile || !progress || !recent) return null;
  // The current step is derived from progress: the first step not yet finished (steps below startStep count as skipped).
  const totalStars = progress.reduce((n, p) => n + p.bestStars, 0);
  const streak = streakAlive(profile) ? (profile.streak ?? 0) : 0;

  // "Practice": the lesson the child missed the most in their last 30 plays.
  const missesByLesson = recent.reduce<Record<string, number>>(
    (m, a) => ((m[a.lessonId] = (m[a.lessonId] ?? 0) + a.misses.length), m),
    {},
  );
  const practiceId = Object.entries(missesByLesson)
    .filter(([id, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  const practice = practiceId ? findAnyLesson(practiceId) : undefined;
  const subject = activeSubjectOf(profile);

  return (
    // Body already pads the safe areas, so subtract them: the whole home screen always fits the visible viewport.
    <div className="flex flex-col items-center gap-[clamp(2px,1dvh,12px)] pt-[clamp(2px,1.2dvh,16px)] h-[calc(100dvh-var(--safe-top)-var(--safe-bottom))] overflow-hidden">
      <header className="w-full shrink-0 flex items-center justify-between h-[clamp(64px,11dvh,112px)]">
        <RoundButton
          onClick={() => setPicking(true)}
          ariaLabel="Change avatar"
          color="card"
          className="text-5xl"
        >
          <span aria-hidden>{profile.avatar}</span>
        </RoundButton>
        <BrandHeader
          onClick={() => setSubjects(true)}
          badge={<SubjectBadge subject={subject} />}
        />
        <RoundButton
          href="/stickers/"
          ariaLabel="Sticker book"
          color="bubblegum"
        >
          <BookHeart className="w-9 h-9" strokeWidth={2.5} />
        </RoundButton>
      </header>

      <div className="shrink-0 flex items-center justify-center gap-3 min-h-9">
        <OfflinePill />
        <RoundButton href="/story/" ariaLabel="Bengali stories" color="berry">
          <BookOpen className="w-9 h-9" strokeWidth={2.5} />
        </RoundButton>
        {streak > 0 && (
          <span
            className="flex items-center gap-1 bg-card border-[3px] border-ink rounded-full px-4 py-0.5 text-2xl font-semibold shadow-tileSm"
            aria-label={`${streak} days in a row`}
          >
            <Flame className="w-6 h-6 fill-tangerine" strokeWidth={2.5} />
            {streak}
          </span>
        )}
        {practice && (
          <RoundButton
            href={`/play/?lesson=${practice.id}`}
            ariaLabel={`Practice ${practice.title}`}
            color="sun"
          >
            <Dumbbell className="w-8 h-8" strokeWidth={3} />
          </RoundButton>
        )}
      </div>

      <PlayCarousel
        key={subject.id}
        games={subject.games}
        progress={progress}
        startIndex={subject.id === "reading" ? (profile.homeIndex ?? 0) : 0}
        hat={equippedHat(profile.wardrobe?.equipped, totalStars)}
        reduced={reduced}
        onIndexChange={(i) => {
          if (subject.id === "reading") updateProfile({ homeIndex: i });
        }}
        onPlay={(g) => {
          const l = pickLesson(g, progress);
          if (l) router.push(`/play/?lesson=${l.id}`);
        }}
      />
      <div className="shrink-0 text-center pb-1">
        <DevCredit />
      </div>
      <GrownupsLock onOpen={() => setGateOpen(true)} />
      {gateOpen && <GrownupsGate onClose={() => setGateOpen(false)} />}
      <InstallSheet
        eligible={justFinished}
        lastShown={profile.installPromptLastShown}
      />
      {subjects && (
        <SubjectSheet
          active={subject.id}
          onPick={(s) => updateProfile({ activeSubject: s.id })}
          onClose={() => setSubjects(false)}
        />
      )}
      {picking && (
        <AvatarPicker
          current={profile.avatar}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  );
}

/** Grown-ups lock: intentionally small (52px) and low contrast so children do not wander in. Opens the sum modal. */
function GrownupsLock({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Grown-ups area"
      className="fixed right-4 bottom-[calc(var(--safe-bottom)+0.75rem)] z-30 w-[52px] h-[52px] rounded-full border-[3px] border-ink/30 bg-card/60 flex items-center justify-center text-ink/40"
    >
      <Lock className="w-6 h-6" strokeWidth={2.5} />
    </button>
  );
}
