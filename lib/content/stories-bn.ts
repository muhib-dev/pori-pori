// ---------------------------------------------------------------------------
// BENGALI STORIES (গল্প) for ages 6–10, shown at /story/. All original.
// Each page is drawn by components/story/StoryScene.tsx from `setting` + `actors` + `fx`;
// set `image` (/stories/<id>-p<n>.webp) or `video` (.mp4) on a page to replace the drawn scene.
// Narration: /audio/bn/<clipKey>.mp3 when present, otherwise Bengali TTS.
// Progress/stickers are saved under bnLessonId(id) ("bn-<id>") through recordAttempt.
// ---------------------------------------------------------------------------

export type Setting = 'sky' | 'village' | 'river' | 'pond' | 'field' | 'forest' | 'home' | 'underwater';
export type Anim = 'walk' | 'hop' | 'fly' | 'sway' | 'swim' | 'bob' | 'roll' | 'cross' | 'none';
export type Fx = 'rain' | 'stars' | 'leaves' | 'fireflies' | 'sun' | 'bubbles' | 'clouds' | 'rainbow';
export type Camera = 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'still';

/** x/y are % of the stage (x = centre, y = from the bottom). size is % of the stage width. */
export interface Actor { emoji: string; x: number; y: number; size?: number; anim?: Anim; flip?: boolean; delay?: number }

export interface BnPage {
  text: string;
  clipKey: string;
  setting: Setting;
  night?: boolean;
  actors: Actor[];
  fx?: Fx[];
  camera?: Camera;
  image?: string;
  video?: string;
}

export interface BnQuiz { question: string; clipKey: string; options: { emoji: string; label: string }[]; answer: number }

export interface BnStory {
  id: string;
  title: string;
  titleEn: string; // for grown-ups and sticker labels
  emoji: string;
  cover: Pick<BnPage, 'setting' | 'night' | 'actors' | 'fx'>;
  pages: BnPage[];
  quiz: BnQuiz[];
}

type PageIn = Omit<BnPage, 'clipKey'>;
type QuizIn = Omit<BnQuiz, 'clipKey'>;
const story = (s: Omit<BnStory, 'pages' | 'quiz'> & { pages: PageIn[]; quiz: QuizIn[] }): BnStory => ({
  ...s,
  pages: s.pages.map((p, i) => ({ ...p, clipKey: `${s.id}-p${i + 1}` })),
  quiz: s.quiz.map((q, i) => ({ ...q, clipKey: `${s.id}-q${i + 1}` })),
});

export const BN_STORIES: BnStory[] = [
  story({
    id: 'megh',
    title: 'মেঘের ছানা',
    titleEn: 'The Little Cloud',
    emoji: '☁️',
    cover: { setting: 'sky', actors: [{ emoji: '☁️', x: 50, y: 35, size: 30, anim: 'bob' }], fx: ['sun', 'clouds'] },
    pages: [
      { text: 'আকাশে থাকে ছোট্ট একটা মেঘ। সবাই তাকে ডাকে তুলো।', setting: 'sky', camera: 'zoom-in', fx: ['sun', 'clouds'],
        actors: [{ emoji: '☁️', x: 50, y: 35, size: 28, anim: 'bob' }] },
      { text: 'বড় মেঘেরা ঝমঝম করে বৃষ্টি নামায়। তুলো খুব চেষ্টা করে, কিন্তু এক ফোঁটাও পড়ে না!', setting: 'sky', camera: 'pan-right', fx: ['rain'],
        actors: [{ emoji: '🌧️', x: 22, y: 55, size: 26, anim: 'bob' }, { emoji: '🌧️', x: 78, y: 58, size: 24, anim: 'bob', delay: 0.6 }, { emoji: '☁️', x: 50, y: 30, size: 16, anim: 'hop' }] },
      { text: 'মন খারাপ করে তুলো ভেসে চলল দূরে। গ্রামের ওপর দিয়ে, নদীর ওপর দিয়ে।', setting: 'village', camera: 'pan-left',
        actors: [{ emoji: '☁️', x: 50, y: 70, size: 18, anim: 'cross' }, { emoji: '🏡', x: 25, y: 12, size: 16 }, { emoji: '🌴', x: 70, y: 12, size: 18, anim: 'sway' }] },
      { text: 'হঠাৎ সে দেখল, মাঠের কোণে একটা সূর্যমুখী মাথা নিচু করে আছে। “পানি… একটু পানি…”', setting: 'field', camera: 'zoom-in', fx: ['sun'],
        actors: [{ emoji: '🥀', x: 50, y: 14, size: 22, anim: 'sway' }, { emoji: '☁️', x: 30, y: 70, size: 14, anim: 'bob' }] },
      { text: 'তুলোর খুব মায়া লাগল। তার চোখ ভিজে উঠল, আর টুপটাপ করে ঝরে পড়ল বৃষ্টি!', setting: 'field', camera: 'still', fx: ['rain'],
        actors: [{ emoji: '🌧️', x: 50, y: 66, size: 22, anim: 'bob' }, { emoji: '🥀', x: 50, y: 14, size: 20, anim: 'sway' }] },
      { text: 'সূর্যমুখী মাথা তুলে হাসল। পাশের ধানগাছগুলোও খুশিতে নেচে উঠল।', setting: 'field', camera: 'zoom-out', fx: ['sun'],
        actors: [{ emoji: '🌻', x: 50, y: 14, size: 24, anim: 'sway' }, { emoji: '🌾', x: 20, y: 12, size: 16, anim: 'sway', delay: 0.3 }, { emoji: '🌾', x: 80, y: 12, size: 16, anim: 'sway', delay: 0.7 }, { emoji: '☁️', x: 50, y: 70, size: 14, anim: 'hop' }] },
      { text: 'তুলো বুঝল, মন থেকে কিছু করলে ছোটরাও অনেক কিছু পারে। আকাশে উঠল রংধনু!', setting: 'sky', camera: 'zoom-out', fx: ['rainbow', 'sun'],
        actors: [{ emoji: '☁️', x: 50, y: 30, size: 22, anim: 'hop' }, { emoji: '🌻', x: 15, y: 4, size: 14, anim: 'sway' }] },
    ],
    quiz: [
      { question: 'তুলো কে?', options: [{ emoji: '☁️', label: 'মেঘ' }, { emoji: '🐑', label: 'ভেড়া' }, { emoji: '🎈', label: 'বেলুন' }], answer: 0 },
      { question: 'কে পানি চাইছিল?', options: [{ emoji: '🐟', label: 'মাছ' }, { emoji: '🌻', label: 'সূর্যমুখী' }, { emoji: '🐄', label: 'গরু' }], answer: 1 },
    ],
  }),

  story({
    id: 'chand',
    title: 'চাঁদ হারালো কোথায়?',
    titleEn: 'Where Did the Moon Go?',
    emoji: '🌙',
    cover: { setting: 'home', night: true, actors: [{ emoji: '🦜', x: 50, y: 20, size: 22, anim: 'bob' }], fx: ['stars', 'fireflies'] },
    pages: [
      { text: 'রোজ রাতে মিঠু টিয়া জানালায় বসে চাঁদ দেখে। কিন্তু আজ আকাশে চাঁদ নেই!', setting: 'home', night: true, camera: 'zoom-in', fx: ['stars'],
        actors: [{ emoji: '🦜', x: 50, y: 20, size: 22, anim: 'bob' }] },
      { text: '“চাঁদ হারিয়ে গেছে!” মিঠু চেঁচিয়ে উঠল। একটা জোনাকি মিটমিট করে বলল, “চলো, খুঁজে দেখি!”', setting: 'home', night: true, camera: 'still', fx: ['stars', 'fireflies'],
        actors: [{ emoji: '🦜', x: 38, y: 20, size: 20, anim: 'hop' }, { emoji: '✨', x: 64, y: 46, size: 12, anim: 'fly' }] },
      { text: 'প্রথমে তারা পুকুরে উঁকি দিল। পানিতে শুধু তারার ঝিকিমিকি, চাঁদ তো নেই!', setting: 'pond', night: true, camera: 'pan-right', fx: ['stars', 'fireflies'],
        actors: [{ emoji: '🦜', x: 30, y: 26, size: 18, anim: 'bob' }, { emoji: '🐸', x: 66, y: 10, size: 14, anim: 'hop' }] },
      { text: 'তারপর বটগাছে গিয়ে পেঁচা দাদুকে জিজ্ঞেস করল। পেঁচা দাদু চোখ পিটপিট করে বলল, “হুম… ছাদে দেখো তো!”', setting: 'forest', night: true, camera: 'zoom-in', fx: ['fireflies'],
        actors: [{ emoji: '🦉', x: 62, y: 48, size: 18, anim: 'bob' }, { emoji: '🦜', x: 30, y: 30, size: 16, anim: 'fly' }] },
      { text: 'ছাদে উঠে দেখে, শুধু একটা বিড়াল গুটিসুটি মেরে ঘুমাচ্ছে। মিঠুর খুব কান্না পেল।', setting: 'home', night: true, camera: 'pan-left', fx: ['stars'],
        actors: [{ emoji: '🐈', x: 60, y: 14, size: 18 }, { emoji: '💤', x: 70, y: 34, size: 9, anim: 'bob' }, { emoji: '🦜', x: 28, y: 18, size: 16 }] },
      { text: 'পেঁচা দাদু উড়ে এসে বলল, “চাঁদ কখনো হারায় না। মাঝে মাঝে সে লুকিয়ে একটু বিশ্রাম নেয়।”', setting: 'home', night: true, camera: 'still', fx: ['stars', 'fireflies'],
        actors: [{ emoji: '🦉', x: 66, y: 40, size: 18, anim: 'fly' }, { emoji: '🦜', x: 32, y: 20, size: 18, anim: 'bob' }] },
      { text: 'পরের রাতে আকাশে দেখা দিল সরু এক ফালি চাঁদ, ঠিক যেন একটা হাসি! মিঠুও হেসে ফেলল।', setting: 'home', night: true, camera: 'zoom-out', fx: ['stars', 'fireflies'],
        actors: [{ emoji: '🌙', x: 72, y: 66, size: 18, anim: 'bob' }, { emoji: '🦜', x: 34, y: 20, size: 20, anim: 'hop' }] },
    ],
    quiz: [
      { question: 'চাঁদ খুঁজতে কে সাহায্য করল?', options: [{ emoji: '🐝', label: 'মৌমাছি' }, { emoji: '🦋', label: 'প্রজাপতি' }, { emoji: '✨', label: 'জোনাকি' }], answer: 2 },
      { question: 'শেষে চাঁদ দেখতে কেমন ছিল?', options: [{ emoji: '🌙', label: 'সরু হাসি' }, { emoji: '🌕', label: 'গোল থালা' }, { emoji: '⭐', label: 'তারা' }], answer: 0 },
    ],
  }),

  story({
    id: 'ghuri',
    title: 'লাল ঘুড়ির অভিযান',
    titleEn: "Red Kite's Adventure",
    emoji: '🪁',
    cover: { setting: 'sky', actors: [{ emoji: '🪁', x: 50, y: 40, size: 26, anim: 'fly' }], fx: ['clouds', 'sun'] },
    pages: [
      { text: 'রাজুর একটা লাল ঘুড়ি আছে, নাম লালু। লালু আকাশে উড়তে খুব ভালোবাসে।', setting: 'field', camera: 'zoom-in', fx: ['clouds'],
        actors: [{ emoji: '🪁', x: 62, y: 62, size: 18, anim: 'fly' }, { emoji: '👦', x: 30, y: 10, size: 18, anim: 'bob' }] },
      { text: 'একদিন হু-হু করে জোরে বাতাস এল। ফট্‌ করে সুতো ছিঁড়ে গেল! লালু উড়ে চলল অনেক দূরে।', setting: 'sky', camera: 'pan-right', fx: ['clouds', 'leaves'],
        actors: [{ emoji: '🪁', x: 50, y: 50, size: 18, anim: 'cross' }, { emoji: '💨', x: 20, y: 40, size: 14, anim: 'bob' }] },
      { text: 'লালু এসে পড়ল নদীর পাড়ে। এক মাঝি তাকে নৌকায় তুলে বলল, “চলো, তোমায় এগিয়ে দিই।”', setting: 'river', camera: 'pan-left', fx: ['sun'],
        actors: [{ emoji: '⛵', x: 50, y: 18, size: 24, anim: 'swim' }, { emoji: '🪁', x: 56, y: 38, size: 10, anim: 'bob' }] },
      { text: 'নদী পার হতেই এক সাদা বক লালুকে ঠোঁটে নিয়ে উড়ল ধানখেতের ওপর দিয়ে।', setting: 'field', camera: 'pan-right', fx: ['clouds'],
        actors: [{ emoji: '🕊️', x: 50, y: 58, size: 18, anim: 'cross' }, { emoji: '🌾', x: 25, y: 8, size: 14, anim: 'sway' }, { emoji: '🌾', x: 75, y: 8, size: 14, anim: 'sway', delay: 0.5 }] },
      { text: 'বক তাকে নামিয়ে দিল রেলস্টেশনে। ট্রেন বাঁশি বাজাল, “কু-ঝিক-ঝিক! উঠে পড়ো!”', setting: 'village', camera: 'zoom-out',
        actors: [{ emoji: '🚂', x: 50, y: 12, size: 26, anim: 'cross' }, { emoji: '🪁', x: 70, y: 40, size: 10, anim: 'bob' }] },
      { text: 'সন্ধ্যা নামছে। ট্রেনের জানালা দিয়ে লালু দেখল, রাজু মাঠে বসে মন খারাপ করে আছে।', setting: 'field', night: true, camera: 'zoom-in', fx: ['stars'],
        actors: [{ emoji: '👦', x: 40, y: 10, size: 18 }, { emoji: '😢', x: 52, y: 34, size: 8, anim: 'bob' }, { emoji: '🚃', x: 80, y: 30, size: 16, anim: 'swim' }] },
      { text: 'লালু বাতাসে এক লাফ দিয়ে সোজা রাজুর কোলে! “লালু, তুমি ফিরে এসেছ!” দুজনে খুশিতে নাচল।', setting: 'field', night: true, camera: 'still', fx: ['stars', 'fireflies'],
        actors: [{ emoji: '👦', x: 44, y: 10, size: 20, anim: 'hop' }, { emoji: '🪁', x: 58, y: 34, size: 14, anim: 'roll' }] },
      { text: 'সেদিন থেকে রাজু সুতোয় দুটো গিঁট দেয়। আর লালু সবাইকে শোনায় তার অভিযানের গল্প।', setting: 'sky', camera: 'zoom-out', fx: ['sun', 'clouds'],
        actors: [{ emoji: '🪁', x: 50, y: 44, size: 20, anim: 'fly' }, { emoji: '⛵', x: 18, y: 10, size: 10, anim: 'bob' }, { emoji: '🕊️', x: 82, y: 60, size: 10, anim: 'fly' }, { emoji: '🚂', x: 82, y: 8, size: 10 }] },
    ],
    quiz: [
      { question: 'লালু কে?', options: [{ emoji: '🎈', label: 'বেলুন' }, { emoji: '🪁', label: 'ঘুড়ি' }, { emoji: '⚽', label: 'বল' }], answer: 1 },
      { question: 'নদী পার করে দিল কে?', options: [{ emoji: '⛵', label: 'নৌকা' }, { emoji: '🚂', label: 'ট্রেন' }, { emoji: '🚌', label: 'বাস' }], answer: 0 },
    ],
  }),

  story({
    id: 'juto',
    title: 'বিড়ালের নতুন জুতো',
    titleEn: "The Cat's New Shoes",
    emoji: '🐈',
    cover: { setting: 'home', actors: [{ emoji: '🐈', x: 50, y: 12, size: 26, anim: 'hop' }, { emoji: '👟', x: 74, y: 10, size: 12, anim: 'bob' }] },
    pages: [
      { text: 'পুষি বিড়াল হাট থেকে চারটা লাল জুতো কিনল। এক পায়ে একটা, চার পায়ে চারটা!', setting: 'village', camera: 'zoom-in', fx: ['sun'],
        actors: [{ emoji: '🐈', x: 40, y: 10, size: 22, anim: 'walk' }, { emoji: '👟', x: 66, y: 10, size: 10, anim: 'hop' }, { emoji: '👟', x: 76, y: 10, size: 10, anim: 'hop', delay: 0.3 }] },
      { text: 'জুতো পরে পুষি যেই হাঁটে, অমনি জুতো বাজে, চিঁক-চিঁক, চিঁক-চিঁক!', setting: 'home', camera: 'pan-right',
        actors: [{ emoji: '🐈', x: 45, y: 10, size: 22, anim: 'walk' }, { emoji: '🎵', x: 62, y: 40, size: 10, anim: 'fly' }, { emoji: '🎶', x: 30, y: 46, size: 10, anim: 'fly', delay: 0.8 }] },
      { text: 'রান্নাঘরে ইঁদুর টুনু পনির খাচ্ছিল। পুষি চুপিচুপি এগোল… চিঁক-চিঁক!', setting: 'home', camera: 'zoom-in',
        actors: [{ emoji: '🐭', x: 72, y: 10, size: 14, anim: 'bob' }, { emoji: '🧀', x: 84, y: 10, size: 10 }, { emoji: '🐈', x: 30, y: 10, size: 20, anim: 'walk' }] },
      { text: 'টুনু শব্দ শুনে ফুড়ুৎ করে গর্তে লুকিয়ে পড়ল। হি হি হি!', setting: 'home', camera: 'still',
        actors: [{ emoji: '🕳️', x: 80, y: 8, size: 14 }, { emoji: '🐭', x: 80, y: 12, size: 10, anim: 'hop' }, { emoji: '🐈', x: 36, y: 10, size: 20, anim: 'bob' }, { emoji: '❓', x: 40, y: 42, size: 8, anim: 'bob' }] },
      { text: 'সারাদিন এমনই চলল। পুষি যেখানে যায়, জুতো বাজে, আর টুনু পালায়।', setting: 'home', camera: 'pan-left',
        actors: [{ emoji: '🐭', x: 50, y: 10, size: 12, anim: 'cross' }, { emoji: '🐈', x: 30, y: 10, size: 18, anim: 'walk' }, { emoji: '🎵', x: 40, y: 44, size: 8, anim: 'fly' }] },
      { text: 'রাতে পুষি ক্লান্ত হয়ে বসে পড়ল। টুনু উঁকি দিয়ে বলল, “তোমার জুতোর গান কিন্তু খুব সুন্দর!”', setting: 'home', night: true, camera: 'zoom-in', fx: ['stars'],
        actors: [{ emoji: '🐈', x: 36, y: 10, size: 20 }, { emoji: '🐭', x: 70, y: 10, size: 12, anim: 'bob' }, { emoji: '💬', x: 78, y: 32, size: 10, anim: 'bob' }] },
      { text: 'পুষি হেসে ফেলল। “তাহলে চলো, একসাথে নাচি!” চিঁক-চিঁক তালে দুই বন্ধু নাচল সারা রাত।', setting: 'home', night: true, camera: 'zoom-out', fx: ['stars', 'fireflies'],
        actors: [{ emoji: '🐈', x: 38, y: 10, size: 20, anim: 'hop' }, { emoji: '🐭', x: 62, y: 10, size: 14, anim: 'hop', delay: 0.25 }, { emoji: '🎶', x: 50, y: 46, size: 10, anim: 'roll' }] },
    ],
    quiz: [
      { question: 'পুষি কয়টা জুতো কিনল?', options: [{ emoji: '2️⃣', label: 'দুটো' }, { emoji: '1️⃣', label: 'একটা' }, { emoji: '4️⃣', label: 'চারটা' }], answer: 2 },
      { question: 'শেষে পুষি আর টুনু কী হলো?', options: [{ emoji: '🤝', label: 'বন্ধু' }, { emoji: '😠', label: 'রাগী' }, { emoji: '😴', label: 'ঘুমন্ত' }], answer: 0 },
    ],
  }),

  story({
    id: 'ilish',
    title: 'ইলিশের স্কুল',
    titleEn: 'Hilsa School',
    emoji: '🐟',
    cover: { setting: 'underwater', actors: [{ emoji: '🐟', x: 50, y: 40, size: 22, anim: 'swim' }], fx: ['bubbles'] },
    pages: [
      { text: 'পদ্মা নদীর নিচে আছে মাছেদের একটা স্কুল। সেখানে পড়ে ছোট্ট ইলিশ, নাম রুপালি।', setting: 'underwater', camera: 'zoom-in', fx: ['bubbles'],
        actors: [{ emoji: '🐟', x: 50, y: 40, size: 18, anim: 'swim' }, { emoji: '🐠', x: 22, y: 60, size: 12, anim: 'swim', delay: 0.5, flip: true }] },
      { text: 'রুপালি খুব ভীতু। বড় নদী দেখলেই সে লুকিয়ে পড়ে পাথরের পেছনে।', setting: 'underwater', camera: 'still', fx: ['bubbles'],
        actors: [{ emoji: '🪨', x: 50, y: 6, size: 26 }, { emoji: '🐟', x: 58, y: 24, size: 10, anim: 'bob' }] },
      { text: 'আজ স্কুলের শিক্ষাসফর! কাতলা স্যার বললেন, “সবাই লাইন ধরো। বুদবুদের পিছে পিছে এসো।”', setting: 'underwater', camera: 'pan-right', fx: ['bubbles'],
        actors: [{ emoji: '🐠', x: 74, y: 44, size: 20, anim: 'swim' }, { emoji: '🐟', x: 52, y: 40, size: 10, anim: 'swim', delay: 0.2 }, { emoji: '🐟', x: 38, y: 40, size: 10, anim: 'swim', delay: 0.4 }, { emoji: '🐟', x: 24, y: 40, size: 10, anim: 'swim', delay: 0.6 }] },
      { text: 'পথে দেখা হলো শুশুকের সাথে। শুশুক ডিগবাজি খেয়ে বলল, “ভয় কী? নদী তো আমাদের বাড়ি!”', setting: 'underwater', camera: 'zoom-in', fx: ['bubbles'],
        actors: [{ emoji: '🐬', x: 56, y: 46, size: 24, anim: 'roll' }, { emoji: '🐟', x: 24, y: 36, size: 10, anim: 'bob' }] },
      { text: 'তারপর এল কাঁকড়া মামা আর আলো জ্বলা জেলিফিশ। দেখতে দেখতে রুপালি দলছুট হয়ে গেল!', setting: 'underwater', camera: 'pan-left', fx: ['bubbles'],
        actors: [{ emoji: '🦀', x: 30, y: 6, size: 14, anim: 'walk' }, { emoji: '🪼', x: 68, y: 56, size: 16, anim: 'bob' }, { emoji: '🐟', x: 48, y: 36, size: 10, anim: 'swim' }] },
      { text: 'চারপাশে কেউ নেই! রুপালির বুক ধুকপুক করছে। তখন তার মনে পড়ল, “বুদবুদের পিছে পিছে…”', setting: 'underwater', night: true, camera: 'zoom-in', fx: ['bubbles'],
        actors: [{ emoji: '🐟', x: 50, y: 34, size: 14, anim: 'bob' }, { emoji: '💭', x: 64, y: 54, size: 10, anim: 'bob' }] },
      { text: 'বুদবুদ ধরে ধরে সাঁতরে রুপালি ফিরে এল বন্ধুদের কাছে। এখন সে আর ভয় পায় না!', setting: 'underwater', camera: 'zoom-out', fx: ['bubbles'],
        actors: [{ emoji: '🐟', x: 30, y: 40, size: 12, anim: 'swim' }, { emoji: '🐟', x: 46, y: 46, size: 10, anim: 'swim', delay: 0.3 }, { emoji: '🐠', x: 66, y: 42, size: 16, anim: 'swim', delay: 0.5 }, { emoji: '🐬', x: 80, y: 66, size: 14, anim: 'roll' }] },
    ],
    quiz: [
      { question: 'রুপালি কী মাছ?', options: [{ emoji: '🦈', label: 'হাঙর' }, { emoji: '🐟', label: 'ইলিশ' }, { emoji: '🐙', label: 'অক্টোপাস' }], answer: 1 },
      { question: 'রুপালি কীসের পিছে পিছে ফিরে এল?', options: [{ emoji: '⭐', label: 'তারা' }, { emoji: '🍃', label: 'পাতা' }, { emoji: '🫧', label: 'বুদবুদ' }], answer: 2 },
    ],
  }),

  story({
    id: 'bij',
    title: 'ছোট্ট বীজের স্বপ্ন',
    titleEn: "The Tiny Seed's Dream",
    emoji: '🌱',
    cover: { setting: 'field', actors: [{ emoji: '🌱', x: 50, y: 10, size: 24, anim: 'sway' }], fx: ['sun'] },
    pages: [
      { text: 'মাটির নিচে ঘুমিয়ে ছিল ছোট্ট একটা আমের আঁটি। তার স্বপ্ন, একদিন সে আকাশ দেখবে।', setting: 'field', night: true, camera: 'zoom-in', fx: ['stars'],
        actors: [{ emoji: '🌰', x: 50, y: 2, size: 12, anim: 'bob' }, { emoji: '💭', x: 62, y: 22, size: 10, anim: 'bob' }] },
      { text: 'একদিন মিনা আর রবি তাকে মাটিতে পুঁতে দিল। রোজ সকালে তারা পানি দেয়।', setting: 'field', camera: 'still', fx: ['sun'],
        actors: [{ emoji: '👧', x: 30, y: 10, size: 18, anim: 'bob' }, { emoji: '👦', x: 70, y: 10, size: 18, anim: 'bob', delay: 0.4 }, { emoji: '💧', x: 50, y: 30, size: 8, anim: 'hop' }] },
      { text: 'বর্ষা এল। টুপটাপ বৃষ্টিতে আঁটি থেকে উঁকি দিল একটা সবুজ কচি পাতা!', setting: 'field', camera: 'zoom-in', fx: ['rain'],
        actors: [{ emoji: '🌱', x: 50, y: 8, size: 16, anim: 'sway' }] },
      { text: 'গ্রীষ্মের রোদে চারাগাছ লম্বা হলো। বাতাসে মাথা দুলিয়ে সে বলে, “আমি আকাশ দেখছি!”', setting: 'field', camera: 'zoom-out', fx: ['sun', 'clouds'],
        actors: [{ emoji: '🌿', x: 50, y: 8, size: 24, anim: 'sway' }] },
      { text: 'শীত গেল, বসন্ত এল। পাখিরা এসে তার ডালে বাসা বাঁধল।', setting: 'forest', camera: 'pan-right', fx: ['leaves'],
        actors: [{ emoji: '🌳', x: 50, y: 6, size: 40, anim: 'sway' }, { emoji: '🐦', x: 30, y: 62, size: 10, anim: 'fly' }, { emoji: '🐦', x: 70, y: 56, size: 9, anim: 'fly', delay: 0.6, flip: true }] },
      { text: 'অনেক বছর পর গাছ ভরে গেল মিষ্টি আমে। মিনা আর রবি এখন বড় হয়েছে।', setting: 'forest', camera: 'zoom-in', fx: ['sun'],
        actors: [{ emoji: '🌳', x: 50, y: 6, size: 42, anim: 'sway' }, { emoji: '🥭', x: 42, y: 40, size: 7, anim: 'bob' }, { emoji: '🥭', x: 58, y: 46, size: 7, anim: 'bob', delay: 0.4 }, { emoji: '👩', x: 18, y: 8, size: 16 }, { emoji: '👨', x: 82, y: 8, size: 16 }] },
      { text: 'দুপুরের রোদে গাছটা তার ছায়ায় ডেকে নিল সবাইকে। ছোট্ট আঁটির স্বপ্ন সত্যি হলো!', setting: 'field', camera: 'zoom-out', fx: ['sun', 'leaves'],
        actors: [{ emoji: '🌳', x: 50, y: 6, size: 46, anim: 'sway' }, { emoji: '🧒', x: 24, y: 6, size: 13, anim: 'hop' }, { emoji: '👧', x: 76, y: 6, size: 13, anim: 'hop', delay: 0.3 }] },
    ],
    quiz: [
      { question: 'আঁটি থেকে কী গাছ হলো?', options: [{ emoji: '🍌', label: 'কলা' }, { emoji: '🥥', label: 'নারকেল' }, { emoji: '🥭', label: 'আম' }], answer: 2 },
      { question: 'কচি পাতা কখন উঁকি দিল?', options: [{ emoji: '🌧️', label: 'বর্ষায়' }, { emoji: '❄️', label: 'শীতে' }, { emoji: '🍂', label: 'হেমন্তে' }], answer: 0 },
    ],
  }),
];

export const findBnStory = (id: string) => BN_STORIES.find((s) => s.id === id);
export const bnLessonId = (id: string) => `bn-${id}`;
