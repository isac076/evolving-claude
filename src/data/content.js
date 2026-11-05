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
  // ruins of the old world (see data/ruins.js): placed by world/ruins.js, never gathered —
  // except rubble. ruin = part of a ruin.  read = a memory stone you can wake (E).
  rubble:  { name: 'Rubble', solid: false, drops: { stone: 2 }, regrow: 700, sound: 'stone', tool: 'pick', bonus: { stone: 1 }, ruin: true },
  pillar:  { name: 'Old pillar', solid: true, ruin: true },
  stump:   { name: 'Broken pillar', solid: true, ruin: true },
  ruinwall:{ name: 'Old wall', solid: true, ruin: true },
  arch:    { name: 'Old arch', solid: true, ruin: true },
  archfoot:{ name: 'Old arch', solid: true, ruin: true },
  statue:  { name: 'Keeper statue', solid: true, ruin: true, awakeLight: 110, glowHue: 40, glowAt: [13, -35] },
  fountain:{ name: 'Old fountain', solid: true, ruin: true, awakeLight: 70, glowHue: 195, glowAt: [0, -8] },
  memory:  { name: 'Memory stone', solid: true, ruin: true, read: true, light: 34, glowHue: 215 },
};

// Things the player can build.
// on: 'land' or 'water'.  restore = radius (tiles) of colour brought back.
// light = glow radius (px) at night.  floor = drawn under everything.
// sound = played when built.  step = footstep sound when walking on it.
// map = [h, s, l] colour on the map (lights with restore show as glowing dots).
// fixed = can never be picked up (fixedSay = what to say when you try).  workbench = recipes marked `at: 'workbench'` work near it.
// homes = how many rescued spirits can make their home by this light (see data/villagers.js).
// house = a cottage a friend can move into (see data/wishes.js).
// village = built by friends when their cottages make a village (data/village.js); fixed, never in a recipe.
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
  cottage: { name: 'Cottage',     solid: true,  on: 'land', sound: 'placeWood', house: true, map: [20, 55, 58] },
  // a memory stone you have woken (it replaces the sleeping stone; see data/ruins.js)
  memorystone: { name: 'Memory stone', solid: true, on: 'land', restore: 4, light: 170, sound: 'memory', fixed: true, homes: 1,
                 fixedSay: 'The memory stone has stood here since long before the Fading — it stays where it is.', map: [45, 70, 72] },
  sprout:  { name: 'Flower sprout', solid: false, on: 'land', soil: ['grass', 'forest'], sound: 'plant', grow: 'flower', map: [110, 40, 34] },
  // built by your friends themselves once their cottages make a village (see data/village.js)
  well:    { name: 'Village well', solid: true, on: 'land', sound: 'placeStone', fixed: true, village: true, light: 90, map: [205, 30, 62],
             fixedSay: 'Your friends built this well together — it belongs to the village now.' },
  stall:   { name: 'Market stall', solid: true, on: 'land', sound: 'placeWood', fixed: true, village: true, light: 90, map: [10, 55, 60],
             fixedSay: 'The market stall belongs to the village. Press E beside it to trade.' },
  maypole: { name: 'Ribbon pole', solid: true, on: 'land', sound: 'placeWood', fixed: true, village: true, light: 110, map: [320, 60, 70],
             fixedSay: 'The ribbon pole is the heart of the village green — it stays.' },
  sapling: { name: 'Sapling',     solid: false, on: 'land', soil: ['grass', 'forest'], sound: 'plant', grow: 'tree', map: [120, 40, 28] },
};

// Crafting recipes. Each either builds a structure (placed in the world) or
// makes an item (a tool). at: 'workbench' = only while standing near a workbench.
// garden: true = listed in the Garden group of the craft panel.
// unlock = hidden until a friend teaches it to you (state.stats.unlocked, see data/wishes.js).
G.RECIPES = [
  { id: 'lantern', cost: { wood: 3, stone: 2, petal: 2 }, builds: 'lantern',
    desc: 'Brings colour and light back to the land around it.' },
  { id: 'path', cost: { stone: 1 }, builds: 'path', desc: 'A tidy stone path.' },
  { id: 'bridge', cost: { wood: 3 }, builds: 'bridge', desc: 'Cross water to reach new lands.' },
  { id: 'workbench', cost: { wood: 4, stone: 2 }, builds: 'workbench',
    desc: 'Stand near it to craft tools, beacons and more.' },
  { id: 'fence', cost: { wood: 1 }, builds: 'fence', desc: 'Joins up with fences beside it.' },
  { id: 'flowerbed', cost: { petal: 1, fibre: 1 }, builds: 'flowerbed', desc: 'A little bed of glowing flowers.' },
  { id: 'cottage', cost: { wood: 6, stone: 4, fibre: 3 }, builds: 'cottage', unlock: 'cottage', home: true,
    desc: 'A little home with a round door. Build it near a friend\'s light and they\'ll move in.' },
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
