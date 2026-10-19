"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { updateProfile } from "@/lib/db";
import { RoundButton } from "./ui";
import { InstallHelp, detectPlatform, isStandalone } from "./InstallHelp";

interface InstallEvent extends Event {
  prompt(): Promise<void>;
}
const WEEK = 7 * 24 * 3600 * 1000;

/** Bottom sheet (r40) offered after a completed lesson, at most once a week. Picture only: home screen <- app icon. */
export function InstallSheet({
  eligible,
  lastShown,
}: {
  eligible: boolean;
  lastShown?: number;
}) {
  const ev = useRef<InstallEvent | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      ev.current = e as InstallEvent;
      setReady(true);
    };
    window.addEventListener("beforeinstallprompt", on);
    return () => window.removeEventListener("beforeinstallprompt", on);
  }, []);
  // iOS never fires beforeinstallprompt, so it is shown the manual steps instead
  const [ios, setIos] = useState(false);
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    setIos(detectPlatform() === "ios" && !isStandalone());
    setDesktop(detectPlatform() === "desktop" && !isStandalone());
  }, []);
  // Desktop: show the QR once per session so a phone can scan it.
  useEffect(() => {
    if (!desktop) return;
    try {
      if (sessionStorage.getItem("pp-qr-shown")) return;
      sessionStorage.setItem("pp-qr-shown", "1");
    } catch {
      /* private mode: show anyway */
    }
    setOpen(true);
  }, [desktop]);
  // Phone that arrived through the QR (?install=1): offer install right away.
  useEffect(() => {
    if (!ready && !ios) return;
    try {
      if (!sessionStorage.getItem("pp-install")) return;
      sessionStorage.removeItem("pp-install");
    } catch {
      return;
    }
    setOpen(true);
    updateProfile({ installPromptLastShown: Date.now() });
  }, [ready, ios]);
  useEffect(() => {
    if ((ready || ios) && eligible && Date.now() - (lastShown ?? 0) > WEEK) {
      setOpen(true);
      updateProfile({ installPromptLastShown: Date.now() });
    }
  }, [ready, ios, eligible, lastShown]);
  if (!open) return null;
  const add = async () => {
    await ev.current?.prompt();
    setOpen(false);
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-paper border-4 border-ink rounded-t-sheet shadow-tile w-full max-w-md px-6 pt-8 pb-8 flex flex-col items-center gap-6 animate-bounceIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4" aria-hidden>
          <span className="text-6xl">🏠</span>
          <span className="text-4xl">←</span>
          <span className="w-20 h-20 rounded-tile bg-sun border-4 border-ink shadow-tileSm flex items-center justify-center font-bn font-extrabold text-5xl">
            প
          </span>
        </div>
        <InstallHelp />
        <div className="flex gap-6">
          <RoundButton
            onClick={() => setOpen(false)}
            ariaLabel="Later"
            color="sky"
          >
            <ChevronDown className="w-9 h-9" strokeWidth={3} />
          </RoundButton>
          {ready && (
            <RoundButton
              onClick={add}
              ariaLabel="Add to home screen"
              color="grass"
              label="Add"
            >
              <Plus className="w-9 h-9" strokeWidth={4} />
            </RoundButton>
          )}
        </div>
      </div>
    </div>
  );
}
