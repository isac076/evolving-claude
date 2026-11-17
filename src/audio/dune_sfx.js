// The sounds of the Amber Dunes (Night 25), added to G.SFX: digging sunstones,
// scooping fine sand, picking at a cactus, coming upon the dunes, finding the
// oasis and a falling star. Also the dunes' instrument, a warm plucked oud
// (G.INSTRUMENTS.oud — the ground picks it, see G.MUSIC_PLACES.dune).
window.G = window.G || {};

G.SFX.sunstone = function (S, o) {   // a soft dig in the sand and a warm, low glowing bell
  S.noise({ filter: 'lowpass', freq: 1400, freqTo: 600, attack: 0.02, dur: 0.16, gain: 0.12, pan: o.pan, rev: 0.05 });
  const i = Math.floor(Math.random() * 4);
  S.bell(G.note(i, 4), { gain: 0.06, dur: 1.6, t: 0.06, pan: o.pan, rev: 0.55 });
  S.tone(G.note(i + 4, 4), { type: 'triangle', gain: 0.025, dur: 1.1, t: 0.12, attack: 0.02, pan: o.pan, rev: 0.5 });
};
G.SFX.sand = function (S, o) {   // a long soft pour of sand
  S.noise({ filter: 'highpass', freq: 2400, attack: 0.05, dur: 0.38, gain: 0.07, pan: o.pan, rev: 0.08 });
  S.noise({ filter: 'bandpass', freq: 900, q: 0.8, attack: 0.03, dur: 0.22, gain: 0.08, t: 0.05, pan: o.pan, rev: 0.05 });
};
G.SFX.cactus = function (S, o) {   // a careful pluck: a dry tick and a short, springy twang
  S.noise({ filter: 'bandpass', freq: 3000, q: 3, dur: 0.03, gain: 0.12, pan: o.pan });
  S.tone(G.note(2, 4), { type: 'triangle', glide: G.note(0, 4), dur: 0.22, gain: 0.08, pan: o.pan, rev: 0.2 });
};
G.SFX.dunes = function (S) {   // you come upon the dunes: a warm breath of wind and a slow rising phrase on the oud
  S.noise({ filter: 'bandpass', freq: 500, freqTo: 1100, q: 0.9, attack: 0.7, dur: 2.4, gain: 0.05, rev: 0.5 });
  S.tone(G.note(0, 2), { type: 'sine', attack: 0.6, dur: 3.2, gain: 0.05, rev: 0.6 });
  [0, 1, 2, 4, 3, 5].forEach((n, k) => G.INSTRUMENTS.oud(S, G.note(n, 4), { gain: 0.05, t: 0.25 + k * 0.22 + (k > 3 ? 0.15 : 0), pan: -0.4 + k * 0.16, bus: S.sfxBus }));
};
G.SFX.oasis = function (S) {   // the oasis: a cool trickle of water and a soft open chord
  for (let i = 0; i < 6; i++) S.tone(G.rand(900, 1500), { type: 'sine', glide: G.rand(1600, 2200), glideTime: 0.06, dur: 0.08, gain: 0.03, t: i * 0.11 + Math.random() * 0.05, rev: 0.6 });
  [0, 2, 4, 7].forEach((n, k) => S.bell(G.note(n, 4), { gain: 0.04, dur: 2.6, t: 0.5 + k * 0.14, pan: -0.45 + k * 0.3, rev: 0.85 }));
};
G.SFX.fallingstar = function (S) {   // a falling star: a high, quick shimmer sliding down, and a soft wish-chime
  S.tone(G.note(4, 6), { type: 'sine', glide: G.note(0, 5), glideTime: 0.9, dur: 1, gain: 0.03, rev: 0.8 });
  S.noise({ filter: 'highpass', freq: 6000, freqTo: 2500, attack: 0.05, dur: 0.9, gain: 0.025, rev: 0.6 });
  [7, 4, 2, 4].forEach((n, k) => S.bell(G.note(n, 5), { gain: 0.03, dur: 1.6, t: 0.7 + k * 0.12, pan: 0.5 - k * 0.3, rev: 0.85 }));
};

// the dunes' tune: a warm, plucked oud — a quick bright attack that slides a hair into tune, and a dry body
G.INSTRUMENTS.oud = function (S, f, o) {
  const g = (o.gain || 0.05) * 1.4, b = { t: o.t, pan: o.pan, bus: o.bus || S.musicBus };
  S.tone(f * 1.012, { ...b, type: 'triangle', glide: f, glideTime: 0.05, dur: Math.min(1.2, 0.5 + (o.dur || 0.4)), attack: 0.003, gain: g, rev: 0.35 });
  S.tone(f * 2, { ...b, type: 'sine', dur: 0.35, attack: 0.002, gain: g * 0.3, rev: 0.3 });
  S.tone(f * 3, { ...b, type: 'sawtooth', dur: 0.06, attack: 0.001, gain: g * 0.05, rev: 0.1 });
};
G.SFX.gecko = function (S, o) {   // a gecko darts off: a tiny double chirp and a skitter in the sand
  S.tone(G.note(7, 6), { type: 'sine', glide: G.note(9, 6), glideTime: 0.03, dur: 0.05, gain: 0.025, pan: o.pan, rev: 0.2 });
  S.tone(G.note(7, 6), { type: 'sine', glide: G.note(9, 6), glideTime: 0.03, dur: 0.05, gain: 0.02, t: 0.08, pan: o.pan, rev: 0.2 });
  S.noise({ filter: 'highpass', freq: 3000, attack: 0.01, dur: 0.15, gain: 0.03, t: 0.02, pan: o.pan });
};
