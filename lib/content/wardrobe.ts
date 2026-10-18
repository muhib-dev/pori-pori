import type { Hat } from '@/components/Mascot';

// Bulbul's hats unlock by total stars and are never spent or priced.
export interface WardrobeItem { id: Hat; emoji: string; stars: number }

export const WARDROBE: WardrobeItem[] = [
  { id: 'none', emoji: '🐦', stars: 0 },
  { id: 'cap', emoji: '🧢', stars: 3 },
  { id: 'bow', emoji: '🎀', stars: 9 },
  { id: 'flower', emoji: '🌸', stars: 18 },
  { id: 'tophat', emoji: '🎩', stars: 30 },
  { id: 'crown', emoji: '👑', stars: 45 },
];

export const isOwned = (item: WardrobeItem, totalStars: number) => totalStars >= item.stars;

/** Equipped hat for a profile; falls back to none if unknown or no longer owned. */
export const equippedHat = (equipped: string | undefined, totalStars: number): Hat => {
  const it = WARDROBE.find((w) => w.id === equipped);
  return it && isOwned(it, totalStars) ? it.id : 'none';
};
