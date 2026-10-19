// ---------------------------------------------------------------------------
// SYLLABUS
// 12 steps in 3 zones (Seeds 1–4, Sprouts 5–8, Trees 9–12), easiest → hardest. Each step
// opens when the previous one is finished; the skip challenge can jump ahead.
// Based on the Jolly Phonics sound order used by most Bangladeshi English-medium
// schools, Dolch sight words (pre-primer → primer), and the "science of reading"
// sequence: sound play → letters → blending (CVC) → word families → sight words →
// digraphs/blends → sentences → stories → long vowels → tricky sounds → long words → fluency.
// Deliberately NOT a full textbook: only the lessons that unlock the most reading per
// minute of play. Lesson ids are stable (progress is keyed by them); step ids are not.
// ---------------------------------------------------------------------------

export type GameType =
  | 'hear-tap'      // hear a sound/word, tap the matching letter/word  (recognition)
  | 'pic-word'      // see a picture, tap the word that names it         (decoding)
  | 'build-word'    // see a picture, tap letters in order to build word (blending)
  | 'word-pic'      // see a word, tap the picture                       (reading)
  | 'sentence-pic'  // read/hear a sentence, tap the matching scene      (comprehension)
  | 'order-words'   // hear a sentence, tap its words in order           (syntax)
  | 'story'         // read a tiny story, answer one question            (comprehension)
  | 'first-sound'   // hear a word, tap the letter it starts with        (phonemic awareness)
  | 'rhyme'         // see a picture, tap the picture that rhymes        (phonemic awareness)
  | 'case-match'    // see a capital letter, tap its small letter        (letter shapes)
  | 'blend-tap'     // hear separate sounds, blend them, tap the picture (blending)
  | 'fill-blank'    // sentence with a hole, tap the missing word        (reading in context)
  | 'syllable-tap'  // tap the word chunks in order (sun-flower)         (long words)
  | 'word-hunt';    // hear a word, find it inside a sentence            (fluency)

export interface Item {
  text: string;      // what is read (letter, word or sentence)
  emoji: string;     // the "picture"
  say?: string;      // what TTS says if different from text (e.g. letter sounds)
  hint?: string;     // letters: the key word ("sun"); rhyme items: the family ("at"); long words: the chunks ("sun-flower")
}

export interface StoryItem {
  title: string;
  emoji: string;
  lines: string[];
  question: string;
  options: string[];
  answer: number;
}

export interface Lesson {
  id: string;
  title: string;      // shown to grown-ups; the child sees icon + short label
  label: string;      // ≤ 2 words, what the child sees
  emoji: string;
  game: GameType;
  items: Item[];
  stories?: StoryItem[];
  rounds?: number;    // questions per play (default 6)
}

export type Zone = 'seeds' | 'sprouts' | 'trees';

// Three zones on the reading trail: pre-reader → early reader → fluent.
export const ZONES: { id: Zone; name: string; emoji: string; blurb: string }[] = [
  { id: 'seeds', name: 'Seeds', emoji: '🌱', blurb: 'Listen & tap' },
  { id: 'sprouts', name: 'Sprouts', emoji: '🌿', blurb: 'Read words' },
  { id: 'trees', name: 'Trees', emoji: '🌳', blurb: 'Read stories' },
];

export interface Level {
  id: number;
  zone: Zone;
  name: string;
  emoji: string;
  color: 'sun' | 'tangerine' | 'grass' | 'berry' | 'bubblegum' | 'sky';
  goal: string;       // one line for grown-ups
  lessons: Lesson[];
}

// --- Letter sounds (Jolly Phonics order). `say` approximates the SOUND, not the name.
const L = (text: string, emoji: string, hint: string, say: string): Item => ({ text, emoji, hint, say });
const LETTERS = {
  g1: [L('s','☀️','sun','sss'), L('a','🍎','apple','a'), L('t','🐯','tiger','t'), L('i','🐜','insect','i'), L('p','🐷','pig','p'), L('n','🪺','nest','nnn')],
  g2: [L('c','🐱','cat','k'), L('k','🪁','kite','k'), L('e','🥚','egg','e'), L('h','🎩','hat','h'), L('r','🐰','rabbit','rrr'), L('m','🌙','moon','mmm'), L('d','🐶','dog','d')],
  g3: [L('g','🐐','goat','g'), L('o','🐙','octopus','o'), L('u','☂️','umbrella','u'), L('l','🦁','lion','lll'), L('f','🐟','fish','fff'), L('b','⚽','ball','b')],
  g4: [L('j','🧃','juice','j'), L('z','🦓','zebra','zzz'), L('w','💧','water','w'), L('v','🚐','van','vvv'), L('y','🪀','yo-yo','y'), L('x','📦','box','ks'), L('q','👸','queen','kw')],
};

// Letter → item (with its sound), used by games that need a letter as an answer tile.
export const LETTER_BY_CHAR: Record<string, Item> = Object.fromEntries(Object.values(LETTERS).flat().map((i) => [i.text, i]));

const W = (text: string, emoji: string): Item => ({ text, emoji });
const RH = (text: string, emoji: string, family: string): Item => ({ text, emoji, hint: family });
const CH = (text: string, emoji: string, chunks: string): Item => ({ text, emoji, hint: chunks });

// --- Sound Play (step 1): words with a clear picture, grouped by first sound and by rhyme family
const FIRST = {
  g1: [W('sun','☀️'), W('sock','🧦'), W('tiger','🐯'), W('tent','⛺'), W('pig','🐷'), W('pen','🖊️'), W('moon','🌙'), W('mug','🍵')],
  g2: [W('cat','🐱'), W('car','🚗'), W('hat','🎩'), W('hen','🐔'), W('dog','🐶'), W('door','🚪'), W('bed','🛏️'), W('ball','⚽'), W('fish','🐟'), W('fan','🪭')],
};
const RHYMES = {
  r1: [RH('cat','🐱','at'), RH('hat','🎩','at'), RH('bat','🦇','at'), RH('pen','🖊️','en'), RH('hen','🐔','en'), RH('ten','🔟','en')],
  r2: [RH('pig','🐷','ig'), RH('wig','👩‍🦱','ig'), RH('twig','🌿','ig'), RH('dog','🐶','og'), RH('log','🪵','og'), RH('frog','🐸','og')],
  r3: [RH('sun','☀️','un'), RH('bun','🍞','un'), RH('nut','🥜','ut'), RH('hut','🛖','ut'), RH('cake','🎂','ake'), RH('snake','🐍','ake'), RH('boat','⛵','oat'), RH('goat','🐐','oat')],
};

// --- Word families (step 4): same ending, new first letter
const FAMILY = {
  at: [W('cat','🐱'), W('hat','🎩'), W('bat','🦇'), W('rat','🐀')],
  an: [W('van','🚐'), W('fan','🪭'), W('can','🥫'), W('man','👨'), W('pan','🍳')],
  ig: [W('pig','🐷'), W('wig','👩‍🦱'), W('fig','🍈'), W('dig','⛏️')],
  op: [W('top','🔝'), W('mop','🧹'), W('hop','🐇'), W('pop','🍿')],
  ug: [W('bug','🐛'), W('mug','🍵'), W('rug','🟫'), W('hug','🤗'), W('jug','🫗')],
};

// --- CVC words (short vowels), only words with a clear picture
const CVC = {
  a: [W('cat','🐱'), W('hat','🎩'), W('bat','🦇'), W('map','🗺️'), W('bag','👜'), W('van','🚐'), W('jam','🍓'), W('fan','🪭')],
  e: [W('bed','🛏️'), W('hen','🐔'), W('pen','🖊️'), W('net','🥅'), W('leg','🦵'), W('ten','🔟'), W('egg','🥚'), W('web','🕸️')],
  i: [W('pig','🐷'), W('lip','👄'), W('six','6️⃣'), W('bin','🗑️'), W('pin','📌'), W('fig','🍈'), W('wig','👩‍🦱'), W('kid','🧒')],
  o: [W('dog','🐶'), W('box','📦'), W('fox','🦊'), W('pot','🍲'), W('mop','🧹'), W('log','🪵'), W('cot','🛏️'), W('top','🔝')],
  u: [W('sun','☀️'), W('bus','🚌'), W('cup','☕'), W('bug','🐛'), W('mug','🍵'), W('nut','🥜'), W('rug','🟫'), W('hut','🛖')],
};

// --- Sight words (Dolch pre-primer → primer), 5 per lesson so 1-2 new ones stick per play
const SW = (t: string): Item => ({ text: t, emoji: '👀' });
const SIGHT = {
  s1: ['the','a','I','is','it'].map(SW),
  s2: ['to','and','in','you','we'].map(SW),
  s3: ['see','can','my','go','up'].map(SW),
  s4: ['me','big','little','look','said'].map(SW),
  s5: ['he','she','they','are','was'].map(SW),
  s6: ['have','like','with','this','what'].map(SW),
  s7: ['do','come','here','where','your'].map(SW),
};

// --- Digraphs & blends
const DIGRAPHS = {
  sh: [W('ship','🚢'), W('shop','🏪'), W('fish','🐟'), W('dish','🍽️'), W('shell','🐚'), W('sheep','🐑')],
  ch: [W('chip','🍟'), W('chick','🐤'), W('cheese','🧀'), W('chair','🪑'), W('cherry','🍒'), W('lunch','🍱')],
  th: [W('three','3️⃣'), W('thumb','👍'), W('bath','🛁'), W('moth','🦋'), W('teeth','🦷'), W('thin','🥢')],
  ng: [W('ring','💍'), W('king','🤴'), W('wing','🪽'), W('sing','🎤'), W('swing','🛝'), W('long','📏')],
};
const BLENDS = [W('frog','🐸'), W('flag','🚩'), W('drum','🥁'), W('crab','🦀'), W('star','⭐'), W('snail','🐌'), W('tree','🌳'), W('clock','🕐'), W('truck','🚚'), W('plant','🪴'), W('glass','🥛'), W('bread','🍞')];

// --- Long vowels (magic e, ee, oo, ai, oa)
const MAGIC_E = [W('cake','🎂'), W('bike','🚲'), W('kite','🪁'), W('rose','🌹'), W('bone','🦴'), W('nose','👃'), W('gate','🚪'), W('snake','🐍'), W('plane','✈️'), W('cube','🧊'), W('whale','🐳'), W('grape','🍇')];
const VOWEL_TEAMS = [W('bee','🐝'), W('feet','🦶'), W('moon','🌙'), W('boot','🥾'), W('spoon','🥄'), W('book','📖'), W('rain','🌧️'), W('train','🚆'), W('boat','⛵'), W('goat','🐐'), W('snail','🐌'), W('seed','🌱')];

// --- Sentences: decodable + sight words, each with ONE clear scene
const S = (text: string, emoji: string): Item => ({ text, emoji });
const SENTENCES_1 = [
  S('The cat is on the bed.','🐱🛏️'), S('I see a red bus.','🚌'), S('The dog can run.','🐶🏃'),
  S('The pig is big.','🐷'), S('The sun is hot.','☀️🥵'), S('I can hop.','🦘'),
  S('The hen has an egg.','🐔🥚'), S('Look at the fox.','🦊👀'), S('My cup is red.','☕🔴'),
  S('The bug is in the box.','🐛📦'),
];
const SENTENCES_2 = [
  S('The king has a ring.','🤴💍'), S('The fish is in the dish.','🐟🍽️'), S('A frog sat on a log.','🐸🪵'),
  S('I like to swing.','🛝'), S('The chick is little.','🐤'), S('We can see three ships.','🚢🚢🚢'),
  S('She has a big bag.','👩👜'), S('They sing a song.','👨‍👩‍👧🎤'), S('He is in the bath.','🧒🛁'),
  S('The crab is on the sand.','🦀🏖️'),
];
const SENTENCES_3 = [
  S('The snake is in the grass.','🐍🌿'), S('I ride my bike to the gate.','🚲🚪'), S('We eat cake with grapes.','🎂🍇'),
  S('A bee sits on the rose.','🐝🌹'), S('The boat is on the sea.','⛵🌊'), S('The train is very long.','🚆📏'),
  S('My feet are in my boots.','🦶🥾'), S('The whale is huge.','🐳'), S('Rain falls on the plant.','🌧️🪴'),
  S('The goat ate the seed.','🐐🌱'),
];

const STORIES: StoryItem[] = [
  {
    title: 'The Red Hat', emoji: '🎩',
    lines: ['Pip has a red hat.', 'The wind is big.', 'The hat is up, up, up!', 'A dog gets the hat for Pip.'],
    question: 'Who gets the hat?', options: ['the dog', 'the cat', 'the wind'], answer: 0,
  },
  {
    title: 'Bug in a Cup', emoji: '🐛',
    lines: ['A bug sat in a cup.', 'Mum did not see the bug.', 'Mum got the cup.', '"Oh! A bug!" said Mum.'],
    question: 'Where was the bug?', options: ['in a box', 'in a cup', 'on a bed'], answer: 1,
  },
  {
    title: 'The Little Boat', emoji: '⛵',
    lines: ['Tom has a little boat.', 'He puts it on the pond.', 'A duck swims by.', 'The boat goes with the duck!'],
    question: 'What swims by?', options: ['a fish', 'a frog', 'a duck'], answer: 2,
  },
  {
    title: 'Cake Day', emoji: '🎂',
    lines: ['It is Ria’s birthday.', 'Dad bakes a big cake.', 'Ria puts on six candles.', 'She makes a wish and blows!'],
    question: 'How many candles?', options: ['three', 'six', 'ten'], answer: 1,
  },
  {
    title: 'Snail and Rain', emoji: '🐌',
    lines: ['Rain falls on the leaf.', 'A snail comes out to play.', 'It slides very slowly.', 'The sun comes out. Bye, snail!'],
    question: 'When does the snail come out?', options: ['in the rain', 'in the sun', 'at night'], answer: 0,
  },
];

// --- Story Time (step 8): 3 short lines each, decodable words only
const STORIES_EASY_1: StoryItem[] = [
  { title: 'The Big Bug', emoji: '🐛', lines: ['A bug is on a rug.', 'The bug is big.', 'The bug hops up the bed.'],
    question: 'Where is the bug first?', options: ['on a rug', 'in a cup', 'on a hat'], answer: 0 },
  { title: 'Hot Sun', emoji: '☀️', lines: ['The sun is hot.', 'Sam sits in the shade.', 'Sam has a cold drink.'],
    question: 'Who sits in the shade?', options: ['Sam', 'the dog', 'the sun'], answer: 0 },
  { title: 'The Red Bus', emoji: '🚌', lines: ['A red bus is at the stop.', 'Kim gets on the bus.', 'The bus goes to the shop.'],
    question: 'Where does the bus go?', options: ['to the shop', 'to the pond', 'to bed'], answer: 0 },
];
const STORIES_EASY_2: StoryItem[] = [
  { title: 'Hen and Egg', emoji: '🐔', lines: ['The hen sits on a nest.', 'Tap, tap, tap! An egg!', 'A little chick comes out.'],
    question: 'What comes out?', options: ['a chick', 'a frog', 'a bug'], answer: 0 },
  { title: 'Dog Bath', emoji: '🐶', lines: ['The dog is in the mud.', 'Dad puts the dog in the bath.', 'Splash! The dog is not wet—Dad is!'],
    question: 'Who gets wet?', options: ['Dad', 'the hen', 'the cat'], answer: 0 },
  { title: 'Fish Wish', emoji: '🐟', lines: ['A fish is in a dish.', 'The fish makes a wish.', 'The fish wants the sea.'],
    question: 'What does the fish want?', options: ['the sea', 'a hat', 'a cup'], answer: 0 },
];
const STORIES_LONG: StoryItem[] = [
  { title: 'The Windy Kite', emoji: '🪁',
    lines: ['Mia has a new kite.', 'She runs up the hill.', 'The wind lifts the kite high.', 'It dances in the sky.', 'Mia holds the string tight.', 'She smiles all the way home.'],
    question: 'Where does the kite dance?', options: ['in the sky', 'in the sea', 'in a box'], answer: 0 },
  { title: 'Farm Morning', emoji: '🚜',
    lines: ['The sun comes up on the farm.', 'The cow says moo.', 'The hen lays an egg.', 'Farmer Jo gets the milk.', 'Then the farm dog barks hello.', 'It is a happy morning.'],
    question: 'Who gets the milk?', options: ['Farmer Jo', 'the hen', 'the dog'], answer: 0 },
  { title: 'Night Owl', emoji: '🦉',
    lines: ['The moon is bright.', 'An owl sits in a tree.', 'It looks around with big eyes.', 'A mouse runs by the root.', 'The owl hoots, but the mouse hides.', 'Soon the sun comes up.'],
    question: 'Where does the owl sit?', options: ['in a tree', 'in a house', 'on a boat'], answer: 0 },
  { title: 'Rain Day Fun', emoji: '🌧️',
    lines: ['Rain falls on the town.', 'Ben puts on his boots.', 'He jumps in a big puddle.', 'Splash! Mud on his coat!', 'Mum laughs and hangs it up.', 'Ben drinks hot milk.'],
    question: 'What does Ben put on?', options: ['his boots', 'a hat', 'a scarf'], answer: 0 },
];

// --- Tricky Sounds (step 10): ar, or, ow/ou, oi/oy
const TRICKY = {
  ar: [W('car','🚗'), W('star','⭐'), W('farm','🚜'), W('jar','🫙'), W('shark','🦈'), W('park','🌳')],
  or: [W('fork','🍴'), W('corn','🌽'), W('horse','🐴'), W('storm','⛈️'), W('sort','🗂️'), W('born','🍼')],
  ow: [W('cow','🐮'), W('owl','🦉'), W('clown','🤡'), W('crown','👑'), W('house','🏠'), W('mouse','🐭'), W('cloud','☁️')],
  oi: [W('coin','🪙'), W('oil','🛢️'), W('toy','🧸'), W('boy','👦'), W('soil','🪴'), W('foil','🥫')],
};
const SENTENCES_4 = [
  S('The shark is in the dark sea.','🦈🌊'), S('A cow is on the farm.','🐮🚜'), S('The clown has a crown.','🤡👑'),
  S('The boy has a new toy.','👦🧸'), S('I eat corn with a fork.','🌽🍴'), S('A mouse is in the house.','🐭🏠'),
  S('The owl is up in the clouds.','🦉☁️'), S('A storm is in the park.','⛈️🌳'), S('We drive the car to the farm.','🚗🚜'),
  S('The horse ate the corn.','🐴🌽'),
];

// --- Long Words (step 11): tap the chunks in order
const COMPOUND = [CH('sunflower','🌻','sun-flower'), CH('rainbow','🌈','rain-bow'), CH('football','🏈','foot-ball'), CH('cupcake','🧁','cup-cake'), CH('pancake','🥞','pan-cake'), CH('snowman','⛄','snow-man'), CH('toothbrush','🪥','tooth-brush'), CH('starfish','⭐','star-fish')];
const TWO_1 = [CH('rabbit','🐰','rab-bit'), CH('pencil','✏️','pen-cil'), CH('monkey','🐒','mon-key'), CH('window','🪟','win-dow'), CH('basket','🧺','bas-ket'), CH('kitten','🐱','kit-ten')];
const TWO_2 = [CH('jacket','🧥','jack-et'), CH('puppy','🐶','pup-py'), CH('apple','🍎','ap-ple'), CH('tiger','🐯','ti-ger'), CH('robot','🤖','ro-bot'), CH('spider','🕷️','spi-der')];

// --- Super Reader (step 12): longer sentences and paragraph stories
const SENTENCES_5 = [
  S('The little frog jumped over the log.','🐸🪵'), S('Mum made a big pot of hot soup.','👩🍲'), S('We saw a rainbow after the storm.','🌈⛈️'),
  S('The monkey climbed up the tall tree.','🐒🌳'), S('A pink balloon floated into the sky.','🎈☁️'), S('The baby rabbit hid under the bush.','🐰🌿'),
  S('Dad put the cupcakes on the table.','👨🧁'), S('The sailors sailed across the deep blue sea.','⛵🌊'),
];

export const LEVELS: Level[] = [
  {
    id: 1, zone: 'seeds', name: 'Sound Play', emoji: '🎧', color: 'bubblegum',
    goal: 'Listen first: which sound does a word start with, and which words rhyme? No reading needed.',
    lessons: [
      { id: 'sp-fs1', title: 'First sounds s t p m', label: 's t p m', emoji: '👂', game: 'first-sound', items: FIRST.g1 },
      { id: 'sp-fs2', title: 'First sounds c h d b f', label: 'c h d', emoji: '🐶', game: 'first-sound', items: FIRST.g2 },
      { id: 'sp-r1', title: 'Rhymes: cat hat, pen hen', label: 'cat hat', emoji: '🎵', game: 'rhyme', items: RHYMES.r1 },
      { id: 'sp-r2', title: 'Rhymes: pig wig, dog log', label: 'pig wig', emoji: '🎶', game: 'rhyme', items: RHYMES.r2 },
      { id: 'sp-r3', title: 'More rhymes', label: 'Rhyme!', emoji: '🥁', game: 'rhyme', items: RHYMES.r3, rounds: 8 },
    ],
  },
  {
    id: 2, zone: 'seeds', name: 'Letter Sounds', emoji: '🔤', color: 'sun',
    goal: 'Hear a sound, find its letter. Jolly Phonics groups 1–4.',
    lessons: [
      { id: 'l1-g1', title: 'Sounds s a t i p n', label: 's a t', emoji: '☀️', game: 'hear-tap', items: LETTERS.g1 },
      { id: 'l1-g2', title: 'Sounds c k e h r m d', label: 'c k e', emoji: '🐱', game: 'hear-tap', items: LETTERS.g2 },
      { id: 'l1-g3', title: 'Sounds g o u l f b', label: 'g o u', emoji: '🐐', game: 'hear-tap', items: LETTERS.g3 },
      { id: 'l1-g4', title: 'Sounds j z w v y x q', label: 'j z w', emoji: '🦓', game: 'hear-tap', items: LETTERS.g4 },
      { id: 'l1-abc', title: 'Capital and small letters', label: 'A a', emoji: '🔠', game: 'case-match', items: [...LETTERS.g1, ...LETTERS.g2, ...LETTERS.g3, ...LETTERS.g4], rounds: 8 },
      { id: 'l1-mix', title: 'All sounds mixed', label: 'Mix!', emoji: '🎲', game: 'hear-tap', items: [...LETTERS.g1, ...LETTERS.g2, ...LETTERS.g3, ...LETTERS.g4], rounds: 8 },
    ],
  },
  {
    id: 3, zone: 'seeds', name: 'Blend Words', emoji: '🧩', color: 'tangerine',
    goal: 'Blend 3 sounds into a word (c-a-t). One short vowel per lesson.',
    lessons: [
      { id: 'l2-a', title: 'a words', label: 'cat', emoji: '🐱', game: 'build-word', items: CVC.a },
      { id: 'l2-e', title: 'e words', label: 'bed', emoji: '🛏️', game: 'build-word', items: CVC.e },
      { id: 'l2-i', title: 'i words', label: 'pig', emoji: '🐷', game: 'build-word', items: CVC.i },
      { id: 'l2-o', title: 'o words', label: 'dog', emoji: '🐶', game: 'build-word', items: CVC.o },
      { id: 'l2-u', title: 'u words', label: 'sun', emoji: '☀️', game: 'build-word', items: CVC.u },
      { id: 'l2-tap', title: 'Blend the sounds', label: 'c-a-t', emoji: '🔊', game: 'blend-tap', items: [...CVC.a, ...CVC.e, ...CVC.i, ...CVC.o, ...CVC.u], rounds: 8 },
      { id: 'l2-read', title: 'Read the word', label: 'Read it', emoji: '📖', game: 'word-pic', items: [...CVC.a, ...CVC.e, ...CVC.i, ...CVC.o, ...CVC.u], rounds: 8 },
    ],
  },
  {
    id: 4, zone: 'seeds', name: 'Word Families', emoji: '🏠', color: 'berry',
    goal: 'Words that end the same (cat, hat, bat). Change the first letter, read a new word.',
    lessons: [
      { id: 'wf-at', title: '-at family', label: '-at', emoji: '🐱', game: 'build-word', items: FAMILY.at },
      { id: 'wf-an', title: '-an family', label: '-an', emoji: '🥫', game: 'build-word', items: FAMILY.an },
      { id: 'wf-ig', title: '-ig family', label: '-ig', emoji: '🐷', game: 'build-word', items: FAMILY.ig },
      { id: 'wf-op', title: '-op family', label: '-op', emoji: '🧹', game: 'build-word', items: FAMILY.op },
      { id: 'wf-ug', title: '-ug family', label: '-ug', emoji: '🐛', game: 'build-word', items: FAMILY.ug },
      { id: 'wf-mix', title: 'Families mixed', label: 'Mix!', emoji: '🎲', game: 'word-pic', items: [...FAMILY.at, ...FAMILY.an, ...FAMILY.ig, ...FAMILY.op, ...FAMILY.ug], rounds: 8 },
    ],
  },
  {
    id: 5, zone: 'sprouts', name: 'Sight Words', emoji: '👀', color: 'grass',
    goal: 'Know the most common words on sight (the, is, you…). 5 words a lesson.',
    lessons: [
      { id: 'l3-1', title: 'the a I is it', label: 'the', emoji: '1️⃣', game: 'hear-tap', items: SIGHT.s1 },
      { id: 'l3-2', title: 'to and in you we', label: 'and', emoji: '2️⃣', game: 'hear-tap', items: SIGHT.s2 },
      { id: 'l3-3', title: 'see can my go up', label: 'see', emoji: '3️⃣', game: 'hear-tap', items: SIGHT.s3 },
      { id: 'l3-4', title: 'me big little look said', label: 'look', emoji: '4️⃣', game: 'hear-tap', items: SIGHT.s4 },
      { id: 'l3-pic', title: 'Picture words', label: 'Pictures', emoji: '🖼️', game: 'pic-word', items: [...CVC.a, ...CVC.o, ...CVC.u], rounds: 8 },
      { id: 'l3-mix', title: 'Sight word mix', label: 'Mix!', emoji: '🎲', game: 'hear-tap', items: [...SIGHT.s1, ...SIGHT.s2, ...SIGHT.s3, ...SIGHT.s4], rounds: 10 },
    ],
  },
  {
    id: 6, zone: 'sprouts', name: 'Sounds Together', emoji: '🚢', color: 'bubblegum',
    goal: 'Two letters, one sound (sh ch th ng) and blends (fr st cl…).',
    lessons: [
      { id: 'l4-sh', title: 'sh', label: 'sh', emoji: '🚢', game: 'pic-word', items: DIGRAPHS.sh },
      { id: 'l4-ch', title: 'ch', label: 'ch', emoji: '🐤', game: 'pic-word', items: DIGRAPHS.ch },
      { id: 'l4-th', title: 'th', label: 'th', emoji: '👍', game: 'pic-word', items: DIGRAPHS.th },
      { id: 'l4-ng', title: 'ng', label: 'ng', emoji: '💍', game: 'pic-word', items: DIGRAPHS.ng },
      { id: 'l4-bl', title: 'Blends (fr, st, cl…)', label: 'frog', emoji: '🐸', game: 'build-word', items: BLENDS, rounds: 8 },
      { id: 'l4-sw', title: 'he she they are was', label: 'they', emoji: '5️⃣', game: 'hear-tap', items: SIGHT.s5 },
    ],
  },
  {
    id: 7, zone: 'sprouts', name: 'Read Sentences', emoji: '📝', color: 'tangerine',
    goal: 'Read a whole sentence and understand it. Put words in order.',
    lessons: [
      { id: 'l5-s1', title: 'Simple sentences', label: 'Read', emoji: '🐱', game: 'sentence-pic', items: SENTENCES_1 },
      { id: 'l5-o1', title: 'Word order 1', label: 'Order', emoji: '🔀', game: 'order-words', items: SENTENCES_1, rounds: 5 },
      { id: 'l5-s2', title: 'Sentences with sh ch th', label: 'Read 2', emoji: '🤴', game: 'sentence-pic', items: SENTENCES_2 },
      { id: 'l5-o2', title: 'Word order 2', label: 'Order 2', emoji: '🔀', game: 'order-words', items: SENTENCES_2, rounds: 5 },
      { id: 'l5-fb', title: 'Fill the gap', label: 'Gap', emoji: '🧱', game: 'fill-blank', items: [...SENTENCES_1, ...SENTENCES_2] },
      { id: 'l5-sw', title: 'have like with this what', label: 'like', emoji: '6️⃣', game: 'hear-tap', items: SIGHT.s6 },
    ],
  },
  {
    id: 8, zone: 'sprouts', name: 'Story Time', emoji: '📖', color: 'sun',
    goal: 'Tiny three-line stories, then a question to show the child understood.',
    lessons: [
      { id: 'st-1', title: 'Stories 1', label: 'Story 1', emoji: '🐛', game: 'story', items: [], stories: STORIES_EASY_1, rounds: 2 },
      { id: 'st-2', title: 'Stories 2', label: 'Story 2', emoji: '🐔', game: 'story', items: [], stories: STORIES_EASY_2, rounds: 2 },
      { id: 'st-3', title: 'All stories', label: 'Story 3', emoji: '📚', game: 'story', items: [], stories: [...STORIES_EASY_1, ...STORIES_EASY_2], rounds: 3 },
    ],
  },
  {
    id: 9, zone: 'trees', name: 'Big Reader', emoji: '🌟', color: 'sky',
    goal: 'Long vowels (cake, bee, moon) and tiny stories with a question.',
    lessons: [
      { id: 'l6-me', title: 'Magic e (cake, bike)', label: 'cake', emoji: '🎂', game: 'pic-word', items: MAGIC_E, rounds: 8 },
      { id: 'l6-vt', title: 'ee oo ai oa', label: 'moon', emoji: '🌙', game: 'build-word', items: VOWEL_TEAMS, rounds: 8 },
      { id: 'l6-s3', title: 'Longer sentences', label: 'Read 3', emoji: '🐳', game: 'sentence-pic', items: SENTENCES_3 },
      { id: 'l6-sw', title: 'do come here where your', label: 'where', emoji: '7️⃣', game: 'hear-tap', items: SIGHT.s7 },
      { id: 'l6-st', title: 'Tiny stories', label: 'Stories', emoji: '📚', game: 'story', items: [], stories: STORIES, rounds: 2 },
    ],
  },
  {
    id: 10, zone: 'trees', name: 'Tricky Sounds', emoji: '🌈', color: 'tangerine',
    goal: 'Vowel sounds that do not say their name: ar, or, ow/ou, oi/oy.',
    lessons: [
      { id: 'tk-ar', title: 'ar', label: 'ar', emoji: '🦈', game: 'pic-word', items: TRICKY.ar },
      { id: 'tk-or', title: 'or', label: 'or', emoji: '🐴', game: 'pic-word', items: TRICKY.or },
      { id: 'tk-ow', title: 'ow ou', label: 'ow ou', emoji: '🐮', game: 'pic-word', items: TRICKY.ow },
      { id: 'tk-oi', title: 'oi oy', label: 'oi oy', emoji: '🪙', game: 'pic-word', items: TRICKY.oi },
      { id: 'tk-mix', title: 'Tricky sounds mixed', label: 'Mix!', emoji: '🎲', game: 'build-word', items: [...TRICKY.ar, ...TRICKY.or, ...TRICKY.ow, ...TRICKY.oi], rounds: 8 },
      { id: 'tk-s', title: 'Tricky sentences', label: 'Read 4', emoji: '🤡', game: 'sentence-pic', items: SENTENCES_4 },
    ],
  },
  {
    id: 11, zone: 'trees', name: 'Long Words', emoji: '🐘', color: 'grass',
    goal: 'Big words are small words stuck together: sun + flower. Tap the chunks in order.',
    lessons: [
      { id: 'lw-c', title: 'Two words in one', label: 'sun+flower', emoji: '🌻', game: 'syllable-tap', items: COMPOUND },
      { id: 'lw-t1', title: 'Two chunks 1', label: 'rab-bit', emoji: '🐰', game: 'syllable-tap', items: TWO_1 },
      { id: 'lw-t2', title: 'Two chunks 2', label: 'pup-py', emoji: '🐶', game: 'syllable-tap', items: TWO_2 },
      { id: 'lw-read', title: 'Read the long word', label: 'Read it', emoji: '📖', game: 'pic-word', items: [...COMPOUND, ...TWO_1, ...TWO_2], rounds: 8 },
    ],
  },
  {
    id: 12, zone: 'trees', name: 'Super Reader', emoji: '🦸', color: 'berry',
    goal: 'Fluency: find words inside sentences, fill gaps, read longer sentences and stories.',
    lessons: [
      { id: 'sr-h1', title: 'Word hunt 1', label: 'Hunt', emoji: '🔍', game: 'word-hunt', items: SENTENCES_3 },
      { id: 'sr-h2', title: 'Word hunt 2', label: 'Hunt 2', emoji: '🔎', game: 'word-hunt', items: SENTENCES_4 },
      { id: 'sr-fb', title: 'Fill the gap', label: 'Gap', emoji: '🧱', game: 'fill-blank', items: [...SENTENCES_3, ...SENTENCES_4] },
      { id: 'sr-s', title: 'Long sentences', label: 'Read 5', emoji: '🎈', game: 'sentence-pic', items: SENTENCES_5, rounds: 5 },
      { id: 'sr-st', title: 'Longer stories', label: 'Big story', emoji: '🪁', game: 'story', items: [], stories: STORIES_LONG, rounds: 2 },
    ],
  },
];

export const ALL_LESSONS: Lesson[] = LEVELS.flatMap((l) => l.lessons);
export const findLesson = (id: string) => ALL_LESSONS.find((l) => l.id === id);
export const levelOfLesson = (id: string) => LEVELS.find((lv) => lv.lessons.some((l) => l.id === id));

// --- Step progression. A step opens when every lesson in the previous step has at
// least 1 star; inside a step, lessons open in order. `start` (Profile.startStep,
// set by grown-ups or the skip challenge) marks every step below it as skipped:
// counted done, and all its lessons stay open so the child can replay them freely.
export interface ProgressLike { lessonId: string; bestStars: number }
const starsOf = (p: ProgressLike[], id: string) => p.find((x) => x.lessonId === id)?.bestStars ?? 0;
export const isLessonDone = (p: ProgressLike[], lessonId: string) => starsOf(p, lessonId) >= 1;
export const isStepDone = (p: ProgressLike[], step: Level, start = 1) => step.id < start || step.lessons.every((l) => isLessonDone(p, l.id));
export const currentStepId = (p: ProgressLike[], start = 1) => (LEVELS.find((s) => !isStepDone(p, s, start)) ?? LEVELS[LEVELS.length - 1]).id;
export const isStepUnlocked = (p: ProgressLike[], id: number, start = 1) => id <= currentStepId(p, start);
export const isLessonUnlocked = (p: ProgressLike[], lessonId: string, start = 1) => {
  const step = levelOfLesson(lessonId);
  if (!step || !isStepUnlocked(p, step.id, start)) return false;
  if (step.id < start) return true;
  const i = step.lessons.findIndex((l) => l.id === lessonId);
  return i === 0 || isLessonDone(p, step.lessons[i - 1].id);
};

// The 🚀 skip-ahead quiz samples one question per lesson, so a step made only of stories cannot be challenged.
export const canChallenge = (step: Level) => step.lessons.some((l) => l.game !== 'story');

export type ReaderMode = 'listen' | 'read';

// Reader mode that suits a starting step: Seeds are audio-first, the rest text-first.
export const modeForStep = (id: number): ReaderMode => (LEVELS.find((l) => l.id === id)?.zone === 'seeds' ? 'listen' : 'read');

// --- Legacy users (Dexie v1 → v2). Before startStep existed, a step was "current" if
// the earlier ones were finished. Lesson ids start with `l<oldStep>-`, so the old
// step is recoverable from them. LEGACY_STEP_MAP sends an old step number to its id
// in the current LEVELS; update it whenever steps are inserted or renumbered, so
// returning children never get pushed back to an earlier step.
const LEGACY_LESSON_COUNT: Record<number, number> = { 1: 5, 2: 6, 3: 6, 4: 6, 5: 5, 6: 5 };
const LEGACY_STEP_MAP: Record<number, number> = { 1: 2, 2: 3, 3: 5, 4: 6, 5: 7, 6: 9 };
export const legacyStartStep = (p: ProgressLike[]): number | undefined => {
  if (!p.length) return undefined; // brand-new child: starts at step 1
  const doneIn = (n: number) => p.filter((x) => x.bestStars >= 1 && x.lessonId.startsWith(`l${n}-`)).length;
  // Lessons added to old steps since (l1-abc, l2-tap, l5-fb) have no legacy plays, so a child who
  // finished an old step may now owe them; the 12-step trail still lets them replay or carry on.
  const oldCurrent = Object.keys(LEGACY_LESSON_COUNT).map(Number).find((n) => doneIn(n) < LEGACY_LESSON_COUNT[n]) ?? 6;
  return LEGACY_STEP_MAP[oldCurrent];
};
