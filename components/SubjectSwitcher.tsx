"use client";
import { Check } from "lucide-react";
import { speak } from "@/lib/speech";
import { SUBJECTS, type Subject, type SubjectId } from "@/lib/content/subjects";

const fill = { sun: "bg-sun", tangerine: "bg-tangerine", grass: "bg-grass", berry: "bg-berry", bubblegum: "bg-bubblegum", sky: "bg-sky" };

/** Small round badge on the brand pill: the current subject. The whole pill opens the sheet, so the tap target is large. */
export function SubjectBadge({ subject }: { subject: Subject }) {
  return (
    <span
      aria-hidden
      className={`absolute -top-3 -right-4 w-12 h-12 rounded-full border-4 border-ink shadow-tileSm flex items-center justify-center text-2xl rotate-2 ${fill[subject.color]}`}
    >
      {subject.emoji}
    </span>
  );
}

/**
 * Bottom sheet of big subject cards (2 per row, scrolls past ~6), so any number of subjects fits
 * without adding anything to the home screen. Tap a card: Bulbul says hello and the sheet closes.
 */
export function SubjectSheet({
  active,
  onPick,
  onClose,
}: {
  active: SubjectId;
  onPick: (s: Subject) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Choose a subject"
        className="bg-paper border-4 border-ink rounded-t-sheet shadow-tile w-full max-w-md max-h-[80dvh] overflow-y-auto px-6 pt-6 pb-[calc(var(--safe-bottom)+2rem)] animate-bounceIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-2 gap-4">
          {SUBJECTS.map((s) => {
            const on = s.id === active;
            return (
              <button
                key={s.id}
                type="button"
                aria-label={s.name}
                aria-pressed={on}
                onClick={() => {
                  speak(s.hello);
                  if (!on) onPick(s);
                  onClose();
                }}
                className={`relative min-h-[140px] rounded-card border-4 border-ink shadow-tile flex items-center justify-center text-[72px] leading-none active:scale-95 transition-transform ${fill[s.color]} ${on ? "ring-[6px] ring-ink" : ""}`}
              >
                <span aria-hidden>{s.emoji}</span>
                {on && (
                  <span className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-grass border-[3px] border-ink flex items-center justify-center animate-pop">
                    <Check className="w-6 h-6" strokeWidth={4} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
