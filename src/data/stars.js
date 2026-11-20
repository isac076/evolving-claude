// The Star Chart (Night 26) — milestones, drawn as constellations. Every deed
// worth remembering lights a star; the stars of one kind of deed make a
// constellation (The Lantern, The Wanderer, The Basket…). Light every star of
// one and it is complete: you get stardust, and the first one teaches you the
// Star lantern. The chart is a page of the journal (J → Stars).
// Everything about it is data here; noticing new stars is game/stars.js, the
// journal page is ui/star_chart.js, the Star lantern is drawn in
// render/star_sprites.js and the chimes live in audio/star_sfx.js.
//
// A constellation: id, name, hue, a few words (`about`), and its stars. Each star:
//   id (saved — never rename), name, text (what earns it), at (x, y inside the
//   constellation's own box, 0..1), and value(state) / need: the star lights
//   when value(state) >= need (the chart shows value / need as progress).
// lines = pairs of star indexes joined when both are lit.
window.G = window.G || {};

(function () {
  const S = s => s.stats || {};
  const n = v => !v ? 0 : Array.isArray(v) ? v.length : typeof v === 'object' ? Object.keys(v).length : +v || 0;
  const sum = o => Object.values(o || {}).reduce((a, b) => a + (+b || 0), 0);
  const sea = s => S(s).sea || {}, hush = s => S(s).hush || {}, grown = s => S(s).grown || {};
  const folk = s => (s.villagers ? s.villagers.list : []);

  G.CONSTELLATIONS = [
    { id: 'lantern', name: 'The Lantern', hue: 44, about: 'Lights you have lit in the grey.',
      stars: [
        { id: 'light1', name: 'First light', text: 'Light your first lantern', at: [0.5, 0.1], need: 1, value: s => s.world.litCount() },
        { id: 'light5', name: 'A ring of lights', text: 'Have 5 lights burning', at: [0.26, 0.38], need: 5, value: s => s.world.litCount() },
        { id: 'beacon', name: 'Beacon-keeper', text: 'Raise a Crystal Beacon', at: [0.74, 0.38], need: 1, value: s => s.world.count('beacon') },
        { id: 'light12', name: 'Lamplighter', text: 'Have 12 lights burning', at: [0.32, 0.88], need: 12, value: s => s.world.litCount() },
        { id: 'light30', name: 'A sky of lanterns', text: 'Have 30 lights burning', at: [0.68, 0.88], need: 30, value: s => s.world.litCount() },
      ],
      lines: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4], [1, 2]] },

    { id: 'wanderer', name: 'The Wanderer', hue: 140, about: 'How far your feet and your wings have carried you.',
      stars: [
        { id: 'explore1', name: 'Footloose', text: 'Fill in 2,000 tiles of your map', at: [0.42, 0.08], need: 2000, value: s => s.explored.count },
        { id: 'explore2', name: 'Mapmaker', text: 'Fill in 10,000 tiles of your map', at: [0.38, 0.4], need: 10000, value: s => s.explored.count },
        { id: 'ruins5', name: 'Old stones', text: 'Find 5 ruins', at: [0.14, 0.58], need: 5, value: s => S(s).ruinsFound || 0 },
        { id: 'roads', name: 'Roads of light', text: 'Fly the lantern roads 10 times', at: [0.72, 0.3], need: 10, value: s => (S(s).travel && S(s).travel.trips) || 0 },
        { id: 'lands', name: 'Three far lands', text: 'Find a hollow, a snowy peak and the dunes', at: [0.2, 0.92], need: 3,
          value: s => ((S(s).hollow && S(s).hollow.found) ? 1 : 0) + ((S(s).peaks && S(s).peaks.found) ? 1 : 0) + ((S(s).dunes && S(s).dunes.found) ? 1 : 0) },
        { id: 'explore3', name: 'Edge of the map', text: 'Fill in 30,000 tiles of your map', at: [0.6, 0.9], need: 30000, value: s => s.explored.count },
      ],
      lines: [[0, 1], [1, 2], [1, 3], [1, 4], [1, 5]] },

    { id: 'basket', name: 'The Basket', hue: 26, about: 'Things gathered, made and built.',
      stars: [
        { id: 'gather50', name: 'Busy hands', text: 'Gather 50 times', at: [0.5, 0.08], need: 50, value: s => S(s).gathered || 0 },
        { id: 'build25', name: 'Builder', text: 'Build 25 things', at: [0.12, 0.45], need: 25, value: s => S(s).built || 0 },
        { id: 'gather500', name: 'A full basket', text: 'Gather 500 times', at: [0.88, 0.45], need: 500, value: s => S(s).gathered || 0 },
        { id: 'build150', name: 'Master builder', text: 'Build 150 things', at: [0.28, 0.9], need: 150, value: s => S(s).built || 0 },
        { id: 'gather2000', name: 'Bountiful', text: 'Gather 2,000 times', at: [0.72, 0.9], need: 2000, value: s => S(s).gathered || 0 },
      ],
      lines: [[1, 0], [0, 2], [1, 2], [1, 3], [3, 4], [4, 2]] },

    { id: 'flower', name: 'The Flower', hue: 322, about: 'Seeds sown, gardens tended, things grown.',
      stars: [
        { id: 'plant1', name: 'Green thumb', text: 'Plant something', at: [0.5, 0.36], need: 1, value: s => S(s).planted || 0 },
        { id: 'grown10', name: 'In bloom', text: 'Grow 10 plants to full size', at: [0.5, 0.06], need: 10, value: s => sum(grown(s)) },
        { id: 'water30', name: 'Rain-maker', text: 'Water plants 30 times', at: [0.2, 0.32], need: 30, value: s => S(s).watered || 0 },
        { id: 'moonflower', name: 'Moon garden', text: 'Grow a moonflower', at: [0.8, 0.32], need: 1, value: s => grown(s).moonflower || 0 },
        { id: 'plant25', name: 'Seed sower', text: 'Plant 25 times', at: [0.5, 0.66], need: 25, value: s => S(s).planted || 0 },
        { id: 'tree', name: 'Oak from an acorn', text: 'Grow a tree from an acorn', at: [0.36, 0.94], need: 1, value: s => grown(s).tree || 0 },
      ],
      lines: [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [0, 4], [4, 5]] },

    { id: 'hearts', name: 'The Two Hearts', hue: 352, about: 'Friends who came home, and what you did for them.',
      stars: [
        { id: 'friend1', name: 'Not alone', text: 'A friend comes home', at: [0.28, 0.14], need: 1, value: s => folk(s).length },
        { id: 'friends6', name: 'Good company', text: 'Have 6 friends at home', at: [0.72, 0.14], need: 6, value: s => folk(s).length },
        { id: 'wishes5', name: 'Wish-granter', text: 'Make 5 wishes come true', at: [0.08, 0.42], need: 5, value: s => S(s).wishes || 0 },
        { id: 'hamlet', name: 'A place to belong', text: 'Friends\' cottages grow into a hamlet', at: [0.5, 0.38], need: 1,
          value: s => (s.village && s.village.list ? s.village.list.filter(v => v.name).length : 0) },
        { id: 'dearest', name: 'Dearest friend', text: 'A friend with five hearts', at: [0.92, 0.42], need: 5, value: s => Math.max(0, ...folk(s).map(v => v.hearts || 0)) },
        { id: 'festival', name: 'Festival night', text: 'Join a village festival', at: [0.5, 0.92], need: 1, value: s => S(s).festivals || 0 },
      ],
      lines: [[0, 2], [0, 3], [1, 3], [1, 4], [2, 5], [4, 5]] },

    { id: 'key', name: 'The Key', hue: 272, about: 'The story of the Fading, and the fires that ended it.',
      stars: [
        { id: 'memory1', name: 'Whispers', text: 'Wake a memory stone', at: [0.3, 0.1], need: 1, value: s => n(S(s).memories) },
        { id: 'memory6', name: 'Half the story', text: 'Remember 6 memories', at: [0.12, 0.3], need: 6, value: s => n(S(s).memories) },
        { id: 'memoryAll', name: 'The whole story', text: 'Remember every memory', at: [0.48, 0.3], need: () => G.LORE.length, value: s => n(S(s).memories) },
        { id: 'shrine1', name: 'First ember', text: 'Kindle an Ember Shrine', at: [0.56, 0.58], need: 1, value: s => S(s).shrinesLit || 0 },
        { id: 'shrine4', name: 'Four fires', text: 'Kindle all four Ember Shrines', at: [0.74, 0.76], need: 4, value: s => S(s).shrinesLit || 0 },
        { id: 'sun', name: 'Dawn', text: 'Rekindle the Great Sun', at: [0.92, 0.94], need: 1, value: s => (S(s).sun && S(s).sun.lit) ? 1 : 0 },
      ],
      lines: [[0, 1], [0, 2], [1, 2], [2, 3], [3, 4], [4, 5]] },

    { id: 'boat', name: 'The Boat', hue: 196, about: 'Lakes and seas, and what lives in them.',
      stars: [
        { id: 'sail', name: 'Set sail', text: 'Push off in your leaf boat', at: [0.52, 0.06], need: 1, value: s => sea(s).launched || 0 },
        { id: 'deep', name: 'Into the deep', text: 'Sail out over deep water', at: [0.52, 0.52], need: 1, value: s => sea(s).deep || 0 },
        { id: 'shore', name: 'A far shore', text: 'Sail across to a far shore', at: [0.1, 0.66], need: 1, value: s => sea(s).crossed || 0 },
        { id: 'whale', name: 'Whale song', text: 'Meet a whale', at: [0.9, 0.66], need: 1, value: s => (S(s).met && S(s).met.whale) ? 1 : 0 },
        { id: 'sailed', name: 'Old salt', text: 'Sail 600 tiles', at: [0.5, 0.92], need: 600, value: s => sea(s).sailed || 0 },
      ],
      lines: [[0, 1], [0, 2], [1, 2], [2, 4], [4, 3], [3, 1]] },

    { id: 'hare', name: 'The Hare', hue: 96, about: 'Creatures met, and little shadows eased.',
      stars: [
        { id: 'met3', name: 'New neighbours', text: 'Meet 3 kinds of creature', at: [0.22, 0.08], need: 3, value: s => n(S(s).met) },
        { id: 'met8', name: 'Naturalist', text: 'Meet 8 kinds of creature', at: [0.4, 0.1], need: 8, value: s => n(S(s).met) },
        { id: 'hush1', name: 'Gentle light', text: 'Ease a hushling', at: [0.36, 0.48], need: 1, value: s => hush(s).eased || 0 },
        { id: 'metAll', name: 'Every creature', text: 'Meet every kind of creature', at: [0.78, 0.66], need: () => Object.keys(G.CREATURES).length,
          value: s => Object.keys(G.CREATURES).filter(k => (S(s).met || {})[k]).length },
        { id: 'hush25', name: 'Keeper of starlight', text: 'Ease 25 hushlings', at: [0.42, 0.9], need: 25, value: s => hush(s).eased || 0 },
      ],
      lines: [[0, 2], [1, 2], [2, 3], [2, 4], [4, 3]] },

    { id: 'owl', name: 'The Owl', hue: 222, about: 'Skies and seasons watched over.',
      stars: [
        { id: 'rainbow', name: 'After the rain', text: 'See a rainbow', at: [0.26, 0.12], need: 1, value: s => S(s).rainbows || 0 },
        { id: 'falling', name: 'Make a wish', text: 'See a falling star over the dunes', at: [0.74, 0.12], need: 1, value: s => (S(s).dunes && S(s).dunes.stars) || 0 },
        { id: 'weathers', name: 'Every sky', text: 'See every kind of weather', at: [0.5, 0.36], need: 5,
          value: s => ['breezy', 'overcast', 'drizzle', 'rain', 'fog'].filter(k => (S(s).weatherSeen || {})[k] || (S(s).weatherSeen || {})[k + '-snow']).length },
        { id: 'year', name: 'A whole year', text: 'See all four seasons', at: [0.2, 0.66], need: 4, value: s => n(S(s).seasons && S(s).seasons.seen) },
        { id: 'aurora', name: 'Northern lights', text: 'See the northern lights over the peaks', at: [0.8, 0.66], need: 1, value: s => (S(s).peaks && S(s).peaks.aurora) || 0 },
        { id: 'days30', name: 'Thirty days', text: 'Live thirty days in your world', at: [0.5, 0.94], need: 30, value: s => Math.floor(s.time / G.DAY_LENGTH) + 1 },
      ],
      lines: [[0, 2], [1, 2], [2, 3], [2, 4], [3, 5], [4, 5]] },
  ];

  // stardust: given when a constellation is complete; it makes the Star lantern
  G.ITEMS.stardust = { name: 'Stardust', color: '#cfd8ff' };

  // a slim post holding a slowly turning glass star; its light drifts through every colour
  G.STRUCTURES.starlantern = { name: 'Star lantern', solid: true, on: 'land', restore: 7, light: 240, lightHue: 248,
    sound: 'starlantern', homes: 2, map: [248, 70, 84], travel: true };
  G.RECIPES.push({ id: 'starlantern', cost: { stardust: 2, crystal: 1, wood: 2 }, builds: 'starlantern', unlock: 'starlantern',
    desc: 'A glass star on a slender post, full of stardust. Its light slowly drifts through every colour of the sky.' });
  G.TRAVEL_STOPS.starlantern = { name: 'Star lantern {place}', hue: 248 };

  G.STAR_CHART = {
    every: 1,                                 // seconds between looks at your deeds
    gift: { stardust: 3 },                    // for every complete constellation
    teach: 'starlantern',                     // the first complete constellation teaches this recipe
    banner: 4.2,                              // seconds a new star's banner stays
    merge: 3,                                 // this many stars at once share one banner (Night 28)
  };

  G.STARS_SAYS = {
    first: 'A star lit up in your Star Chart! Every deed worth remembering lights one. Open the journal (J) and look at the Stars page.',
    old: n => `Your Star Chart remembers ${n} star${n === 1 ? '' : 's'} from your journey so far — open the journal (J) and look at the Stars page.`,
    done: c => `${c.name} is complete! Its stars shine together now. You gather stardust from it.`,
    teach: 'The finished constellation shows you how to hold a star: you can now build a Star lantern (C).',
    note: (lit, all, done) => `${lit} of ${all} stars lit · ${done} constellation${done === 1 ? '' : 's'} complete. Tap a constellation to read its stars.`,
    empty: 'No stars yet. Light a lantern, meet a creature, plant a seed — every deed worth remembering lights a star here.',
  };

  // ---- goals: a chapter at the very end ----
  const lit = s => Object.keys(S(s).chart || {}).length;
  G.GOALS.push(
    { id: 'chart', chapter: 'The star chart', text: 'Look at your Star Chart', target: 1,
      progress: s => S(s).chartOpened || 0, hint: 'Open the journal (J) and turn to the Stars page.' },
    { id: 'stars15', chapter: 'The star chart', text: 'Light 15 stars', target: 15,
      progress: s => lit(s), hint: 'The Stars page shows what lights each one.', reward: { petal: 3 } },
    { id: 'constellation', chapter: 'The star chart', text: 'Complete a constellation', target: 1,
      progress: s => G.CONSTELLATIONS.filter(c => c.stars.every(st => (S(s).chart || {})[st.id])).length,
      hint: 'Pick the one closest to done on the Stars page.', reward: { crystal: 1 } },
    { id: 'starlantern', chapter: 'The star chart', text: 'Raise a Star lantern', target: 1,
      progress: s => s.world.count('starlantern'), hint: 'Stardust from a finished constellation, a crystal and wood (C).' },
  );
})();
