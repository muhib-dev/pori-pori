'use client';

// ---------------------------------------------------------------------------
// SPEECH. Prefers a recorded clip at /audio/<key>.mp3 (drop real recordings in
// public/audio later — great for letter SOUNDS which TTS pronounces poorly).
// Falls back to the browser's speech synthesis, slowed down for children.
// ---------------------------------------------------------------------------
const known = new Set<string>();   // keys we have verified exist
const missing = new Set<string>(); // keys we know are missing (avoid refetching)
let voice: SpeechSynthesisVoice | null = null;

export function primeVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const pick = () => {
    const vs = speechSynthesis.getVoices();
    voice =
      vs.find((v) => /en-(GB|IN)/i.test(v.lang) && /female|child|kid|zira|samantha|google uk english female/i.test(v.name)) ||
      vs.find((v) => /en-GB/i.test(v.lang)) ||
      vs.find((v) => /^en/i.test(v.lang)) || null;
  };
  pick();
  speechSynthesis.onvoiceschanged = pick;
}

const keyOf = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function tryClip(key: string): Promise<boolean> {
  if (missing.has(key)) return false;
  const url = `/audio/${key}.mp3`;
  if (!known.has(key)) {
    try {
      const r = await fetch(url, { method: 'HEAD' });
      if (!r.ok || !(r.headers.get('content-type') || '').includes('audio')) { missing.add(key); return false; }
      known.add(key);
    } catch { missing.add(key); return false; }
  }
  return new Promise((resolve) => {
    const a = new Audio(url);
    a.onended = () => resolve(true);
    a.onerror = () => { missing.add(key); resolve(false); };
    a.play().catch(() => resolve(false));
  });
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) speechSynthesis.cancel();
}

/** Speak text. `clipKey` lets a letter sound map to e.g. /audio/sound-s.mp3 */
export async function speak(text: string, opts: { rate?: number; clipKey?: string } = {}) {
  if (typeof window === 'undefined') return;
  const key = opts.clipKey ?? keyOf(text);
  if (await tryClip(key)) return;
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-GB';
  u.rate = opts.rate ?? 0.85;
  u.pitch = 1.1;
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}

/** Say a word slowly sound-by-sound then whole: "c … a … t … cat" */
export async function speakSegmented(word: string, say?: string) {
  const parts = word.split('').map((c) => `${c}`).join(', ');
  await speak(`${parts}. ${say ?? word}`, { rate: 0.75, clipKey: `seg-${keyOf(word)}` });
}
