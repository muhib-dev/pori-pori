'use client';
import { useEffect, useState } from 'react';
import { Check, CloudOff } from 'lucide-react';

/** Small reassurance under the header when offline; fades after 4s. Nothing is lost. */
export function OfflinePill() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const flash = () => { setShow(true); clearTimeout(t); t = setTimeout(() => setShow(false), 4000); };
    if (!navigator.onLine) flash();
    window.addEventListener('offline', flash);
    return () => { clearTimeout(t); window.removeEventListener('offline', flash); };
  }, []);
  if (!show) return null;
  return (
    <div role="status" aria-label="Offline, everything still works" className="flex items-center gap-2 bg-card border-[3px] border-ink rounded-full px-4 py-1 animate-pop">
      <CloudOff className="w-6 h-6" strokeWidth={2.5} /><Check className="w-6 h-6 text-grass" strokeWidth={4} />
    </div>
  );
}
