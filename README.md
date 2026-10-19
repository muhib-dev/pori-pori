# পড়ি পড়ি (Pori Pori) 📖

A reading game for young children (ages ~4–8). Next.js PWA, **local-first**: all progress lives in the browser's IndexedDB; a sync outbox is ready for your API later. Works fully offline once opened.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export → ./out  (deploy to Vercel / Netlify / any static host, or serve over HTTPS for PWA install)
```

## Why these lessons (the research in one page)

Most English-medium schools in Bangladesh teach reading with **Jolly Phonics** (synthetic phonics) plus Oxford/Cambridge readers. The things that make the biggest difference for a reluctant 5–7-year-old, in order:

1. **Letter sounds, not names** (s a t i p n → c k e h r m d → …). Sounds are what you blend.
2. **Blending CVC words** (c-a-t). This is the moment "reading" clicks.
3. **Sight words** (Dolch pre-primer/primer: *the, is, you, said…*). ~50 words cover half of all text; they must be known on sight. Introduced 5 per lesson so 1–2 new ones stick per play.
4. **Digraphs & blends** (sh ch th ng, fr st cl). Unlocks most picture-book words.
5. **Sentences**: read one, understand it, put words in order.
6. **Long vowels** (magic-e, ee, oo, ai, oa) and **tiny stories with one question** → comprehension.

Design rules that came out of looking at apps that actually get used (Teach Your Monster, Homer, Duolingo ABC): **one task per screen, 3–4 choices max, every tap makes a sound, sessions of 5–8 questions, dots not numbers, no text menus, wrong answers wiggle and let you try again (never "X"), celebrate every finish.**

## Steps

Twelve steps in three zones, shown as a reading trail on the home screen:

| Zone | Step | Focus | Game types |
|---|---|---|---|
| 🌱 Seeds (listen & tap) | 1 Sound Play | first sounds, rhymes | hear → tap letter, rhyme match |
| | 2 Letter Sounds | Jolly Phonics groups 1–4, capital ↔ small | hear → tap letter, A → a |
| | 3 Blend Words | CVC with a/e/i/o/u | build the word, hear sounds → picture, word → picture |
| | 4 Word Families | -at -an -ig -op -ug | build the word, word → picture |
| 🌿 Sprouts (read words) | 5 Sight Words | Dolch sets 1–4 + picture words | hear → tap word, picture → word |
| | 6 Sounds Together | sh ch th ng, blends | picture → word, build the word |
| | 7 Read Sentences | decodable sentences | sentence → picture, order the words, fill the gap |
| | 8 Story Time | three-line stories | story + question |
| 🌳 Trees (read stories) | 9 Big Reader | magic-e, vowel teams, stories | picture → word, build, stories + question |
| | 10 Tricky Sounds | ar or ow/ou oi/oy | picture → word, build, sentence → picture |
| | 11 Long Words | compound and two-chunk words | tap the chunks, picture → word |
| | 12 Super Reader | fluency, longer text | word hunt, fill the gap, long sentences, longer stories |

**Finding the right start.** A new child starts at step 1. Grown-ups can change the starting step (`startStep`; steps before it count as done and stay open to replay) and the reading mode (🎧 Listen: reads questions aloud, fewer choices · 📖 Read). The next locked step shows a 🚀: a 5-question quiz that opens it if 4 are right first time (no penalty otherwise).

**Order inside a step:** a step opens when every lesson in the previous step has ≥1 star, and lessons inside a step open in order. Locked steps/lessons typed into the URL redirect home. Stars: 3 = no mistakes, 2 = ≤2 first-try mistakes, 1 = finished.

**Rewards:** a sticker per lesson on its first 3 stars (album at `/stickers/`), a gentle 🔥 day streak, and a "Practice" tile for the lesson the child missed most recently.

**Themes:** the palette button on the home screen switches the whole app between 6 colour themes (stored in the profile + localStorage). **Icons:** UI controls use `lucide-react`; emoji are used only for the content pictures (pig, ship, bike…) and avatars.

All content is in `lib/content/syllabus.ts` — add a word, a sentence or a story by adding one line.

## Audio

Browser speech synthesis is used by default (slow, UK English voice). It is poor at pure letter *sounds* ("mmm"). To fix that properly, drop MP3s into `public/audio/` and they are used automatically:

- `sound-s.mp3`, `sound-a.mp3` … for letter sounds
- `cat.mp3`, `the-cat-is-on-the-bed.mp3` … for any word/sentence (lower-case, spaces → `-`, punctuation removed)
- `seg-cat.mp3` for the slow "c…a…t…cat" blending prompt

Best source: record yourself or her teacher — a familiar voice beats TTS for a child.

## Data & sync

`lib/db.ts` (Dexie / IndexedDB): `profiles`, `progress`, `attempts` (with the words she got wrong), `outbox`.

Every write appends an event to `outbox` (`profile.upsert | progress.upsert | attempt.create`). `lib/sync.ts#pushPending()` POSTs pending events to `${NEXT_PUBLIC_SYNC_URL}/sync` and marks them synced on 2xx. It runs on app start, when the device comes online and after every game. Set the env var and implement that endpoint (idempotent on event `id`) and you have sync; `pullRemote()` is the stub for the reverse direction (merge by `updatedAt`).

Grown-ups area (gated by a sum): name, avatar, age, level, per-lesson stars, "needs more practice" words, export JSON backup, reset.

## Stack

Next.js 14 (App Router, `output: 'export'`), TypeScript, Tailwind, Dexie 4 + dexie-react-hooks, hand-written service worker (`public/sw.js`: network-first pages, cache-first assets), self-hosted fonts (Fredoka for UI, **Andika** for reading text — a literacy font with single-storey *a* and *g*, the shapes children are taught to write).
