'use client';

// ---------------------------------------------------------------------------
// SPEECH. Prefers a recorded clip at /audio/<key>.mp3 (drop real recordings in
// public/audio later — great for letter SOUNDS which TTS pronounces poorly).
// Falls back to the browser's speech synthesis, slowed down for children.
// ---------------------------------------------------------------------------
const known = new Set<string>();   // keys we have verified exist
const missing = new Set<string>(); // keys we know are missing (avoid refetching)
let voice: SpeechSynthesisVoice | null = null;

const pickVoice = () => {
  const vs = speechSynthesis.getVoices();
  if (!vs.length) return;
  voice =
    vs.find((v) => /en-(GB|IN)/i.test(v.lang) && /female|child|kid|zira|samantha|kate|google uk english female/i.test(v.name)) ||
    vs.find((v) => /en-GB/i.test(v.lang)) ||
    vs.find((v) => /^en/i.test(v.lang)) || null;
};

export function primeVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

// iOS Safari only starts speech/audio from inside a user gesture. Speak one silent utterance on the first tap
// so later timer-driven speech (auto-say) is allowed.
let unlocked = false;
export const isAudioUnlocked = () => unlocked;
export function unlockAudio() {
  if (typeof window === 'undefined' || unlocked) return;
  unlocked = true;
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  speechSynthesis.speak(u);
}

const keyOf = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Check in the background whether a recorded clip exists; the result is used from the next speak() on. */
function probeClip(key: string) {
  if (known.has(key) || missing.has(key)) return;
  missing.add(key); // optimistic: avoid duplicate probes while in flight
  fetch(`/audio/${key}.mp3`, { method: 'HEAD' })
    .then((r) => {
      if (r.ok && (r.headers.get('content-type') || '').includes('audio')) { missing.delete(key); known.add(key); }
    })
    .catch(() => {});
}

function playClip(key: string, fallback: () => void) {
  const a = new Audio(`/audio/${key}.mp3`);
  a.onerror = () => { known.delete(key); missing.add(key); fallback(); };
  a.play().catch(fallback);
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) speechSynthesis.cancel();
}

function say(text: string, rate: number) {
  if (!('speechSynthesis' in window)) return;
  // iOS drops an utterance spoken right after cancel(), so only cancel when something is queued.
  if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
  if (!voice) pickVoice();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-GB';
  u.rate = rate;
  u.pitch = 1.1;
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}

/** Speak text. `clipKey` lets a letter sound map to e.g. /audio/sound-s.mp3.
 *  Synchronous on purpose (no await before play/speak) so it still runs inside the tap gesture on iOS. */
export function speak(text: string, opts: { rate?: number; clipKey?: string } = {}) {
  if (typeof window === 'undefined') return;
  const key = opts.clipKey ?? keyOf(text);
  const rate = opts.rate ?? 0.85;
  if (known.has(key)) return playClip(key, () => say(text, rate));
  probeClip(key);
  say(text, rate);
}

/** Say a word slowly sound-by-sound then whole: "c … a … t … cat" */
export function speakSegmented(word: string, sayText?: string) {
  const parts = word.split('').map((c) => `${c}`).join(', ');
  speak(`${parts}. ${sayText ?? word}`, { rate: 0.75, clipKey: `seg-${keyOf(word)}` });
}
