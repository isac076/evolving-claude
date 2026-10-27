// First steps: small goals that teach the game, shown in the goal tracker.
// Each goal: id, text, target, progress(state) -> number, optional reward items.
// They are done in order; a finished goal stays finished (saved by id).
// chapter = the heading shown above the goal (default 'First steps'); each
// chapter gets its own row of progress pips.
window.G = window.G || {};

G.GOALS = [
  { id: 'wood', text: 'Gather wood from a tree', target: 3,
    progress: s => s.stats.got.wood || 0, hint: 'Walk up to a tree and press E (or click it).' },
  { id: 'stone', text: 'Gather stone from a rock', target: 2,
    progress: s => s.stats.got.stone || 0, hint: 'Grey rocks give stone.' },
  { id: 'petal', text: 'Pick glow petals', target: 2,
    progress: s => s.stats.got.petal || 0, hint: 'Look for little glowing flowers.' },
  { id: 'lantern', text: 'Craft and place a Lantern', target: 1,
    progress: s => s.world.count('lantern'), hint: 'Press C to craft, then click near you to place it.',
    reward: { petal: 2 } },
  { id: 'map', text: 'Look at your map', target: 1,
    progress: s => s.stats.mapOpened || 0, hint: 'Press M, or tap the round map in the corner.' },
  { id: 'path', text: 'Lay stone paths', target: 4,
    progress: s => s.world.count('path'), hint: 'Paths are cheap — one stone each.', reward: { stone: 3 } },
  { id: 'explore', text: 'Wander and fill in your map', target: 2500,
    progress: s => s.explored.count, hint: 'Grey corners of the map are waiting.', percent: true,
    reward: { wood: 4 } },
  { id: 'lanterns', text: 'Light 3 lanterns', target: 3,
    progress: s => s.world.count('lantern'), hint: 'Each one brings back a little more of the world.',
    reward: { petal: 3 } },
  { id: 'wildlife', text: 'Meet 3 kinds of returning wildlife', target: 3,
    progress: s => Object.keys(s.stats.met || {}).length,
    hint: 'Butterflies, birds, rabbits and fish live in restored land. Moths visit lanterns at night.',
    reward: { petal: 2, wood: 2 } },
  { id: 'bridge', text: 'Build a bridge over water', target: 1,
    progress: s => s.world.count('bridge'), hint: 'Bridges let you reach new lands.' },

  // ---- The workshop (Night 4) ----
  { id: 'fibre', chapter: 'The workshop', text: 'Gather fibre from reeds', target: 4,
    progress: s => s.stats.got.fibre || 0, hint: 'Reeds grow on sandy shores and in meadows.' },
  { id: 'workbench', chapter: 'The workshop', text: 'Build a Workbench', target: 1,
    progress: s => s.world.count('workbench'), hint: 'Open Craft (C). A workbench lets you make tools.',
    reward: { fibre: 2 } },
  { id: 'tool', chapter: 'The workshop', text: 'Craft a tool at the workbench', target: 1,
    progress: s => (s.inv.axe ? 1 : 0) + (s.inv.pick ? 1 : 0), hint: 'Stand near your workbench and open Craft (C).' },
  { id: 'crystal', chapter: 'The workshop', text: 'Mine glowing crystal', target: 3,
    progress: s => s.stats.got.crystal || 0, hint: 'Crystals shine in the grey highlands. You need a Pick.',
    reward: { petal: 2 } },
  { id: 'beacon', chapter: 'The workshop', text: 'Raise a Crystal Beacon', target: 1,
    progress: s => s.world.count('beacon'), hint: 'Made at a workbench — it lights up a huge area.',
    reward: { wood: 5, stone: 5 } },
  { id: 'decor', chapter: 'The workshop', text: 'Make it homely: fences, flower beds, benches', target: 5,
    progress: s => s.world.count('fence') + s.world.count('flowerbed') + s.world.count('bench'),
    hint: 'Changed your mind? Press X to pick a building back up.' },
];
