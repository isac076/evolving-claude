// Sprites for gardens (Night 8): sprouts and saplings that visibly grow,
// the moonflower, and things growing back after they were gathered
// (a stump that sprouts a new little tree, reeds pushing up again...).
// Same rules as sprites.js: f = restoration 0..1, t = time, base at bottom-centre.
window.G = window.G || {};

(function () {
  const circle = G.circle, shadow = G.shadow;

  // a little mound of soil; darker and glistening when damp
  function mound(ctx, cx, by, f, wet, t) {
    ctx.fillStyle = G.shade(26, 38, wet ? 17 : 24, f);
    ctx.beginPath(); ctx.ellipse(cx, by - 1, 9, 4, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = G.shade(28, 34, wet ? 23 : 32, f);
    ctx.beginPath(); ctx.ellipse(cx - 1, by - 2.5, 6, 2, 0, 0, 6.2832); ctx.fill();
    if (wet) {   // a few shining wet specks that twinkle
      for (let i = 0; i < 3; i++) {
        const a = 0.35 + 0.35 * Math.sin(t * 3 + i * 2.1);
        ctx.fillStyle = `rgba(200,230,255,${a.toFixed(2)})`;
        ctx.fillRect(cx - 5 + i * 4, by - 2 - (i % 2), 1.5, 1);
      }
    }
  }

  // a pair of leaves on a stem at (x, y), size s
  function leaves(ctx, x, y, s, f, hue = 112) {
    ctx.fillStyle = G.shade(hue, 50, 38, f);
    ctx.beginPath(); ctx.ellipse(x - s * 0.9, y, s, s * 0.45, -0.5, 0, 6.2832); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + s * 0.9, y - 0.5, s, s * 0.45, 0.5, 0, 6.2832); ctx.fill();
  }

  const worldOf = () => G.state && G.state.world;

  // a young tree: stem and a ball of leaves that both grow with g (0..1)
  function youngTree(ctx, cx, by, f, t, g, seed) {
    const sway = G.sway(t * 1.3, seed * 10, 0.6 + g * 1.2);
    const h = 5 + g * 16, hue = 112 + seed * 34, r = 2.5 + g * 7;
    ctx.strokeStyle = G.shade(28, 38, 28, f); ctx.lineWidth = 1.2 + g * 1.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, by - 2); ctx.quadraticCurveTo(cx, by - h * 0.6, cx + sway, by - h); ctx.stroke();
    ctx.lineCap = 'butt';
    if (g < 0.25) { leaves(ctx, cx + sway, by - h, 2 + g * 8, f, hue); return; }
    ctx.fillStyle = G.shade(hue, 45, 24, f); circle(ctx, cx + sway, by - h - r * 0.4, r);
    ctx.fillStyle = G.shade(hue, 50, 32, f); circle(ctx, cx + sway - r * 0.35, by - h - r * 0.75, r * 0.65);
    ctx.fillStyle = G.shade(hue, 52, 40, f); circle(ctx, cx + sway + r * 0.2, by - h - r * 1.05, r * 0.4);
  }

  Object.assign(G.STRUCTURE_SPRITES, {
    sprout(ctx, x, y, f, t, st) {
      const cx = x + 16, by = y + 26, g = st.g || 0, w = worldOf();
      shadow(ctx, cx, by + 1, 10, 3, 0.15);
      mound(ctx, cx, by, f, st.wet > 0, t);
      if (g < 0.12) {   // just seeds peeking out of the soil
        ctx.fillStyle = G.shade(330, 40, 70, f);
        circle(ctx, cx - 2, by - 3, 1); circle(ctx, cx + 2, by - 2.5, 1);
        return;
      }
      const sway = G.sway(t * 1.6, st.tx * 3.1 + st.ty, 0.4 + g);
      const h = 3 + g * 11;
      ctx.strokeStyle = G.shade(125, 45, 34, f); ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(cx, by - 2); ctx.quadraticCurveTo(cx, by - h * 0.6, cx + sway, by - h); ctx.stroke();
      leaves(ctx, cx + sway * 0.4, by - 3 - h * 0.35, 1.5 + g * 3, f, 120);
      if (g > 0.6 && w) {   // a bud that shows which flower it will be
        const rare = G.Garden.prototype.intoOf(w, st) === 'moonflower';
        const hue = rare ? 210 : w.tileAt(st.tx, st.ty).hue, b = (g - 0.6) / 0.4;
        ctx.fillStyle = G.shade(hue, rare ? 50 : 75, rare ? 82 : 66, Math.max(f, 0.4));
        ctx.beginPath(); ctx.ellipse(cx + sway, by - h - 1.5 * b, 1.4 + b * 1.6, 2 + b * 2, 0, 0, 6.2832); ctx.fill();
        ctx.fillStyle = G.shade(120, 45, 30, f); ctx.fillRect(cx + sway - 1.5, by - h, 3, 1.2);
      } else leaves(ctx, cx + sway, by - h, 1.2 + g * 2, f, 120);
    },

    sapling(ctx, x, y, f, t, st) {
      const cx = x + 16, by = y + 27, g = st.g || 0;
      const seed = G.hash2(st.tx, st.ty, 17);
      shadow(ctx, cx, by + 1, 8 + g * 6, 3, 0.18);
      mound(ctx, cx, by, f, st.wet > 0, t);
      // a little wooden stake with a twine bow keeps it straight
      ctx.fillStyle = G.shade(30, 40, 42, f); ctx.fillRect(cx + 5, by - 14, 2, 13);
      ctx.fillStyle = G.shade(45, 35, 70, f); ctx.fillRect(cx + 2, by - 10, 5, 1.2);
      youngTree(ctx, cx, by, f, t, g, seed);
    },
  });

  Object.assign(G.OBJECT_SPRITES, {
    // pale blue petals that open at night and fold into a bud by day
    moonflower(ctx, x, y, f, t, tile) {
      const cx = x + 16, by = y + 27, sway = G.sway(t * 1.4, tile.v * 20, 1.2);
      const open = G.clamp((1 - G.daylight(t)) * 1.4, 0.12, 1), g = Math.max(f, 0.5);
      ctx.strokeStyle = G.shade(140, 35, 32, f); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx, by); ctx.quadraticCurveTo(cx - 1, by - 9, cx + sway, by - 16); ctx.stroke();
      leaves(ctx, cx - 0.5, by - 5, 3.5, f, 140);
      const px = cx + sway, py = by - 17, hue = 200 + (tile.hue % 30);
      for (let i = 0; i < 6; i++) {
        const a = i * 1.0472 + 0.3, r = 1.5 + open * 3.6;
        ctx.fillStyle = G.shade(hue, 55, 80 + (i % 2) * 6, g);
        ctx.beginPath();
        ctx.ellipse(px + Math.cos(a) * r, py + Math.sin(a) * r * (0.5 + open * 0.5), 1.6 + open * 1.6, 1.2 + open * 0.6, a, 0, 6.2832);
        ctx.fill();
      }
      ctx.fillStyle = `rgba(240,250,255,${(0.6 + open * 0.4).toFixed(2)})`; circle(ctx, px, py, 1.2 + open);
    },
  });

  // Things growing back after they were gathered: p = 0 (just gathered) .. 1 (back)
  G.REGROW_SPRITES = {
    tree(ctx, x, y, f, t, tile, p) {
      const cx = x + 16, by = y + 28;
      shadow(ctx, cx, by, 8, 3, 0.18);
      ctx.fillStyle = G.shade(28, 38, 24, f); ctx.fillRect(cx - 4, by - 6, 8, 6);   // the stump
      ctx.fillStyle = G.shade(34, 40, 46, f);
      ctx.beginPath(); ctx.ellipse(cx, by - 6, 4, 1.6, 0, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = G.shade(30, 35, 34, f); ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.ellipse(cx, by - 6, 2, 0.8, 0, 0, 6.2832); ctx.stroke();
      if (p > 0.15) youngTree(ctx, cx + 5, by - 1, f, t, (p - 0.15) / 0.85 * 0.8, tile.v);
    },
    bloom(ctx, x, y, f, t, tile, p) {
      if (p < 0.2) return;
      const s = (p - 0.2) / 0.8, cx = x + 16, by = y + 26;
      ctx.strokeStyle = G.shade(130, 40, 32, f); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(cx, by); ctx.lineTo(cx, by - 2 - s * 7); ctx.stroke();
      leaves(ctx, cx, by - 2 - s * 6, 1 + s * 2, f, 125);
    },
    reeds(ctx, x, y, f, t, tile, p) {
      const by = y + 28, n = 4 + Math.floor(tile.v * 3);
      ctx.strokeStyle = G.shade(80, 40, 36, f); ctx.lineWidth = 1.4;
      for (let i = 0; i < n; i++) {
        const bx = x + 8 + (i / (n - 1)) * 16, h = 2 + p * (8 + G.hash2(tile.hue, i, 3) * 6);
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + G.sway(t, i, 0.5), by - h); ctx.stroke();
      }
    },
    rock(ctx, x, y, f, t, tile, p) {   // a few pebbles, slowly gathering together
      ctx.fillStyle = G.shade(220, 8, 46, f);
      for (let i = 0; i < 3; i++) {
        const r = 1.5 + p * 2.5 + G.hash2(tile.hue, i, 7) * 1.5;
        ctx.beginPath(); ctx.ellipse(x + 10 + i * 6, y + 24 - (i % 2) * 2, r, r * 0.7, 0, 0, 6.2832); ctx.fill();
      }
    },
    crystal(ctx, x, y, f, t, tile, p) {   // tiny shards pushing up through the stone
      const hue = 190 + (tile.hue % 50), cx = x + 16, by = y + 27;
      ctx.fillStyle = G.shade(hue, 60, 62, Math.max(f, 0.5), 0.5 + p * 0.5);
      for (const [dx, h] of [[-4, 4], [3, 5], [0, 7]]) {
        const hh = 1 + h * p;
        ctx.beginPath(); ctx.moveTo(cx + dx - 1.5, by); ctx.lineTo(cx + dx, by - hh); ctx.lineTo(cx + dx + 1.5, by); ctx.fill();
      }
    },
  };
  G.REGROW_SPRITES.moonflower = G.REGROW_SPRITES.bloom;
})();
