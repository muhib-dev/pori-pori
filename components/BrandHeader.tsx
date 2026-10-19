/** Brand pill: Bengali title in Noto Sans Bengali 800, tilted -2deg. */
export function BrandHeader() {
  return (
    <div className="-rotate-2 bg-card border-4 border-ink rounded-full shadow-tile px-5 py-1 flex flex-col items-center leading-tight animate-bounceIn">
      <h1 className="font-bn font-extrabold text-3xl text-ink" lang="bn">
        পড়ি পড়ি
      </h1>
      <span className="text-sm font-semibold text-ink/70 tracking-wide">
        Pori Pori
      </span>
    </div>
  );
}

export function DevCredit({ className = "" }: { className?: string }) {
  return (
    <span className={`text-[11px] text-ink/60 ${className}`}>
      Developed by: <strong className="font-semibold">muhibullah</strong>
    </span>
  );
}
