// G.Sailing (`state.sail`) — the leaf boat (Night 23). Owning a boat lets the
// spirit walk straight into the water (player.canSail; Player.blocked lets it
// through) and it is then afloat: a slower-to-turn glide, a bobbing boat, a wake.
// This file notices the moments — pushing off, folding the boat on the shore,
// reaching the deep, crossing to a far shore — keeps the wake, and points the
// goal tracker toward the nearest deep water.
// Saved inside stats: stats.sea = { launched, deep, crossed, sailed (tiles), far (most tiles out from where you set off) }.
window.G = window.G || {};

G.Sailing = class {
  // hooks: { ui, map, burst(x, y, color, n), floater(x, y, text, color), panAt(x) }
  constructor(state, hooks) {
    this.state = state; this.h = hooks;
    this.wake = [];         // puffs of foam behind the boat: { x, y, a (angle), life, s (side spread) }
    this.from = null;       // where the spirit last set sail (tiles)
    this.was = false;       // afloat last frame
    this.moved = 0;         // px sailed since the last puff of wake
    this.tileDist = 0;      // px sailed since the last whole tile counted
    this.lastX = null; this.lastY = null;
    this.noBoatT = -99;     // when the "you need a boat" words were last said
  }

  stats() { const s = this.state.stats; return s.sea || (s.sea = { launched: 0, deep: 0, crossed: 0, sailed: 0, far: 0 }); }

  clear() { this.wake = []; this.from = null; this.was = false; this.lastX = null; }

  update(dt) {
    const s = this.state, p = s.player, w = s.world;
    for (const k of this.wake) k.life -= dt * 0.55;
    if (this.wake.length && this.wake[0].life <= 0) this.wake = this.wake.filter(k => k.life > 0);
    p.canSail = G.Crafting.owns(s, 'boat');
    // walking into wide water with no boat: say once in a while how to cross
    if (!p.canSail && p.bumpWater < 0.05 && s.time - this.noBoatT > 90 && w.count('workbench')) {
      this.noBoatT = s.time;
      this.h.ui.toast(G.SEA_SAYS.noBoat, 5);
    }
    const moved = this.lastX === null ? 0 : Math.hypot(p.x - this.lastX, p.y - this.lastY);
    this.lastX = p.x; this.lastY = p.y;
    if (p.flying) { this.from = null; return; }   // the lantern roads are not sailing

    if (p.afloat !== this.was) {
      this.was = p.afloat;
      if (p.afloat) this.launch(); else this.ashore();
    }
    if (p.afloat) this.sailing(dt, moved);
  }

  // pushing off from the shore
  launch() {
    const s = this.state, p = s.player, S = this.stats();
    this.from = { tx: p.tx, ty: p.ty };
    S.launched = (S.launched || 0) + 1;
    G.Sound.play('launch');
    this.h.burst(p.x, p.y + 4, 'rgba(215,240,255,A)', 14);
    if (s.creatures) { s.creatures.ripple(p.x, p.y + 4, 1.4); s.creatures.ripple(p.x, p.y + 4, 0.8); }
    if (S.launched === 1) this.h.ui.toast(G.SEA_SAYS.launch, 8);
  }

  // stepping onto land (or a bridge): the boat folds up small
  ashore() {
    const s = this.state, p = s.player, S = this.stats();
    G.Sound.play('ashore');
    this.h.burst(p.x, p.y, 'rgba(180,230,140,A)', 10);
    const onLand = !s.world.isWater(p.tx, p.ty);
    if (this.from && onLand && Math.hypot(p.tx - this.from.tx, p.ty - this.from.ty) >= G.SEA.far) {
      if (!S.crossed) {
        this.h.ui.toast(G.SEA_SAYS.cross, 5);
        this.h.floater(p.x, p.y - 30, 'A far shore!', '#bfeaff');
        G.Sound.play('meet');
      }
      S.crossed = (S.crossed || 0) + 1;
    }
    this.from = null;
  }

  sailing(dt, moved) {
    const s = this.state, p = s.player, w = s.world, S = this.stats();
    // tiles sailed, and how far out from where you set off
    this.tileDist += moved;
    if (this.tileDist >= G.TILE) { S.sailed = (S.sailed || 0) + Math.floor(this.tileDist / G.TILE); this.tileDist %= G.TILE; }
    if (this.from) S.far = Math.max(S.far || 0, Math.round(Math.hypot(p.tx - this.from.tx, p.ty - this.from.ty)));
    if (!S.deep && w.tileAt(p.tx, p.ty).type === 'deep') {
      S.deep = 1;
      G.Sound.play('deepsea');
      this.h.ui.toast(G.SEA_SAYS.deep, 6);
      this.h.map.touch(p.tx, p.ty);
    }
    // the wake: a soft V of foam from the stern, and rings on the water
    const sp = Math.hypot(p.vx, p.vy);
    this.moved += moved;
    if (this.moved >= G.SEA.wakeEvery && sp > 30) {
      this.moved = 0;
      const a = Math.atan2(p.vy, p.vx);
      if (this.wake.length < 70) this.wake.push({ x: p.x - Math.cos(a) * 12, y: p.y + 3 - Math.sin(a) * 6, a, life: 1, s: Math.min(1, sp / G.SEA.speed) });
      if (s.creatures && Math.random() < 0.3) s.creatures.ripple(p.x - Math.cos(a) * 14, p.y + 4 - Math.sin(a) * 7, 0.6);
    }
  }

  // ---------- the goal tracker's hint: which way to the deep water ----------
  static hint(s) {
    const S = G.SEA_SAYS, p = s.player, w = s.world;
    if (!w || !p) return S.hintNone;
    const memo = G.Sailing.memo;
    if (!memo || memo.w !== w || Math.hypot(memo.tx - p.tx, memo.ty - p.ty) > 8) {
      let found = null;
      for (let r = 0; r <= G.SEA.hintReach && !found; r += 3) {   // ring by ring outward, every few tiles
        const n = Math.max(8, Math.round(r * 1.6));
        for (let i = 0; i < n; i++) {
          const a = i / n * 6.2832, tx = Math.round(p.tx + Math.cos(a) * r), ty = Math.round(p.ty + Math.sin(a) * r);
          if (w.groundType(tx, ty) === 'deep') { found = { tx, ty }; break; }
        }
      }
      G.Sailing.memo = { w, tx: p.tx, ty: p.ty, found };
    }
    const f = G.Sailing.memo.found;
    if (!f) return S.hintNone;
    const d = Math.round(Math.hypot(f.tx - p.tx, f.ty - p.ty));
    if (d < 6) return S.hintNear;
    return S.hintFar.replace('{d}', Math.max(5, Math.round(d / 5) * 5)).replace('{dir}', G.Ruins.direction(p.tx, p.ty, f.tx, f.ty));
  }
};
