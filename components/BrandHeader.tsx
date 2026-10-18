import { BookOpenText } from 'lucide-react';

export function BrandHeader() {
  return (
    <div className="flex flex-col items-center leading-tight">
      <div className="flex items-center gap-3">
        <BookOpenText className="w-9 h-9 text-berry animate-wobble" strokeWidth={2.5} aria-hidden />
        <h1 className="font-bn font-bold text-5xl text-ink animate-bounceIn" lang="bn">পড়ি পড়ি</h1>
      </div>
      <span className="text-xl font-semibold text-ink/70 tracking-wide">Pori Pori</span>
      <span className="text-sm text-ink/60 pt-1">Developed by: <strong className="font-semibold">muhibullah</strong></span>
    </div>
  );
}
