// The Far Isles (Night 27) — little islands far out at sea, reached by leaf boat.
// Each is a ring of pale coral sand around a green heart of palms, ferns and
// hibiscus, set in a bright turquoise lagoon where coral grows. Seashells wash up
// on the strand and tide pools hide in the rocks; hermit crabs scuttle sideways,
// sea turtles glide through the lagoon and bright parrots chatter in the palms.
// On dark nights the tide glows blue all along the shore, and so does your wake.
// Everything about them is data here; where they are is world/isles.js, finding
// them is game/isle_play.js, the crab's and turtle's moves are world/isle_life.js,
// drawing is render/isle_sprites.js, the glowing tide is render/isle_fx.js, and the
// sounds and the steel drum are audio/isle_sfx.js.
window.G = window.G || {};

G.ISLES = {
  cell: 60,          // tiles: at most one island per cell of this size (its middle sits well inside the cell)
  r: [4, 7.5],       // radius of an island in tiles (sand and all)
  core: 0.58,        // the green heart: this much of the radius (the rest is the sandy strand)
  lagoon: 3.4,       // tiles of turquoise lagoon around the sand
  deep: 0.35,        // the sea must be at least this deep (elevation below) where an island rises …
  clear: 0.41,       // … and open water all around it (no other land within reach)
  keepAway: 45,      // tiles around the start with no islands
  first: { from: 55, to: 230, r: 8.5 },   // one island is always out at sea within this many steps of the start
  tide: { need: 0.35, sparks: 3 },        // how dark it must be for the glowing tide; sparkles per shore tile
  chime: { reach: 8, every: 0.5 },        // shell chimes ring when the spirit is this close (tiles); how often to listen (s)
};

// the island grounds: a turquoise lagoon (water, a little higher than the sea so its edge curves),
// pale coral sand, and a lush green heart (reef: the lagoon's edge against the sea is wavy, see fringe() in sprites.js)
G.TILES.lagoon = { name: 'Lagoon', h: 176, s: 60, l: 47, water: true, reef: true, rank: 1.5, step: 'paddle' };
G.TILES.strand = { name: 'Coral sand', h: 24, s: 46, l: 78, step: 'sand', rank: 2 };
G.TILES.isle = { name: 'Island', h: 120, s: 44, l: 37, step: 'grass', rank: 3 };
Object.assign(G.SNOW.cover, { lagoon: 0, strand: 0.12, isle: 0.25 });   // the isles stay warm: only a dusting in winter
const ISLE_GROUND = {
  spring: { lagoon: [0, 0, 0], strand: [0, 0, 0], isle: [-4, 6, 4] },
  summer: { lagoon: [-4, 8, 3], strand: [2, 4, 2], isle: [-6, 10, 0] },
  autumn: { lagoon: [2, -4, -1], strand: [0, 0, 0], isle: [-10, 2, 0] },
  winter: { lagoon: [6, -16, 2], strand: [0, -12, 2], isle: [10, -14, 2] },
};
for (const s of G.SEASONS) Object.assign(s.ground, ISLE_GROUND[s.id]);

G.ITEMS.shell = { name: 'Seashells', color: '#ffd9cc' };
G.ITEMS.coral = { name: 'Coral', color: '#ff8f86' };

// natural things of the isles (see G.OBJECTS in content.js for the fields; afloat = on the water)
G.OBJECTS.seashell = { name: 'Seashells', solid: false, drops: { shell: 1 }, regrow: 240, sound: 'shell', chance: { shell: 0.35 } };
G.OBJECTS.tidepool = { name: 'Tide pool', solid: false, drops: { shell: 1 }, regrow: 320, sound: 'tidepool',
  chance: { coral: 0.4, pearl: 0.05 } };
G.OBJECTS.hibiscus = { name: 'Hibiscus', solid: true, drops: { petal: 1 }, regrow: 220, sound: 'petal', chance: { seed: 0.35 } };
G.OBJECTS.fern = { name: 'Fern', solid: false, drops: { fibre: 1 }, regrow: 160, sound: 'fibre', chance: { seed: 0.1 } };
G.OBJECTS.coral = { name: 'Coral', solid: false, afloat: true, drops: { coral: 1 }, regrow: 420, sound: 'coral',
  light: 24, glowHue: 300, tool: 'pick', bonus: { coral: 1 }, chance: { shell: 0.3 } };
// what grows where, by the tile's object roll (0..1) — the first threshold above the roll wins
G.ISLE_OBJECTS = {
  isle:   [[0.15, 'palm'], [0.23, 'hibiscus'], [0.34, 'fern'], [1, null]],
  strand: [[0.065, 'seashell'], [0.09, 'tidepool'], [0.11, 'palm'], [1, null]],
};
G.SEA_OBJECTS.lagoon = [[0.1, 'coral'], [0.993, null], [1, 'pearlbed']];

// lightHue = the colour of its light at night (and on the map)
G.STRUCTURES.shelllantern = { name: 'Shell lantern', solid: true, on: 'land', restore: 7, light: 250, lightHue: 340, sound: 'shell',
  homes: 2, map: [340, 70, 76] };
G.STRUCTURES.windchime = { name: 'Shell chime', solid: true, on: 'land', sound: 'chime', map: [20, 50, 82] };

G.RECIPES.push(
  { id: 'shelllantern', cost: { shell: 3, coral: 2, wood: 1 }, builds: 'shelllantern',
    desc: 'A great spiral shell on a driftwood post, with a coral light glowing in its mouth. It restores a wider land than a lantern.' },
  { id: 'windchime', cost: { shell: 2, fibre: 2, wood: 1 }, builds: 'windchime',
    desc: 'Seashells on threads under a driftwood arch. They clink softly whenever the wind blows — or you walk by.' },
);

// the isles' creatures (the crab's scuttle and the turtle's glide are in world/isle_life.js)
G.CREATURES.crab = {
  name: 'Hermit crab', move: 'scuttle', tiles: ['strand'], when: 'any', restore: 0.45,
  cap: 5, group: [1, 2], flee: 62, hues: [6, 18, 30, 350], sound: 'crab',
  meet: 'A hermit crab! It scuttles sideways, waves a claw at you — then hides in its shell.',
};
G.CREATURES.seaturtle = {
  name: 'Sea turtle', move: 'glide', tiles: ['lagoon'], when: 'any', restore: 0.4, under: true,
  cap: 2, group: [1, 1], flee: 40, hues: [150, 96, 40], sound: 'turtle',
  meet: 'A sea turtle! It glides up through the lagoon, lifts its head to breathe, and blinks at you.',
};
G.CREATURES.parrot = {
  name: 'Parrot', move: 'bird', tiles: ['isle', 'strand'], when: 'day', restore: 0.6,
  cap: 4, group: [1, 3], flee: 72, shelter: true, sound: 'parrot', hues: [2, 128, 204, 46, 284],
  meet: 'Parrots! Red, green and blue, chattering in the palms. The islands kept their brightest colours.',
};
G.CREATURES.fish.tiles.push('lagoon');
G.CREATURES.jelly.tiles.push('lagoon');
G.CREATURES.moth.tiles.push('strand', 'isle');
G.CREATURES.butterfly.tiles.push('isle');

const ISLE_MUSIC = { place: 'island', inst: 'steeldrum' };
Object.assign(G.MUSIC_PLACES, { isle: ISLE_MUSIC, strand: ISLE_MUSIC, lagoon: ISLE_MUSIC });
G.TRAVEL_STOPS.shelllantern = { name: 'Shell lantern {place}', hue: 340 };
G.STRUCTURES.shelllantern.travel = true;
Object.assign(G.TRAVEL_PLACES, { isle: 'on an island', strand: 'on an island', lagoon: 'in a lagoon' });
Object.assign(G.PHOTO_GROUNDS, { isle: 'A far isle', strand: 'A coral strand', lagoon: 'A turquoise lagoon' });

// what each island is called (picked by its place, so it never changes)
G.ISLE_NAMES = ['Driftwood Isle', 'Conch Cay', 'Coral Key', 'Palmrest', 'Turtle Isle', 'Little Lantern Key', 'Starfish Cay',
  'Hibiscus Isle', 'Mooncrab Key', 'Seaglass Isle', 'Lullaby Cay', 'Tidewhisper', 'Parrot Key', 'Sunset Cay'];

// a chapter of goals, after "The amber dunes"
(function () {
  const I = s => s.stats.isles || {};
  const goals = [
    { id: 'islefind', chapter: 'The far isles', text: 'Find an island', target: 1,
      progress: s => I(s).found || 0, hint: s => G.IslePlay.hint(s), reward: { wood: 2 } },
    { id: 'shells', chapter: 'The far isles', text: 'Gather seashells', target: 3,
      progress: s => s.stats.got.shell || 0, hint: 'Seashells wash up on the coral sand (E). Tide pools in the rocks hide some too.',
      reward: { fibre: 2 } },
    { id: 'coral', chapter: 'The far isles', text: 'Gather coral', target: 2,
      progress: s => s.stats.got.coral || 0,
      hint: 'Coral grows in the turquoise lagoon — sail over it and gather from your boat (E). A pick breaks off more.', reward: { shell: 1 } },
    { id: 'shelllantern', chapter: 'The far isles', text: 'Light a Shell lantern', target: 1,
      progress: s => s.world.count('shelllantern'),
      hint: 'Craft it (C) from 3 seashells, 2 coral and a piece of wood, and build it on an island.', reward: { coral: 2, petal: 2 } },
    { id: 'windchime', chapter: 'The far isles', text: 'Hang a shell chime', target: 1,
      progress: s => s.world.count('windchime'),
      hint: 'Two seashells, two fibre and a piece of wood (C). Listen for it when the wind blows.', reward: { seed: 2 } },
    { id: 'crab', chapter: 'The far isles', text: 'Meet a hermit crab', target: 1,
      progress: s => (s.stats.met && s.stats.met.crab) || 0,
      hint: 'Crabs come back where the coral sand has its colour again. They scuttle sideways — and hide if you rush.', reward: { shell: 2 } },
    { id: 'seaturtle', chapter: 'The far isles', text: 'Meet a sea turtle', target: 1,
      progress: s => (s.stats.met && s.stats.met.seaturtle) || 0,
      hint: 'Turtles glide in a coloured lagoon. Wait quietly by the water until one comes up to breathe.', reward: { pearl: 1 } },
    { id: 'glowtide', chapter: 'The far isles', text: 'See the glowing tide', target: 1,
      progress: s => I(s).glow || 0,
      hint: 'On a dark night, stand on an island\'s shore — or sail its lagoon — and watch the waves.', reward: { crystal: 2, coral: 2 } },
  ];
  let at = -1;
  G.GOALS.forEach((g, i) => { if (g.chapter === 'The amber dunes') at = i + 1; });
  G.GOALS.splice(at < 0 ? G.GOALS.length : at, 0, ...goals);
})();

G.ISLE_SAYS = {
  first: 'An island! Pale coral sand, palms and a turquoise lagoon. Seashells wash up on the strand (E), and coral grows in the lagoon — gather it from your boat.',
  again: 'Another little island, warm sand under your feet.',
  sub: 'where the sea kept its colours',
  about: 'A ring of pale coral sand around palms and hibiscus, in a turquoise lagoon far out at sea. At night the tide glows.',
  hintBoat: 'An island lies out at sea, about {d} steps {dir} of you. A leaf boat (made at a workbench) would carry you there.',
  hintFar: 'An island lies about {d} steps {dir} of you, out at sea.',
  hintNear: 'Land ho! Sail into the turquoise lagoon and step onto the sand.',
  glow: 'The tide is glowing! Every little wave lights up blue along the shore — the sea kept a light of its own through the Fading.',
  coralFirst: 'Coral, pink and branching — it glows softly at night. Three seashells and two coral make a Shell lantern (C).',
  shellFirst: 'A seashell, still warm from the sun. Hold it up and you can hear the sea.',
  lanternFirst: 'The Shell lantern glows from deep inside its spiral, and the island around it remembers its colours.',
};
