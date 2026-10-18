'use client';
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, PROFILE_ID } from '@/lib/db';

/** True when the OS asks for reduced motion or the grown-up switched it on in-app. */
export function useReducedMotion() {
  const profile = useLiveQuery(() => db.profiles.get(PROFILE_ID), []);
  const [os, setOs] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setOs(mq.matches);
    const on = () => setOs(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return os || !!profile?.reducedMotion;
}

/** Mirrors the in-app setting onto <html data-reduced-motion> so globals.css can fade everything. */
export function applyReducedMotion(on: boolean) {
  if (on) document.documentElement.setAttribute('data-reduced-motion', '');
  else document.documentElement.removeAttribute('data-reduced-motion');
}
