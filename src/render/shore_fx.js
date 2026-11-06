// Shore foam (Night 14): a soft, slowly breathing line of light where water meets
// land, plus a fainter wave line that rolls in and out. It follows the rounded
// corners that G.drawGround paints (roundCorners in sprites.js, radius R), so the
// coast reads as one smooth curve. Drawn by the renderer right after the ground.
window.G = window.G || {};

(function () {
  const R = 11;   // must match roundCorners' radius in sprites.js
  // per side [up, right, down, left]: the two corners (as tile offsets), the inward normal (into the water)
  const SIDES = [
    { a: [0, 0], b: [1, 0], n: [0, 1] },
    { a: [1, 0], b: [1, 1], n: [-1, 0] },
    { a: [0, 1], b: [1, 1], n: [0, -1] },
    { a: [0, 0], b: [0, 1], n: [1, 0] },
  ];
  // for side i: [side at corner a, diagonal at corner a, side at corner b, diagonal at corner b]
  // n8 = [up, right, down, left, up-left, up-right, down-right, down-left]
  const ENDS = [[3, 4, 1, 5], [0, 5, 2, 6], [3, 7, 1, 6], [0, 4, 2, 7]];
  const land = t => !G.TILES[t.type].water;

  // the foam pieces of one water tile at offset o from the shore, added to the current path
  function trace(ctx, x, y, n8, o) {
    const T = G.TILE;
    for (let i = 0; i < 4; i++) {
      if (!land(n8[i])) continue;
      const S = SIDES[i], [ja, da, jb, db] = ENDS[i], vertical = i === 0 || i === 2;
      const ax = x + S.a[0] * T, ay = y + S.a[1] * T, bx = x + S.b[0] * T, by = y + S.b[1] * T;
      const ex = Math.sign(bx - ax), ey = Math.sign(by - ay);   // along the edge, a → b
      const nx = S.n[0], ny = S.n[1];
      // how each end meets its corner: 'nook' (land on both sides), 'cape' (land corner rounded off), 'on' (shore goes on straight)
      const kind = (j, d) => land(n8[j]) ? 'nook' : land(n8[d]) ? 'on' : 'cape';
      const ka = kind(ja, da), kb = kind(jb, db);
      const sa = ka === 'on' ? 0 : R, sb = kb === 'on' ? 0 : R;
      ctx.moveTo(ax + ex * sa + nx * o, ay + ey * sa + ny * o);
      ctx.lineTo(bx - ex * sb + nx * o, by - ey * sb + ny * o);
      if (!vertical) continue;   // each corner arc is drawn once, from the top or bottom side
      for (const [k, cx, cy, s] of [[ka, ax, ay, -1], [kb, bx, by, 1]]) {
        // s: which way the edge runs out of this corner (-1 at a, +1 at b)
        const ox = ex * s, oy = ey * s;   // unit vector pointing from the segment out to the corner
        if (k === 'nook') {   // land fills the corner with a curve; the foam bends inside it
          const side = SIDES[s < 0 ? ja : jb].n, px = cx + nx * R + side[0] * R, py = cy + ny * R + side[1] * R;
          const a0 = Math.atan2(-ny, -nx), a1 = Math.atan2(-side[1], -side[0]);
          ctx.moveTo(px + Math.cos(a0) * (R - o), py + Math.sin(a0) * (R - o));
          ctx.arc(px, py, R - o, a0, a1, cross(a0, a1));
        } else if (k === 'cape') {   // the land corner is rounded off: the foam wraps around it
          const px = cx - nx * R - ox * R, py = cy - ny * R - oy * R;
          const a0 = Math.atan2(ny, nx), a1 = Math.atan2(oy, ox);
          ctx.moveTo(px + Math.cos(a0) * (R + o), py + Math.sin(a0) * (R + o));
          ctx.arc(px, py, R + o, a0, a1, cross(a0, a1));
        }
      }
    }
  }
  // go the short (quarter-turn) way from a0 to a1
  function cross(a0, a1) { let d = a1 - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d < 0; }

  G.ShoreFX = {
    draw(ctx, x, y, f, t, tx, ty, n8) {
      if (!(land(n8[0]) || land(n8[1]) || land(n8[2]) || land(n8[3]))) return;
      const ph = tx * 0.55 + ty * 0.8, vis = 0.35 + 0.65 * f;
      const snow = G.SEASON_NOW.snow || 0;
      ctx.lineCap = 'round';
      // the foam line right at the shore, breathing softly
      ctx.globalAlpha = (0.4 + 0.16 * Math.sin(t * 1.3 + ph)) * vis * (1 - snow * 0.4);
      ctx.strokeStyle = '#eef8ff'; ctx.lineWidth = 2;
      ctx.beginPath(); trace(ctx, x, y, n8, 2.5); ctx.stroke();
      // a wave line that rolls out and fades, then comes back
      const w = 0.5 + 0.5 * Math.sin(t * 0.8 + ph * 0.6);
      ctx.globalAlpha = (1 - w) * 0.34 * vis;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); trace(ctx, x, y, n8, 5 + w * 5); ctx.stroke();
      ctx.globalAlpha = 1; ctx.lineCap = 'butt';
    },
  };
})();
