// The sea's creatures (Night 23), added to G.Creatures: whales and moon jellies.
// Both live beneath the surface (`under: true` in data/sea.js — the renderer
// draws them with the fish, before bridges, boats and the spirit).
//   whale — a slow giant of the deep sea. It dives for a while (a dark shape
//           under the water), then rises: its back breaks the surface, it
//           blows a fountain of spray and sings. Curious about boats: when the
//           spirit sails nearby it comes to swim alongside.
//   jelly — moon jellies drifting at night, pulsing softly; they kept a little
//           light through the Fading, so they glow even in grey water.
window.G = window.G || {};

(function () {
  const C = G.Creatures.prototype;

  // is it deep sea here? (whales never come into the shallows)
  C.deepOk = function (world, x, y) {
    const tx = Math.floor(x / G.TILE), ty = Math.floor(y / G.TILE);
    return world.tileAt(tx, ty).type === 'deep' && !world.structureAt(tx, ty);
  };

  C.whale = function (c, dt, world, p, dx, dy, dp) {
    if (c.surf === undefined) {   // a new whale starts deep down
      c.surf = 0; c.state = 'dive'; c.t = G.rand(2, 5); c.blow = -1; c.fluke = -1;
      c.size = 0.85 + c.seed * 0.35; if (c.dir === undefined) c.dir = Math.random() * 6.283;
    }
    c.ph += dt;
    c.t -= dt;
    // the rhythm of a whale: dive … rise … breathe at the surface … dive again
    if (c.state === 'dive' && c.t <= 0) { c.state = 'rise'; }
    if (c.state === 'rise') {
      c.surf = Math.min(1, c.surf + dt * 0.5);
      if (c.surf >= 1) {
        c.state = 'breathe'; c.t = G.rand(4, 7); c.blow = 0;
        if (this.inView(c.x, c.y, -20)) this.sound(c.def.sound, c.x);
        this.ripple(c.x, c.y, 1.6); this.ripple(c.x, c.y, 1);
      }
    }
    if (c.state === 'breathe' && c.t <= 0) { c.state = 'sink'; c.fluke = 0; }
    if (c.state === 'sink') {
      c.surf = Math.max(0, c.surf - dt * 0.45);
      if (c.surf <= 0) { c.state = 'dive'; c.t = G.rand(6, 12); }
    }
    if (c.blow >= 0) { c.blow += dt; if (c.blow > 1.8) c.blow = -1; }
    if (c.fluke >= 0) {
      c.fluke += dt;
      if (c.fluke > 0.8 && !c.splashed) { c.splashed = true; this.ripple(c.x - Math.cos(c.dir) * 34 * c.size, c.y - Math.sin(c.dir) * 20 * c.size, 1.3); }
      if (c.fluke > 1.6) { c.fluke = -1; c.splashed = false; }
    }

    // swim: slow and steady, turning gently; curious about a boat nearby
    let want = c.dir + (c.turn || 0) * dt;
    if ((c.wt = (c.wt || 0) - dt) <= 0) { c.wt = G.rand(3, 7); c.turn = G.rand(-0.25, 0.25); }
    if (p.afloat && dp < 460 && dp > 70 && !c.leaving) {
      const side = c.seed > 0.5 ? 1 : -1, a = Math.atan2(-dy, -dx);
      const gx = p.x + Math.cos(a + side * 1.6) * 80 - c.x, gy = p.y + Math.sin(a + side * 1.6) * 80 - c.y;
      const to = Math.atan2(gy, gx);
      let d = to - c.dir; while (d > Math.PI) d -= 6.2832; while (d < -Math.PI) d += 6.2832;
      want = c.dir + G.clamp(d, -0.5 * dt, 0.5 * dt);
    }
    c.dir = want;
    const sp = (c.state === 'breathe' ? 9 : 16) * c.size;
    const nx = c.x + Math.cos(c.dir) * sp * dt, ny = c.y + Math.sin(c.dir) * sp * 0.75 * dt;
    const nose = 46 * c.size;
    if (this.deepOk(world, nx + Math.cos(c.dir) * nose, ny + Math.sin(c.dir) * nose * 0.75) && this.deepOk(world, nx, ny)) { c.x = nx; c.y = ny; }
    else c.dir += dt * 1.4 * (c.seed > 0.5 ? 1 : -1);   // too shallow ahead: swing round slowly
    c.face = Math.cos(c.dir) >= 0 ? 1 : -1;
    if (c.state === 'breathe' && Math.random() < dt * 0.8) this.ripple(c.x + G.rand(-20, 20), c.y + G.rand(-6, 6), 0.7);
  };

  C.jelly = function (c, dt, world, p, dx, dy, dp) {
    if (c.pulse === undefined) { c.pulse = Math.random() * 6.283; c.dir = Math.random() * 6.283; c.t = G.rand(2, 5); }
    c.pulse += dt * (1.6 + c.seed * 0.8);
    const push = Math.max(0, Math.sin(c.pulse));        // each pulse pushes it on a little
    if ((c.t -= dt) <= 0) { c.t = G.rand(3, 7); c.dir += G.rand(-1, 1); }
    if (dp < c.def.flee * 2 && dp > 0) c.dir = Math.atan2(dy, dx);   // drifts gently out of the boat's way
    const sp = 3 + push * 11;
    const nx = c.x + Math.cos(c.dir) * sp * dt, ny = c.y + Math.sin(c.dir) * sp * dt;
    if (this.waterOk(world, nx, ny)) { c.x = nx; c.y = ny; } else c.dir += Math.PI * G.rand(0.7, 1.3);
  };

  // soft holes in the night for the glowing things under the water (the renderer adds them)
  C.glows = function (list, camX, camY) {
    for (const c of this.list) {
      if (c.kind !== 'jelly' || c.a < 0.05) continue;
      list.push({ x: c.x - camX, y: c.y - camY, r: 30 + Math.sin(c.pulse || 0) * 4, hue: c.hue, a: 0.55 * c.a });
    }
  };
})();
