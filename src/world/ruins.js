// G.Ruins — where the ruins of the old world stand (Night 11).
// The world is cut into cells (G.RUIN.cell tiles wide). Each cell may hold one
// ruin, chosen from the seed, so every world always has the same ruins in the
// same places and nothing about them needs saving except what you've done there
// (found = stats.ruins.found, a woken memory stone = a 'memorystone' structure).
window.G = window.G || {};

G.Ruins = {
  // The ruin site in a cell, or null. Memoised on the world.
  siteOf(world, cx, cy) {
    const memo = world.ruinCells || (world.ruinCells = new Map());
    const k = cx + ',' + cy;
    if (memo.has(k)) return memo.get(k);
    const site = this.makeSite(world, cx, cy);
    memo.set(k, site);
    return site;
  },

  makeSite(world, cx, cy) {
    const R = G.RUIN, C = R.cell, s = world.seed;
    if (G.hash2(cx, cy, s + 501) >= R.chance) return null;
    const kinds = Object.keys(G.RUIN_SITES);
    const kind = kinds[Math.floor(G.hash2(cx, cy, s + 503) * kinds.length)], def = G.RUIN_SITES[kind];
    const flip = G.hash2(cx, cy, s + 505) < 0.5;
    const rows = def.stamp.map(r => {
      let row = r.padEnd(def.stamp[0].length, ' ');
      if (flip) row = [...row].reverse().map(ch => ch === 'A' ? 'a' : ch === 'a' ? 'A' : ch).join('');
      return row;
    });
    const w = rows[0].length, h = rows.length;
    const spawn = world.spawnSpot();
    for (let i = 0; i < 6; i++) {   // a few tries to find ground that suits it
      const ctx = cx * C + 6 + Math.floor(G.hash2(cx * 3 + i, cy, s + 507) * (C - 13));
      const cty = cy * C + 6 + Math.floor(G.hash2(cx, cy * 3 + i, s + 509) * (C - 13));
      if (Math.hypot(ctx - spawn.tx, cty - spawn.ty) < R.awayFromStart) continue;
      if (!def.ground.includes(world.groundType(ctx, cty))) continue;
      const x0 = ctx - Math.floor(w / 2), y0 = cty - Math.floor(h / 2);
      let ok = true;
      for (let y = y0 - 1; y <= y0 + h && ok; y++) for (let x = x0 - 1; x <= x0 + w && ok; x++)
        if (G.TILES[world.groundType(x, y)].water) ok = false;
      if (!ok) continue;
      const site = { id: cx + ',' + cy, kind, def, name: def.name, x0, y0, w, h, rows, tx: ctx, ty: cty, memory: null };
      for (let y = 0; y < h; y++) { const m = rows[y].indexOf('M'); if (m >= 0) site.memory = { tx: x0 + m, ty: y0 + y }; }
      return site;
    }
    return null;
  },

  // What a ruin puts on this tile: undefined (no ruin here) or { site, ch }.
  pieceAt(world, tx, ty) {
    const C = G.RUIN.cell, site = this.siteOf(world, Math.floor(tx / C), Math.floor(ty / C));
    if (!site) return undefined;
    const x = tx - site.x0, y = ty - site.y0;
    if (x < 0 || y < 0 || x >= site.w || y >= site.h) return undefined;
    return { site, ch: site.rows[y][x] };
  },

  // Ruin sites in the cells around a tile (cells within `r` cells).
  around(world, tx, ty, r = 1) {
    const C = G.RUIN.cell, ccx = Math.floor(tx / C), ccy = Math.floor(ty / C), out = [];
    for (let cy = ccy - r; cy <= ccy + r; cy++) for (let cx = ccx - r; cx <= ccx + r; cx++) {
      const s = this.siteOf(world, cx, cy); if (s) out.push(s);
    }
    return out;
  },

  // Has this site's memory stone been woken?
  isRead(world, site) {
    if (!site.memory) return true;
    const st = world.structureAt(site.memory.tx, site.memory.ty);
    return !!st && st.type === 'memorystone';
  },

  // The nearest ruin you haven't found yet (for friends' hints), or null.
  nearestUnfound(world, stats, tx, ty, r = 3) {
    const found = (stats.ruins && stats.ruins.found) || {};
    let best = null, bd = Infinity;
    for (const s of this.around(world, tx, ty, r)) {
      if (found[s.id]) continue;
      const d = Math.hypot(s.tx - tx, s.ty - ty);
      if (d < bd) { bd = d; best = s; }
    }
    return best;
  },

  // A compass word from one tile toward another ("north", "south-east"…).
  direction(fx, fy, tx, ty) {
    const a = Math.atan2(ty - fy, tx - fx), i = ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;
    return ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'][i];
  },
};
