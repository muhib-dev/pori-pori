'use client';
import { useEffect, useState } from 'react';
import { EllipsisVertical, Plus, Share } from 'lucide-react';
import QRCode from 'qrcode';

export type Platform = 'ios' | 'android' | 'desktop';

export function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  // iPadOS 13+ reports as a Mac with touch
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** URL a phone should open: NEXT_PUBLIC_SITE_URL wins (needed in dev, where origin is localhost). */
const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || `${location.origin}/`;

/** QR code of the site URL, drawn client-side so it also works offline. */
export function SiteQr({ size = 176, bare = false }: { size?: number; bare?: boolean }) {
  const [src, setSrc] = useState('');
  const [url, setUrl] = useState('');
  useEffect(() => {
    const u = siteUrl();
    setUrl(u);
    // ?install=1 tells the phone's home page to offer "add to home screen" right away
    QRCode.toDataURL(`${u}${u.includes('?') ? '&' : '?'}install=1`, { margin: 1, width: size * 2, color: { dark: '#2B2340', light: '#FFFFFF' } }).then(setSrc).catch(() => {});
  }, [size]);
  const local = /localhost|127\.0\.0\.1/.test(url);
  return (
    <div className="flex flex-col items-center gap-2">
      {src && <img src={src} alt="QR code to open Pori Pori on a phone" width={size} height={size} className="rounded-2xl border-4 border-ink bg-white p-1" />}
      {!bare && <span className="text-sm break-all text-center">{url}</span>}
      {!bare && local &&<span className="text-xs text-center opacity-70">This is a local address. A phone cannot open it. Set NEXT_PUBLIC_SITE_URL to the public or LAN address.</span>}
    </div>
  );
}

const step = 'flex items-center gap-3 text-lg font-semibold';
const num = 'w-8 h-8 shrink-0 rounded-full bg-sun border-[3px] border-ink flex items-center justify-center font-ui font-bold';

/** Platform-aware "add to home screen" steps. Phone/tablet: steps; desktop: QR so a phone can open the app. `onAdd` = native Android prompt. */
export function InstallHelp({ onAdd, showQr }: { onAdd?: () => void; showQr?: boolean }) {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => { setPlatform(detectPlatform()); setInstalled(isStandalone()); }, []);
  if (!platform) return null;
  if (installed) return <p className="text-lg font-semibold">✅ Already on the home screen.</p>;
  return (
    <div className="flex flex-col gap-4 items-center">
      {platform === 'ios' && (
        <ol className="flex flex-col gap-3">
          <li className={step}><span className={num}>1</span>Open in Safari, tap <Share className="w-6 h-6 inline" strokeWidth={2.5} aria-label="Share" /></li>
          <li className={step}><span className={num}>2</span>Tap “Add to Home Screen”</li>
          <li className={step}><span className={num}>3</span>Tap “Add” <span className="w-8 h-8 rounded-lg bg-sun border-[3px] border-ink inline-flex items-center justify-center font-bn font-extrabold" aria-hidden>প</span></li>
        </ol>
      )}
      {platform === 'android' && (
        <>
          {onAdd && <button type="button" onClick={onAdd} className="flex items-center gap-2 h-14 px-6 rounded-full bg-grass border-4 border-ink shadow-tileSm font-ui font-bold text-xl"><Plus className="w-6 h-6" strokeWidth={4} />Add to home screen</button>}
          <ol className="flex flex-col gap-3">
            <li className={step}><span className={num}>1</span>Tap <EllipsisVertical className="w-6 h-6 inline" strokeWidth={2.5} aria-label="Menu" /> in Chrome</li>
            <li className={step}><span className={num}>2</span>Tap “Install app” or “Add to Home screen”</li>
          </ol>
        </>
      )}
      {(platform === 'desktop' || showQr) && (
        <div className="flex flex-col items-center gap-2">
          <span className="text-lg font-semibold">{platform === 'desktop' ? '📱 Scan with a phone to open it' : '📱 Open on another phone'}</span>
          <p className="text-base text-center max-w-xs opacity-80">Scan with your phone to open Pori Pori, then tap “Add to Home Screen” to install it.</p>
          <SiteQr />
        </div>
      )}
    </div>
  );
}
