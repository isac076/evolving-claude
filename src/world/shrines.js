// G.Shrines — where the four Ember Shrines stand (Night 15).
// Each world has the same four shrines in the same places, chosen from the seed
// using only the raw ground (world.groundType), so it never recurses into tileAt.
// Shrine i stands G.SHRINE.dist[i] tiles from the start, each in a different
// direction. What you have done there is saved as structures: a lit bowl is an
// 'emberflame', a kindled hearth a 'shrineflame' (see data/shrines.js).
window.G = window.G || {};

G.Shrines = {
  // all shrines of this world (memoised): [{ i, id, def, name, tx, ty, x0, y0, w, h, rows, bowls: [{tx, ty}] }]
  list(world) {
    if (world.shrineList) return world.shrineList;
    const rows = G.SHRINE_STAMP, w = rows[0].length, h = rows.length, s = world.seed;
    const sp = world.spawnSpot(), a0 = G.hash2(3, 7, s + 901) * 6.2832, out = [];
    const water = (x, y) => !!G.TILES[world.groundType(x, y, true)].water;
    const fits = (cx, cy) => {   // the whole stamp (and a one-tile rim) on land, with step-every-other for speed
      for (let y = -Math.floor(h / 2) - 1; y <= Math.floor(h / 2) + 1; y++)
        for (let x = -Math.floor(w / 2) - 1; x <= Math.floor(w / 2) + 1; x++)
          if (water(cx + x, cy + y)) return false;
      return true;
    };
    G.SHRINES.forEach((def, i) => {
      const base = a0 + i * 1.5708 + (G.hash2(i, 11, s + 903) - 0.5) * 0.5, d0 = G.SHRINE.dist[i] || 50 + i * 16;
      let spot = null;
      for (let k = 0; k < 240 && !spot; k++) {   // spiral out a little from the ideal spot until the land fits
        const ring = Math.floor(k / 12), j = k % 12;
        const a = base + (j - 5.5) * 0.045 * (1 + ring * 0.6);
        const d = d0 + (ring % 2 ? -1 : 1) * Math.ceil(ring / 2) * 5;
        const cx = Math.round(sp.tx + Math.cos(a) * d), cy = Math.round(sp.ty + Math.sin(a) * d);
        if (fits(cx, cy)) spot = { cx, cy };
      }
      if (!spot) spot = { cx: Math.round(sp.tx + Math.cos(base) * d0), cy: Math.round(sp.ty + Math.sin(base) * d0) };
      const x0 = spot.cx - Math.floor(w / 2), y0 = spot.cy - Math.floor(h / 2), bowls = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (rows[y][x] === 'B') bowls.push({ tx: x0 + x, ty: y0 + y });
      out.push({ i, id: def.id, def, name: def.name, hue: def.hue, tx: spot.cx, ty: spot.cy, x0, y0, w, h, rows, bowls });
    });
    return (world.shrineList = out);
  },

  // what a shrine puts on this tile: undefined, or { site, ch }
  pieceAt(world, tx, ty) {
    for (const site of this.list(world)) {
      const x = tx - site.x0, y = ty - site.y0;
      if (x < 0 || y < 0 || x >= site.w || y >= site.h) continue;
      return { site, ch: site.rows[y][x] };
    }
    return undefined;
  },

  // is there a shrine within r tiles of this tile? (ruins keep away)
  near(world, tx, ty, r) {
    return this.list(world).some(s => Math.hypot(s.tx - tx, s.ty - ty) < r);
  },

  // which bowl of its shrine stands on this tile (0..3), or -1
  bowlIndex(site, tx, ty) { return site.bowls.findIndex(b => b.tx === tx && b.ty === ty); },
  isBowlLit(world, b) { const st = world.structureAt(b.tx, b.ty); return !!st && st.type === 'emberflame'; },
  litBowls(world, site) { return site.bowls.filter(b => this.isBowlLit(world, b)).length; },
  isKindled(world, site) { const st = world.structureAt(site.tx, site.ty); return !!st && st.type === 'shrineflame'; },
  kindledCount(world) { return this.list(world).filter(s => this.isKindled(world, s)).length; },

  // the shrine whose stamp holds this tile (for a lit bowl's or hearth's colour)
  at(world, tx, ty) { const p = this.pieceAt(world, tx, ty); return p ? p.site : null; },
  hueAt(world, tx, ty) { const s = this.at(world, tx, ty); return s ? s.hue : 30; },

  // the shrines the player knows about: found ones, plus all of them once the memory stones have told
  known(state) {
    const st = state.stats.shrines || {}, found = st.found || {};
    return this.list(state.world).filter(s => found[s.id] || st.sensed);
  },

  // the nearest shrine you know of that isn't kindled yet (the ember arrow points there), or null
  nextToKindle(state) {
    const p = state.player, w = state.world;
    let best = null, bd = Infinity;
    for (const s of this.known(state)) {
      if (this.isKindled(w, s)) continue;
      const d = Math.hypot(s.tx - p.tx, s.ty - p.ty);
      if (d < bd) { bd = d; best = s; }
    }
    return best;
  },

  // "4 Wood" / "4 Wood, 3 Glow petal"
  costText(cost) { return Object.entries(cost).map(([k, n]) => `${n} ${G.ITEMS[k].name}`).join(', '); },
};
