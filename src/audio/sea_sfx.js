// The sounds of "Across the water" (Night 23), added to G.SFX: pushing off in
// the leaf boat, folding it on the shore, paddle strokes (a footstep kind), the
// open sea, a whale's song, pearls, lily pads and the Sea lantern.
window.G = window.G || {};

G.SFX.launch = function (S) {   // a soft splash, a hollow wooden knock, two rising notes
  S.noise({ filter: 'lowpass', freq: 1400, freqTo: 500, attack: 0.01, dur: 0.35, gain: 0.16, rev: 0.25 });
  S.tone(180, { type: 'triangle', dur: 0.12, gain: 0.07, t: 0.04 });
  S.bell(G.note(2, 5), { gain: 0.04, dur: 0.9, t: 0.15, rev: 0.5 });
  S.bell(G.note(4, 5), { gain: 0.04, dur: 1.1, t: 0.27, rev: 0.5 });
};
G.SFX.ashore = function (S) {   // the leaf folding up: a papery rustle and a little drip
  S.noise({ filter: 'bandpass', freq: 2400, q: 0.8, attack: 0.02, dur: 0.18, gain: 0.08, rev: 0.05 });
  S.tone(900, { type: 'sine', glide: 1500, glideTime: 0.06, dur: 0.1, gain: 0.04, t: 0.12, rev: 0.4 });
};
G.SFX.deepsea = function (S) {   // the open sea: a long low swell and a wide, calm chord
  S.noise({ filter: 'lowpass', freq: 400, freqTo: 900, attack: 0.8, dur: 2.4, gain: 0.07, rev: 0.6 });
  [0, 4, 7, 9].forEach((n, k) => S.bell(G.note(n, 4), { gain: 0.04, dur: 2.8, t: 0.4 + k * 0.22, pan: -0.5 + k * 0.33, rev: 0.85 }));
};
G.SFX.whale = function (S, o) {   // a whale's song: slow, low glides, far away
  S.noise({ filter: 'lowpass', freq: 700, freqTo: 300, attack: 0.05, dur: 1.2, gain: 0.08, pan: o.pan, rev: 0.4 });   // the blow
  S.tone(150, { type: 'sine', glide: 230, glideTime: 1.4, attack: 0.5, dur: 2.2, gain: 0.07, t: 0.6, pan: o.pan, rev: 0.9 });
  S.tone(230, { type: 'sine', glide: 120, glideTime: 1.8, attack: 0.6, dur: 2.6, gain: 0.06, t: 2.2, pan: o.pan, rev: 0.9 });
  S.tone(460, { type: 'sine', glide: 340, glideTime: 1.2, attack: 0.4, dur: 1.6, gain: 0.025, t: 2.5, pan: o.pan, rev: 0.9 });
};
G.SFX.pearl = function (S, o) {   // lifting a pearl: a pearly little arpeggio
  [0, 4, 7, 11].forEach((n, k) => S.bell(G.note(n, 5), { gain: 0.045, dur: 1.3, t: k * 0.06, pan: o.pan, rev: 0.6 }));
  S.noise({ filter: 'highpass', freq: 2500, dur: 0.12, gain: 0.04, pan: o.pan, rev: 0.3 });
};
G.SFX.lily = function (S, o) {   // a wet pluck
  S.noise({ filter: 'lowpass', freq: 1200, dur: 0.12, gain: 0.1, pan: o.pan, rev: 0.15 });
  S.tone(G.note(5, 4), { type: 'sine', dur: 0.25, gain: 0.05, t: 0.03, pan: o.pan, rev: 0.4 });
};
G.SFX.buoy = function (S, o) {   // a Sea lantern: a deep bell over the water, answered by a high one
  S.bell(G.note(0, 3), { gain: 0.08, dur: 3, pan: o.pan, rev: 0.8 });
  S.bell(G.note(4, 5), { gain: 0.04, dur: 2.2, t: 0.35, pan: o.pan, rev: 0.8 });
  S.noise({ filter: 'lowpass', freq: 900, dur: 0.4, gain: 0.08, pan: o.pan, rev: 0.3 });
};

// a paddle stroke (the "footsteps" of the boat)
G.STEP_SOUNDS.paddle = function (S, o) {
  S.noise({ filter: 'bandpass', freq: o.alt ? 700 : 850, freqTo: 380, q: 0.9, attack: 0.04, dur: 0.28, gain: 0.07, pan: o.alt ? -0.3 : 0.3, rev: 0.15 });
};
