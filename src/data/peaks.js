// The Snowy Peaks (Night 22) — the second new biome: the tops of the highest
// highlands lie under deep snow all year. Snowy firs, glittering ice spires,
// snowdrifts and little snowbells; snow foxes pounce in the drifts, and on
// clear nights the northern lights ripple over the peaks. Everything about them
// is data here; where they are is world/peaks.js, finding them is
// game/peak_play.js, drawing is render/peak_sprites.js, the air (flurries,
// glinting frost, the northern lights) is render/peak_fx.js, and the sounds
// are audio/peak_sfx.js.
window.G = window.G || {};

G.PEAKS = {
  at: 0.74,          // elevation above this is snow (highland starts at 0.68)
  wobble: 0.05,      // a slow noise moves the snow line up and down, so it isn't a contour line
  keepAway: 45,      // tiles around the start that never become snowy peaks
  first: { dist: 88, radius: 26, top: 0.84, apart: 50 },   // one peak always rises a walk from the start (apart = from the first hollow)
  cell: 110,         // tiles: snowfields in different cells of this size count as different places
  flakes: 70,        // most snowflakes drifting over the peaks at once
  glints: 26,        // most sparkles of frost in the air at once
  aurora: { fade: 0.4, ribbons: 3 },   // the northern lights: how fast they come and go, how many curtains
};

// the ground of the peaks: snow all year (rank 6 — it curves over the highland around it)
G.TILES.frost = { name: 'Snowfield', h: 210, s: 34, l: 87, step: 'snow', rank: 6, snowy: true };
G.SNOW.cover.frost = 0;   // already white: winter changes nothing up here
// the peaks barely notice the seasons — a little bluer and thinner in summer
const PEAK_GROUND = { spring: [0, 0, 0], summer: [-4, 6, -4], autumn: [-2, 2, -1], winter: [2, -4, 2] };
for (const s of G.SEASONS) s.ground.frost = PEAK_GROUND[s.id];

G.ITEMS.ice = { name: 'Ice shards', color: '#bfeaff' };
G.ITEMS.snow = { name: 'Snow', color: '#eef4ff' };

// natural things of the peaks (see G.OBJECTS in content.js for the fields)
G.OBJECTS.firpine = { name: 'Snowy fir', solid: true, drops: { wood: 2 }, regrow: 360, sound: 'wood', tool: 'axe', bonus: { wood: 1 } };
G.OBJECTS.snowdrift = { name: 'Snowdrift', solid: false, drops: { snow: 2 }, regrow: 90, sound: 'snowball' };
G.OBJECTS.icespire = { name: 'Ice spire', solid: true, drops: { ice: 1 }, regrow: 520, light: 40, glowHue: 186, sound: 'ice',
  tool: 'pick', bonus: { ice: 1 }, chance: { crystal: 0.25 } };
G.OBJECTS.snowbell = { name: 'Snowbells', solid: false, drops: { petal: 1 }, regrow: 220, light: 28, glowHue: 200, sound: 'snowbell',
  chance: { seed: 0.3 } };
// what grows where on a snowfield, by the tile's object roll (0..1)
G.PEAK_OBJECTS = [[0.055, 'firpine'], [0.115, 'snowdrift'], [0.94, null], [0.962, 'snowbell'], [1, 'icespire']];

// lightHue = the colour of its light at night (and on the map)
G.STRUCTURES.icelantern = { name: 'Ice lantern', solid: true, on: 'land', restore: 7, light: 250, lightHue: 192, sound: 'ice',
  homes: 2, map: [192, 70, 82] };
G.STRUCTURES.snowspirit = { name: 'Snow spirit', solid: true, on: 'land', sound: 'snowball', map: [210, 30, 92] };

G.RECIPES.push(
  { id: 'icelantern', cost: { ice: 3, stone: 2, petal: 1 }, builds: 'icelantern',
    desc: 'A lantern carved from clear ice, with a cold blue flame inside. Its light restores a wider land than a lantern.' },
  { id: 'snowspirit', cost: { snow: 3, wood: 1 }, builds: 'snowspirit',
    desc: 'A round little snow friend with twig arms and a knitted scarf. It never melts — it is far too happy.' },
);

G.CREATURES.fox = {
  name: 'Snow fox', move: 'hop', tiles: ['frost', 'stone'], when: 'any', restore: 0.5,
  cap: 3, group: [1, 2], flee: 88, hues: [24, 210, 210],
  meet: 'A snow fox! It listens to the snow, then pounces nose-first into a drift.',
};
G.CREATURES.moth.tiles.push('frost');

G.MUSIC_PLACES.frost = { place: 'peaks', inst: 'chime' };
G.TRAVEL_STOPS.icelantern = { name: 'Ice lantern {place}', hue: 192 };
G.STRUCTURES.icelantern.travel = true;
G.TRAVEL_PLACES.frost = 'on the peaks';

// what each snowfield is called (picked by its place, so it never changes)
G.PEAK_NAMES = ['Frostcrown Peak', 'Whitewind Heights', 'Starfall Summit', 'Hushsnow Fells', 'Glimmerice Peak', 'Silverdrift Crags',
  'Moonfrost Heights', 'Cloudrest Summit', 'Bellsnow Peak', 'Aurora Fells'];

// a chapter of goals, after "Riverbanks & waymarks"
(function () {
  const P = s => s.stats.peaks || {};
  const goals = [
    { id: 'peakfind', chapter: 'The snowy peaks', text: 'Climb to the snowy peaks', target: 1,
      progress: s => P(s).found || 0, hint: s => G.PeakPlay.hint(s) },
    { id: 'ice', chapter: 'The snowy peaks', text: 'Gather ice shards', target: 3,
      progress: s => s.stats.got.ice || 0, hint: 'Ice spires glitter on the snowfields (E). A pick breaks off more.', reward: { stone: 2 } },
    { id: 'icelantern', chapter: 'The snowy peaks', text: 'Light an Ice lantern', target: 1,
      progress: s => s.world.count('icelantern'),
      hint: 'Craft it (C) from ice, stone and a glow petal — snowbells give petals too.', reward: { ice: 2, petal: 2 } },
    { id: 'snowspirit', chapter: 'The snowy peaks', text: 'Build a Snow spirit', target: 1,
      progress: s => s.world.count('snowspirit'),
      hint: 'Snowdrifts give snow (E). Three snow and a stick of wood make a little snow friend.', reward: { seed: 2 } },
    { id: 'fox', chapter: 'The snowy peaks', text: 'Meet a snow fox', target: 1,
      progress: s => (s.stats.met && s.stats.met.fox) || 0,
      hint: 'Foxes come back where the peaks have their colour again. They are shy — walk slowly.', reward: { wood: 3 } },
    { id: 'aurora', chapter: 'The snowy peaks', text: 'See the northern lights', target: 1,
      progress: s => P(s).aurora || 0,
      hint: 'On a clear night, stand on the snowfields and wait. They shine brightest where the colour is back.', reward: { crystal: 2, ice: 2 } },
  ];
  let at = -1;
  G.GOALS.forEach((g, i) => { if (g.chapter === 'Riverbanks & waymarks') at = i + 1; });
  G.GOALS.splice(at < 0 ? G.GOALS.length : at, 0, ...goals);
})();

G.PEAK_SAYS = {
  first: 'Snow! Up here the highlands wear deep snow all year. Ice spires glitter (E) — ice makes an Ice lantern — and drifts give snow for a snow friend.',
  again: 'Another snowy peak.',
  sub: 'where the snow never melts',
  about: 'Deep snow all year, snowy firs and ice spires. On clear nights the northern lights ripple overhead.',
  hintFar: 'Snowy peaks rise about {d} steps {dir} of you.',
  hintNear: 'You are close — the highland turns white where the peaks begin.',
  aurora: 'The northern lights! Up on the peaks the sky still remembers its colours.',
  auroraGrey: 'Pale ribbons of light ripple over the peaks. Bring colour back up here and they will shine brighter.',
};
