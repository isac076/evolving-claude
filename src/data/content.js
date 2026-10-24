// ALL GAME CONTENT LIVES HERE.
// Adding a new item, natural object, building or recipe is mostly a matter of
// adding an entry below (plus a draw function in render/sprites.js).
window.G = window.G || {};

G.TILE = 32;              // pixels per tile
G.DAY_LENGTH = 360;       // seconds for a full day/night cycle

// Ground types. h/s/l = base colour when fully restored.
// step = footstep sound (see G.STEP_SOUNDS in audio/sound.js).
G.TILES = {
  deep:  { name: 'Deep water', h: 215, s: 55, l: 22, water: true },
  water: { name: 'Water',      h: 205, s: 55, l: 34, water: true },
  sand:  { name: 'Sand',       h: 42,  s: 48, l: 64, step: 'sand' },
  grass: { name: 'Grass',      h: 104, s: 42, l: 38, step: 'grass' },
  forest:{ name: 'Forest',     h: 128, s: 38, l: 27, step: 'leaves' },
  stone: { name: 'Highland',   h: 220, s: 8,  l: 46, step: 'stone' },
};

// Things you can carry.
G.ITEMS = {
  wood:  { name: 'Wood',       color: '#b07a43' },
  stone: { name: 'Stone',      color: '#9aa1ad' },
  petal: { name: 'Glow petal', color: '#ffd77a' },
};

// Natural things that grow in the world and can be gathered.
// regrow = seconds until it grows back after gathering.
// sound = the sound effect played when gathered (see G.SFX in audio/sound.js).
G.OBJECTS = {
  tree:  { name: 'Tree',  solid: true,  drops: { wood: 2 },  regrow: 300, sound: 'wood' },
  rock:  { name: 'Rock',  solid: true,  drops: { stone: 2 }, regrow: 500, sound: 'stone' },
  bloom: { name: 'Bloom', solid: false, drops: { petal: 1 }, regrow: 200, light: 46, sound: 'petal' },
};

// Things the player can build.
// on: 'land' or 'water'.  restore = radius (tiles) of colour brought back.
// light = glow radius (px) at night.  floor = drawn under everything.
// sound = played when built.  step = footstep sound when walking on it.
// map = [h, s, l] colour on the map (lights with restore show as glowing dots).
G.STRUCTURES = {
  heart:   { name: 'Heart Stone', solid: true,  on: 'land', restore: 9, light: 320, sound: 'lantern' },
  lantern: { name: 'Lantern',     solid: true,  on: 'land', restore: 6, light: 230, sound: 'lantern' },
  path:    { name: 'Stone path',  solid: false, on: 'land', floor: true, sound: 'placeStone', step: 'stone', map: [38, 18, 70] },
  bridge:  { name: 'Bridge',      solid: false, on: 'water', floor: true, bridge: true, sound: 'placeWood', step: 'wood', map: [30, 45, 44] },
};

// Crafting recipes. Each builds a structure.
G.RECIPES = [
  { id: 'lantern', cost: { wood: 3, stone: 2, petal: 2 }, builds: 'lantern',
    desc: 'Brings colour and light back to the land around it.' },
  { id: 'path', cost: { stone: 1 }, builds: 'path', desc: 'A tidy stone path.' },
  { id: 'bridge', cost: { wood: 3 }, builds: 'bridge', desc: 'Cross water to reach new lands.' },
];
