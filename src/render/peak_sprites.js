// Sprites for the Snowy Peaks (Night 22): the snowfield ground (wind ripples,
// blue hollows, glints, a stone peeking through), snowy firs, snowdrifts, ice
// spires (which hold their pale light even in grey land), snowbells, the Ice
// lantern, the Snow spirit, things growing back, and the snow fox.
// Same rules as sprites.js: f = restoration 0..1, t = time, base at bottom-centre.
window.G = window.G || {};

(function () {
  const circle = G.circle, shadow = G.shadow;
  const SCARVES = [352, 18, 44, 140, 200, 262, 312];   // the snow spirits' knitted scarves

  // ---------- ground: ripples carved by the wind, blue hollows, glints of frost ----------
  G.drawPeakGround = function (ctx, tile, d, x, y, f, t, tx, ty) {
    const v = tile.v, w = (v * 53.7) % 1, u = (v * 17.3) % 1;
    // a soft blue hollow in the snow
    if (w > 0.55) {
      ctx.fillStyle = G.shade(214, 40, d.l - 14, f, 0.35);
      ctx.beginPath(); ctx.ellipse(x + 10 + u * 12, y + 12 + v * 10, 7 + w * 4, 2.6, 0, 0, 6.2832); ctx.fill();
    }
    // wind ripples: a bright crest with a blue shadow just below it
    if (v > 0.3) {
      const ox = x + 3 + u * 10, oy = y + 6 + w * 16, len = 12 + v * 10;
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = G.shade(216, 36, d.l - 10, f, 0.55);
      ctx.beginPath(); ctx.moveTo(ox, oy + 1.4); ctx.quadraticCurveTo(ox + len / 2, oy - 2, ox + len, oy + 1.4); ctx.stroke();
      ctx.strokeStyle = G.shade(205, 30, Math.min(98, d.l + 9), f, 0.8);
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.quadraticCurveTo(ox + len / 2, oy - 3.4, ox + len, oy); ctx.stroke();
    }
    // now and then a dark stone peeks through, with snow on its back
    if (v < 0.05) {
      const sx = x + 8 + u * 14, sy = y + 18 + w * 6;
      ctx.fillStyle = G.shade(220, 10, 40, f);
      ctx.beginPath(); ctx.ellipse(sx, sy, 4.5, 2.6, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = G.shade(210, 30, 94, f);
      ctx.beginPath(); ctx.ellipse(sx - 0.5, sy - 1.4, 3.6, 1.4, 0, 3.1, 6.33); ctx.fill();
    }
    // glints of frost that catch the light
    if (u > 0.55) {
      const g = Math.max(0, Math.sin(t * 1.1 + tx * 1.7 + ty * 2.3)) ** 8;
      if (g > 0.05) {
        const a = (g * (0.35 + 0.65 * f)).toFixed(2), gx = x + w * 26 + 2, gy = y + v * 26 + 2;
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fillRect(gx - 0.8, gy - 0.8, 1.6, 1.6);
        if (g > 0.5) { ctx.fillRect(gx - 3, gy - 0.3, 6, 0.6); ctx.fillRect(gx - 0.3, gy - 3, 0.6, 6); }
      }
    }
  };

  // a fir: tiers of dark needles, each wearing a heavy line of snow
  function fir(ctx, cx, by, hgt, wid, f, sway, v) {
    ctx.fillStyle = G.shade(28, 34, 26, f); ctx.fillRect(cx - 2, by - 6, 4, 6);
    const tiers = 3;
    for (let i = 0; i < tiers; i++) {
      const k = i / tiers, base = by - 4 - hgt * k * 0.78, top = base - hgt * 0.42, hw = wid * (1 - k * 0.55), s = sway * (0.3 + k);
      ctx.fillStyle = G.shade(168 + v * 14, 30, 22 + i * 3, f);
      ctx.beginPath(); ctx.moveTo(cx - hw, base); ctx.lineTo(cx + s, top); ctx.lineTo(cx + hw, base);
      ctx.quadraticCurveTo(cx, base + 3, cx - hw, base); ctx.fill();
      // the snow on this tier: a scalloped band along its upper slopes
      ctx.fillStyle = G.shade(210, 30, 94, f);
      ctx.beginPath(); ctx.moveTo(cx - hw * 0.86, base - 1.5); ctx.lineTo(cx + s, top - 0.5); ctx.lineTo(cx + hw * 0.86, base - 1.5);
      ctx.quadraticCurveTo(cx + hw * 0.5, base - 5, cx + hw * 0.3 + s * 0.3, base - 3.4);
      ctx.quadraticCurveTo(cx, base - 7, cx - hw * 0.3 + s * 0.3, base - 3.4);
      ctx.quadraticCurveTo(cx - hw * 0.5, base - 5, cx - hw * 0.86, base - 1.5); ctx.fill();
      ctx.fillStyle = G.shade(214, 40, 78, f);   // blue shade on the snow's lower lip
      ctx.fillRect(cx - hw * 0.7, base - 2, hw * 0.4, 1);
    }
  }

  // a shard of ice: a long six-sided crystal leaning a little
  function shard(ctx, cx, by, h, w, lean, g, pulse) {
    const tx = cx + lean, ty = by - h;
    ctx.fillStyle = `hsla(192,70%,${(70 + 10 * g).toFixed(0)}%,${(0.55 + 0.25 * g).toFixed(2)})`;
    ctx.beginPath(); ctx.moveTo(cx - w, by); ctx.lineTo(cx - w + lean * 0.9, ty + w * 1.4); ctx.lineTo(tx, ty);
    ctx.lineTo(cx + w + lean * 0.9, ty + w * 1.4); ctx.lineTo(cx + w, by); ctx.closePath(); ctx.fill();
    ctx.fillStyle = `hsla(200,60%,${(55 + 10 * g).toFixed(0)}%,${(0.35 + 0.2 * g).toFixed(2)})`;   // the shaded face
    ctx.beginPath(); ctx.moveTo(cx + w * 0.15, by); ctx.lineTo(cx + w * 0.15 + lean * 0.95, ty + w * 1.2); ctx.lineTo(tx, ty);
    ctx.lineTo(cx + w + lean * 0.9, ty + w * 1.4); ctx.lineTo(cx + w, by); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,${(0.55 + 0.35 * pulse * g).toFixed(2)})`; ctx.lineWidth = 0.9;   // a bright edge
    ctx.beginPath(); ctx.moveTo(cx - w * 0.5, by - 2); ctx.lineTo(cx - w * 0.5 + lean * 0.9, ty + w * 1.6); ctx.lineTo(tx, ty); ctx.stroke();
  }

  Object.assign(G.OBJECT_SPRITES, {
    firpine(ctx, x, y, f, t, tile) {
      const v = tile.v, cx = x + 16, by = y + 28;
      shadow(ctx, cx, by, 12, 4);
      fir(ctx, cx, by, 34 + ((v * 13.1) % 1) * 12, 12 + ((v * 5.3) % 1) * 3, f, G.sway(t * 0.9, v * 10, 0.9), (v * 3.3) % 1);
    },

    snowdrift(ctx, x, y, f, t, tile) {
      const v = tile.v, cx = x + 16, by = y + 27, w = 11 + ((v * 7.7) % 1) * 4;
      ctx.fillStyle = G.shade(216, 34, 70, f, 0.6);   // its blue shadow side
      ctx.beginPath(); ctx.ellipse(cx + 2, by - 1, w + 1, 4.5, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = G.shade(210, 30, 93, f);
      ctx.beginPath(); ctx.moveTo(cx - w, by); ctx.quadraticCurveTo(cx - w * 0.6, by - 11, cx - 1, by - 10);
      ctx.quadraticCurveTo(cx + w * 0.7, by - 9, cx + w, by); ctx.closePath(); ctx.fill();
      ctx.fillStyle = G.shade(205, 25, 99, f, 0.9);   // light along the crest
      ctx.beginPath(); ctx.ellipse(cx - 3, by - 8, w * 0.45, 1.6, -0.1, 0, 6.2832); ctx.fill();
      const g = Math.max(0, Math.sin(t * 1.5 + v * 40)) ** 6;
      if (g > 0.1) { ctx.fillStyle = `rgba(255,255,255,${(g * (0.3 + 0.7 * f)).toFixed(2)})`; ctx.fillRect(cx + 3, by - 7, 1.5, 1.5); }
    },

    // ice spires never quite lost their light: they stay pale blue even in grey land
    icespire(ctx, x, y, f, t, tile) {
      const v = tile.v, cx = x + 16, by = y + 28, g = Math.max(f, 0.45), pulse = 0.5 + 0.5 * Math.sin(t * 1.4 + v * 30);
      const glow = ctx.createRadialGradient(cx, by - 14, 2, cx, by - 14, 22);
      glow.addColorStop(0, `hsla(190,90%,80%,${(0.12 + 0.12 * pulse).toFixed(2)})`); glow.addColorStop(1, 'hsla(190,90%,80%,0)');
      ctx.fillStyle = glow; circle(ctx, cx, by - 14, 22);
      shadow(ctx, cx, by, 11, 3.5, 0.18);
      ctx.fillStyle = G.shade(210, 30, 92, f);   // a collar of snow at its foot
      ctx.beginPath(); ctx.ellipse(cx, by - 1, 11, 3.5, 0, 0, 6.2832); ctx.fill();
      const lean = (((v * 3.7) % 1) - 0.5) * 6;
      shard(ctx, cx - 6, by - 1, 15 + ((v * 9.1) % 1) * 5, 2.8, lean - 3, g, pulse);
      shard(ctx, cx + 6, by - 1, 13 + ((v * 4.3) % 1) * 6, 2.6, lean + 3, g, pulse);
      shard(ctx, cx, by - 1, 24 + ((v * 17.3) % 1) * 8, 3.6, lean, g, pulse);
      if (pulse > 0.85) { ctx.fillStyle = `rgba(255,255,255,${((pulse - 0.85) * 6).toFixed(2)})`; circle(ctx, cx + lean - 1, by - 20, 1.3); }
    },

    snowbell(ctx, x, y, f, t, tile) {
      const v = tile.v, cx = x + 16, by = y + 27;
      ctx.fillStyle = G.shade(210, 30, 92, f, 0.8);
      ctx.beginPath(); ctx.ellipse(cx, by, 7, 2.2, 0, 0, 6.2832); ctx.fill();
      for (const [dx, h, k] of [[-4, 10, 0], [1, 13, 1], [5, 9, 2]]) {
        const sw = G.sway(t * 1.3, v * 9 + k, 0.6), tx = cx + dx + sw, ty = by - h;
        ctx.strokeStyle = G.shade(130, 36, 40, f); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx + dx * 0.6, by); ctx.quadraticCurveTo(cx + dx, ty - 2, tx + 2.2, ty + 0.5); ctx.stroke();
        ctx.fillStyle = G.shade(205, 40, 95, Math.max(f, 0.35));   // a little drooping white bell
        ctx.beginPath(); ctx.moveTo(tx + 0.2, ty); ctx.quadraticCurveTo(tx + 2.4, ty - 0.6, tx + 4.2, ty + 3.6);
        ctx.lineTo(tx + 0.8, ty + 4.4); ctx.closePath(); ctx.fill();
        ctx.fillStyle = G.shade(130, 50, 52, f); ctx.fillRect(tx + 2, ty + 3.8, 1, 1);
      }
      ctx.fillStyle = G.shade(135, 34, 36, f);   // two narrow leaves
      ctx.beginPath(); ctx.ellipse(cx - 3, by - 3, 1, 4, -0.4, 0, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 3, by - 3, 1, 4, 0.4, 0, 6.2832); ctx.fill();
    },
  });

  Object.assign(G.STRUCTURE_SPRITES, {
    // a block of clear ice on a stone foot, a cold blue flame inside, icicles under its snowy cap
    icelantern(ctx, x, y, f, t) {
      const cx = x + 16, by = y + 28, p = 0.5 + 0.5 * Math.sin(t * 2.3) * Math.sin(t * 3.7 + 1), top = by - 34;
      const pool = ctx.createRadialGradient(cx, by - 2, 2, cx, by - 2, 24);   // a pool of pale light on the snow
      pool.addColorStop(0, `rgba(190,235,255,${(0.24 + 0.08 * p).toFixed(2)})`); pool.addColorStop(1, 'rgba(170,225,255,0)');
      ctx.fillStyle = pool; ctx.beginPath(); ctx.ellipse(cx, by - 2, 24, 10, 0, 0, 6.2832); ctx.fill();
      shadow(ctx, cx, by, 10, 3.5);
      ctx.fillStyle = '#5d6676'; ctx.fillRect(cx - 9, by - 7, 18, 6);   // the stone foot
      ctx.fillStyle = '#7b8596'; ctx.fillRect(cx - 9, by - 7, 18, 2);
      // the ice block
      ctx.fillStyle = 'rgba(190,235,255,.55)'; ctx.fillRect(cx - 8, top + 4, 16, by - 7 - top - 4);
      ctx.fillStyle = 'rgba(150,205,240,.4)'; ctx.fillRect(cx + 3, top + 4, 5, by - 7 - top - 4);
      const g = ctx.createRadialGradient(cx, by - 18, 1, cx, by - 18, 16);   // the flame's glow fills the ice
      g.addColorStop(0, `rgba(235,250,255,${(0.75 + 0.2 * p).toFixed(2)})`); g.addColorStop(0.5, `rgba(150,220,255,${(0.35 + 0.15 * p).toFixed(2)})`);
      g.addColorStop(1, 'rgba(120,200,255,0)');
      ctx.fillStyle = g; ctx.fillRect(cx - 8, top + 4, 16, by - 7 - top - 4);
      ctx.fillStyle = `hsl(195,90%,${(72 + p * 12).toFixed(0)}%)`;   // the flame
      ctx.beginPath(); ctx.moveTo(cx, by - 25 - p * 2); ctx.quadraticCurveTo(cx + 3.4, by - 18, cx, by - 14); ctx.quadraticCurveTo(cx - 3.4, by - 18, cx, by - 25 - p * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(cx, by - 16.5, 1.2, 2.2, 0, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1;   // crisp edges and a frosty sheen
      ctx.strokeRect(cx - 8 + 0.5, top + 4.5, 15, by - 7 - top - 5);
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(cx - 6.5, top + 6, 1.5, 14);
      // a cap of snow with little icicles under its rim
      ctx.fillStyle = '#f2f7ff';
      ctx.beginPath(); ctx.ellipse(cx, top + 4, 11, 4.2, 0, 3.1, 6.33); ctx.fill(); ctx.fillRect(cx - 11, top + 3, 22, 2.4);
      ctx.fillStyle = 'rgba(205,240,255,.9)';
      for (const [dx, l] of [[-9, 4], [-5, 6], [-1, 3], [4, 5], [8, 4]]) {
        ctx.beginPath(); ctx.moveTo(cx + dx - 1.1, top + 5); ctx.lineTo(cx + dx + 1.1, top + 5); ctx.lineTo(cx + dx, top + 5 + l); ctx.fill();
      }
    },

    // a happy little snow friend: three snowballs, twig arms, a knitted scarf that flutters in the wind
    snowspirit(ctx, x, y, f, t, st) {
      const cx = x + 16, by = y + 28, k = st && st.tx !== undefined ? G.hash2(st.tx, st.ty, 515) : 0.4;
      const hue = SCARVES[Math.floor(k * SCARVES.length)], bob = G.calm ? 0 : Math.sin(t * 1.6 + k * 9) * 0.5;
      shadow(ctx, cx, by, 11, 3.5);
      const snow = G.shade(210, 30, 95, f), blue = G.shade(214, 36, 80, f);
      for (const [ry, r] of [[by - 8, 9.5], [by - 21, 7.2], [by - 31 + bob, 5.6]]) {
        ctx.fillStyle = blue; circle(ctx, cx + 0.8, ry + 0.8, r);
        ctx.fillStyle = snow; circle(ctx, cx - 0.4, ry - 0.3, r - 0.6);
      }
      ctx.strokeStyle = G.shade(28, 40, 32, f); ctx.lineWidth = 1.3;   // twig arms, one waving
      const wave = G.calm ? 0 : Math.sin(t * 2.2 + k * 5) * 2;
      ctx.beginPath(); ctx.moveTo(cx - 6, by - 22); ctx.lineTo(cx - 14, by - 27); ctx.moveTo(cx - 11.5, by - 25.5); ctx.lineTo(cx - 13, by - 29);
      ctx.moveTo(cx + 6, by - 22); ctx.lineTo(cx + 13, by - 30 + wave); ctx.moveTo(cx + 11, by - 27.5 + wave * 0.7); ctx.lineTo(cx + 15, by - 28 + wave); ctx.stroke();
      const hy = by - 31 + bob;
      ctx.fillStyle = '#2a2633'; circle(ctx, cx - 2.1, hy - 1, 0.95); circle(ctx, cx + 2.1, hy - 1, 0.95);   // pebble eyes
      ctx.fillStyle = G.shade(22, 85, 58, f);   // a little acorn-cap nose
      ctx.beginPath(); ctx.moveTo(cx, hy + 0.2); ctx.lineTo(cx + 3.6, hy + 1); ctx.lineTo(cx, hy + 1.8); ctx.fill();
      ctx.strokeStyle = '#2a2633'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(cx, hy + 1.6, 2.2, 0.4, 2.7); ctx.stroke();
      ctx.fillStyle = `hsla(350,70%,75%,${(0.25 + 0.35 * f).toFixed(2)})`; circle(ctx, cx - 3.4, hy + 1.6, 1); circle(ctx, cx + 3.4, hy + 1.6, 1);
      ctx.fillStyle = G.shade(28, 30, 30, f); circle(ctx, cx, by - 23, 0.9); circle(ctx, cx, by - 19, 0.9);   // buttons
      // the scarf: a band around the neck and a tail streaming downwind
      const wd = (G.windDir || 1) * (0.4 + (G.windNow || 0)), fl = G.calm ? 0 : Math.sin(t * 5 + k * 7) * 1.2;
      ctx.fillStyle = G.shade(hue, 62, 50, f);
      ctx.beginPath(); ctx.ellipse(cx, by - 26.2, 6.2, 2.1, 0, 0, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx + 2, by - 27); ctx.lineTo(cx + 2 + wd * 7, by - 25 + fl); ctx.lineTo(cx + 2 + wd * 7.5, by - 21.5 + fl);
      ctx.lineTo(cx + 4, by - 24); ctx.closePath(); ctx.fill();
      ctx.fillStyle = G.shade(hue, 50, 72, f);
      ctx.fillRect(cx - 4, by - 26.8, 1.2, 1.2); ctx.fillRect(cx - 0.6, by - 26.8, 1.2, 1.2);
      // a leaf on its head, worn like a hat
      ctx.fillStyle = G.shade(120, 45, 40, f);
      ctx.beginPath(); ctx.ellipse(cx + 1, hy - 5.5, 3.4, 1.4, -0.4, 0, 6.2832); ctx.fill();
    },
  });

  // growing back after they were gathered (p = 0 .. 1)
  Object.assign(G.REGROW_SPRITES, {
    firpine(ctx, x, y, f, t, tile, p) {
      const cx = x + 16, by = y + 28;
      shadow(ctx, cx, by, 5 + p * 6, 2.5, 0.16);
      ctx.fillStyle = G.shade(28, 30, 28, f); ctx.fillRect(cx - 3.5, by - 4, 7, 4);   // a stump …
      if (p > 0.3) fir(ctx, cx + 7, by + 1, 8 + p * 12, 3 + p * 4, f, 0, 0.5);   // … and a little fir beside it
    },
    snowdrift(ctx, x, y, f, t, tile, p) {
      const cx = x + 16, by = y + 27, w = 4 + p * 8;
      ctx.fillStyle = G.shade(210, 30, 93, f);
      ctx.beginPath(); ctx.ellipse(cx, by - 1, w, 1.5 + p * 4, 0, 3.1, 6.33); ctx.fill();
    },
    icespire(ctx, x, y, f, t, tile, p) {
      const cx = x + 16, by = y + 28, g = Math.max(f, 0.45);
      ctx.fillStyle = G.shade(210, 30, 92, f);
      ctx.beginPath(); ctx.ellipse(cx, by - 1, 8, 3, 0, 0, 6.2832); ctx.fill();
      shard(ctx, cx, by - 1, 3 + p * 12, 1.5 + p * 1.5, 0, g, 0.5);
    },
    snowbell(ctx, x, y, f, t, tile, p) {
      const cx = x + 16, by = y + 27;
      ctx.fillStyle = G.shade(135, 34, 38, f);
      ctx.beginPath(); ctx.ellipse(cx - 1.5, by - p * 2.5, 0.8, 1 + p * 3, -0.3, 0, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 1.5, by - p * 2.5, 0.8, 1 + p * 3, 0.3, 0, 6.2832); ctx.fill();
    },
  });

  // ---------- the snow fox: a red fox or a white one, with a bushy tail; it pounces nose-first ----------
  G.CREATURE_SPRITES.fox = function (ctx, c, sx, sy, t) {
    const f = c.face, white = c.hue > 100, z = c.z, hop = c.state === 'hop';
    const fur = white ? 'hsl(210,25%,95%)' : `hsl(${c.hue},70%,52%)`, dark = white ? 'hsl(214,22%,80%)' : `hsl(${c.hue},60%,38%)`;
    const belly = white ? 'hsl(210,30%,99%)' : 'hsl(36,40%,92%)';
    G.shadow(ctx, sx, sy + 1, Math.max(4, 10 - z * 0.3), Math.max(1.6, 3 - z * 0.08), 0.22);
    const y = sy - z - 6, dive = hop && c.fast ? 0 : hop ? Math.sin(Math.min(1, c.hopT / 0.4) * Math.PI) * 0.35 : 0;
    ctx.save(); ctx.translate(sx, y); ctx.rotate(f * (dive - 0.05 * Math.sin(c.ph || 0)) * (hop ? 1 : 0));
    // the bushy tail, curling up behind, with a white tip
    const tw = Math.sin(t * 2.4 + (c.seed || 0) * 9) * 1.4;
    ctx.fillStyle = fur;
    ctx.beginPath(); ctx.moveTo(-f * 5, -1); ctx.quadraticCurveTo(-f * 13, -2 + tw, -f * 15, -8 + tw); ctx.quadraticCurveTo(-f * 10, -4, -f * 5, 2); ctx.fill();
    ctx.fillStyle = belly; circle(ctx, -f * 14.4, -7.4 + tw, 2.2);
    // legs
    ctx.fillStyle = dark;
    for (const lx of [-4, -1.5, 3, 5.5]) ctx.fillRect(f * lx - 0.7, 1.5, 1.4, hop ? 2.5 : 4.5);
    // the body
    ctx.fillStyle = fur; ctx.beginPath(); ctx.ellipse(0, 0, 7.5, 3.8, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = belly; ctx.beginPath(); ctx.ellipse(f * 1.5, 1.8, 4.5, 1.6, 0, 0, 6.2832); ctx.fill();
    // the head: a pointed muzzle and two tall ears
    const hx = f * 7.5, hy = -3.5;
    ctx.fillStyle = fur; circle(ctx, hx, hy, 3.4);
    ctx.beginPath(); ctx.moveTo(hx + f * 1.5, hy - 1.6); ctx.lineTo(hx + f * 6.4, hy + 1); ctx.lineTo(hx + f * 1.5, hy + 2.4); ctx.fill();
    ctx.fillStyle = belly; ctx.beginPath(); ctx.moveTo(hx + f * 1, hy + 0.6); ctx.lineTo(hx + f * 6, hy + 1.3); ctx.lineTo(hx + f * 1, hy + 2.8); ctx.fill();
    ctx.fillStyle = '#1c1a22'; circle(ctx, hx + f * 6.2, hy + 1, 0.8); circle(ctx, hx + f * 1.6, hy - 0.8, 0.75);
    const ear = c.ear > 0 ? Math.sin(c.ear * 30) * 0.8 : 0;
    ctx.fillStyle = fur;
    for (const ox of [-1.6, 1]) {
      ctx.beginPath(); ctx.moveTo(hx + f * ox - 1.4, hy - 2); ctx.lineTo(hx + f * (ox + 0.4) + ear * (ox < 0 ? 1 : 0), hy - 7.5); ctx.lineTo(hx + f * ox + 1.4, hy - 2); ctx.fill();
    }
    ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(hx + f * 1 - 0.7, hy - 2.4); ctx.lineTo(hx + f * 1.4, hy - 6); ctx.lineTo(hx + f * 1 + 0.7, hy - 2.4); ctx.fill();
    ctx.restore();
    // a little puff of snow when it lands from a pounce
    if (hop && c.hopT > 0.3 && !c.fast) {
      ctx.fillStyle = 'rgba(245,250,255,.7)';
      for (let i = 0; i < 4; i++) circle(ctx, sx + f * (7 + i * 1.5), sy - 1 - (i % 2) * 2, 1.4);
    }
  };
})();
