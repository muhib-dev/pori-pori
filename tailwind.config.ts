import type { Config } from 'tailwindcss';

// Design tokens: a "sticker board" look — chunky tiles, thick ink outlines,
// hard offset shadows that press flat when tapped. Colours are CSS variables
// (see app/globals.css, one block per theme) so a whole theme swaps at once.
const c = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: c('ink'),
        sky: c('sky'),
        sun: c('sun'),
        tangerine: c('tangerine'),
        grass: c('grass'),
        berry: c('berry'),
        bubblegum: c('bubblegum'),
        paper: c('paper'),
        card: c('card'),
        ground: c('ground'),
      },
      borderRadius: { tile: '28px', card: '32px', sheet: '40px' },
      fontFamily: {
        ui: ['"Fredoka Variable"', '"Noto Sans Bengali"', 'system-ui', 'sans-serif'],
        read: ['Andika', '"Fredoka Variable"', 'system-ui', 'sans-serif'],
        bn: ['"Noto Sans Bengali"', '"Fredoka Variable"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        tile: '0 6px 0 0 rgb(var(--c-ink))',
        tileSm: '0 4px 0 0 rgb(var(--c-ink))',
        tileFlat: '0 0 0 0 rgb(var(--c-ink))',
        lift: '0 16px 0 0 rgb(var(--c-ink) / .3)',
        press: '0 2px 0 0 rgb(var(--c-ink))',
      },
      keyframes: {
        pop: { '0%': { transform: 'scale(0.6)', opacity: '0' }, '70%': { transform: 'scale(1.15)' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        bounceIn: { '0%': { transform: 'translateY(30px) scale(0.8)', opacity: '0' }, '60%': { transform: 'translateY(-8px) scale(1.04)', opacity: '1' }, '100%': { transform: 'translateY(0) scale(1)', opacity: '1' } },
        wiggle: { '0%,100%': { transform: 'rotate(0)' }, '25%': { transform: 'rotate(-7deg)' }, '50%': { transform: 'rotate(7deg)' }, '75%': { transform: 'rotate(-7deg)' } },
        wobble: { '0%,100%': { transform: 'rotate(-3deg) scale(1)' }, '50%': { transform: 'rotate(3deg) scale(1.04)' } },
        shake: { '0%,100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-8px)' }, '75%': { transform: 'translateX(8px)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        pulseSoft: { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.12)' } },
        ring: { '0%': { boxShadow: '0 0 0 0 rgb(var(--c-sun) / .9)' }, '100%': { boxShadow: '0 0 0 18px rgb(var(--c-sun) / 0)' } },
        twinkle: { '0%,100%': { transform: 'scale(1) rotate(0)', opacity: '1' }, '50%': { transform: 'scale(1.25) rotate(15deg)', opacity: '.8' } },
        starIn: { '0%': { transform: 'scale(0) rotate(-90deg)', opacity: '0' }, '70%': { transform: 'scale(1.35) rotate(10deg)', opacity: '1' }, '100%': { transform: 'scale(1) rotate(0)', opacity: '1' } },
        drift: { '0%': { transform: 'translate(0,0) rotate(0)' }, '50%': { transform: 'translate(24px,-30px) rotate(12deg)' }, '100%': { transform: 'translate(0,0) rotate(0)' } },
        confetti: { '0%': { transform: 'translateY(-10vh) rotate(0)', opacity: '1' }, '100%': { transform: 'translateY(105vh) rotate(720deg)', opacity: '.9' } },
        burst: { '0%': { transform: 'translate(0,0) scale(.4)', opacity: '1' }, '100%': { transform: 'translate(var(--dx), var(--dy)) scale(1.1)', opacity: '0' } },
        squash: { '0%': { transform: 'translateY(0) scaleY(1)' }, '40%': { transform: 'translateY(4px) scaleY(.92)' }, '100%': { transform: 'translateY(0) scaleY(1)' } },
        ripple: { '0%': { transform: 'scale(.6)', opacity: '.8' }, '100%': { transform: 'scale(1.6)', opacity: '0' } },
        flip: { '0%': { transform: 'rotateY(90deg) scale(.6)', opacity: '0' }, '100%': { transform: 'rotateY(0) scale(1)', opacity: '1' } },
        fly: { '0%': { transform: 'translate(var(--fx,0), var(--fy,0)) scale(.6) rotate(-20deg)', opacity: '0' }, '100%': { transform: 'translate(0,0) scale(1) rotate(0)', opacity: '1' } },
        wave: { '0%,60%,100%': { transform: 'rotate(0)' }, '10%,30%': { transform: 'rotate(16deg)' }, '20%,40%': { transform: 'rotate(-10deg)' }, '50%': { transform: 'rotate(8deg)' } },
      },
      animation: {
        pop: 'pop 0.4s cubic-bezier(.2,1.4,.4,1) both',
        bounceIn: 'bounceIn 0.55s cubic-bezier(.2,1.2,.4,1) both',
        wiggle: 'wiggle 0.36s ease-in-out 1',
        wobble: 'wobble 2.6s ease-in-out infinite',
        shake: 'shake 0.35s ease-in-out',
        float: 'float 2.4s ease-in-out infinite',
        pulseSoft: 'pulseSoft 1.4s ease-in-out infinite',
        ring: 'ring 1.6s ease-out infinite',
        twinkle: 'twinkle 1.8s ease-in-out infinite',
        starIn: 'starIn 0.6s cubic-bezier(.2,1.4,.4,1) both',
        drift: 'drift 14s ease-in-out infinite',
        confetti: 'confetti 2.4s linear forwards',
        burst: 'burst 0.8s ease-out forwards',
        wave: 'wave 2.4s ease-in-out infinite',
        squash: 'squash 0.23s ease-out',
        ripple: 'ripple 1s ease-out infinite',
        flip: 'flip 0.5s cubic-bezier(.2,1.2,.4,1) both',
        fly: 'fly 0.52s cubic-bezier(.2,1.3,.4,1) both',
      },
    },
  },
  plugins: [],
};
export default config;
