// Ruins of the old world (Night 11): what kinds of ruin stand in the faded land,
// how they are laid out, and the memories their stones keep.
// Adding a new kind of ruin is a new entry in G.RUIN_SITES; adding to the story
// is a new entry in G.LORE (they are read in order, whichever stone you visit).
window.G = window.G || {};

G.RUIN = {
  cell: 40,          // the world is cut into cells this many tiles wide; each may hold one ruin
  chance: 0.6,       // chance that a cell has a ruin (if the ground there suits it)
  awayFromStart: 24, // tiles: no ruins this close to where a new world begins
  findAt: 7,         // tiles: how close you come before a ruin counts as found
  reward: { petal: 2, stone: 2 },   // what a memory stone gives when it wakes
};

// Each ruin is a little stamp of characters, centred on the site:
//  ' ' clear ground      '.' old flagstones
//  P  standing pillar    p  broken pillar stump    W  low wall
//  A  the left foot of an arch (the arch spans three tiles: A . a)
//  a  the right foot     S  a keeper's statue      F  a dry fountain
//  r  rubble (gather it for stone)                 M  the memory stone
// ground = what the centre tile must be.
G.RUIN_SITES = {
  circle: {
    name: 'Stone circle', ground: ['grass', 'forest', 'stone', 'sand'],
    about: 'A ring of tall stones, standing where they have stood for a very long time.',
    stamp: [
      '  P P  ',
      ' p   P ',
      'P     P',
      '   M   ',
      'P  .  p',
      ' P   P ',
      '  P r  ',
    ],
  },
  gate: {
    name: 'Fallen gate', ground: ['grass', 'forest', 'sand'],
    about: 'An old gateway with its walls tumbled down. You can still walk through it.',
    stamp: [
      'r       ',
      'WWA aWWp',
      '  ...   ',
      '  .M. r ',
      '   .    ',
    ],
  },
  fountain: {
    name: 'Dry fountain', ground: ['grass', 'sand'],
    about: 'A fountain that once sang in a little square. Its basin is cracked and dry.',
    stamp: [
      ' P   p ',
      ' ..... ',
      ' ..F.. ',
      ' ..... ',
      '  .M.  ',
      ' p  rP ',
    ],
  },
  keeper: {
    name: 'Sleeping keeper', ground: ['grass', 'forest', 'stone'],
    about: 'A stone figure in a hood, holding up a lantern that has long gone out.',
    stamp: [
      ' r p ',
      ' .S. ',
      ' ... ',
      ' .M. ',
      'p   r',
    ],
  },
  hall: {
    name: 'Hall of lanterns', ground: ['grass', 'stone', 'sand'],
    about: 'Two rows of broken columns. Once, a thousand lanterns hung here.',
    stamp: [
      'P P p P P',
      '.........',
      '.........',
      '....M....',
      '.........',
      'WW.......',
      'P p r P P',
    ],
  },
};

// The pieces a stamp letter becomes (natural objects in G.OBJECTS).
G.RUIN_PIECES = { P: 'pillar', p: 'stump', W: 'ruinwall', A: 'arch', a: 'archfoot', S: 'statue', F: 'fountain', r: 'rubble', M: 'memory' };

// The story of the Fading, one memory per stone, always told in this order.
G.LORE = [
  { title: 'The Hall of Lanterns', text: 'Every evening the keepers carried a flame from the Great Sun\'s hearth and set it in a thousand windows. Nobody in the valley ever knew a dark night.' },
  { title: 'A kept promise', text: 'The Great Sun did not burn like fire. It glowed like a kept promise: as long as someone remembered to tend it, it never dimmed.' },
  { title: 'Someone else', text: 'The keepers grew busy. Each one said: someone else will carry the flame tonight. And for one night, nobody did.' },
  { title: 'The first pale morning', text: 'The first night without the flame was very quiet. In the morning the roses were a little paler, and nobody could say why.' },
  { title: 'Colour sleeps', text: 'Colour does not die. It falls asleep — the way a song you have forgotten still waits somewhere inside you, ready to be hummed.' },
  { title: 'The wandering ones', text: 'The spirits of the valley went looking for the light. They wandered so far that they forgot their own names on the way.' },
  { title: 'The Heart', text: 'Before the last lantern went out, the keepers poured what was left of the Sun into a single stone and set it in the earth. They called it the Heart.' },
  { title: 'A small light', text: 'A small light was made, to wake when the world was at its greyest. It would not remember us. It would only want to shine.' },
  { title: 'Many lanterns', text: 'Wherever a little light is kept, the world remembers itself. One lantern is a beginning. Many lanterns are a song.' },
  { title: 'The cold hearth', text: 'Far away, the Sun\'s hearth still stands, cold and waiting. The way there is lit only by those who light the way.' },
  { title: 'Ember shrines', text: 'At the edges of the world the keepers raised shrines of ember, so that the Sun\'s warmth could be carried home again, piece by piece.' },
  { title: 'Thank you', text: 'If you are reading this, little light: thank you. We are sorry we forgot. Please do not forget the others.' },
];

// Said by a memory stone once the whole story has been read.
G.RUIN_ECHOES = [
  'The stone hums the same old tune the keepers sang.',
  'Under the moss, someone carved a small heart.',
  'The stone is warm, as if somebody had only just left.',
  'A faint echo of laughter, and lantern light on water.',
  'The carvings show a sun, and many small lights around it.',
];
