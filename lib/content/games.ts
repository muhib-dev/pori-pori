import { LEVELS, type GameType, type Lesson } from './syllabus';
import type { LessonProgress } from '../db';

export interface HomeGame {
  id: string;
  name: string;       // ≤ 2 words, what the child sees
  emoji: string;
  color: 'sun' | 'tangerine' | 'grass' | 'berry' | 'bubblegum' | 'sky';
  types: GameType[];  // lesson game types this card plays
  isNew?: boolean;
}

/** Free-play carousel cards, in default order. Together they cover every GameType. */
export const HOME_GAMES: HomeGame[] = [
  { id: 'sounds', name: 'Sounds', emoji: '🐝', color: 'sun', types: ['hear-tap', 'case-match', 'first-sound'] },
  { id: 'puzzle', name: 'Puzzle', emoji: '🧩', color: 'sky', types: ['build-word', 'order-words'] },
  { id: 'words', name: 'Words', emoji: '🐱', color: 'tangerine', types: ['word-pic', 'pic-word', 'syllable-tap'] },
  { id: 'find', name: 'Find it', emoji: '👀', color: 'grass', types: ['word-hunt', 'fill-blank', 'sentence-pic'] },
  { id: 'train', name: 'Train', emoji: '🚂', color: 'bubblegum', types: ['blend-tap'] },
  { id: 'stories', name: 'Stories', emoji: '📖', color: 'berry', types: ['story'] },
  { id: 'rhymes', name: 'Rhymes', emoji: '🎵', color: 'sky', types: ['rhyme'] },
];

export const lessonsOf = (g: HomeGame): Lesson[] =>
  LEVELS.flatMap((l) => l.lessons).filter((les) => g.types.includes(les.game));

export const gameOfLesson = (lesson: Lesson): HomeGame | undefined => HOME_GAMES.find((g) => g.types.includes(lesson.game));

const starsFor = (progress: LessonProgress[], id: string) => progress.find((p) => p.lessonId === id)?.bestStars ?? 0;

/** Best stars over the card's lessons (progress only, never a gate). */
export const starsOf = (g: HomeGame, progress: LessonProgress[]) =>
  lessonsOf(g).reduce((best, les) => Math.max(best, starsFor(progress, les.id)), 0);

/** First lesson not yet starred, else a random one. `not` avoids repeating the lesson just played. */
export function pickLesson(g: HomeGame, progress: LessonProgress[], not?: string): Lesson | undefined {
  const all = lessonsOf(g).filter((l) => l.id !== not);
  const pool = all.length ? all : lessonsOf(g);
  return pool.find((l) => starsFor(progress, l.id) === 0) ?? pool[Math.floor(Math.random() * pool.length)];
}
