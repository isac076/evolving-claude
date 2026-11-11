// The hush of night (Night 19): how the hushlings, a Shine, starlight and the
// Moon lantern are drawn. G.HushFX.draw runs after the night layer, so the
// little shadows read as soft dark shapes with pale eyes against the night,
// and anything they turn into glows. Nothing here is saved.
window.G = window.G || {};

(function () {
  const circle = G.circle, shadow = G.shadow;

  // a four-pointed twinkle
  function star(ctx, x, y, r, a) {
    ctx.fillStyle = `rgba(240,244,255,${a.toFixed(2)})`;
    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill();
  }

  function soft(ctx, x, y, r, inner, outer) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, inner); g.addColorStop(1, outer);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
  }

  G.HushFX = {
    draw(ctx, state, camX, camY, W, H, t, dark) {
      const hush = state.hush;
      if (!hush || !state.player) return;
      const p = state.player, px = p.x - camX, py = p.y - camY;

      // threads from the spirit to the ones holding on, with tiny sparks of glow being sipped along them
      for (const h of hush.list) {
        if (h.mode !== 'cling') continue;
        const hx = h.x - camX, hy = h.y - camY, mx = (px + hx) / 2 + Math.sin(t * 3 + h.seed * 7) * 5, my = (py - 12 + hy) / 2 + Math.cos(t * 2.4) * 4;
        ctx.strokeStyle = `rgba(30,20,60,${(0.45 * h.a).toFixed(2)})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px, py - 12); ctx.quadraticCurveTo(mx, my, hx, hy); ctx.stroke();
        ctx.strokeStyle = `rgba(150,130,220,${(0.25 * h.a).toFixed(2)})`; ctx.lineWidth = 0.7; ctx.stroke();
        for (let k = 0; k < 3; k++) {
          const u = (t * 0.9 + k / 3 + h.seed) % 1, iu = 1 - u;
          const sx = iu * iu * px + 2 * iu * u * mx + u * u * hx, sy = iu * iu * (py - 12) + 2 * iu * u * my + u * u * hy;
          ctx.fillStyle = `rgba(255,220,150,${(0.7 * (1 - u) * h.a).toFixed(2)})`; circle(ctx, sx, sy, 1.3);
        }
      }

      for (const h of hush.list) this.hushling(ctx, h, h.x - camX, h.y - camY, t);

      // Shines: a ring of warm light spreading from the spirit
      for (const r of hush.rings) {
        const k = r.t / 0.9, rad = r.r * Math.min(1, k * 2.2), a = 1 - k;
        ctx.globalCompositeOperation = 'lighter';
        soft(ctx, r.x - camX, r.y - camY, rad, `rgba(255,236,180,${(0.18 * a).toFixed(2)})`, 'rgba(255,220,150,0)');
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = `rgba(255,232,170,${(0.75 * a).toFixed(2)})`; ctx.lineWidth = 3 * a + 0.5;
        ctx.beginPath(); ctx.arc(r.x - camX, r.y - camY, rad, 0, 6.2832); ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,240,${(0.4 * a).toFixed(2)})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(r.x - camX, r.y - camY, rad * 0.8, 0, 6.2832); ctx.stroke();
      }

      // starlight on its way to you
      for (const m of hush.motes) {
        const x = m.x - camX, y = m.y - camY, tw = 0.75 + 0.25 * Math.sin(t * 9 + m.t * 4);
        ctx.globalCompositeOperation = 'lighter';
        soft(ctx, x, y, 16, 'rgba(200,215,255,.5)', 'rgba(160,180,255,0)');
        ctx.globalCompositeOperation = 'source-over';
        star(ctx, x, y, 6 * tw, 0.95); star(ctx, x, y, 2.5, 1);
      }

      // the spirit's glow, as a thin golden ring that fills back up (only while it isn't full)
      if (p.glow !== undefined && p.glow < 0.985 && !p.flying) {
        const cx = px, cy = py - 8, a0 = -Math.PI / 2;
        ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(40,30,70,.35)'; ctx.beginPath(); ctx.arc(cx, cy, 19, 0, 6.2832); ctx.stroke();
        ctx.strokeStyle = p.glow < 0.4 ? `rgba(255,190,150,${(0.6 + 0.3 * Math.sin(t * 6)).toFixed(2)})` : 'rgba(255,220,140,.75)';
        ctx.beginPath(); ctx.arc(cx, cy, 19, a0, a0 + 6.2832 * p.glow); ctx.stroke();
        ctx.lineCap = 'butt';
      }
    },

    // a small, soft shadow with two pale eyes, a wispy tail and a curl on top
    hushling(ctx, h, x, y, t) {
      const a = Math.max(0, Math.min(1, h.a)), e = Math.min(1, h.e), s = h.size;
      if (a <= 0.01) return;
      const bob = Math.sin(h.ph * 2.2 + h.seed * 6) * 2.5, by = y + bob;
      const sp = Math.hypot(h.vx, h.vy) || 1, ux = -h.vx / sp, uy = -h.vy / sp;   // the tail streams behind
      // tail: three fading puffs
      for (let k = 3; k >= 1; k--) {
        const wob = Math.sin(h.ph * 3 + k) * 2.5;
        const tx = x + ux * k * 6 * s - uy * wob, ty = by + uy * k * 6 * s + ux * wob + k * 1.5;
        soft(ctx, tx, ty, (9 - k * 2) * s, `rgba(${14 + e * 150 | 0},${10 + e * 150 | 0},${34 + e * 180 | 0},${(0.55 * a * (1 - k * 0.2)).toFixed(2)})`, 'rgba(20,14,40,0)');
      }
      // body
      soft(ctx, x, by, 13 * s, `rgba(${12 + e * 170 | 0},${9 + e * 170 | 0},${30 + e * 200 | 0},${(0.85 * a).toFixed(2)})`, 'rgba(18,12,38,0)');
      ctx.fillStyle = `rgba(${16 + e * 170 | 0},${12 + e * 170 | 0},${38 + e * 190 | 0},${(0.8 * a).toFixed(2)})`;
      ctx.beginPath(); ctx.ellipse(x, by, 7.5 * s, 7 * s, 0, 0, 6.2832); ctx.fill();
      // a curl of shadow on top, swaying
      ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 2.2 * s; ctx.lineCap = 'round';
      const sw = Math.sin(h.ph * 1.8) * 3;
      ctx.beginPath(); ctx.moveTo(x - 1, by - 6 * s); ctx.quadraticCurveTo(x + sw, by - 14 * s, x + 4 + sw, by - 11 * s); ctx.stroke();
      ctx.lineCap = 'butt';
      // a faint violet rim, and — as it eases — a pale glow from inside
      ctx.globalCompositeOperation = 'lighter';
      soft(ctx, x, by, 15 * s, `rgba(120,100,200,${(0.12 * a).toFixed(2)})`, 'rgba(90,70,180,0)');
      if (e > 0.02) soft(ctx, x, by, 22 * s, `rgba(220,228,255,${(0.55 * e * a).toFixed(2)})`, 'rgba(200,210,255,0)');
      ctx.globalCompositeOperation = 'source-over';
      // eyes: pale and round; they blink now and then, and close happily as the light reaches them
      const look = h.mode === 'cling' ? 0 : Math.max(-1.5, Math.min(1.5, -ux * 1.5));
      const ex = x + look, ey = by - 1;
      if (e > 0.45) {
        ctx.strokeStyle = `rgba(255,250,235,${a.toFixed(2)})`; ctx.lineWidth = 1.2;
        for (const o of [-2.8, 2.8]) { ctx.beginPath(); ctx.arc(ex + o * s, ey + 0.8, 1.6 * s, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
      } else {
        const blink = ((h.ph + h.seed * 5) % 3.7) < 0.12 ? 0.2 : 1;
        ctx.fillStyle = `rgba(226,224,255,${(0.95 * a).toFixed(2)})`;
        for (const o of [-2.8, 2.8]) { ctx.beginPath(); ctx.ellipse(ex + o * s, ey, 1.5 * s, 2.1 * s * blink, 0, 0, 6.2832); ctx.fill(); }
        ctx.globalCompositeOperation = 'lighter';
        for (const o of [-2.8, 2.8]) soft(ctx, ex + o * s, ey, 4.5, `rgba(190,180,255,${(0.35 * a).toFixed(2)})`, 'rgba(150,140,255,0)');
        ctx.globalCompositeOperation = 'source-over';
      }
    },
  };

  // the Moon lantern: a slim silver post, a round globe of starlight and a crescent on top
  G.STRUCTURE_SPRITES.moonlantern = function (ctx, x, y, f, t) {
    const cx = x + 16, by = y + 28, p = 0.5 + 0.5 * Math.sin(t * 1.1), gy = by - 33;
    const pool = ctx.createRadialGradient(cx, by - 2, 2, cx, by - 2, 24);   // pale light pooled at its foot
    pool.addColorStop(0, `rgba(200,215,255,${(0.2 + 0.08 * p).toFixed(2)})`); pool.addColorStop(1, 'rgba(180,200,255,0)');
    ctx.fillStyle = pool; ctx.beginPath(); ctx.ellipse(cx, by - 2, 24, 10, 0, 0, 6.2832); ctx.fill();
    shadow(ctx, cx, by, 8, 3);
    ctx.fillStyle = '#6f7690'; ctx.beginPath(); ctx.ellipse(cx, by - 2, 7, 2.6, 0, 0, 6.2832); ctx.fill();   // stone foot
    ctx.fillStyle = '#9aa2bc'; ctx.fillRect(cx - 5, by - 6, 10, 4);
    ctx.fillStyle = '#b9c0d8'; ctx.fillRect(cx - 1.6, by - 24, 3.2, 19);   // the post
    ctx.fillStyle = '#e4e8f6'; ctx.fillRect(cx - 1.6, by - 24, 1.1, 19);
    ctx.fillStyle = '#8c94b0'; ctx.fillRect(cx - 6, by - 25, 12, 2.4);   // the cup the globe sits in
    // the globe
    const g = ctx.createRadialGradient(cx - 2, gy - 2, 1, cx, gy, 9);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, `hsl(222,90%,${(86 + p * 6).toFixed(1)}%)`); g.addColorStop(1, 'hsl(228,60%,66%)');
    ctx.fillStyle = g; circle(ctx, cx, gy, 8.5);
    ctx.strokeStyle = 'rgba(120,130,170,.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, gy, 8.5, 0, 6.2832); ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    const halo = ctx.createRadialGradient(cx, gy, 3, cx, gy, 24);
    halo.addColorStop(0, `rgba(200,215,255,${(0.18 + 0.1 * p).toFixed(2)})`); halo.addColorStop(1, 'rgba(160,180,255,0)');
    ctx.fillStyle = halo; circle(ctx, cx, gy, 24);
    ctx.globalCompositeOperation = 'source-over';
    // the crescent moon on top
    ctx.fillStyle = '#f4f0d8';
    ctx.beginPath(); ctx.arc(cx, gy - 13, 4.6, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#9aa2bc';
    ctx.beginPath(); ctx.arc(cx + 2.4, gy - 14.2, 3.9, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#b9c0d8'; ctx.fillRect(cx - 0.6, gy - 9.5, 1.2, 1.5);
    // tiny stars turning slowly around it
    for (let i = 0; i < 3; i++) {
      const a = t * 0.6 + i * 2.094, r = 13 + Math.sin(t + i) * 1.5;
      star(ctx, cx + Math.cos(a) * r, gy + Math.sin(a) * r * 0.45, 1.8 + Math.sin(t * 3 + i * 2) * 0.6, 0.85);
    }
  };
})();
