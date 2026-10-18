'use client';
import { useEffect } from 'react';
import { primeVoices } from '@/lib/speech';
import { pushPending } from '@/lib/sync';
import { getOrCreateProfile } from '@/lib/db';
import { applyTheme } from '@/lib/themes';
import { applyReducedMotion } from '@/lib/motion';

/** Registers the service worker, primes TTS voices and drains the sync outbox when online. */
export function AppBoot() {
  useEffect(() => {
    primeVoices();
    getOrCreateProfile().then((p) => { if (p.theme) applyTheme(p.theme); applyReducedMotion(!!p.reducedMotion); }).catch(() => {});
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    const sync = () => pushPending().catch(() => {});
    sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, []);
  return null;
}
