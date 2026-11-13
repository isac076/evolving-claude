// Names on the big map (Night 21). Shrines, the Sun's Hearth, villages and signposts
// add their name here while their mark is drawn; flush() writes them all at the end,
// most important first, nudging each one (below its mark, to a side) away from names
// already placed, so two places close together never print on top of each other.
window.G = window.G || {};

G.MapLabels = {
  list: [],

  begin() { this.list.length = 0; },

  // y = where the name would like to sit (its baseline); below = how far down the
  // "under the mark" spot is from there; pri = who gets the best spot first
  add(text, x, y, o = {}) {
    this.list.push({ text, x, y, pri: o.pri || 0, below: o.below || 20, color: o.color || '#ffe9c4',
      font: o.font || 'italic 12px Georgia, serif', shadow: o.shadow || 'rgba(10,12,30,.7)' });
  },

  // the spots tried for a name, in order (dx in label widths, dy as baseline shifts)
  spots(L, w) {
    const out = [], side = w * 0.5 + 10, up = L.below < 0 ? 1 : -1;   // "further away" from the mark
    for (const dy of [0, L.below, L.below * 0.5, 15 * up, L.below - 15 * up, 30 * up, L.below - 30 * up])
      for (const dx of [0, side, -side]) out.push([dx, dy]);
    return out;
  },

  flush(ctx) {
    const placed = [], items = this.list.slice().sort((a, b) => b.pri - a.pri);
    const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    ctx.textAlign = 'center';
    for (const L of items) {
      ctx.font = L.font;
      const w = ctx.measureText(L.text).width + 6, h = 15;
      let at = null;
      for (const [dx, dy] of this.spots(L, w)) {
        const r = { x: L.x + dx - w / 2, y: L.y + dy - 11, w, h };
        if (!placed.some(p => hit(p, r))) { at = [dx, dy, r]; break; }
      }
      if (!at) at = [0, 0, { x: L.x - w / 2, y: L.y - 11, w, h }];   // nowhere free: the first spot after all
      placed.push(at[2]);
      const x = L.x + at[0], y = L.y + at[1];
      ctx.fillStyle = L.shadow; ctx.fillText(L.text, x + 1, y + 1);
      ctx.fillStyle = L.color; ctx.fillText(L.text, x, y);
    }
    this.list.length = 0;
    this.last = placed;   // where the names went (the smoke test checks they never overlap)
  },
};
