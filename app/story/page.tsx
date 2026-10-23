"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { BookOpen, Headphones } from "lucide-react";
import { BN_STORIES, bnLessonId, findBnStory } from "@/lib/content/stories-bn";
import type { ReaderMode } from "@/lib/content/syllabus";
import { db, getOrCreateProfile, PROFILE_ID, updateProfile } from "@/lib/db";
import { speak, stopSpeaking } from "@/lib/speech";
import { Stars, TopBar } from "@/components/ui";
import { StoryScene } from "@/components/story/StoryScene";
import { StoryReader } from "@/components/story/StoryReader";
import { StoryQuiz } from "@/components/story/StoryQuiz";

// গল্প: Bengali picture-book stories for ages 6–10. /story/ is the shelf, /story/?id=<id>&mode=listen|read reads one.
function StoryInner() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const story = id ? findBnStory(id) : undefined;
  const profile = useLiveQuery(() => db.profiles.get(PROFILE_ID));
  const progress = useLiveQuery(() => db.progress.where("lessonId").startsWith("bn-").toArray());
  const urlMode = params.get("mode");
  const mode: ReaderMode = urlMode === "read" || urlMode === "listen" ? urlMode : (profile?.readerMode ?? "listen");
  const [stage, setStage] = useState<"read" | "quiz">("read");
  const [run, setRun] = useState(0); // bumps on "read again" to remount the reader
  const [startedAt, setStartedAt] = useState(() => Date.now());

  useEffect(() => {
    getOrCreateProfile();
  }, []);
  useEffect(() => {
    if (id && !story) router.replace("/story/");
  }, [id, story, router]);
  useEffect(() => {
    setStage("read");
    setStartedAt(Date.now());
  }, [id]);

  const setMode = (m: ReaderMode) => {
    stopSpeaking();
    updateProfile({ readerMode: m });
    if (story) router.replace(`/story/?id=${story.id}&mode=${m}`);
  };

  if (!profile || !progress) return null;

  if (story) {
    return stage === "read" ? (
      <StoryReader key={`${story.id}-${run}`} story={story} mode={mode} onMode={setMode} onFinish={() => setStage("quiz")} />
    ) : (
      <StoryQuiz
        story={story}
        mode={mode}
        startedAt={startedAt}
        onAgain={() => {
          setRun((r) => r + 1);
          setStartedAt(Date.now());
          setStage("read");
        }}
      />
    );
  }

  const stars = (sid: string) => progress.find((p) => p.lessonId === bnLessonId(sid))?.bestStars ?? 0;
  const listen = mode === "listen";
  return (
    <div className="flex flex-col gap-5 pb-10 w-full max-w-3xl mx-auto">
      <TopBar backHref="/">
        <h1 lang="bn" className="font-bn font-extrabold text-4xl -rotate-2 bg-card border-4 border-ink rounded-full shadow-tile px-6 py-1">
          গল্প
        </h1>
      </TopBar>

      {/* 🎧 শুনি / 📖 পড়ি: who reads the story */}
      <div className="flex justify-center">
        <div className="flex rounded-full border-4 border-ink bg-card shadow-tileSm overflow-hidden" role="group" aria-label="Who reads?">
          {(
            [
              ["listen", "শুনি", Headphones],
              ["read", "পড়ি", BookOpen],
            ] as const
          ).map(([m, label, Icon]) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => {
                updateProfile({ readerMode: m });
                speak(label, { lang: "bn" });
              }}
              className={`h-[72px] px-6 flex items-center gap-2 font-bn font-bold text-2xl ${mode === m ? "bg-sun" : ""}`}
            >
              <Icon className="w-8 h-8" strokeWidth={2.5} />
              <span lang="bn">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <ul className="grid grid-cols-2 md:grid-cols-3 gap-4 px-1">
        {BN_STORIES.map((s, i) => (
          <li key={s.id} className="animate-bounceIn" style={{ animationDelay: `${i * 70}ms` }}>
            <Link
              href={`/story/?id=${s.id}&mode=${listen ? "listen" : "read"}`}
              onClick={() => speak(s.title, { lang: "bn" })}
              className="tile-sm flex flex-col bg-card rounded-card overflow-hidden"
              aria-label={s.titleEn}
            >
              <StoryScene {...s.cover} enter={false} className="!rounded-none !border-0 !shadow-none border-b-4" />
              <span className="flex flex-col items-center gap-1 px-2 py-3 border-t-4 border-ink">
                <span lang="bn" className="font-bn font-bold text-xl leading-tight text-center">
                  {s.title}
                </span>
                <Stars n={stars(s.id)} size="text-xl" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function StoryPage() {
  return (
    <Suspense fallback={null}>
      <StoryInner />
    </Suspense>
  );
}
