// The instruments of Lumen's music, all made live with Web Audio.
// Each takes (S = G.Sound, freq, o) where o = { t: seconds from now, dur, gain, pan }
// and plays one note on the music bus. The composer (audio/music.js) picks them by name.
window.G = window.G || {};

// A held note: oscillators -> optional filter -> envelope, with optional vibrato.
// Used for the breathy and sung instruments (the bells use G.Sound.tone/bell).
G.musicVoice = function (S, freq, o) {
  const c = S.ctx, t = S.now + Math.max(0, o.t || 0);
  const dur = Math.max(0.08, o.dur || 0.5), att = o.attack || 0.04, rel = o.release || 0.25, peak = o.gain || 0.05;
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(peak, t + att);
  env.gain.setTargetAtTime(peak * (o.sustain || 0.75), t + att, dur * 0.5);
  env.gain.setTargetAtTime(0.0001, t + dur, rel / 3);
  let into = env;
  if (o.filter) {
    const f = c.createBiquadFilter();
    f.type = o.filter; f.frequency.value = o.cutoff || 1200; f.Q.value = o.q || 0.7;
    f.connect(env); into = f;
  }
  const end = t + dur + rel + 0.1;
  let vib = null;
  if (o.vibrato) {   // a slow wobble that only starts once the note has settled
    vib = c.createOscillator(); vib.frequency.value = o.vibRate || 5;
    const vg = c.createGain();
    vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(o.vibrato, t + Math.min(0.5, dur * 0.6));
    vib.connect(vg); vib.start(t); vib.stop(end);
    vib.out = vg;
  }
  for (const [type, mul, g, det] of o.parts || [['sine', 1, 1, 0]]) {
    const osc = c.createOscillator(), og = c.createGain();
    osc.type = type; osc.frequency.value = freq * mul; osc.detune.value = det || 0;
    if (vib) vib.out.connect(osc.detune);
    og.gain.value = g;
    osc.connect(og); og.connect(into);
    osc.start(t); osc.stop(end);
  }
  S.out(env, { pan: o.pan, rev: o.rev === undefined ? 0.4 : o.rev, bus: S.musicBus });
};

G.INSTRUMENTS = {
  // the meadow: a soft flute, breathy at the start
  flute(S, f, o) {
    G.musicVoice(S, f, { ...o, attack: 0.07, release: 0.3, sustain: 0.8, vibrato: 9, vibRate: 4.8, rev: 0.45,
      parts: [['triangle', 1, 0.75], ['sine', 2, 0.18], ['sine', 1, 0.4, 4]] });
    S.noise({ filter: 'bandpass', freq: f * 2.2, q: 2.5, dur: 0.12, attack: 0.03, gain: (o.gain || 0.05) * 0.5, t: o.t, pan: o.pan, rev: 0.2, bus: S.musicBus });
  },
  // the woods: a warm wooden marimba
  marimba(S, f, o) {
    const g = (o.gain || 0.05) * 1.6, b = { t: o.t, pan: o.pan, bus: S.musicBus };
    S.tone(f, { ...b, dur: Math.min(1.1, 0.4 + (o.dur || 0.4)), attack: 0.004, gain: g, rev: 0.3 });
    S.tone(f * 4, { ...b, dur: 0.07, attack: 0.002, gain: g * 0.22, rev: 0.2 });
    S.tone(f * 10.0, { ...b, dur: 0.025, attack: 0.001, gain: g * 0.06, rev: 0 });
  },
  // the shore: a bright, plucked kalimba
  kalimba(S, f, o) {
    const g = (o.gain || 0.05) * 1.5, b = { t: o.t, pan: o.pan, bus: S.musicBus };
    S.tone(f, { ...b, dur: 1.2, attack: 0.003, gain: g, rev: 0.4 });
    S.tone(f * 5.4, { ...b, dur: 0.12, attack: 0.002, gain: g * 0.18, rev: 0.3 });
    S.tone(f * 2, { ...b, type: 'triangle', dur: 0.25, attack: 0.002, gain: g * 0.12, rev: 0.3 });
  },
  // the highlands (and fog): glassy, ringing, far away
  glass(S, f, o) {
    S.bell(f * 2, { t: o.t, pan: o.pan, bus: S.musicBus, gain: (o.gain || 0.05) * 1.1, dur: 2.4, rev: 0.8 });
    S.tone(f, { t: o.t, pan: o.pan, bus: S.musicBus, gain: (o.gain || 0.05) * 0.35, attack: 0.08, dur: 1.6, rev: 0.8 });
  },
  // water, and the gardener's part: a gentle harp
  harp(S, f, o) {
    const g = (o.gain || 0.05) * 1.3, b = { t: o.t, pan: o.pan, bus: S.musicBus };
    S.tone(f, { ...b, type: 'triangle', dur: 1.5, attack: 0.003, gain: g, rev: 0.55 });
    S.tone(f * 2, { ...b, dur: 0.6, attack: 0.002, gain: g * 0.3, rev: 0.55 });
    S.tone(f * 3, { ...b, dur: 0.2, attack: 0.002, gain: g * 0.08, rev: 0.4 });
  },
  // night: a tiny music box, an octave up
  musicbox(S, f, o) {
    S.bell(f * 2, { t: o.t, pan: o.pan, bus: S.musicBus, gain: (o.gain || 0.05) * 1.1, dur: 1.8, rev: 0.6 });
    S.noise({ filter: 'highpass', freq: 6000, dur: 0.012, gain: (o.gain || 0.05) * 0.4, t: o.t, pan: o.pan, rev: 0, bus: S.musicBus });
  },
  // the grey: a single soft, lonely piano-ish note with a long echo
  lonely(S, f, o) {
    S.tone(f, { t: o.t, pan: o.pan, bus: S.musicBus, type: 'triangle', attack: 0.006, dur: 3.2, gain: (o.gain || 0.05), rev: 0.95 });
    S.tone(f * 2, { t: o.t, pan: o.pan, bus: S.musicBus, attack: 0.004, dur: 1.4, gain: (o.gain || 0.05) * 0.25, rev: 0.95 });
  },
  // the bass: round and soft, never boomy
  bass(S, f, o) {
    G.musicVoice(S, f, { ...o, attack: 0.03, release: 0.5, sustain: 0.5, rev: 0.15,
      parts: [['sine', 1, 1], ['triangle', 2, 0.18]], filter: 'lowpass', cutoff: 600 });
  },
  // a high sparkle over everything once the land is in full colour
  sparkle(S, f, o) {
    S.bell(f * 4, { t: o.t, pan: o.pan, bus: S.musicBus, gain: (o.gain || 0.05) * 0.7, dur: 1.3, rev: 0.85 });
  },

  // ---- the band (friends who play along) ----
  voice(S, f, o) {   // a soft "ooh"
    G.musicVoice(S, f, { ...o, attack: 0.16, release: 0.4, sustain: 0.85, vibrato: 14, vibRate: 5.2, rev: 0.6,
      filter: 'lowpass', cutoff: 950, q: 1.6, parts: [['sawtooth', 1, 0.45, -6], ['sawtooth', 1, 0.45, 6], ['sine', 1, 0.8]] });
  },
  pipe(S, f, o) {    // a low, hollow wooden pipe
    G.musicVoice(S, f, { ...o, attack: 0.09, release: 0.35, sustain: 0.8, vibrato: 6, vibRate: 4.2, rev: 0.5,
      parts: [['sine', 1, 0.9], ['triangle', 1, 0.35], ['sine', 3, 0.06]] });
    S.noise({ filter: 'bandpass', freq: f * 3, q: 2, dur: 0.1, attack: 0.03, gain: (o.gain || 0.05) * 0.35, t: o.t, pan: o.pan, rev: 0.2, bus: S.musicBus });
  },
  woodblock(S, f, o) {   // a tock, and a soft low marimba note under it
    const g = o.gain || 0.05;
    S.tone(f > 400 ? 820 : 640, { t: o.t, pan: o.pan, bus: S.musicBus, type: 'triangle', glide: 520, dur: 0.06, attack: 0.002, gain: g * 0.9, rev: 0.2 });
    S.noise({ filter: 'bandpass', freq: 1900, q: 4, dur: 0.025, gain: g * 0.8, t: o.t, pan: o.pan, rev: 0.1, bus: S.musicBus });
    if (o.low) G.INSTRUMENTS.marimba(S, f, { ...o, gain: g * 0.8 });
  },
  chime(S, f, o) {   // wind chimes: a couple of high bells, slightly apart
    S.bell(f * 2, { t: o.t, pan: o.pan, bus: S.musicBus, gain: (o.gain || 0.05), dur: 2.6, rev: 0.85 });
    S.bell(f * 3, { t: (o.t || 0) + 0.07, pan: o.pan, bus: S.musicBus, gain: (o.gain || 0.05) * 0.45, dur: 1.8, rev: 0.85 });
  },
};
