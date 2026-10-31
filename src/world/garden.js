// Gardens: planted sprouts and saplings grow a little every moment — fast in
// coloured land, three times faster in damp soil (watering can or rain), and
// barely at all in the grey. When fully grown the planting is replaced by a
// real natural object (world.grown) that can be gathered like any other.
window.G = window.G || {};

G.Garden = class {
  constructor() {
    this.timer = 0;
    this.fx = null;        // { burst(x, y, color, n), sound(name, x), touch(tx, ty) } — set by main
    this.onGrown = null;   // (structure, objectType, firstTime) when something finishes growing
  }

  // the planted things in the world
  *plants(world) {
    for (const st of world.structures.values()) if (G.STRUCTURES[st.type].grow) yield st;
  }

  // what this planting will become (the rare kind is decided by the spot, so it never changes)
  intoOf(world, st) {
    const k = G.GROW_KINDS[G.STRUCTURES[st.type].grow];
    if (k.rare && G.hash2(st.tx, st.ty, world.seed + 404) < k.rareChance) return k.rare;
    return k.into;
  }

  // how fast it grows right now: fraction of full growth per second
  rate(state, st) {
    const w = state.world, k = G.GROW_KINDS[G.STRUCTURES[st.type].grow], S = G.GARDEN;
    const f = w.restoreAt((st.tx + 0.5) * G.TILE, (st.ty + 0.5) * G.TILE, w.lights);
    const colour = S.greySpeed + (1 - S.greySpeed) * G.clamp(f / S.colourNeeded, 0, 1);
    return colour * (st.wet > 0 ? S.wetSpeed : 1) / k.time;
  }

  update(dt, state) {
    if (!state.world || !state.running) return;
    this.timer += dt;
    if (this.timer < 0.25) return;
    const step = this.timer; this.timer = 0;
    const w = state.world, raining = state.weather && state.weather.rain > 0.3;
    const done = [];
    for (const st of this.plants(w)) {
      if (raining) st.wet = Math.max(st.wet || 0, 20);   // rain waters every garden
      st.g = Math.min(1, (st.g || 0) + this.rate(state, st) * step);
      st.wet = Math.max(0, (st.wet || 0) - step);
      if (st.g >= 1) done.push(st);
    }
    for (const st of done) this.finish(state, st);
  }

  // a planting has grown: it becomes a real bloom / moonflower / tree
  finish(state, st) {
    const w = state.world, into = this.intoOf(w, st), x = (st.tx + 0.5) * G.TILE, y = (st.ty + 0.5) * G.TILE;
    w.remove(st.tx, st.ty);
    w.grown.set(G.key(st.tx, st.ty), into);
    const grown = state.stats.grown || (state.stats.grown = {});
    const first = !grown[into];
    grown[into] = (grown[into] || 0) + 1;
    if (this.fx) {
      this.fx.touch(st.tx, st.ty);
      this.fx.sound('grow', x);
      this.fx.burst(x, y - 8, into === 'tree' ? 'rgba(160,230,130,A)' : into === 'moonflower' ? 'rgba(170,215,255,A)' : 'rgba(255,200,230,A)', 22);
    }
    if (this.onGrown) this.onGrown(st, into, first);
  }

  // the nearest dry planting within reach of a point, or null
  dryNear(world, x, y, reach) {
    let best = null, bd = reach;
    for (const st of this.plants(world)) {
      if (st.wet > 0) continue;
      const d = Math.hypot((st.tx + 0.5) * G.TILE - x, (st.ty + 0.5) * G.TILE - y);
      if (d <= bd) { bd = d; best = st; }
    }
    return best;
  }

  water(state, st) {
    st.wet = G.GARDEN.wetTime;
    state.stats.watered = (state.stats.watered || 0) + 1;
    if (this.fx) {
      const x = (st.tx + 0.5) * G.TILE, y = (st.ty + 0.5) * G.TILE;
      this.fx.sound('water', x);
      this.fx.burst(x, y - 4, 'rgba(150,210,255,A)', 14);
    }
  }

  // a short description for when the player clicks a planting
  describe(state, st) {
    const def = G.STRUCTURES[st.type], pct = Math.floor((st.g || 0) * 100);
    const f = state.world.restoreAt((st.tx + 0.5) * G.TILE, (st.ty + 0.5) * G.TILE, state.world.lights);
    const why = f < G.GARDEN.colourNeeded * 0.5 ? ' It is struggling in the grey — plants need colour around them.'
      : st.wet > 0 ? ' The soil is damp, so it is growing fast.'
      : G.Crafting.owns(state, 'can') ? ' The soil is dry — press E to water it.' : ' A little water (rain, or a watering can) would help it grow.';
    return `${def.name} — ${pct}% grown.${why}`;
  }
};
