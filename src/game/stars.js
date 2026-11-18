// G.StarChart (`state.chart`) — the Star Chart's watcher (Night 26; data in
// src/data/stars.js). Once a second it looks at your deeds; a star whose deed is
// done lights up: a banner slides in at the top with a chime, and when the last
// star of a constellation lights, it is complete — a bigger chime, stardust, and
// the first one teaches the Star lantern.
// The first time a save meets the chart (old saves, Night 25 and before) every
// star already earned lights quietly, with one toast saying how many.
// Saved inside stats (no version bump): stats.chart = { starId: day it lit },
// stats.chartDone = [constellation ids complete], stats.chartOpened = pages seen.
window.G = window.G || {};

G.StarChart = class {
  // hooks: { ui, burst(x, y, color, n), floater(x, y, text, color) }
  constructor(state, hooks) {
    this.state = state; this.h = hooks;
    this.timer = 0.5;
    this.queue = [];        // banners waiting to show: { star, con, done }
    this.showT = 0;         // seconds the banner on screen has left
    this.fresh = null;      // id of the star lit most recently (the journal page makes it twinkle)
    this.el = document.getElementById('star-banner');
  }

  static need(star) { return typeof star.need === 'function' ? star.need() : star.need; }
  static value(state, star) { try { return star.value(state) || 0; } catch (e) { return 0; } }
  static lit(state, id) { return !!(state.stats.chart && state.stats.chart[id]); }
  static count(state) { return Object.keys(state.stats.chart || {}).length; }
  static total() { return G.CONSTELLATIONS.reduce((a, c) => a + c.stars.length, 0); }
  static complete(state, con) { return con.stars.every(st => G.StarChart.lit(state, st.id)); }

  // after a load or a new world: no banners left over; a save that never had a chart lights its stars quietly
  reset() {
    this.queue = []; this.showT = 0; this.timer = 0.5; this.fresh = null;
    if (this.el) this.el.classList.remove('show');
    const s = this.state.stats;
    if (s.chart) return;
    s.chart = {}; s.chartDone = [];
    const n = this.look(true);
    if (n) setTimeout(() => { if (this.state.running) this.h.ui.toast(G.STARS_SAYS.old(n), 8); }, 2600);
  }

  update(dt) {
    const s = this.state;   // Star lanterns' glow drifts through the colours with their glass star
    for (const L of s.world.lights) if (L.type === 'starlantern') L.hue = G.starHue(s.time, Math.floor(L.x / G.TILE), Math.floor(L.y / G.TILE));
    if (this.showT > 0 && (this.showT -= dt) <= 0) { this.el.classList.remove('show'); this.showT = -0.6; }   // a breath between banners
    else if (this.showT < 0 && (this.showT += dt) >= 0) this.showT = 0;
    if (this.showT === 0 && this.queue.length) this.banner(this.queue.shift());
    if ((this.timer -= dt) > 0) return;
    this.timer = G.STAR_CHART.every;
    this.look(false);
  }

  // light every star whose deed is done; quiet = no banners or gifts (returns how many lit)
  look(quiet) {
    const s = this.state, chart = s.stats.chart || (s.stats.chart = {}), done = s.stats.chartDone || (s.stats.chartDone = []);
    const day = Math.floor(s.time / G.DAY_LENGTH) + 1;
    let lit = 0;
    for (const con of G.CONSTELLATIONS) {
      for (const star of con.stars) {
        if (chart[star.id] || G.StarChart.value(s, star) < G.StarChart.need(star)) continue;
        chart[star.id] = day; lit++;
        if (!quiet) { this.fresh = star.id; this.queue.push({ star, con }); }
      }
      if (!done.includes(con.id) && G.StarChart.complete(s, con)) {
        done.push(con.id);
        if (!quiet) this.queue.push({ con, done: true });
        this.gift(con, quiet);
      }
    }
    return lit;
  }

  // a finished constellation: stardust, and the first teaches the Star lantern
  gift(con, quiet) {
    const s = this.state;
    for (const [k, n] of Object.entries(G.STAR_CHART.gift)) { s.inv[k] = (s.inv[k] || 0) + n; s.stats.got[k] = (s.stats.got[k] || 0) + n; }
    const un = s.stats.unlocked || (s.stats.unlocked = []);
    const teach = !un.includes(G.STAR_CHART.teach);
    if (teach) un.push(G.STAR_CHART.teach);
    if (this.h.ui.refresh) this.h.ui.refresh();
    if (quiet) return;
    const p = s.player;
    this.h.floater(p.x, p.y - 44, `+${G.STAR_CHART.gift.stardust} Stardust`, G.ITEMS.stardust.color);
    if (teach) setTimeout(() => { if (this.state.running) this.h.ui.toast(G.STARS_SAYS.teach, 8); }, 5200);
  }

  // the banner at the top: a new star, or a whole constellation
  banner(b) {
    const s = this.state, p = s.player, el = this.el, hue = b.con.hue;
    const first = !b.done && G.StarChart.count(s) === 1;
    el.style.setProperty('--hue', hue);
    el.classList.toggle('whole', !!b.done);
    if (b.done) {
      el.innerHTML = `<i></i><div><small>Constellation complete</small><b>${b.con.name}</b><span>${b.con.about}</span></div>`;
      G.Sound.play('constellation');
      this.h.ui.toast(G.STARS_SAYS.done(b.con), 6);
      this.h.burst(p.x, p.y - 20, `hsla(${hue},90%,80%,A)`, 30);
    } else {
      el.innerHTML = `<i></i><div><small>A new star in ${b.con.name}</small><b>${b.star.name}</b><span>${b.star.text}</span></div>`;
      G.Sound.play('star', { n: G.StarChart.count(s) });
      this.h.burst(p.x, p.y - 24, `hsla(${hue},90%,85%,A)`, 12);
      if (first) this.h.ui.toast(G.STARS_SAYS.first, 8);
    }
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    this.showT = G.STAR_CHART.banner + (b.done ? 1.5 : 0);
  }
};
