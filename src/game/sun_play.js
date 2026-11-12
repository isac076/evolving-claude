// G.SunPlay — the end of the story (Night 20; data in src/data/sun.js).
// Sensing the Sun's Hearth once all four Ember Shrines burn, finding it, the
// sockets and the altar, and the sunrise itself: the four embers lift and
// gather over the altar, the Great Sun swells and rises, dawn breaks (a night
// turns to morning), every hushling eases, and colour wakes everywhere
// (world.floor eases in). Then the ending opens (G.Ending) — and you play on.
// Saved: the 'sunflame' structure + stats.sun = { sensed, found, lit, day }.
window.G = window.G || {};

G.SunPlay = class {
  // h = { ui, map, journal, ending, hush, burst(x, y, color, n), floater(x, y, text, color), pan(x) }
  constructor(state, h) {
    this.state = state; this.h = h;
    this.rising = null;   // { t, dawned } while the Sun rises
    this.timer = 0;
  }

  get stats() { return this.state.stats.sun || (this.state.stats.sun = {}); }
  get site() { return G.Sun.site(this.state.world); }
  say(key, o = {}) { return G.SUN_SAYS[key].replace(/\{(\w+)\}/g, (m, k) => o[k] !== undefined ? o[k] : m); }
  centre() { const s = this.site; return { x: (s.tx + 0.5) * G.TILE, y: (s.ty + 0.5) * G.TILE }; }

  // E or a click on one of the hearth's stones
  use(tx, ty, obj) {
    const w = this.state.world, def = G.OBJECTS[obj];
    this.found(true);
    G.Sound.play('select');
    if (def.socket) {
      const i = G.Sun.socketAt(w, tx, ty), sh = G.Sun.shrineOf(w, i);
      if (!sh) return;
      this.h.ui.toast(this.say(G.Sun.socketLit(w, i) ? 'socketLit' : 'socketCold', { shrine: sh.name }), 4);
    } else if (def.altar) {
      if (this.rising) return;
      const n = G.Sun.litSockets(w);
      if (n < 4) this.h.ui.toast(this.say('altarCold', { n }), 6);
      else this.rise();
    } else this.h.ui.toast(this.say('post'), 4);
  }

  // a click on the risen Sun
  about() { G.Sound.play('select'); this.h.ui.toast(this.say('risen'), 4); }

  // ---------- the sunrise ----------
  rise() {
    const s = this.state, w = s.world;
    if (this.rising || G.Sun.isLit(w)) return;
    this.rising = { t: 0, dawned: false, ver: 0 };
    s.player.moveTarget = null;
    G.Sound.play('sungather');
    this.h.ui.toast(this.say('begin'), 5);
  }

  // half way through: the dawn breaks
  dawn() {
    const s = this.state, w = s.world, site = this.site, { x, y } = this.centre();
    // a night turns into a fresh morning (forward only, so seasons never go back)
    if (G.daylight(s.time) < 0.75) {
      const D = G.DAY_LENGTH, want = 0.83 * D, cur = s.time % D;
      s.time += (want - cur + D) % D; w.time = s.time;
    }
    if (s.weather) s.weather.set('clear', true);
    // every hushling remembers the light at once
    const hush = this.h.hush;
    if (hush) { for (const hl of hush.list) if (hl.a > 0.2) hush.ease(hl); hush.list = []; s.player.glow = 1; }
    w.floorScale = 0;
    w.build('sunflame', site.tx, site.ty);
    this.setRadius(1);
    const st = this.stats;
    st.lit = 1; st.found = 1; st.day = Math.floor(s.time / G.DAY_LENGTH) + 1;
    G.Sound.play('sunrise');
    this.h.burst(x, y - 120, 'rgba(255,240,190,A)', 60);
    this.h.burst(x, y - 120, `hsla(${G.SUN.hue},100%,70%,A)`, 40);
  }

  // the risen Sun's own light: how far its full colour reaches right now
  setRadius(r) {
    const { x, y } = this.centre();
    for (const L of this.state.world.lights) if (L.type === 'sunflame' && L.x === x && L.y === y) L.restore = r;
  }

  // the colour has spread: the map fills in, gifts, and the ending opens
  finish() {
    const s = this.state, w = s.world, h = this.h, site = this.site;
    w.floorScale = 1; w.rebuildLights();
    s.explored.reveal(site.tx, site.ty, G.SUN.restore + 2);
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) h.map.touch(site.tx + dx * 14, site.ty + dy * 14);
    h.ending.open(() => {
      h.ui.toast(this.say('after'), 9);
      h.ui.refresh();
    });
  }

  // mark the hearth as found; true the first time
  found(quiet) {
    const st = this.stats;
    if (st.found) return false;
    st.found = 1;
    this.h.map.touch(this.site.tx, this.site.ty);
    if (!quiet) {
      G.Sound.play('ruin');
      this.h.ui.toast(this.say(st.sensed ? 'found' : 'foundEarly'), 8);
      this.h.ui.placeCaption(this.site.name, G.Sun.litSockets(this.state.world) >= 4 ? 'four embers burn' : 'cold and waiting');
    }
    return true;
  }

  // all four shrines burn: their warmth points the way (called when the last card closes, and checked on load)
  sense() {
    const st = this.stats, s = this.state;
    if (st.sensed || G.Shrines.kindledCount(s.world) < G.SHRINES.length) return false;
    st.sensed = 1;
    this.h.map.touch(this.site.tx, this.site.ty);
    G.Sound.play('ruin');
    this.h.ui.toast(this.say('sensed', { dir: G.Sun.dirTo(s) }), 10);
    this.h.ui.refresh();
    return true;
  }

  update(dt) {
    const s = this.state, w = s.world, p = s.player;
    if (this.rising) {
      const r = this.rising, D = G.SUN.dawnAt, T = G.SUN.riseTime;
      r.t += dt;
      if (!r.dawned && r.t >= D) { r.dawned = true; this.dawn(); }
      if (r.dawned) {   // colour wakes everywhere, and the Sun's own light rolls out
        const u = G.clamp((r.t - D) / (T - D - 1), 0, 1), e = 1 - Math.pow(1 - u, 3);
        w.floorScale = e; w.floor = G.SUN.floor * e;
        this.setRadius(1 + (G.SUN.restore - 1) * e);
        if (Math.floor(r.t * 3) !== r.ver) { r.ver = Math.floor(r.t * 3); w.lightsVersion++; }   // the map recolours as it goes
      }
      if (r.t >= T) { this.rising = null; this.finish(); }
      return;
    }
    if ((this.timer -= dt) > 0) return;
    this.timer = 0.5;
    const st = this.stats;
    if (!st.sensed && !s.shrines.kindling && G.Shrines.kindledCount(w) >= G.SHRINES.length && !this.h.journal.cardOpen) this.sense();
    if (!st.found && Math.hypot(this.site.tx - p.tx, this.site.ty - p.ty) <= G.SUN.findAt) this.found();
    else if (st.found && !st.hinted && !G.Sun.isLit(w) && G.Sun.litSockets(w) >= 4 && Math.hypot(this.site.tx - p.tx, this.site.ty - p.ty) <= 5) {
      st.hinted = 1; this.h.ui.toast(this.say('altarReady'), 6);
    }
  }
};
