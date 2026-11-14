// G.Peaks — where the Snowy Peaks are (Night 22). The tops of the highest
// highlands lie under snow: elevation above G.PEAKS.at, with a slow noise
// moving the snow line so it wanders. The land right around the start never
// turns snowy, and one peak always rises a walk from the start: first() picks
// the highest-lying direction, and lift() raises the land there into a
// mountain (a highland ring around a snowy top). Uses only the raw elevation
// and the base ground, so it never recurses into tileAt.
window.G = window.G || {};

G.Peaks = {
  // how much the first peak raises the land here (0 outside its radius)
  lift(world, tx, ty) {
    const c = this.first(world), R = G.PEAKS.first.radius, dx = tx - c.tx, dy = ty - c.ty;
    if (dx > R || dx < -R || dy > R || dy < -R) return 0;
    const q = (dx * dx + dy * dy) / (R * R);
    return q < 1 ? c.amp * (1 - q) : 0;
  },

  // is this highland (elevation e, already lifted) high enough for snow?
  at(world, tx, ty, e) {
    const P = G.PEAKS, sp = world.spawnSpot();
    let need = P.at + (G.valueNoise(tx * 0.02 + 40, ty * 0.02 - 70, world.seed + 2222) - 0.5) * P.wobble * 2;
    const ds = Math.hypot(tx - sp.tx, ty - sp.ty);
    if (ds < P.keepAway) need += 0.3 * (1 - ds / P.keepAway) + 0.06;
    return e > need;
  },

  // the peak every world has a walk from the start: the highest-lying direction at about first.dist tiles,
  // not too close to the first Glowcap Hollow. amp = how much to lift its middle so its top is snowy.
  first(world) {
    if (world.peakFirst) return world.peakFirst;
    const F = G.PEAKS.first, sp = world.spawnSpot(), a0 = G.hash2(7, 3, world.seed + 2323) * 6.2832, hol = G.Hollow.first(world);
    let best = null, bs = -1e9;
    for (let i = 0; i < 16; i++) {
      const a = a0 + i * 0.3927, cx = Math.round(sp.tx + Math.cos(a) * F.dist), cy = Math.round(sp.ty + Math.sin(a) * F.dist);
      let score = 0;
      for (let y = -12; y <= 12; y += 4) for (let x = -12; x <= 12; x += 4) score += world.elevation(cx + x, cy + y);
      if (Math.hypot(cx - hol.tx, cy - hol.ty) < F.apart) score -= 100;
      if (score > bs) { bs = score; best = { tx: cx, ty: cy }; }
    }
    best.amp = Math.max(0.06, F.top - world.elevation(best.tx, best.ty));
    return (world.peakFirst = best);
  },

  // which snowfield "place" a tile belongs to: an id and a name that never change
  placeOf(world, tx, ty) {
    const C = G.PEAKS.cell, c = this.first(world);
    if (Math.hypot(tx - c.tx, ty - c.ty) < G.PEAKS.first.radius) return { id: 'first', name: G.PEAK_NAMES[0] };
    const cx = Math.floor(tx / C), cy = Math.floor(ty / C), n = G.PEAK_NAMES.length;
    return { id: cx + ',' + cy, name: G.PEAK_NAMES[1 + Math.floor(G.hash2(cx, cy, world.seed + 2424) * (n - 1))] };
  },

  // how much of the screen around (x, y) is snowfield, 0..1 (a few samples, cheap)
  around(world, x, y, W, H) {
    const T = G.TILE;
    let n = 0;
    for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++)
      if (world.tileAt(Math.floor((x + (i - 2) * W / 5) / T), Math.floor((y + (j - 1.5) * H / 4) / T)).type === 'frost') n++;
    return n / 20;
  },
};
