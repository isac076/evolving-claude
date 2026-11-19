// The sounds of the Far Isles (Night 27), added to G.SFX: picking up seashells,
// dipping into a tide pool, breaking off a sprig of coral, coming upon an island,
// the glowing tide, a shell chime in the wind, a hermit crab, a turtle's breath
// and a parrot's chatter. Also the isles' instrument, a bright steel drum
// (G.INSTRUMENTS.steeldrum — the ground picks it, see G.MUSIC_PLACES.isle).
window.G = window.G || {};

G.SFX.shell = function (S, o) {   // two shells clacking together, and a little bright tink
  S.noise({ filter: 'bandpass', freq: 3200, q: 4, dur: 0.03, gain: 0.1, pan: o.pan });
  S.noise({ filter: 'bandpass', freq: 2600, q: 4, dur: 0.03, gain: 0.08, t: 0.07, pan: o.pan });
  S.bell(G.note(2 + Math.floor(Math.random() * 3), 6), { gain: 0.035, dur: 0.7, t: 0.09, pan: o.pan, rev: 0.4 });
};
G.SFX.tidepool = function (S, o) {   // a hand dipped into still water: a plip and a drip
  S.tone(G.rand(700, 900), { type: 'sine', glide: G.rand(1300, 1600), glideTime: 0.05, dur: 0.07, gain: 0.06, pan: o.pan, rev: 0.4 });
  S.tone(G.rand(1100, 1300), { type: 'sine', glide: 1900, glideTime: 0.04, dur: 0.05, gain: 0.035, t: 0.22, pan: o.pan, rev: 0.5 });
  S.noise({ filter: 'highpass', freq: 3500, attack: 0.02, dur: 0.12, gain: 0.03, pan: o.pan });
};
G.SFX.coral = function (S, o) {   // a glassy snap under the water, and bubbles rising
  S.noise({ filter: 'bandpass', freq: 1800, q: 6, dur: 0.04, gain: 0.08, pan: o.pan, rev: 0.2 });
  for (let i = 0; i < 4; i++) S.tone(G.rand(500, 800) + i * 120, { type: 'sine', glide: G.rand(1100, 1500) + i * 150, glideTime: 0.05, dur: 0.06, gain: 0.025, t: 0.08 + i * 0.07, pan: o.pan, rev: 0.5 });
  S.bell(G.note(4, 5), { gain: 0.03, dur: 1.2, t: 0.1, pan: o.pan, rev: 0.6 });
};
G.SFX.isles = function (S) {   // you come upon an island: a wave rolling up the sand and a sunny phrase on the steel drum
  S.noise({ filter: 'lowpass', freq: 700, freqTo: 1800, attack: 0.8, dur: 2.2, gain: 0.07, rev: 0.5 });
  S.noise({ filter: 'highpass', freq: 3000, attack: 0.5, dur: 1.2, gain: 0.025, t: 0.9, rev: 0.5 });
  [0, 2, 4, 2, 5, 4, 7].forEach((n, k) => G.INSTRUMENTS.steeldrum(S, G.note(n, 4), { gain: 0.05, t: 0.3 + k * 0.17 + (k > 4 ? 0.12 : 0), pan: -0.45 + k * 0.15, bus: S.sfxBus }));
};
G.SFX.glowtide = function (S) {   // the glowing tide: a soft hush of surf and a rising shimmer of tiny lights
  S.noise({ filter: 'lowpass', freq: 600, freqTo: 1400, attack: 0.9, dur: 2.6, gain: 0.05, rev: 0.6 });
  for (let i = 0; i < 9; i++) S.bell(G.note(i, 5), { gain: 0.022, dur: 1.4, t: 0.3 + i * 0.11 + Math.random() * 0.04, pan: -0.7 + i * 0.17, rev: 0.9 });
  [0, 4, 7].forEach((n, k) => S.tone(G.note(n, 3), { type: 'sine', attack: 0.7, dur: 3, gain: 0.03, t: 0.2 + k * 0.1, rev: 0.7 }));
};
G.SFX.chime = function (S, o) {   // a shell chime: three or four small, clinking shells (softer when only the wind moves it)
  const n = 2 + Math.floor(Math.random() * 3), g = o.soft ? 0.02 : 0.035;
  for (let i = 0; i < n; i++) {
    const f = G.note(5 + Math.floor(Math.random() * 6), 5) * G.rand(0.995, 1.005);
    S.tone(f, { type: 'sine', dur: 0.9, attack: 0.002, gain: g, t: i * G.rand(0.09, 0.2), pan: o.pan, rev: 0.6 });
    S.tone(f * 2.76, { type: 'sine', dur: 0.25, attack: 0.001, gain: g * 0.35, t: i * 0.12, pan: o.pan, rev: 0.4 });
  }
};
G.SFX.crab = function (S, o) {   // a hermit crab scuttles off: a quick patter of tiny clicks
  for (let i = 0; i < 6; i++) S.noise({ filter: 'bandpass', freq: G.rand(3500, 5000), q: 8, dur: 0.012, gain: 0.05, t: i * 0.045, pan: o.pan });
};
G.SFX.turtle = function (S, o) {   // a turtle breathes at the surface: a soft puff and a bubble
  S.noise({ filter: 'bandpass', freq: 900, q: 1.2, attack: 0.04, dur: 0.3, gain: 0.05, pan: o.pan, rev: 0.3 });
  S.tone(420, { type: 'sine', glide: 900, glideTime: 0.08, dur: 0.1, gain: 0.03, t: 0.32, pan: o.pan, rev: 0.4 });
};
G.SFX.parrot = function (S, o) {   // parrots take off: a flutter of wings and a cheerful two-note squawk
  S.noise({ filter: 'bandpass', freq: 1500, q: 1, dur: 0.25, gain: 0.05, pan: o.pan });
  S.tone(G.note(4, 5), { type: 'square', glide: G.note(2, 5), glideTime: 0.06, dur: 0.08, gain: 0.012, t: 0.05, pan: o.pan, rev: 0.2 });
  S.tone(G.note(7, 5), { type: 'square', glide: G.note(5, 5), glideTime: 0.06, dur: 0.09, gain: 0.012, t: 0.16, pan: o.pan, rev: 0.2 });
};

// the isles' tune: a steel drum — a round, ringing note with its bright, slightly out-of-tune upper partials
G.INSTRUMENTS.steeldrum = function (S, f, o) {
  const g = (o.gain || 0.05) * 1.3, b = { t: o.t, pan: o.pan, bus: o.bus || S.musicBus }, d = Math.min(1.6, 0.7 + (o.dur || 0.4));
  S.tone(f, { ...b, type: 'sine', dur: d, attack: 0.004, gain: g, rev: 0.4 });
  S.tone(f * 2, { ...b, type: 'sine', dur: d * 0.7, attack: 0.003, gain: g * 0.55, rev: 0.4 });
  S.tone(f * 3.02, { ...b, type: 'sine', dur: d * 0.35, attack: 0.002, gain: g * 0.22, rev: 0.3 });
  S.tone(f * 4.2, { ...b, type: 'triangle', dur: 0.08, attack: 0.001, gain: g * 0.12, rev: 0.2 });
};
