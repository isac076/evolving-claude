// G.Travel — the lantern roads (Night 16; data in src/data/travel.js).
// Stand beside a light, open the big map and click another light: the spirit
// rises as a mote of light, flies along a curving road and lands beside it.
// main.js makes one (`state.travel`), calls update(dt) every frame, and skips
// walking while `trip` is set. The big map calls here(), stops(), nameOf(), go().
window.G = window.G || {};

G.Travel = class {
  // h = { ui, map, renderer, folk, floater(x, y, text, color), panAt(x) }
  constructor(state, h) {
    this.state = state;
    Object.assign(this, h);
    this.trip = null;     // the flight in progress
    this.trail = [];      // recent mote positions (for the glowing tail)
    this.landed = null;   // { x, y, t } — the ring of light where you came down
    this.timer = 0;
  }

  stats() {
    const s = this.state.stats;
    return s.travel || (s.travel = { trips: 0, seen: {}, hinted: 0, far: 0 });
  }

  // every light that lies on the roads
  stops() { return this.state.world.lights.filter(L => G.STRUCTURES[L.type] && G.STRUCTURES[L.type].travel); }

  stopNear(x, y, reach = G.TRAVEL.reach) {
    let best = null, bd = reach * G.TILE;
    for (const L of this.stops()) { const d = Math.hypot(L.x - x, L.y - y); if (d <= bd) { bd = d; best = L; } }
    return best;
  }

  // the light the spirit stands beside (or null) — you can only set off from one
  here() {
    const p = this.state.player;
    return p && !this.trip ? this.stopNear(p.x, p.y) : null;
  }

  canTravel() { return !!this.here() && this.stops().length > 1; }

  keyOf(L) { return Math.floor(L.x / G.TILE) + ',' + Math.floor(L.y / G.TILE); }

  // "Lantern in the woods", "Crystal Beacon in Willowmere", "Shrine of Dawn"
  nameOf(L) {
    const def = G.TRAVEL_STOPS[L.type] || { name: '{place}' }, world = this.state.world, T = G.TILE;
    const tx = Math.floor(L.x / T), ty = Math.floor(L.y / T);
    let shrine = '';
    if (def.name.includes('{shrine}')) {
      let bd = Infinity;
      for (const s of G.Shrines.list(world)) { const d = Math.hypot(s.tx - tx, s.ty - ty); if (d < bd) { bd = d; shrine = s.name; } }
    }
    let place = '';
    if (def.name.includes('{place}')) {
      const vils = this.state.village ? this.state.village.list : [];
      const vil = vils.find(v => v.name && Math.hypot(v.cx - tx, v.cy - ty) < 12);
      place = vil ? G.TRAVEL_PLACES.village.replace('{name}', vil.name)
        : G.TRAVEL_PLACES[world.tileAt(tx, ty + 1).type] || '';
    }
    return def.name.replace('{shrine}', shrine || 'Kindled shrine').replace('{place}', place).trim();
  }

  // where to set the spirit down beside a light: the first free tile around it
  landing(L) {
    const world = this.state.world, T = G.TILE, tx = Math.floor(L.x / T), ty = Math.floor(L.y / T);
    for (const [dx, dy] of G.TRAVEL.land) {
      if (!world.isSolid(tx + dx, ty + dy)) return { x: (tx + dx + 0.5) * T, y: (ty + dy + 0.5) * T };
    }
    return { x: L.x, y: L.y + T };
  }

  // set off toward light L (from the big map)
  go(L) {
    const state = this.state, p = state.player, from = this.here();
    if (this.trip) return false;
    if (!from) { G.Sound.play('deny'); this.ui.toast(G.TRAVEL_SAYS.notNear, 3.5); return false; }
    if (L === from || Math.hypot(L.x - from.x, L.y - from.y) < 1.5 * G.TILE) { G.Sound.play('deny'); this.ui.toast(G.TRAVEL_SAYS.here, 2); return false; }
    const end = this.landing(L), T = G.TILE;
    const dx = end.x - p.x, dy = end.y - p.y, len = Math.hypot(dx, dy), tiles = len / T;
    const side = G.hash2(Math.floor(L.x / T), Math.floor(from.x / T), 61) < 0.5 ? -1 : 1;
    const bend = len * G.TRAVEL.bend * side;
    const H = G.TRAVEL.height;
    this.trip = {
      x0: p.x, y0: p.y, x1: end.x, y1: end.y,
      cx: (p.x + end.x) / 2 - dy / len * bend, cy: (p.y + end.y) / 2 + dx / len * bend,
      h: H[0] + (H[1] - H[0]) * G.clamp(tiles / 80, 0, 1),
      t: 0, dur: G.clamp(G.TRAVEL.minTime + tiles * G.TRAVEL.perTile, G.TRAVEL.minTime, G.TRAVEL.maxTime),
      from, to: L, z: 0, name: this.nameOf(L),
    };
    this.trail = [];
    p.flying = true; p.moveTarget = null; p.vx = p.vy = 0;
    this.map.toggle(false); this.ui.toggleCraft(false);
    G.Sound.play('travelGo', { dur: this.trip.dur });
    this.renderer.burst(p.x, p.y - 8, 'rgba(255,236,180,A)', 22);
    this.renderer.burst(from.x, from.y - 20, 'rgba(255,215,140,A)', 10);
    return true;
  }

  // where the mote is at time u (0..1) of the flight: ground point + height
  at(u) {
    const tr = this.trip, e = 0.5 - 0.5 * Math.cos(Math.PI * u), a = 1 - e;
    return {
      x: a * a * tr.x0 + 2 * a * e * tr.cx + e * e * tr.x1,
      y: a * a * tr.y0 + 2 * a * e * tr.cy + e * e * tr.y1,
      z: Math.sin(Math.PI * u) * tr.h,
    };
  }

  update(dt) {
    if (this.landed && (this.landed.t += dt) > 1.6) this.landed = null;
    if (!this.trip) { this.hint(dt); return; }
    const tr = this.trip, state = this.state, p = state.player;
    tr.t += dt;
    const u = G.clamp(tr.t / tr.dur, 0, 1), pos = this.at(u);
    p.x = pos.x; p.y = pos.y; p.z = tr.z = pos.z;
    state.cam.x = pos.x; state.cam.y = pos.y - pos.z * 0.45;
    this.trail.push({ x: pos.x, y: pos.y - pos.z });
    if (this.trail.length > 22) this.trail.shift();
    if (Math.random() < 0.7) {   // sparks shaken loose from the mote
      this.renderer.particles.push({ x: pos.x + G.rand(-4, 4), y: pos.y - pos.z + G.rand(-4, 4), vx: G.rand(-25, 25), vy: G.rand(-10, 30),
        life: 1, decay: G.rand(1.4, 2.4), color: Math.random() < 0.5 ? 'rgba(255,240,190,A)' : 'rgba(255,200,120,A)', size: G.rand(1, 2.4), grav: 20 });
    }
    if (u >= 1) this.arrive();
  }

  arrive() {
    const tr = this.trip, state = this.state, p = state.player, st = this.stats();
    this.trip = null; this.trail = [];
    p.flying = false; p.z = 0; p.x = tr.x1; p.y = tr.y1; p.vx = p.vy = 0; p.moveTarget = null;
    state.cam.x = p.x; state.cam.y = p.y;
    this.landed = { x: p.x, y: p.y, t: 0 };
    // friends who were following you come along on the road
    this.folk.followers.forEach((v, i) => { v.x = p.x - 22 * (i + 1); v.y = p.y + 6; v.vx = v.vy = 0; });
    G.Sound.play('travelArrive');
    this.renderer.burst(p.x, p.y - 8, 'rgba(255,240,200,A)', 26);
    this.renderer.burst(tr.to.x, tr.to.y - 24, 'rgba(255,215,140,A)', 12);
    const first = !st.trips;
    st.trips++;
    st.seen[this.keyOf(tr.to)] = 1;
    st.far = Math.max(st.far || 0, Math.round(Math.hypot(tr.x1 - tr.x0, tr.y1 - tr.y0) / G.TILE));
    this.floater(p.x, p.y - 34, tr.name, '#ffe3a8');
    this.ui.toast(first ? G.TRAVEL_SAYS.firstArrive : G.pick(G.TRAVEL_SAYS.arrive), first ? 7 : 3);
    this.ui.refresh();
  }

  // the first time you stand by a light with somewhere to go, tell how the roads work
  hint(dt) {
    if ((this.timer -= dt) > 0) return;
    this.timer = 0.5;
    const st = this.stats();
    if (st.hinted || !this.state.running) return;
    if (this.canTravel() && this.stops().length >= 3) { st.hinted = 1; this.ui.toast(G.TRAVEL_SAYS.first, 7); }
  }
};
