// The lost spirits and the friends they become once you lead them home.
// Everything a villager says, likes and gives lives here, so adding a new
// kind of villager is just a new entry in G.VILLAGER_KINDS (plus, if you like,
// a hat in render/villager_sprites.js).
//
// likes    = a structure type they love to visit by day (they walk over to it)
// doing    = what they do there (the activity animation in villager_sprites.js:
//            'tend', 'tinker', 'sit', 'stroll', 'hum')
// hat      = the little hat they wear
// gift     = what they give you the first time you talk to them each day
// lines    = things they like to say (one is picked at random)
// wish     = a hint about what they love, said when there's none nearby yet
window.G = window.G || {};

G.SPIRITS = {
  chance: 0.085,       // chance that a 16×16 chunk of the world has a lost spirit in it
  touch: 40,           // px: how close you must come for a lost spirit to take your light
  settle: 0.72,        // how coloured the land must be for a follower to find a home
  maxFollow: 3,        // how many spirits can follow you at once
  wander: 3.5,         // tiles: how far a villager strolls from its home light
  visit: 10,           // tiles: how far from home a villager will walk to a thing it loves
  greet: 62,           // px: villagers say hello when you come this close
};

G.VILLAGER_NAMES = [
  'Bramble', 'Wren', 'Moss', 'Pip', 'Juniper', 'Fennel', 'Tansy', 'Quill', 'Hazel', 'Rook',
  'Clover', 'Sorrel', 'Puck', 'Linnet', 'Marigold', 'Thistle', 'Nettle', 'Ember', 'Sage', 'Tumble',
  'Willow', 'Dew', 'Mallow', 'Burdock', 'Pebble', 'Finch', 'Rowan', 'Teasel', 'Briony', 'Oak',
  'Lark', 'Myrtle', 'Kestrel', 'Poppy', 'Cobble', 'Sprig', 'Yarrow', 'Bryn', 'Alder', 'Tuppence',
];

G.VILLAGER_KINDS = {
  gardener: {
    likes: 'flowerbed', doing: 'tend', hat: 'leaf', gift: { petal: 1, seed: 2 }, hues: [330, 350, 300, 20],
    wish: 'If only there were a flower bed nearby. I could tend it every morning!',
    lines: ['The flowers hum when you walk past. Did you notice?', 'Petals remember the sun, you know.',
      'I planted a wish under that bloom. Don\'t tell anyone.', 'Everything grows back, if someone is patient with it.',
      'Seeds sleep in the grey. Plant them where the colour is, and water them — they wake right up!',
      'Have you found a moonflower yet? They only open for the night.'],
    visit: 'is tending the flowers',
  },
  tinkerer: {
    likes: 'workbench', doing: 'tinker', hat: 'cap', gift: { stone: 2, wood: 1 }, hues: [28, 40, 15, 200],
    wish: 'My hands are itching for a workbench. Have you built one?',
    lines: ['Tap, tap, tap! That\'s the sound of things getting better.', 'A good fence is a fence that joins up. Very satisfying.',
      'I found these lying about. Use them well!', 'Crystals hum if you hold them close to your ear.'],
    visit: 'is busy at the workbench',
  },
  dreamer: {
    likes: 'bench', doing: 'sit', hat: 'star', gift: { petal: 1, fibre: 1 }, hues: [250, 220, 270, 190],
    wish: 'I would love a bench to sit on and watch the clouds go by.',
    lines: ['Some nights I count the lanterns instead of the stars.', 'The grey was so quiet. I like the quiet now, but a different kind.',
      'Do you think the world dreams too?', 'When the fog rolls in, your lantern looks like a little moon.'],
    visit: 'is resting on the bench',
  },
  wanderer: {
    likes: 'path', doing: 'stroll', hat: 'hood', gift: { fibre: 2 }, hues: [100, 140, 80, 170],
    wish: 'A stone path would be lovely. My feet like to know where they\'re going.',
    lines: ['I walked a long way in the grey before you found me.', 'Paths are just promises made of stone.',
      'There\'s more out there. There\'s always more out there.', 'Bridges are my favourite. Half land, half adventure.'],
    visit: 'is out for a stroll',
  },
  singer: {
    likes: 'lantern', doing: 'hum', hat: 'bow', gift: { petal: 1, wood: 2 }, hues: [48, 60, 190, 10],
    wish: 'I sing best by a lantern. Their light holds the tune.',
    lines: ['La la laa… the lanterns know all the words.', 'The rain plays the drums and I play everything else.',
      'Every light you kindle adds a note to the song.', 'Hum with me? Nobody\'s listening. Well, the rabbits.'],
    visit: 'is singing by the lantern',
  },
};

// Things anyone might say, depending on the moment.
G.VILLAGER_SAYS = {
  lost: ['…is someone there?', 'It\'s so grey…', 'I can\'t remember the colours…', 'So cold…'],
  found: ['Oh! A light! May I come with you?', 'You\'re warm… please, don\'t leave me here.', 'A lantern spirit! I knew one would come.'],
  follow: ['Is it much further?', 'I can almost see colours again…', 'Thank you for waiting for me.', 'Is that green? Is THAT green?!'],
  full: ['This light already has a full home… could we find another?'],
  settle: ['Home! It\'s… it\'s so bright!', 'I remember now. This is what colour feels like.', 'I think I\'ll stay right here, forever.'],
  sleep: ['Zzz…', 'Zzz… mm… lanterns…', 'Zzz… zz…'],
  rain: ['Rain on the roof of the world! Listen!', 'The frogs are having a party.', 'Wet feet, happy heart.',
    'The rain is watering every garden at once. Clever rain.'],
  fog: ['Mind your step — the fog hides everything but your glow.', 'Fog is just a cloud that came to visit.'],
  night: ['Goodnight, little light.', 'Shouldn\'t you be sleeping too?'],
  morning: ['Good morning! The colours look new every day.', 'Morning! Did you sleep? Do spirits sleep?'],
  rainbow: ['A RAINBOW! Did you see it?!'],
  friends: ['It\'s nice not being the only one any more.', 'We should have a festival one day. With music!'],
  heard: ['I heard someone crying, far to the {dir}.', 'Someone is lost out in the grey, {dir} of here. Will you find them?',
    'I dreamt of a pale little light to the {dir}. Someone is waiting there.'],
  gift: ['Here — I saved these for you.', 'A little something, for all your kindness.', 'Take these! I have plenty.'],
};
