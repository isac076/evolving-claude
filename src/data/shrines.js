// The Ember Shrines (Night 15): four great shrines the keepers raised far out in
// the faded land, "so that the Sun's warmth could be carried home again".
// Each has four ember bowls that want an offering, and a great hearth at its
// heart. Light all four bowls and the hearth kindles: a wave of colour rolls out
// across a huge stretch of land. Adding a shrine is one more entry in G.SHRINES.
window.G = window.G || {};

G.SHRINE = {
  dist: [46, 62, 78, 94], // tiles from the start: the first shrine is the nearest, each next one further out
  restore: 26,            // tiles of colour a kindled hearth brings back (a lantern brings 6)
  kindleTime: 6,          // seconds the wave of colour takes to roll out
  findAt: 9,              // tiles: how close you come before a shrine counts as found
  senseMemories: 3,       // after this many woken memory stones, the shrines show on your map
  guideFrom: 22,          // tiles: farther than this, a soft ember arrow at the screen edge points the way
  keepRuinsAway: 15,      // tiles: no ruin is placed this close to a shrine
};

// Each shrine has its own ember colour (hue), offerings for its four bowls
// (one material each, in the order: top-left, top-right, bottom-left, bottom-right),
// a gift when it kindles, and a few words for the card that opens.
G.SHRINES = [
  { id: 'dawn', name: 'Shrine of Dawn', hue: 42,
    bowls: [{ wood: 4 }, { stone: 4 }, { petal: 3 }, { fibre: 3 }],
    gift: { crystal: 2, seed: 3 },
    words: 'The first ember wakes with the colour of early morning. Far away, something very large stirs in its sleep, and is a little warmer.' },
  { id: 'hearth', name: 'Shrine of the Hearth', hue: 14,
    bowls: [{ wood: 6 }, { acorn: 2 }, { stone: 5 }, { petal: 4 }],
    gift: { crystal: 2, acorn: 3 },
    words: 'This ember burns like a kitchen fire on a winter night. It remembers bread, and songs, and everyone coming home.' },
  { id: 'tide', name: 'Shrine of the Tide', hue: 182,
    bowls: [{ fibre: 5 }, { seed: 3 }, { petal: 4 }, { stone: 5 }],
    gift: { crystal: 3, petal: 5 },
    words: 'A cool, sea-green flame. It remembers the long rivers that carried light from village to village, and the sound of rain.' },
  { id: 'star', name: 'Shrine of Stars', hue: 268,
    bowls: [{ crystal: 3 }, { petal: 6 }, { wood: 6 }, { stone: 6 }],
    gift: { crystal: 4, seed: 4 },
    words: 'The last ember is the colour of the sky after sunset. Four embers burn now. Somewhere far beyond them, the Great Sun is listening.' },
];

// How a shrine is laid out, centred on its hearth (like the ruin stamps):
//  ' ' clear ground   '.' warm ember flagstones   O a carved ember post
//  B an ember bowl    H the great hearth
G.SHRINE_STAMP = [
  '    . .    ',
  '  O.....O  ',
  ' ..B...B.. ',
  ' ......... ',
  '...........',
  '.....H.....',
  '...........',
  ' ......... ',
  ' ..B...B.. ',
  '  O.....O  ',
  '    . .    ',
];
G.SHRINE_PIECES = { O: 'emberpost', B: 'emberbowl', H: 'hearth' };

// The shrine's stones are natural objects you can't gather (shrine: true routes E / clicks to G.ShrinePlay).
Object.assign(G.OBJECTS, {
  emberpost: { name: 'Ember post', solid: true, ruin: true, shrine: true },
  emberbowl: { name: 'Ember bowl', solid: true, ruin: true, shrine: true, bowl: true },
  hearth:    { name: 'Great hearth', solid: true, ruin: true, shrine: true, hearth: true },
});

// Lit bowls and the kindled hearth are fixed structures built on top (so they are saved like
// memory stones are — no new save fields). ember = take the shrine's hue for its glow.
Object.assign(G.STRUCTURES, {
  emberflame: { name: 'Lit ember bowl', solid: true, on: 'land', restore: 3, light: 170, sound: 'ember', fixed: true, ember: true,
                fixedSay: 'The ember bowl burns for the shrine now — it stays where it is.', map: [24, 85, 62] },
  shrineflame:{ name: 'Kindled hearth', solid: true, on: 'land', restore: 26, light: 460, sound: 'kindle', fixed: true, ember: true, homes: 4,
                fixedSay: 'The great hearth burns again. Nothing could make you put it out.', map: [30, 95, 70] },
  emberlamp:  { name: 'Ember lantern', solid: true, on: 'land', restore: 8, light: 270, sound: 'ember', homes: 3, map: [20, 80, 62] },
});

// The first kindled shrine teaches the Ember lantern (a warm light between a lantern and a beacon).
G.RECIPES.push({ id: 'emberlamp', cost: { wood: 3, stone: 3, petal: 3 }, builds: 'emberlamp', unlock: 'emberlamp',
  desc: 'A stone bowl holding a spark of a shrine\'s ember. Brings colour back further than a lantern.' });

G.SHRINE_SAYS = {
  sensed: 'The old stones remember where the Ember Shrines stand. The nearest one is marked on your map (M) — far to the {dir}.',
  found: '{name}! Four cold ember bowls ring a great hearth. Each bowl wants an offering: stand beside one and press E.',
  foundAgain: 'You found the {name}.',
  bowlWants: 'This ember bowl is cold. It wants {cost}.',
  bowlShort: 'This ember bowl wants {cost} — you have {have}.',
  bowlLit: 'The ember bowl catches! {n} of 4 burn.',
  hearthCold: 'The great hearth is cold. Light its four ember bowls first ({n} of 4 burn).',
  hearthLit: 'The {name} burns, warm and bright.',
  post: 'An ember post, carved with flames that seem to flicker when you are not looking.',
  kindled: 'The {name} is kindled! Colour rolls out across the land as far as you can see.',
  unlock: 'The shrine\'s warmth shows you how to keep a spark of it: you can now build an Ember lantern (C).',
  all: 'All four Ember Shrines burn. Their warmth is reaching for something far away…',
};
