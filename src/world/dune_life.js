// The dunes' creatures (Night 25), added to G.Creatures: the sand gecko's
// 'dart' move. A gecko sits very still in the sun, now and then does a few
// tiny push-ups, then darts off in a quick straight dash and freezes again.
// Come too close and it dashes away in a zig-zag. (The dune tortoise plods
// with the glow snail's 'crawl' — see data/dunes.js.)
window.G = window.G || {};

(function () {
  const C = G.Creatures.prototype;

  C.dart = function (c, dt, world, p, dx, dy, dp) {
    if (c.bob === undefined) { c.bob = 0; c.state = 'sit'; c.t = G.rand(0.6, 2); c.legs = 0; }
    c.bob = Math.max(0, c.bob - dt);
    if (c.state === 'dash') {
      c.dashT -= dt; c.legs += dt * 40;
      const nx = c.x + c.vx * dt, ny = c.y + c.vy * dt;
      if (this.groundOk(world, nx, ny) && world.tileAt(Math.floor(nx / G.TILE), Math.floor(ny / G.TILE)).type === 'dune') { c.x = nx; c.y = ny; }
      else c.dashT = 0;
      if (c.dashT <= 0) {
        if (c.scared > 0 && --c.scared > 0) { this.dashFrom(c, p, true); return; }
        c.state = 'sit'; c.t = G.rand(0.8, 2.6);
        if (Math.random() < 0.4) c.bob = 0.6;   // push-ups after a run
      }
      return;
    }
    if (dp < c.def.flee) { c.scared = 3; this.dashFrom(c, p, true); this.sound('gecko', c.x); return; }
    if ((c.t -= dt) <= 0) {
      if (Math.random() < 0.3) { c.bob = 0.6; c.t = G.rand(0.8, 1.6); return; }
      this.dashFrom(c, p, false);
    }
  };

  // a quick straight dash: away from the spirit when scared, otherwise about home
  C.dashFrom = function (c, p, scared) {
    let a;
    if (scared) a = Math.atan2(c.y - p.y, c.x - p.x) + G.rand(-0.8, 0.8);
    else {
      const hd = Math.hypot(c.hx - c.x, c.hy - c.y);
      a = hd > 70 ? Math.atan2(c.hy - c.y, c.hx - c.x) + G.rand(-0.5, 0.5) : Math.random() * 6.283;
    }
    const sp = scared ? G.rand(130, 170) : G.rand(80, 120);
    c.vx = Math.cos(a) * sp; c.vy = Math.sin(a) * sp * 0.7;
    c.face = c.vx >= 0 ? 1 : -1; c.ang = Math.atan2(c.vy, Math.abs(c.vx));
    c.state = 'dash'; c.dashT = scared ? G.rand(0.18, 0.3) : G.rand(0.2, 0.45);
  };
})();
