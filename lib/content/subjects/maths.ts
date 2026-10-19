import type { Item, Level } from '../syllabus';
import { numWord } from '../../mathEngine';

// ---------------------------------------------------------------------------
// MATHS — "Number Land". 8 steps in 3 zones, each step a place with a story game.
// Every step is a short play with Bulbul, never a worksheet: count the apples, feed the
// animals, add pictures, fix the missing number. Numbers are always spoken, so a child
// who cannot read yet can play. Lesson ids start with `m-` so progress and stickers
// never collide with reading. Free play: nothing here is locked.
// ---------------------------------------------------------------------------

/** Numerals lo..hi as items; `emoji` is the thing counted, `hint` carries a per-game option (see lib/mathEngine.ts). */
const nums = (lo: number, hi: number, emoji: string, hint?: string): Item[] =>
  Array.from({ length: hi - lo + 1 }, (_, i): Item => ({ text: String(lo + i), emoji, say: numWord(lo + i), hint }));
/** Multiples of `step` (step..step*count), for skip counting. */
const skips = (step: number, count: number): Item[] =>
  Array.from({ length: count }, (_, i): Item => ({ text: String(step * (i + 1)), emoji: '', say: numWord(step * (i + 1)), hint: String(step) }));

export const MATHS_LEVELS: Level[] = [
  {
    id: 1, zone: 'seeds', name: 'Fruit Shop', emoji: '🍎', color: 'sun',
    goal: 'Count objects 1–5 and match them to the numeral.',
    lessons: [
      { id: 'm-count-5', title: 'Count to 5', label: 'Count', emoji: '🍎', game: 'count-tap', items: nums(1, 5, '🍎') },
      { id: 'm-hear-5', title: 'Hear numbers 1–5', label: 'Listen', emoji: '👂', game: 'hear-num', items: nums(1, 5, '🍌') },
      { id: 'm-group-5', title: 'Show me the number 1–5', label: 'Show me', emoji: '🍓', game: 'num-group', items: nums(1, 5, '🍓') },
    ],
  },
  {
    id: 2, zone: 'seeds', name: 'Fish Pond', emoji: '🐟', color: 'sky',
    goal: 'Count objects 6–10.',
    lessons: [
      { id: 'm-count-10', title: 'Count to 10', label: 'Count', emoji: '🐟', game: 'count-tap', items: nums(6, 10, '🐟') },
      { id: 'm-hear-10', title: 'Hear numbers 1–10', label: 'Listen', emoji: '🎧', game: 'hear-num', items: nums(1, 10, '🐠') },
      { id: 'm-group-10', title: 'Show me the number 6–10', label: 'Show me', emoji: '🦆', game: 'num-group', items: nums(6, 10, '🦆') },
    ],
  },
  {
    id: 3, zone: 'seeds', name: 'Zoo', emoji: '🐘', color: 'grass',
    goal: 'Compare two groups: more and fewer.',
    lessons: [
      { id: 'm-more', title: 'Which has more?', label: 'More', emoji: '🐘', game: 'compare', items: nums(1, 9, '🐵', 'more') },
      { id: 'm-fewer', title: 'Which has fewer?', label: 'Fewer', emoji: '🦒', game: 'compare', items: nums(1, 9, '🦓', 'fewer') },
    ],
  },
  {
    id: 4, zone: 'seeds', name: 'Treasure Island', emoji: '🏝️', color: 'tangerine',
    goal: 'Put numbers in order and find the missing number (1–10).',
    lessons: [
      { id: 'm-order-5', title: 'Number order 1–5', label: 'In order', emoji: '🪜', game: 'num-seq', items: nums(1, 5, '') },
      { id: 'm-missing-5', title: 'Missing number 1–5', label: 'Missing', emoji: '🧩', game: 'missing-num', items: nums(1, 5, '', '1') },
      { id: 'm-order-10', title: 'Number order 1–10', label: 'In order', emoji: '🗺️', game: 'num-seq', items: nums(1, 10, '') },
      { id: 'm-missing-10', title: 'Missing number 1–10', label: 'Missing', emoji: '💎', game: 'missing-num', items: nums(1, 10, '', '1') },
    ],
  },
  {
    id: 5, zone: 'sprouts', name: 'Bakery', emoji: '🧁', color: 'bubblegum',
    goal: 'Add two groups within 5, then within 10.',
    lessons: [
      { id: 'm-add-5', title: 'Add within 5', label: 'Add', emoji: '🧁', game: 'add-pics', items: nums(2, 5, '🧁') },
      { id: 'm-add-10', title: 'Add within 10', label: 'Add more', emoji: '🍪', game: 'add-pics', items: nums(4, 10, '🍪') },
    ],
  },
  {
    id: 6, zone: 'sprouts', name: 'Bird Tree', emoji: '🐦', color: 'sky',
    goal: 'Take away within 5, then within 10.',
    lessons: [
      { id: 'm-sub-5', title: 'Take away within 5', label: 'Fly away', emoji: '🐦', game: 'sub-pics', items: nums(2, 5, '🐦') },
      { id: 'm-sub-10', title: 'Take away within 10', label: 'Take away', emoji: '🎈', game: 'sub-pics', items: nums(4, 10, '🎈') },
    ],
  },
  {
    id: 7, zone: 'trees', name: 'Rocket Pad', emoji: '🚀', color: 'berry',
    goal: 'Numbers 11–20: counting, hearing and the missing number.',
    lessons: [
      { id: 'm-count-20', title: 'Count 11–15', label: 'Count', emoji: '⭐', game: 'count-tap', items: nums(11, 15, '⭐') },
      { id: 'm-hear-20', title: 'Hear numbers 11–20', label: 'Listen', emoji: '🛰️', game: 'hear-num', items: nums(11, 20, '🌟') },
      { id: 'm-missing-20', title: 'Missing number to 20', label: 'Missing', emoji: '🚀', game: 'missing-num', items: nums(2, 20, '', '1') },
    ],
  },
  {
    id: 8, zone: 'trees', name: 'Skip Hop', emoji: '🐸', color: 'grass',
    goal: 'Skip counting by 2s, 5s and 10s.',
    lessons: [
      { id: 'm-skip-2', title: 'Count by 2s', label: 'By twos', emoji: '🐸', game: 'missing-num', items: skips(2, 8) },
      { id: 'm-skip-5', title: 'Count by 5s', label: 'By fives', emoji: '🖐️', game: 'missing-num', items: skips(5, 8) },
      { id: 'm-skip-10', title: 'Count by 10s', label: 'By tens', emoji: '🔟', game: 'missing-num', items: skips(10, 8) },
    ],
  },
];
