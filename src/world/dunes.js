// G.Dunes — where the Amber Dunes are (Night 25). Dunes lie on warm, dry land
// (grass or forest in the base ground): a slow, wide "heat" noise plus how dry
// the land is must be above G.DUNES.at. The land right around the start never
// turns to dunes, and one dune field always lies a walk from the start (first(),
// the driest direction, away from the first hollow and peak), with an oasis in
// its middle. Other big dune fields may have an oasis too (one chance per cell).
// Uses only noise and the base ground, so it never recurses into tileAt.
window.G = window.G || {};

G.Dunes = {
  // how dune-like this dry land is (score above G.DUNES.at = dunes). m = moisture.
  score(world, tx, ty, m) {
    const D = G.DUNES, sp = world.spawnSpot();
    let b = G.fbm(tx * D.scale + 500, ty * D.scale - 400, world.seed + 6161, 3) + (0.5 - m) * D.dry;
    const ds = Math.hypot(tx - sp.tx, ty - sp.ty);
    if (ds < D.keepAway * 1.5) b -= 0.6 * G.clamp((D.keepAway * 1.5 - ds) / (D.keepAway * 0.5), 0, 1);
    const c = this.first(world), dc = Math.hypot(tx - c.tx, ty - c.ty), r = D.first.radius;
    if (dc < r) b += D.first.boost * (1 - (dc / r) ** 2);
    return b;
  },

  at(world, tx, ty, m) { return this.score(world, tx, ty, m) > G.DUNES.at; },

  // the moisture of a tile (the same noise world.groundType uses)
  wet(world, tx, ty) { return G.fbm(tx * 0.03 + 100, ty * 0.03, world.seed + 777, 3); },

  // the dunes every world has a walk from the start: the driest land at about first.dist tiles
  first(world) {
    if (world.duneFirst) return world.duneFirst;
    const F = G.DUNES.first, sp = world.spawnSpot(), a0 = G.hash2(3, 11, world.seed + 6262) * 6.2832;
    const hol = G.Hollow.first(world), pk = G.Peaks.first(world);
    let best = null, bs = -1e9;
    for (let i = 0; i < 16; i++) {
      const a = a0 + i * 0.3927, cx = Math.round(sp.tx + Math.cos(a) * F.dist), cy = Math.round(sp.ty + Math.sin(a) * F.dist);
      let score = 0;
      for (let y = -12; y <= 12; y += 4) for (let x = -12; x <= 12; x += 4) {
        const g = world.groundType(cx + x, cy + y, true);
        score += g === 'grass' ? 1 - this.wet(world, cx + x, cy + y) : g === 'forest' ? 0.2 : g === 'sand' ? 0.3 : -0.6;
      }
      if (world.groundType(cx, cy, true) !== 'grass' && world.groundType(cx, cy, true) !== 'forest') score -= 8;   // the oasis needs land
      if (Math.hypot(cx - hol.tx, cy - hol.ty) < F.apart) score -= 100;
      if (Math.hypot(cx - pk.tx, cy - pk.ty) < F.apart + G.PEAKS.first.radius) score -= 100;
      if (score > bs) { bs = score; best = { tx: cx, ty: cy }; }
    }
    return (world.duneFirst = best);
  },

  // the oasis this dune tile is beside, if any: { tx, ty } (its middle) — the first dunes always have one
  oasisNear(world, tx, ty) {
    const O = G.DUNES.oasis, c = this.first(world);
    if (Math.abs(tx - c.tx) <= O.palms && Math.abs(ty - c.ty) <= O.palms) return c;
    const C = O.cell, cx = Math.floor(tx / C), cy = Math.floor(ty / C);
    const ox = Math.floor((cx + 0.25 + G.hash2(cx, cy, world.seed + 6363) * 0.5) * C), oy = Math.floor((cy + 0.25 + G.hash2(cy, cx, world.seed + 6464) * 0.5) * C);
    if (Math.abs(tx - ox) > O.palms || Math.abs(ty - oy) > O.palms) return null;
    const key = cx + ',' + cy, memo = world.oasisMemo || (world.oasisMemo = new Map());
    let ok = memo.get(key);
    if (ok === undefined) {
      const g = world.groundType(ox, oy, true);
      ok = (g === 'grass' || g === 'forest') && this.score(world, ox, oy, this.wet(world, ox, oy)) > G.DUNES.at + O.deep;
      memo.set(key, ok);
    }
    return ok ? { tx: ox, ty: oy } : null;
  },

  // is this (dune) tile the oasis's pool?
  pool(world, tx, ty) {
    const o = this.oasisNear(world, tx, ty);
    if (!o) return false;
    const dx = tx - o.tx, dy = (ty - o.ty) * 1.2, a = Math.atan2(dy, dx);   // a rounded, slightly lopsided pool
    const r = G.DUNES.oasis.r * (1 + 0.1 * Math.sin(a * 2 + o.tx) + 0.07 * Math.sin(a * 3 + o.ty));
    return dx * dx + dy * dy < r * r;
  },

  // which dune "place" a tile belongs to: an id and a name that never change
  placeOf(world, tx, ty) {
    const C = G.DUNES.cell, c = this.first(world);
    if (Math.hypot(tx - c.tx, ty - c.ty) < G.DUNES.first.radius + 6) return { id: 'first', name: G.DUNE_NAMES[0] };
    const cx = Math.floor(tx / C), cy = Math.floor(ty / C), n = G.DUNE_NAMES.length;
    return { id: cx + ',' + cy, name: G.DUNE_NAMES[1 + Math.floor(G.hash2(cx, cy, world.seed + 6565) * (n - 1))] };
  },

  // how much of the screen around (x, y) is dunes, 0..1 (a few samples, cheap)
  around(world, x, y, W, H) {
    const T = G.TILE;
    let n = 0;
    for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++)
      if (world.tileAt(Math.floor((x + (i - 2) * W / 5) / T), Math.floor((y + (j - 1.5) * H / 4) / T)).type === 'dune') n++;
    return n / 20;
  },
};
