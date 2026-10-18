'use client';
import Dexie, { type Table } from 'dexie';
import { legacyStartStep, modeForStep, type ReaderMode } from '@/lib/content/syllabus';

// ---------------------------------------------------------------------------
// LOCAL-FIRST STORE
// Everything the app needs lives in IndexedDB. Every mutation also appends an
// event to `outbox`; lib/sync.ts drains that queue to your API later.
// ---------------------------------------------------------------------------

export interface Profile {
  id: string;            // 'local' until a server id exists
  name: string;
  avatar: string;        // emoji
  age: number;
  currentLevel: number;   // legacy: the current step is now derived from progress
  theme?: string;         // theme id, see lib/themes.ts
  startStep?: number;     // steps below this count as skipped; undefined = placement not done yet
  readerMode?: ReaderMode; // listen: audio-first prompts; read: text-first (set by placement)
  streak?: number;        // consecutive days played
  lastPlayedDay?: string; // local YYYY-MM-DD of the last finished lesson
  createdAt: number;
  updatedAt: number;
}

export interface LessonProgress {
  lessonId: string;      // primary key
  profileId: string;
  bestStars: 0 | 1 | 2 | 3;
  plays: number;
  lastPlayedAt: number;
  updatedAt: number;
}

export interface Attempt {
  id?: number;
  profileId: string;
  lessonId: string;
  correct: number;
  total: number;
  stars: 0 | 1 | 2 | 3;
  durationMs: number;
  misses: string[];      // item texts the child got wrong → future "practice again"
  at: number;
}

export interface Sticker {
  lessonId: string;      // primary key: one sticker per lesson, earned on the first 3 stars
  earnedAt: number;
}

export interface OutboxEvent {
  id?: number;
  type: 'profile.upsert' | 'progress.upsert' | 'attempt.create' | 'sticker.create';
  payload: unknown;
  createdAt: number;
  synced: 0 | 1;
}

class ReadingDB extends Dexie {
  profiles!: Table<Profile, string>;
  progress!: Table<LessonProgress, string>;
  attempts!: Table<Attempt, number>;
  outbox!: Table<OutboxEvent, number>;
  stickers!: Table<Sticker, string>;
  constructor() {
    super('reading-fun');
    this.version(1).stores({
      profiles: 'id',
      progress: 'lessonId, profileId, updatedAt',
      attempts: '++id, profileId, lessonId, at',
      outbox: '++id, synced, createdAt',
    });
    // v2: placement/reader mode/streak on Profile, sticker album. Children who already
    // have progress keep their place: startStep is recovered from their lesson ids.
    this.version(2)
      .stores({ stickers: 'lessonId' })
      .upgrade(async (tx) => {
        const start = legacyStartStep(await tx.table('progress').toArray());
        if (start === undefined) return;
        await tx.table('profiles').toCollection().modify((p: Profile) => {
          p.startStep = start;
          p.readerMode = modeForStep(start);
        });
      });
  }
}

export const db = new ReadingDB();
export const PROFILE_ID = 'local';

const enqueue = (type: OutboxEvent['type'], payload: unknown) =>
  db.outbox.add({ type, payload, createdAt: Date.now(), synced: 0 });

export async function getOrCreateProfile(): Promise<Profile> {
  const existing = await db.profiles.get(PROFILE_ID);
  if (existing) return existing;
  const now = Date.now();
  const p: Profile = { id: PROFILE_ID, name: '', avatar: '🦊', age: 6, currentLevel: 1, createdAt: now, updatedAt: now };
  await db.profiles.put(p);
  await enqueue('profile.upsert', p);
  return p;
}

export async function updateProfile(patch: Partial<Profile>) {
  const p = await getOrCreateProfile();
  const next = { ...p, ...patch, updatedAt: Date.now() };
  await db.profiles.put(next);
  await enqueue('profile.upsert', next);
  return next;
}

const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Saves a finished play. Also awards the lesson's sticker on its first 3 stars and keeps the day streak. */
export async function recordAttempt(a: Omit<Attempt, 'id' | 'at' | 'profileId'>): Promise<{ newSticker: boolean }> {
  const at = Date.now();
  const attempt: Attempt = { ...a, profileId: PROFILE_ID, at };
  let newSticker = false;
  await db.transaction('rw', db.attempts, db.progress, db.outbox, db.stickers, db.profiles, async () => {
    const id = await db.attempts.add(attempt);
    await enqueue('attempt.create', { ...attempt, id });
    const prev = await db.progress.get(a.lessonId);
    const next: LessonProgress = {
      lessonId: a.lessonId,
      profileId: PROFILE_ID,
      bestStars: Math.max(prev?.bestStars ?? 0, a.stars) as 0 | 1 | 2 | 3,
      plays: (prev?.plays ?? 0) + 1,
      lastPlayedAt: at,
      updatedAt: at,
    };
    await db.progress.put(next);
    await enqueue('progress.upsert', next);

    if (a.stars === 3 && !(await db.stickers.get(a.lessonId))) {
      const sticker: Sticker = { lessonId: a.lessonId, earnedAt: at };
      await db.stickers.put(sticker);
      await enqueue('sticker.create', sticker);
      newSticker = true;
    }

    // Day streak: +1 when played the day after the last play, otherwise starts again at 1 (never shown as a loss).
    const p = await db.profiles.get(PROFILE_ID);
    const today = dayKey();
    if (p && p.lastPlayedDay !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const updated: Profile = { ...p, streak: p.lastPlayedDay === dayKey(yesterday) ? (p.streak ?? 0) + 1 : 1, lastPlayedDay: today, updatedAt: at };
      await db.profiles.put(updated);
      await enqueue('profile.upsert', updated);
    }
  });
  return { newSticker };
}

/** True while the streak is alive (played today or yesterday). */
export const streakAlive = (p: Pick<Profile, 'streak' | 'lastPlayedDay'>) => {
  if (!p.streak || !p.lastPlayedDay) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return p.lastPlayedDay === dayKey() || p.lastPlayedDay === dayKey(yesterday);
};

export async function resetAll() {
  await db.transaction('rw', db.profiles, db.progress, db.attempts, db.outbox, db.stickers, async () => {
    await Promise.all([db.profiles.clear(), db.progress.clear(), db.attempts.clear(), db.outbox.clear(), db.stickers.clear()]);
  });
}
