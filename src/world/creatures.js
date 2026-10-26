// G.Creatures — the little lives that return to restored land: butterflies,
// songbirds, rabbits, fish and moths (kinds are data in data/creatures.js).
// They appear around the screen where the land is coloured, behave on their
// own, shy away from the spirit, and quietly leave again. Nothing is saved.
// Also owns water ripples (from fish and from walking along the shore).
window.G = window.G || {};

G.Creatures = class {
  constructor() {
    this.list = [];
    this.ripples = [];
    this.timer = 0;
    this.frac = {};          // per kind: how much of the view suits it (0..1)
    this.lastSound = {};
    this.fx = null;          // { burst(x, y, color, n), sound(name, x) } — set by main
    this.onMeet = null;      // called with a kind the first time the player meets it
    this.rippleDist = 0; this.lastPX = null; this.lastPY = null;
  }

  clear() { this.list = []; this.ripples = []; this.frac = {}; }

  // ---------- helpers ----------
  tileOf(x, y) { return { tx: Math.floor(x / G.TILE), ty: Math.floor(y / G.TILE) }; }
  groundOk(world, x, y) {
    const { tx, ty } = this.tileOf(x, y);
    return !world.isSolid(tx, ty) && !world.isWater(tx, ty);
  }
  waterOk(world, x, y) {
    const { tx, ty } = this.tileOf(x, y);
    return world.isWater(tx, ty) && !world.structureAt(tx, ty);
  }
  timeOk(def, day, leaving) {
    if (def.when === 'day') return day > (leaving ? 0.38 : 0.5);
    if (def.when === 'night') return day < (leaving ? 0.42 : 0.3);
    return true;
  }
  suits(def, world, x, y) {
    const { tx, ty } = this.tileOf(x, y);
    if (!def.tiles.includes(world.tileAt(tx, ty).type)) return false;
    if (def.move === 'swim') { if (!this.waterOk(world, x, y)) return false; }
    else if (def.move !== 'flutter' && !this.groundOk(world, x, y)) return false;
    return world.restoreAt(x, y, world.lights) >= def.restore;
  }
  inView(x, y, pad = 0) {
    const v = this.view;
    return v && x > v.x0 - pad && x < v.x1 + pad && y > v.y0 - pad && y < v.y1 + pad;
  }
  sound(name, x) {
    if (!name || !this.fx) return;
    const now = performance.now();
    if (now - (this.lastSound[name] || 0) < 400) return;
    this.lastSound[name] = now;
    this.fx.sound(name, x);
  }
  ripple(x, y, s = 1) { if (this.ripples.length < 60) this.ripples.push({ x, y, r: 2, life: 1, s }); }

  // ---------- life cycle ----------
  update(dt, state, W, H) {
    const world = state.world;
    if (!world) return;
    this.view = { x0: state.cam.x - W / 2 - 40, y0: state.cam.y - H / 2 - 40, x1: state.cam.x + W / 2 + 40, y1: state.cam.y + H / 2 + 60 };
    const day = G.daylight(state.time), p = state.player;
    this.timer -= dt;
    if (this.timer <= 0) { this.timer = 0.2; this.trySpawn(world, day, p); }

    for (const c of this.list) {
      this.step(c, dt, world, day, p);
      if (state.running && !c.leaving && c.a > 0.6 && Math.hypot(c.x - p.x, c.y - p.y) < 120) this.meet(state, c.kind);
    }
    this.list = this.list.filter(c => !c.gone);

    if (state.running) this.shoreRipples(world, p);
    for (const r of this.ripples) { r.life -= dt * 0.9; r.r += dt * 15; }
    this.ripples = this.ripples.filter(r => r.life > 0);
  }

  meet(state, kind) {
    const met = state.stats.met || (state.stats.met = {});
    if (met[kind]) return;
    met[kind] = 1;
    if (this.onMeet) this.onMeet(kind);
  }

  trySpawn(world, day, p) {
    const v = this.view;
    for (const kind in G.CREATURES) {
      const def = G.CREATURES[kind];
      if (!this.timeOk(def, day, false)) { this.frac[kind] = 0; continue; }
      let x, y, home = null, ok, cap;
      if (def.nearLight) {
        const ls = world.lights.filter(L => L.light && this.inView(L.x, L.y));
        if (!ls.length) continue;
        const L = ls[Math.floor(Math.random() * ls.length)], a = Math.random() * 6.283, r = G.rand(12, def.nearLight);
        x = L.x + Math.cos(a) * r; y = L.y + Math.sin(a) * r * 0.5; home = { x: L.x, y: L.y };
        ok = true; cap = Math.min(def.cap, ls.length * 3);
      } else {
        x = G.rand(v.x0, v.x1); y = G.rand(v.y0, v.y1);
        ok = this.suits(def, world, x, y);
        this.frac[kind] = (this.frac[kind] || 0) * 0.9 + (ok ? 0.1 : 0);
        cap = Math.round(def.cap * Math.min(1, this.frac[kind] * 2.2));
      }
      if (!ok) continue;
      let n = 0;
      for (const c of this.list) if (c.kind === kind && !c.leaving) n++;
      if (n >= cap) continue;
      if (def.flee && Math.hypot(x - p.x, y - p.y) < def.flee * 1.6) continue;   // don't pop up right beside the spirit
      const count = Math.min(cap - n, Math.floor(G.rand(def.group[0], def.group[1] + 1)));
      for (let i = 0; i < count; i++) {
        const sx = x + (i ? G.rand(-26, 26) : 0), sy = y + (i ? G.rand(-18, 18) : 0);
        if (i === 0 || def.nearLight || this.suits(def, world, sx, sy)) this.spawn(kind, sx, sy, home);
      }
    }
  }

  spawn(kind, x, y, home) {
    const def = G.CREATURES[kind];
    const c = {
      kind, def, x, y, hx: home ? home.x : x, hy: home ? home.y : y, tx: x, ty: y,
      vx: 0, vy: 0, z: 0, a: 0, leaving: false, gone: false, check: 1,
      state: 'idle', t: G.rand(0.3, 1.5), ph: Math.random() * 6.283, seed: Math.random(),
      face: Math.random() < 0.5 ? -1 : 1, hue: def.hues[Math.floor(Math.random() * def.hues.length)],
    };
    if (def.move === 'flutter') { c.state = 'fly'; c.z = G.rand(8, 16); }
    if (def.move === 'moth') { c.ang = Math.random() * 6.283; c.rad = G.rand(14, 34); c.dirn = c.seed > 0.5 ? 1 : -1; }
    if (def.move === 'hop') c.state = 'sit';
    if (def.move === 'swim') { c.state = 'swim'; c.dir = Math.random() * 6.283; }
    if (def.move === 'bird') {          // birds glide in from somewhere and land
      const a = Math.random() * 6.283;
      c.state = 'arrive'; c.x = x - Math.cos(a) * 170; c.y = y - Math.sin(a) * 110; c.z = 70;
      c.face = Math.cos(a) >= 0 ? 1 : -1;
    }
    this.list.push(c);
    return c;
  }

  leave(c, p) {
    if (c.def.move === 'bird') this.takeOff(c, p, false, true);
    else c.leaving = true;
  }

  step(c, dt, world, day, p) {
    if (c.leaving) { c.a -= dt * 0.8; if (c.a <= 0) { c.gone = true; return; } }
    else c.a = Math.min(1, c.a + dt * 1.2);
    if (!this.inView(c.x, c.y, 260)) { c.gone = true; return; }
    if (!c.leaving && (c.check -= dt) <= 0) {
      c.check = 1;
      const faded = !c.def.nearLight && world.restoreAt(c.x, c.y, world.lights) < c.def.restore - 0.3;
      if (!this.timeOk(c.def, day, true) || faded) this.leave(c, p);
    }
    const dx = c.x - p.x, dy = c.y - p.y;
    this[c.def.move](c, dt, world, p, dx, dy, Math.hypot(dx, dy));
  }

  // ---------- behaviours (one per move type) ----------
  flutter(c, dt, world, p, dx, dy, dp) {
    const def = c.def;
    c.ph += dt * (c.state === 'rest' ? 2.5 : 17);
    c.t -= dt;
    if (c.state === 'rest') {
      c.z += ((c.restZ || 0) - c.z) * Math.min(1, dt * 6);
      c.x += (c.tx - c.x) * Math.min(1, dt * 4); c.y += (c.ty - c.y) * Math.min(1, dt * 4);
      if (c.t <= 0 || dp < def.flee * 1.5) { c.state = 'fly'; c.t = G.rand(1.5, 4); c.restZ = 0; }
      return;
    }
    if (c.t <= 0) {
      c.t = G.rand(1.5, 3.5); c.wantRest = false;
      const flower = Math.random() < 0.4 && this.findBloom(world, c);
      if (flower) { c.tx = flower.x; c.ty = flower.y; c.wantRest = true; c.restZ = 13; }
      else {
        const a = Math.random() * 6.283, r = G.rand(10, 90);
        c.tx = c.hx + Math.cos(a) * r; c.ty = c.hy + Math.sin(a) * r * 0.7;
        if (Math.random() < 0.15) { c.wantRest = true; c.restZ = 0; }
      }
    }
    const ex = c.tx - c.x, ey = c.ty - c.y, d = Math.hypot(ex, ey) || 1;
    if (c.wantRest && d < 5 && dp > def.flee * 1.5) { c.state = 'rest'; c.t = G.rand(2.5, 6); return; }
    const sp = Math.min(30, d * 2);
    let ax = ex / d * sp, ay = ey / d * sp;
    if (dp < def.flee * 1.5 && dp > 0) { ax += dx / dp * 80; ay += dy / dp * 80; }
    const k = Math.min(1, dt * 2.5);
    c.vx += (ax - c.vx) * k; c.vy += (ay - c.vy) * k;
    c.x += (c.vx + Math.sin(c.ph * 0.23) * 12) * dt;
    c.y += (c.vy + Math.cos(c.ph * 0.19) * 9) * dt;
    const zt = c.wantRest && d < 30 ? c.restZ + d * 0.3 : 12 + Math.sin(c.ph * 0.15) * 5;
    c.z += (zt - c.z) * Math.min(1, dt * 3);
    if (Math.abs(c.vx) > 4) c.face = Math.sign(c.vx);
  }

  findBloom(world, c) {
    const { tx, ty } = this.tileOf(c.x, c.y);
    for (let i = 0; i < 12; i++) {
      const bx = tx + Math.floor(G.rand(-4, 5)), by = ty + Math.floor(G.rand(-3, 4));
      if (world.objectAt(bx, by) === 'bloom') return { x: bx * G.TILE + 16, y: by * G.TILE + 26 };
    }
    return null;
  }

  moth(c, dt) {
    c.ph += dt * 24;
    c.ang += dt * (1.4 + c.seed) * c.dirn;
    c.rad += Math.sin(c.ph * 0.07 + c.seed * 9) * dt * 10;
    c.rad = G.clamp(c.rad, 10, 40);
    c.x = c.hx + Math.cos(c.ang) * c.rad;
    c.y = c.hy + 2 + Math.sin(c.ang) * c.rad * 0.45;
    c.z = 20 + Math.sin(c.ph * 0.09) * 7;
    c.face = Math.sin(c.ang) * c.dirn > 0 ? -1 : 1;
  }

  bird(c, dt, world, p, dx, dy, dp) {
    const def = c.def;
    const flying = c.state === 'fly' || c.state === 'arrive';
    c.ph += dt * (flying ? 18 : 1);
    if (c.state === 'arrive') {
      const ex = c.tx - c.x, ey = c.ty - c.y, d = Math.hypot(ex, ey);
      if (d < 120 * dt + 1) { c.x = c.tx; c.y = c.ty; c.z = 0; c.state = 'peck'; c.t = G.rand(0.5, 2); }
      else { c.x += ex / d * 120 * dt; c.y += ey / d * 120 * dt; c.z = Math.min(70, d * 0.4); }
      if (dp < def.flee) this.takeOff(c, p, false);
      return;
    }
    if (c.state === 'fly') {
      c.x += c.vx * dt; c.y += c.vy * dt; c.vy -= dt * 12;
      c.z = Math.min(110, c.z + dt * 45);
      if ((c.flyT -= dt) <= 0) c.leaving = true;
      return;
    }
    if (dp < def.flee) { this.takeOff(c, p, true); return; }
    c.peck = Math.max(0, (c.peck || 0) - dt);
    if (c.state === 'hop') {
      c.hopT += dt;
      const k = c.hopT / 0.22;
      if (k >= 1) { c.state = 'peck'; c.z = 0; c.t = G.rand(0.4, 1.6); }
      else { c.x += c.hvx * dt; c.y += c.hvy * dt; c.z = Math.sin(k * Math.PI) * 4; }
      return;
    }
    if ((c.t -= dt) <= 0) {
      c.t = G.rand(0.4, 1.8);
      if (Math.random() < 0.5) {
        const a = Math.random() * 6.283, l = G.rand(8, 16), nx = c.x + Math.cos(a) * l, ny = c.y + Math.sin(a) * l * 0.6;
        if (this.groundOk(world, nx, ny)) {
          c.state = 'hop'; c.hopT = 0; c.hvx = (nx - c.x) / 0.22; c.hvy = (ny - c.y) / 0.22; c.face = nx >= c.x ? 1 : -1;
        }
      } else if (Math.random() < 0.6) c.peck = 0.35;
      else c.face = -c.face;
    }
  }

  takeOff(c, p, scareOthers, calm) {
    if (c.state === 'fly') return;
    const a = calm ? Math.random() * 6.283 : Math.atan2(c.y - p.y, c.x - p.x) + G.rand(-0.6, 0.6);
    const sp = G.rand(110, 150);
    c.vx = Math.cos(a) * sp; c.vy = Math.sin(a) * sp * 0.7 - 30;
    c.face = c.vx >= 0 ? 1 : -1;
    c.state = 'fly'; c.flyT = G.rand(2.5, 4);
    if (!calm) this.sound(c.def.sound, c.x);
    if (scareOthers) for (const o of this.list) {
      if (o !== c && o.kind === c.kind && o.state !== 'fly' && Math.hypot(o.x - c.x, o.y - c.y) < 80) this.takeOff(o, p, false);
    }
  }

  hop(c, dt, world, p, dx, dy, dp) {
    c.ear = Math.max(0, (c.ear || 0) - dt);
    if (c.state === 'hop') {
      c.hopT += dt;
      const dur = c.fast ? 0.26 : 0.4, k = c.hopT / dur;
      if (k >= 1) {
        c.z = 0;
        if (--c.hops > 0 && this.nextHop(c, world, p)) return;
        c.state = 'sit'; c.t = c.fast ? G.rand(1, 2) : G.rand(1.5, 4.5); c.fast = false;
      } else { c.x += c.hvx * dt; c.y += c.hvy * dt; c.z = Math.sin(k * Math.PI) * (c.fast ? 8 : 4); }
      return;
    }
    if (dp < c.def.flee) { c.fast = true; c.hops = 7; if (this.nextHop(c, world, p)) return; }
    if ((c.t -= dt) <= 0) {
      if (Math.random() < 0.3) { c.ear = 0.5; c.t = G.rand(0.8, 2); return; }
      c.hops = 1 + Math.floor(Math.random() * 3);
      if (!this.nextHop(c, world, p)) c.t = 1;
    }
  }

  nextHop(c, world, p) {
    let a;
    if (c.fast) a = Math.atan2(c.y - p.y, c.x - p.x) + G.rand(-0.5, 0.5);
    else {   // wander, but drift back home after a scare
      const hd = Math.hypot(c.hx - c.x, c.hy - c.y);
      a = hd > 60 ? Math.atan2(c.hy - c.y, c.hx - c.x) + G.rand(-0.6, 0.6) : Math.random() * 6.283;
    }
    const len = c.fast ? 28 : 14, dur = c.fast ? 0.26 : 0.4;
    for (let i = 0; i < 5; i++) {
      const aa = a + Math.ceil(i / 2) * 0.7 * (i % 2 ? 1 : -1);
      const nx = c.x + Math.cos(aa) * len, ny = c.y + Math.sin(aa) * len * 0.75;
      if (this.groundOk(world, nx, ny)) {
        c.hvx = (nx - c.x) / dur; c.hvy = (ny - c.y) / dur; c.face = nx >= c.x ? 1 : -1;
        c.state = 'hop'; c.hopT = 0;
        return true;
      }
    }
    return false;
  }

  swim(c, dt, world, p, dx, dy, dp) {
    if (c.state === 'jump') {
      c.jt += dt;
      const k = c.jt / 0.8;
      if (k >= 1) {
        c.state = 'swim'; c.z = 0;
        this.ripple(c.x, c.y, 1.2); this.ripple(c.x, c.y, 0.7);
        if (this.fx) this.fx.burst(c.x, c.y, 'rgba(210,235,255,A)', 8);
      } else {
        c.x += Math.cos(c.dir) * 42 * dt; c.y += Math.sin(c.dir) * 30 * dt;
        c.z = Math.sin(k * Math.PI) * 22;
      }
      return;
    }
    c.ph += dt * (c.dart > 0 ? 18 : 7);
    c.dart = Math.max(0, (c.dart || 0) - dt);
    if (dp < c.def.flee && c.dart <= 0) {
      c.dir = Math.atan2(dy, dx) + G.rand(-0.4, 0.4); c.dart = 0.9; this.ripple(c.x, c.y, 0.6);
    }
    if ((c.t -= dt) <= 0 && c.dart <= 0) {
      c.turn = G.rand(-1.2, 1.2); c.t = G.rand(1, 3);
      const lx = c.x + Math.cos(c.dir) * 34, ly = c.y + Math.sin(c.dir) * 24;
      if (!c.leaving && Math.random() < 0.08 && this.inView(c.x, c.y, -40) && this.waterOk(world, lx, ly)) {
        c.state = 'jump'; c.jt = 0;
        this.ripple(c.x, c.y, 1);
        if (this.fx) this.fx.burst(c.x, c.y, 'rgba(210,235,255,A)', 6);
        if (dp < 420) this.sound(c.def.sound, c.x);
        return;
      }
    }
    c.dir += (c.turn || 0) * dt * 0.6;
    const sp = c.dart > 0 ? 85 : 22;
    const nx = c.x + Math.cos(c.dir) * sp * dt, ny = c.y + Math.sin(c.dir) * sp * dt;
    if (this.waterOk(world, nx, ny) && this.waterOk(world, nx + Math.cos(c.dir) * 10, ny + Math.sin(c.dir) * 10)) { c.x = nx; c.y = ny; }
    else c.dir += Math.PI * G.rand(0.6, 1.4);
    if (Math.random() < dt * 0.12) this.ripple(c.x, c.y, 0.45);
  }

  // rings on the water where the spirit walks along the shore or over a bridge
  shoreRipples(world, p) {
    if (this.lastPX !== null) this.rippleDist += Math.hypot(p.x - this.lastPX, p.y - this.lastPY);
    this.lastPX = p.x; this.lastPY = p.y;
    if (this.rippleDist < 26) return;
    this.rippleDist = 0;
    let best = null, bd = Infinity;
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      const tx = p.tx + ox, ty = p.ty + oy;
      if (!world.isWater(tx, ty) || world.structureAt(tx, ty)) continue;
      const wx = (tx + 0.5) * G.TILE, wy = (ty + 0.5) * G.TILE, d = Math.hypot(wx - p.x, wy - p.y);
      if (d < bd) { bd = d; best = { wx, wy }; }
    }
    if (best && bd < 40) this.ripple(best.wx + (p.x - best.wx) * 0.4 + G.rand(-4, 4), best.wy + (p.y - best.wy) * 0.4 + G.rand(-3, 3), 0.9);
  }

  // ---------- drawing (called by the renderer) ----------
  // under the floor layer: fish below the surface and ripples
  drawWater(ctx, camX, camY, t) {
    ctx.lineWidth = 1.2;
    for (const r of this.ripples) {
      ctx.strokeStyle = `rgba(235,245,255,${(r.life * 0.45 * r.s).toFixed(3)})`;
      ctx.beginPath(); ctx.ellipse(r.x - camX, r.y - camY, r.r, r.r * 0.45, 0, 0, 6.2832); ctx.stroke();
    }
    for (const c of this.list) if (c.kind === 'fish' && c.state !== 'jump') this.drawOne(ctx, c, camX, camY, t);
  }

  // creatures standing on the ground, bucketed by tile row for depth sorting
  groundRows() {
    const rows = new Map();
    for (const c of this.list) {
      const ground = c.def.move === 'hop' || (c.def.move === 'bird' && (c.state === 'peck' || c.state === 'hop'));
      if (!ground) continue;
      const ty = Math.floor(c.y / G.TILE);
      if (!rows.has(ty)) rows.set(ty, []);
      rows.get(ty).push(c);
    }
    return rows;
  }

  // everything in the air, on top of the world
  drawAir(ctx, camX, camY, t) {
    const air = this.list.filter(c => c.def.move === 'flutter' || c.def.move === 'moth' ||
      (c.def.move === 'bird' && (c.state === 'fly' || c.state === 'arrive')) || c.state === 'jump');
    air.sort((a, b) => a.y - b.y);
    for (const c of air) this.drawOne(ctx, c, camX, camY, t);
  }

  drawOne(ctx, c, camX, camY, t) {
    const sx = c.x - camX, sy = c.y - camY;
    if (sx < -60 || sy < -140 || sx > this.view.x1 - this.view.x0 + 60 || sy > this.view.y1 - this.view.y0 + 80) return;
    ctx.globalAlpha = Math.max(0, c.a);
    G.CREATURE_SPRITES[c.kind](ctx, c, sx, sy, t);
    ctx.globalAlpha = 1;
  }
};
