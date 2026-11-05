// G.Music — a little composer that writes the world's music as you play.
// Every piece is a new tune (A B A C, played twice, then a breath of quiet),
// built from the chords of the current mood. What you hear depends on where you
// are: grey land only has a few lonely notes; as colour returns the bass, the
// tune and a high sparkle fade in. The ground picks the tune's instrument, the
// time of day and the weather pick the mood, and friends who are awake nearby
// join in — each kind of friend plays its own part. All the musical choices
// live in src/data/music.js; the instruments in audio/instruments.js.
//
// main.js calls G.Music.update(realDt, info) every frame. The composer keeps
// time even when the sound is off, so the little floating notes and the music
// goals still work; it only makes sound when G.Sound is live.
window.G = window.G || {};

G.Music = {
  clock: 0, base: null, next: 0,    // seconds; base links our clock to the audio clock
  e: 0, bar: 0,                     // eighth note in the bar, bar in the piece
  piece: null, chord: null, inst: 'flute',
  lv: { lonely: 0, bass: 0, melody: 0, sparkle: 0 },
  band: new Map(),                  // friend kind -> { v, d } playing right now
  joinedAt: new Map(),              // friend id -> clock time they last joined
  notes: [],                        // floating ♪ for the renderer (world coords)
  info: { restore: 0, day: 1, phase: 0, rain: 0, fog: 0, ground: 'grass' },
  count: 0,                         // notes played (tests read this)
  lastCaption: { title: '', at: -1e9, key: '' },
  onCaption: null, onJoin: null,

  // ---------- helpers ----------
  pent: [0, 2, 4, 7, 9],
  semi(d) { return this.pent[((d % 5) + 5) % 5] + 12 * Math.floor(d / 5); },   // pentatonic step -> semitones
  hz(s) { return G.MUSIC.root * Math.pow(2, s / 12); },
  isChordTone(d, chord) { const s = this.semi(d); return chord.some(c => (((c - s) % 12) + 12) % 12 === 0); },
  snap(d, chord) { for (const k of [0, 1, -1, 2, -2]) if (this.isChordTone(d + k, chord)) return d + k; return d; },
  fold(s, lo) { s = ((s % 12) + 12) % 12; return s >= lo + 12 ? s - 12 : s < lo ? s + 12 : s; },
  eighth() { return 30 / (this.piece ? this.piece.mood.bpm : 80); },
  get playing() { return this.piece && !this.piece.resting && this.lv.melody > 0.5; },

  moodFor(i) {
    if (i.festival) return 'festival';   // a village festival is near (Night 13)
    if (i.rain > 0.45) return 'rain';
    if (i.fog > 0.5) return 'fog';
    if (i.day < 0.25) return 'night';
    if (i.day >= 0.85) return 'day';
    return i.phase > 0.5 ? 'morning' : 'dusk';
  },
  placeOf(ground) { return G.MUSIC_PLACES[ground] || G.MUSIC_PLACES.grass; },

  // the chord the ambience pad should hold: three notes near D3 (null = no music yet)
  padChord() {
    if (!this.chord) return null;
    return this.chord.map(c => this.fold(c, -4)).sort((a, b) => a - b);
  },

  // ---------- every frame ----------
  // info: { restore, day, phase, rain, fog, ground, player {x,y}, friends [], active, stats }
  update(dt, info) {
    this.info = info;
    const S = G.Sound;
    if (S.ctx && S.ctx.state === 'running') {
      if (this.base === null) this.base = S.now - this.clock;
      this.clock = S.now - this.base;
    } else { this.base = null; this.clock += dt; }

    const L = G.MUSIC.layers, k = Math.min(1, dt / G.MUSIC.fade);
    for (const name in L) this.lv[name] += (G.clamp((info.restore - L[name][0]) / (L[name][1] - L[name][0]), 0, 1) - this.lv[name]) * k;

    const m = this.stats();
    if (m && this.playing) m.heard = (m.heard || 0) + dt;

    if (this.next < this.clock - 0.5) this.next = this.clock;    // woke up after a long pause
    let guard = 0;
    while (this.next < this.clock + 0.15 && guard++ < 16) { this.step(this.next - this.clock); this.next += this.eighth(); }

    for (const n of this.notes) {
      if (n.delay > 0) { n.delay -= dt; continue; }
      n.life -= dt; n.age += dt;
      n.y -= 20 * dt; n.x += Math.sin(n.age * 3 + n.dx * 4) * 12 * dt;
    }
    this.notes = this.notes.filter(n => n.life > 0);
  },

  stats() {
    const s = this.info.active && this.info.stats;
    if (!s) return null;
    return s.music || (s.music = { heard: 0, joined: 0, band: 0, moods: {}, pieces: 0 });
  },

  // ---------- writing a new piece ----------
  newPiece() {
    const i = this.info, key = this.moodFor(i), mood = G.MUSIC_MOODS[key], last = this.piece;
    let names = G.pick(mood.progs);
    if (last && last.key === key && mood.progs.length > 1) while (names === last.names) names = G.pick(mood.progs);
    const prog = names.map(n => G.CHORDS[n]), P = G.MUSIC.phrase;
    const rest = G.MUSIC.restBars[0] + Math.floor(Math.random() * (G.MUSIC.restBars[1] - G.MUSIC.restBars[0] + 1));
    const place = this.placeOf(i.ground), grey = i.restore < 0.4;
    const title = grey ? G.pick(G.MUSIC_GREY_TITLES) : G.pick(mood.titles).replace('{place}', place.place).replace('{name}', i.festival || '').replace(/^\{Place\}/, place.place[0].toUpperCase() + place.place.slice(1));
    this.piece = { key, mood, names, prog, melody: this.compose(mood, prog), playBars: P * G.MUSIC.repeats, total: P * G.MUSIC.repeats + rest, title, resting: false };
    this.bar = 0; this.counter = 19;
    const m = this.stats();
    if (m) m.pieces = (m.pieces || 0) + 1;
    // show the title when the mood or place changes, or after a long while
    const cap = this.lastCaption, ck = grey ? 'grey' : key + place.place;
    if (this.onCaption && (ck !== cap.key || this.clock - cap.at > G.MUSIC.captionGap)) {
      this.onCaption(title, grey);
      this.lastCaption = { title, at: this.clock, key: ck };
    }
  },

  // A tune of G.MUSIC.phrase (8) bars: A A' B B' | A A' B end.
  compose(mood, prog) {
    const beats = mood.beats, R = G.MUSIC_RHYTHMS[beats];
    let deg = 2 + Math.floor(Math.random() * 4);
    const bar = (chord, rhythm) => {
      const out = []; let p = 0;
      for (const len of rhythm) {
        const n = Math.abs(len);
        if (len > 0) {
          deg += G.pick([-2, -1, -1, -1, 0, 1, 1, 1, 2]);
          while (deg > 8) deg -= 3; while (deg < -1) deg += 3;   // keep it singable (snap can add 2 more)
          const strong = p === 0 || (beats === 4 && p === 4) || n >= 3;
          if (strong) deg = this.snap(deg, chord);
          out.push({ p, len: n, d: deg, strong });
        }
        p += n;
      }
      return out;
    };
    const r0 = G.pick(R);
    const a0 = bar(prog[0], r0), a1 = bar(prog[1], Math.random() < 0.5 ? r0 : G.pick(R));
    deg += 2;   // the B part climbs a little higher
    const b0 = bar(prog[2], G.pick(R)), b1 = bar(prog[3], G.pick(R));
    deg = b0.length ? b0[b0.length - 1].d : deg;
    const end = bar(prog[3], G.pick(G.MUSIC_ENDINGS[beats]));
    return [a0, a1, b0, b1, a0, a1, b0, end];
  },

  // ---------- one eighth note ----------
  step(rel) {
    if (this.e === 0) this.startBar();
    const pc = this.piece, mood = pc.mood, per = mood.beats * 2, e = this.e, chord = this.chord, lv = this.lv;
    const q = this.eighth(), barLen = per * q;

    // the grey: a lonely note now and then
    if (lv.lonely > 0.05 && (e === 0 ? Math.random() < 0.5 : e === per / 2 && Math.random() < 0.2))
      this.play('lonely', this.hz(12 + this.fold(G.pick(chord), 0)), { t: rel, gain: 0.05 * lv.lonely, pan: G.rand(-0.5, 0.5) });

    // bass: the root on the first beat, the fifth half way through a 4/4 bar
    if (lv.bass > 0.05) {
      if (e === 0) this.play('bass', this.hz(this.fold(chord[0], -5)), { t: rel, dur: barLen * (mood.beats === 4 ? 0.48 : 0.9), gain: 0.075 * lv.bass });
      if (e === 4 && mood.beats === 4) this.play('bass', this.hz(this.fold(chord[2], -5)), { t: rel, dur: barLen * 0.45, gain: 0.055 * lv.bass });
    }

    // the tune
    const note = pc.resting ? null : pc.melody[this.bar % G.MUSIC.phrase].find(n => n.p === e);
    if (note && lv.melody > 0.05 && !(!note.strong && note.len === 1 && Math.random() > mood.density)) {
      const f = this.hz(12 + this.semi(note.d));
      this.play(this.inst, f, { t: rel, dur: note.len * q * 0.95, gain: 0.055 * lv.melody * (note.strong ? 1 : 0.82) * G.rand(0.9, 1) });
      const m = this.stats();
      if (m && lv.melody > 0.5) m.moods[pc.key] = 1;
      if (lv.melody > 0.5 && this.info.player && Math.random() < (note.strong ? 0.22 : 0.08))
        this.emit(this.info.player.x + G.rand(-10, 10), this.info.player.y - 34, 45, rel, 0.55);
    }

    // a high sparkle once the land is in full colour
    if (lv.sparkle > 0.05 && e % 2 === 1 && Math.random() < 0.3 * mood.density)
      this.play('sparkle', this.hz(12 + this.fold(G.pick(chord), 0)), { t: rel, gain: 0.03 * lv.sparkle, pan: G.rand(-0.7, 0.7) });

    // the band
    for (const [kind, b] of this.band) this.bandPart(G.MUSIC_BAND[kind], b.v, note, rel, e, per, q, barLen);

    if (++this.e >= per) { this.e = 0; this.bar++; }
  },

  startBar() {
    let pc = this.piece;
    if (!pc || this.bar >= pc.total) { this.newPiece(); pc = this.piece; }
    // the mood changed (dusk falls, rain begins): finish this phrase, then rest and start anew
    else if (this.bar < pc.playBars && this.bar % G.MUSIC.phrase === 0 && this.bar > 0 && this.moodFor(this.info) !== pc.key) {
      pc.total = this.bar + 1; pc.playBars = this.bar;
    }
    pc.resting = this.bar >= pc.playBars;
    this.chord = pc.prog[pc.resting ? 0 : this.bar % 4];
    this.inst = pc.mood.inst || this.placeOf(this.info.ground).inst;
    this.updateBand();
  },

  // who is near, awake and playing along (checked once a bar)
  updateBand() {
    const old = this.band, i = this.info, p = i.player;
    this.band = new Map();
    if (!i.active || !p || !i.friends || i.restore < G.MUSIC.band.colour) return;
    const range = G.MUSIC.band.range * G.TILE;
    for (const v of i.friends) {
      if (v.state === 'sleep' || v.state === 'tobed' || !G.MUSIC_BAND[v.kind]) continue;
      const d = Math.hypot(v.x - p.x, v.y - p.y);
      if (d > range) continue;
      const cur = this.band.get(v.kind);
      if (!cur || d < cur.d) this.band.set(v.kind, { v, d });
    }
    const m = this.stats();
    for (const [kind, b] of this.band) {
      if (old.has(kind) && old.get(kind).v === b.v) continue;
      const at = this.joinedAt.get(b.v.id);
      if (at !== undefined && this.clock - at < 90) continue;
      this.joinedAt.set(b.v.id, this.clock);
      if (m) m.joined = (m.joined || 0) + 1;
      if (this.onJoin) this.onJoin(b.v, G.MUSIC_BAND[kind]);
    }
    if (m) m.band = Math.max(m.band || 0, this.band.size);
  },

  // one friend's part for this eighth note
  bandPart(def, v, note, rel, e, per, q, barLen) {
    const chord = this.chord, pan = G.clamp((v.x - (this.info.player ? this.info.player.x : v.x)) / 300, -0.8, 0.8);
    const play = (f, o) => { this.play(def.inst, f, { pan, t: rel, ...o }); this.emit(v.x + G.rand(-6, 6), v.y - 32, v.hue, rel, 1); };
    switch (def.part) {
      case 'harmony':   // sings under the tune, or hums the root while it rests
        if (note && (note.strong || note.len >= 2)) {
          let d = this.snap(note.d - 2, chord);
          if (d >= note.d) d = note.d - 2;
          play(this.hz(12 + this.semi(d)), { dur: note.len * q * 0.95, gain: 0.032 });
        } else if (this.piece.resting && e === 0) play(this.hz(12 + this.fold(chord[0], -3)), { dur: barLen * 0.9, gain: 0.028 });
        break;
      case 'arp': {     // rolls up and down the chord
        if (e % 2 === 1 && Math.random() > 0.4) break;
        const c = chord.map(s => this.fold(s, 0)).sort((a, b) => a - b), seq = [c[0], c[1], c[2], c[0] + 12, c[2], c[1]];
        play(this.hz(12 + seq[e % seq.length]), { gain: 0.026 });
        break;
      }
      case 'rhythm':    // a soft tock on the off-beats
        if (per === 8 ? (e === 2 || e === 6) : (e === 2 || e === 4)) play(this.hz(this.fold(chord[0], -5)), { gain: 0.035, low: e === 6 });
        break;
      case 'chime':     // wind chimes at the start of most bars
        if (e === 0 && Math.random() < 0.75) play(this.hz(12 + this.fold(G.pick(chord), 0)), { gain: 0.026 });
        break;
      case 'counter':   // long, slow notes that step gently from chord to chord
        if (e === 0 || (per === 8 && e === 4)) {
          let best = 0, bd = 99;
          for (const c of chord) for (const o of [0, 12, 24]) { const s = this.fold(c, 0) + o; if (s < 7 || s > 21) continue; const dd = Math.abs(s - this.counter); if (dd < bd) { bd = dd; best = s; } }
          this.counter = best;
          play(this.hz(best), { dur: barLen * (per === 8 ? 0.47 : 0.92), gain: 0.04 });
        }
        break;
    }
  },

  play(inst, f, o) {
    this.count++;
    const S = G.Sound;
    if (!S.live || !S.musicBus || !G.INSTRUMENTS[inst]) return;
    try { G.INSTRUMENTS[inst](S, f, o); } catch (e) { /* never let a note break the game */ }
  },

  // a little floating note (shown when it actually sounds: after `delay` seconds)
  emit(x, y, hue, delay, a) {
    if (this.notes.length > 50) return;
    this.notes.push({ x, y, hue, delay, a, life: 1.8, age: 0, dx: Math.random(), g: G.pick(['♪', '♫', '♪', '♩']) });
  },
};
