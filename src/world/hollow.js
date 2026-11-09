// G.Hollow — where the Glowcap Hollows are (Night 17). A hollow is damp land
// (grass or forest) where a slow, wide noise is high enough. The land right
// around the start never turns into one, and one hollow is always placed a
// short walk away (first()) so every world has one to find. Uses only the raw
// ground (world.groundType(x, y, true)), so it never recurses into tileAt.
window.G = window.G || {};

G.Hollow = {
  // is this damp land part of a hollow? (the caller has checked the land is grass/forest and how wet it is)
  at(world, tx, ty, wet) {
    const H = G.HOLLOW, sp = world.spawnSpot();
    let b = G.fbm(tx * H.scale - 300, ty * H.scale + 200, world.seed + 5151, 3);
    const ds = Math.hypot(tx - sp.tx, ty - sp.ty);
    if (ds < H.keepAway * 1.6) b -= 0.5 * G.clamp((H.keepAway * 1.6 - ds) / (H.keepAway * 0.6), 0, 1);
    const c = this.first(world), dc = Math.hypot(tx - c.tx, ty - c.ty), r = H.first.radius;
    let need = H.wet;
    if (dc < r) { const k = 1 - (dc / r) ** 2; b += H.first.boost * k; need -= 0.22 * k; }
    return b > H.at && wet > need;
  },

  // the hollow every world has close to the start: the most wooded direction at about first.dist tiles
  first(world) {
    if (world.hollowFirst) return world.hollowFirst;
    const H = G.HOLLOW.first, sp = world.spawnSpot(), a0 = G.hash2(5, 9, world.seed + 1717) * 6.2832;
    let best = null, bs = -1;
    for (let i = 0; i < 16; i++) {
      const a = a0 + i * 0.3927, cx = Math.round(sp.tx + Math.cos(a) * H.dist), cy = Math.round(sp.ty + Math.sin(a) * H.dist);
      let score = 0;
      for (let y = -12; y <= 12; y += 4) for (let x = -12; x <= 12; x += 4) {
        const g = world.groundType(cx + x, cy + y, true);
        score += g === 'forest' ? 2 : g === 'grass' ? 1 : 0;
      }
      if (score > bs) { bs = score; best = { tx: cx, ty: cy }; }
    }
    return (world.hollowFirst = best);
  },

  // which hollow "place" a tile belongs to: an id and a name that never change
  placeOf(world, tx, ty) {
    const C = G.HOLLOW.cell, c = this.first(world);
    if (Math.hypot(tx - c.tx, ty - c.ty) < G.HOLLOW.first.radius + 8) return { id: 'first', name: G.HOLLOW_NAMES[0] };
    const cx = Math.floor(tx / C), cy = Math.floor(ty / C), n = G.HOLLOW_NAMES.length;
    return { id: cx + ',' + cy, name: G.HOLLOW_NAMES[1 + Math.floor(G.hash2(cx, cy, world.seed + 1719) * (n - 1))] };
  },
};
