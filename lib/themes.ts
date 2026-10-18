// Theme colours live in app/globals.css as CSS variables under [data-theme="<id>"].
// This file only lists ids/names and the browser-bar colour. Previews in the picker
// re-use the real variables by setting data-theme on the preview element itself.
export interface Theme { id: string; name: string; bar: string; stars: number } // stars: total stars needed to unlock

export const THEMES: Theme[] = [
  { id: 'sunny', name: 'Meadow', bar: '#FFF6E3', stars: 0 },
  { id: 'ocean', name: 'Ocean', bar: '#E4F5FF', stars: 6 },
  { id: 'candy', name: 'Candy', bar: '#FFF0F7', stars: 15 },
  { id: 'forest', name: 'Forest', bar: '#F3FAE9', stars: 30 },
  { id: 'sunset', name: 'Sunset', bar: '#FFF1E3', stars: 50 },
  { id: 'grape', name: 'Space dawn', bar: '#F2EDFF', stars: 80 },
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
