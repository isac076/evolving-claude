// Sprites for the Glowcap Hollows (Night 17): the mossy violet ground, giant
// mushrooms, glowcaps (which kept their colour through the Fading, so they stay
// bright even in grey land), the Mushroom lamp, spore patches growing in a
// garden, things growing back, and the glow snail.
// Same rules as sprites.js: f = restoration 0..1, t = time, base at bottom-centre.
window.G = window.G || {};

(function () {
  const circle = G.circle, shadow = G.shadow;
  // giant mushroom caps: [hue, saturation, lightness], picked by the tile
  const CAPS = [[284, 50, 50], [312, 52, 58], [196, 50, 48], [264, 42, 52], [334, 48, 60], [176, 42, 46]];

  // ---------- ground: soft moss cushions, and now and then a tiny pale toadstool ----------
  G.drawHollowGround = function (ctx, tile, d, x, y, f, t) {
    const v = tile.v, w = (v * 53.7) % 1, sn = d.snow > 0.6;
    if (!sn) {
      ctx.fillStyle = G.shade(d.h - 70, d.s + 14, d.l + 3, f, 0.55);   // green-blue moss on the violet earth
      ctx.beginPath(); ctx.ellipse(x + 6 + w * 18, y + 8 + v * 16, 5 + w * 4, 2.6, 0, 0, 6.2832); ctx.fill();
      if (w > 0.45) { ctx.beginPath(); ctx.ellipse(x + 26 - w * 14, y + 25 - v * 8, 4, 2, 0, 0, 6.2832); ctx.fill(); }
    }
    if (v > 0.72) {   // tiny toadstools and glowing dots in the moss
      const px = x + 4 + ((v * 97) % 1) * 24, py = y + 10 + w * 16;
      ctx.fillStyle = G.shade(40, 25, 82, f); ctx.fillRect(px - 0.6, py - 3, 1.2, 3);
      ctx.fillStyle = G.shade(CAPS[tile.hue % CAPS.length][0], 45, 66, Math.max(f, 0.35));
      ctx.beginPath(); ctx.ellipse(px, py - 3, 2.2, 1.4, 0, 3.1, 6.33); ctx.fill();
    }
    if (v < 0.18) {
      const a = 0.35 + 0.35 * Math.sin(t * 1.7 + v * 70);
      ctx.fillStyle = `hsla(${165 + tile.hue % 40},90%,75%,${(a * (0.4 + 0.6 * f)).toFixed(2)})`;
      ctx.fillRect(x + 5 + w * 20, y + 6 + v * 90, 1.6, 1.6);
      ctx.fillRect(x + 22 - w * 9, y + 22 - v * 40, 1.2, 1.2);
    }
  };

  // a mushroom cap (a dome) with spots; (cx, cy) = the middle of its rim
  function cap(ctx, cx, cy, w, h, c, f, spots, seed) {
    ctx.fillStyle = G.shade(c[0], c[1] - 10, c[2] - 22, f);   // the shadowed gills under the rim
    ctx.beginPath(); ctx.ellipse(cx, cy, w * 0.92, h * 0.28, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = G.shade(c[0], c[1], c[2], f);
    ctx.beginPath(); ctx.ellipse(cx, cy - 1, w, h, 0, 3.1416, 6.2832); ctx.fill();
    ctx.fillStyle = G.shade(c[0], c[1] - 4, c[2] + 12, f);   // light on top
    ctx.beginPath(); ctx.ellipse(cx - w * 0.25, cy - h * 0.62, w * 0.42, h * 0.28, -0.2, 0, 6.2832); ctx.fill();
    ctx.fillStyle = G.shade(c[0] + 20, 30, 90, f);
    for (let i = 0; i < spots; i++) {
      const a = 3.4 + ((seed * (i + 3) * 7.3) % 1) * 2.6, r = 0.35 + ((seed * (i + 1) * 3.1) % 1) * 0.5;
      circle(ctx, cx + Math.cos(a) * w * r, cy - 1 + Math.sin(a) * h * r * 1.1, 1 + (i % 2) * 0.7);
    }
  }

  Object.assign(G.OBJECT_SPRITES, {
    bigshroom(ctx, x, y, f, t, tile) {
      const v = tile.v, cx = x + 16, by = y + 28, c = CAPS[tile.hue % CAPS.length];
      const hgt = 20 + ((v * 17.3) % 1) * 12, w = 14 + ((v * 7.1) % 1) * 6, lean = (((v * 3.7) % 1) - 0.5) * 6;
      const sway = G.sway(t * 0.8, v * 10, 0.5);
      shadow(ctx, cx, by, w * 0.8, 4.5);
      ctx.fillStyle = G.shade(40, 22, 76, f);   // the stalk, gently curved
      ctx.beginPath();
      ctx.moveTo(cx - 4.5, by); ctx.quadraticCurveTo(cx - 3 + lean * 0.3, by - hgt * 0.5, cx - 3 + lean + sway, by - hgt);
      ctx.lineTo(cx + 3 + lean + sway, by - hgt); ctx.quadraticCurveTo(cx + 3 + lean * 0.3, by - hgt * 0.5, cx + 4.5, by);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = G.shade(40, 18, 64, f); ctx.fillRect(cx + 1.5 + lean * 0.4, by - hgt * 0.8, 1.5, hgt * 0.7);
      ctx.fillStyle = G.shade(40, 20, 84, f);   // a little frilled ring
      ctx.beginPath(); ctx.ellipse(cx + lean * 0.65 + sway * 0.6, by - hgt * 0.62, 5, 1.6, 0, 0, 6.2832); ctx.fill();
      cap(ctx, cx + lean + sway, by - hgt, w, 10 + w * 0.15, c, f, 5, v);
      const sn = G.SEASON_NOW.snow;
      if (sn > 0.05) {
        ctx.fillStyle = G.shade(212, 30, 94, f, sn.toFixed(2));
        ctx.beginPath(); ctx.ellipse(cx + lean + sway, by - hgt - 6, w * 0.8, 5, 0, 3.1, 6.33); ctx.fill();
      }
    },

    // a cluster of little mushrooms whose caps shine: they never lost their colour
    glowcap(ctx, x, y, f, t, tile) {
      const cx = x + 16, by = y + 27, hue = 165 + (tile.hue % 50), g = Math.max(f, 0.6), v = tile.v;
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.6 + v * 30);
      const caps = [[-6, 7, 3.6], [1, 11, 4.6], [7, 6, 3.2]];
      for (const [dx, h, r] of caps) {
        const sx = cx + dx + G.sway(t * 1.2, v * 9 + dx, 0.3);
        ctx.strokeStyle = G.shade(50, 20, 80, f); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(cx + dx * 0.8, by); ctx.lineTo(sx, by - h); ctx.stroke();
        ctx.fillStyle = `hsla(${hue},90%,70%,${(0.18 + 0.2 * pulse).toFixed(2)})`;   // a halo
        circle(ctx, sx, by - h - 1, r + 2.5);
        ctx.fillStyle = G.shade(hue, 70, 58 + pulse * 8, g);
        ctx.beginPath(); ctx.ellipse(sx, by - h, r, r * 0.8, 0, 3.1416, 6.2832); ctx.fill();
        ctx.fillStyle = G.shade(hue, 80, 86, g); circle(ctx, sx - r * 0.3, by - h - r * 0.45, 0.9);
      }
    },
  });

  Object.assign(G.STRUCTURE_SPRITES, {
    // a tall cultivated mushroom with a lamp-bright cap and little lights hanging from its rim
    shroomlamp(ctx, x, y, f, t) {
      const cx = x + 16, by = y + 28, p = 0.5 + 0.5 * Math.sin(t * 1.3), top = by - 40;
      const pool = ctx.createRadialGradient(cx, by - 2, 2, cx, by - 2, 26);   // a pool of teal light on the moss
      pool.addColorStop(0, `rgba(150,255,225,${(0.22 + 0.08 * p).toFixed(2)})`); pool.addColorStop(1, 'rgba(120,240,220,0)');
      ctx.fillStyle = pool; ctx.beginPath(); ctx.ellipse(cx, by - 2, 26, 11, 0, 0, 6.2832); ctx.fill();
      shadow(ctx, cx, by, 10, 3.5);
      ctx.fillStyle = '#4a3b5c'; ctx.beginPath(); ctx.ellipse(cx, by - 2, 9, 3.4, 0, 0, 6.2832); ctx.fill();   // a stone ring at its foot
      ctx.fillStyle = '#6a5a7e'; ctx.beginPath(); ctx.ellipse(cx, by - 3, 7, 2.2, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = '#ece2cc';
      ctx.beginPath(); ctx.moveTo(cx - 4, by - 3); ctx.quadraticCurveTo(cx - 2, by - 22, cx - 2.6, top + 6); ctx.lineTo(cx + 2.6, top + 6);
      ctx.quadraticCurveTo(cx + 2, by - 22, cx + 4, by - 3); ctx.fill();
      ctx.fillStyle = '#cbbda6'; ctx.fillRect(cx + 1, top + 8, 1.3, 30);
      ctx.strokeStyle = '#8a7aa0'; ctx.lineWidth = 1.3;   // a twist of vine with two leaves
      ctx.beginPath(); ctx.moveTo(cx - 3.5, by - 6); ctx.quadraticCurveTo(cx + 6, by - 13, cx - 3, by - 20); ctx.quadraticCurveTo(cx - 7, by - 25, cx + 2.5, by - 31); ctx.stroke();
      ctx.fillStyle = '#7fbfa6';
      ctx.beginPath(); ctx.ellipse(cx + 4.5, by - 13, 2.6, 1.2, -0.5, 0, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx - 5.5, by - 24, 2.6, 1.2, 0.5, 0, 6.2832); ctx.fill();
      const g = ctx.createRadialGradient(cx, top, 2, cx, top, 28);
      g.addColorStop(0, `rgba(170,255,235,${(0.4 + 0.2 * p).toFixed(2)})`); g.addColorStop(1, 'rgba(120,240,220,0)');
      ctx.fillStyle = g; circle(ctx, cx, top, 28);
      ctx.fillStyle = 'hsl(172,40%,32%)'; ctx.beginPath(); ctx.ellipse(cx, top + 6, 15, 3, 0, 0, 6.2832); ctx.fill();   // the gills
      ctx.fillStyle = `hsl(172,64%,${(54 + p * 10).toFixed(1)}%)`;
      ctx.beginPath(); ctx.ellipse(cx, top + 5, 16, 13, 0, 3.1416, 6.2832); ctx.fill();
      ctx.fillStyle = 'hsl(176,75%,80%)';
      ctx.beginPath(); ctx.ellipse(cx - 4.5, top - 2, 6, 3.4, -0.2, 0, 6.2832); ctx.fill();
      ctx.fillStyle = 'rgba(235,255,250,.85)';
      for (const [dx, dy] of [[6, -1], [9, 3], [-9, 2], [2, -5]]) circle(ctx, cx + dx, top + dy, 1.2);
      for (let i = 0; i < 5; i++) {   // little drops of light hanging from the rim
        const dx = -12 + i * 6, dy = 3 + ((i * 7) % 3) + Math.sin(t * 2 + i) * 0.8;
        ctx.strokeStyle = 'rgba(200,255,240,.45)'; ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(cx + dx, top + 6); ctx.lineTo(cx + dx, top + 6 + dy); ctx.stroke();
        ctx.fillStyle = `rgba(225,255,245,${(0.6 + 0.4 * Math.sin(t * 3 + i * 1.7)).toFixed(2)})`;
        circle(ctx, cx + dx, top + 7 + dy, 1.4);
      }
    },

    // spores scattered on a mossy mound: tiny buttons push up and swell into caps
    sporebed(ctx, x, y, f, t, st) {
      const cx = x + 16, by = y + 26, g = st.g || 0, wet = st.wet > 0, w = G.state && G.state.world;
      shadow(ctx, cx, by + 1, 10, 3, 0.15);
      ctx.fillStyle = G.shade(270, 22, wet ? 16 : 22, f);
      ctx.beginPath(); ctx.ellipse(cx, by - 1, 9, 4, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = G.shade(180, 30, wet ? 22 : 28, f);
      ctx.beginPath(); ctx.ellipse(cx - 2, by - 2.5, 5, 1.8, 0, 0, 6.2832); ctx.fill();
      const rare = g > 0.6 && w && G.Garden.prototype.intoOf(w, st) === 'bigshroom';
      const spots = [[-5, 0.9], [0, 1.1], [5, 0.8]];
      for (const [dx, k] of spots) {
        const s = g * k, hue = rare && dx === 0 ? CAPS[w.tileAt(st.tx, st.ty).hue % CAPS.length][0] : 172;
        if (s < 0.08) { ctx.fillStyle = `hsla(172,80%,80%,${(0.4 + 0.4 * Math.sin(t * 2 + dx)).toFixed(2)})`; ctx.fillRect(cx + dx, by - 3, 1.2, 1.2); continue; }
        const h = 1 + s * (rare && dx === 0 ? 12 : 7), r = 1 + s * (rare && dx === 0 ? 5 : 3);
        ctx.fillStyle = G.shade(45, 20, 82, f); ctx.fillRect(cx + dx - 0.6, by - 2 - h, 1.2, h);
        ctx.fillStyle = G.shade(hue, 60, 60, Math.max(f, 0.5));
        ctx.beginPath(); ctx.ellipse(cx + dx, by - 2 - h, r, r * 0.8, 0, 3.1416, 6.2832); ctx.fill();
      }
    },
  });

  // growing back after they were gathered (p = 0 .. 1)
  Object.assign(G.REGROW_SPRITES, {
    bigshroom(ctx, x, y, f, t, tile, p) {
      const cx = x + 16, by = y + 28, c = CAPS[tile.hue % CAPS.length], h = 3 + p * 12, w = 3 + p * 8;
      shadow(ctx, cx, by, 5 + p * 5, 2.5, 0.16);
      ctx.fillStyle = G.shade(40, 22, 76, f); ctx.fillRect(cx - 1.5 - p, by - h, 3 + p * 2, h);
      cap(ctx, cx, by - h, w, 2 + p * 6, c, f, p > 0.5 ? 3 : 0, tile.v);
    },
    glowcap(ctx, x, y, f, t, tile, p) {
      const cx = x + 16, by = y + 27, hue = 165 + (tile.hue % 50);
      ctx.fillStyle = G.shade(hue, 60, 60, Math.max(f, 0.5));
      for (const dx of [-4, 2]) { ctx.beginPath(); ctx.ellipse(cx + dx, by - 1 - p * 3, 1 + p * 2, 0.8 + p * 1.6, 0, 3.1416, 6.2832); ctx.fill(); }
    },
  });

  // ---------- the glow snail ----------
  G.CREATURE_SPRITES.snail = function (ctx, c, sx, sy, t) {
    const h = c.hue, hide = c.hide || 0, dark = 1 - G.daylight(t), f = c.face;
    if (c.trail && c.trail.length > 1) {   // a faint glistening trail
      ctx.strokeStyle = `hsla(${h},70%,82%,${(0.12 + 0.25 * dark).toFixed(2)})`; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(c.trail[0].x - c.x + sx, c.trail[0].y - c.y + sy);
      for (const q of c.trail) ctx.lineTo(q.x - c.x + sx, q.y - c.y + sy);
      ctx.lineTo(sx, sy); ctx.stroke();
    }
    G.shadow(ctx, sx, sy + 1, 7, 2, 0.18);
    const out = 1 - hide, crawl = Math.sin(c.ph * 3) * 0.6 * out;
    ctx.fillStyle = `hsl(${h + 30},25%,72%)`;   // the soft body, with two little eye-stalks
    ctx.beginPath(); ctx.ellipse(sx + f * 2 * out, sy - 1.5, 4 + 4 * out + crawl, 2.2, 0, 0, 6.2832); ctx.fill();
    if (out > 0.2) {
      ctx.strokeStyle = `hsl(${h + 30},25%,66%)`; ctx.lineWidth = 1;
      const ex = sx + f * (6 + crawl) * out;
      ctx.beginPath(); ctx.moveTo(ex, sy - 2.5); ctx.lineTo(ex + f * 2, sy - 2.5 - 4 * out); ctx.moveTo(ex - f, sy - 2.5); ctx.lineTo(ex, sy - 2.5 - 4.5 * out); ctx.stroke();
      ctx.fillStyle = '#3a2c4a'; circle(ctx, ex + f * 2, sy - 2.5 - 4 * out, 0.8); circle(ctx, ex, sy - 2.5 - 4.5 * out, 0.8);
    }
    const shx = sx - f * 1.5, shy = sy - 6;   // the shell: a glowing spiral
    ctx.fillStyle = `hsla(${h},90%,70%,${(0.15 + 0.35 * dark).toFixed(2)})`; circle(ctx, shx, shy, 8);
    ctx.fillStyle = `hsl(${h},55%,${50 + dark * 14}%)`; circle(ctx, shx, shy, 5);
    ctx.strokeStyle = `hsl(${h},70%,${76 + dark * 10}%)`; ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let a = 0; a < 9.5; a += 0.4) { const r = 0.4 + a * 0.45; ctx.lineTo(shx + Math.cos(a * f) * r, shy + Math.sin(a * f) * r); }
    ctx.stroke();
  };
})();
