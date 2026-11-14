// G.PeakPlay (`state.peaks`) — the Snowy Peaks (Night 22). Twice a second it
// looks around the spirit: stepping onto a snowfield you haven't seen shows its
// name, plays a glassy chime and marks it found. It also works out how strongly
// the northern lights should shine (`sky`, 0..1): only at night, only up on the
// peaks, dimmed by clouds, brightest where the colour is back. PeakFX draws them.
// Saved inside stats: stats.peaks = { found, at: { placeId: [tx, ty, name] }, aurora: 0/1 }.
window.G = window.G || {};

G.PeakPlay = class {
  // hooks: { ui, map, burst(x, y, color, n) }
  constructor(state, hooks) {
    this.state = state; this.h = hooks;
    this.timer = 0;
    this.near = 0;    // how much of the land around the spirit is snowfield (smoothed)
    this.sky = 0;     // how strongly the northern lights want to shine now
    this.seen = 0;    // seconds the lights have been bright (the goal waits a moment)
  }

  stats() { const s = this.state.stats; return s.peaks || (s.peaks = { found: 0, at: {}, aurora: 0 }); }

  update(dt) {
    if ((this.timer -= dt) > 0) return;
    this.timer = 0.5;
    const s = this.state, p = s.player, w = s.world;
    const around = G.Peaks.around(w, p.x, p.y, 1000, 640);
    this.near += (around - this.near) * 0.35;
    const onSnow = w.tileAt(p.tx, p.ty).type === 'frost';

    // the northern lights: dark, clear, up on the peaks
    const dark = G.clamp((1 - G.daylight(s.time) - 0.45) * 2.4, 0, 1), cloud = s.weather ? s.weather.v.cloud : 0;
    const f = w.restoreAt(p.x, p.y, w.lights);
    this.sky = dark * G.clamp(this.near * 1.6, 0, 1) * (1 - 0.85 * cloud) * (0.45 + 0.55 * f);
    if (this.sky > 0.3 && onSnow) {
      this.seen += 0.5;
      const P = this.stats();
      if (!P.aurora && this.seen >= 2) {
        P.aurora = 1;
        G.Sound.play('aurora');
        this.h.ui.toast(f > 0.5 ? G.PEAK_SAYS.aurora : G.PEAK_SAYS.auroraGrey, 7);
      }
    } else this.seen = 0;

    if (!onSnow) return;
    const P = this.stats(), place = G.Peaks.placeOf(w, p.tx, p.ty);
    if (P.at[place.id]) return;
    P.at[place.id] = [p.tx, p.ty, place.name];
    P.found = Object.keys(P.at).length;
    G.Sound.play('peaks');
    this.h.ui.placeCaption(place.name, G.PEAK_SAYS.sub);
    this.h.ui.toast(P.found === 1 ? G.PEAK_SAYS.first : G.PEAK_SAYS.again, P.found === 1 ? 9 : 3.5);
    this.h.burst(p.x, p.y - 10, 'rgba(225,245,255,A)', 20);
    this.h.map.touch(p.tx, p.ty);
  }

  // the goal tracker's hint: which way to the peak near the start
  static hint(s) {
    if (!s.world || !s.player) return G.PEAK_SAYS.hintNear;
    const c = G.Peaks.first(s.world), p = s.player, d = Math.round(Math.hypot(c.tx - p.tx, c.ty - p.ty));
    if (d < 18) return G.PEAK_SAYS.hintNear;
    return G.PEAK_SAYS.hintFar.replace('{d}', Math.round(d / 5) * 5).replace('{dir}', G.Ruins.direction(p.tx, p.ty, c.tx, c.ty));
  }

  // the journal's Places page: every snowfield you have found, nearest first
  static places(s) {
    const P = s.stats.peaks, p = s.player;
    if (!P || !P.found) return '';
    const list = Object.values(P.at).sort((a, b) => Math.hypot(a[0] - p.tx, a[1] - p.ty) - Math.hypot(b[0] - p.tx, b[1] - p.ty));
    let h = '';
    for (const [tx, ty, name] of list) {
      const d = Math.round(Math.hypot(tx - p.tx, ty - p.ty));
      const where = d < 8 ? 'right here' : `about ${d} steps ${G.Ruins.direction(p.tx, p.ty, tx, ty)}`;
      h += `<div class="j-place read" style="border-left:3px solid hsla(200,80%,85%,.8)"><b>${name}</b><em>${where}</em><p>${G.PEAK_SAYS.about}</p></div>`;
    }
    return h;
  }
};
