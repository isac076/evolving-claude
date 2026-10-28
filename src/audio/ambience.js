// The living soundscape. It listens to where the spirit is and what time it is:
//  - grey, faded land: a hollow, lonely wind
//  - restored land by day: birdsong and a warm, gentle chord
//  - restored land at night: crickets, the odd owl, a softer chord
//  - near water: lapping waves
//  - weather: rain hiss and patter, stronger wind, frogs croaking in the rain,
//    and fog that hushes the birds
// main.js calls G.Ambience.update(dt, info) every frame.
window.G = window.G || {};

G.Ambience = {
  S: null,
  nodes: null,
  birdTimer: 2, cricketTimer: 1, owlTimer: 20, gustPhase: 0,

  start(S) {
    this.S = S;
    const c = S.ctx;
    const loopNoise = () => { const n = c.createBufferSource(); n.buffer = S.noiseBuf; n.loop = true; n.start(); return n; };
    const gain = v => { const g = c.createGain(); g.gain.value = v; return g; };

    // wind: noise through a slowly wandering band filter
    const wind = loopNoise(), windF = c.createBiquadFilter(), windG = gain(0);
    windF.type = 'bandpass'; windF.frequency.value = 420; windF.Q.value = 0.9;
    wind.connect(windF); windF.connect(windG); windG.connect(S.ambBus);

    // water: low, soft noise whose loudness rises and falls like waves
    const water = loopNoise(), waterF = c.createBiquadFilter(), waterG = gain(0);
    waterF.type = 'lowpass'; waterF.frequency.value = 520; waterF.Q.value = 0.4;
    water.connect(waterF); waterF.connect(waterG); waterG.connect(S.ambBus);

    // pad: three soft voices that blend a chord which shifts with day and night
    const padF = c.createBiquadFilter(), padG = gain(0);
    padF.type = 'lowpass'; padF.frequency.value = 700;
    padF.connect(padG); padG.connect(S.ambBus);
    const send = gain(0.6); padG.connect(send); send.connect(S.reverb);
    const voices = [0, 1, 2].map(i => {
      const o = c.createOscillator();
      o.type = i === 0 ? 'sine' : 'triangle';
      o.detune.value = (i - 1) * 4;
      const g = gain(i === 0 ? 0.5 : 0.28);
      o.connect(g); g.connect(padF); o.start();
      // a very slow wobble on each voice so the chord breathes
      const lfo = c.createOscillator(), lg = gain(0.12);
      lfo.frequency.value = 0.07 + i * 0.03;
      lfo.connect(lg); lg.connect(g.gain); lfo.start();
      return o;
    });

    // rain: a soft high hiss plus a lower patter on leaves
    const rain = loopNoise(), rainF = c.createBiquadFilter(), rainF2 = c.createBiquadFilter(), rainG = gain(0);
    rainF.type = 'highpass'; rainF.frequency.value = 1400; rainF2.type = 'lowpass'; rainF2.frequency.value = 7000;
    rain.connect(rainF); rainF.connect(rainF2); rainF2.connect(rainG); rainG.connect(S.ambBus);
    const pat = loopNoise(), patF = c.createBiquadFilter(), patG = gain(0);
    patF.type = 'bandpass'; patF.frequency.value = 650; patF.Q.value = 0.7;
    pat.connect(patF); patF.connect(patG); patG.connect(S.ambBus);
    const rainSend = gain(0.3); rainG.connect(rainSend); rainSend.connect(S.reverb);

    this.nodes = { windG, windF, waterG, waterF, padG, padF, voices, rainG, patG };
    this.dripTimer = 1; this.frogTimer = 3;
    this.chord = null;
  },

  // info: { restore 0..1, day 0..1, water 0..1, active: is the game being played,
  //         rain 0..1, wind 0..1, fog 0..1 (optional, from the weather) }
  update(dt, info) {
    const S = this.S;
    if (!S || !this.nodes || !S.ctx || S.ctx.state !== 'running') return;
    const n = this.nodes, t = S.now, r = info.restore, day = info.day, night = 1 - day;
    const set = (param, v, tc = 1.2) => param.setTargetAtTime(v, t, tc);
    const rain = info.rain || 0, wwind = info.wind || 0, fog = info.fog || 0;

    // wind: strongest in faded land, gusting slowly
    this.gustPhase += dt;
    const gust = 0.6 + 0.4 * Math.sin(this.gustPhase * 0.23) * Math.sin(this.gustPhase * 0.071 + 1);
    set(n.windG.gain, (0.05 + 0.13 * (1 - r) + 0.2 * wwind) * gust * (0.7 + 0.3 * day) * (1 - fog * 0.6));
    set(n.windF.frequency, 300 + 260 * gust + 200 * (1 - r) + 250 * wwind, 2);

    // rain
    set(n.rainG.gain, 0.09 * Math.pow(rain, 1.2), 1.5);
    set(n.patG.gain, 0.07 * rain * (0.4 + 0.6 * r), 1.5);

    // water lapping
    const lap = 0.55 + 0.45 * Math.sin(t * 0.9) * Math.sin(t * 0.37 + 2);
    set(n.waterG.gain, info.water * 0.22 * lap, 0.4);
    set(n.waterF.frequency, 380 + 260 * lap, 0.5);

    // warm chord: appears as colour returns; a brighter chord by day, softer at night
    const chord = day > 0.45 ? [0, 4, 7] : [-3, 0, 4];   // D major by day, B minor by night
    const key = chord.join();
    if (key !== this.chord) {
      this.chord = key;
      chord.forEach((semi, i) => set(n.voices[i].frequency, 146.83 * Math.pow(2, (semi + (i === 2 ? 12 : 0)) / 12), 2.5));
    }
    set(n.padG.gain, 0.05 * Math.pow(r, 1.5) * (0.6 + 0.4 * day) + 0.006, 2);
    set(n.padF.frequency, 450 + 700 * r * (0.5 + 0.5 * day), 2);

    if (!info.active) return;

    // birdsong in restored land by day
    this.birdTimer -= dt;
    if (this.birdTimer <= 0) {
      this.birdTimer = G.rand(1.8, 5.5);
      if (day > 0.55 && r > 0.4 && rain < 0.25 && Math.random() > fog * 0.8) this.bird(r);
    }
    // crickets in restored land at night
    this.cricketTimer -= dt;
    if (this.cricketTimer <= 0) {
      this.cricketTimer = G.rand(0.35, 1.1);
      if (night > 0.5 && r > 0.3 && rain < 0.3) this.cricket(r * night);
    }
    // an owl, now and then
    this.owlTimer -= dt;
    if (this.owlTimer <= 0) {
      this.owlTimer = G.rand(25, 60);
      if (night > 0.7 && r > 0.5) this.owl();
    }
    // big drops plinking off leaves and puddles
    this.dripTimer -= dt;
    if (this.dripTimer <= 0) {
      this.dripTimer = G.rand(0.08, 0.5) / Math.max(0.2, rain);
      if (rain > 0.2) this.drip(rain);
    }
    // frogs sing in the rain on restored land
    this.frogTimer -= dt;
    if (this.frogTimer <= 0) {
      this.frogTimer = G.rand(1.5, 5);
      if (rain > 0.3 && r > 0.5) this.frog(r * rain);
    }
  },

  drip(v) {
    const S = this.S, f = G.rand(1400, 3200);
    S.tone(f, { glide: f * 1.6, glideTime: 0.04, dur: 0.06, gain: 0.018 * v, pan: G.rand(-0.9, 0.9), rev: 0.4, bus: S.ambBus });
  },

  frog(v) {   // a soft, round "ribbit"
    const S = this.S, pan = G.rand(-0.8, 0.8), f = G.rand(180, 260);
    const n = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++)
      S.tone(f, { type: 'triangle', glide: f * 1.35, glideTime: 0.09, dur: 0.11, attack: 0.01, gain: 0.05 * v, t: i * 0.17, pan, rev: 0.4, bus: S.ambBus });
  },

  bird(r) {
    const S = this.S, pan = G.rand(-0.8, 0.8), base = G.rand(2400, 4200);
    const notes = 2 + Math.floor(Math.random() * 4), up = Math.random() < 0.5;
    let t = 0;
    for (let i = 0; i < notes; i++) {
      const f = base * G.rand(0.9, 1.15), d = G.rand(0.05, 0.11);
      S.tone(f, { glide: up ? f * 1.35 : f * 0.75, glideTime: d, dur: d + 0.02, gain: 0.025 * r, t, pan, rev: 0.45, bus: S.ambBus });
      t += d + G.rand(0.03, 0.1);
    }
  },

  cricket(v) {
    const S = this.S, pan = G.rand(-0.9, 0.9), f = G.rand(4100, 4700);
    for (let i = 0; i < 3; i++)
      S.tone(f, { dur: 0.03, attack: 0.004, gain: 0.012 * v, t: i * 0.055, pan, rev: 0.35, bus: S.ambBus });
  },

  owl() {
    const S = this.S, pan = G.rand(-0.7, 0.7);
    S.tone(390, { glide: 350, dur: 0.45, attack: 0.08, gain: 0.03, pan, rev: 0.8, bus: S.ambBus });
    S.tone(380, { glide: 330, dur: 0.7, attack: 0.1, gain: 0.03, t: 0.6, pan, rev: 0.8, bus: S.ambBus });
  },
};
