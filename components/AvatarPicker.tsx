"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { updateProfile } from "@/lib/db";
import { speak } from "@/lib/speech";
import { RoundButton } from "./ui";

// Animals plus kids in several skin tones; emoji avatars are intended.
export const AVATARS = [
  "🦊",
  "🐰",
  "🐼",
  "🦄",
  "🐸",
  "🐱",
  "🧒🏻",
  "🧒🏼",
  "🧒🏽",
  "🧒🏾",
  "🧒🏿",
  "🐧",
];

/** Bottom sheet: 3x4 grid of 96px avatars, selected = 6px ink ring + check, "Go!" pill. */
export function AvatarPicker({
  current,
  onClose,
}: {
  current: string;
  onClose: () => void;
}) {
  const [sel, setSel] = useState(current);
  const go = async () => {
    await updateProfile({ avatar: sel });
    onClose();
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40"
      onClick={onClose}
    >
      <div
        className="bg-paper border-4 border-ink rounded-t-sheet shadow-tile w-full max-w-md px-6 pt-6 pb-8 flex flex-col items-center gap-5 animate-bounceIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-3 gap-4">
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              aria-label={`Avatar ${a}`}
              aria-pressed={sel === a}
              onClick={() => {
                setSel(a);
                speak("pop");
              }}
              className={`relative w-24 h-24 rounded-full bg-card border-4 border-ink text-5xl flex items-center justify-center ${sel === a ? "ring-[6px] ring-ink" : ""}`}
            >
              {a}
              {sel === a && (
                <span className="absolute -top-1 -right-1 w-9 h-9 rounded-full bg-grass border-[3px] border-ink flex items-center justify-center animate-pop">
                  <Check className="w-6 h-6" strokeWidth={4} />
                </span>
              )}
            </button>
          ))}
        </div>
        <RoundButton onClick={go} ariaLabel="Go" color="grass" label="Go!">
          <Check className="w-9 h-9" strokeWidth={4} />
        </RoundButton>
      </div>
    </div>
  );
}
