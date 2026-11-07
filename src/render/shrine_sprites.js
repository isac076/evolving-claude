// The Ember Shrines (Night 15): ember posts, cold and lit ember bowls, the great
// hearth (cold and kindled), the Ember lantern, warm ember flagstones — and
// G.ShrineFX: the carved rings in the shrine floor, the beam of light over a
// kindled hearth, the wave of colour while it kindles, embers leaping from the
// bowls, and the soft arrow at the screen edge that points to the next shrine.
// Same rules as sprites.js: f = restoration 0..1, t = time, base at the bottom-centre.
window.G = window.G || {};

(function () {
  const circle = G.circle, shadow = G.shadow;
  const site = (x) => x && (x.shrine || (G.state && G.state.world && G.Shrines.at(G.state.world, x.tx, x.ty)));
  const hueOf = (x) => { const s = site(x); return s ? s.hue : 24; };
  const kindled = (s) => {   // cached per lights version, like the ruins' awake()
    const w = G.state && G.state.world;
    if (!s || !w) return false;
    if (s.litV !== w.lightsVersion) { s.lit = G.Shrines.isKindled(w, s); s.litV = w.lightsVersion; }
    return s.lit;
  };

  // a living flame: three layered tongues that flicker, hot white at the core
  function flame(ctx, cx, by, size, hue, t, seed = 0) {
    const fl = (k) => Math.sin(t * (8 + k) + seed * 3 + k) * 0.12 + Math.sin(t * (13.3 + k * 2) + seed) * 0.08;
    const tongue = (w, h, lean, col) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(cx - w, by);
      ctx.quadraticCurveTo(cx - w * 1.1, by - h * 0.55, cx + lean, by - h);
      ctx.quadraticCurveTo(cx + w * 1.1, by - h * 0.55, cx + w, by);
      ctx.closePath(); ctx.fill();
    };
    ctx.globalCompositeOperation = 'lighter';
    tongue(size * 0.62, size * (1.7 + fl(0)), size * fl(1) * 2.2, `hsla(${hue},95%,52%,.75)`);
    tongue(size * 0.46, size * (1.3 + fl(2)), size * fl(3) * 1.6, `hsla(${hue + 14},100%,64%,.85)`);
    tongue(size * 0.26, size * (0.85 + fl(4) * 0.6), size * fl(5), `hsla(${hue + 30},100%,88%,.95)`);
    ctx.globalCompositeOperation = 'source-over';
  }

  // sparks drifting up from a flame
  function sparks(ctx, cx, by, hue, t, n, spread, rise) {
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const ph = (t * (0.5 + (i % 3) * 0.17) + i * 0.37) % 1;
      const sx = cx + Math.sin(i * 2.3 + t * 1.7) * spread * (0.4 + ph);
      ctx.fillStyle = `hsla(${hue + 20},100%,75%,${(1 - ph) * 0.9})`;
      circle(ctx, sx, by - ph * rise, 1.3 * (1 - ph * 0.5));
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // a stone pedestal with a wide shallow bowl on top (cold: grey ash and one faint ember)
  function bowl(ctx, x, y, f, t, hue, lit, seed) {
    const cx = x + 16, by = y + 28;
    shadow(ctx, cx, by, 12, 4, 0.3);
    ctx.fillStyle = G.shade(24, 18, 38, f);
    ctx.beginPath(); ctx.moveTo(cx - 9, by); ctx.lineTo(cx - 5, by - 14); ctx.lineTo(cx + 5, by - 14); ctx.lineTo(cx + 9, by); ctx.closePath(); ctx.fill();
    ctx.fillStyle = G.shade(24, 18, 50, f); ctx.fillRect(cx - 4, by - 13, 2.5, 12);
    ctx.fillStyle = G.shade(24, 20, 30, f); ctx.fillRect(cx - 10, by - 2, 20, 2.5);
    // the bowl
    ctx.fillStyle = G.shade(22, 22, 44, f);
    ctx.beginPath(); ctx.ellipse(cx, by - 17, 13, 6, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = G.shade(22, 22, 56, f);
    ctx.beginPath(); ctx.ellipse(cx, by - 18, 13, 4, 0, 0, 6.2832); ctx.fill();
    // carved flame marks on the rim, glowing in the shrine's colour once lit
    ctx.fillStyle = lit ? `hsla(${hue},95%,70%,.9)` : G.shade(22, 15, 36, f);
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 7, by - 12); ctx.lineTo(cx + i * 7 - 1.5, by - 15); ctx.lineTo(cx + i * 7 + 1.5, by - 15); ctx.fill(); }
    if (lit) {
      ctx.fillStyle = `hsla(${hue},80%,30%,1)`;
      ctx.beginPath(); ctx.ellipse(cx, by - 18, 10.5, 2.8, 0, 0, 6.2832); ctx.fill();
      flame(ctx, cx, by - 18, 9, hue, t, seed);
      sparks(ctx, cx, by - 24, hue, t, 5, 6, 26);
    } else {
      ctx.fillStyle = 'rgba(70,70,78,.9)';   // ash
      ctx.beginPath(); ctx.ellipse(cx, by - 18, 10.5, 2.8, 0, 0, 6.2832); ctx.fill();
      const p = 0.5 + 0.5 * Math.sin(t * 1.8 + seed * 5);   // one faint ember, waiting
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `hsla(${hue},100%,60%,${0.25 + p * 0.45})`; circle(ctx, cx + 2, by - 18.5, 1.6 + p);
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  // the great hearth: a stepped round plinth, a deep basin, and a carved sun-ring standing behind it
  function hearth(ctx, x, y, f, t, hue, lit) {
    const cx = x + 16, by = y + 30;
    shadow(ctx, cx, by, 28, 8, 0.32);
    // the sun-ring behind
    const ry = by - 46, R = 22;
    ctx.lineWidth = 7; ctx.strokeStyle = G.shade(26, 20, 40, f);
    ctx.beginPath(); ctx.arc(cx, ry, R, 0, 6.2832); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = G.shade(26, 20, 54, f);
    ctx.beginPath(); ctx.arc(cx, ry, R + 2, Math.PI * 1.1, Math.PI * 1.75); ctx.stroke();
    // rays carved round the ring
    const p = 0.5 + 0.5 * Math.sin(t * 1.4);
    ctx.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const a = i * 0.5236 + 0.26, c = Math.cos(a), s = Math.sin(a);
      ctx.strokeStyle = lit ? `hsla(${hue + 10},100%,${68 + p * 12}%,${0.75 + p * 0.25})` : G.shade(26, 14, 34, f);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx + c * (R - 2), ry + s * (R - 2)); ctx.lineTo(cx + c * (R + 2), ry + s * (R + 2)); ctx.stroke();
    }
    ctx.lineCap = 'butt';
    // two short legs holding the ring
    ctx.fillStyle = G.shade(26, 20, 36, f);
    ctx.fillRect(cx - 17, ry + 12, 5, by - ry - 22); ctx.fillRect(cx + 12, ry + 12, 5, by - ry - 22);
    // the plinth: two round steps
    ctx.fillStyle = G.shade(28, 18, 36, f);
    ctx.beginPath(); ctx.ellipse(cx, by - 3, 27, 8, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = G.shade(28, 18, 48, f);
    ctx.beginPath(); ctx.ellipse(cx, by - 6, 25, 7, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = G.shade(28, 18, 40, f);
    ctx.beginPath(); ctx.ellipse(cx, by - 9, 20, 6, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = G.shade(28, 18, 54, f);
    ctx.beginPath(); ctx.ellipse(cx, by - 11, 19, 5, 0, 0, 6.2832); ctx.fill();
    // the basin
    ctx.fillStyle = G.shade(22, 24, 38, f);
    ctx.beginPath(); ctx.moveTo(cx - 17, by - 24); ctx.quadraticCurveTo(cx - 15, by - 11, cx, by - 11); ctx.quadraticCurveTo(cx + 15, by - 11, cx + 17, by - 24); ctx.closePath(); ctx.fill();
    ctx.fillStyle = G.shade(22, 24, 52, f);
    ctx.beginPath(); ctx.ellipse(cx, by - 24, 17, 5, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = lit ? `hsla(${hue},85%,32%,1)` : 'rgba(68,68,76,.95)';
    ctx.beginPath(); ctx.ellipse(cx, by - 24, 14, 3.5, 0, 0, 6.2832); ctx.fill();
    if (lit) {
      // the ring fills with soft light, and the great flame burns
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(cx, ry, 2, cx, ry, R);
      g.addColorStop(0, `hsla(${hue + 25},100%,80%,${0.35 + p * 0.15})`); g.addColorStop(1, `hsla(${hue},100%,60%,0)`);
      ctx.fillStyle = g; circle(ctx, cx, ry, R);
      ctx.globalCompositeOperation = 'source-over';
      flame(ctx, cx - 6, by - 24, 9, hue, t, 1.3);
      flame(ctx, cx + 6, by - 24, 9, hue, t, 2.1);
      flame(ctx, cx, by - 24, 14, hue, t, 0);
      sparks(ctx, cx, by - 36, hue, t, 9, 10, 50);
    } else {
      const q = 0.5 + 0.5 * Math.sin(t * 1.2);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) { ctx.fillStyle = `hsla(${hue},100%,58%,${(0.15 + q * 0.3) * (1 - i * 0.25)})`; circle(ctx, cx - 5 + i * 5, by - 24.5 + (i % 2), 1.4 + q * 0.6); }
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  Object.assign(G.OBJECT_SPRITES, {
    emberpost(ctx, x, y, f, t, tile) {
      const s = site(tile), lit = kindled(s), hue = s ? s.hue : 30, cx = x + 16, by = y + 28;
      shadow(ctx, cx, by, 10, 3.5, 0.3);
      ctx.fillStyle = G.shade(26, 18, 40, f);
      ctx.beginPath(); ctx.moveTo(cx - 7, by); ctx.lineTo(cx - 5.5, by - 30); ctx.lineTo(cx, by - 36); ctx.lineTo(cx + 5.5, by - 30); ctx.lineTo(cx + 7, by); ctx.closePath(); ctx.fill();
      ctx.fillStyle = G.shade(26, 18, 52, f); ctx.fillRect(cx - 5, by - 29, 2.5, 27);
      // a carved flame
      const p = 0.5 + 0.5 * Math.sin(t * 1.6 + tile.v * 6);
      ctx.fillStyle = lit ? `hsla(${hue},100%,${66 + p * 14}%,${0.8 + p * 0.2})` : G.shade(26, 12, 32, f);
      ctx.beginPath(); ctx.moveTo(cx, by - 25); ctx.quadraticCurveTo(cx + 4, by - 17, cx, by - 12); ctx.quadraticCurveTo(cx - 4, by - 17, cx, by - 25); ctx.fill();
      if (lit) sparks(ctx, cx, by - 30, hue, t + tile.v * 9, 2, 3, 18);
    },
    emberbowl(ctx, x, y, f, t, tile) { bowl(ctx, x, y, f, t, hueOf(tile), false, tile.v); },
    hearth(ctx, x, y, f, t, tile) { hearth(ctx, x, y, f, t, hueOf(tile), false); },
  });

  Object.assign(G.STRUCTURE_SPRITES, {
    emberflame(ctx, x, y, f, t, st) { bowl(ctx, x, y, Math.max(f, 0.6), t, hueOf(st), true, (st.tx * 7 + st.ty) % 10 / 10); },
    shrineflame(ctx, x, y, f, t, st) { hearth(ctx, x, y, Math.max(f, 0.6), t, hueOf(st), true); },
    // the Ember lantern: a slim stone column with a little ember bowl on top
    emberlamp(ctx, x, y, f, t, st) {
      const cx = x + 16, by = y + 28, hue = 22;
      shadow(ctx, cx, by, 9, 3.5);
      ctx.fillStyle = G.shade(26, 22, 34, 1);
      ctx.beginPath(); ctx.moveTo(cx - 5, by); ctx.lineTo(cx - 3.5, by - 24); ctx.lineTo(cx + 3.5, by - 24); ctx.lineTo(cx + 5, by); ctx.closePath(); ctx.fill();
      ctx.fillStyle = G.shade(26, 22, 46, 1); ctx.fillRect(cx - 3, by - 23, 2, 21);
      ctx.fillStyle = G.shade(26, 22, 28, 1); ctx.fillRect(cx - 7, by - 3, 14, 3);
      ctx.fillStyle = G.shade(22, 24, 42, 1);
      ctx.beginPath(); ctx.ellipse(cx, by - 26, 8, 4, 0, 0, Math.PI); ctx.fill();
      ctx.fillStyle = G.shade(22, 24, 54, 1);
      ctx.beginPath(); ctx.ellipse(cx, by - 27, 8, 2.6, 0, 0, 6.2832); ctx.fill();
      flame(ctx, cx, by - 27, 6, hue, t, (st.tx || 0) * 0.37);
      sparks(ctx, cx, by - 32, hue, t + (st.ty || 0), 3, 4, 20);
    },
  });

  // warm ember flagstones: wider, rounder slabs than a ruin's, with a hint of terracotta
  G.drawShrinePave = function (ctx, x, y, f, tile) {
    const h = tile.hue;
    ctx.fillStyle = G.shade(24, 20, 40, f, 0.45);
    ctx.fillRect(x, y, 32, 32);
    for (let i = 0; i < 4; i++) {
      const a = G.hash2(h + i, 17, 3), b = G.hash2(h, i + 5, 9);
      if (a < 0.08) continue;
      const sx = x + 1 + (i % 2) * 16 + (b - 0.5) * 1.5, sy = y + 1 + Math.floor(i / 2) * 16 + (a - 0.5) * 1.5;
      ctx.fillStyle = G.shade(20 + b * 14, 26 + a * 12, 52 + a * 10, f);
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(sx, sy, 14, 14, 4); else ctx.rect(sx, sy, 14, 14);
      ctx.fill();
      ctx.fillStyle = G.shade(30, 24, 68 + a * 6, f, 0.45);
      ctx.fillRect(sx + 3, sy + 1, 8, 1.5);
    }
  };

  // ---------- G.ShrineFX ----------
  G.ShrineFX = {
    // shrines whose middle is within `m` px of the screen
    nearScreen(world, camX, camY, W, H, m) {
      const T = G.TILE;
      return G.Shrines.list(world).filter(s => {
        const x = (s.tx + 0.5) * T - camX, y = (s.ty + 0.5) * T - camY;
        return x > -m && x < W + m && y > -m && y < H + m;
      });
    },

    // carved rings and lines in the shrine floor (drawn with the floors, under everything standing)
    floor(ctx, world, camX, camY, W, H, t) {
      const T = G.TILE;
      for (const s of this.nearScreen(world, camX, camY, W, H, 7 * T)) {
        const cx = (s.tx + 0.5) * T - camX, cy = (s.ty + 0.5) * T - camY, lit = kindled(s);
        const f = world.restoreAt((s.tx + 0.5) * T, (s.ty + 0.5) * T, world.lights);
        const p = 0.5 + 0.5 * Math.sin(t * 1.3);
        const line = (a) => lit ? `hsla(${s.hue},95%,${62 + p * 10}%,${a})` : G.shade(22, 18, 30, f, a);
        ctx.lineWidth = 2.5; ctx.strokeStyle = line(lit ? 0.55 : 0.5);
        ctx.beginPath(); ctx.arc(cx, cy, 4.2 * T, 0, 6.2832); ctx.stroke();
        ctx.lineWidth = 1.5; ctx.strokeStyle = line(lit ? 0.45 : 0.4);
        ctx.beginPath(); ctx.arc(cx, cy, 1.6 * T, 0, 6.2832); ctx.stroke();
        // four lines from the hearth out to the bowls: they light up one by one
        for (const b of s.bowls) {
          const bx = (b.tx + 0.5) * T - camX, by = (b.ty + 0.5) * T - camY, on = G.Shrines.isBowlLit(world, b);
          const a = Math.atan2(by - cy, bx - cx), d = Math.hypot(bx - cx, by - cy);
          ctx.strokeStyle = on ? `hsla(${s.hue},95%,${64 + p * 10}%,.6)` : G.shade(22, 18, 30, f, 0.45);
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 1.6 * T, cy + Math.sin(a) * 1.6 * T); ctx.lineTo(cx + Math.cos(a) * (d - 10), cy + Math.sin(a) * (d - 10)); ctx.stroke();
        }
      }
    },

    // over the night: the beam of a kindled hearth, the wave while it kindles, leaping embers, the guide arrow
    sky(ctx, state, camX, camY, W, H, t, dark) {
      const T = G.TILE, world = state.world, play = state.shrines;
      ctx.globalCompositeOperation = 'lighter';
      for (const s of this.nearScreen(world, camX, camY, W, H, 4 * T)) {
        if (!kindled(s)) continue;
        const cx = (s.tx + 0.5) * T - camX, by = (s.ty + 0.5) * T - camY - 30;
        const a = 0.1 + dark * 0.22 + Math.sin(t * 0.9) * 0.03, top = by - Math.max(260, by + 40);
        const g = ctx.createLinearGradient(0, by, 0, top);
        g.addColorStop(0, `hsla(${s.hue + 15},100%,75%,${a})`); g.addColorStop(1, `hsla(${s.hue},100%,70%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(cx - 9, by); ctx.lineTo(cx - 26, top); ctx.lineTo(cx + 26, top); ctx.lineTo(cx + 9, by); ctx.closePath(); ctx.fill();
        for (let i = 0; i < 10; i++) {   // motes drifting up the beam
          const ph = (t * 0.12 + i * 0.1) % 1, y = by - ph * Math.min(320, by + 40);
          ctx.fillStyle = `hsla(${s.hue + 25},100%,80%,${(1 - ph) * (0.35 + dark * 0.4)})`;
          circle(ctx, cx + Math.sin(i * 1.9 + t * 0.8) * (6 + ph * 14), y, 1.4);
        }
      }
      if (play && play.kindling) {   // the wave of colour, rolling out as a soft bright ring
        const k = play.kindling, s = k.site, u = G.clamp(k.t / G.SHRINE.kindleTime, 0, 1), e = 1 - Math.pow(1 - u, 3);
        const cx = (s.tx + 0.5) * T - camX, cy = (s.ty + 0.5) * T - camY, r = (0.5 + (G.SHRINE.restore - 0.5) * e) * T;
        const alpha = (1 - u) * 0.55;
        for (const [w, aa] of [[26, 0.35], [10, 1]]) {
          ctx.lineWidth = w; ctx.strokeStyle = `hsla(${s.hue + 20},100%,75%,${alpha * aa})`;
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.stroke();
        }
        const fl = Math.max(0, 1 - k.t * 1.5);   // a first bright flash
        if (fl > 0) { ctx.fillStyle = `hsla(${s.hue + 30},100%,85%,${fl * 0.35})`; ctx.fillRect(0, 0, W, H); }
      }
      if (play) for (const sp of play.sparks) {   // embers leaping from the bowls into the hearth
        const s = sp.site, hx = (s.tx + 0.5) * T - camX, hy = (s.ty + 0.5) * T - camY - 30;
        const u = sp.t, x0 = sp.x0 - camX, y0 = sp.y0 - camY;
        const x = x0 + (hx - x0) * u, y = y0 + (hy - y0) * u - Math.sin(u * Math.PI) * 60;
        for (let j = 0; j < 5; j++) {
          const v = Math.max(0, u - j * 0.03), tx = x0 + (hx - x0) * v, ty = y0 + (hy - y0) * v - Math.sin(v * Math.PI) * 60;
          ctx.fillStyle = `hsla(${sp.hue + 20},100%,${80 - j * 8}%,${(1 - j * 0.18) * (1 - u * 0.3)})`;
          circle(ctx, tx, ty, 4 - j * 0.6);
        }
        ctx.fillStyle = 'rgba(255,250,230,.9)'; circle(ctx, x, y, 2);
      }
      ctx.globalCompositeOperation = 'source-over';
      if (play) this.guide(ctx, state, camX, camY, W, H, t);
    },

    // a soft ember arrow at the edge of the screen pointing to the next shrine to kindle
    guide(ctx, state, camX, camY, W, H, t) {
      const s = G.Shrines.nextToKindle(state), p = state.player;
      if (!s) return;
      const d = Math.hypot(s.tx - p.tx, s.ty - p.ty);
      if (d < G.SHRINE.guideFrom) return;
      const T = G.TILE, px = p.x - camX, py = p.y - camY;
      const a = Math.atan2((s.ty + 0.5) * T - p.y, (s.tx + 0.5) * T - p.x), c = Math.cos(a), sn = Math.sin(a);
      // it circles the spirit on a wide oval, clear of the HUD at the screen's edges
      const rx = Math.max(80, W / 2 - 110), ry = Math.max(70, H / 2 - 120), x = px + c * rx, y = py + sn * ry;
      const fade = G.clamp((d - G.SHRINE.guideFrom) / 8, 0, 1), pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
      g.addColorStop(0, `hsla(${s.hue},100%,65%,${0.35 * fade})`); g.addColorStop(1, `hsla(${s.hue},100%,60%,0)`);
      ctx.fillStyle = g; circle(ctx, 0, 0, 20);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `hsla(${s.hue + 15},100%,${78 + pulse * 10}%,${0.85 * fade})`;
      ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(-5, -7); ctx.lineTo(-1, 0); ctx.lineTo(-5, 7); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.globalAlpha = fade * 0.9;
      ctx.font = 'italic 12px Georgia, serif'; ctx.textAlign = 'center';
      const lx = G.clamp(x - c * 26, 60, W - 60), ly = y + (sn < -0.3 ? 26 : -16);
      ctx.fillStyle = 'rgba(10,12,30,.6)'; ctx.fillText(s.name, lx + 1, ly + 1);
      ctx.fillStyle = '#ffe4bf'; ctx.fillText(s.name, lx, ly);
      ctx.globalAlpha = 1;
    },
  };
})();
