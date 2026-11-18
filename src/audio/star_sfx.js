// Sounds of the Star Chart (Night 26): a glassy twinkle when a star lights (it
// climbs a little higher with every star you have), a slow shimmering chord
// when a whole constellation is complete, and the Star lantern's chime.
window.G = window.G || {};

Object.assign(G.SFX, {
  star(S, o) {         // a twinkle: three quick high bells and a soft airy shimmer
    const k = ((o.n || 1) - 1) % 5;
    S.noise({ filter: 'highpass', freq: 5200, attack: 0.08, dur: 0.6, gain: 0.018, rev: 0.9 });
    [10 + k, 12 + k, 15 + k].forEach((n, i) => S.bell(G.note(n, 4), { gain: 0.05 - i * 0.008, dur: 1.6, t: i * 0.09, pan: -0.3 + i * 0.3, rev: 0.85 }));
  },
  constellation(S) {   // every star at once: a wide, slow chord and bells falling like a shower of sparks
    S.noise({ filter: 'bandpass', freq: 3000, freqTo: 7000, q: 0.8, attack: 0.4, dur: 2.2, gain: 0.022, rev: 0.9 });
    [0, 4, 7, 9].forEach((n, i) => S.tone(G.note(n, 3) * (i === 3 ? 2 : 1), { type: 'sine', attack: 0.5, dur: 3.4, gain: 0.04, rev: 0.9, pan: -0.45 + i * 0.3 }));
    for (let i = 0; i < 8; i++) S.bell(G.note(17 - i, 4), { gain: 0.04, dur: 2, t: 0.3 + i * 0.12, pan: Math.sin(i * 1.7) * 0.6, rev: 0.9 });
  },
  starlantern(S, o) {  // building a Star lantern: a glassy rising run and a soft bloom
    [5, 7, 9, 12].forEach((n, i) => S.bell(G.note(n, 4), { ...o, gain: 0.055, dur: 1.8, t: i * 0.07, rev: 0.8 }));
    S.tone(G.note(0, 3), { ...o, type: 'sine', attack: 0.25, dur: 1.6, gain: 0.05, rev: 0.7 });
  },
});
