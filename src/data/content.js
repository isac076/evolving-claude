// ALL GAME CONTENT LIVES HERE.
// Adding a new item, natural object, building or recipe is mostly a matter of
// adding an entry below (plus a draw function in render/sprites.js).
window.G = window.G || {};

G.TILE = 32;              // pixels per tile
G.DAY_LENGTH = 360;       // seconds for a full day/night cycle

// Ground types. h/s/l = base colour when fully restored.
// step = footstep sound (see G.STEP_SOUNDS in audio/sound.js).
// rank = which ground lies "on top" where two meet: the higher one gets
// rounded corners over the lower, so shores and edges curve instead of stepping.
G.TILES = {
  deep:  { name: 'Deep water', h: 215, s: 55, l: 22, water: true, rank: 0 },
  water: { name: 'Water',      h: 205, s: 55, l: 34, water: true, rank: 1 },
  sand:  { name: 'Sand',       h: 42,  s: 48, l: 64, step: 'sand', rank: 2 },
  grass: { name: 'Grass',      h: 104, s: 42, l: 38, step: 'grass', rank: 3 },
  forest:{ name: 'Forest',     h: 128, s: 38, l: 27, step: 'leaves', rank: 4 },
  stone: { name: 'Highland',   h: 220, s: 8,  l: 46, step: 'stone', rank: 5 },
};

// Things you can carry.
G.ITEMS = {
  wood:  { name: 'Wood',       color: '#b07a43' },
  stone: { name: 'Stone',      color: '#9aa1ad' },
  petal: { name: 'Glow petal', color: '#ffd77a' },
  fibre: { name: 'Fibre',      color: '#c9d77a' },
  crystal:{ name: 'Crystal',   color: '#9fe6ff' },
  seed:  { name: 'Flower seeds', color: '#f0a8cf' },
  acorn: { name: 'Acorn',      color: '#c08a4a' },
  // tools: crafted once, kept forever. They show as badges, not counts.
  axe:   { name: 'Axe',        color: '#e0a060', tool: true, desc: 'Trees give an extra piece of wood.' },
  pick:  { name: 'Pick',       color: '#b9c4d6', tool: true, desc: 'Rocks give extra stone, and you can mine crystal.' },
  can:   { name: 'Watering can', color: '#8cc6e6', tool: true, desc: 'Press E beside a dry sprout to water it — it grows much faster.' },
};

// Natural things that grow in the world and can be gathered.
// regrow = seconds until it grows back after gathering.
// sound = the sound effect played when gathered (see G.SFX in audio/sound.js).
// tool = a tool that adds `bonus` to the drops.  needs = a tool you must own to gather it.
// glowHue = fixed colour of its night glow (otherwise each one has its own hue).
// chance = items that sometimes drop too: { item: chance 0..1 } (seeds, acorns).
G.OBJECTS = {
  tree:  { name: 'Tree',  solid: true,  drops: { wood: 2 },  regrow: 300, sound: 'wood', tool: 'axe', bonus: { wood: 1 }, chance: { acorn: 0.35 } },
  rock:  { name: 'Rock',  solid: true,  drops: { stone: 2 }, regrow: 500, sound: 'stone', tool: 'pick', bonus: { stone: 1 } },
  bloom: { name: 'Bloom', solid: false, drops: { petal: 1 }, regrow: 200, light: 46, sound: 'petal', chance: { seed: 0.55 } },
  // only grows from seed in a garden (see data/garden.js): opens and glows at night
  moonflower: { name: 'Moonflower', solid: false, drops: { petal: 2, seed: 1 }, regrow: 220, light: 70, glowHue: 200, sound: 'petal' },
  reeds: { name: 'Reeds', solid: false, drops: { fibre: 2 }, regrow: 240, sound: 'fibre' },
  crystal:{ name: 'Crystal cluster', solid: false, drops: { crystal: 1 }, regrow: 900, light: 60, glowHue: 195,
            sound: 'crystal', needs: 'pick', tool: 'pick', bonus: { crystal: 1 } },
};

// Things the player can build.
// on: 'land' or 'water'.  restore = radius (tiles) of colour brought back.
// light = glow radius (px) at night.  floor = drawn under everything.
// sound = played when built.  step = footstep sound when walking on it.
// map = [h, s, l] colour on the map (lights with restore show as glowing dots).
// fixed = can never be picked up.  workbench = recipes marked `at: 'workbench'` work near it.
// homes = how many rescued spirits can make their home by this light (see data/villagers.js).
// grow = a planted thing that grows into a natural object (see data/garden.js); soil = ground types it can go in.
G.STRUCTURES = {
  heart:   { name: 'Heart Stone', solid: true,  on: 'land', restore: 9, light: 320, sound: 'lantern', fixed: true, homes: 3 },
  lantern: { name: 'Lantern',     solid: true,  on: 'land', restore: 6, light: 230, sound: 'lantern', homes: 2 },
  beacon:  { name: 'Crystal Beacon', solid: true, on: 'land', restore: 11, light: 360, sound: 'beacon', homes: 4 },
  path:    { name: 'Stone path',  solid: false, on: 'land', floor: true, sound: 'placeStone', step: 'stone', map: [38, 18, 70] },
  bridge:  { name: 'Bridge',      solid: false, on: 'water', floor: true, bridge: true, sound: 'placeWood', step: 'wood', map: [30, 45, 44] },
  workbench:{ name: 'Workbench',  solid: true,  on: 'land', sound: 'craft', workbench: true, map: [30, 50, 50] },
  fence:   { name: 'Fence',       solid: true,  on: 'land', sound: 'placeWood', map: [30, 35, 52] },
  flowerbed:{ name: 'Flower bed', solid: false, on: 'land', sound: 'petal', light: 70, map: [330, 60, 66] },
  bench:   { name: 'Bench',       solid: true,  on: 'land', sound: 'placeWood', map: [30, 40, 48] },
  sprout:  { name: 'Flower sprout', solid: false, on: 'land', soil: ['grass', 'forest'], sound: 'plant', grow: 'flower', map: [110, 40, 34] },
  sapling: { name: 'Sapling',     solid: false, on: 'land', soil: ['grass', 'forest'], sound: 'plant', grow: 'tree', map: [120, 40, 28] },
};

// Crafting recipes. Each either builds a structure (placed in the world) or
// makes an item (a tool). at: 'workbench' = only while standing near a workbench.
// garden: true = listed in the Garden group of the craft panel.
G.RECIPES = [
  { id: 'lantern', cost: { wood: 3, stone: 2, petal: 2 }, builds: 'lantern',
    desc: 'Brings colour and light back to the land around it.' },
  { id: 'path', cost: { stone: 1 }, builds: 'path', desc: 'A tidy stone path.' },
  { id: 'bridge', cost: { wood: 3 }, builds: 'bridge', desc: 'Cross water to reach new lands.' },
  { id: 'workbench', cost: { wood: 4, stone: 2 }, builds: 'workbench',
    desc: 'Stand near it to craft tools, beacons and more.' },
  { id: 'fence', cost: { wood: 1 }, builds: 'fence', desc: 'Joins up with fences beside it.' },
  { id: 'flowerbed', cost: { petal: 1, fibre: 1 }, builds: 'flowerbed', desc: 'A little bed of glowing flowers.' },
  { id: 'sprout', cost: { seed: 1 }, builds: 'sprout', garden: true,
    desc: 'Plant flower seeds in grass. They grow into a glowing bloom — or, now and then, a rare moonflower.' },
  { id: 'sapling', cost: { acorn: 1 }, builds: 'sapling', garden: true,
    desc: 'Plant an acorn. Given time, colour and a little water, it becomes a tall tree.' },
  { id: 'axe', cost: { wood: 2, stone: 2, fibre: 2 }, makes: 'axe', at: 'workbench',
    desc: 'Trees give an extra piece of wood.' },
  { id: 'pick', cost: { wood: 2, stone: 3, fibre: 2 }, makes: 'pick', at: 'workbench',
    desc: 'More stone from rocks — and lets you mine glowing crystal in the highlands.' },
  { id: 'can', cost: { wood: 1, stone: 2 }, makes: 'can', at: 'workbench',
    desc: 'Water your sprouts and saplings (E) — watered plants grow three times as fast.' },
  { id: 'bench', cost: { wood: 3, fibre: 1 }, builds: 'bench', at: 'workbench', desc: 'A place to sit and watch the world return.' },
  { id: 'beacon', cost: { wood: 4, stone: 4, petal: 3, crystal: 3 }, builds: 'beacon', at: 'workbench',
    desc: 'A great crystal light. Restores a much wider land than a lantern.' },
];
G.WORKBENCH_REACH = 4;   // tiles
