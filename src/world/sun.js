// G.Sun — where the Sun's Hearth stands (Night 20; data in src/data/sun.js).
// One per world, chosen from the seed using only the raw ground (like the Ember
// Shrines), so tileAt can ask pieceAt without recursion: G.SUN.dist tiles from
// the start, a little past the farthest shrine's direction. Its four sockets
// burn by themselves for every shrine that is kindled; the risen Sun is a
// 'sunflame' structure on the altar (see world.rebuildLights → world.floor).
window.G = window.G || {};

G.Sun = {
  // the site (memoised): { tx, ty, x0, y0, w, h, rows, sockets: [{tx, ty, i}], name }
  site(world) {
    if (world.sunSite) return world.sunSite;
    const rows = G.SUN_STAMP, w = rows[0].length, h = rows.length, sp = world.spawnSpot();
    const shrines = G.Shrines.list(world), far = shrines[shrines.length - 1];
    const water = (x, y) => !!G.TILES[world.groundType(x, y, true)].water;
    const fits = (cx, cy) => {
      for (let y = -Math.floor(h / 2) - 1; y <= Math.floor(h / 2) + 1; y++)
        for (let x = -Math.floor(w / 2) - 1; x <= Math.floor(w / 2) + 1; x++)
          if (water(cx + x, cy + y)) return false;
      return !shrines.some(s => Math.hypot(s.tx - cx, s.ty - cy) < 20);
    };
    const base = Math.atan2(far.ty - sp.ty, far.tx - sp.tx) + G.SUN.turn, d0 = G.SUN.dist;
    let spot = null;
    for (let k = 0; k < 300 && !spot; k++) {   // spiral out from the ideal spot until the land fits
      const ring = Math.floor(k / 12), j = k % 12;
      const a = base + (j - 5.5) * 0.04 * (1 + ring * 0.6);
      const d = d0 + (ring % 2 ? -1 : 1) * Math.ceil(ring / 2) * 5;
      const cx = Math.round(sp.tx + Math.cos(a) * d), cy = Math.round(sp.ty + Math.sin(a) * d);
      if (fits(cx, cy)) spot = { cx, cy };
    }
    if (!spot) spot = { cx: Math.round(sp.tx + Math.cos(base) * d0), cy: Math.round(sp.ty + Math.sin(base) * d0) };
    const x0 = spot.cx - Math.floor(w / 2), y0 = spot.cy - Math.floor(h / 2), sockets = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
      if (rows[y][x] === 'S') sockets.push({ tx: x0 + x, ty: y0 + y, i: sockets.length });
    return (world.sunSite = { tx: spot.cx, ty: spot.cy, x0, y0, w, h, rows, sockets, name: 'The Sun\'s Hearth', hue: G.SUN.hue });
  },

  // what the hearth puts on this tile: undefined, or { site, ch }
  pieceAt(world, tx, ty) {
    const s = this.site(world), x = tx - s.x0, y = ty - s.y0;
    if (x < 0 || y < 0 || x >= s.w || y >= s.h) return undefined;
    return { site: s, ch: s.rows[y][x] };
  },

  near(world, tx, ty, r) { const s = this.site(world); return Math.hypot(s.tx - tx, s.ty - ty) < r; },

  // which socket stands here (-1 if none), and the shrine it waits for
  socketAt(world, tx, ty) { return this.site(world).sockets.findIndex(k => k.tx === tx && k.ty === ty); },
  shrineOf(world, i) { return G.Shrines.list(world)[i]; },
  socketLit(world, i) { const sh = this.shrineOf(world, i); return !!sh && G.Shrines.isKindled(world, sh); },
  litSockets(world) { let n = 0; for (let i = 0; i < 4; i++) if (this.socketLit(world, i)) n++; return n; },

  // the risen Sun (a structure on the altar)
  isLit(world) { const s = this.site(world), st = world.structureAt(s.tx, s.ty); return !!st && st.type === 'sunflame'; },

  // known = found, or sensed once all four shrines burn
  known(state) { const st = state.stats.sun; return !!(st && (st.found || st.sensed)); },
  stepsTo(state) { const s = this.site(state.world), p = state.player; return Math.round(Math.hypot(s.tx - p.tx, s.ty - p.ty) / 5) * 5; },
  dirTo(state) { const s = this.site(state.world), p = state.player; return G.Ruins.direction(p.tx, p.ty, s.tx, s.ty); },

  // where the golden guide arrow points: the hearth, while it is known and the Sun not yet risen
  guideTarget(state) {
    if (!this.known(state) || this.isLit(state.world)) return null;
    const s = this.site(state.world);
    return { tx: s.tx, ty: s.ty, hue: G.SUN.hue, name: s.name, from: G.SUN.guideFrom };
  },
};
