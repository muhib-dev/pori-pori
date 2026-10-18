# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"পড়ি পড়ি (Pori Pori)" — a phonics reading game for children aged ~4–8, built as a local-first Next.js PWA. All progress lives in IndexedDB; the app works fully offline once loaded. See README.md for the pedagogy (Jolly Phonics order, Dolch sight words) and the level table.

## Commands

```bash
npm run dev     # http://localhost:3000
npm run build   # static export to ./out (next.config.mjs: output: 'export', trailingSlash: true)
npm start       # serves ./out with `npx serve`
npm run lint    # next lint (no ESLint config committed yet; first run prompts to create one)
npx tsc --noEmit  # type check
```

There is no test suite.

## Architecture

**Static export constraints.** `output: 'export'` means no server code: no API routes, no server actions, no dynamic route segments. Pages are client components (`'use client'`) and pass state through query strings (`/level/?id=3`, `/play/?lesson=<id>`). Pages that read `useSearchParams()` must be wrapped in `<Suspense>` (see `app/play/page.tsx`). Keep the trailing slash in internal links.

**Content-driven.** `lib/content/syllabus.ts` holds all content: `LEVELS` (shown to the child as *steps*) `→ lessons → items`, with each `Lesson` having one `game: GameType`. Adding words, sentences or stories is a data change only. Lookup helpers: `findLesson`, `levelOfLesson`. There are 12 steps in 3 zones (`Level.zone`: seeds/sprouts/trees). Progression is derived from the `progress` table plus `Profile.startStep`: `currentStepId`, `isStepUnlocked`, `isLessonUnlocked`, `isStepDone` (step done = every lesson ≥1 star, or `id < startStep`; all lessons of a skipped step stay open). Every helper takes `start` as its last argument, so pass `profile.startStep ?? 1`. Pages guard with these and `router.replace('/')` on locked URLs; `Profile.currentLevel`/`age` are legacy and unused. Lesson ids are stable (progress is keyed by them) but step ids are not: when you insert or renumber steps, update `LEGACY_STEP_MAP` and `PLACEMENT` in `syllabus.ts`. Letter items use `say` for the phonetic *sound* passed to TTS (e.g. `'sss'`), and `hint` for the key word.

**Placement, skip-ahead, reader mode.** `app/placement/page.tsx` ("Show me!") runs the `PLACEMENT` stages (each reuses an existing lesson) and saves `startStep` + `readerMode`; home redirects there while `startStep` is undefined. `app/challenge/page.tsx?step=N` is the 🚀 quiz for the step after the current one (`canChallenge` excludes story-only steps). `readerMode` (`listen`/`read`) is passed to `buildQuestions` (fewer tiles, 5 rounds in listen) and to the games (`useAutoSay` reads the prompt on arrival in listen).

**Play flow.**
1. `lib/engine.ts#buildQuestions(lesson, mode)` turns a lesson into `Question[]`: it cycles through the items, picks distractors (at most 3–4 tiles), and adds shuffled `letters` for `build-word` and shuffled `words` for `order-words`. `story` lessons skip the engine; the play page samples `lesson.stories` itself.
2. `app/play/page.tsx` renders `<Game>` (dispatcher in `components/games/Games.tsx`, keyed on `q.kind`; `story` uses `<Story>`). Each game calls `onResult(firstTry, missedText?)`. Games: hear-tap, pic-word, build-word, word-pic, sentence-pic, order-words, story, first-sound, rhyme, case-match, blend-tap, fill-blank, syllable-tap, word-hunt. Every game renders inside `components/games/Scene.tsx` (`useScene` + `<Scene kind="pond|house|train|meadow">`: story-skin stage, Bulbul reaction, miss → auto-replay at 600ms and 2nd-miss glow hint). The play bar's replay button fires a `pp-replay` window event that `useScene` listens for, and games report misses through the optional `onMiss` prop.
3. When the play finishes, `starsFor()` computes stars, `recordAttempt()` saves (and awards the lesson sticker on first 3★ and updates the day streak), then `pushPending()` runs.

Adding a new `GameType` touches: the union in `syllabus.ts`, `buildQuestions` (if it needs extra fields on `Question`), a component in `Games.tsx` (call `useScene`, wrap in `<Scene>`), the `switch` in `<Game>` (same file), and the `BADGE` map in `app/level/page.tsx`.

**Data & sync (`lib/db.ts`, `lib/sync.ts`).** Dexie DB `reading-fun` (legacy name, kept so existing users keep their data) has the tables `profiles`, `progress`, `attempts`, `outbox` and `stickers` (v2; the v2 upgrade derives `startStep` for children who already had progress). There is a single profile, `PROFILE_ID = 'local'`. Every write goes through the helpers (`getOrCreateProfile`, `updateProfile`, `recordAttempt`), which also append an `outbox` event (`profile.upsert | progress.upsert | attempt.create | sticker.create`). Don't write to tables directly, or sync will miss the change. `pushPending()` POSTs to `${NEXT_PUBLIC_SYNC_URL}/sync` and does nothing if the URL is unset. `pullRemote()` is a stub. If you change the schema, bump `this.version(n)` in Dexie; don't edit v1 in place.

**Audio (`lib/speech.ts`).** `speak(text, { clipKey })` first tries `/audio/<key>.mp3` (HEAD check, results cached in `known`/`missing` sets), then falls back to en-GB speechSynthesis at a slowed rate. Key = lower-case text with non-alphanumerics replaced by `-`. Letter sounds use `sound-<letter>` and blending prompts use `seg-<word>`.

**PWA.** `public/sw.js` is hand-written: navigations are network-first with a cache fallback, other same-origin GETs are cache-first. It is registered in `components/InstallPWA.tsx`. Bump `VERSION` when you need old caches evicted, and update the `SHELL` list when you add a top-level route (`/placement/`, `/stickers/`, `/challenge/` are there).

## Reading Road, Bulbul, wardrobe

Home (`app/page.tsx`) renders `components/ReadingRoad.tsx`: a winding SVG road with one `MapNode` per step (portrait bottom→top, tablet landscape left→right). `components/Mascot.tsx` is Bulbul (CSS bird; moods happy/talk/cheer/curious/sleepy/dance, hats). Hats unlock from total stars (`lib/content/wardrobe.ts`, never spent); only `Profile.wardrobe.equipped` is stored. `/stickers/` holds the sticker book and the wardrobe tab. Avatar picker is a sheet (`components/AvatarPicker.tsx`) opened from the home avatar. `OfflinePill` and `InstallSheet` (max once a week, `Profile.installPromptLastShown`) live on home. Reduced motion: `Profile.reducedMotion` sets `<html data-reduced-motion>` (see `lib/motion.ts`); the OS media query additionally swaps keyframes for 200ms fades. `/grownups` is a separate calm neutral palette (hard-coded hex, not theme tokens).

## Themes, icons, branding

- Colours are CSS variables (`--c-ink`, `--c-sun`, …, plus `--c-paper` page bg, `--c-card` surfaces, `--c-ground` map backdrop; space-separated RGB) defined per theme in `app/globals.css` (`[data-theme="x"]`); Tailwind tokens read them. New theme = a CSS block + an entry in `lib/themes.ts`. `applyTheme()` sets `data-theme` and localStorage; an inline script in `app/layout.tsx` applies it before paint.
- UI controls use `lucide-react`. Emoji only for content pictures (`Item.emoji`, step/lesson emoji) and avatars.
- Brand: `components/BrandHeader.tsx` ("পড়ি পড়ি" pill; `DevCredit` = "Developed by: muhibullah" footer on home); Bengali text needs `font-bn` (Noto Sans Bengali), since Fredoka has no Bengali glyphs.

## UI conventions (from README design rules)

The audience is pre-readers, so the UI follows these rules:
- One task per screen, 3–4 choices max, every tap makes a sound.
- Sessions are 5–8 questions, and progress is shown as dots, not numbers.
- No text menus. The child sees emoji plus a label of 2 words at most (`Lesson.label`); `title` is for grown-ups.
- Wrong answers wiggle or shake and the child retries. Never show an "X". Celebrate every finish.
- Stars: 3 = no first-try misses, 2 = ≤2 misses and ≥80% correct, 1 = finished.
- Fonts: `font-read` (Andika, with single-storey a/g) for any text the child reads, `font-ui` (Fredoka) for chrome.
- Styling: Tailwind "sticker board" tokens in `tailwind.config.ts`. Colours are `ink sun tangerine grass berry bubblegum sky`, shadows are `shadow-tile*`, animations are `pop wiggle shake float`. Shared primitives (`Tile` with `state`, `RoundButton` incl. pill `label`, `Dots`, `PlayBar`, `Stars`, `MapNode`, `StickerCard`, `MascotBubble`) are in `components/ui.tsx`. Tap targets ≥72px (primary 96–104px).

`/grownups` is gated behind a sum. It has name/avatar settings, the read-only current step, per-lesson stars, "needs practice" words, JSON export and reset.
