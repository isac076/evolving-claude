// The Great Sun (Night 20): sun pillars, the four ember sockets, the altar (cold
// and burning), sun-gold flagstones — and G.SunFX: the carved rays in the dais,
// the sunrise (embers gathering, the Sun swelling and rising, the dawn flash and
// the wave of colour), the risen Sun floating over its hearth, soft shafts of
// sunlight by day once it burns, and its mark on the maps.
// Same rules as sprites.js: f = restoration 0..1, t = time, base at the bottom-centre.
window.G = window.G || {};

(function () {
  const circle = G.circle, shadow = G.shadow, T = G.TILE;
  const world = () => G.state && G.state.world;
  const sunLit = () => { const w = world(); return !!w && w.floor > 0; };
  const socketHue = (i) => {   // the shrine colour a socket waits for
    const w = world(), sh = w && G.Sun.shrineOf(w, i);
    return sh ? sh.hue : 30;
  };

  // the Sun: a hot white core, a golden body and a slowly turning crown of rays
  function sunDisc(ctx, x, y, r, t, a = 1) {
    ctx.globalCompositeOperation = 'lighter';
    let g = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 3.2);
    g.addColorStop(0, `rgba(255,220,140,${0.4 * a})`); g.addColorStop(1, 'rgba(255,190,90,0)');
    ctx.fillStyle = g; circle(ctx, x, y, r * 3.2);
    for (let k = 0; k < 2; k++) {   // two crowns of rays turning opposite ways
      const n = k ? 12 : 16, rot = t * (k ? -0.12 : 0.08) + k * 0.13, len = r * (k ? 1.9 : 2.4);
      ctx.fillStyle = `rgba(255,${k ? 236 : 214},${k ? 170 : 130},${(k ? 0.2 : 0.14) * a})`;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const an = rot + i * 6.2832 / n, w = 0.09 + 0.03 * Math.sin(t * 1.3 + i), l = len * (0.86 + 0.14 * Math.sin(t * 0.9 + i * 2.1));
        ctx.moveTo(x + Math.cos(an - w) * r * 0.9, y + Math.sin(an - w) * r * 0.9);
        ctx.lineTo(x + Math.cos(an) * l, y + Math.sin(an) * l);
        ctx.lineTo(x + Math.cos(an + w) * r * 0.9, y + Math.sin(an + w) * r * 0.9);
      }
      ctx.fill();
    }
    g = ctx.createRadialGradient(x, y - r * 0.2, 0, x, y, r);
    g.addColorStop(0, `rgba(255,255,245,${a})`); g.addColorStop(0.55, `rgba(255,236,160,${0.95 * a})`); g.addColorStop(1, `rgba(255,196,90,${0.85 * a})`);
    ctx.fillStyle = g; circle(ctx, x, y, r);
    ctx.globalCompositeOperation = 'source-over';
  }

  // a small flame for the sockets (the shrine's colour)
  function flame(ctx, cx, by, s, hue, t, seed) {
    const fl = (k) => Math.sin(t * (8 + k) + seed * 3 + k) * 0.12 + Math.sin(t * (13 + k) + seed) * 0.08;
    ctx.globalCompositeOperation = 'lighter';
    for (const [w, h, l, a] of [[0.6, 1.7, 55, 0.75], [0.42, 1.25, 68, 0.85], [0.24, 0.8, 88, 0.95]]) {
      const lean = s * fl(h * 3) * 2;
      ctx.fillStyle = `hsla(${hue + (l - 55) * 0.6},100%,${l}%,${a})`;
      ctx.beginPath(); ctx.moveTo(cx - s * w, by);
      ctx.quadraticCurveTo(cx - s * w * 1.1, by - s * h * 0.55, cx + lean, by - s * (h + fl(h)));
      ctx.quadraticCurveTo(cx + s * w * 1.1, by - s * h * 0.55, cx + s * w, by); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // the altar: a wide round dais of three golden steps with a great carved sun-disc lying on top
  function altar(ctx, x, y, f, t, lit) {
    const cx = x + 16, by = y + 26, F = lit ? Math.max(f, 0.8) : f, p = 0.5 + 0.5 * Math.sin(t * 1.2);
    shadow(ctx, cx, by + 4, 46, 13, 0.28);
    for (const [rx, ry, dy, l] of [[46, 14, 0, 40], [44, 13, -3, 56], [36, 11, -7, 46], [34, 10, -10, 62], [26, 8, -14, 52], [24, 7, -17, 68]]) {
      ctx.fillStyle = G.shade(42, 34, l, F);
      ctx.beginPath(); ctx.ellipse(cx, by + dy, rx, ry, 0, 0, 6.2832); ctx.fill();
    }
    // the sun-disc on top, carved with rays
    const dy = by - 18;
    ctx.fillStyle = lit ? `hsl(44,90%,${62 + p * 8}%)` : G.shade(44, 40, 58, f);
    ctx.beginPath(); ctx.ellipse(cx, dy, 15, 4.6, 0, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = lit ? 'rgba(255,250,220,.9)' : G.shade(40, 30, 40, f);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 12; i++) {
      const a = i * 0.5236, c = Math.cos(a), s = Math.sin(a);
      ctx.beginPath(); ctx.moveTo(cx + c * 17, dy + s * 5.6); ctx.lineTo(cx + c * 21, dy + s * 6.8); ctx.stroke();
    }
    if (lit) {   // it glows from within, and a beam of light joins it to the Sun overhead
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(cx, dy, 1, cx, dy, 30);
      g.addColorStop(0, `rgba(255,245,200,${0.5 + p * 0.2})`); g.addColorStop(1, 'rgba(255,200,100,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, dy, 30, 12, 0, 0, 6.2832); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    } else {   // a faint warmth sleeping in the stone
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(255,210,120,${0.08 + p * 0.1})`; ctx.beginPath(); ctx.ellipse(cx, dy, 8, 2.4, 0, 0, 6.2832); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  Object.assign(G.OBJECT_SPRITES, {
    sunpost(ctx, x, y, f, t, tile) {
      const cx = x + 16, by = y + 28, lit = sunLit(), F = lit ? Math.max(f, 0.7) : f;
      shadow(ctx, cx, by, 9, 3.5, 0.3);
      ctx.fillStyle = G.shade(42, 30, 46, F); ctx.fillRect(cx - 6, by - 4, 12, 4);
      ctx.fillStyle = G.shade(42, 30, 54, F);
      ctx.beginPath(); ctx.moveTo(cx - 5, by - 4); ctx.lineTo(cx - 4, by - 38); ctx.lineTo(cx + 4, by - 38); ctx.lineTo(cx + 5, by - 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = G.shade(42, 30, 68, F); ctx.fillRect(cx - 3.5, by - 37, 2, 32);
      ctx.fillStyle = G.shade(42, 30, 44, F); ctx.fillRect(cx - 6, by - 41, 12, 3.5);
      // a carved sun on top
      const p = 0.5 + 0.5 * Math.sin(t * 1.5 + tile.v * 7);
      ctx.fillStyle = lit ? `hsl(46,100%,${70 + p * 12}%)` : G.shade(44, 36, 62, f);
      circle(ctx, cx, by - 46, 4.5);
      ctx.strokeStyle = lit ? `hsla(46,100%,80%,${0.7 + p * 0.3})` : G.shade(44, 30, 50, f); ctx.lineWidth = 1.2;
      for (let i = 0; i < 8; i++) { const a = i * 0.785 + t * (lit ? 0.3 : 0); ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 6, by - 46 + Math.sin(a) * 6); ctx.lineTo(cx + Math.cos(a) * 8.5, by - 46 + Math.sin(a) * 8.5); ctx.stroke(); }
    },
    sunsocket(ctx, x, y, f, t, tile) {
      const w = world(), cx = x + 16, by = y + 28;
      const i = tile.sock === undefined ? -1 : tile.sock, lit = !!w && i >= 0 && G.Sun.socketLit(w, i), hue = socketHue(i);
      const gone = w && G.state.sun && G.state.sun.rising && G.state.sun.rising.t > 0.6;   // its ember has flown to the altar
      const F = lit ? Math.max(f, 0.65) : f;
      shadow(ctx, cx, by, 11, 3.8, 0.3);
      ctx.fillStyle = G.shade(42, 28, 44, F);
      ctx.beginPath(); ctx.moveTo(cx - 8, by); ctx.lineTo(cx - 6, by - 12); ctx.lineTo(cx + 6, by - 12); ctx.lineTo(cx + 8, by); ctx.closePath(); ctx.fill();
      ctx.fillStyle = G.shade(42, 28, 58, F); ctx.fillRect(cx - 5, by - 11, 2, 10);
      // the cup, shaped like a flame, rimmed in the colour of its shrine
      ctx.fillStyle = G.shade(40, 30, 52, F);
      ctx.beginPath(); ctx.moveTo(cx - 9, by - 13); ctx.quadraticCurveTo(cx - 9, by - 20, cx, by - 25); ctx.quadraticCurveTo(cx + 9, by - 20, cx + 9, by - 13); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = lit ? `hsla(${hue},95%,68%,.95)` : G.shade(hue, 30, 40, f); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(cx - 9, by - 13); ctx.quadraticCurveTo(cx - 9, by - 20, cx, by - 25); ctx.quadraticCurveTo(cx + 9, by - 20, cx + 9, by - 13); ctx.stroke();
      ctx.fillStyle = lit ? `hsla(${hue},80%,28%,1)` : 'rgba(64,62,70,.95)';
      ctx.beginPath(); ctx.ellipse(cx, by - 14, 6.5, 2.2, 0, 0, 6.2832); ctx.fill();
      if (lit && !gone) flame(ctx, cx, by - 14, 7, hue, t, tile.v * 5);
      else if (!lit) {
        const p = 0.5 + 0.5 * Math.sin(t * 1.4 + tile.v * 4);
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `hsla(${hue},100%,60%,${0.12 + p * 0.2})`; circle(ctx, cx, by - 15, 1.5 + p);
        ctx.globalCompositeOperation = 'source-over';
      }
    },
    sunaltar(ctx, x, y, f, t) { altar(ctx, x, y, f, t, false); },
  });
  G.STRUCTURE_SPRITES.sunflame = (ctx, x, y, f, t) => altar(ctx, x, y, f, t, true);

  // sun-gold flagstones: long slabs laid in rings, warm even in the grey
  G.drawSunPave = function (ctx, x, y, f, tile) {
    const h = tile.hue;
    ctx.fillStyle = G.shade(40, 22, 44, f, 0.5);
    ctx.fillRect(x, y, 32, 32);
    for (let i = 0; i < 3; i++) {
      const a = G.hash2(h + i, 23, 5), b = G.hash2(h, i + 9, 11), sy = y + 1 + i * 10.6;
      const off = (i % 2) * 8 + (a - 0.5) * 3;
      for (let k = -1; k < 2; k++) {
        const sx = x + off + k * 16;
        if (sx > x + 31 || sx + 15 < x) continue;
        const l = Math.max(sx, x), r = Math.min(sx + 15, x + 32);
        ctx.fillStyle = G.shade(42 + b * 8, 36 + a * 14, 58 + a * 10, f);
        ctx.fillRect(l, sy, r - l, 9);
        ctx.fillStyle = G.shade(44, 40, 74, f, 0.5);
        ctx.fillRect(l, sy, r - l, 1.3);
      }
    }
  };

  G.SunFX = {
    onScreen(state, camX, camY, W, H, m) {
      const s = G.Sun.site(state.world), x = (s.tx + 0.5) * T - camX, y = (s.ty + 0.5) * T - camY;
      return x > -m && x < W + m && y > -m && y < H + m ? { s, x, y } : null;
    },

    // the carved rings and rays in the dais (with the floors), and lines of light to the burning sockets
    floor(ctx, state, camX, camY, W, H, t) {
      const o = this.onScreen(state, camX, camY, W, H, 8 * T);
      if (!o) return;
      const w = state.world, { s, x: cx, y: cy } = o, lit = w.floor > 0, p = 0.5 + 0.5 * Math.sin(t * 1.1);
      const f = w.restoreAt((s.tx + 0.5) * T, (s.ty + 0.5) * T, w.lights);
      const line = (a) => lit ? `hsla(46,100%,${70 + p * 10}%,${a})` : G.shade(40, 24, 36, f, a);
      ctx.lineWidth = 2.5; ctx.strokeStyle = line(0.55);
      ctx.beginPath(); ctx.arc(cx, cy, 5.3 * T, 0, 6.2832); ctx.stroke();
      ctx.lineWidth = 1.5; ctx.strokeStyle = line(0.45);
      ctx.beginPath(); ctx.arc(cx, cy, 2.4 * T, 0, 6.2832); ctx.stroke();
      for (let i = 0; i < 16; i++) {   // rays between the rings
        if (i % 4 === 0) continue;
        const a = i * 0.3927;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 2.6 * T, cy + Math.sin(a) * 2.6 * T); ctx.lineTo(cx + Math.cos(a) * 5 * T, cy + Math.sin(a) * 5 * T); ctx.stroke();
      }
      s.sockets.forEach((k, i) => {   // the four paths to the sockets: lit in the colour of their shrine
        const on = G.Sun.socketLit(w, i), sh = G.Sun.shrineOf(w, i), kx = (k.tx + 0.5) * T - camX, ky = (k.ty + 0.5) * T - camY;
        const a = Math.atan2(ky - cy, kx - cx), d = Math.hypot(kx - cx, ky - cy);
        ctx.strokeStyle = on && sh ? `hsla(${sh.hue},95%,${64 + p * 10}%,.65)` : G.shade(40, 20, 32, f, 0.45);
        ctx.lineWidth = on ? 3 : 2;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 1.3 * T, cy + Math.sin(a) * 1.3 * T); ctx.lineTo(cx + Math.cos(a) * (d - 12), cy + Math.sin(a) * (d - 12)); ctx.stroke();
      });
    },

    // over the night: the risen Sun, the sunrise, and soft shafts of sunlight by day
    sky(ctx, state, camX, camY, W, H, t, dark) {
      const w = state.world, play = state.sun, r = play && play.rising;
      if (w.floor > 0 && !r) this.shafts(ctx, state, camX, camY, W, H, t, dark);
      const o = this.onScreen(state, camX, camY, W, H, 10 * T);
      if (o) {
        const { s, x: cx, y: cy } = o, top = cy - 130;
        if (r) this.rising(ctx, state, s, cx, cy, camX, camY, W, H, t, r);
        else if (G.Sun.isLit(w)) {
          ctx.globalCompositeOperation = 'lighter';   // a beam joins the altar to the Sun
          const g = ctx.createLinearGradient(0, cy - 20, 0, top);
          g.addColorStop(0, `rgba(255,236,170,${0.16 + dark * 0.2})`); g.addColorStop(1, 'rgba(255,220,140,0.05)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.moveTo(cx - 14, cy - 18); ctx.lineTo(cx - 22, top); ctx.lineTo(cx + 22, top); ctx.lineTo(cx + 14, cy - 18); ctx.closePath(); ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
          sunDisc(ctx, cx, top + Math.sin(t * 0.7) * 4, 30, t, 0.9 + dark * 0.1);
        }
      }
      if (r && r.dawned) {   // the dawn: a flash, then a golden wave rolling out past the edges of the screen
        const k = r.t - G.SUN.dawnAt, fl = Math.max(0, 1 - k / 1.6);
        if (fl > 0) { ctx.fillStyle = `rgba(255,246,220,${fl * (G.calm ? 0.25 : 0.75)})`; ctx.fillRect(0, 0, W, H); }
        const s = G.Sun.site(w), cx = (s.tx + 0.5) * T - camX, cy = (s.ty + 0.5) * T - camY - 60;
        const u = G.clamp(k / 5, 0, 1), R = 40 + u * Math.hypot(W, H) * 1.1;
        ctx.globalCompositeOperation = 'lighter';
        for (const [lw, a] of [[60, 0.18], [22, 0.4], [6, 0.7]]) {
          ctx.lineWidth = lw; ctx.strokeStyle = `rgba(255,222,140,${a * (1 - u)})`;
          ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
      }
    },

    // the sunrise before and after the dawn: four embers fly up and gather, a small sun swells and climbs
    rising(ctx, state, s, cx, cy, camX, camY, W, H, t, r) {
      const w = state.world, gx = cx, gy = cy - 70, D = G.SUN.dawnAt;
      // the light gathers: the world around holds its breath (a soft warm veil that deepens toward the dawn)
      const veil = G.clamp(r.t / D, 0, 1) * (r.dawned ? Math.max(0, 1 - (r.t - D) / 3) : 1);
      ctx.fillStyle = `rgba(255,214,150,${veil * 0.16})`; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      if (r.t < 3) s.sockets.forEach((k, i) => {   // each socket's ember flies to the gathering point
        const sh = G.Sun.shrineOf(w, i), hue = sh ? sh.hue : 40;
        const u = G.clamp((r.t - 0.4 - i * 0.25) / 2, 0, 1), e = u * u * (3 - 2 * u);
        const x0 = (k.tx + 0.5) * T - camX, y0 = (k.ty + 0.5) * T - camY - 20;
        for (let j = 0; j < 7; j++) {
          const v = Math.max(0, e - j * 0.035), x = x0 + (gx - x0) * v, y = y0 + (gy - y0) * v - Math.sin(v * Math.PI) * 50;
          ctx.fillStyle = `hsla(${hue + 20},100%,${82 - j * 7}%,${(1 - j * 0.13) * (u < 1 ? 1 : 0)})`;
          circle(ctx, x, y, 5 - j * 0.6);
        }
      });
      ctx.globalCompositeOperation = 'source-over';
      if (r.t > 2) {   // the ball of light swells and rises
        const u = G.clamp((r.t - 2) / (D - 2), 0, 1), e = u * u * (3 - 2 * u);
        const k = r.dawned ? G.clamp((r.t - D) / 2.5, 0, 1) : 0;
        const y = gy - e * 40 - k * 20, rad = 6 + e * 18 + k * 6;
        sunDisc(ctx, gx, y, rad, t, Math.min(1, 0.4 + e));
      }
    },

    // by day under a rekindled Sun: a few broad, soft shafts of sunlight slanting across the land
    shafts(ctx, state, camX, camY, W, H, t, dark) {
      const day = 1 - dark, wv = state.weather ? state.weather.v : { rain: 0, cloud: 0, fog: 0 };
      const a = day * (1 - wv.rain * 0.9) * (1 - (wv.cloud || 0) * 0.6) * (1 - (wv.fog || 0) * 0.5) * 0.07;
      if (a < 0.004) return;
      const sp = 340, sl = H * 0.55, off = ((-camX * 0.35 + t * 5) % sp + sp) % sp;
      ctx.globalCompositeOperation = 'lighter';
      for (let x = off - sp - sl; x < W + sp; x += sp) {
        const k = Math.sin(x * 0.013 + t * 0.21) * 0.5 + 0.5, wd = 60 + k * 70;
        const g = ctx.createLinearGradient(x, 0, x + wd, 0);
        g.addColorStop(0, 'rgba(255,236,180,0)'); g.addColorStop(0.5, `rgba(255,236,180,${a * (0.5 + k * 0.6)})`); g.addColorStop(1, 'rgba(255,236,180,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + wd, 0); ctx.lineTo(x + wd + sl, H); ctx.lineTo(x + sl, H); ctx.closePath(); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    },

    // the Sun's Hearth on the maps (once known): a little golden sun, on the rim / edge when far away
    mapMark(ctx, state, toX, toY, big, sx, sy, t) {
      if (!G.Sun.known(state)) return;
      const s = G.Sun.site(state.world), lit = G.Sun.isLit(state.world);
      let x = toX((s.tx + 0.5) * T), y = toY((s.ty + 0.5) * T);
      const dx = x - sx, dy = y - sy, dd = Math.hypot(dx, dy);
      if (!big && dd > 66) { x = sx + dx / dd * 66; y = sy + dy / dd * 66; }
      if (big) { const k = Math.min(1, Math.abs(dx) > 0 ? (sx - 18) / Math.abs(dx) : 1, Math.abs(dy) > 0 ? (sy - 28) / Math.abs(dy) : 1); x = sx + dx * k; y = sy + dy * k; }
      const r = big ? 6.5 : 4.5, pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
      g.addColorStop(0, `rgba(255,220,130,${lit ? 0.8 : 0.3 + pulse * 0.25})`); g.addColorStop(1, 'rgba(255,200,100,0)');
      ctx.fillStyle = g; circle(ctx, x, y, r * 3);
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = lit ? '#fff1c0' : 'rgba(255,226,150,.95)'; ctx.lineWidth = 1.3;
      for (let i = 0; i < 8; i++) { const a = i * 0.785 + t * 0.3; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 1.15, y + Math.sin(a) * r * 1.15); ctx.lineTo(x + Math.cos(a) * r * 1.6, y + Math.sin(a) * r * 1.6); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0, 6.2832);
      if (lit) { ctx.fillStyle = '#ffe9a0'; ctx.fill(); } else ctx.stroke();
      if (big) G.MapLabels.add(s.name, x, y - r * 1.9 - 1, { pri: 3, below: r * 3.8 + 11, color: '#fff0c6' });
    },
  };
})();
