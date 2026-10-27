// The sound engine: every sound in Lumen is made live with Web Audio — no files.
// G.Sound owns the AudioContext and a few mixing "buses"; G.SFX holds the
// little recipes for each sound effect; G.STEP_SOUNDS holds footsteps.
//
// Browsers only allow sound after the player clicks or presses a key, so the
// engine starts itself on the first input (G.Sound.unlock).
window.G = window.G || {};

G.Sound = {
  ctx: null,
  muted: false,
  volume: 0.8,
  PREF_KEY: 'lumen-sound',

  init() {
    try {
      const p = JSON.parse(localStorage.getItem(this.PREF_KEY) || '{}');
      if (typeof p.muted === 'boolean') this.muted = p.muted;
      if (typeof p.volume === 'number') this.volume = G.clamp(p.volume, 0, 1);
    } catch (e) { /* no saved preference */ }
    const wake = () => this.unlock();
    for (const ev of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(ev, wake, { capture: true });
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) this.ctx.suspend().catch(() => {});
      else this.ctx.resume().catch(() => {});
    });
  },

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try { this.ctx = new AC(); } catch (e) { return; }
      this.buildGraph();
      if (G.Ambience) G.Ambience.start(this);
    }
    if (this.ctx.state === 'suspended' && !document.hidden) this.ctx.resume().catch(() => {});
  },

  // master -> gentle compressor -> speakers, plus a soft hall reverb
  buildGraph() {
    const c = this.ctx;
    this.master = c.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.3;
    this.master.connect(comp); comp.connect(c.destination);

    this.reverb = c.createConvolver();
    this.reverb.buffer = this.makeImpulse(2.6);
    const revOut = c.createGain(); revOut.gain.value = 0.55;
    this.reverb.connect(revOut); revOut.connect(this.master);

    this.sfxBus = c.createGain(); this.sfxBus.gain.value = 1.8; this.sfxBus.connect(this.master);
    this.ambBus = c.createGain(); this.ambBus.gain.value = 0.7; this.ambBus.connect(this.master);

    this.noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  },

  makeImpulse(secs) {
    const c = this.ctx, n = Math.floor(c.sampleRate * secs);
    const buf = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2);
    }
    return buf;
  },

  // Can effects play right now?
  get live() { return !!this.ctx && this.ctx.state === 'running' && !this.muted; },
  get now() { return this.ctx ? this.ctx.currentTime : 0; },

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : this.volume, this.now, 0.15);
    this.savePrefs();
  },
  toggleMute() { this.setMuted(!this.muted); return this.muted; },
  savePrefs() {
    try { localStorage.setItem(this.PREF_KEY, JSON.stringify({ muted: this.muted, volume: this.volume })); } catch (e) {}
  },

  // Route a node out through panning, to a bus, with some reverb.
  out(node, { pan = 0, rev = 0.25, bus } = {}) {
    const c = this.ctx;
    let last = node;
    if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = G.clamp(pan, -1, 1); node.connect(p); last = p; }
    last.connect(bus || this.sfxBus);
    if (rev > 0) { const s = c.createGain(); s.gain.value = rev; last.connect(s); s.connect(this.reverb); }
  },

  // A single shaped note. glide = frequency to slide toward.
  tone(freq, o = {}) {
    if (!this.ctx) return;
    const c = this.ctx, t = this.now + (o.t || 0);
    const dur = o.dur || 0.4, att = o.attack || 0.005, peak = o.gain === undefined ? 0.2 : o.gain;
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.glide) osc.frequency.exponentialRampToValueAtTime(o.glide, t + (o.glideTime || dur));
    if (o.detune) osc.detune.value = o.detune;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + att);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); this.out(g, o);
    osc.start(t); osc.stop(t + dur + 0.05);
  },

  // A bell / chime: a few sine partials that fade at different speeds.
  bell(freq, o = {}) {
    const g = o.gain === undefined ? 0.12 : o.gain, dur = o.dur || 1.6;
    this.tone(freq, { ...o, gain: g, dur, attack: 0.003 });
    this.tone(freq * 2.01, { ...o, gain: g * 0.3, dur: dur * 0.5, attack: 0.002 });
    this.tone(freq * 3.0, { ...o, gain: g * 0.12, dur: dur * 0.3, attack: 0.002 });
  },

  // A burst of filtered noise — rustles, taps, whooshes, footsteps.
  noise(o = {}) {
    if (!this.ctx) return;
    const c = this.ctx, t = this.now + (o.t || 0), dur = o.dur || 0.1;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = o.filter || 'bandpass';
    f.frequency.setValueAtTime(o.freq || 1000, t);
    if (o.freqTo) f.frequency.exponentialRampToValueAtTime(o.freqTo, t + dur);
    f.Q.value = o.q || 1;
    const g = c.createGain(), peak = o.gain === undefined ? 0.1 : o.gain;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + (o.attack || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); this.out(g, o);
    const off = Math.random() * 1.5;
    src.start(t, off); src.stop(t + dur + 0.05);
  },

  // Play a named effect from G.SFX (silently does nothing if sound is off).
  play(name, opts) {
    if (!this.live || !G.SFX[name]) return;
    try { G.SFX[name](this, opts || {}); } catch (e) { /* never let a sound break the game */ }
  },

  step(kind, opts) {
    if (!this.live || !G.STEP_SOUNDS[kind]) return;
    try { G.STEP_SOUNDS[kind](this, opts || {}); } catch (e) {}
  },
};

// Notes of a D major pentatonic scale, so every chime fits with every other.
G.note = function (i, octave = 4) {
  const steps = [0, 2, 4, 7, 9];
  const n = ((i % 5) + 5) % 5, o = octave + Math.floor(i / 5);
  return 440 * Math.pow(2, (62 + steps[n] + (o - 4) * 12 - 69) / 12);
};
G.pick = arr => arr[Math.floor(Math.random() * arr.length)];

// ---------- sound effects ----------
// Each takes (S = G.Sound, opts). opts.pan is -1 (left) .. 1 (right).
G.SFX = {
  wood(S, o) {   // a soft "tok" of wood and a rustle of leaves
    S.tone(G.rand(190, 230), { type: 'triangle', glide: 120, dur: 0.14, gain: 0.28, pan: o.pan, rev: 0.15 });
    S.noise({ filter: 'bandpass', freq: 1100, q: 2, dur: 0.07, gain: 0.18, pan: o.pan });
    S.noise({ filter: 'highpass', freq: 3500, dur: 0.35, attack: 0.05, gain: 0.035, t: 0.03, pan: o.pan });
  },
  stone(S, o) {  // a bright clink
    const f = G.rand(1250, 1450);
    S.tone(f, { dur: 0.12, gain: 0.1, pan: o.pan, rev: 0.3 });
    S.tone(f * 1.52, { dur: 0.08, gain: 0.05, pan: o.pan, rev: 0.3 });
    S.noise({ filter: 'bandpass', freq: 2800, q: 3, dur: 0.04, gain: 0.18, pan: o.pan });
    S.tone(110, { type: 'triangle', dur: 0.1, gain: 0.12, pan: o.pan, rev: 0 });
  },
  petal(S, o) {  // a little two-note sparkle
    const i = Math.floor(Math.random() * 5);
    S.bell(G.note(i, 5), { gain: 0.09, dur: 1.4, pan: o.pan, rev: 0.5 });
    S.bell(G.note(i + 2, 5), { gain: 0.07, dur: 1.6, t: 0.09, pan: o.pan, rev: 0.5 });
  },
  lantern(S, o) { // a rising arpeggio and a warm swell: colour returns
    [0, 2, 4, 5, 7].forEach((n, k) => S.bell(G.note(n, 4), { gain: 0.09, dur: 2.2, t: k * 0.11, pan: o.pan, rev: 0.6 }));
    for (const n of [0, 3, 5]) S.tone(G.note(n, 3), { type: 'triangle', attack: 0.5, dur: 2.8, gain: 0.05, rev: 0.7 });
    S.noise({ filter: 'bandpass', freq: 600, freqTo: 4000, q: 0.8, attack: 0.4, dur: 1.1, gain: 0.04, rev: 0.6 });
  },
  placeStone(S, o) {
    S.tone(150, { type: 'triangle', glide: 90, dur: 0.12, gain: 0.25, pan: o.pan, rev: 0.1 });
    S.noise({ filter: 'bandpass', freq: 2200, q: 2, dur: 0.05, gain: 0.16, pan: o.pan });
    S.noise({ filter: 'bandpass', freq: 1800, q: 2, dur: 0.04, gain: 0.1, t: 0.07, pan: o.pan });
  },
  placeWood(S, o) {
    [0, 0.08, 0.16].forEach((t, k) =>
      S.tone(230 - k * 25, { type: 'triangle', glide: 140, dur: 0.12, gain: 0.22, t, pan: o.pan, rev: 0.15 }));
  },
  open(S) {     // panel slides open
    S.noise({ filter: 'bandpass', freq: 500, freqTo: 2200, q: 1.2, attack: 0.08, dur: 0.25, gain: 0.05 });
    S.bell(G.note(3, 5), { gain: 0.035, dur: 0.6, t: 0.08, rev: 0.4 });
  },
  close(S) {
    S.noise({ filter: 'bandpass', freq: 2000, freqTo: 500, q: 1.2, attack: 0.05, dur: 0.22, gain: 0.1 });
  },
  select(S) {
    S.bell(G.note(4, 4), { gain: 0.06, dur: 0.7, rev: 0.4 });
    S.bell(G.note(1, 5), { gain: 0.05, dur: 0.8, t: 0.06, rev: 0.4 });
  },
  deny(S) {     // a soft, kind "not quite"
    S.tone(G.note(3, 3), { type: 'triangle', dur: 0.22, gain: 0.08, rev: 0.2 });
    S.tone(G.note(2, 3), { type: 'triangle', dur: 0.3, gain: 0.07, t: 0.12, rev: 0.2 });
  },
  toggle(S) { S.bell(G.note(2, 5), { gain: 0.08, dur: 0.5, rev: 0.3 }); },
  goal(S) {     // a small, happy "ta-da" when a goal is done
    [4, 7, 9].forEach((n, k) => S.bell(G.note(n, 4), { gain: 0.08, dur: 1.4, t: k * 0.09, rev: 0.5 }));
    S.bell(G.note(12, 4), { gain: 0.06, dur: 2.2, t: 0.3, rev: 0.6 });
  },
  mapOpen(S) {  // paper unfolding and a soft chime
    S.noise({ filter: 'bandpass', freq: 1400, freqTo: 3200, q: 0.9, attack: 0.03, dur: 0.18, gain: 0.07 });
    S.noise({ filter: 'bandpass', freq: 2600, freqTo: 1200, q: 0.9, attack: 0.03, dur: 0.16, gain: 0.05, t: 0.12 });
    S.bell(G.note(2, 5), { gain: 0.04, dur: 0.9, t: 0.14, rev: 0.5 });
  },
  flutter(S, o) {  // a little flock of wings taking off
    for (let i = 0; i < 6; i++) {
      S.noise({ filter: 'bandpass', freq: G.rand(1300, 2100), q: 1.4, attack: 0.008, dur: 0.06, gain: 0.07, t: i * 0.045 + Math.random() * 0.02, pan: o.pan, rev: 0.15 });
    }
    S.tone(G.note(9, 5), { dur: 0.08, gain: 0.025, t: 0.05, pan: o.pan, rev: 0.4 });
  },
  splash(S, o) {   // a fish leaps: a bright plip and a small splash
    S.tone(900, { glide: 380, dur: 0.12, gain: 0.07, pan: o.pan, rev: 0.35 });
    S.noise({ filter: 'lowpass', freq: 2400, freqTo: 500, attack: 0.005, dur: 0.28, gain: 0.07, t: 0.03, pan: o.pan, rev: 0.3 });
  },
  meet(S) {        // a gentle, curious little phrase: someone new is here
    [7, 9, 12].forEach((n, k) => S.bell(G.note(n, 4), { gain: 0.05, dur: 1, t: k * 0.12, rev: 0.6 }));
  },
  fibre(S, o) {    // a soft swish of reeds
    S.noise({ filter: 'bandpass', freq: 2600, freqTo: 1200, q: 0.8, attack: 0.03, dur: 0.22, gain: 0.08, pan: o.pan, rev: 0.1 });
    S.noise({ filter: 'bandpass', freq: 3400, freqTo: 1800, q: 0.8, attack: 0.02, dur: 0.16, gain: 0.05, t: 0.1, pan: o.pan, rev: 0.1 });
  },
  crystal(S, o) {  // glassy, ringing chimes
    const i = Math.floor(Math.random() * 5);
    [0, 2, 4].forEach((n, k) => S.bell(G.note(i + n, 6), { gain: 0.06, dur: 2.2, t: k * 0.06, pan: o.pan, rev: 0.7 }));
    S.tone(G.note(i, 5) * 1.5, { dur: 0.05, gain: 0.05, pan: o.pan, rev: 0.4 });
  },
  craft(S, o) {    // tap tap tap at the workbench, then a bright little bell
    [0, 0.13, 0.26].forEach((t, k) => {
      S.tone(320 + k * 30, { type: 'triangle', glide: 200, dur: 0.07, gain: 0.16, t, pan: o.pan, rev: 0.15 });
      S.noise({ filter: 'bandpass', freq: 2400, q: 3, dur: 0.03, gain: 0.08, t, pan: o.pan });
    });
    S.bell(G.note(7, 4), { gain: 0.07, dur: 1.4, t: 0.42, rev: 0.5 });
    S.bell(G.note(9, 4), { gain: 0.05, dur: 1.6, t: 0.5, rev: 0.5 });
  },
  beacon(S, o) {   // a lantern's chime, but deeper, wider and shimmering with crystal
    [0, 2, 4, 5, 7, 9, 12].forEach((n, k) => S.bell(G.note(n, 4), { gain: 0.08, dur: 2.6, t: k * 0.1, pan: o.pan, rev: 0.7 }));
    for (const n of [0, 3, 5]) S.tone(G.note(n, 2), { type: 'triangle', attack: 0.7, dur: 3.6, gain: 0.06, rev: 0.8 });
    for (let k = 0; k < 5; k++) S.bell(G.note(10 + k * 2, 5), { gain: 0.025, dur: 1.8, t: 0.7 + k * 0.08, rev: 0.8 });
  },
  pickup(S, o) {   // a falling little "boop": back into your pocket
    S.tone(G.note(7, 4), { type: 'triangle', glide: G.note(2, 4), dur: 0.16, gain: 0.1, pan: o.pan, rev: 0.2 });
    S.bell(G.note(2, 5), { gain: 0.05, dur: 0.6, t: 0.08, pan: o.pan, rev: 0.3 });
  },
  welcome(S) {  // the Heart Stone glows as a new world begins
    [0, 4, 7, 9, 12].forEach((n, k) => S.bell(G.note(n, 3), { gain: 0.08, dur: 3, t: k * 0.22, rev: 0.7 }));
  },
};

// ---------- footsteps ----------
// opts.alt alternates left/right foot for a slightly different pitch.
G.STEP_SOUNDS = {
  grass(S, o)  { S.noise({ filter: 'lowpass', freq: o.alt ? 900 : 1100, dur: 0.09, attack: 0.01, gain: 0.154, rev: 0.05 }); },
  leaves(S, o) {
    S.noise({ filter: 'lowpass', freq: 800, dur: 0.08, attack: 0.01, gain: 0.132, rev: 0.05 });
    S.noise({ filter: 'highpass', freq: o.alt ? 3800 : 4400, dur: 0.12, attack: 0.02, gain: 0.055, rev: 0.05 });
  },
  sand(S, o)   { S.noise({ filter: 'bandpass', freq: o.alt ? 2200 : 2600, q: 0.7, dur: 0.13, attack: 0.03, gain: 0.11, rev: 0.05 }); },
  stone(S, o)  {
    S.noise({ filter: 'bandpass', freq: o.alt ? 1600 : 1900, q: 3, dur: 0.035, gain: 0.176, rev: 0.12 });
    S.tone(o.alt ? 95 : 105, { type: 'triangle', dur: 0.06, gain: 0.132, rev: 0 });
  },
  wood(S, o)   { S.tone(o.alt ? 170 : 190, { type: 'triangle', glide: 120, dur: 0.09, gain: 0.16, rev: 0.1 }); },
};

G.Sound.init();
