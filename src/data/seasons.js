// The four seasons. The year turns on its own as the days pass (see
// world/seasons.js): every number below is blended smoothly from one season to
// the next, so the land changes colour slowly over half a day.
//
// ground  = how each ground type's colour shifts: [hue, saturation, lightness] added
// snow    = how deep the snow lies (0..1) — land turns white, rain falls as snow
// autumn  = how far leafy trees have turned gold, orange and red (0..1)
// bare    = how many leaves have fallen from leafy trees (0..1; evergreens keep theirs)
// blossom = pink blossom on the fruit trees (0..1)
// leafL   = lighter (+) or darker (-) leaves
// tufts   = how many tiles show grass tufts (lower = more: lush in summer)
// drift   = what floats down in coloured land: { kind: 'leaf' | 'petal', n: how many, hues }
// grow    = how fast gardens grow (1 = normal)
// tint    = a soft colour wash over the whole world [r, g, b, alpha]
// birds / crickets / fireflies = how lively the days and nights are (1 = normal)
// weather = how much more (or less) often each kind of weather comes (see data/weather.js)
// say / first = the message when the season begins (first = the first time ever)
window.G = window.G || {};

G.SEASON = {
  days: 3,          // days in each season (a day is G.DAY_LENGTH seconds)
  turn: 0.5,        // days it takes for one season to blend into the next
  steps: 40,        // the blend moves in this many small steps (keeps colours cached)
};

// trees: the autumn colours a leafy tree can turn (picked by the tree itself)
G.AUTUMN_HUES = [6, 18, 28, 38, 48];

// snow: the colour fresh snow brings, and how much of each ground it covers
G.SNOW = { h: 212, s: 24, l: 90, cover: { grass: 0.9, forest: 0.82, stone: 0.92, sand: 0.7, water: 0, deep: 0 } };

G.SEASONS = [
  {
    id: 'spring', name: 'Spring', icon: '✿',
    ground: { grass: [-2, 6, 7], forest: [-2, 6, 5], sand: [0, 0, 0], stone: [0, 0, 0], water: [0, 0, 0], deep: [0, 0, 0] },
    snow: 0, autumn: 0, bare: 0, blossom: 1, leafL: 6, grow: 1.35, tufts: 0.7,
    drift: { kind: 'petal', n: 7, hues: [335, 345, 355, 320] },
    tint: [210, 255, 220, 0.035], birds: 1.4, crickets: 0.5, fireflies: 0.6,
    weather: { drizzle: 1.8, rain: 1.3, overcast: 1.2, fog: 0.7 },
    say: 'Spring has come. The trees are in blossom.',
    first: 'Spring! Blossom opens on the trees, birds sing more, and seeds grow faster than ever.',
  },
  {
    id: 'summer', name: 'Summer', icon: '☀',
    ground: { grass: [-12, 14, -1], forest: [-8, 10, -2], sand: [0, 4, 3], stone: [0, 0, 2], water: [0, 6, 2], deep: [0, 4, 0] },
    snow: 0, autumn: 0, bare: 0, blossom: 0, leafL: -1, grow: 1.15, tufts: 0.5,
    drift: null,
    tint: [255, 222, 150, 0.06], birds: 1.1, crickets: 1.5, fireflies: 1.5,
    weather: { clear: 1.6, breezy: 1.2, drizzle: 0.6, rain: 0.6, fog: 0.4 },
    say: 'Summer is here. Long warm days, and fireflies at night.',
    first: 'Summer! The days are warm and golden, and at night the fireflies come out to dance.',
  },
  {
    id: 'autumn', name: 'Autumn', icon: '❦',
    ground: { grass: [-50, 4, 0], forest: [-72, 10, 2], sand: [-4, 2, 0], stone: [0, 0, 0], water: [0, -4, -1], deep: [0, -4, -1] },
    snow: 0, autumn: 1, bare: 0.15, blossom: 0, leafL: 3, grow: 0.8, tufts: 0.62,
    drift: { kind: 'leaf', n: 18, hues: [8, 20, 30, 42, 50] },
    tint: [255, 170, 90, 0.06], birds: 0.8, crickets: 0.6, fireflies: 0.4,
    weather: { fog: 2.2, breezy: 2, overcast: 1.4, clear: 0.8 },
    say: 'Autumn. The leaves are turning gold.',
    first: 'Autumn! The leaves turn gold and red and drift down on the wind. Mist comes more often now.',
  },
  {
    id: 'winter', name: 'Winter', icon: '❄',
    ground: { grass: [40, -20, 0], forest: [40, -20, 0], sand: [0, -20, 4], stone: [0, 4, 6], water: [-6, -20, 10], deep: [-4, -14, 4] },
    snow: 1, autumn: 0.7, bare: 1, blossom: 0, leafL: -2, grow: 0.35, tufts: 0.9,
    drift: null,
    tint: [185, 210, 255, 0.07], birds: 0.3, crickets: 0, fireflies: 0,
    weather: { drizzle: 1.6, overcast: 1.4, fog: 1.2, breezy: 0.6, clear: 0.9 },
    say: 'Winter. Snow settles softly over the land.',
    first: 'Winter! Snow covers the land, the leafy trees sleep bare, and rain falls as snow. Your friends have found their scarves.',
  },
];
