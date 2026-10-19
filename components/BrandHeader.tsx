import type { ReactNode } from "react";

/** Brand pill: Bengali title in Noto Sans Bengali 800, tilted -2deg. With `onClick` it becomes a button (opens the subject sheet) and shows `badge`. */
export function BrandHeader({
  onClick,
  badge,
}: {
  onClick?: () => void;
  badge?: ReactNode;
}) {
  const cls =
    `relative -rotate-2 bg-card border-4 border-ink rounded-full shadow-tile ${badge ? "pl-5 pr-10" : "px-5"} py-1 flex flex-col items-center leading-tight animate-bounceIn`;
  const inner = (
    <>
      <h1 className="font-bn font-extrabold text-3xl text-ink" lang="bn">
        পড়ি পড়ি
      </h1>
      <span className="text-sm font-semibold text-ink/70 tracking-wide">
        Pori Pori
      </span>
      {badge}
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} aria-label="Choose a subject" className={`${cls} min-h-[72px] active:scale-95 transition-transform`}>
      {inner}
    </button>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export function DevCredit({ className = "" }: { className?: string }) {
  return (
    <span className={`text-[11px] text-ink/60 ${className}`}>
      Developed by: <strong className="font-semibold">muhibullah</strong>
    </span>
  );
}
