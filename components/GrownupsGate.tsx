"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Delete, X } from "lucide-react";

export const GATE_KEY = "pp-gate-ok";
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "del"] as const;

/** Simple gate: a sum a 6-year-old won't solve quickly. Calm neutral palette (grown-ups area), not theme tokens. */
export function SumGate({ onSolved }: { onSolved: () => void }) {
  // Picked after mount: a random value during render would mismatch the server HTML.
  const [[a, b], setSum] = useState<[number, number]>([0, 0]);
  useEffect(
    () => setSum([5 + Math.floor(Math.random() * 5), 6 + Math.floor(Math.random() * 4)]),
    [],
  );
  const [answer, setAnswer] = useState("");
  const solved = a > 0 && Number(answer) === a + b;
  useEffect(() => {
    if (!solved) return;
    try {
      sessionStorage.setItem(GATE_KEY, "1");
    } catch {
      /* private mode */
    }
    onSolved();
  }, [solved, onSolved]);

  const press = (k: (typeof KEYS)[number]) =>
    setAnswer((v) => (k === "clear" ? "" : k === "del" ? v.slice(0, -1) : (v + k).slice(0, 3)));
  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-[15px] text-[#6B6760]">Solve this to continue</p>
      <p className="font-ui font-semibold text-4xl" aria-live="polite">
        {a} + {b} ={" "}
        <span className="inline-block min-w-[3ch] border-b-2 border-[#2B2A28]/30 text-center">
          {answer || "?"}
        </span>
      </p>
      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k)}
            aria-label={k === "del" ? "Delete" : k === "clear" ? "Clear" : k}
            className="w-[72px] h-[72px] rounded-[18px] border-[1.5px] border-[#E2DED5] bg-white font-ui text-2xl font-medium active:bg-[#EFEBE2] flex items-center justify-center"
          >
            {k === "del" ? (
              <Delete className="w-6 h-6" strokeWidth={2} />
            ) : k === "clear" ? (
              <span className="text-sm">Clear</span>
            ) : (
              k
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Modal over home: solving the sum opens /grownups/. */
export function GrownupsGate({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B2A28]/50 px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Grown-ups"
    >
      <div
        className="relative w-full max-w-sm bg-[#F6F4EF] text-[#2B2A28] font-sans border-[1.5px] border-[#E2DED5] rounded-[24px] px-6 py-8 flex flex-col items-center gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-2 top-2 w-[72px] h-[72px] flex items-center justify-center rounded-full"
        >
          <X className="w-6 h-6" strokeWidth={2} />
        </button>
        <h2 className="font-ui font-semibold text-2xl">Grown-ups</h2>
        <SumGate onSolved={() => router.push("/grownups/")} />
      </div>
    </div>
  );
}
