'use client';
import { db } from './db';

// ---------------------------------------------------------------------------
// SYNC (stub). Wire this to your real API later.
// Call `pushPending()` on app start, on `online` event, and after each game.
// The outbox is append-only, so retries are safe; mark synced only on 2xx.
// ---------------------------------------------------------------------------
export const SYNC_URL = process.env.NEXT_PUBLIC_SYNC_URL ?? '';

export async function pushPending(): Promise<{ sent: number }> {
  if (!SYNC_URL || typeof navigator !== 'undefined' && !navigator.onLine) return { sent: 0 };
  const pending = await db.outbox.where('synced').equals(0).sortBy('createdAt');
  if (pending.length === 0) return { sent: 0 };
  const res = await fetch(`${SYNC_URL}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events: pending }),
  });
  if (!res.ok) return { sent: 0 };
  await db.outbox.bulkPut(pending.map((e) => ({ ...e, synced: 1 as const })));
  return { sent: pending.length };
}

/** Pull server state → local (last-write-wins by updatedAt). Implement when API exists. */
export async function pullRemote(): Promise<void> {
  if (!SYNC_URL) return;
  // const res = await fetch(`${SYNC_URL}/state`); const remote = await res.json();
  // merge into db.profiles / db.progress comparing updatedAt.
}
