// G.Isles — where the Far Isles are (Night 27). Islands rise only out of open
// sea: deep water in the base ground, with no other land within reach. At most
// one island stands in each G.ISLES.cell, its middle well inside the cell so an
// island never crosses a cell edge (a tile only ever asks its own cell). One
// island is always out at sea within a sail of the start (first(): the nearest
// open sea, searched outward ring by ring). Each island is a wobbly ring: a
// green heart ('isle'), pale coral sand ('strand') and a turquoise 'lagoon'.
// Uses only the raw elevation, so it never recurses into tileAt.
window.G = window.G || {};

G.Isles = {
  // is there room for an island of radius r here? (deep in the middle, open water all around)
  fits(world, cx, cy, r) {
    const I = G.ISLES;
    if (world.elevation(cx, cy) >= I.deep) return false;
    for (const rad of [r * 0.6, r + 1, r + I.lagoon + 2.5])
      for (let k = 0; k < 16; k++) {
        const a = k / 16 * 6.2832;
        if (world.elevation(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad) >= I.clear) return false;
      }
    return true;
  },

  // an island's shape: its middle, radius and three wobbles (so no two are alike)
  make(world, tx, ty, r) {
    const h = k => G.hash2(tx, ty, world.seed + 7070 + k) * 6.2832;
    return { tx, ty, r, p: [h(1), h(2), h(3)], reach: r * 1.35 + G.ISLES.lagoon * 1.3 + 1 };
  },

  // the island every world has within a sail of the start
  first(world) {
    if (world.isleFirst) return world.isleFirst;
    const F = G.ISLES.first, sp = world.spawnSpot(), a0 = G.hash2(9, 5, world.seed + 7171) * 6.2832;
    let best = null;
    for (let d = F.from; d <= F.to && !best; d += 8) {
      const n = Math.max(16, Math.round(d / 5));
      for (let i = 0; i < n; i++) {
        const a = a0 + i / n * 6.2832, cx = Math.round(sp.tx + Math.cos(a) * d), cy = Math.round(sp.ty + Math.sin(a) * d);
        if (this.fits(world, cx, cy, F.r)) { best = this.make(world, cx, cy, F.r); break; }
      }
    }
    // a world with no open sea nearby (rare): the island still rises, a little way out, with its lagoon around it
    if (!best) { best = this.make(world, sp.tx + Math.round(Math.cos(a0) * F.from * 1.5), sp.ty + Math.round(Math.sin(a0) * F.from * 1.5), F.r); best.forced = true; }
    best.first = true;
    return (world.isleFirst = best);
  },

  // the island of a cell (or null): its middle sits in the inner part of the cell, so its reach stays inside
  inCell(world, cx, cy) {
    const memo = world.isleMemo || (world.isleMemo = new Map()), key = cx + ',' + cy;
    let isl = memo.get(key);
    if (isl !== undefined) return isl;
    const I = G.ISLES, C = I.cell;
    const tx = Math.floor((cx + 0.28 + G.hash2(cx, cy, world.seed + 7272) * 0.44) * C);
    const ty = Math.floor((cy + 0.28 + G.hash2(cy, cx, world.seed + 7373) * 0.44) * C);
    const r = I.r[0] + G.hash2(cx, cy, world.seed + 7474) * (I.r[1] - I.r[0]);
    const sp = world.spawnSpot(), f = this.first(world);
    isl = null;
    if (Math.hypot(tx - sp.tx, ty - sp.ty) > I.keepAway && Math.hypot(tx - f.tx, ty - f.ty) > f.reach + 14 + r && this.fits(world, tx, ty, r))
      isl = this.make(world, tx, ty, r);
    if (memo.size > 4000) memo.clear();
    memo.set(key, isl);
    return isl;
  },

  // the island whose reach covers this tile, or null
  near(world, tx, ty) {
    const f = this.first(world);
    if (Math.abs(tx - f.tx) < f.reach && Math.abs(ty - f.ty) < f.reach) return f;
    const C = G.ISLES.cell, isl = this.inCell(world, Math.floor(tx / C), Math.floor(ty / C));
    return isl && Math.abs(tx - isl.tx) < isl.reach && Math.abs(ty - isl.ty) < isl.reach ? isl : null;
  },

  // which island ground this sea tile is ('isle', 'strand', 'lagoon') or null. e = its elevation.
  at(world, tx, ty, e) {
    if (e >= 0.42) {   // land stays land — only the island the world had to force out of land may cover it
      const f = this.first(world);
      if (!f.forced || Math.abs(tx - f.tx) >= f.reach || Math.abs(ty - f.ty) >= f.reach) return null;
    }
    const isl = this.near(world, tx, ty);
    return isl ? this.ground(isl, tx, ty) : null;
  },

  ground(isl, tx, ty) {
    const dx = tx - isl.tx, dy = (ty - isl.ty) * 1.12, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx), p = isl.p;
    const rr = isl.r * (1 + 0.16 * Math.sin(a * 2 + p[0]) + 0.1 * Math.sin(a * 3 + p[1]) + 0.05 * Math.sin(a * 5 + p[2]));
    if (d < rr * G.ISLES.core) return 'isle';
    if (d < rr) return 'strand';
    if (d < rr + G.ISLES.lagoon * (1 + 0.28 * Math.sin(a * 3 + p[2]))) return 'lagoon';
    return null;
  },

  // which island a tile belongs to: an id and a name that never change
  placeOf(world, tx, ty) {
    const isl = this.near(world, tx, ty);
    if (!isl || isl.first) return { id: 'first', name: G.ISLE_NAMES[0] };
    const n = G.ISLE_NAMES.length;
    return { id: isl.tx + ',' + isl.ty, name: G.ISLE_NAMES[1 + Math.floor(G.hash2(isl.tx, isl.ty, world.seed + 7575) * (n - 1))] };
  },

  // how much of the screen around (x, y) is island or lagoon, 0..1 (a few samples, cheap)
  around(world, x, y, W, H) {
    const T = G.TILE;
    let n = 0;
    for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) {
      const ty = world.tileAt(Math.floor((x + (i - 2) * W / 5) / T), Math.floor((y + (j - 1.5) * H / 4) / T)).type;
      if (ty === 'lagoon' || ty === 'strand' || ty === 'isle') n++;
    }
    return n / 20;
  },
};
