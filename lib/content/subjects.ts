import { ALL_LESSONS, LEVELS, type Lesson, type Level } from './syllabus';
import { MATHS_LEVELS } from './subjects/maths';
import { HOME_GAMES, MATHS_GAMES, type HomeGame } from './games';
import type { Profile } from '../db';

// ---------------------------------------------------------------------------
// SUBJECTS. Reading is the original app; every other subject is just a `levels` list plus
// free-play cards. Add a subject: new file in ./subjects/, an entry here, a card list in
// games.ts. The child switches between them with the big emoji buttons on home.
// ---------------------------------------------------------------------------

export type SubjectId = 'reading' | 'maths';

export interface Subject {
  id: SubjectId;
  name: string;       // spoken when picked (the child sees only the emoji)
  hello: string;      // Bulbul says this on arrival
  emoji: string;
  color: 'sun' | 'tangerine' | 'grass' | 'berry' | 'bubblegum' | 'sky';
  levels: Level[];
  games: HomeGame[];
}

export const SUBJECTS: Subject[] = [
  { id: 'reading', name: 'Reading', hello: "Let's read!", emoji: '📖', color: 'sun', levels: LEVELS, games: HOME_GAMES },
  { id: 'maths', name: 'Numbers', hello: "Let's count!", emoji: '🔢', color: 'sky', levels: MATHS_LEVELS, games: MATHS_GAMES },
];

export const DEFAULT_SUBJECT: SubjectId = 'reading';

export const subjectById = (id?: string): Subject => SUBJECTS.find((s) => s.id === id) ?? SUBJECTS[0];

/** The subject the child last picked on home. */
export const activeSubjectOf = (p?: Pick<Profile, 'activeSubject'>): Subject => subjectById(p?.activeSubject);

/** Every lesson of every subject (sticker book, practice lookups). */
export const ALL_SUBJECT_LESSONS: Lesson[] = SUBJECTS.flatMap((s) => (s.id === 'reading' ? ALL_LESSONS : s.levels.flatMap((l) => l.lessons)));

export const findAnyLesson = (id: string) => ALL_SUBJECT_LESSONS.find((l) => l.id === id);

export const subjectOfLesson = (id: string): Subject | undefined => SUBJECTS.find((s) => s.levels.some((lv) => lv.lessons.some((l) => l.id === id)));

export const levelOfAnyLesson = (id: string): Level | undefined => subjectOfLesson(id)?.levels.find((lv) => lv.lessons.some((l) => l.id === id));

/** Start step of a subject: reading keeps the original `startStep`. */
export const startFor = (p: Pick<Profile, 'startStep' | 'startSteps'> | undefined, id: SubjectId) =>
  (id === 'reading' ? p?.startStep : p?.startSteps?.[id]) ?? 1;
