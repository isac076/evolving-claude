// Sounds of photo mode and the title (Night 24): a soft lens whirr when photo
// mode opens, a gentle two-part shutter, and a warm swell on the way into the world.
window.G = window.G || {};

Object.assign(G.SFX, {
  lens(S) {        // a tiny lens turning: a soft rising whirr and a glassy tick
    S.noise({ filter: 'bandpass', freq: 900, freqTo: 2400, q: 3, attack: 0.04, dur: 0.28, gain: 0.04 });
    S.bell(G.note(19, 4), { gain: 0.03, dur: 0.6, t: 0.22, rev: 0.6 });
  },
  shutter(S) {     // click-clack: two short dry ticks, then a breath of film winding on
    S.noise({ filter: 'highpass', freq: 2200, attack: 0.002, dur: 0.035, gain: 0.12 });
    S.noise({ filter: 'bandpass', freq: 1400, q: 1.5, attack: 0.002, dur: 0.05, gain: 0.09, t: 0.075 });
    S.noise({ filter: 'bandpass', freq: 600, freqTo: 1100, q: 2, attack: 0.05, dur: 0.3, gain: 0.025, t: 0.16 });
    S.bell(G.note(24, 4), { gain: 0.025, dur: 1.2, t: 0.12, rev: 0.8 });
  },
  arrive(S) {      // leaving the title: a soft swell and three bells settling
    S.noise({ filter: 'lowpass', freq: 400, freqTo: 2400, attack: 0.3, dur: 1.4, gain: 0.04, rev: 0.8 });
    S.tone(G.note(0, 3), { type: 'sine', attack: 0.4, dur: 2.2, gain: 0.05, rev: 0.8 });
    [7, 12, 16].forEach((n, k) => S.bell(G.note(n, 4), { gain: 0.045, dur: 2.2, t: 0.35 + k * 0.18, pan: -0.4 + k * 0.4, rev: 0.85 }));
  },
});
