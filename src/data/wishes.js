// Friends' wishes (Night 10): little things your friends ask for, and the
// cottages they dream of. Everything here is plain data, so adding a new wish
// is just a new entry in G.WISHES.
//
// type    = how the wish is granted (see world/wishes.js):
//           'bring'  — carry these `items` to them and talk (they take them)
//           'build'  — `n` more of `structure` within G.WISH.near tiles of their home
//           'stat'   — `n` more of a counter: 'planted', 'flowers', 'lights', 'friends'
//           'house'  — move into a cottage of their own
// kinds   = which kinds of friend may wish for it (none = anyone)
// easy    = may be someone's very first wish
// if      = (state, v) => true when the wish makes sense right now
// text    = what they say when they tell you; short = the line in the wishes list
// thanks  = what they say when it comes true; reward = the gift they give back
window.G = window.G || {};

G.WISH = {
  first: 25,            // seconds after a friend settles before their first wish
  between: [70, 150],   // seconds between one wish coming true and the next one
  near: 8,              // tiles: "near my home" for build wishes, and how far a friend looks for a cottage
  maxHearts: 5,         // friendship hearts
  giftHearts: 3,        // from this many hearts, daily gifts are a little bigger
  unlockFirst: 'cottage',   // the first wish you grant teaches you this recipe
};

G.WISHES = {
  // ---- bring me something ----
  petals: { type: 'bring', items: { petal: 3 }, easy: true, short: '3 glow petals',
    text: 'Could you bring me 3 glow petals? I want to weave a garland for my light.',
    thanks: 'A garland! Look how it glows!', reward: { seed: 2, fibre: 1 } },
  wood: { type: 'bring', items: { wood: 4 }, easy: true, kinds: ['tinkerer', 'wanderer', 'singer'], short: '4 wood',
    text: 'I have an idea, and it needs 4 pieces of wood. Could you spare some?',
    thanks: 'Perfect! Oh, the things I\'ll make.', reward: { stone: 2, petal: 1 } },
  stones: { type: 'bring', items: { stone: 4 }, easy: true, kinds: ['tinkerer', 'wanderer', 'dreamer'], short: '4 stone',
    text: 'I\'m collecting smooth stones. Would you bring me 4?',
    thanks: 'So smooth! I shall line them up by size.', reward: { wood: 2, fibre: 2 } },
  fibre: { type: 'bring', items: { fibre: 3 }, kinds: ['gardener', 'dreamer', 'wanderer'], short: '3 fibre',
    text: 'I\'d love to knit a scarf. Do you have 3 fibre from the reeds?',
    thanks: 'Cosy! You\'ll have the first scarf. Well — the first one that fits a lantern.', reward: { petal: 2, seed: 1 } },
  seeds: { type: 'bring', items: { seed: 2 }, kinds: ['gardener', 'singer'], short: '2 flower seeds',
    if: s => (s.stats.got.seed || 0) > 0,
    text: 'Seeds! I need seeds! Could you bring me 2 flower seeds?',
    thanks: 'I\'ll keep them warm until spring. Here, have something for your pockets.', reward: { petal: 3, acorn: 1 } },
  crystal: { type: 'bring', items: { crystal: 1 }, kinds: ['dreamer', 'tinkerer', 'singer'], short: '1 crystal',
    if: s => (s.stats.got.crystal || 0) > 0,
    text: 'They say crystals keep a little starlight inside. Could you bring me one?',
    thanks: 'It\'s humming! Can you hear it humming?', reward: { petal: 3, seed: 2 } },

  // ---- build me something near my home ----
  flowerbed: { type: 'build', structure: 'flowerbed', n: 1, kinds: ['gardener', 'dreamer'], short: 'a flower bed near their home',
    text: 'Could you make a flower bed near my home? Something to wake up to.',
    thanks: 'Every morning I\'ll say good morning to them. Every single one.', reward: { seed: 2, petal: 1 } },
  paths: { type: 'build', structure: 'path', n: 3, kinds: ['wanderer', 'tinkerer'], short: '3 paths near their home',
    text: 'My feet keep getting lost. Would you lay 3 stones of path near my home?',
    thanks: 'Tip, tap, tip — I know exactly where I\'m going now!', reward: { fibre: 2, wood: 2 } },
  bench: { type: 'build', structure: 'bench', n: 1, kinds: ['dreamer', 'singer'], if: s => s.world.count('workbench') > 0, short: 'a bench near their home',
    text: 'If only there were a bench near my home, for watching the clouds…',
    thanks: 'I can see the whole sky from here!', reward: { petal: 2, crystal: 1 } },
  fences: { type: 'build', structure: 'fence', n: 3, kinds: ['gardener', 'tinkerer'], short: '3 fences near their home',
    text: 'The rabbits keep visiting my garden. Could you put up 3 fences near my home? Nice ones.',
    thanks: 'Now the rabbits have to knock first. Very polite.', reward: { seed: 1, stone: 2 } },

  // ---- help the world along ----
  plant: { type: 'stat', stat: 'planted', n: 2, kinds: ['gardener', 'wanderer'], if: s => (s.stats.got.seed || 0) + (s.stats.got.acorn || 0) > 0,
    short: 'plant 2 seeds or acorns', text: 'Would you plant 2 seeds or acorns somewhere? I want the world to have more green.',
    thanks: 'More green! You can almost hear it growing.', reward: { acorn: 1, seed: 2 } },
  flowers: { type: 'stat', stat: 'flowers', n: 1, kinds: ['gardener', 'singer'], if: s => (s.stats.planted || 0) > 0,
    short: 'grow a flower from seed', text: 'I would love to see a flower that you grew yourself. Just one!',
    thanks: 'You grew that? From a tiny seed? You clever light.', reward: { petal: 3 } },
  lantern: { type: 'stat', stat: 'lights', n: 1, kinds: ['singer', 'wanderer', 'dreamer'], short: 'light one more lantern',
    text: 'Could you light one more lantern somewhere? The more lights, the better the song.',
    thanks: 'I saw it from here, far away, like a new star!', reward: { petal: 2, wood: 2 } },
  friend: { type: 'stat', stat: 'friends', n: 1, kinds: ['singer', 'dreamer', 'gardener', 'wanderer', 'tinkerer'],
    short: 'bring another lost spirit home', text: 'I keep thinking about the others still lost out in the grey. Will you bring one more home?',
    thanks: 'Welcome, welcome! Oh, it\'s getting busy around here.', reward: { petal: 2, crystal: 1 } },

  // ---- a home of their own ----
  house: { type: 'house', kinds: ['gardener', 'tinkerer', 'dreamer', 'wanderer', 'singer'], if: s => (s.stats.unlocked || []).includes('cottage'), weight: 3,
    short: 'a cottage near their home', text: 'I dream of a little cottage of my own, near my light. With a round door. And a chimney!',
    thanks: 'My very own cottage! Come and visit me any time — just knock.', reward: { petal: 2, seed: 2 } },
};

G.WISH_SAYS = {
  remind: ['Remember my wish? {short}!', 'Still dreaming of {short}…', 'No hurry! But… {short}?'],
  carry: ['You have them! May I…?'],
  ready: ['It came true! Come here, come here!', 'Did you see? You did it!'],
  hearts: ['You\'re one of my dearest friends now.', 'My heart feels as bright as a beacon.'],
  movein: ['A home of my own!', 'I\'ll put the kettle on!', 'It even has a chimney!'],
  morning: ['Good morning! I slept like a stone.', 'Morning! The kettle\'s still warm.'],
};
