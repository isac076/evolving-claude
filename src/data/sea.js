// Across the water (Night 23) — a leaf boat to sail the lakes and the open sea.
// Make it at a workbench, then simply walk into the water: the spirit hops into
// its little boat and glides. Lily pads float in the shallows, driftwood bobs
// far out, and rare pearl beds shimmer on the sea floor. Pearls make the Sea
// lantern, a floating light that brings colour back to the water — and where
// the deep sea has its colour, whales come home. Moon jellies glow at night.
// Everything about it is data here; sailing is game/sailing.js, the sea's
// creatures are world/sea_life.js, drawing is render/sea_sprites.js and the
// sounds are audio/sea_sfx.js.
window.G = window.G || {};

G.SEA = {
  speed: 175,          // px/s afloat (a little quicker than walking — the joy of gliding)
  grip: 0.12,          // how quickly the boat answers (lower = more drift; walking is much snappier)
  wakeEvery: 12,        // px sailed between two puffs of wake
  far: 25,             // tiles from where you set sail to count as "crossing" to a far shore
  hintReach: 140,      // tiles: how far the goal hint looks for deep water
};

// footsteps on the water are paddle strokes (you can only be there in the boat)
G.TILES.water.step = 'paddle';
G.TILES.deep.step = 'paddle';

G.ITEMS.boat = { name: 'Leaf boat', color: '#9fd27a', tool: true,
  desc: 'Walk into the water to sail. Step onto the shore and it folds up small again.' };
G.ITEMS.pearl = { name: 'Pearl', color: '#f4ecff' };

// natural things on the water (afloat = a bridge or stepping stone may be built over them)
G.OBJECTS.lilypad = { name: 'Lily pads', solid: false, afloat: true, drops: { fibre: 1 }, regrow: 200, sound: 'lily',
  light: 22, glowHue: 320, chance: { seed: 0.25 } };
G.OBJECTS.driftwood = { name: 'Driftwood', solid: false, afloat: true, drops: { wood: 2 }, regrow: 420, sound: 'wood',
  chance: { pearl: 0.12 } };
G.OBJECTS.pearlbed = { name: 'Pearl bed', solid: false, afloat: true, drops: { pearl: 1 }, regrow: 600, sound: 'pearl',
  light: 30, glowHue: 270, chance: { pearl: 0.3 } };
// what floats where, by the tile's object roll (0..1) — the first threshold above the roll wins
G.SEA_OBJECTS = {
  water: [[0.04, 'lilypad'], [0.994, null], [1, 'pearlbed']],
  deep:  [[0.007, 'driftwood'], [0.992, null], [1, 'pearlbed']],
};

// a lantern that floats on a little raft, out on the water
G.STRUCTURES.buoy = { name: 'Sea lantern', solid: true, on: 'water', restore: 8, light: 270, lightHue: 168, sound: 'buoy',
  map: [168, 70, 72] };

G.RECIPES.push(
  { id: 'boat', cost: { wood: 5, fibre: 4 }, makes: 'boat', at: 'workbench',
    desc: 'A curled leaf with a petal sail. Walk into lakes and the sea to sail across them.' },
  { id: 'buoy', cost: { wood: 2, pearl: 2, petal: 1 }, builds: 'buoy',
    desc: 'A lantern on a little floating raft. Build it on the water — it brings colour back to the sea around it.' },
);

// the sea's own creatures (moves in world/sea_life.js). under = drawn beneath the surface.
G.CREATURES.whale = {
  name: 'Whale', move: 'whale', tiles: ['deep'], when: 'any', restore: 0.35, under: true,
  cap: 1, group: [1, 1], flee: 0, hues: [212, 220, 200], sound: 'whale',
  meet: 'A whale! It rises slowly beside you, breathes out a cloud of spray, and sings.',
};
G.CREATURES.jelly = {
  name: 'Moon jelly', move: 'jelly', tiles: ['deep', 'water'], when: 'night', restore: 0, under: true,
  cap: 8, group: [2, 4], flee: 30, hues: [190, 280, 320, 165],
  meet: 'Moon jellies! They kept a little of their light through the Fading, deep in the water.',
};
G.CREATURES.fish.under = true;

G.TRAVEL_STOPS.buoy = { name: 'Sea lantern {place}', hue: 168 };
G.STRUCTURES.buoy.travel = true;
G.TRAVEL_PLACES.water = 'on the water';
G.TRAVEL_PLACES.deep = 'out at sea';

// a chapter of goals, after "The snowy peaks"
(function () {
  const S = s => s.stats.sea || {};
  const goals = [
    { id: 'boat', chapter: 'Across the water', text: 'Make a leaf boat', target: 1,
      progress: s => s.inv.boat ? 1 : 0, hint: 'At a workbench (C): 5 wood and 4 fibre. Reeds by the water give fibre.', reward: { petal: 2 } },
    { id: 'sail', chapter: 'Across the water', text: 'Sail out to the deep water', target: 1,
      progress: s => S(s).deep || 0, hint: s => G.Sailing.hint(s) },
    { id: 'pearl', chapter: 'Across the water', text: 'Find a pearl', target: 1,
      progress: s => s.stats.got.pearl || 0,
      hint: 'Pearl beds shimmer out on the water (E) — most of them far out at sea. Driftwood sometimes hides one.', reward: { wood: 2 } },
    { id: 'buoy', chapter: 'Across the water', text: 'Light a Sea lantern', target: 1,
      progress: s => s.world.count('buoy'),
      hint: 'Craft it (C) from 2 wood, 2 pearls and a glow petal, and build it on the water.', reward: { pearl: 1, petal: 2 } },
    { id: 'cross', chapter: 'Across the water', text: 'Sail across to a far shore', target: 1,
      progress: s => S(s).crossed || 0,
      hint: 'Sail at least ' + G.SEA.far + ' steps from where you set off, then step ashore. Islands wait out there.', reward: { seed: 2, acorn: 2 } },
    { id: 'jelly', chapter: 'Across the water', text: 'See the moon jellies glow', target: 1,
      progress: s => (s.stats.met && s.stats.met.jelly) || 0,
      hint: 'On a dark night, sail out over deep water and look down.', reward: { pearl: 1 } },
    { id: 'whale', chapter: 'Across the water', text: 'Meet a whale', target: 1,
      progress: s => (s.stats.met && s.stats.met.whale) || 0,
      hint: 'Whales come home where the deep sea has its colour. Light Sea lanterns far out and wait nearby.', reward: { pearl: 2, crystal: 2 } },
  ];
  let at = -1;
  G.GOALS.forEach((g, i) => { if (g.chapter === 'The snowy peaks') at = i + 1; });
  G.GOALS.splice(at < 0 ? G.GOALS.length : at, 0, ...goals);
})();

G.SEA_SAYS = {
  launch: 'You hop into your leaf boat and push off. Sail anywhere the water goes — lakes, rivers and the open sea. Step onto land to fold it away.',
  deep: 'The open sea. The water grows dark and deep below you — pearl beds and driftwood drift out here.',
  cross: 'Land on a far shore! You sailed all the way across.',
  pearlFirst: 'A pearl, shimmering like the moon. Two pearls make a Sea lantern (C) that floats on the water.',
  buoyFirst: 'The Sea lantern bobs on its raft, and the water around it remembers its colour. Whales may come home here.',
  lilyFirst: 'Lily pads give a little fibre — and their flowers glow softly at night.',
  noBoat: 'The water is too wide to wade. A leaf boat (made at a workbench) would carry you across.',
  hintFar: 'Deep water lies about {d} steps {dir} of you.',
  hintNear: 'The deep sea is right here — sail out past the shallows.',
  hintNone: 'Follow the rivers and shores — they all lead to the sea in the end.',
};
