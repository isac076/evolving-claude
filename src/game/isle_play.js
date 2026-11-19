// G.IslePlay (`state.isles`) — the Far Isles (Night 27). Twice a second it looks
// around the spirit: stepping onto an island you haven't seen shows its name,
// plays a little steel-drum phrase and marks it found. It works out how strongly
// the tide glows (`tide`, 0..1: only on dark nights, only around an island's
// lagoon; G.IsleFX draws it) and notices the first time you stand in it. Shell
// chimes nearby clink now and then — more often in the wind, and when you pass.
// Saved inside stats: stats.isles = { found, at: { placeId: [tx, ty, name] }, glow: 0/1 }.
window.G = window.G || {};

G.IslePlay = class {
  // hooks: { ui, map, burst(x, y, color, n) }
  constructor(state, hooks) {
    this.state = state; this.h = hooks;
    this.timer = 0; this.chimeT = 0;
    this.near = 0;      // how much of the view around the spirit is island or lagoon (smoothed)
    this.tide = 0;      // how brightly the tide glows now
    this.lastChime = null;   // the chime the spirit last walked past (so passing one rings it once)
  }

  stats() { const s = this.state.stats; return s.isles || (s.isles = { found: 0, at: {}, glow: 0 }); }

  update(dt) {
    this.chimes(dt);
    if ((this.timer -= dt) > 0) return;
    this.timer = 0.5;
    const s = this.state, p = s.player, w = s.world;
    const around = G.Isles.around(w, p.x, p.y, 1000, 640);
    this.near += (around - this.near) * 0.35;
    const here = w.tileAt(p.tx, p.ty).type, onIsle = here === 'isle' || here === 'strand';

    // the glowing tide: dark nights around an island's lagoon (clouds don't hide it — it is in the water)
    const dark = G.clamp((1 - G.daylight(s.time) - 0.4) * 2.2, 0, 1);
    this.tide = dark * G.clamp(this.near * 2.2, 0, 1);
    const I = this.stats();
    if (!I.glow && this.tide > G.ISLES.tide.need && (here === 'strand' || here === 'lagoon')) {
      I.glow = 1;
      G.Sound.play('glowtide');
      this.h.ui.toast(G.ISLE_SAYS.glow, 8);
      this.h.burst(p.x, p.y - 6, 'rgba(120,230,255,A)', 22);
    }

    if (!onIsle) return;
    const place = G.Isles.placeOf(w, p.tx, p.ty);
    if (I.at[place.id]) return;
    I.at[place.id] = [p.tx, p.ty, place.name];
    I.found = Object.keys(I.at).length;
    G.Sound.play('isles');
    this.h.ui.placeCaption(place.name, G.ISLE_SAYS.sub);
    this.h.ui.toast(I.found === 1 ? G.ISLE_SAYS.first : G.ISLE_SAYS.again, I.found === 1 ? 9 : 3.5);
    this.h.burst(p.x, p.y - 10, 'rgba(255,200,190,A)', 20);
    this.h.map.touch(p.tx, p.ty);
  }

  // shell chimes near the spirit clink in the wind, and once whenever you walk right past one
  chimes(dt) {
    if ((this.chimeT -= dt) > 0) return;
    this.chimeT = G.ISLES.chime.every;
    const s = this.state, p = s.player, w = s.world, R = G.ISLES.chime.reach;
    if (!w || !w.count || !this.anyChime()) return;
    let best = null, bd = Infinity;
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
      const st = w.structureAt(p.tx + x, p.ty + y);
      if (st && st.type === 'windchime') { const d = Math.hypot(x, y); if (d < bd) { bd = d; best = st; } }
    }
    if (!best) { this.lastChime = null; return; }
    const pan = G.clamp(((best.tx + 0.5) * G.TILE - p.x) / 400, -1, 1), wind = G.windNow || 0;
    const passing = bd < 2.5 && this.lastChime !== best;
    if (bd < 2.5) this.lastChime = best; else if (bd > 4) this.lastChime = null;
    if (passing || Math.random() < (0.06 + wind * 0.5) * (1 - bd / (R + 1))) G.Sound.play('chime', { pan, soft: !passing });
  }

  anyChime() { return this.state.world.count('windchime') > 0; }

  // the goal tracker's hint: which way to the island near the start (and a word about the boat)
  static hint(s) {
    if (!s.world || !s.player) return G.ISLE_SAYS.hintNear;
    const c = G.Isles.first(s.world), p = s.player, d = Math.round(Math.hypot(c.tx - p.tx, c.ty - p.ty));
    if (d < 14) return G.ISLE_SAYS.hintNear;
    const say = G.Crafting.owns(s, 'boat') ? G.ISLE_SAYS.hintFar : G.ISLE_SAYS.hintBoat;
    return say.replace('{d}', Math.max(5, Math.round(d / 5) * 5)).replace('{dir}', G.Ruins.direction(p.tx, p.ty, c.tx, c.ty));
  }

  // the journal's Places page: every island you have found, nearest first
  static places(s) {
    const I = s.stats.isles, p = s.player;
    if (!I || !I.found) return '';
    const list = Object.values(I.at).sort((a, b) => Math.hypot(a[0] - p.tx, a[1] - p.ty) - Math.hypot(b[0] - p.tx, b[1] - p.ty));
    let h = '';
    for (const [tx, ty, name] of list) {
      const d = Math.round(Math.hypot(tx - p.tx, ty - p.ty));
      const where = d < 8 ? 'right here' : `about ${d} steps ${G.Ruins.direction(p.tx, p.ty, tx, ty)}`;
      h += `<div class="j-place read" style="border-left:3px solid hsla(176,70%,55%,.85)"><b>${name}</b><em>${where}</em><p>${G.ISLE_SAYS.about}</p></div>`;
    }
    return h;
  }
};
