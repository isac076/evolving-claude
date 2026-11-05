// Sprites for the growing village (Night 13): the well, the market stall and the
// ribbon pole — each can be drawn half-built while friends raise it — plus the
// bunting strung from the ribbon pole to every cottage, and paper sky lanterns.
// Same rules as sprites.js: f = restoration 0..1, t = time, base at bottom-centre.
window.G = window.G || {};

(function () {
  const circle = G.circle, shadow = G.shadow, T = G.TILE;
  const DEFAULT_HUES = [330, 45, 200, 120, 280, 20];

  // a soft cap of snow on a roof edge (from x0 to x1 at height y)
  function snowCap(ctx, x0, x1, y, f) {
    const snow = G.SEASON_NOW ? G.SEASON_NOW.snow : 0;
    if (snow < 0.05) return;
    ctx.fillStyle = G.shade(212, 30, 94, f, snow.toFixed(2));
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo((x0 + x1) / 2, y - 4, x1, y);
    ctx.quadraticCurveTo((x0 + x1) / 2, y + 2.5, x0, y); ctx.fill();
  }

  // a little hanging lantern
  function lamp(ctx, x, y, f, t, hue = 40) {
    const dark = 1 - G.daylight(t);
    ctx.strokeStyle = G.shade(30, 20, 30, f); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x, y); ctx.stroke();
    ctx.fillStyle = G.shade(30, 30, 28, f); ctx.fillRect(x - 2.5, y, 5, 1.5);
    ctx.fillStyle = dark > 0.3 ? `hsla(${hue},95%,${70 + Math.sin(t * 4) * 4}%,.95)` : G.shade(hue, 60, 70, f);
    ctx.fillRect(x - 2, y + 1.5, 4, 5);
    ctx.fillStyle = G.shade(30, 30, 28, f); ctx.fillRect(x - 2.5, y + 6.5, 5, 1.2);
  }

  const RAW = {
    // A round stone well with a little shingled roof, a crank and a bucket on a rope.
    well(ctx, x, y, f, t) {
      const cx = x + 16, by = y + 28;
      shadow(ctx, cx + 1, by, 17, 4.5, 0.28);
      // the far rim and the dark water inside
      ctx.fillStyle = G.shade(220, 10, 44, f);
      ctx.beginPath(); ctx.ellipse(cx, by - 14, 13, 4.6, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = G.shade(210, 55, 26, f);
      ctx.beginPath(); ctx.ellipse(cx, by - 13.5, 10, 3.2, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = `rgba(200,235,255,${(0.25 + 0.2 * Math.sin(t * 2)).toFixed(2)})`;
      ctx.fillRect(cx - 4 + Math.sin(t * 0.8) * 2, by - 14, 4, 1);
      // the front wall of rounded stones
      ctx.fillStyle = G.shade(220, 9, 56, f);
      ctx.beginPath(); ctx.moveTo(cx - 13, by - 14); ctx.lineTo(cx - 13, by - 3);
      ctx.ellipse(cx, by - 3, 13, 4.6, 0, Math.PI, 0, true); ctx.lineTo(cx + 13, by - 14);
      ctx.ellipse(cx, by - 14, 13, 4.6, 0, 0, Math.PI); ctx.closePath(); ctx.fill();
      for (let row = 0; row < 3; row++) for (let i = 0; i < 5; i++) {
        const sx = cx - 10.5 + i * 5.2 + (row % 2) * 2.6, sy = by - 11 + row * 3.6 + Math.sin((sx - cx) / 13 * 1.4) * 0;
        if (sx > cx + 11.5) continue;
        ctx.fillStyle = G.shade(220, 8, 46 + ((i + row) % 3) * 5, f);
        ctx.beginPath(); ctx.ellipse(sx, sy + Math.cos((sx - cx) / 13 * 1.57) * 3, 2.3, 1.4, 0, 0, 6.2832); ctx.fill();
      }
      ctx.fillStyle = G.shade(220, 6, 68, f);   // the stone lip
      ctx.beginPath(); ctx.ellipse(cx, by - 14, 13.5, 4.8, 0, Math.PI, 0, true); ctx.lineTo(cx + 13.5, by - 13); ctx.ellipse(cx, by - 13, 13.5, 4.8, 0, 0, Math.PI); ctx.fill();
      // posts, crank and rope
      ctx.fillStyle = G.shade(28, 40, 34, f);
      ctx.fillRect(cx - 13, by - 40, 3, 27); ctx.fillRect(cx + 10, by - 40, 3, 27);
      ctx.fillStyle = G.shade(28, 35, 42, f); ctx.fillRect(cx - 12, by - 33, 24, 2.5);
      ctx.fillStyle = G.shade(28, 30, 26, f); ctx.fillRect(cx + 13, by - 34, 4, 1.5); ctx.fillRect(cx + 16, by - 34, 1.5, 5);
      const swing = Math.sin(t * 1.3) * 1.2;
      ctx.strokeStyle = G.shade(40, 30, 60, f); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, by - 31); ctx.lineTo(cx + swing, by - 23); ctx.stroke();
      ctx.fillStyle = G.shade(28, 45, 38, f);   // the bucket
      ctx.beginPath(); ctx.moveTo(cx - 3.5 + swing, by - 23); ctx.lineTo(cx + 3.5 + swing, by - 23); ctx.lineTo(cx + 2.6 + swing, by - 18); ctx.lineTo(cx - 2.6 + swing, by - 18); ctx.closePath(); ctx.fill();
      ctx.fillStyle = G.shade(220, 10, 60, f); ctx.fillRect(cx - 3.5 + swing, by - 21.5, 7, 1);
      // a little roof
      ctx.fillStyle = G.shade(12, 45, 34, f);
      ctx.beginPath(); ctx.moveTo(cx - 19, by - 37); ctx.lineTo(cx, by - 52); ctx.lineTo(cx + 19, by - 37); ctx.closePath(); ctx.fill();
      ctx.fillStyle = G.shade(12, 50, 44, f);
      ctx.beginPath(); ctx.moveTo(cx - 17, by - 38.5); ctx.lineTo(cx, by - 50); ctx.lineTo(cx + 17, by - 38.5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = G.shade(12, 45, 36, f); ctx.lineWidth = 1;
      for (let k = 1; k <= 2; k++) { const yy = by - 38.5 - k * 3.8, hw = 17 * (1 - k * 3.8 / 11.5); ctx.beginPath(); ctx.moveTo(cx - hw, yy); ctx.lineTo(cx + hw, yy); ctx.stroke(); }
      snowCap(ctx, cx - 18, cx, by - 44, f); snowCap(ctx, cx, cx + 18, by - 44, f);
      lamp(ctx, cx + 16, by - 37, f, t);
    },

    // A wooden market stall with a striped, scalloped awning and goods on the counter.
    stall(ctx, x, y, f, t, st) {
      const cx = x + 16, by = y + 28;
      shadow(ctx, cx + 1, by, 24, 4.5, 0.26);
      ctx.fillStyle = G.shade(28, 40, 32, f);    // back posts
      ctx.fillRect(cx - 21, by - 42, 3, 42); ctx.fillRect(cx + 18, by - 42, 3, 42);
      // the counter
      ctx.fillStyle = G.shade(30, 42, 44, f); ctx.fillRect(cx - 21, by - 15, 42, 15);
      ctx.fillStyle = G.shade(30, 38, 36, f);
      for (let i = 0; i < 5; i++) ctx.fillRect(cx - 21 + i * 8.6, by - 15, 1, 15);
      ctx.fillStyle = G.shade(30, 45, 54, f); ctx.fillRect(cx - 23, by - 17, 46, 3);
      // goods: logs, stones, glowing petals, a crystal
      ctx.fillStyle = G.shade(28, 50, 40, f); circle(ctx, cx - 16, by - 19.5, 2.6); circle(ctx, cx - 11, by - 19.5, 2.6); circle(ctx, cx - 13.5, by - 23.5, 2.6);
      ctx.fillStyle = G.shade(34, 45, 62, f); circle(ctx, cx - 16, by - 19.5, 1.2); circle(ctx, cx - 11, by - 19.5, 1.2); circle(ctx, cx - 13.5, by - 23.5, 1.2);
      ctx.fillStyle = G.shade(220, 8, 60, f); circle(ctx, cx - 4, by - 19.5, 2.6); circle(ctx, cx, by - 19.8, 2.3); circle(ctx, cx - 2, by - 22.6, 2.1);
      ctx.fillStyle = G.shade(45, 85, 70, f);
      for (let i = 0; i < 4; i++) circle(ctx, cx + 6 + (i % 2) * 3.4, by - 19.5 - Math.floor(i / 2) * 3, 1.7 + Math.sin(t * 2 + i) * 0.2);
      ctx.fillStyle = G.shade(195, 70, 66, Math.max(f, 0.5));
      ctx.beginPath(); ctx.moveTo(cx + 15, by - 17); ctx.lineTo(cx + 17, by - 26); ctx.lineTo(cx + 19, by - 17); ctx.closePath(); ctx.fill();
      // striped awning with a scalloped edge
      const hue = (st && st.fest && st.fest[0]) || 8, ay = by - 42;
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i % 2 ? G.shade(45, 40, 88, f) : G.shade(hue, 60, 56, f);
        const x0 = cx - 25 + i * (50 / 6);
        ctx.beginPath(); ctx.moveTo(x0 + 2, ay - 6); ctx.lineTo(x0 + 2 + 50 / 6, ay - 6); ctx.lineTo(x0 + 50 / 6, ay + 4); ctx.lineTo(x0, ay + 4); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.arc(x0 + 25 / 6, ay + 4, 25 / 6, 0, Math.PI); ctx.fill();
      }
      ctx.fillStyle = G.shade(hue, 55, 42, f); ctx.fillRect(cx - 23, ay - 8, 50, 2.5);
      snowCap(ctx, cx - 23, cx + 27, ay - 8, f);
      lamp(ctx, cx - 17, ay + 8, f, t);
    },

    // A tall ribbon pole crowned with flowers; the ribbons turn slowly (and dance at a festival).
    maypole(ctx, x, y, f, t, st) {
      const cx = x + 16, by = y + 28, top = by - 68, hues = (st && st.fest) || DEFAULT_HUES;
      const spin = t * (st && st.fest ? 1.1 : 0.15), n = 6;
      shadow(ctx, cx, by, 20, 5, 0.22);
      // a ring of little flowers around the foot
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * 6.2832, fx = cx + Math.cos(a) * 9, fy = by - 1 + Math.sin(a) * 3;
        ctx.fillStyle = G.shade(120, 40, 32, f); circle(ctx, fx, fy, 2);
        ctx.fillStyle = G.shade(hues[i % hues.length], 70, 70, f); circle(ctx, fx, fy - 1.5, 1.3);
      }
      const ribbons = [];
      for (let i = 0; i < n; i++) {
        const a = i / n * 6.2832 + spin;
        ribbons.push({ a, ex: cx + Math.cos(a) * 21, ey: by + Math.sin(a) * 6, hue: hues[i % hues.length] });
      }
      const drawRibbon = r => {
        ctx.strokeStyle = G.shade(r.hue, 70, 62, f); ctx.lineWidth = 1.8;
        const mx = (cx + r.ex) / 2 + Math.cos(r.a + 1.2) * 5, my = (top + r.ey) / 2 + 6;
        ctx.beginPath(); ctx.moveTo(cx, top + 3); ctx.quadraticCurveTo(mx, my, r.ex, r.ey - 2); ctx.stroke();
        ctx.fillStyle = G.shade(30, 30, 36, f); ctx.fillRect(r.ex - 0.8, r.ey - 4, 1.6, 4);   // the little stake
      };
      for (const r of ribbons) if (Math.sin(r.a) < 0) drawRibbon(r);   // behind the pole
      // the pole, with a spiral stripe
      ctx.fillStyle = G.shade(38, 40, 70, f); ctx.fillRect(cx - 1.8, top, 3.6, by - top);
      ctx.fillStyle = G.shade(hues[0], 65, 58, f);
      for (let yy = top + 6; yy < by - 2; yy += 7) { ctx.beginPath(); ctx.moveTo(cx - 1.8, yy); ctx.lineTo(cx + 1.8, yy - 3); ctx.lineTo(cx + 1.8, yy - 1); ctx.lineTo(cx - 1.8, yy + 2); ctx.fill(); }
      for (const r of ribbons) if (Math.sin(r.a) >= 0) drawRibbon(r);   // in front
      // a crown of leaves and flowers
      ctx.fillStyle = G.shade(115, 45, 34, f);
      ctx.beginPath(); ctx.ellipse(cx, top + 1, 7, 2.6, 0, 0, 6.2832); ctx.fill();
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * 6.2832 + 0.3;
        ctx.fillStyle = G.shade(hues[(i + 1) % hues.length], 75, 70, f);
        circle(ctx, cx + Math.cos(a) * 6, top + 1 + Math.sin(a) * 2.2, 1.6);
      }
      ctx.fillStyle = G.shade(48, 80, 70, Math.max(f, 0.5)); circle(ctx, cx, top - 3, 2.4);   // a golden knob
      snowCap(ctx, cx - 7, cx + 7, top, f);
    },
  };
  const HEIGHT = { well: 54, stall: 52, maypole: 74 };

  // while friends raise it: a scaffold, and the building rising out of the ground
  const rising = (type) => function (ctx, x, y, f, t, st) {
    const r = st && st.rise !== undefined ? st.rise : 1;
    if (r >= 1) { RAW[type](ctx, x, y, f, t, st); return; }
    const cx = x + 16, by = y + 29, h = HEIGHT[type], e = r * r * (3 - 2 * r);
    ctx.fillStyle = G.shade(30, 40, 46, f);   // a little pile of planks
    ctx.fillRect(cx + 16, by - 3, 12, 2); ctx.fillRect(cx + 17, by - 5, 10, 2);
    ctx.save(); ctx.beginPath(); ctx.rect(x - 40, by - h * e - 2, T + 80, h * e + 14); ctx.clip();
    RAW[type](ctx, x, y, f, t, st);
    ctx.restore();
    ctx.strokeStyle = G.shade(32, 45, 48, f); ctx.lineWidth = 1.6;
    const sh = h * Math.min(1, e + 0.25);
    ctx.beginPath();
    ctx.moveTo(cx - 22, by); ctx.lineTo(cx - 22, by - sh); ctx.moveTo(cx + 22, by); ctx.lineTo(cx + 22, by - sh);
    for (let yy = by - 12; yy > by - sh; yy -= 14) { ctx.moveTo(cx - 22, yy); ctx.lineTo(cx + 22, yy); ctx.moveTo(cx - 22, yy + 12); ctx.lineTo(cx + 22, yy); }
    ctx.stroke();
    ctx.fillStyle = `rgba(255,232,170,${(0.55 + 0.3 * Math.sin(t * 8)).toFixed(2)})`;
    ctx.fillRect(cx - 20, by - h * e - 1, 40, 1.5);
  };
  for (const type of Object.keys(RAW)) G.STRUCTURE_SPRITES[type] = rising(type);

  // Bunting from the top of each ribbon pole to the roof of every cottage in its village.
  // At night little lanterns along the strings glow (added to the night glows).
  G.drawVillageDecor = function (ctx, village, world, camX, camY, W, H, t, glows) {
    if (!village) return;
    const dark = 1 - G.daylight(t);
    for (const vil of village.list) {
      const pole = vil.has.maypole;
      if (!pole || (pole.rise !== undefined && pole.rise < 1)) continue;
      const hues = pole.fest || DEFAULT_HUES, px = (pole.tx + 0.5) * T - camX, py = pole.ty * T + 29 - 66 - camY;
      for (const c of vil.cottages) {
        const ex = (c.tx + 0.5) * T - camX, ey = c.ty * T - 24 - camY;
        if (Math.max(px, ex) < -40 || Math.min(px, ex) > W + 40 || Math.max(py, ey) < -40 || Math.min(py, ey) > H + 60) continue;
        const d = Math.hypot(ex - px, ey - py), sag = 10 + d * 0.12, n = Math.max(3, Math.floor(d / 13));
        const f = world.restoreAt((px + ex) / 2 + camX, (py + ey) / 2 + camY, world.lights);
        const at = k => { const u = k / n, mx = (px + ex) / 2, my = (py + ey) / 2 + sag; return [(1 - u) * (1 - u) * px + 2 * u * (1 - u) * mx + u * u * ex, (1 - u) * (1 - u) * py + 2 * u * (1 - u) * my + u * u * ey]; };
        ctx.strokeStyle = G.shade(30, 20, 40, f, 0.8); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo((px + ex) / 2, (py + ey) / 2 + sag, ex, ey); ctx.stroke();
        for (let k = 1; k < n; k++) {
          const [bx, by] = at(k), hue = hues[(((k + c.tx) % hues.length) + hues.length) % hues.length], wave = Math.sin(t * 2 + k) * 1.2 * (1 + (G.windNow || 0));
          if (k % 2) {   // a pennant
            ctx.fillStyle = G.shade(hue, 70, 62, f);
            ctx.beginPath(); ctx.moveTo(bx - 3, by); ctx.lineTo(bx + 3, by); ctx.lineTo(bx + wave, by + 7); ctx.closePath(); ctx.fill();
          } else {       // a little paper lantern
            ctx.fillStyle = dark > 0.3 ? `hsla(${hue},95%,72%,.95)` : G.shade(hue, 60, 70, f);
            ctx.beginPath(); ctx.ellipse(bx, by + 3, 2.4, 3, 0, 0, 6.2832); ctx.fill();
            if (dark > 0.25 && glows.length < 220) glows.push({ x: bx, y: by + 3, r: 26, hue });
          }
        }
      }
    }
  };

  // Paper lanterns rising from a festival (drawn above the night, so they shine).
  G.drawSkyLanterns = function (ctx, lanterns, camX, camY, W, H, t) {
    if (!lanterns || !lanterns.length) return;
    const dark = 1 - G.daylight(t);
    for (const L of lanterns) {
      const x = L.x - camX, y = L.y - camY;
      if (x < -30 || x > W + 30 || y < -30 || y > H + 30) continue;
      const a = Math.min(1, L.life, L.age * 2), fl = 0.85 + 0.15 * Math.sin(L.ph * 9);
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x, y, 0, x, y, 30);
      g.addColorStop(0, `hsla(${L.hue},95%,68%,${(0.55 * a * (0.35 + dark * 0.65) * fl).toFixed(3)})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 30, 0, 6.2832); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = a;
      // a paper lantern, wider at the top, lit warm from inside
      const body = ctx.createLinearGradient(x, y - 8, x, y + 6);
      body.addColorStop(0, `hsl(${L.hue},80%,${60 + dark * 8}%)`); body.addColorStop(1, `hsl(${(L.hue + 20) % 360},95%,${78 + dark * 10}%)`);
      ctx.fillStyle = body;
      ctx.beginPath(); ctx.moveTo(x - 6.5, y - 8); ctx.quadraticCurveTo(x, y - 10, x + 6.5, y - 8); ctx.lineTo(x + 4.5, y + 6); ctx.lineTo(x - 4.5, y + 6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = `hsla(${L.hue},60%,40%,.5)`; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(x - 2, y - 9); ctx.lineTo(x - 1.5, y + 6); ctx.moveTo(x + 2, y - 9); ctx.lineTo(x + 1.5, y + 6); ctx.stroke();
      ctx.fillStyle = `rgba(255,248,210,${(0.85 * fl).toFixed(2)})`;
      ctx.beginPath(); ctx.ellipse(x, y + 5, 3, 1.6, 0, 0, 6.2832); ctx.fill();   // the little flame's glow at the open bottom
      ctx.globalAlpha = 1;
    }
  };
})();
