'use client';
import { speak } from '@/lib/speech';

/** Pori the owl: a friendly guide. Tap to hear the message again. */
export function Mascot({ say, className = '' }: { say: string; className?: string }) {
  return (
    <button type="button" onClick={() => speak(say)} aria-label={say} className={`flex items-center gap-3 text-left ${className}`}>
      <span className="text-6xl animate-float" aria-hidden>🦉</span>
      <span className="bg-paper border-4 border-ink rounded-3xl rounded-bl-md shadow-tile px-4 py-2 text-2xl font-semibold">{say}</span>
    </button>
  );
}
