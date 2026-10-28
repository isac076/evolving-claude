// G.Weather — the sky's moods. One kind of weather (data/weather.js) at a time;
// when it runs out the next is picked. Every value (rain, wind, fog, cloud,
// shadows) eases slowly toward the new weather, so changes roll in gently.
// It also keeps the rainbow that follows rain on a bright day, a little wind
// gust (G.windNow, read by plant sprites), and helps plants regrow in the rain.
window.G = window.G || {};

G.Weather = class {
  constructor() {
    this.kind = 'clear';
    this.left = 150;             // seconds until the weather changes
    this.v = { rain: 0, wind: 0.12, fog: 0, cloud: 0, shadows: 0.35 };
    this.dir = 1;                // wind blows to the right (1) or left (-1)
    this.gustT = 0;
    this.rainbow = 0;            // seconds of rainbow left
    this.rainbowA = 0;           // how visible it is right now, 0..1
    this.wasRainy = false;
    this.growT = 0;
    this.onChange = null;        // called with (kind) when new weather begins
    this.onRainbow = null;       // called when a rainbow appears
    G.windNow = this.v.wind;
  }

  get def() { return G.WEATHER[this.kind] || G.WEATHER.clear; }

  pickNext() {
    const after = this.def.after;
    const weights = after || Object.fromEntries(Object.entries(G.WEATHER).map(([k, d]) => [k, d.weight]));
    let total = 0;
    for (const k in weights) if (k !== this.kind && G.WEATHER[k]) total += weights[k];
    let r = Math.random() * total;
    for (const k in weights) {
      if (k === this.kind || !G.WEATHER[k]) continue;
      r -= weights[k];
      if (r <= 0) return k;
    }
    return 'clear';
  }

  // Start a kind of weather. instant = skip the slow fade (used by tests).
  set(kind, instant) {
    if (!G.WEATHER[kind]) return;
    const before = this.def;
    this.kind = kind;
    const d = this.def;
    this.left = G.rand(d.dur[0], d.dur[1]);
    if (Math.random() < 0.3) this.dir = -this.dir;
    if (instant) for (const k in this.v) this.v[k] = d[k] || 0;
    if (before.rainbow) this.wasRainy = true;
    if (this.onChange) this.onChange(kind);
  }

  update(dt, state) {
    this.left -= dt;
    if (this.left <= 0) this.set(this.pickNext());
    const d = this.def;
    // ease every value toward this weather (rain comes and goes a little faster)
    for (const k in this.v) {
      const target = d[k] || 0, rate = k === 'rain' ? 0.12 : 0.07;
      this.v[k] += (target - this.v[k]) * (1 - Math.exp(-dt * rate * 2.5));
    }
    // gusts: the wind breathes in and out
    this.gustT += dt;
    const gust = 0.75 + 0.25 * Math.sin(this.gustT * 0.8) * Math.sin(this.gustT * 0.31 + 1.3);
    G.windNow = this.v.wind * gust;
    G.windDir = this.dir;

    // a rainbow, when the rain has cleared away on a bright day
    const day = G.daylight(state.time);
    if (this.wasRainy && !d.rainbow && this.v.rain < 0.12) {
      this.wasRainy = false;
      if (day > 0.6 && this.v.fog < 0.5) {
        this.rainbow = G.RAINBOW_TIME;
        if (this.onRainbow) this.onRainbow();
      }
    }
    if (this.rainbow > 0) this.rainbow -= dt;
    const want = this.rainbow > 0 ? G.clamp(this.rainbow / 8, 0, 1) * G.clamp((day - 0.45) / 0.2, 0, 1) * (1 - this.v.rain) : 0;
    this.rainbowA += (want - this.rainbowA) * Math.min(1, dt * 0.5);

    // rain helps gathered plants grow back: up to twice as fast in a downpour
    this.growT += dt;
    if (this.growT >= 1 && state.world) {
      const boost = this.v.rain * this.growT;
      this.growT = 0;
      if (boost > 0.01) {
        const w = state.world;
        for (const [k, t] of w.harvested) {
          const tile = w.tileAt(...k.split(',').map(Number));
          if (tile.obj !== 'rock' && tile.obj !== 'crystal') w.harvested.set(k, t - boost);
        }
      }
    }
  }

  // how rainy it is, for creatures and the soundscape (0..1)
  get rain() { return this.v.rain; }

  serialize() { return { kind: this.kind, left: Math.round(this.left), rainbow: Math.round(this.rainbow) }; }
  load(d) {
    if (!d || !G.WEATHER[d.kind]) return;
    this.kind = d.kind; this.left = d.left > 0 ? d.left : 60;
    for (const k in this.v) this.v[k] = this.def[k] || 0;
    this.rainbow = d.rainbow > 0 ? d.rainbow : 0;
    this.rainbowA = this.rainbow > 0 ? 1 : 0;
    this.wasRainy = !!this.def.rainbow;
  }
};
