// The growing village (Night 13). When friends' cottages stand close together,
// the friends who live in them build a little village of their own (world/village.js):
// a well first, then a market stall, then a festival green with a ribbon pole.
// The buildings themselves are in G.STRUCTURES (data/content.js) with `village: true`.
window.G = window.G || {};

G.VILLAGE = {
  link: 9,          // cottages this many tiles apart (or closer) belong to the same village
  reach: 10,        // village buildings within this many tiles of a village's centre are its own
  rise: 7,          // seconds a new village building takes to go up
  gather: [0.17, 0.3],   // the part of the day (G.DAY_LENGTH phase; 0 = noon) when friends meet at the well
  festival: [0.17, 0.46], // a festival evening runs from dusk into the first part of the night
  ring: 1.7,        // tiles from the ribbon pole to the dancers
  lanternEvery: 1.3, // seconds between sky lanterns at a festival after dark
  welcome: 11,      // tiles from the well where the village name is shown as you arrive
  wellWater: 8,     // the well waters every planting this many tiles around it
};

// What a village builds as it grows: the first stage it reaches that it hasn't built yet.
// homes = cottages needed.  say = what the friends tell you.  title = what the place is called now.
G.VILLAGE_STAGES = [
  { homes: 2, build: 'well', title: 'hamlet',
    say: 'Your friends are building a well between their cottages — a little hamlet is born!' },
  { homes: 3, build: 'stall', title: 'village',
    say: 'Three homes! The friends put up a market stall. Visit it to swap things you have plenty of.' },
  { homes: 4, build: 'maypole', title: 'village green',
    say: 'Four homes make a real village: the friends raise a ribbon pole on the green. Tonight there will be a festival!' },
];

// Village names are made of two halves, chosen from the place itself (so they never change).
G.VILLAGE_NAMES = {
  a: ['Willow', 'Amber', 'Fern', 'Moss', 'Lark', 'Honey', 'Bramble', 'Clover', 'Thistle', 'Starling', 'Hazel', 'Linden', 'Bell', 'Wren'],
  b: ['mere', 'brook', 'dell', 'ford', 'haven', 'glen', 'wick', 'stead', 'hollow', 'combe', 'field', 'nook'],
};

// The market stall swaps things. Each day it offers `G.MARKET.offers` of these (chosen by the day
// and the village), and each can be done `G.MARKET.times` times a day.
G.MARKET = { offers: 3, times: 2 };
G.MARKET_TRADES = [
  { give: { wood: 4 }, get: { fibre: 3 } },
  { give: { stone: 4 }, get: { wood: 3 } },
  { give: { fibre: 3 }, get: { stone: 3 } },
  { give: { stone: 5 }, get: { crystal: 1 } },
  { give: { petal: 2 }, get: { seed: 2 } },
  { give: { wood: 3 }, get: { acorn: 2 } },
  { give: { seed: 2 }, get: { petal: 3 } },
  { give: { crystal: 1 }, get: { petal: 4 } },
  { give: { acorn: 2 }, get: { wood: 4 } },
  { give: { fibre: 4 }, get: { petal: 2 } },
];

// One festival in each season, on its last evening (and on the very first evening after the ribbon pole goes up).
// hues = colours of the ribbons, bunting and sky lanterns.
G.FESTIVALS = {
  spring: { name: 'Blossom Festival', hues: [330, 350, 300, 50], gift: { seed: 3, petal: 2 },
    say: 'Everyone has blossom in their hair tonight!' },
  summer: { name: 'Midsummer Festival', hues: [45, 30, 200, 160], gift: { petal: 3, fibre: 2 },
    say: 'The shortest night of the year — let\'s dance all of it!' },
  autumn: { name: 'Harvest Festival', hues: [20, 35, 5, 50], gift: { acorn: 3, wood: 3 },
    say: 'We give thanks for every leaf and seed.' },
  winter: { name: 'Lantern Festival', hues: [45, 200, 10, 280], gift: { crystal: 2, petal: 2 },
    say: 'We light lanterns so the long night isn\'t lonely.' },
};

// What friends say in their village.
G.VILLAGE_SAYS = {
  build: ['Hand me that plank!', 'Almost there…', 'Together we can build anything!', 'Mind your toes!', 'Up it goes!'],
  square: ['Lovely evening, isn\'t it?', 'Did you see the colours today?', 'My cottage is the cosiest.', 'I heard a lark this morning.',
    'The well water tastes like rain.', 'Shall we sit a while?', 'I\'m so glad we\'re neighbours.', 'The little light works so hard for us.'],
  festival: ['Dance with us!', 'Round and round!', 'Look at the lanterns!', 'What a wonderful night!', 'La la laa!', 'Hold my hand!'],
  welcome: ['Welcome to {name}!', 'You\'re always welcome in {name}.', 'Come and visit {name} again!'],
  well: ['The water is cool and clear. Every garden nearby drinks its fill.', 'You draw a bucket of water and the gardens around the well are watered.'],
  wellDry: 'The water is cool and clear. Plant something near the well and it will water it for you.',
  stall: ['Swap, swap! What do you need?', 'Fresh from the woods today!', 'Only the best for the little light.'],
};
