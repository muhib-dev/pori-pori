import { LETTER_BY_CHAR, type Item, type Lesson, type ReaderMode } from './content/syllabus';

export interface Question {
  kind: Lesson['game'];
  target: Item;
  options: Item[];     // for tap games (includes target)
  answer: number;      // index into options
  letters?: string[];  // for build-word: shuffled letters incl. 1–2 distractors
  words?: string[];    // order-words: shuffled words · word-hunt: the sentence's words in order
  focus?: string;      // fill-blank: the hidden word · word-hunt: the word to find
  chunks?: string[];   // syllable-tap: shuffled chunks incl. one distractor (letters is for build-word)
}

const STOP_WORDS = new Set(['the', 'and', 'with', 'this', 'that', 'have', 'into', 'over', 'after', 'under', 'across']);
const bare = (w: string) => w.replace(/[.!?,"”]/g, '');

export const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

const pickDistractors = (pool: Item[], target: Item, n: number) =>
  shuffle(pool.filter((i) => i.text !== target.text)).slice(0, n);

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

// `mode` tunes difficulty: pre-readers (listen) get shorter plays and one tile fewer to choose from.
export function buildQuestions(lesson: Lesson, mode?: ReaderMode, rounds = lesson.rounds ?? (mode === 'listen' ? 5 : 6)): Question[] {
  const pool = lesson.items;
  // Cycle through items so every play covers the whole set before repeating.
  const targets = shuffle(pool);
  const picked: Item[] = [];
  while (picked.length < rounds && pool.length) picked.push(targets[picked.length % targets.length]);

  return picked.map((target) => {
    const optionCount = pool.length >= 4 ? (mode === 'listen' ? 2 : 3) : Math.min(2, pool.length - 1); // 3–4 tiles max on screen
    let options = shuffle([target, ...pickDistractors(pool, target, optionCount)]);
    let answer = options.findIndex((o) => o.text === target.text);
    const wordCount = mode === 'listen' ? 2 : 3; // distractors for games whose tiles are not the pool items

    if (lesson.game === 'first-sound') {
      // Answer tiles are letters: the word's first letter plus others from the lesson (padded from the alphabet).
      const first = target.text[0];
      const others = Array.from(new Set(pool.map((i) => i.text[0]))).filter((c) => c !== first);
      const padded = [...shuffle(others), ...shuffle(Object.keys(LETTER_BY_CHAR).filter((c) => c !== first && !others.includes(c)))].slice(0, wordCount);
      options = shuffle([first, ...padded]).map((c) => LETTER_BY_CHAR[c]);
      answer = options.findIndex((o) => o.text === first);
    }
    if (lesson.game === 'rhyme') {
      // Answer is another word from the same family (hint); distractors come from other families.
      const mate = shuffle(pool.filter((i) => i.hint === target.hint && i.text !== target.text))[0];
      const far = shuffle(pool.filter((i) => i.hint !== target.hint)).slice(0, wordCount);
      options = shuffle([mate, ...far]);
      answer = options.findIndex((o) => o.text === mate.text);
    }
    if (lesson.game === 'fill-blank') {
      // Hide the last word; distractors are the last words of other sentences.
      const words = target.text.split(' ').map(bare);
      const hidden = words[words.length - 1];
      const rivals = Array.from(new Set(pool.map((i) => bare(i.text.split(" ").pop()!)))).filter((w) => w !== hidden);
      options = shuffle([hidden, ...shuffle(rivals).slice(0, wordCount)]).map((w) => ({ text: w, emoji: '' }));
      answer = options.findIndex((o) => o.text === hidden);
    }

    const q: Question = { kind: lesson.game, target, options, answer };
    if (lesson.game === 'fill-blank') q.focus = options[answer].text;
    if (lesson.game === 'word-hunt') {
      const words = target.text.split(' ').map(bare);
      const hunt = words.filter((w) => w.length >= 3 && !STOP_WORDS.has(w.toLowerCase()));
      q.words = words;
      q.focus = shuffle(hunt.length ? hunt : words)[0];
      q.options = [];
      q.answer = -1;
    }
    if (lesson.game === 'syllable-tap') {
      const parts = target.hint!.split('-');
      const rivals = pool.flatMap((i) => i.hint!.split('-')).filter((p) => !parts.includes(p));
      q.chunks = shuffle([...parts, shuffle(rivals)[0]]);
      q.options = [];
      q.answer = -1;
    }

    if (lesson.game === 'build-word') {
      const letters = target.text.split('');
      const extras = shuffle(ALPHABET.filter((c) => !letters.includes(c))).slice(0, letters.length <= 3 ? 2 : 1);
      q.letters = shuffle([...letters, ...extras]);
    }
    if (lesson.game === 'order-words') {
      q.words = shuffle(target.text.replace(/\.$/, '').split(' '));
    }
    return q;
  });
}

export const starsFor = (correct: number, total: number, firstTryMisses: number): 0 | 1 | 2 | 3 => {
  const ratio = correct / Math.max(total, 1);
  if (firstTryMisses === 0) return 3;
  if (ratio >= 0.8 && firstTryMisses <= 2) return 2;
  return 1;
};
