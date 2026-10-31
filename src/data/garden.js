// Gardens: what planted things grow into, and how fast.
// A planted structure (G.STRUCTURES with `grow`) names one of these kinds.
// Growing is handled by world/garden.js; drawing by render/garden_sprites.js.
//
// time    = seconds to grow fully in coloured land, unwatered
// into    = the natural object it becomes (G.OBJECTS); `rare` sometimes instead
// rareChance = how often the rare one grows (decided by the spot, so it never changes)
// first   = said the first time one finishes growing
window.G = window.G || {};

G.GARDEN = {
  wetTime: 70,        // seconds a watering keeps the soil damp
  wetSpeed: 3,        // damp soil grows this many times faster (rain waters everything)
  greySpeed: 0.12,    // how fast plants grow in faded land (they need colour to thrive)
  colourNeeded: 0.55, // how coloured the land must be to grow at full speed
};

G.GROW_KINDS = {
  flower: {
    time: 120, into: 'bloom', rare: 'moonflower', rareChance: 0.25,
    first: 'Your seed has become a glowing bloom! Pick it for petals — and often more seeds.',
    firstRare: 'A moonflower! It sleeps by day and opens, shining, at night.',
  },
  tree: {
    time: 300, into: 'tree',
    first: 'Your sapling has grown into a tall tree. The forest is coming back, one acorn at a time.',
  },
};
