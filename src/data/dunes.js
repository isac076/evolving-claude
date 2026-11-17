// The Amber Dunes (Night 25) — the third new biome: warm, dry land where the
// sand piles into rippled golden dunes. Cacti flower, sunstones half-buried in
// the sand keep the day's warmth and glow at night, and in the heart of the
// dunes lies an oasis of cool water ringed with palms. Sand geckos dart about,
// dune tortoises plod along, tumbleweeds roll by in the wind — and on clear
// nights falling stars streak over the sand.
// Everything about them is data here; where they are is world/dunes.js, finding
// them is game/dune_play.js, the geckos' darting is world/dune_life.js, drawing is
// render/dune_sprites.js, the air (blowing sand, tumbleweeds, stars) is
// render/dune_fx.js, and the sounds and the oud are audio/dune_sfx.js.
window.G = window.G || {};

G.DUNES = {
  scale: 0.006,      // size of the dune noise (smaller = wider deserts)
  at: 0.7,           // heat + dryness must be above this for dunes
  dry: 0.9,          // how much dryness counts (moisture under 0.5 adds, over takes away)
  keepAway: 40,      // tiles around the start that never become dunes
  first: { dist: 76, radius: 24, boost: 0.34, apart: 46 },   // one dune field is always a walk from the start (apart = from the first hollow and peak)
  oasis: { r: 3.7, palms: 6.5, cell: 84, deep: 0.07 },   // pool radius, palm ring radius, one chance per cell, how deep in the dunes it must be
  cell: 100,         // tiles: dunes in different cells of this size count as different places
  wisps: 34,         // most streaks of blowing sand at once
  weeds: 2,          // most tumbleweeds rolling across the view at once
  stars: { first: [2, 4], every: [7, 16], need: 0.3 },   // falling stars: seconds to the first, then between them; how clear/dark the sky must be
};

// the ground of the dunes (rank 3.5: it curves over meadows and shores; woods and highland curve over it)
G.TILES.dune = { name: 'Dunes', h: 36, s: 58, l: 63, step: 'sand', rank: 3.5 };
G.SNOW.cover.dune = 0.3;   // only a thin frost of snow in the coldest season
const DUNE_GROUND = { spring: [0, 0, 0], summer: [-3, 8, 2], autumn: [-6, 4, -2], winter: [6, -18, 4] };
for (const s of G.SEASONS) s.ground.dune = DUNE_GROUND[s.id];

G.ITEMS.sunstone = { name: 'Sunstones', color: '#ffb25a' };
G.ITEMS.sand = { name: 'Fine sand', color: '#ecd39c' };

// natural things of the dunes (see G.OBJECTS in content.js for the fields)
G.OBJECTS.cactus = { name: 'Cactus', solid: true, drops: { fibre: 1 }, regrow: 320, sound: 'cactus', chance: { petal: 0.45, seed: 0.15 } };
G.OBJECTS.dunegrass = { name: 'Dune grass', solid: false, drops: { fibre: 1 }, regrow: 160, sound: 'fibre', chance: { seed: 0.2 } };
G.OBJECTS.sandheap = { name: 'Soft sand', solid: false, drops: { sand: 2 }, regrow: 80, sound: 'sand' };
G.OBJECTS.sunrock = { name: 'Sunstones', solid: false, drops: { sunstone: 1 }, regrow: 480, light: 36, glowHue: 12, sound: 'sunstone',
  tool: 'pick', bonus: { sunstone: 1 } };
G.OBJECTS.palm = { name: 'Palm', solid: true, drops: { wood: 2 }, regrow: 360, sound: 'wood', tool: 'axe', bonus: { wood: 1 },
  chance: { fibre: 0.5 } };
// what grows where on the dunes, by the tile's object roll (0..1) — the first threshold above the roll wins
G.DUNE_OBJECTS = [[0.028, 'cactus'], [0.07, 'dunegrass'], [0.11, 'sandheap'], [0.972, null], [1, 'sunrock']];
// … and around an oasis: palms and grass by the water
G.OASIS_OBJECTS = [[0.15, 'palm'], [0.3, 'dunegrass'], [0.33, 'reeds'], [1, null]];

// lightHue = the colour of its light at night (and on the map)
G.STRUCTURES.amberlantern = { name: 'Amber lantern', solid: true, on: 'land', restore: 7, light: 250, lightHue: 34, sound: 'sunstone',
  homes: 2, map: [34, 85, 66] };
G.STRUCTURES.sandcastle = { name: 'Sand castle', solid: true, on: 'land', sound: 'sand', map: [40, 55, 76] };

G.RECIPES.push(
  { id: 'amberlantern', cost: { sunstone: 3, sand: 2, wood: 1 }, builds: 'amberlantern',
    desc: 'Sand melted into amber glass around a glowing sunstone. Its warm light restores a wider land than a lantern.' },
  { id: 'sandcastle', cost: { sand: 4, petal: 1 }, builds: 'sandcastle',
    desc: 'Three little towers, a gate and a petal flag that flies in the wind. Just because.' },
);

// the dunes' creatures (the gecko's darting move is in world/dune_life.js; the tortoise plods with the snail's 'crawl')
G.CREATURES.gecko = {
  name: 'Sand gecko', move: 'dart', tiles: ['dune'], when: 'day', restore: 0.5,
  cap: 4, group: [1, 2], flee: 70, hues: [34, 18, 150, 192],
  meet: 'A sand gecko! It darts across the sand, stops dead — and does three tiny push-ups.',
};
G.CREATURES.tortoise = {
  name: 'Dune tortoise', move: 'crawl', tiles: ['dune'], when: 'day', restore: 0.6,
  cap: 2, group: [1, 1], flee: 44, hues: [34, 26, 44],
  meet: 'A dune tortoise, older than the Fading. Come close and it tucks its head in, then peeks out again.',
};
G.CREATURES.moth.tiles.push('dune');

G.MUSIC_PLACES.dune = { place: 'dunes', inst: 'oud' };
G.TRAVEL_STOPS.amberlantern = { name: 'Amber lantern {place}', hue: 34 };
G.STRUCTURES.amberlantern.travel = true;
G.TRAVEL_PLACES.dune = 'in the dunes';
G.PHOTO_GROUNDS.dune = 'The amber dunes';

// what each dune field is called (picked by its place, so it never changes)
G.DUNE_NAMES = ['The Amber Dunes', 'Sunrest Sands', 'The Whispering Dunes', 'Goldwind Erg', 'Starfall Sands', 'The Honey Dunes',
  'Ember Sands', 'The Quiet Erg', 'Mirage Dunes', 'Saffron Reach'];

// a chapter of goals, after "Across the water"
(function () {
  const D = s => s.stats.dunes || {};
  const goals = [
    { id: 'dunefind', chapter: 'The amber dunes', text: 'Find the amber dunes', target: 1,
      progress: s => D(s).found || 0, hint: s => G.DunePlay.hint(s) },
    { id: 'oasis', chapter: 'The amber dunes', text: 'Find the oasis', target: 1,
      progress: s => D(s).oasis || 0, hint: s => G.DunePlay.oasisHint(s), reward: { wood: 2 } },
    { id: 'sunstone', chapter: 'The amber dunes', text: 'Gather sunstones', target: 3,
      progress: s => s.stats.got.sunstone || 0, hint: 'Sunstones lie half-buried in the sand and glow at night (E). A pick digs out more.',
      reward: { sand: 2 } },
    { id: 'amberlantern', chapter: 'The amber dunes', text: 'Light an Amber lantern', target: 1,
      progress: s => s.world.count('amberlantern'),
      hint: 'Craft it (C) from sunstones, fine sand and wood. Soft sand heaps give sand (E).', reward: { sunstone: 2, petal: 2 } },
    { id: 'sandcastle', chapter: 'The amber dunes', text: 'Build a sand castle', target: 1,
      progress: s => s.world.count('sandcastle'),
      hint: 'Four handfuls of fine sand and a glow petal for the flag — cacti flower with petals.', reward: { seed: 2 } },
    { id: 'gecko', chapter: 'The amber dunes', text: 'Meet a sand gecko', target: 1,
      progress: s => (s.stats.met && s.stats.met.gecko) || 0,
      hint: 'Geckos come back where the dunes have their colour again. They are quick — stand still and watch.', reward: { wood: 3 } },
    { id: 'fallingstar', chapter: 'The amber dunes', text: 'Wish on a falling star', target: 1,
      progress: s => D(s).stars || 0,
      hint: 'On a clear night, stand out on the dunes and look up. The desert sky is the clearest of all.', reward: { crystal: 2, sunstone: 2 } },
  ];
  let at = -1;
  G.GOALS.forEach((g, i) => { if (g.chapter === 'Across the water') at = i + 1; });
  G.GOALS.splice(at < 0 ? G.GOALS.length : at, 0, ...goals);
})();

G.DUNE_SAYS = {
  first: 'Warm sand! The dry land piles up into rippled dunes. Sunstones glow in the sand (E), soft heaps give fine sand — and somewhere in the middle there is an oasis.',
  again: 'More dunes, warm under your feet.',
  sub: 'where the sand remembers the sun',
  about: 'Rippled golden dunes, flowering cacti and sunstones that glow at night. Falling stars streak over them on clear nights.',
  hintFar: 'Golden dunes lie about {d} steps {dir} of you.',
  hintNear: 'You are close — the meadow turns to warm sand where the dunes begin.',
  oasisFar: 'The oasis lies about {d} steps {dir} of you, in the heart of the dunes.',
  oasisNear: 'Look for palms — the oasis is just here.',
  oasis: 'An oasis! Cool, clear water in the middle of the dunes, with palms leaning over it.',
  oasisAbout: 'A pool of cool water ringed with palms, in the heart of the dunes.',
  star: 'A falling star! You make a wish — the desert sky is the clearest sky of all.',
  starGrey: 'A pale star falls over the grey sand. Bring colour back to the dunes and the sky will sparkle.',
};
