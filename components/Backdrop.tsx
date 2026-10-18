import { Cloud, Heart, Sparkles, Star, Moon, Flower2 } from 'lucide-react';

// Slow drifting shapes behind everything. Server-rendered, static, theme-coloured.
const SHAPES = [
  { Icon: Cloud, x: '6%', y: '12%', s: 64, c: 'text-paper', d: 0 },
  { Icon: Star, x: '82%', y: '8%', s: 40, c: 'text-sun', d: 2 },
  { Icon: Heart, x: '90%', y: '44%', s: 34, c: 'text-bubblegum', d: 4 },
  { Icon: Sparkles, x: '4%', y: '52%', s: 36, c: 'text-berry', d: 1 },
  { Icon: Cloud, x: '70%', y: '78%', s: 72, c: 'text-paper', d: 3 },
  { Icon: Moon, x: '14%', y: '84%', s: 38, c: 'text-tangerine', d: 5 },
  { Icon: Flower2, x: '48%', y: '94%', s: 34, c: 'text-grass', d: 2.5 },
];

export function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {SHAPES.map(({ Icon, x, y, s, c, d }, i) => (
        <Icon key={i} className={`absolute animate-drift opacity-60 ${c}`} strokeWidth={2.5} width={s} height={s}
          style={{ left: x, top: y, animationDelay: `${d}s`, animationDuration: `${12 + i * 2}s` }} />
      ))}
    </div>
  );
}
