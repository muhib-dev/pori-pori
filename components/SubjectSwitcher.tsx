"use client";
import { Tile } from "./ui";
import { speak } from "@/lib/speech";
import { SUBJECTS, type Subject, type SubjectId } from "@/lib/content/subjects";

/**
 * Subject switch for pre-readers: one big emoji button per subject, the active one lifted and
 * coloured. Tapping says the subject and Bulbul's hello. Add a subject and a button appears.
 */
export function SubjectSwitcher({ active, onPick }: { active: SubjectId; onPick: (s: Subject) => void }) {
  return (
    <div role="group" aria-label="Subject" className="shrink-0 flex items-center justify-center gap-3">
      {SUBJECTS.map((s) => {
        const on = s.id === active;
        return (
          <Tile
            key={s.id}
            color={on ? s.color : "card"}
            pressed={on}
            ariaLabel={s.name}
            onClick={() => {
              if (on) return speak(s.name);
              speak(s.hello);
              onPick(s);
            }}
            className={`h-[clamp(56px,8.5dvh,72px)] min-w-[clamp(88px,26vw,120px)] px-4 text-[clamp(2rem,5.5dvh,2.75rem)] leading-none ${on ? "ring-4 ring-ink/20" : "opacity-80"}`}
          >
            <span aria-hidden>{s.emoji}</span>
          </Tile>
        );
      })}
    </div>
  );
}
