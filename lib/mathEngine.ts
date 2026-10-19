import type { GameType, Item, Lesson, ReaderMode } from "./content/syllabus";
import type { Question } from "./engine";
import { shuffle } from "./shuffle";

// Maths lessons list numerals as `Item`s: text = "3", emoji = the thing to count, say = "three".
// Per-game conventions for the lesson's items:
//   compare:     item.hint = 'more' | 'fewer'
//   missing-num: item.hint = the step of the row ("2" counts 2, 4, 6…), default 1
//   num-seq:     any numerals; each round sorts a few of them

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
export const numWord = (n: number) => WORDS[n] ?? String(n);

export const MATH_GAMES: GameType[] = ["count-tap", "num-group", "hear-num", "compare", "add-pics", "sub-pics", "num-seq", "missing-num"];
export const isMathGame = (g: GameType) => MATH_GAMES.includes(g);

export const numeral = (n: number): Item => ({ text: String(n), emoji: "", say: numWord(n) });
const group = (emoji: string, n: number): Item => ({ text: String(n), emoji: emoji.repeat(n), say: numWord(n) });

/** Answer tiles: the right number plus nearby wrong ones (distinct, ≥ 1). */
function numberOptions(n: number, pool: number[], mode?: ReaderMode) {
  const wrong = mode === "listen" ? 2 : 3;
  const near = [n - 2, n - 1, n + 1, n + 2, ...pool].filter((x, i, a) => x >= 1 && x !== n && a.indexOf(x) === i);
  const picked = [...shuffle(near.filter((x) => Math.abs(x - n) <= 2)), ...shuffle(near)].filter((x, i, a) => a.indexOf(x) === i).slice(0, wrong);
  const options = shuffle([n, ...picked]).map(numeral);
  return { options, answer: options.findIndex((o) => o.text === String(n)) };
}

const rand = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));

export function buildMathQuestions(lesson: Lesson, mode: ReaderMode | undefined, rounds: number): Question[] {
  const pool = lesson.items;
  const nums = pool.map((i) => Number(i.text));
  const order = shuffle(pool);
  const picked: Item[] = [];
  while (picked.length < rounds && pool.length) picked.push(order[picked.length % order.length]);

  return picked.map((target): Question => {
    const n = Number(target.text);
    const base: Question = { kind: lesson.game, target, options: [], answer: -1 };

    switch (lesson.game) {
      case "count-tap":
      case "hear-num":
        return { ...base, ...numberOptions(n, nums, mode), count: n };

      case "num-group": {
        const counts = numberOptions(n, nums, mode).options.map((o) => Number(o.text));
        const options = counts.map((c) => group(target.emoji, c));
        return { ...base, options, answer: counts.indexOf(n) };
      }

      case "compare": {
        const others = nums.filter((x) => x !== n);
        const far = others.filter((x) => Math.abs(x - n) >= 2);
        const m = shuffle(far.length ? far : others)[0];
        const options = shuffle([n, m]).map((c) => group(target.emoji, c));
        const fewer = target.hint === "fewer";
        const best = fewer ? Math.min(n, m) : Math.max(n, m);
        return { ...base, options, answer: options.findIndex((o) => o.text === String(best)), focus: fewer ? "fewer" : "more" };
      }

      case "add-pics": {
        // target is the total; split it in two
        const a = rand(1, n - 1);
        return { ...base, ...numberOptions(n, nums, mode), a, b: n - a };
      }

      case "sub-pics": {
        // target is the starting amount; some fly away, the answer is what is left
        const b = rand(1, n - 1);
        const left = n - b;
        return { ...base, ...numberOptions(left, nums.map((x) => x - 1), mode), a: n, b };
      }

      case "num-seq": {
        const k = mode === "listen" ? 3 : 4;
        const set = shuffle(Array.from(new Set(nums))).slice(0, k).sort((x, y) => x - y);
        return { ...base, chunks: shuffle(set.map(String)) };
      }

      case "missing-num": {
        const step = Number(target.hint) || 1;
        let pos = rand(0, 3);
        while (pos > 0 && n - pos * step < step) pos--; // keep the row at or above `step`
        const seq = [0, 1, 2, 3].map((k) => n + (k - pos) * step);
        const wrong = shuffle([n - step, n + step, n - 1, n + 1, n + 2 * step].filter((x, i, all) => x >= 1 && x !== n && !seq.includes(x) && all.indexOf(x) === i));
        const options = shuffle([n, ...wrong.slice(0, mode === "listen" ? 2 : 3)]).map(numeral);
        return { ...base, options, answer: options.findIndex((o) => o.text === String(n)), seq: seq.map(String), focus: String(n) };
      }
    }
    return base;
  });
}
