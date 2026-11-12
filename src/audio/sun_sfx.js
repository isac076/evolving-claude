// Sounds of the Great Sun (Night 20): the four embers gathering over the altar,
// and the sunrise itself — a long, slow swell into a bright open chord with
// bells pouring out on every side. Warm and big, never loud.
window.G = window.G || {};

Object.assign(G.SFX, {
  sungather(S) {   // four embers lift and gather: a rising shimmer, four bells one after another, a low hum growing
    S.noise({ filter: 'bandpass', freq: 500, freqTo: 3200, q: 0.7, attack: 3.5, dur: 5.5, gain: 0.05, rev: 0.8 });
    [0, 4, 7, 12].forEach((n, k) => S.bell(G.note(n, 4), { gain: 0.07, dur: 3, t: 0.4 + k * 0.7, pan: [-0.7, 0.7, -0.3, 0.3][k], rev: 0.85 }));
    S.tone(G.note(0, 2), { type: 'sine', attack: 4, dur: 6.2, gain: 0.06, rev: 0.8 });
    S.tone(G.note(7, 2), { type: 'triangle', attack: 4.5, dur: 6.2, gain: 0.03, rev: 0.8 });
  },
  sunrise(S) {     // dawn: a soft bright rush, a wide chord that holds a long time, and bells cascading up and out
    S.noise({ filter: 'lowpass', freq: 300, freqTo: 4000, attack: 0.25, dur: 3.5, gain: 0.09, rev: 0.7 });
    S.noise({ filter: 'highpass', freq: 5000, attack: 1, dur: 4, gain: 0.025, rev: 0.9 });
    for (const [n, o, g] of [[0, 2, 0.07], [7, 2, 0.05], [0, 3, 0.05], [4, 3, 0.04], [7, 3, 0.035], [12, 3, 0.03]])
      S.tone(G.note(n, o), { type: n % 7 ? 'triangle' : 'sine', attack: 1.4, dur: 8, gain: g, rev: 0.9 });
    [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28].forEach((n, k) =>
      S.bell(G.note(n, 4), { gain: 0.055, dur: 3.5, t: 0.3 + k * 0.16, pan: Math.sin(k * 1.3) * 0.85, rev: 0.9 }));
    [24, 21, 19, 16, 14, 12].forEach((n, k) => S.bell(G.note(n, 4), { gain: 0.04, dur: 4, t: 3.2 + k * 0.28, pan: -0.5 + k * 0.2, rev: 0.95 }));
  },
});
