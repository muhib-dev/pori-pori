'use client';
import { Volume2 } from 'lucide-react';
import { RoundButton } from './ui';

export function Speaker({ onSpeak, size = 'xl', pulse = false }: { onSpeak: () => void; size?: 'lg' | 'xl'; pulse?: boolean }) {
  return (
    <RoundButton onClick={onSpeak} ariaLabel="Listen again" color="tangerine" size={size} className={pulse ? 'animate-float' : ''}>
      <Volume2 className={size === 'xl' ? 'w-14 h-14' : 'w-10 h-10'} strokeWidth={2.5} />
    </RoundButton>
  );
}
