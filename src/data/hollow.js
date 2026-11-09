// The Glowcap Hollows (Night 17) — the first new biome: deep, damp woods where
// giant mushrooms grow and little glowcaps kept their light all through the
// Fading. Everything about them is data here; where they are is world/hollow.js,
// finding them is game/hollow_play.js, drawing is render/hollow_sprites.js and
// the drifting spores are render/spore_fx.js.
window.G = window.G || {};

G.HOLLOW = {
  scale: 0.007,      // size of the hollow noise (smaller = bigger hollows)
  at: 0.62,          // the noise must be above this for a hollow
  wet: 0.45,         // … and the land damp enough (moisture: forest is 0.55+)
  keepAway: 34,      // tiles around the start that never become a hollow (it fades in beyond)
  first: { dist: 62, radius: 19, boost: 0.42 },   // one hollow is always a walk from the start
  cell: 96,          // tiles: hollows in different cells of this size count as different places
  motes: 70,         // most drifting spores on screen at once
};

// the ground of the hollows (rank 4.5: it curves over forest, meadows and shores; highland curves over it)
G.TILES.mushwood = { name: 'Glowcap wood', h: 266, s: 24, l: 28, step: 'moss', rank: 4.5 };
G.SNOW.cover.mushwood = 0.55;   // the giant caps keep some of the snow off
// the hollows barely notice the seasons — a little warmer in autumn, paler in winter
const HOLLOW_GROUND = { spring: [0, 4, 2], summer: [-4, 4, 0], autumn: [-14, 6, 1], winter: [8, -10, 2] };
for (const s of G.SEASONS) s.ground.mushwood = HOLLOW_GROUND[s.id];

G.ITEMS.spore = { name: 'Glow spores', color: '#9fe8d8' };

// natural things of the hollows (see G.OBJECTS in content.js for the fields)
G.OBJECTS.bigshroom = { name: 'Giant mushroom', solid: true, drops: { spore: 2 }, regrow: 420, sound: 'spore', chance: { spore: 0.3 } };
G.OBJECTS.glowcap = { name: 'Glowcaps', solid: false, drops: { spore: 1 }, regrow: 200, light: 58, glowHue: 165, sound: 'spore', chance: { spore: 0.35 } };

// lightHue = the colour of its light at night (and on the map)
G.STRUCTURES.shroomlamp = { name: 'Mushroom lamp', solid: true, on: 'land', restore: 7, light: 250, lightHue: 172, sound: 'spore',
  homes: 2, map: [172, 60, 62] };
G.STRUCTURES.sporebed = { name: 'Spore patch', solid: false, on: 'land', soil: ['mushwood', 'forest'], sound: 'plant', grow: 'shroom', map: [270, 30, 40] };

G.RECIPES.push(
  { id: 'shroomlamp', cost: { spore: 4, wood: 2, fibre: 1 }, builds: 'shroomlamp',
    desc: 'A great glowing mushroom on a stalk. Its cool light restores a wider land than a lantern.' },
  { id: 'sporebed', cost: { spore: 1 }, builds: 'sporebed', garden: true,
    desc: 'Scatter glow spores in a hollow or a forest. They grow into glowcaps — and now and then a giant mushroom.' },
);

G.GROW_KINDS.shroom = {
  time: 140, into: 'glowcap', rare: 'bigshroom', rareChance: 0.22,
  first: 'Your spores have become glowcaps! They will glow softly every night.',
  firstRare: 'A giant mushroom grew from your spores!',
};

G.CREATURES.snail = {
  name: 'Glow snail', move: 'crawl', tiles: ['mushwood'], when: 'any', restore: 0.5,
  cap: 5, group: [1, 2], flee: 46, hues: [168, 186, 280, 305],
  meet: 'A glow snail! Its shell shines softly. Come too close and it hides inside.',
};
G.CREATURES.moth.tiles.push('mushwood');

G.MUSIC_PLACES.mushwood = { place: 'hollow', inst: 'musicbox' };
G.TRAVEL_STOPS.shroomlamp = { name: 'Mushroom lamp {place}', hue: 172 };
G.STRUCTURES.shroomlamp.travel = true;
G.TRAVEL_PLACES.mushwood = 'in the hollow';

// what each hollow is called (picked by its place, so it never changes)
G.HOLLOW_NAMES = ['Glowcap Hollow', 'Mossglow Dell', 'Dimcap Hollow', 'Lanternmoss Wood', 'Softspore Dell', 'Moonmoss Hollow',
  'Twinkling Dell', 'Hushcap Wood', 'Velvet Hollow', 'Bluebell Dell'];

G.HOLLOW_SAYS = {
  first: 'A hollow of giant mushrooms! Little glowcaps here kept their light all through the Fading. Gather glow spores (E) — they make a Mushroom lamp.',
  again: 'Another glowcap hollow.',
  sub: 'where the mushrooms kept their light',
  about: 'Giant mushrooms and glowcaps. Even in the Fading, this place never went quite dark.',
  hintFar: 'Giant mushrooms glow somewhere about {d} steps {dir} of you.',
  hintNear: 'You are close — the ground turns violet where the hollow begins.',
};
