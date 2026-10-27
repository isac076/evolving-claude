// Sprites for the workshop (Night 4): reeds, crystal, workbench, beacon,
// fences, flower beds and benches. Adds to the tables in sprites.js.
// Same rules: f = restoration 0..1, t = time, base at bottom-centre of the tile.
window.G = window.G || {};

(function () {
  const circle = G.circle, shadow = G.shadow;

  Object.assign(G.OBJECT_SPRITES, {
    reeds(ctx, x, y, f, t, tile) {
      const by = y + 28, n = 5 + Math.floor(tile.v * 3);
      ctx.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        const r = G.hash2(tile.hue, i, 3);
        const bx = x + 7 + (i / (n - 1)) * 18 + (r - 0.5) * 3;
        const h = 14 + r * 10, sway = Math.sin(t * 1.3 + tile.v * 9 + i * 0.7) * (1.5 + h * 0.06);
        ctx.strokeStyle = G.shade(70 + r * 20, 40, 34 + r * 12, f); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx, by - h * 0.6, bx + sway, by - h); ctx.stroke();
        if (r > 0.45) {   // a fluffy seed head on some stems
          ctx.strokeStyle = G.shade(30, 45, 34, f); ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(bx + sway * 0.9, by - h + 1); ctx.lineTo(bx + sway, by - h - 5); ctx.stroke();
        }
      }
      ctx.lineCap = 'butt';
    },

    crystal(ctx, x, y, f, t, tile) {
      const cx = x + 16, by = y + 27, g = Math.max(f, 0.5);
      const hue = 190 + (tile.hue % 50);
      shadow(ctx, cx, by, 11, 3.5);
      ctx.fillStyle = G.shade(220, 8, 34, f);
      ctx.beginPath(); ctx.ellipse(cx, by - 1, 10, 3.5, 0, 0, 6.2832); ctx.fill();
      const shards = [[-6, 12, -0.35, 3.2], [5, 14, 0.3, 3.4], [0, 20, 0.02, 4.2]];
      for (const [dx, h, lean, w] of shards) {
        const bx = cx + dx, tx = bx + Math.sin(lean) * h, ty = by - 2 - Math.cos(lean) * h;
        ctx.fillStyle = G.shade(hue, 70, 58, g);
        ctx.beginPath(); ctx.moveTo(bx - w, by - 2); ctx.lineTo(tx - w * 0.8, ty + 4); ctx.lineTo(tx, ty);
        ctx.lineTo(tx + w * 0.8, ty + 4); ctx.lineTo(bx + w, by - 2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = G.shade(hue + 20, 80, 82, g, 0.85);   // light catching one face
        ctx.beginPath(); ctx.moveTo(bx - w * 0.2, by - 2); ctx.lineTo(tx - w * 0.15, ty + 3); ctx.lineTo(tx, ty);
        ctx.lineTo(bx + w * 0.4, by - 3); ctx.closePath(); ctx.fill();
      }
      // a slow sparkle travels between the shards
      const sp = (t * 0.6 + tile.v * 3) % 3;
      if (sp < 0.5) {
        const a = Math.sin(sp / 0.5 * 3.1416), sx = cx - 4 + tile.v * 8, sy = by - 12 - tile.v * 6;
        ctx.fillStyle = `rgba(255,255,255,${(a * 0.9).toFixed(2)})`;
        ctx.fillRect(sx - 0.5, sy - 4 * a, 1, 8 * a); ctx.fillRect(sx - 4 * a, sy - 0.5, 8 * a, 1);
      }
    },
  });

  // Is there a fence at this tile? (fences join up with their neighbours)
  const fenceAt = (tx, ty) => {
    const w = G.state && G.state.world, s = w && w.structureAt(tx, ty);
    return !!s && s.type === 'fence';
  };

  Object.assign(G.STRUCTURE_SPRITES, {
    workbench(ctx, x, y, f, t) {
      const cx = x + 16, by = y + 28;
      shadow(ctx, cx, by, 15, 4);
      ctx.fillStyle = G.shade(28, 40, 24, f);                 // legs
      ctx.fillRect(cx - 13, by - 12, 3, 12); ctx.fillRect(cx + 10, by - 12, 3, 12);
      ctx.fillRect(cx - 12, by - 6, 24, 2);                    // shelf
      ctx.fillStyle = G.shade(30, 45, 40, f);                  // top
      ctx.fillRect(cx - 15, by - 16, 30, 5);
      ctx.fillStyle = G.shade(30, 40, 50, f); ctx.fillRect(cx - 15, by - 16, 30, 1.5);
      ctx.fillStyle = G.shade(220, 10, 55, f);                 // a little vice
      ctx.fillRect(cx + 8, by - 20, 5, 4);
      ctx.fillStyle = G.shade(28, 40, 30, f);                  // hammer lying on top
      ctx.save(); ctx.translate(cx - 5, by - 18); ctx.rotate(-0.3);
      ctx.fillRect(-6, -1, 11, 2);
      ctx.fillStyle = G.shade(220, 8, 45, f); ctx.fillRect(4, -3, 3, 6);
      ctx.restore();
      ctx.fillStyle = G.shade(45, 50, 60, f);                  // a few shavings
      ctx.fillRect(cx - 11, by - 3, 2, 1); ctx.fillRect(cx + 3, by - 2, 2, 1);
    },

    beacon(ctx, x, y, f, t) {
      const cx = x + 16, by = y + 28, p = Math.sin(t * 1.6) * 0.5 + 0.5, fl = Math.sin(t * 1.1) * 2.5;
      shadow(ctx, cx, by, 15, 5, 0.3);
      ctx.fillStyle = G.shade(220, 10, 40, 1);                 // stone pedestal
      ctx.beginPath(); ctx.moveTo(cx - 13, by); ctx.lineTo(cx - 9, by - 14); ctx.lineTo(cx + 9, by - 14); ctx.lineTo(cx + 13, by); ctx.closePath(); ctx.fill();
      ctx.fillStyle = G.shade(220, 10, 54, 1); ctx.fillRect(cx - 11, by - 16, 22, 3);
      ctx.fillStyle = G.shade(30, 40, 28, 1);                  // two curved arms hold the crystal
      ctx.lineWidth = 2.2; ctx.strokeStyle = ctx.fillStyle;
      ctx.beginPath(); ctx.moveTo(cx - 8, by - 15); ctx.quadraticCurveTo(cx - 14, by - 34, cx - 5, by - 44); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 8, by - 15); ctx.quadraticCurveTo(cx + 14, by - 34, cx + 5, by - 44); ctx.stroke();
      // the floating crystal
      const top = by - 50 + fl, mid = by - 33 + fl, bot = by - 20 + fl;
      ctx.fillStyle = `hsl(${190 + p * 20},85%,${70 + p * 10}%)`;
      ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(cx + 7, mid); ctx.lineTo(cx, bot); ctx.lineTo(cx - 7, mid); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.beginPath(); ctx.moveTo(cx, top + 2); ctx.lineTo(cx + 3, mid); ctx.lineTo(cx, bot - 3); ctx.closePath(); ctx.fill();
      // motes of light circling it
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) {
        const a = t * 1.3 + i * 1.5708, r = 11;
        const mx = cx + Math.cos(a) * r, my = mid + Math.sin(a) * r * 0.35;
        ctx.fillStyle = `rgba(170,240,255,${(0.35 + 0.35 * Math.sin(a)).toFixed(2)})`; circle(ctx, mx, my, 1.6);
      }
      ctx.globalCompositeOperation = 'source-over';
    },

    fence(ctx, x, y, f, t, st) {
      const cx = x + 16, by = y + 26, tx = st.tx, ty = st.ty;
      const dark = G.shade(28, 38, 28, f), light = G.shade(30, 40, 44, f);
      shadow(ctx, cx, by + 1, 5, 2);
      if (fenceAt(tx - 1, ty)) {                 // rails to the left neighbour
        ctx.fillStyle = dark; ctx.fillRect(x, by - 15, 16, 3); ctx.fillRect(x, by - 8, 16, 3);
        ctx.fillStyle = light; ctx.fillRect(x, by - 15, 16, 1); ctx.fillRect(x, by - 8, 16, 1);
      }
      if (fenceAt(tx + 1, ty)) {                 // and to the right
        ctx.fillStyle = dark; ctx.fillRect(cx, by - 15, 16, 3); ctx.fillRect(cx, by - 8, 16, 3);
        ctx.fillStyle = light; ctx.fillRect(cx, by - 15, 16, 1); ctx.fillRect(cx, by - 8, 16, 1);
      }
      if (fenceAt(tx, ty - 1)) {                 // up to the post behind
        ctx.fillStyle = dark; ctx.fillRect(cx - 4, by - 32 - 10, 2, 34); ctx.fillRect(cx + 2, by - 32 - 10, 2, 34);
        ctx.fillStyle = light; ctx.fillRect(cx - 4, by - 42, 1, 34); ctx.fillRect(cx + 2, by - 42, 1, 34);
      }
      ctx.fillStyle = dark; ctx.fillRect(cx - 2.5, by - 19, 5, 19);   // the post
      ctx.fillStyle = light; ctx.fillRect(cx - 2.5, by - 19, 2, 19);
      ctx.beginPath(); ctx.moveTo(cx - 2.5, by - 19); ctx.lineTo(cx, by - 22); ctx.lineTo(cx + 2.5, by - 19); ctx.fill();
    },

    flowerbed(ctx, x, y, f, t, st) {
      const g = Math.max(f, 0.55);
      ctx.fillStyle = G.shade(28, 40, 30, f); ctx.fillRect(x + 3, y + 8, 26, 20);      // wooden edge
      ctx.fillStyle = G.shade(25, 35, 20, f); ctx.fillRect(x + 5, y + 10, 22, 16);     // soil
      ctx.fillStyle = G.shade(30, 40, 42, f); ctx.fillRect(x + 3, y + 8, 26, 2);
      for (let i = 0; i < 6; i++) {
        const r = G.hash2(st.tx * 7 + i, st.ty, 41);
        const fx = x + 8 + (i % 3) * 8 + (r - 0.5) * 3, fy = y + 15 + Math.floor(i / 3) * 7;
        const sway = Math.sin(t * 1.5 + i + r * 5) * 0.8;
        ctx.strokeStyle = G.shade(120, 45, 32, f); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(fx, fy + 3); ctx.lineTo(fx + sway, fy - 2); ctx.stroke();
        ctx.fillStyle = G.shade(Math.floor(r * 360), 80, 68, g);
        for (let k = 0; k < 4; k++) circle(ctx, fx + sway + Math.cos(k * 1.57) * 1.8, fy - 2 + Math.sin(k * 1.57) * 1.8, 1.6);
        ctx.fillStyle = '#fff3c8'; circle(ctx, fx + sway, fy - 2, 0.9);
      }
    },

    bench(ctx, x, y, f) {
      const cx = x + 16, by = y + 27;
      shadow(ctx, cx, by, 14, 3);
      const dark = G.shade(26, 40, 26, f), mid = G.shade(28, 42, 38, f), light = G.shade(30, 40, 48, f);
      ctx.fillStyle = dark;
      ctx.fillRect(cx - 12, by - 9, 2, 9); ctx.fillRect(cx + 10, by - 9, 2, 9);      // legs
      ctx.fillRect(cx - 12, by - 20, 2, 10); ctx.fillRect(cx + 10, by - 20, 2, 10);  // back posts
      ctx.fillStyle = mid; ctx.fillRect(cx - 14, by - 11, 28, 4);                    // seat
      ctx.fillStyle = light; ctx.fillRect(cx - 14, by - 11, 28, 1.2);
      ctx.fillStyle = mid; ctx.fillRect(cx - 13, by - 21, 26, 3); ctx.fillRect(cx - 13, by - 16, 26, 2);  // backrest
      ctx.fillStyle = light; ctx.fillRect(cx - 13, by - 21, 26, 1);
    },
  });
})();
