// The hush of night (Night 19) — hushlings: small, soft shadows left over from
// the Fading. On dark nights out in the grey they drift toward your light and
// sip at it, so your glow grows small. They are never fought: lead them into a
// lantern's light (or Shine, F) and they remember what light was — they turn
// into a mote of starlight. Everything about them is data here; how they move is
// world/hush.js, drawing is render/hush_sprites.js, sounds are audio/hush_sfx.js.
window.G = window.G || {};

G.HUSH = {
  minLit: 2,          // lanterns you must have lit before any hushling comes looking
  dark: 0.55,         // how dark the night must be (1 - daylight)
  greyAt: 0.35,       // they only come while you stand in land this grey (restoration below this)
  spawnGrey: 0.22,    // … and only out of land at least this grey
  spawnEvery: 0.7,    // seconds between tries
  cap: 4,             // most at once (fewer where there is some colour)
  dist: [7, 10],      // tiles from you where they rise out of the dark
  speed: 34,          // px per second (the spirit walks at 150 — you can always outrun them)
  clingAt: 34,        // px: closer than this and one holds on
  clingMax: 3,        // most that can hold on at once
  orbit: 27,          // px: how far from the spirit a clinging one circles
  drain: 0.045,       // glow sipped per second by each clinging one
  minGlow: 0.22,      // your light never goes out: at this the hushlings are full and drift off
  warm: 0.32,         // they will not drift into land brighter than this on their own
  easeAt: 0.45,       // in light brighter than this a hushling slowly eases…
  easeTime: 1.3,      // … taking this long in full light
  refill: { light: 0.35, day: 0.1, grey: 0.012 },   // glow back per second: by a light / by day / out in the grey
  shine: { cost: 0.1, cooldown: 2.5, radius: 140, ease: 0.7, push: 160, grow: 0.45 },
  charm: { drain: 0.5, radius: 1.35, ease: 1 },      // the Starlit charm: half the sipping, a wider and stronger Shine
  calm: 10,           // tiles around a Moon lantern where no hushling can stay
  rest: 30,           // seconds of peace after they drift off full
  leave: 24,          // tiles: further than this and they give up
  whisper: [3, 6],    // seconds between their soft sighs while one is close
  unlockCharm: 3,     // ease this many and you learn the Starlit charm
};

G.ITEMS.starlight = { name: 'Starlight', color: '#e4e8ff' };
G.ITEMS.charm = { name: 'Starlit charm', color: '#cfd8ff', tool: true };

// a pale lantern with a crescent moon: hushlings cannot stay near it (calm = tiles)
G.STRUCTURES.moonlantern = { name: 'Moon lantern', solid: true, on: 'land', restore: 6, light: 250, lightHue: 222,
  sound: 'moonlantern', homes: 2, calm: G.HUSH.calm, map: [222, 55, 82], travel: true };

G.RECIPES.push(
  { id: 'moonlantern', cost: { starlight: 3, stone: 2, wood: 2 }, builds: 'moonlantern', unlock: 'moonlantern',
    desc: 'A pale lantern holding a little starlight. Its quiet light keeps the hushlings far away at night.' },
  { id: 'charm', cost: { starlight: 4, crystal: 1, fibre: 2 }, makes: 'charm', at: 'workbench', unlock: 'charm',
    desc: 'Starlight woven on a crystal. Hushlings sip half as much of your light, and your Shine reaches further.' },
);

G.TRAVEL_STOPS.moonlantern = { name: 'Moon lantern {place}', hue: 222 };

// ---- goals: a chapter after the riverbanks ----
(function () {
  const H = s => s.stats.hush || {};
  const goals = [
    { id: 'hushmeet', chapter: 'The hush of night', text: 'Meet a hushling', target: 1,
      progress: s => H(s).met ? 1 : 0,
      hint: 'On a dark night, walk out into the grey, away from your lanterns. Something small will come looking for your light.' },
    { id: 'hushease', chapter: 'The hush of night', text: 'Ease a hushling with light', target: 1,
      progress: s => H(s).eased || 0,
      hint: 'Let one hold on, then walk back into a lantern\'s light — or press F (Shine) twice while it is close.',
      reward: { petal: 2 } },
    { id: 'moonlantern', chapter: 'The hush of night', text: 'Light a Moon lantern', target: 1,
      progress: s => s.world.count('moonlantern'),
      hint: 'Eased hushlings leave starlight. Three of them make a Moon lantern (C).', reward: { stone: 3 } },
    { id: 'hush5', chapter: 'The hush of night', text: 'Ease 5 hushlings', target: 5,
      progress: s => H(s).eased || 0,
      hint: 'They gather at the edges of your lights on dark nights. A Shine eases those close to you.', reward: { crystal: 1 } },
    { id: 'charm', chapter: 'The hush of night', text: 'Weave a Starlit charm', target: 1,
      progress: s => s.inv.charm ? 1 : 0,
      hint: 'At a workbench: four starlight, a crystal and some fibre.', reward: { starlight: 2 } },
  ];
  const at = G.GOALS.findIndex(g => g.chapter === 'Echoes of the old world');
  G.GOALS.splice(at < 0 ? G.GOALS.length : at, 0, ...goals);
})();

G.HUSH_SAYS = {
  meet: 'A hushling — a little shadow left over from the Fading. It longs for light and will sip at yours. Lead it into a lantern\'s light, or press F to Shine.',
  meetTouch: 'A hushling — a little shadow left over from the Fading. It longs for light and will sip at yours. Lead it into a lantern\'s light, or tap Shine.',
  firstEase: 'The hushling remembers what light was… and becomes a mote of starlight! Gather three and you can make a Moon lantern (C).',
  ease: ['The hushling sighs and turns to starlight.', 'Light again — it drifts up as a mote of starlight.', 'A soft shimmer, and the shadow is starlight.'],
  dim: 'Your light has grown very small. The hushlings are full and drift away — rest by a lantern and your glow comes back.',
  low: 'Your light is getting small… head for a lantern, or Shine (F).',
  charm: 'You have eased {n} hushlings. Their starlight could be woven into a charm — find the Starlit charm at a workbench.',
  moonFirst: 'A Moon lantern! Its quiet light keeps the hushlings away — no little shadow can stay within ten steps of it.',
  shineLow: 'Your light is too small to Shine. Rest in a lantern\'s light first.',
  card: 'They were never anything but small and cold and lonely — the last of the Fading, looking for a light to hold on to.',
  journal: 'Small shadows of the Fading that drift out of the grey on dark nights, longing for light. Lead them into a lantern\'s glow and they turn to starlight.',
  journalHint: 'Comes out of the grey on the darkest nights.',
};
