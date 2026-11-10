// Sprites for the riverbanks & waymarks (Night 18): clay banks, stepping stones,
// signposts, banners and clay planters, plus the little name tags that float over
// signposts near you. Same rules as sprites.js: f = restoration 0..1, t = time,
// base at the bottom-centre of the tile.
window.G = window.G || {};

(function () {
  const circle = G.circle, shadow = G.shadow;

  // a low mound of wet clay with hand-dug scoops (s = size 0..1, for growing back)
  function clayMound(ctx, x, y, f, t, tile, s) {
    const cx = x + 16, by = y + 25, v = tile.v;
    shadow(ctx, cx, by + 1, 13 * s, 3.5 * s, 0.18);
    ctx.fillStyle = G.shade(16, 42, 34, f);
    ctx.beginPath(); ctx.ellipse(cx, by - 2 * s, 13 * s, 6 * s, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = G.shade(18, 46, 46, f);
    ctx.beginPath(); ctx.ellipse(cx - 1, by - 4 * s, 11 * s, 5 * s, 0, 0, 6.2832); ctx.fill();
    if (s < 0.6) return;
    ctx.fillStyle = G.shade(14, 40, 32, f);   // scoops where it was dug
    ctx.beginPath(); ctx.ellipse(cx - 5 + v * 3, by - 5, 3, 1.6, 0.3, 0, 6.2832); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 4, by - 3 + v * 2, 2.6, 1.3, -0.2, 0, 6.2832); ctx.fill();
    ctx.fillStyle = G.shade(22, 30, 60, f, 0.55);   // a wet sheen on top
    ctx.beginPath(); ctx.ellipse(cx - 3, by - 7, 5, 1.4, -0.15, 0, 6.2832); ctx.fill();
    ctx.fillStyle = G.shade(40, 10, 62, f);   // two little pebbles
    circle(ctx, cx + 9, by - 1, 1.6); circle(ctx, cx - 10 + v * 4, by, 1.2);
    const gl = (t * 0.5 + v * 7) % 4;   // now and then the wet clay catches the light
    if (gl < 0.4) { ctx.fillStyle = `rgba(255,250,235,${(Math.sin(gl / 0.4 * 3.14) * 0.7).toFixed(2)})`; circle(ctx, cx - 4, by - 7, 1.2); }
  }

  G.OBJECT_SPRITES.claybank = (ctx, x, y, f, t, tile) => clayMound(ctx, x, y, f, t, tile, 1);
  G.REGROW_SPRITES.claybank = (ctx, x, y, f, t, tile, p) => { if (p > 0.15) clayMound(ctx, x, y, f, t, tile, 0.35 + p * 0.5); };

  // the colour of a banner (game/signs.js remembers clicks in stats.banners)
  const bannerColour = st => {
    const b = G.state && G.state.stats && G.state.stats.banners, k = st.tx + ',' + st.ty;
    const i = b && b[k] !== undefined ? b[k] : Math.floor(G.hash2(st.tx, st.ty, 77) * G.BANNER_HUES.length);
    return G.BANNER_HUES[i % G.BANNER_HUES.length];
  };

  Object.assign(G.STRUCTURE_SPRITES, {
    // three flat stones set in the shallows, each with its own slow ripple
    stepstones(ctx, x, y, f, t, st) {
      const h = G.hash2(st.tx, st.ty, 13);
      const stones = [[8 + h * 3, 9, 7], [19 - h * 2, 18, 8], [10 + h * 4, 26, 6]];
      for (let i = 0; i < stones.length; i++) {
        const [sx, sy, r] = stones[i], ph = (t * 0.45 + i * 0.37 + h) % 1;
        ctx.strokeStyle = `rgba(220,240,255,${((1 - ph) * 0.35 * (0.4 + f * 0.6)).toFixed(2)})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(x + sx, y + sy + 1, r + 2 + ph * 6, (r + 2 + ph * 6) * 0.45, 0, 0, 6.2832); ctx.stroke();
        ctx.fillStyle = G.shade(210, 20, 20, f, 0.45);   // wet underside
        ctx.beginPath(); ctx.ellipse(x + sx, y + sy + 1.5, r + 0.5, r * 0.55, 0, 0, 6.2832); ctx.fill();
        ctx.fillStyle = G.shade(35, 10, 56, f);
        ctx.beginPath(); ctx.ellipse(x + sx, y + sy - 0.5, r, r * 0.5, 0, 0, 6.2832); ctx.fill();
        ctx.fillStyle = G.shade(38, 12, 68, f);
        ctx.beginPath(); ctx.ellipse(x + sx - 1.2, y + sy - 1.5, r * 0.6, r * 0.25, 0, 0, 6.2832); ctx.fill();
        ctx.fillStyle = G.shade(18, 40, 40, f, 0.8);   // the clay that holds it
        ctx.fillRect(x + sx - r * 0.6, y + sy + r * 0.38, r * 1.2, 1);
      }
    },

    // a wooden post with an arrow-shaped board (the name floats above it when you're close)
    signpost(ctx, x, y, f, t, st) {
      const cx = x + 16, by = y + 27, dir = G.hash2(st.tx, st.ty, 21) < 0.5 ? -1 : 1;
      shadow(ctx, cx, by, 7, 2.5);
      const dark = G.shade(26, 40, 24, f), mid = G.shade(30, 45, 38, f), light = G.shade(34, 45, 52, f);
      ctx.fillStyle = dark; ctx.fillRect(cx - 2, by - 30, 4, 30);
      ctx.fillStyle = mid; ctx.fillRect(cx - 2, by - 30, 1.5, 30);
      const bx = cx - 12, bw = 24, top = by - 28;   // the board, pointing one way
      ctx.fillStyle = mid;
      ctx.beginPath();
      if (dir > 0) { ctx.moveTo(bx, top); ctx.lineTo(bx + bw, top); ctx.lineTo(bx + bw + 5, top + 5); ctx.lineTo(bx + bw, top + 10); ctx.lineTo(bx, top + 10); }
      else { ctx.moveTo(bx + bw, top); ctx.lineTo(bx, top); ctx.lineTo(bx - 5, top + 5); ctx.lineTo(bx, top + 10); ctx.lineTo(bx + bw, top + 10); }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = light; ctx.fillRect(bx, top, bw, 1.5);
      ctx.fillStyle = dark;   // carved letters
      for (let i = 0; i < 5; i++) ctx.fillRect(bx + 3 + i * 4 + G.hash2(st.tx + i, st.ty, 3) * 1.5, top + 4, 2.4, 3);
      ctx.fillStyle = G.shade(18, 45, 44, f);   // a dab of clay where board meets post
      circle(ctx, cx, top + 5, 2.2);
    },

    // a tall pole with a swallow-tailed flag that streams in the wind
    banner(ctx, x, y, f, t, st) {
      const cx = x + 12, by = y + 27, topY = by - 46, wind = G.windNow || 0, dir = G.windDir || 1;
      const [h, s, l] = bannerColour(st), seed = G.hash2(st.tx, st.ty, 5) * 10;
      shadow(ctx, cx + 2, by, 6, 2);
      ctx.fillStyle = G.shade(28, 35, 30, f); ctx.fillRect(cx - 1.5, topY, 3, 46);
      ctx.fillStyle = G.shade(45, 70, 62, f); circle(ctx, cx, topY - 1, 2.6);   // a brass knob
      const len = 25 + wind * 6, drop = 14, segs = 8, side = dir >= 0 ? 1 : -1;
      const pts = [];
      for (let i = 0; i <= segs; i++) {
        const u = i / segs;
        const wave = Math.sin(t * (3 + wind * 5) - u * 4 + seed) * (1.5 + u * (2 + wind * 3));
        const sag = (1 - wind) * u * u * 9;   // hangs a little when the air is still
        pts.push([cx + side * u * len, topY + 2 + wave + sag]);
      }
      const fill = G.shade(h, s, l, f), edge = G.shade(h, s, l * 0.72, f);
      ctx.fillStyle = fill;
      ctx.beginPath(); ctx.moveTo(cx, topY + 2);
      for (const [px, py] of pts) ctx.lineTo(px, py);
      const [ex, ey] = pts[segs];
      ctx.lineTo(ex - side * 5, ey + drop * 0.5);   // the swallow tail
      ctx.lineTo(ex, ey + drop);
      for (let i = segs; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + drop);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = edge; ctx.lineWidth = 1.5;   // a stripe along the middle
      ctx.beginPath();
      for (let i = 0; i <= segs - 1; i++) { const [px, py] = pts[i]; i ? ctx.lineTo(px, py + drop * 0.5) : ctx.moveTo(px, py + drop * 0.5); }
      ctx.stroke();
      ctx.fillStyle = G.shade(h, s * 0.6, Math.min(92, l + 22), f, 0.5);   // the light side of the cloth
      ctx.beginPath(); ctx.moveTo(cx, topY + 2);
      for (let i = 0; i <= segs - 1; i++) ctx.lineTo(pts[i][0], pts[i][1] + 2.5);
      ctx.lineTo(pts[segs - 1][0], pts[segs - 1][1]); ctx.closePath(); ctx.fill();
    },

    // a round terracotta pot of glowing flowers
    claypot(ctx, x, y, f, t, st) {
      const cx = x + 16, by = y + 27, g = Math.max(f, 0.55), r0 = G.hash2(st.tx, st.ty, 9);
      shadow(ctx, cx, by, 10, 3);
      for (let i = 0; i < 5; i++) {   // flowers first, so the pot's rim sits in front of the stems
        const r = G.hash2(st.tx * 5 + i, st.ty, 17), fx = cx - 8 + i * 4 + (r - 0.5) * 2, fy = by - 20 - (i % 2) * 4 - r * 3;
        const sw = G.sway(t * 1.4, i + r0 * 6, 0.9);
        ctx.strokeStyle = G.shade(115, 45, 32, f); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(fx, by - 12); ctx.lineTo(fx + sw, fy); ctx.stroke();
        ctx.fillStyle = G.shade(Math.floor(r0 * 360 + i * 40) % 360, 80, 70, g);
        for (let k = 0; k < 5; k++) circle(ctx, fx + sw + Math.cos(k * 1.256) * 2, fy + Math.sin(k * 1.256) * 2, 1.5);
        ctx.fillStyle = '#fff3c8'; circle(ctx, fx + sw, fy, 1);
      }
      ctx.fillStyle = G.shade(18, 55, 42, f);   // the pot
      ctx.beginPath(); ctx.moveTo(cx - 9, by - 13); ctx.lineTo(cx + 9, by - 13); ctx.lineTo(cx + 6.5, by); ctx.lineTo(cx - 6.5, by); ctx.closePath(); ctx.fill();
      ctx.fillStyle = G.shade(20, 55, 52, f); ctx.fillRect(cx - 10, by - 15, 20, 4);   // rim
      ctx.fillStyle = G.shade(22, 50, 62, f); ctx.fillRect(cx - 10, by - 15, 20, 1.2);
      ctx.fillStyle = G.shade(16, 50, 34, f); ctx.fillRect(cx - 7, by - 7, 14, 1.5);   // a painted band
    },
  });

  // a parchment tag with the name, over each signpost near the spirit (drawn above the night)
  G.drawSignTags = function (ctx, signs, player, camX, camY, W, H, t) {
    const T = G.TILE, R = G.RIVER.readAt * T;
    ctx.font = 'italic 13px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const s of signs) {
      const x = (s.tx + 0.5) * T - camX, y = s.ty * T - camY - 6;
      if (x < -80 || x > W + 80 || y < -40 || y > H + 40) continue;
      const d = Math.hypot((s.tx + 0.5) * T - player.x, (s.ty + 0.5) * T - player.y);
      const a = G.clamp(1 - (d - R * 0.6) / (R * 0.4), 0, 1);
      if (a <= 0.01) continue;
      const bob = Math.sin(t * 1.6 + s.tx) * 1.2, w = ctx.measureText(s.name).width + 16, yy = y - 16 + bob;
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(40,26,14,.55)'; roundRect(ctx, x - w / 2 + 1, yy - 10 + 2, w, 20, 6); ctx.fill();
      ctx.fillStyle = 'rgba(250,236,204,.94)'; roundRect(ctx, x - w / 2, yy - 10, w, 20, 6); ctx.fill();
      ctx.strokeStyle = 'rgba(160,110,60,.7)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#5a3a1c'; ctx.fillText(s.name, x, yy + 0.5);
    }
    ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic';
  };

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
})();
