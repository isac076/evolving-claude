// G.Seasons — the turning year. The season comes straight from the clock
// (state.time), so nothing new is saved: every G.SEASON.days days the next
// season begins, blending in over G.SEASON.turn days. Each frame main.js calls
// update(state); the blended values land in G.SEASON_NOW, which the sprites,
// the weather, gardens, creatures, the soundscape and the map read.
window.G = window.G || {};

G.Seasons = {
  index: -1,          // the season the player is in (0 spring … 3 winter)
  version: 0,         // changes whenever the blended colours step (the minimap redraws)
  onChange: null,     // called with (season def, first time ever) when a new season begins

  // where in the year a moment falls: { i: season index, k: how far into the next one (0..1), day: day of the season }
  phase(time) {
    const S = G.SEASON, len = S.days * G.DAY_LENGTH, p = Math.max(0, time) / len;
    const i = Math.floor(p), u = p - i, b = S.turn / S.days;
    let from = i, k = 0;
    if (u > 1 - b / 2) k = (u - (1 - b / 2)) / b;                 // the next season is arriving
    else if (u < b / 2 && i > 0) { from = i - 1; k = 0.5 + u / b; }   // the last one is still fading
    k = Math.round(k * k * (3 - 2 * k) * S.steps) / S.steps;      // smooth, in small steps
    return { i: i % 4, from: ((from % 4) + 4) % 4, k, day: Math.floor(u * S.days) + 1 };
  },

  // every number of two seasons, blended
  blend(a, b, k) {
    const mix = (x, y) => x + (y - x) * k, o = {};
    for (const key of ['snow', 'autumn', 'bare', 'blossom', 'leafL', 'tufts', 'grow', 'birds', 'crickets', 'fireflies']) o[key] = mix(a[key], b[key]);
    o.tint = a.tint.map((v, j) => mix(v, b.tint[j]));
    o.tiles = {};
    const sn = G.SNOW;
    for (const type in G.TILES) {
      const d = G.TILES[type], ga = a.ground[type] || [0, 0, 0], gb = b.ground[type] || [0, 0, 0];
      let h = d.h + mix(ga[0], gb[0]), s = d.s + mix(ga[1], gb[1]), l = d.l + mix(ga[2], gb[2]);
      const c = o.snow * (sn.cover[type] || 0), bh = h, bs = Math.max(0, s), bl = l;   // snow lies over the land
      if (c > 0) { h += (sn.h - h) * c; s += (sn.s - s) * c; l += (sn.l - l) * c; }
      o.tiles[type] = { h: Math.round(h * 2) / 2, s: Math.max(0, Math.round(s * 2) / 2), l: Math.round(l * 2) / 2, snow: c, rank: d.rank, water: d.water,
        base: [bh, bs, bl] };   // the colour under the snow (faded land shows more of it)
    }
    // falling things: the stronger season's, fading in with it
    const da = a.drift ? a.drift.n * (1 - k) : 0, db = b.drift ? b.drift.n * k : 0;
    o.drift = da >= db ? (a.drift && { ...a.drift, n: da }) : { ...b.drift, n: db };
    o.weather = {};
    for (const w in G.WEATHER) o.weather[w] = mix((a.weather || {})[w] || 1, (b.weather || {})[w] || 1);
    return o;
  },

  // the blended season for a moment in time (cheap enough to call any time)
  at(time) {
    const ph = this.phase(time), L = G.SEASONS;
    const now = ph.k > 0 ? this.blend(L[ph.from], L[(ph.from + 1) % 4], ph.k) : this.blend(L[ph.i], L[ph.i], 0);
    now.def = L[ph.i]; now.id = now.def.id; now.day = ph.day; now.key = ph.from + ':' + ph.k;
    return now;
  },

  update(state, quiet) {
    const ph = this.phase(state.time), key = ph.from + ':' + ph.k;
    if (key !== this.key) { this.key = key; G.SEASON_NOW = this.at(state.time); this.version++; }
    if (ph.i === this.index) return;
    const first = this.index < 0;
    this.index = ph.i;
    const st = state.stats, def = G.SEASONS[ph.i];
    if (!st) return;
    const s = st.seasons || (st.seasons = { seen: {}, turns: 0 });
    const firstTime = !s.seen[def.id];
    s.seen[def.id] = 1;
    if (first || quiet) return;   // just loaded: no fanfare for the season you were already in
    s.turns++;
    if (this.onChange) this.onChange(def, firstTime);
  },

  // footprints in the snow: main adds one per step, the renderer draws them over the ground
  prints: [],
  step(world, x, y, alt) {
    const tile = world.tileAt(Math.floor(x / G.TILE), Math.floor(y / G.TILE)), d = G.SEASON_NOW.tiles[tile.type];
    if ((d.snow < 0.4 && !G.TILES[tile.type].snowy) || world.structureAt(Math.floor(x / G.TILE), Math.floor(y / G.TILE))) return;
    this.prints.push({ x: x + (alt ? 3 : -3), y: y + 6, life: 1 });
    if (this.prints.length > 80) this.prints.shift();
  },
  drawPrints(ctx, camX, camY, dt) {
    if (!this.prints.length) return;
    for (const p of this.prints) p.life -= dt / 40;   // the snow fills them in again slowly
    this.prints = this.prints.filter(p => p.life > 0);
    for (const p of this.prints) {
      const a = Math.min(1, p.life * 3), x = p.x - camX, y = p.y - camY;
      ctx.fillStyle = `rgba(80,100,150,${(0.42 * a).toFixed(3)})`;
      ctx.beginPath(); ctx.ellipse(x, y, 2.8, 1.8, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${(0.5 * a).toFixed(3)})`;   // a bright rim where the snow was pushed up
      ctx.fillRect(x - 2.4, y + 1.6, 4.8, 0.9);
    }
  },

  // forget the current season (a new world or a loaded save starts fresh)
  reset() { this.index = -1; this.key = null; this.prints = []; },

  // is the rain falling as snow right now? 0..1
  snowing() { const n = G.SEASON_NOW; return n ? G.clamp((n.snow - 0.45) / 0.3, 0, 1) : 0; },

  // how often a kind of weather comes in this season (1 = as usual)
  weatherMul(kind) { const n = G.SEASON_NOW; return n && n.weather[kind] !== undefined ? n.weather[kind] : 1; },

  // may this creature appear now?
  allows(def) { return !def.seasons || !G.SEASON_NOW || def.seasons.includes(G.SEASON_NOW.id); },
};

G.SEASON_NOW = G.Seasons.at(0);
