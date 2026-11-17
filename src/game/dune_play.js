// G.DunePlay (`state.dunes`) — the Amber Dunes (Night 25). Twice a second it
// looks around the spirit: stepping onto dunes you haven't seen shows their
// name, plays a little oud phrase and marks them found; standing by an oasis
// pool finds the oasis. It also works out how clear the night sky over the
// dunes is (`sky`, 0..1: only at night, only out on the dunes, dimmed by
// clouds) and sends falling stars across it now and then (G.DuneFX draws them).
// Saved inside stats: stats.dunes = { found, at: { placeId: [tx, ty, name] }, oasis: 0/1, stars: count }.
window.G = window.G || {};

G.DunePlay = class {
  // hooks: { ui, map, burst(x, y, color, n) }
  constructor(state, hooks) {
    this.state = state; this.h = hooks;
    this.timer = 0;
    this.near = 0;      // how much of the land around the spirit is dunes (smoothed)
    this.sky = 0;       // how clear and dark the sky over the dunes is now
    this.starT = -1;    // seconds to the next falling star (-1 = not counting)
  }

  stats() { const s = this.state.stats; return s.dunes || (s.dunes = { found: 0, at: {}, oasis: 0, stars: 0 }); }

  update(dt) {
    this.stars(dt);
    if ((this.timer -= dt) > 0) return;
    this.timer = 0.5;
    const s = this.state, p = s.player, w = s.world;
    const around = G.Dunes.around(w, p.x, p.y, 1000, 640);
    this.near += (around - this.near) * 0.35;
    const onDune = w.tileAt(p.tx, p.ty).type === 'dune';

    // the night sky over the dunes: dark, clear, out on the sand
    const dark = G.clamp((1 - G.daylight(s.time) - 0.45) * 2.4, 0, 1), cloud = s.weather ? s.weather.v.cloud : 0;
    this.sky = dark * G.clamp(this.near * 1.6, 0, 1) * (1 - 0.9 * cloud);

    const D = this.stats(), pool = !D.oasis && this.nearPool(w, p.tx, p.ty);
    if (pool) {
      D.oasis = 1; D.oasisAt = [pool.tx, pool.ty];
      G.Sound.play('oasis');
      this.h.ui.toast(G.DUNE_SAYS.oasis, 6);
      this.h.burst(p.x, p.y - 10, 'rgba(170,235,255,A)', 18);
    }
    if (!onDune) return;
    const place = G.Dunes.placeOf(w, p.tx, p.ty);
    if (D.at[place.id]) return;
    D.at[place.id] = [p.tx, p.ty, place.name];
    D.found = Object.keys(D.at).length;
    G.Sound.play('dunes');
    this.h.ui.placeCaption(place.name, G.DUNE_SAYS.sub);
    this.h.ui.toast(D.found === 1 ? G.DUNE_SAYS.first : G.DUNE_SAYS.again, D.found === 1 ? 9 : 3.5);
    this.h.burst(p.x, p.y - 10, 'rgba(255,215,140,A)', 20);
    this.h.map.touch(p.tx, p.ty);
  }

  // the oasis whose pool is within a couple of steps, or null (pool water inside the dunes)
  nearPool(w, tx, ty) {
    for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) {
      if (w.tileAt(tx + x, ty + y).type !== 'water' || w.groundType(tx + x, ty + y, true) === 'water') continue;
      const o = G.Dunes.oasisNear(w, tx + x, ty + y);
      if (o) return o;
    }
    return null;
  }

  // falling stars: the first a moment after the sky clears, then every so often
  stars(dt) {
    const S = G.DUNES.stars;
    if (this.sky < S.need) { this.starT = -1; return; }
    if (this.starT < 0) this.starT = G.rand(S.first[0], S.first[1]);
    if ((this.starT -= dt) > 0) return;
    this.starT = G.rand(S.every[0], S.every[1]);
    const s = this.state, p = s.player, D = this.stats();
    G.DuneFX.shoot();
    G.Sound.play('fallingstar');
    D.stars = (D.stars || 0) + 1;
    if (D.stars === 1) {
      const f = s.world.restoreAt(p.x, p.y, s.world.lights);
      this.h.ui.toast(f > 0.5 ? G.DUNE_SAYS.star : G.DUNE_SAYS.starGrey, 7);
    }
  }

  // the goal tracker's hints: which way to the dunes near the start, and to their oasis
  static hint(s) { return G.DunePlay.toward(s, 16, G.DUNE_SAYS.hintFar, G.DUNE_SAYS.hintNear); }
  static oasisHint(s) { return G.DunePlay.toward(s, 6, G.DUNE_SAYS.oasisFar, G.DUNE_SAYS.oasisNear); }
  static toward(s, near, far, here) {
    if (!s.world || !s.player) return here;
    const c = G.Dunes.first(s.world), p = s.player, d = Math.round(Math.hypot(c.tx - p.tx, c.ty - p.ty));
    if (d < near) return here;
    return far.replace('{d}', Math.max(5, Math.round(d / 5) * 5)).replace('{dir}', G.Ruins.direction(p.tx, p.ty, c.tx, c.ty));
  }

  // the journal's Places page: every dune field you have found (and the oasis), nearest first
  static places(s) {
    const D = s.stats.dunes, p = s.player;
    if (!D || !D.found) return '';
    const list = Object.values(D.at).sort((a, b) => Math.hypot(a[0] - p.tx, a[1] - p.ty) - Math.hypot(b[0] - p.tx, b[1] - p.ty));
    const card = (tx, ty, name, about) => {
      const d = Math.round(Math.hypot(tx - p.tx, ty - p.ty));
      const where = d < 8 ? 'right here' : `about ${d} steps ${G.Ruins.direction(p.tx, p.ty, tx, ty)}`;
      return `<div class="j-place read" style="border-left:3px solid hsla(36,90%,65%,.85)"><b>${name}</b><em>${where}</em><p>${about}</p></div>`;
    };
    let h = '';
    for (const [tx, ty, name] of list) h += card(tx, ty, name, G.DUNE_SAYS.about);
    if (D.oasis) {
      const [tx, ty] = D.oasisAt || [G.Dunes.first(s.world).tx, G.Dunes.first(s.world).ty];
      h += card(tx, ty, 'The oasis of ' + G.Dunes.placeOf(s.world, tx, ty).name.replace(/^The /, ''), G.DUNE_SAYS.oasisAbout);
    }
    return h;
  }
};
