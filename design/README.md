# Handoff: পড়ি পড়ি (Pori Pori) — "Reading Road" kids redesign

## Overview
Redesign of the Pori Pori phonics reading PWA (ages 4–8) so reading feels like play: an illustrated map ("Reading Road") instead of a step list, a companion mascot (Bulbul the bird), story skins for all 5 game types, a sticker book + mascot wardrobe, and a calmer grown-ups area.

## About the Design Files
The `.dc.html` files are **design references built in HTML** — they show intended look and behaviour, not production code. Recreate them in the existing app: **Next.js 14 static export (client components), Tailwind with CSS-variable tokens, lucide-react icons**. Do not ship the HTML. Open `Pori Pori Redesign.dc.html` in a browser (keep `support.js` and the other `.dc.html` files beside it) to see every screen on one pan/zoom board. Each frame has an id badge (1a…1z) referenced below.

## Fidelity
**High-fidelity.** Colours, type, radii, shadows, sizes are final. Emoji are placeholders for content art/stickers (swap for SVG later); emoji for avatars is intended.

## Audience rules (must hold everywhere in the child area)
- No text menus; labels ≤ 2 words, always paired with a picture/icon.
- Tap targets ≥ 72px (primary 96–104px). Grown-ups lock on the map is intentionally 52px and low-contrast.
- One task per screen, 3–4 choices max, every tap plays a sound.
- Progress = dots, never numbers. Wrong = wiggle + retry; never red, never "wrong", nothing lost.
- Stars: 3 = no first-try misses; 2 = ≤2 misses and ≥80% correct; 1 = finished.
- No timers/countdowns; nothing flashes > 3Hz; reduced-motion swaps everything for 200ms fades.

## Design Tokens
CSS variables (keep names; `paper`, `card`, `ground` are NEW). Add to `lib/themes.ts`, defaults in `app/globals.css`, expose in `tailwind.config.ts`.

| token | Meadow | Ocean | Space dawn |
|---|---|---|---|
| ink | #2B2340 | #123A52 | #2C2160 |
| sun | #FFC93C | #FFD65A | #FFCF4A |
| tangerine | #FF8B3D | #FF9468 | #FF9A62 |
| grass | #5CC46A | #2CC4A5 | #49D1A0 |
| berry | #9B5DE5 | #7B83F5 | #A58BFF |
| bubblegum | #FF6FAE | #FF7FB6 | #FF85CC |
| sky | #56BFF5 | #3AA8F0 | #8FB3FF |
| paper* | #FFF6E3 | #E4F5FF | #F2EDFF |
| card* | #FFFFFF | #FFFFFF | #FFFFFF |
| ground* | #D6F0BE | #BDE7F8 | #DDD4FF |

Child-read text is always `ink` on card/paper/sun/grass (≥ 4.5:1). Colour never carries meaning alone (correct = colour + check badge + pop).

**Type**
- Brand: Noto Sans Bengali 800, 30–44px ("পড়ি পড়ি").
- Reading: Andika 400 — tile letter 64–66px, word 40px, story 34px (min 28).
- Chrome: Fredoka 700 30px (button labels), 600 18px (map labels).
- Grown-ups: Fredoka 500–600 headings, system-ui 14px body.

**Shape / shadow**
- Radius: tile 28 · card 32 · sheet 36–40 · buttons full.
- Stroke: 4px ink (tiles/buttons), 3px small, 5px hero.
- `shadow-tile`: `0 6px 0 var(--ink)`; `shadow-lift` (dragging): `0 16px 0 rgba(43,35,64,.3)` + translateY(-10) rotate(-5deg) scale(1.06); `shadow-press`: `0 2px 0 var(--ink)` + translateY(4) scaleY(.94).
- Slot: 4px dashed ink at 40% opacity.
- Spacing: 6 · 10 · 18 · 24 · 32 · 48.

## Components (`components/ui.tsx`)
- **Tile** (104×104, r28): states idle / pressed / dragging / correct (grass bg + 36px white check badge top-right, scale 1.06) / retry (wiggle) / slot (dashed) / rest (35% opacity).
- **RoundButton**: 72px (secondary; sky=home, sun=replay audio, bubblegum=sticker book, tangerine=replay lesson) and 96–104px primary (grass=next, sun=play). Pill variant: icon + ≤2-word label, height 96, Fredoka 700 30.
- **Dots** (inside PlayBar): done 18px grass; current 28px sun with 4px rgba(255,201,60,.4) ring; upcoming 18px card @55%. All with 3px ink border.
- **PlayBar**: [home 72] [dots] [replay 72]. Replay gets a pulsing 10px sun ring after a miss.
- **Stars**: CSS clip-path star (ink outer, sun/card inner inset 16%). Props n, size, count.
- **MapNode**: done (84px, coloured bg, stars below) · next (100px card, 5px border, glow pulse, avatar floats above, ink label pill) · locked (84px card, dashed 35% ink border, grey 28%-opacity picture, small 3-puff white cloud cap on bottom edge).
- **StickerCard**: owned (96px, card, ±4° tilt) · new (sun bg + bubblegum sparkle badge) · to-find (dashed "?" 40%).
- **MascotBubble**: speech bubble r 26/26/26/6 holding only an icon, sound or letter — never sentences.
- **Mascot (Bulbul)**: CSS-built bird, body = `sun`, wings/feet/tuft = `tangerine`, cheeks = `bubblegum`. Moods: happy (idle), talk (beak open + sky ripples), cheer (correct; wings up, ^^ eyes), curious (miss; tilt -12°, "?" bubble), sleepy (idle >20s; closed eyes, floating z), dance (lesson complete; ±8° rock). Hats: crown, cap, flower, bow, top hat. See `Mascot.dc.html` for proportions.

## Screens
All mobile frames 390×844; tablet 1024×768 landscape.
- **1d–1f Home / Reading Road** (`app/page.tsx`): header 112px [avatar 72] [brand pill, -2° tilt] [sticker book 72]. Winding road (44px ink under 34px sun stroke) zigzags through 6 landmarks; walked part solid, ahead part 12% ink + dashed. Node centres: (100,630) (290,545) (110,440 = next) (290,345) (100,250) (290,165). Bottom: Bulbul (96px, cheer) left, Play pill right, grown-ups lock 52px at right:16 bottom:150, footer "Developed by: muhibullah" 11px.
- **1g Home tablet landscape**: same, road runs left→right; Bulbul bottom-left, Play bottom-right.
- **1h Step screen**: back + step pill (picture + name) + replay. Lessons = 2-col staggered picture bubbles (104px; next 124px glowing) with game-type badge (hand / blocks / audio-lines / train-front / book-open) and stars. First tap plays the word, second tap opens.
- **1i–1k Pick → "Feed the frog"**: frog over a sky pond, sound bubble with ripples; 3 tiles row at y≈604. Correct: frog pops, tile flies to mouth, sparkles + confetti, Bulbul cheer. Retry: tile wiggles back, frog tilts, ear bubble, replay pulses; 2nd miss → glow hint on correct tile.
- **1l Build-word → "Build the cat's house"**: picture card + roof triangle + house with 3 slots; letters dragged from bank (lift shadow, finger).
- **1m Order-words → "Word train"**: scene card; engine + 3 cars (slots) on track; word crates below. Full train drives off reading the sentence.
- **1n Blending → "Slide to blend"**: mystery picture under cloud; letter beads on a pill track; finger slide plays sounds (speed = blend speed); end reveals the picture and says the word.
- **1o Story karaoke**: illustration card; text 34px Andika, current word sun-highlighted with ink border; tap any word → speaker bubble. Mode toggle [headphones listen | hand me-read] + play/pause 100px.
- **1p "Now YOU read it"**: finger guide under current word, Bulbul listening, "Done!" grass pill — always counts.
- **1q Blending tablet (correct)**: picture card left, merged word tile right, next + replay bottom-right.
- **1r Lesson complete**: sunburst, 3 stars fly in (sides 92px tilted, centre 120px), sticker flips in, "+ to sticker book" chip, Bulbul dancing with crown; [replay] [map] [next].
- **1s Sticker book** / **1t Wardrobe**: picture tabs ⭐ / 👒; ring-binder page 3-col grid; page dots + chevrons. Wardrobe: Bulbul 220px on a stage, 3×2 item circles; locked items show star progress, never a price.
- **1u Avatar picker**: 3×4 grid of 96px avatars (animals + kids in several skin tones); selected = 6px ink ring + check. "Go!" pill.
- **1v Grown-ups gate**: calm neutral UI (#F6F4EF bg, 1.5px #E2DED5 borders, r14–20). "Solve this to continue", sum display, 3×4 keypad (72px keys).
- **1w Dashboard**: profile card, 3 stat cards (numbers OK here), per-step collapsible lesson list with stars, "Needs practice" chips with speaker, theme swatches, Export / Reset….
- **1x Install prompt**: dimmed map + bottom sheet (r40) with picture "home screen ← app icon (প)", [chevron-down later] [+ Add]. Show after a completed lesson, max once a week.
- **1y Offline**: small pill (cloud-off + green check) under the header; reassurance, fades after 4s.

## Interactions & Motion (extend existing `pop wiggle shake float`)
- Tap: squash scaleY .92 + translateY 4, 90ms ease-out, spring back 140ms, tap sound.
- Sound playing: 2 ripple rings scale .6→1.6 fade, 1s loop; Bulbul → talk.
- Correct: pop 1→1.14→1.06 280ms; check badge in 120ms; 8 sparkles 450ms; chime; Bulbul cheer; next item after 700ms breather.
- Wrong: wiggle ±7° ×2, 360ms one-shot; tile returns 200ms; soft "boop"; Bulbul curious; auto-replay target at 600ms.
- Complete: stars 180ms stagger, 520ms arc spring; sticker flip 500ms; confetti 1.2s once; Bulbul dances until any tap.
- Idle 20s → sleepy; any tap wakes.
- `prefers-reduced-motion` or in-app setting → all effects become 200ms opacity fades; sounds unchanged.
- Feedback never blocks input; nothing > 600ms on the critical path.

## State
- Existing: profile (name, avatar), per-lesson stars, misses per item ("needs practice"), unlocked steps, theme.
- New: `stickers: string[]` (earned per finished lesson), `wardrobe: {owned: string[], equipped: string}` (unlocked by total stars, never spent), `installPromptLastShown`, `reducedMotion`, mascot idle timer (UI only).

## File mapping
- `tailwind.config.ts` — paper/card/ground colours, shadow-tile/-lift/-press, radii, keyframes squash/ripple/flip/fly.
- `app/globals.css` — Meadow token defaults, font faces, reduced-motion fallback.
- `lib/themes.ts` — Meadow, Ocean, Space dawn (same 10 keys).
- `components/ui.tsx` — Tile, RoundButton, Dots/PlayBar, Stars + new MapNode, StickerCard, MascotBubble, Mascot.
- `components/games/Games.tsx` — FeedFrog, BuildHouse, WordTrain, SlideBlend, StoryKaraoke (+ YouRead).
- `app/page.tsx` — Reading Road, install sheet, offline pill.
- `app/play/page.tsx` — PlayBar, scenario frame, celebration.
- New routes — `/stickers` (book + wardrobe), avatar picker; `/grownups` restyled.

## Assets
- Icons: lucide (house, volume-2, play, pause, lock, book-heart, rotate-ccw, arrow-right, check, ear, hand, headphones, sparkles, map, cloud-off, plus, chevron-*, file-down, move-right).
- Fonts: Google Fonts — Andika, Fredoka, Noto Sans Bengali (self-host for offline).
- Emoji = placeholders for content art and stickers.

## Files
- `Pori Pori Redesign.dc.html` — the full board (all screens + specs).
- `WorldMap.dc.html` — mobile home map. `Mascot.dc.html` — Bulbul. `Stars.dc.html`, `PlayBar.dc.html` — primitives.
- `support.js` — runtime needed only to view the HTML files.
