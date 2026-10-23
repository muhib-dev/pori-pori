'use client';

// ---------------------------------------------------------------------------
// SPEECH. Prefers a recorded clip at /audio/<key>.mp3 (drop real recordings in
// public/audio later — great for letter SOUNDS which TTS pronounces poorly).
// Falls back to the browser's speech synthesis, slowed down for children.
// Bengali (`lang: 'bn'`) uses /audio/bn/<clipKey>.mp3 and a bn-BD / bn-IN voice.
// ---------------------------------------------------------------------------
export type SpeechLang = 'en' | 'bn';

const known = new Set<string>();   // clip paths we have verified exist
const missing = new Set<string>(); // clip paths we know are missing (avoid refetching)
const voices: Record<SpeechLang, SpeechSynthesisVoice | null> = { en: null, bn: null };
let current: HTMLAudioElement | null = null; // the clip playing now, so stopSpeaking() can pause it
let utter: SpeechSynthesisUtterance | null = null;

const pickVoice = () => {
  const vs = speechSynthesis.getVoices();
  if (!vs.length) return;
  voices.en =
    vs.find((v) => /en-(GB|IN)/i.test(v.lang) && /female|child|kid|zira|samantha|kate|google uk english female/i.test(v.name)) ||
    vs.find((v) => /en-GB/i.test(v.lang)) ||
    vs.find((v) => /^en/i.test(v.lang)) || null;
  voices.bn =
    vs.find((v) => /bn-BD/i.test(v.lang)) ||
    vs.find((v) => /bn-IN/i.test(v.lang)) ||
    vs.find((v) => /^bn/i.test(v.lang)) || null;
};

export function primeVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

/** True when the device has a TTS voice for `lang` (many iPhones have no Bengali voice). */
export function hasVoice(lang: SpeechLang) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  if (!voices[lang]) pickVoice();
  return !!voices[lang];
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
const clipPath = (key: string, lang: SpeechLang) => (lang === 'bn' ? `/audio/bn/${key}.mp3` : `/audio/${key}.mp3`);

/** Check in the background whether a recorded clip exists; the result is used from the next speak() on. */
function probeClip(path: string) {
  if (known.has(path) || missing.has(path)) return;
  missing.add(path); // optimistic: avoid duplicate probes while in flight
  fetch(path, { method: 'HEAD' })
    .then((r) => {
      if (r.ok && (r.headers.get('content-type') || '').includes('audio')) { missing.delete(path); known.add(path); }
    })
    .catch(() => {});
}

/** Probe a batch of clips up front (e.g. every page of a story) so the first speak() can already use them. */
export function prepareClips(keys: string[], lang: SpeechLang = 'en') {
  if (typeof window === 'undefined') return;
  keys.forEach((k) => probeClip(clipPath(k, lang)));
}

function playClip(path: string, fallback: () => void, onEnd?: () => void) {
  const a = new Audio(path);
  current = a;
  a.onended = () => { if (current === a) current = null; onEnd?.(); };
  a.onerror = () => { known.delete(path); missing.add(path); fallback(); };
  a.play().catch(fallback);
}

export function stopSpeaking() {
  if (typeof window === 'undefined') return;
  if (current) { current.onended = null; current.pause(); current = null; }
  if (utter) { utter.onend = null; utter = null; }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

function say(text: string, rate: number, lang: SpeechLang, onEnd?: () => void) {
  if (!('speechSynthesis' in window)) return onEnd?.();
  // iOS drops an utterance spoken right after cancel(), so only cancel when something is queued.
  if (utter) utter.onend = null; // Safari fires onend for a cancelled utterance
  if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
  if (!voices[lang]) pickVoice();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === 'bn' ? (voices.bn?.lang ?? 'bn-BD') : 'en-GB';
  u.rate = rate;
  u.pitch = 1.1;
  const v = voices[lang];
  if (v) u.voice = v;
  if (onEnd) u.onend = () => onEnd();
  utter = u; // Chrome can garbage-collect a pending utterance and never fire onend
  speechSynthesis.speak(u);
}

/** Speak text. `clipKey` lets a letter sound map to e.g. /audio/sound-s.mp3 (required for Bengali, whose letters keyOf drops).
 *  `onEnd` fires when the clip or utterance finishes (not when it is stopped).
 *  Synchronous on purpose (no await before play/speak) so it still runs inside the tap gesture on iOS. */
export function speak(text: string, opts: { rate?: number; clipKey?: string; lang?: SpeechLang; onEnd?: () => void } = {}) {
  if (typeof window === 'undefined') return;
  const lang = opts.lang ?? 'en';
  const key = opts.clipKey ?? keyOf(text);
  const rate = opts.rate ?? 0.85;
  if (current) { current.onended = null; current.pause(); current = null; }
  if (!key) return say(text, rate, lang, opts.onEnd);
  const path = clipPath(key, lang);
  if (known.has(path)) return playClip(path, () => say(text, rate, lang, opts.onEnd), opts.onEnd);
  probeClip(path);
  say(text, rate, lang, opts.onEnd);
}

/** Say a word slowly sound-by-sound then whole: "c … a … t … cat" */
export function speakSegmented(word: string, sayText?: string) {
  const parts = word.split('').map((c) => `${c}`).join(', ');
  speak(`${parts}. ${sayText ?? word}`, { rate: 0.75, clipKey: `seg-${keyOf(word)}` });
}
