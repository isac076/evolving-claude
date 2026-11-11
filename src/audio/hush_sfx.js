// Sounds of the hush of night (Night 19): the hushlings' soft sighs, a Shine,
// and the glassy chime of a shadow turning into starlight. Gentle, never scary.
window.G = window.G || {};

Object.assign(G.SFX, {
  hush(S, o) {   // a breathy, falling sigh far off in the dark
    S.noise({ filter: 'bandpass', freq: G.rand(700, 900), freqTo: 320, q: 2.5, attack: 0.25, dur: 1.1, gain: 0.05, pan: o.pan, rev: 0.6 });
    S.tone(G.rand(196, 220), { type: 'sine', glide: 150, attack: 0.3, dur: 1.2, gain: 0.025, pan: o.pan, rev: 0.7 });
  },
  hushcling(S, o) {   // one takes hold: a low, soft "mm" and a cool shiver
    S.tone(147, { type: 'sine', glide: 130, attack: 0.08, dur: 0.6, gain: 0.07, pan: o.pan, rev: 0.4 });
    S.noise({ filter: 'highpass', freq: 4200, attack: 0.1, dur: 0.5, gain: 0.025, pan: o.pan, rev: 0.5 });
  },
  hushmeet(S) {   // the first one you meet: two low notes, a question in the dark
    S.tone(G.note(0, 3), { type: 'sine', attack: 0.4, dur: 2, gain: 0.06, rev: 0.8 });
    S.tone(G.note(1, 3), { type: 'sine', attack: 0.5, dur: 2.2, gain: 0.05, t: 0.7, rev: 0.8 });
    S.bell(G.note(4, 5), { gain: 0.03, dur: 2.5, t: 1.2, rev: 0.9 });
  },
  hushsated(S) {   // full: the shadows let go with a long, sleepy breath
    S.noise({ filter: 'lowpass', freq: 900, freqTo: 200, attack: 0.4, dur: 1.8, gain: 0.07, rev: 0.7 });
    S.tone(G.note(2, 3), { type: 'sine', glide: 110, attack: 0.3, dur: 1.8, gain: 0.04, rev: 0.7 });
  },
  shine(S, o) {   // a warm swell of light and a bright shimmer spreading out
    S.noise({ filter: 'bandpass', freq: 1800, freqTo: 5200, q: 1.2, attack: 0.05, dur: 0.6, gain: 0.05, pan: o.pan, rev: 0.6 });
    for (const [n, k] of [[0, 0], [4, 1], [7, 2]]) S.bell(G.note(n, 5), { gain: 0.06, dur: 1.6, t: k * 0.05, pan: o.pan, rev: 0.7 });
    S.tone(G.note(0, 3), { type: 'triangle', attack: 0.1, dur: 1, gain: 0.05, pan: o.pan, rev: 0.6 });
  },
  hushease(S, o) {   // a shadow remembers the light: a soft rising run of glass bells
    [0, 2, 4, 7, 9, 12].forEach((n, k) => S.bell(G.note(n, 5), { gain: 0.05, dur: 2.2, t: k * 0.08, pan: o.pan, rev: 0.8 }));
    S.tone(G.note(0, 4), { type: 'sine', attack: 0.3, dur: 2, gain: 0.04, pan: o.pan, rev: 0.8 });
  },
  starlight(S, o) {   // starlight reaches you: a tiny bright ping
    S.bell(G.note(9, 5), { gain: 0.06, dur: 1.4, pan: o.pan, rev: 0.6 });
    S.bell(G.note(14, 5), { gain: 0.04, dur: 1.6, t: 0.07, pan: o.pan, rev: 0.6 });
  },
  moonlantern(S, o) {   // a Moon lantern is lit: a slow, silvery chord
    [0, 4, 7, 11].forEach((n, k) => S.bell(G.note(n, 4), { gain: 0.07, dur: 2.8, t: k * 0.16, pan: o.pan, rev: 0.8 }));
    S.tone(G.note(0, 3), { type: 'sine', attack: 0.6, dur: 3, gain: 0.05, rev: 0.8 });
  },
});
