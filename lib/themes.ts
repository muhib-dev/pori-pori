// Theme colours live in app/globals.css as CSS variables under [data-theme="<id>"].
// This file only lists ids/names and the browser-bar colour. Previews in the picker
// re-use the real variables by setting data-theme on the preview element itself.
export interface Theme { id: string; name: string; bar: string; stars: number } // stars: total stars needed to unlock

export const THEMES: Theme[] = [
  { id: 'sunny', name: 'Sunny', bar: '#CFEFFF', stars: 0 },
  { id: 'ocean', name: 'Ocean', bar: '#BDE3F5', stars: 6 },
  { id: 'candy', name: 'Candy', bar: '#FFD9EC', stars: 15 },
  { id: 'forest', name: 'Forest', bar: '#D5F0C8', stars: 30 },
  { id: 'sunset', name: 'Sunset', bar: '#FFDDBF', stars: 50 },
  { id: 'grape', name: 'Grape', bar: '#E3D9FF', stars: 80 },
];

export const DEFAULT_THEME = 'sunny';
const KEY = 'pp-theme';

export function applyTheme(id: string) {
  const t = THEMES.find((x) => x.id === id) ?? THEMES[0];
  document.documentElement.dataset.theme = t.id;
  try { localStorage.setItem(KEY, t.id); } catch { /* private mode */ }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.bar);
}

/** Runs before first paint (inlined in app/layout.tsx) so there is no colour flash. */
export const THEME_BOOT_SCRIPT =
  `try{var t=localStorage.getItem('${KEY}');if(t)document.documentElement.dataset.theme=t}catch(e){}`;
