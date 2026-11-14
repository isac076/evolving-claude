// The sounds of the Snowy Peaks (Night 22), added to G.SFX: breaking off ice,
// scooping snow, ringing snowbells, coming upon a peak, and the northern lights.
window.G = window.G || {};

G.SFX.ice = function (S, o) {   // a crisp crack and a cold, glassy ring
  S.noise({ filter: 'highpass', freq: 3500, attack: 0.002, dur: 0.05, gain: 0.12, pan: o.pan, rev: 0.2 });
  const i = Math.floor(Math.random() * 5);
  S.bell(G.note(i, 6), { gain: 0.05, dur: 1.4, t: 0.02, pan: o.pan, rev: 0.6 });
  S.bell(G.note(i + 2, 6), { gain: 0.035, dur: 1.6, t: 0.09, pan: o.pan, rev: 0.6 });
};
G.SFX.snowball = function (S, o) {   // a soft scoop and pat of snow
  S.noise({ filter: 'lowpass', freq: 900, freqTo: 400, attack: 0.03, dur: 0.2, gain: 0.15, pan: o.pan, rev: 0.05 });
  S.noise({ filter: 'lowpass', freq: 700, attack: 0.01, dur: 0.09, gain: 0.12, t: 0.18, pan: o.pan, rev: 0.05 });
};
G.SFX.snowbell = function (S, o) {   // three tiny bells, high and soft
  [4, 2, 5].forEach((n, k) => S.bell(G.note(n, 5), { gain: 0.04, dur: 1.2, t: k * 0.08, pan: o.pan, rev: 0.6 }));
};
G.SFX.peaks = function (S) {   // you come upon the peaks: a breath of high wind and a slow glassy chord
  S.noise({ filter: 'bandpass', freq: 900, freqTo: 1600, q: 1.2, attack: 0.6, dur: 2.2, gain: 0.05, rev: 0.6 });
  [0, 2, 4, 5, 7].forEach((n, k) => S.bell(G.note(n, 4), { gain: 0.045, dur: 2.6, t: 0.3 + k * 0.18, pan: -0.6 + k * 0.3, rev: 0.85 }));
};
G.SFX.aurora = function (S) {   // the northern lights: a long, shimmering, rising hum
  S.tone(G.note(0, 3), { type: 'sine', attack: 1.4, dur: 4.5, gain: 0.05, rev: 0.9 });
  S.tone(G.note(3, 3), { type: 'sine', attack: 1.8, dur: 4.2, gain: 0.035, t: 0.5, rev: 0.9 });
  [5, 6, 7, 9, 10].forEach((n, k) => S.bell(G.note(n, 4), { gain: 0.03, dur: 3, t: 1 + k * 0.4, pan: Math.sin(k * 1.7) * 0.6, rev: 0.9 }));
};
