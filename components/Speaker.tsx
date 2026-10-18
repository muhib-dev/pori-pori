'use client';
import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { RoundButton } from './ui';

/** Sun replay-audio button. While sound plays, two ripple rings pulse out (1s). */
export function Speaker({ onSpeak, size = 'xl', pulse = false }: { onSpeak: () => void; size?: 'lg' | 'xl'; pulse?: boolean }) {
  const [ring, setRing] = useState(0);
  const tap = () => { onSpeak(); setRing((n) => n + 1); setTimeout(() => setRing((n) => n - 1), 1000); };
  return (
    <RoundButton onClick={tap} ariaLabel="Listen again" color="sun" size={size} className={`relative ${pulse ? 'animate-float' : ''}`}>
      {ring > 0 && <>
        <span aria-hidden className="absolute inset-0 rounded-full border-4 border-sky animate-ripple pointer-events-none" />
        <span aria-hidden className="absolute inset-0 rounded-full border-4 border-sky animate-ripple pointer-events-none" style={{ animationDelay: '.4s' }} />
      </>}
      <Volume2 className={size === 'xl' ? 'w-14 h-14' : 'w-10 h-10'} strokeWidth={2.5} />
    </RoundButton>
  );
}
