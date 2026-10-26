// First steps: small goals that teach the game, shown in the goal tracker.
// Each goal: id, text, target, progress(state) -> number, optional reward items.
// They are done in order; a finished goal stays finished (saved by id).
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
];
