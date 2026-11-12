// The Great Sun (Night 20) — the end of the story, and a new beginning.
// Beyond the farthest Ember Shrine stands the Sun's Hearth: a great round dais
// with a cold altar at its heart and four flame-shaped sockets, one for each
// shrine. Every shrine you kindle sends its ember here (its socket burns). With
// all four burning, press E at the altar: the embers gather, the Great Sun
// rises, and colour wakes softly everywhere in the world — even in land no
// lantern has touched. Then a little ending, and you keep playing.
// Logic: world/sun.js (where), game/sun_play.js (what happens), render/sun_sprites.js.
window.G = window.G || {};

G.SUN = {
  dist: 104,          // tiles from the start
  turn: 0.42,         // radians past the farthest shrine's direction (so it stands "beyond" it)
  findAt: 10,         // tiles: how close you come before the hearth counts as found
  keepRuinsAway: 16,  // tiles: no ruin is placed this close to it
  floor: 0.4,         // once the Sun burns, every bit of land is at least this coloured (lanterns still bring the rest)
  restore: 34,        // tiles of full colour around the Sun's Hearth itself
  riseTime: 13,       // seconds the sunrise takes before the ending opens
  dawnAt: 6,          // seconds into it: the flash, the dawn, the wave of colour
  guideFrom: 22,      // tiles: further than this, a golden arrow points the way (once it is sensed)
  hue: 44,
  night: 0.86,        // nights are a little softer under a rekindled Sun (darkness × this)
};

// The hearth's layout, centred on the altar:
//  ' ' clear ground   '.' sun-gold flagstones   P a sun pillar
//  S an ember socket (one per shrine, in reading order: north, west, east, south)
//  A the Sun's altar
G.SUN_STAMP = [
  '     . .     ',
  '   P.....P   ',
  '  .........  ',
  ' P....S....P ',
  ' ........... ',
  '.............',
  '..S...A...S..',
  '.............',
  ' ........... ',
  ' P....S....P ',
  '  .........  ',
  '   P.....P   ',
  '     . .     ',
];
G.SUN_PIECES = { P: 'sunpost', S: 'sunsocket', A: 'sunaltar' };

// stones you can't gather: E / clicks go to G.SunPlay
Object.assign(G.OBJECTS, {
  sunpost:   { name: 'Sun pillar', solid: true, ruin: true, sun: true },
  sunsocket: { name: 'Ember socket', solid: true, ruin: true, sun: true, socket: true },
  sunaltar:  { name: 'Altar of the Great Sun', solid: true, ruin: true, sun: true, altar: true },
});

// the risen Sun is a fixed structure on the altar (saved like a kindled hearth — no new save fields)
G.STRUCTURES.sunflame = { name: 'The Great Sun', solid: true, on: 'land', restore: G.SUN.restore, light: 620, fixed: true, homes: 6,
  lightHue: 46, sun: true, fixedSay: 'The Great Sun burns over its hearth. It will never be left untended again.', map: [46, 100, 74] };
if (G.TRAVEL_STOPS) { G.TRAVEL_STOPS.sunflame = { name: 'the Sun\'s Hearth', hue: 46 }; G.STRUCTURES.sunflame.travel = true; }

G.SUN_SAYS = {
  sensed: 'All four Ember Shrines burn! Their warmth streams away across the sky, far to the {dir} — toward the Sun\'s Hearth. It is marked on your map.',
  found: 'The Sun\'s Hearth! A great round dais of golden stone, with a cold altar at its heart and four sockets shaped like flames.',
  foundEarly: 'A great round dais of golden stone, with a cold altar and four empty sockets shaped like flames. What were they waiting for?',
  socketCold: 'A socket shaped like a flame. It waits for the ember of the {shrine}.',
  socketLit: 'The ember of the {shrine} burns here, far from home.',
  altarCold: 'The altar of the Great Sun is cold. {n} of 4 embers burn in its sockets — kindle the Ember Shrines and their warmth will find its way here.',
  altarReady: 'Four embers burn around the altar. Press E beside it to wake the Great Sun.',
  begin: 'The four embers lift from their sockets…',
  risen: 'The Great Sun burns over its hearth, warm and steady.',
  post: 'A tall pillar of golden stone, carved with a sun whose rays reach all the way to the ground.',
  after: 'Colour is waking everywhere now, softly, even far from your lanterns. Lanterns still bring the deepest colour — and the world is very big.',
};

// what friends say once the Sun burns again (G.VILLAGER_SAYS.sun, mixed into their everyday lines)
if (G.VILLAGER_SAYS) G.VILLAGER_SAYS.sun = [
  'Can you feel it? The Sun is warm again!', 'Even the grey places are blushing a little now.',
  'I stood in the sunshine all morning. I didn\'t do anything else. It was perfect.',
  'The keepers would be so proud of you.', 'Everything looks like it just woke up from a long nap.',
];

// The ending: lines that fade in one after another, then your journey, then "Keep shining".
G.ENDING = {
  title: 'The Great Sun',
  lines: [
    'It rises slowly, the way you wake on a summer morning — not all at once, but certainly.',
    'All across the world, colour remembers itself. Rivers remember blue. Meadows remember green. The roses remember that they were red.',
    'The keepers asked a small light not to forget the others. You didn\'t.',
  ],
  journey: 'Your journey',
  close: 'The world is awake now. But it is very big, and there is always more to find. Thank you, little light.',
  button: 'Keep shining',
};

// a chapter of goals for the end of the story
G.GOALS.push(
  { id: 'sunfind', chapter: 'The Great Sun', text: 'Find the Sun\'s Hearth', target: 1,
    progress: s => (s.stats.sun && s.stats.sun.found) || 0,
    hint: s => G.Sun && G.Sun.known(s) ? `It stands about ${G.Sun.stepsTo(s)} steps to the ${G.Sun.dirTo(s)} — follow the golden arrow.`
      : 'Kindle all four Ember Shrines and their warmth will show you where it stands.' },
  { id: 'sunrise', chapter: 'The Great Sun', text: 'Rekindle the Great Sun', target: 1,
    progress: s => (s.stats.sun && s.stats.sun.lit) || 0,
    hint: 'With all four embers burning in their sockets, stand beside the altar and press E.', reward: { crystal: 5, seed: 5 } },
);
