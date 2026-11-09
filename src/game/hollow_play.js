// G.HollowPlay — finding the Glowcap Hollows (Night 17). Twice a second it
// looks at the ground under the spirit; stepping into a hollow you haven't
// seen shows its name, plays a little music box and marks it found.
// Saved inside stats: stats.hollow = { found: count, at: { placeId: [tx, ty, name] } }.
window.G = window.G || {};

G.HollowPlay = class {
  // hooks: { ui, map, burst(x, y, color, n) }
  constructor(state, hooks) {
    this.state = state; this.h = hooks;
    this.timer = 0;
  }

  update(dt) {
    if ((this.timer -= dt) > 0) return;
    this.timer = 0.5;
    const s = this.state, p = s.player, w = s.world;
    if (w.tileAt(p.tx, p.ty).type !== 'mushwood') return;
    const H = s.stats.hollow || (s.stats.hollow = { found: 0, at: {} }), place = G.Hollow.placeOf(w, p.tx, p.ty);
    if (H.at[place.id]) return;
    H.at[place.id] = [p.tx, p.ty, place.name];
    H.found = Object.keys(H.at).length;
    G.Sound.play('hollow');
    this.h.ui.placeCaption(place.name, G.HOLLOW_SAYS.sub);
    this.h.ui.toast(H.found === 1 ? G.HOLLOW_SAYS.first : G.HOLLOW_SAYS.again, H.found === 1 ? 9 : 3.5);
    this.h.burst(p.x, p.y - 10, 'rgba(160,255,230,A)', 18);
    this.h.map.touch(p.tx, p.ty);
  }

  // the goal tracker's hint: which way to the hollow near the start
  static hint(s) {
    if (!s.world || !s.player) return G.HOLLOW_SAYS.hintNear;
    const c = G.Hollow.first(s.world), p = s.player, d = Math.round(Math.hypot(c.tx - p.tx, c.ty - p.ty));
    if (d < 16) return G.HOLLOW_SAYS.hintNear;
    return G.HOLLOW_SAYS.hintFar.replace('{d}', Math.round(d / 5) * 5).replace('{dir}', G.Ruins.direction(p.tx, p.ty, c.tx, c.ty));
  }

  // the journal's Places page: every hollow you have found, nearest first
  static places(s) {
    const H = s.stats.hollow, p = s.player;
    if (!H || !H.found) return '';
    const list = Object.values(H.at).sort((a, b) => Math.hypot(a[0] - p.tx, a[1] - p.ty) - Math.hypot(b[0] - p.tx, b[1] - p.ty));
    let h = '';
    for (const [tx, ty, name] of list) {
      const d = Math.round(Math.hypot(tx - p.tx, ty - p.ty));
      const where = d < 8 ? 'right here' : `about ${d} steps ${G.Ruins.direction(p.tx, p.ty, tx, ty)}`;
      h += `<div class="j-place read" style="border-left:3px solid hsla(172,80%,60%,.7)"><b>${name}</b><em>${where}</em><p>${G.HOLLOW_SAYS.about}</p></div>`;
    }
    return h;
  }
};
