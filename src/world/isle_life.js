// The Far Isles' creatures (Night 27), added to G.Creatures:
//   scuttle — the hermit crab. It sits on the coral sand, now and then waves a
//             claw, then scuttles off sideways in a quick little run. Come too
//             close and it dashes away sideways and pulls itself into its shell
//             (c.hide 0..1), peeking out again once the spirit has moved off.
//   glide   — the sea turtle, beneath the lagoon's surface (`under`). It swims
//             in slow, wide curves with long flipper strokes, and every so often
//             rises to breathe (c.surf 0..1: its head and shell break the water).
//             Startled, it dives and paddles away quickly. It can only be met
//             while it is up at the surface (G.Creatures.update checks c.surf).
// (Parrots use the songbird's 'bird' move — see data/isles.js.)
window.G = window.G || {};

(function () {
  const C = G.Creatures.prototype;
  const onSand = (world, x, y) => world.tileAt(Math.floor(x / G.TILE), Math.floor(y / G.TILE)).type === 'strand';
  const inLagoon = (world, x, y) => {
    const tx = Math.floor(x / G.TILE), ty = Math.floor(y / G.TILE);
    return world.tileAt(tx, ty).type === 'lagoon' && !world.structureAt(tx, ty);
  };

  C.scuttle = function (c, dt, world, p, dx, dy, dp) {
    if (c.hide === undefined) { c.hide = 0; c.state = 'sit'; c.t = G.rand(0.5, 2); c.legs = 0; c.wave = 0; }
    c.wave = Math.max(0, c.wave - dt);
    if (c.state === 'hide') {   // tucked in its shell until the spirit has gone a little way off
      c.hide = Math.min(1, c.hide + dt * 4);
      if (dp > c.def.flee * 1.4 && (c.t -= dt) <= 0) c.state = 'sit', c.t = G.rand(1, 2.5);
      return;
    }
    c.hide = Math.max(0, c.hide - dt * 1.5);
    if (c.state === 'run') {
      c.runT -= dt; c.legs += dt * 34;
      const nx = c.x + c.vx * dt, ny = c.y + c.vy * dt;
      if (this.groundOk(world, nx, ny) && onSand(world, nx, ny)) { c.x = nx; c.y = ny; } else c.runT = 0;
      if (c.runT <= 0) {
        if (c.scared) { c.scared = false; c.state = 'hide'; c.t = G.rand(1.5, 3); }
        else { c.state = 'sit'; c.t = G.rand(0.8, 3); if (Math.random() < 0.35) c.wave = 0.8; }
      }
      return;
    }
    if (dp < c.def.flee && c.hide < 0.05) { this.scuttleFrom(c, p, true); this.sound(c.def.sound, c.x); return; }
    if ((c.t -= dt) <= 0) {
      if (Math.random() < 0.3) { c.wave = 0.8; c.t = G.rand(0.8, 1.8); return; }
      this.scuttleFrom(c, p, false);
    }
  };

  // a quick sideways run: crabs walk side-on, so the run is mostly left or right
  C.scuttleFrom = function (c, p, scared) {
    let side;
    if (scared) side = c.x >= p.x ? 1 : -1;
    else side = Math.abs(c.hx - c.x) > 50 ? (c.hx > c.x ? 1 : -1) : (Math.random() < 0.5 ? -1 : 1);
    const sp = scared ? G.rand(90, 120) : G.rand(40, 60);
    c.vx = side * sp; c.vy = G.rand(-0.35, 0.35) * sp;
    c.state = 'run'; c.runT = scared ? G.rand(0.4, 0.6) : G.rand(0.3, 0.8); c.scared = scared;
  };

  C.glide = function (c, dt, world, p, dx, dy, dp) {
    if (!c.swims) {   // a new turtle (keeps anything already set on it)
      c.swims = true;
      if (c.surf === undefined) c.surf = 0;
      if (c.breathT === undefined) c.breathT = G.rand(2, 6);
      c.dir = Math.random() * 6.283; c.stroke = 0; c.dash = 0; c.up = c.up || 0;
    }
    c.dash = Math.max(0, c.dash - dt);
    if (dp < c.def.flee && c.dash <= 0) {   // startled: duck under and paddle off
      c.dir = Math.atan2(dy, dx) + G.rand(-0.5, 0.5); c.dash = 2.2; c.up = 0;
      this.ripple(c.x, c.y, 0.9);
      if (c.surf > 0.4) this.sound(c.def.sound, c.x);
    }
    // the rhythm of a turtle: swim … rise to breathe … sink and swim on
    if (c.up > 0) { c.up -= dt; c.surf = Math.min(1, c.surf + dt * 0.8); if (c.up <= 0) this.ripple(c.x, c.y, 0.7); }
    else {
      c.surf = Math.max(0, c.surf - dt * (c.dash > 0 ? 1.6 : 0.5));
      if ((c.breathT -= dt) <= 0 && c.dash <= 0) {
        c.up = G.rand(3, 5); c.breathT = G.rand(9, 15);
        this.ripple(c.x, c.y, 1.1);
        if (this.inView(c.x, c.y, -30) && dp < 380) this.sound(c.def.sound, c.x);
      }
    }
    if ((c.t -= dt) <= 0) { c.turn = G.rand(-0.7, 0.7); c.t = G.rand(2, 4); }
    c.dir += (c.turn || 0) * dt * 0.5;
    const sp = c.dash > 0 ? 62 : c.up > 0 ? 6 : 15;
    c.stroke += dt * (c.dash > 0 ? 5 : 1.6);
    const push = 0.55 + 0.45 * Math.max(0, Math.sin(c.stroke * 2));   // a long stroke, then a glide
    const nx = c.x + Math.cos(c.dir) * sp * push * dt, ny = c.y + Math.sin(c.dir) * sp * push * dt * 0.75;
    if (inLagoon(world, nx, ny) && inLagoon(world, nx + Math.cos(c.dir) * 14, ny + Math.sin(c.dir) * 10)) { c.x = nx; c.y = ny; }
    else c.dir += Math.PI * G.rand(0.5, 1.2);
    c.face = Math.cos(c.dir) >= 0 ? 1 : -1;
  };
})();
