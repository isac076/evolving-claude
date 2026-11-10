// Riverbanks & waymarks (Night 18): soft clay along the edges of shallow water,
// stepping stones you lay across the shallows, signposts that carry a name you
// type, and banners that flutter in the wind. Everything about them is data here;
// naming and reading signs is game/signs.js, drawing is render/riverbank_sprites.js.
window.G = window.G || {};

G.RIVER = {
  clayOn: { sand: [0.42, 0.56], grass: [0.50, 0.535] },   // object roll (tile hash) that may become clay, by ground …
  // … but only beside shallow water (never deep water, never inland)
  signNear: 7,       // tiles: a light this close to a signpost takes the sign's name on the lantern roads
  readAt: 4.5,       // tiles: how close you must be to read a signpost's name in the world
  nameMax: 22,       // letters in a sign's name
};

G.ITEMS.clay = { name: 'Clay', color: '#c98a64' };

// natural: soft wet clay where the shallows meet the shore (dig it with your hands; a pick helps)
G.OBJECTS.claybank = { name: 'Clay bank', solid: false, drops: { clay: 2 }, regrow: 260, sound: 'clay', tool: 'pick', bonus: { clay: 1 } };

// on: 'shallow' = only on shallow water (not the deep). bridge = you can stand on it over water.
// sign = a signpost that carries a name (game/signs.js).  banner = a flag you can recolour by clicking it.
G.STRUCTURES.stepstones = { name: 'Stepping stones', solid: false, on: 'shallow', floor: true, bridge: true, sound: 'stepstones', step: 'stone',
  map: [30, 14, 66] };
G.STRUCTURES.signpost = { name: 'Signpost', solid: true, on: 'land', sound: 'placeWood', sign: true, map: [32, 50, 62] };
G.STRUCTURES.banner = { name: 'Banner', solid: true, on: 'land', sound: 'banner', banner: true, map: [350, 60, 64] };
G.STRUCTURES.claypot = { name: 'Clay planter', solid: true, on: 'land', sound: 'clay', light: 54, map: [20, 50, 52] };

G.RECIPES.push(
  { id: 'stepstones', cost: { clay: 1, stone: 2 }, builds: 'stepstones',
    desc: 'Flat stones set in clay. Lay them across shallow water to hop from bank to bank.' },
  { id: 'signpost', cost: { wood: 2, clay: 1 }, builds: 'signpost',
    desc: 'Give a place a name! It shows on your map, and lights nearby take the name on the lantern roads.' },
  { id: 'banner', cost: { wood: 1, fibre: 2, petal: 1 }, builds: 'banner',
    desc: 'A bright flag that dances in the wind. Click it to change its colour.' },
  { id: 'claypot', cost: { clay: 3, petal: 1 }, builds: 'claypot', at: 'workbench',
    desc: 'A fired clay pot of glowing flowers, for doorsteps and village greens.' },
);

// banner colours (a click moves to the next one): [hue, saturation, lightness]
G.BANNER_HUES = [[350, 70, 58], [40, 85, 58], [200, 65, 56], [130, 50, 46], [280, 50, 60], [18, 80, 56], [170, 55, 48], [0, 0, 92]];

// a name the signpost suggests: a word for the land + a word for the spot (picked by place, so it never changes)
G.SIGN_WORDS = {
  first: {
    sand: ['Pebble', 'Shell', 'Driftwood', 'Sandy', 'Heron', 'Clay'],
    water: ['Heron', 'Ripple', 'Otter', 'Willow', 'Reed', 'Clay'],
    grass: ['Clover', 'Meadow', 'Larkspur', 'Daisy', 'Windy', 'Honey', 'Thistle', 'Hazel'],
    forest: ['Mossy', 'Fern', 'Oak', 'Owl', 'Bramble', 'Elder', 'Hollow'],
    stone: ['High', 'Flint', 'Cloud', 'Eagle', 'Grey', 'Crystal'],
    mushwood: ['Glowcap', 'Velvet', 'Moonmoss', 'Spore', 'Toadstool'],
  },
  last: {
    sand: ['Shore', 'Strand', 'Cove', 'Landing', 'Spit'],
    water: ['Ford', 'Crossing', 'Stepping', 'Pool', 'Bend'],
    grass: ['Green', 'Corner', 'Rise', 'Field', 'Hill', 'Lea', 'End'],
    forest: ['Bend', 'Glade', 'Dell', 'Hollow', 'Path', 'Thicket'],
    stone: ['Ridge', 'Crag', 'Tor', 'Lookout', 'Fell'],
    mushwood: ['Hollow', 'Ring', 'Dell', 'Grotto'],
  },
};

G.RIVER_SAYS = {
  clayFirst: 'Soft, cool clay! It forms where shallow water meets the shore. Clay makes stepping stones and signposts.',
  stepFirst: 'Stepping stones! Lay a line of them across shallow water to hop from bank to bank. (Deep water still needs a bridge.)',
  signAsk: 'What is this place called?',
  signSet: ['The signpost reads “{name}”.', 'From now on, this place is {name}.', '{name} — a lovely name.'],
  signRead: 'The signpost reads “{name}”. Click it to give it a new name.',
  signOnMap: 'Signposts show on your map, and lights near one take its name on the lantern roads.',
  bannerFirst: 'Your banner dances in the wind! Click it to change its colour.',
  bannerColour: ['Fresh colours!', 'It flaps happily.', 'A brighter flag.'],
  clayHintFar: 'Reddish clay lies about {d} steps {dir} of you, where shallow water meets the shore.',
  clayHintNear: 'Right here! The reddish mounds by the water are clay — press E beside one.',
  clayHintNone: 'Clay forms where shallow water meets a beach or a meadow. Follow a shore.',
};

// a light near a signpost is called "Lantern at Mossy Bend" on the lantern roads
G.TRAVEL_PLACES.sign = 'at {name}';
