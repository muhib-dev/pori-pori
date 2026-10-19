"use client";
import { useEffect } from "react";
import { primeVoices, unlockAudio } from "@/lib/speech";
import { pushPending } from "@/lib/sync";
import { getOrCreateProfile } from "@/lib/db";
import { applyTheme } from "@/lib/themes";
import { applyReducedMotion } from "@/lib/motion";

/** Registers the service worker, primes TTS voices and drains the sync outbox when online. */
export function AppBoot() {
  useEffect(() => {
    primeVoices();

    getOrCreateProfile()
      .then((p) => {
        if (p.theme) applyTheme(p.theme);
        applyReducedMotion(!!p.reducedMotion);
      })
      .catch(() => {});

    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});

    const sync = () => pushPending().catch(() => {});
    sync();

    window.addEventListener("online", sync);
    const unlock = () => {
      unlockAudio();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchend", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("touchend", unlock);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchend", unlock);
    };
  }, []);
  return null;
}
