// Sprites for the Far Isles (Night 27): the island grounds (the turquoise lagoon
// with sunlight dancing on its sandy floor, pale coral sand with bits of shell,
// the lush green heart), seashells, tide pools, hibiscus, ferns, coral under the
// lagoon, the Shell lantern, the Shell chime, things growing back, the hermit
// crab, the sea turtle and the parrot.
// Same rules as sprites.js: f = restoration 0..1, t = time, base at bottom-centre.
window.G = window.G || {};

(function () {
  const circle = G.circle, shadow = G.shadow;
  const SHELLS = [20, 34, 350, 8, 44, 300];        // seashell tints: peach, cream, rose, coral, sand, lilac
  const FLOWERS = [354, 8, 330, 28, 300];          // hibiscus: red, coral, pink, orange, magenta
  const CORALS = [340, 14, 290, 30, 320];          // coral: pink, orange, violet, gold, rose

  // ---------- ground ----------
  G.drawIsleGround = function (ctx, tile, d, x, y, f, t, tx, ty) {
    const v = tile.v, u = (v * 37.1) % 1, w = (v * 53.7) % 1;
    if (tile.type === 'lagoon') {
      // pale sand showing through the shallow water, and sunlight dancing on it (caustics)
      if (tile.soft > 0.55) {
        ctx.fillStyle = G.shade(d.h - 8, d.s - 12, Math.min(90, d.l + 12), f, 0.4);
        ctx.beginPath(); ctx.ellipse(x + 8 + u * 16, y + 10 + w * 12, 8 + v * 5, 3.5, 0, 0, 6.2832); ctx.fill();
      }
      const a0 = (0.05 + 0.16 * f) * (1 - (d.snow || 0));
      ctx.lineWidth = 1;
      for (let k = 0; k < 2; k++) {
        const ph = G.calm ? 1 + k : t * 0.9 + tx * 0.8 + ty * 1.3 + k * 2.4, a = Math.round(a0 * (0.4 + 0.6 * Math.max(0, Math.sin(ph))) * 60) / 60;
        if (a <= 0.01) continue;
        const ox = x + 2 + ((u + k * 0.47) % 1) * 20, oy = y + 4 + ((w + k * 0.31) % 1) * 22, s = Math.sin(ph * 0.7) * 2.2;
        ctx.strokeStyle = `rgba(235,255,250,${a.toFixed(3)})`;
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.quadraticCurveTo(ox + 4, oy - 3 + s, ox + 8, oy); ctx.quadraticCurveTo(ox + 11, oy + 2 - s, ox + 14, oy - 1); ctx.stroke();
      }
      return;
    }
    if (tile.type === 'strand') {
      if (v > 0.55) {   // a broken bit of shell, pink inside
        ctx.fillStyle = G.shade(SHELLS[tile.hue % 6], 50, 86, f);
        ctx.beginPath(); ctx.ellipse(x + 6 + u * 20, y + 8 + w * 18, 1.8, 1.1, u * 3, 0, 6.2832); ctx.fill();
        ctx.fillStyle = G.shade(350, 50, 74, f, 0.8); circle(ctx, x + 6 + u * 20 + 0.4, y + 8 + w * 18 + 0.3, 0.6);
      }
      if (v < 0.25) {   // tiny pink and white grains
        ctx.fillStyle = G.shade(354, 40, 70, f, 0.7); ctx.fillRect(x + 4 + w * 22, y + 5 + u * 20, 1.4, 1.4);
        ctx.fillStyle = G.shade(30, 20, 94, f, 0.8); ctx.fillRect(x + 12 + u * 14, y + 14 + w * 12, 1.2, 1.2);
      }
      return;
    }
    // the green heart: broad leafy tufts and now and then a tiny flower
    if (v > 0.55 && d.snow < 0.6) {
      const ox = x + 5 + u * 18, oy = y + 10 + w * 14, sw = G.sway(t * 1.6, tx + ty, 1);
      ctx.fillStyle = G.shade(d.h + 8, d.s + 6, d.l + 7, f);
      for (const [lx, la] of [[-3, -0.6], [0, 0], [3, 0.6]]) {
        ctx.beginPath(); ctx.ellipse(ox + lx + sw * 0.6, oy - 3, 1.5, 3.6, la + sw * 0.05, 0, 6.2832); ctx.fill();
      }
    }
    if (tile.soft > 0.62 && v < 0.3) {
      ctx.fillStyle = G.shade(FLOWERS[tile.hue % 5], 70, 66, f);
      circle(ctx, x + 8 + w * 16, y + 9 + u * 14, 1.5);
      ctx.fillStyle = G.shade(50, 90, 75, f); circle(ctx, x + 8 + w * 16, y + 9 + u * 14, 0.5);
    }
  };

  // ---------- shells ----------
  // a scallop: a ribbed fan with a little hinge
  function scallop(ctx, cx, cy, s, h, f, rot) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot || 0);
    ctx.fillStyle = G.shade(h, 55, 80, f);
    ctx.beginPath(); ctx.moveTo(0, s * 0.35); ctx.arc(0, s * 0.35, s, Math.PI * 1.12, Math.PI * 1.88); ctx.closePath(); ctx.fill();
    ctx.fillRect(-s * 0.35, s * 0.25, s * 0.7, s * 0.3);   // the hinge
    ctx.strokeStyle = G.shade(h, 45, 64, f); ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) { const a = Math.PI * (1.2 + i * 0.15); ctx.moveTo(0, s * 0.35); ctx.lineTo(Math.cos(a) * s * 0.95, s * 0.35 + Math.sin(a) * s * 0.95); }
    ctx.stroke();
    ctx.restore();
  }
  // a conch: a pointed spiral with a pink mouth
  function conch(ctx, cx, cy, s, h, f, dir) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(dir || 1, 1);
    ctx.fillStyle = G.shade(h, 45, 82, f);
    ctx.beginPath(); ctx.moveTo(-s * 1.2, 0); ctx.quadraticCurveTo(-s * 0.2, -s * 1.1, s * 0.8, -s * 0.5);
    ctx.quadraticCurveTo(s * 1.1, 0, s * 0.6, s * 0.35); ctx.quadraticCurveTo(-s * 0.2, s * 0.55, -s * 1.2, 0); ctx.fill();
    ctx.strokeStyle = G.shade(h, 35, 62, f); ctx.lineWidth = 0.6;   // the spiral's turns
    ctx.beginPath(); ctx.moveTo(-s * 0.7, -s * 0.2); ctx.lineTo(-s * 0.45, s * 0.25); ctx.moveTo(-s * 0.25, -s * 0.45); ctx.lineTo(0, s * 0.3); ctx.stroke();
    ctx.fillStyle = G.shade(350, 70, 72, f);   // the mouth
    ctx.beginPath(); ctx.ellipse(s * 0.45, -s * 0.05, s * 0.38, s * 0.26, -0.3, 0, 6.2832); ctx.fill();
    ctx.restore();
  }
  // a starfish
  function star(ctx, cx, cy, r, h, f, rot) {
    ctx.fillStyle = G.shade(h, 75, 60, f);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = rot + i * 0.6283, rr = i % 2 ? r * 0.42 : r; ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.7); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = G.shade(h + 10, 70, 74, f); circle(ctx, cx, cy, r * 0.22);
  }
  // a branching coral head (seen through the water: a = how much of it shows)
  function coralHead(ctx, cx, by, s, h, f, t, seed, a) {
    const sw = G.calm ? 0 : Math.sin(t * 1.1 + seed * 9) * 0.6;
    ctx.strokeStyle = G.shade(h, 70, 60, f, a); ctx.lineCap = 'round';
    const branch = (x, y, ang, len, w, depth) => {
      const ex = x + Math.cos(ang) * len + sw * (3 - depth) * 0.3, ey = y + Math.sin(ang) * len;
      ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
      if (depth < 2) { branch(ex, ey, ang - 0.5, len * 0.7, w * 0.7, depth + 1); branch(ex, ey, ang + 0.45, len * 0.65, w * 0.7, depth + 1); }
      else { ctx.fillStyle = G.shade(h + 12, 80, 76, f, a); circle(ctx, ex, ey, w * 0.8); }
    };
    branch(cx, by, -Math.PI / 2 - 0.1 + (seed - 0.5) * 0.4, s, 2.8, 0);
    ctx.lineCap = 'butt';
  }

  Object.assign(G.OBJECT_SPRITES, {
    seashell(ctx, x, y, f, t, tile) {
      const v = tile.v, h = SHELLS[tile.hue % 6];
      shadow(ctx, x + 16, y + 25, 9, 2.2, 0.12);
      scallop(ctx, x + 11 + v * 4, y + 22, 5.2, h, f, (v - 0.5) * 0.6);
      conch(ctx, x + 21, y + 25, 4.2, SHELLS[(tile.hue + 2) % 6], f, v > 0.5 ? 1 : -1);
      if (v > 0.6) scallop(ctx, x + 19, y + 18, 3, SHELLS[(tile.hue + 4) % 6], f, 0.5);
      // a sparkle of wet shell in the sun
      const g = Math.max(0, Math.sin(t * 1.4 + v * 30)) ** 10;
      if (g > 0.1) { ctx.fillStyle = `rgba(255,255,255,${(g * (0.4 + 0.6 * f)).toFixed(2)})`; ctx.fillRect(x + 10 + v * 4, y + 18, 1.5, 1.5); }
    },

    tidepool(ctx, x, y, f, t, tile) {
      const v = tile.v, cx = x + 16, cy = y + 21;
      ctx.fillStyle = G.shade(24, 14, 46, f);   // a ring of dark rocks
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * 6.2832 + v * 3;
        ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * 9.5, cy + Math.sin(a) * 4.6, 3.4 + ((v * (i + 3)) % 1) * 1.8, 2.5, 0, 0, 6.2832); ctx.fill();
      }
      ctx.fillStyle = G.shade(178, 55, 46, f);   // the pool
      ctx.beginPath(); ctx.ellipse(cx, cy, 9, 4.2, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = G.shade(176, 40, 66, f, 0.6);
      ctx.beginPath(); ctx.ellipse(cx - 2, cy + 0.6, 5, 2, 0, 0, 6.2832); ctx.fill();
      star(ctx, cx + 3, cy + 0.5, 3.2, (tile.hue % 3) * 14 + 8, f, v * 3);
      ctx.fillStyle = G.shade(320, 60, 66, f);   // a little anemone, waving
      for (let i = -2; i <= 2; i++) { const sw = G.calm ? 0 : Math.sin(t * 2 + i) * 0.6; ctx.fillRect(cx - 5 + i * 0.9 + sw, cy - 2.5, 0.7, 2.2); }
      ctx.fillStyle = G.shade(24, 10, 64, f);   // light on the rocks' tops
      ctx.fillRect(cx - 9, cy - 5, 3, 0.9); ctx.fillRect(cx + 6, cy - 4.5, 3, 0.9);
      const g = 0.5 + 0.5 * Math.sin(t * 1.6 + v * 20);
      ctx.fillStyle = `rgba(255,255,255,${(0.15 + 0.3 * g * f).toFixed(2)})`; ctx.fillRect(cx - 4, cy - 1.6, 3, 0.8);
    },

    hibiscus(ctx, x, y, f, t, tile) {
      const v = tile.v, cx = x + 16, by = y + 28, sw = G.sway(t * 1.1, v * 10, 0.8);
      shadow(ctx, cx, by, 12, 3.5);
      const leaf = [[-7, -7, 7], [6, -8, 7], [0, -13, 8], [-4, -16, 5.5], [5, -15, 6]];
      leaf.forEach(([lx, ly, r], i) => { ctx.fillStyle = G.shade(130 + i * 3, 42, 24 + i * 2.5, f); circle(ctx, cx + lx + sw * (i / 4), by + ly, r); });
      ctx.fillStyle = G.shade(126, 40, 40, f, 0.8);   // glossy leaf tips
      circle(ctx, cx - 3 + sw, by - 18, 2); circle(ctx, cx + 8 + sw * 0.6, by - 12, 1.8);
      const fl = [[-6, -12], [5, -16], [7, -6]];
      fl.forEach(([fx, fy], i) => {
        if (i === 2 && v < 0.4) return;
        const h = FLOWERS[(tile.hue + i * 2) % 5], px = cx + fx + sw * 0.8, py = by + fy;
        ctx.fillStyle = G.shade(h, 78, 58, f);
        for (let k = 0; k < 5; k++) { const a = k * 1.2566 + v * 4; ctx.beginPath(); ctx.ellipse(px + Math.cos(a) * 2.4, py + Math.sin(a) * 2, 2.6, 1.8, a, 0, 6.2832); ctx.fill(); }
        ctx.fillStyle = G.shade(h - 6, 70, 36, f); circle(ctx, px, py, 1.1);
        ctx.strokeStyle = G.shade(52, 90, 70, f); ctx.lineWidth = 0.8;   // the long stamen
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 2.4, py - 2.6); ctx.stroke();
        ctx.fillStyle = G.shade(52, 95, 74, f); circle(ctx, px + 2.6, py - 2.8, 0.8);
      });
    },

    fern(ctx, x, y, f, t, tile) {
      const v = tile.v, cx = x + 16, by = y + 27;
      ctx.lineWidth = 1;
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.42, len = 11 + ((v * (5 + i)) % 1) * 5, sw = G.sway(t * 1.3, v * 8 + i, 1.2);
        const ex = cx + Math.cos(a) * len * 1.2 + sw, ey = by + Math.sin(a) * len * 0.75 + Math.abs(i - 3) * 1.6;
        const mx = cx + Math.cos(a) * len * 0.5, my = by + Math.sin(a) * len * 0.75 - 3;
        ctx.strokeStyle = G.shade(112 + i * 3, 46, 30 + (i % 2) * 6, f);
        ctx.beginPath(); ctx.moveTo(cx, by); ctx.quadraticCurveTo(mx, my, ex, ey); ctx.stroke();
        ctx.fillStyle = G.shade(108 + i * 3, 48, 38 + (i % 2) * 6, f);   // leaflets along the frond
        for (let k = 1; k < 5; k++) {
          const q = k / 5, px = (1 - q) * (1 - q) * cx + 2 * (1 - q) * q * mx + q * q * ex, py = (1 - q) * (1 - q) * by + 2 * (1 - q) * q * my + q * q * ey;
          ctx.beginPath(); ctx.ellipse(px, py, 2.2 * (1 - q * 0.5), 0.9, a + 1.4, 0, 6.2832); ctx.fill();
        }
      }
    },

    // coral under the lagoon: a pale shoal of sand, branching heads and a round brain coral, softened by the water
    coral(ctx, x, y, f, t, tile) {
      const v = tile.v, F = Math.max(f, 0.5), cx = x + 16, by = y + 24;
      ctx.fillStyle = G.shade(50, 30, 74, F, 0.28);
      ctx.beginPath(); ctx.ellipse(cx, by - 2, 13, 5.5, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = G.shade(CORALS[(tile.hue + 1) % 5], 50, 62, F, 0.6);   // a round brain coral
      ctx.beginPath(); ctx.ellipse(cx + 6, by - 2, 4.2, 3, 0, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = G.shade(CORALS[(tile.hue + 1) % 5], 40, 48, F, 0.5); ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(cx + 3, by - 2.5); ctx.quadraticCurveTo(cx + 6, by - 5, cx + 9, by - 2); ctx.stroke();
      coralHead(ctx, cx - 4, by, 8 + v * 3, CORALS[tile.hue % 5], F, t, v, 0.8);
      coralHead(ctx, cx - 9, by + 1, 5 + v * 2, CORALS[(tile.hue + 2) % 5], F, t, (v * 7) % 1, 0.7);
      if (v > 0.4) coralHead(ctx, cx + 2, by + 2.5, 6 + v * 2, CORALS[(tile.hue + 3) % 5], F, t, v * 3 % 1, 0.7);
      // the water over it: a soft turquoise veil and a glint
      ctx.fillStyle = G.shade(176, 50, 60, F, 0.12);
      ctx.beginPath(); ctx.ellipse(cx, by - 6, 12, 7, 0, 0, 6.2832); ctx.fill();
      const g = 0.5 + 0.5 * Math.sin(t * 1.3 + v * 17);
      ctx.strokeStyle = `rgba(240,255,252,${(0.12 + 0.25 * g * f).toFixed(2)})`; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(cx - 9, by - 12); ctx.quadraticCurveTo(cx - 5, by - 14, cx - 1, by - 12); ctx.stroke();
    },
  });

  Object.assign(G.STRUCTURE_SPRITES, {
    // a great spiral shell on a driftwood post, a coral-rose light glowing deep in its mouth
    shelllantern(ctx, x, y, f, t) {
      const cx = x + 16, by = y + 28, p = 0.5 + 0.5 * Math.sin(t * 1.7) * Math.sin(t * 2.9 + 1);
      const pool = ctx.createRadialGradient(cx, by - 2, 2, cx, by - 2, 26);
      pool.addColorStop(0, `rgba(255,170,180,${(0.24 + 0.08 * p).toFixed(2)})`); pool.addColorStop(1, 'rgba(255,160,170,0)');
      ctx.fillStyle = pool; ctx.beginPath(); ctx.ellipse(cx, by - 2, 26, 10, 0, 0, 6.2832); ctx.fill();
      shadow(ctx, cx, by, 9, 3);
      // the driftwood post, silvery and twisted
      ctx.fillStyle = '#9b8f84';
      ctx.beginPath(); ctx.moveTo(cx - 3, by); ctx.quadraticCurveTo(cx - 1.5, by - 10, cx - 2.5, by - 18); ctx.lineTo(cx + 2.5, by - 18); ctx.quadraticCurveTo(cx + 1, by - 10, cx + 3.2, by); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#7a6f66'; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(cx - 1, by - 2); ctx.quadraticCurveTo(cx + 0.5, by - 9, cx - 0.6, by - 17); ctx.stroke();
      scallop(ctx, cx - 7, by - 0.5, 3, 20, 1, -0.3);    // shells at its foot
      scallop(ctx, cx + 7.5, by + 0.2, 2.6, 350, 1, 0.4);
      // the great shell: a cream spiral lying on its side, the open mouth towards you
      const sx = cx, sy = by - 25;
      ctx.fillStyle = '#f3e1cf';
      ctx.beginPath(); ctx.moveTo(sx - 12, sy + 1); ctx.quadraticCurveTo(sx - 9, sy - 9, sx + 2, sy - 9); ctx.quadraticCurveTo(sx + 12, sy - 8, sx + 11, sy + 2);
      ctx.quadraticCurveTo(sx + 9, sy + 8, sx, sy + 8); ctx.quadraticCurveTo(sx - 9, sy + 7, sx - 12, sy + 1); ctx.fill();
      ctx.strokeStyle = '#c9ab92'; ctx.lineWidth = 0.8;   // its spiral ridges and knobs
      ctx.beginPath(); ctx.moveTo(sx - 10, sy - 1); ctx.quadraticCurveTo(sx - 6, sy - 7, sx + 1, sy - 7.5); ctx.moveTo(sx - 11, sy + 2.5); ctx.quadraticCurveTo(sx - 9, sy + 6, sx - 3, sy + 7); ctx.stroke();
      ctx.fillStyle = '#e7cdb4'; for (const k of [-7, -3, 1]) circle(ctx, sx + k, sy - 8.4, 1.1);
      ctx.fillStyle = '#f3e1cf'; ctx.beginPath(); ctx.moveTo(sx - 12, sy + 1); ctx.lineTo(sx - 16, sy - 0.5); ctx.lineTo(sx - 11.5, sy - 2); ctx.fill();   // its pointed tip
      // the glowing mouth
      const g = ctx.createRadialGradient(sx + 4, sy, 0.5, sx + 4, sy, 8);
      g.addColorStop(0, `rgba(255,250,235,${(0.95).toFixed(2)})`); g.addColorStop(0.4, `rgba(255,${(170 + 30 * p).toFixed(0)},170,.95)`); g.addColorStop(1, 'rgba(230,110,140,.9)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(sx + 4, sy + 0.5, 6.2, 5, -0.15, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = '#e7a7a4'; ctx.lineWidth = 1.2; ctx.stroke();   // the lip, curling
      ctx.fillStyle = `rgba(255,255,245,${(0.7 + 0.3 * p).toFixed(2)})`; circle(ctx, sx + 3.5, sy + 0.5, 1.6 + p * 0.6);
      ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.fillRect(sx - 6, sy - 6, 4, 1);   // light on the shell's back
    },

    // seashells on threads under a driftwood arch, swinging in the wind
    windchime(ctx, x, y, f, t, st) {
      const cx = x + 16, by = y + 28, k = st && st.tx !== undefined ? G.hash2(st.tx, st.ty, 919) : 0.4, wind = G.windNow || 0, dir = G.windDir || 1;
      shadow(ctx, cx, by, 13, 3);
      ctx.strokeStyle = '#9b8f84'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';   // two posts and a bent branch across
      ctx.beginPath(); ctx.moveTo(cx - 11, by); ctx.lineTo(cx - 10, by - 26); ctx.moveTo(cx + 11, by); ctx.lineTo(cx + 10.5, by - 25); ctx.stroke();
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx - 13, by - 25); ctx.quadraticCurveTo(cx, by - 31, cx + 13, by - 24); ctx.stroke();
      ctx.lineCap = 'butt';
      const pieces = [[-6, 12, 'scallop', 20], [-2, 16, 'conch', 34], [2, 11, 'star', 14], [6, 15, 'scallop', 350]];
      pieces.forEach(([px, len, kind, h], i) => {
        const top = by - 28.5 + Math.abs(px) * 0.12;
        const swing = G.calm ? 0 : Math.sin(t * (2.2 + i * 0.37) + k * 9 + i * 1.7) * (0.06 + wind * 0.22) + dir * wind * 0.18;
        const ex = cx + px + Math.sin(swing) * len, ey = top + Math.cos(swing) * len;
        ctx.strokeStyle = 'rgba(240,230,210,.8)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(cx + px, top); ctx.lineTo(ex, ey); ctx.stroke();
        if (kind === 'scallop') scallop(ctx, ex, ey + 2.4, 2.6, h, f, swing);
        else if (kind === 'conch') conch(ctx, ex, ey + 1.6, 2.2, h, f, 1);
        else star(ctx, ex, ey + 2, 2.6, h, f, swing + 0.3);
      });
    },
  });

  // growing back after they were gathered (p = 0 .. 1)
  Object.assign(G.REGROW_SPRITES, {
    seashell(ctx, x, y, f, t, tile, p) {   // a new shell washed up, small at first
      if (p > 0.2) scallop(ctx, x + 14, y + 23, 1.5 + p * 3, SHELLS[tile.hue % 6], f, 0.2);
    },
    tidepool(ctx, x, y, f, t, tile, p) {   // the pool fills back up slowly
      const cx = x + 16, cy = y + 21;
      ctx.fillStyle = G.shade(24, 14, 46, f);
      for (let i = 0; i < 7; i++) { const a = i / 7 * 6.2832 + tile.v * 3; ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * 9.5, cy + Math.sin(a) * 4.6, 3.6, 2.5, 0, 0, 6.2832); ctx.fill(); }
      ctx.fillStyle = G.shade(178, 50, 46, f, 0.3 + 0.6 * p);
      ctx.beginPath(); ctx.ellipse(cx, cy, 8.5 * (0.4 + 0.6 * p), 3.8 * (0.4 + 0.6 * p), 0, 0, 6.2832); ctx.fill();
    },
    hibiscus(ctx, x, y, f, t, tile, p) {
      const cx = x + 16, by = y + 28;
      ctx.fillStyle = G.shade(130, 42, 28, f);
      circle(ctx, cx - 2, by - 3 - p * 5, 2 + p * 4); circle(ctx, cx + 3, by - 2 - p * 4, 2 + p * 3.5);
      if (p > 0.75) { ctx.fillStyle = G.shade(FLOWERS[tile.hue % 5], 78, 60, f); circle(ctx, cx, by - 9, 1.6); }
    },
    fern(ctx, x, y, f, t, tile, p) {   // a fiddlehead uncurling
      const cx = x + 16, by = y + 27;
      ctx.strokeStyle = G.shade(116, 46, 34, f); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(cx, by); ctx.quadraticCurveTo(cx - 1, by - 4 - p * 6, cx + 2, by - 5 - p * 6); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + 2, by - 3.5 - p * 6, 1.5, 3.4, 0.5 + p * 3); ctx.stroke();
    },
    coral(ctx, x, y, f, t, tile, p) {   // a little nub of new coral
      const F = Math.max(f, 0.5);
      ctx.fillStyle = G.shade(50, 30, 74, F, 0.25);
      ctx.beginPath(); ctx.ellipse(x + 16, y + 22, 10, 4.5, 0, 0, 6.2832); ctx.fill();
      if (p > 0.15) coralHead(ctx, x + 14, y + 24, 1.5 + p * 4, CORALS[tile.hue % 5], F, t, tile.v, 0.6);
    },
  });

  // ---------- the hermit crab: a borrowed spiral shell on red legs; it tucks in when you rush ----------
  G.CREATURE_SPRITES.crab = function (ctx, c, sx, sy, t) {
    const h = c.hue, out = 1 - (c.hide || 0), run = c.state === 'run', lg = run ? Math.sin(c.legs || 0) : 0, f = c.vx < 0 ? -1 : 1;
    G.shadow(ctx, sx, sy + 0.5, 7, 2, 0.2);
    if (out > 0.05) {
      const leg = `hsl(${h},62%,${46}%)`;
      ctx.strokeStyle = leg; ctx.lineWidth = 1.1;   // little legs on each side
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const k = (i - 1) * 1.8, st = (i % 2 ? lg : -lg) * 1.4;
        ctx.moveTo(sx - 2 + k * 0.3, sy - 2.5); ctx.lineTo(sx - 5.5 * out + st, sy - 1 + i * 0.6);
        ctx.moveTo(sx + 2 + k * 0.3, sy - 2.5); ctx.lineTo(sx + 5.5 * out - st, sy - 1 + i * 0.6);
      }
      ctx.stroke();
      // claws: one big, one small; one waves now and then
      const wave = c.wave > 0 ? Math.sin(c.wave * 9) * 3 : 0;
      ctx.fillStyle = `hsl(${h},70%,${52}%)`;
      ctx.beginPath(); ctx.ellipse(sx + 4.5 * out, sy - 4.5 - Math.max(0, wave), 2.4 * out, 1.8 * out, -0.4, 0, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx - 4 * out, sy - 3.5, 1.5 * out, 1.2 * out, 0.4, 0, 6.2832); ctx.fill();
      // eyes on stalks
      ctx.strokeStyle = leg; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(sx - 1, sy - 5); ctx.lineTo(sx - 1.5, sy - 5 - 3 * out); ctx.moveTo(sx + 1, sy - 5); ctx.lineTo(sx + 1.6, sy - 5 - 3 * out); ctx.stroke();
      ctx.fillStyle = '#1c1a22'; circle(ctx, sx - 1.5, sy - 5 - 3 * out, 0.8); circle(ctx, sx + 1.6, sy - 5 - 3 * out, 0.8);
    }
    // the shell on its back, wobbling as it runs
    const wob = run ? Math.sin((c.legs || 0) * 0.5) * 0.12 : 0;
    ctx.save(); ctx.translate(sx - f * 1, sy - 4.5 - out * 1.5); ctx.rotate(wob); ctx.scale(-f, 1);
    ctx.fillStyle = `hsl(${30 + (h % 20)},40%,80%)`;
    ctx.beginPath(); ctx.ellipse(0, 0, 5.4, 4.2, 0, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = `hsl(${24 + (h % 20)},35%,58%)`; ctx.lineWidth = 0.8;   // the spiral
    ctx.beginPath(); ctx.arc(-0.6, -0.4, 2.8, 0.4, 4.8); ctx.stroke();
    ctx.beginPath(); ctx.arc(-0.9, -0.6, 1.2, 1, 5.6); ctx.stroke();
    ctx.fillStyle = `hsl(${24 + (h % 20)},40%,72%)`; ctx.beginPath(); ctx.moveTo(4.5, -2); ctx.lineTo(7.4, -3.4); ctx.lineTo(5.2, 0.2); ctx.fill();   // the point
    ctx.restore();
  };

  // ---------- the sea turtle: an oval shell with flippers, seen from above through the water ----------
  G.CREATURE_SPRITES.seaturtle = function (ctx, c, sx, sy, t) {
    const surf = c.surf || 0, h = c.hue, st = c.stroke || 0, a0 = ctx.globalAlpha;
    ctx.globalAlpha = a0 * (0.38 + 0.62 * surf);
    ctx.save(); ctx.translate(sx, sy - 2); ctx.scale(1.45, 1.45 * 0.72); ctx.rotate(c.dir || 0);
    const fl = Math.sin(st * 2) * 0.55, skin = `hsl(${h + 20},28%,${42 + surf * 10}%)`;
    ctx.fillStyle = skin;   // flippers: long front ones that sweep, short back ones
    for (const s of [-1, 1]) {
      ctx.save(); ctx.translate(4, s * 5); ctx.rotate(s * (0.9 + fl));
      ctx.beginPath(); ctx.ellipse(4.5, 0, 6, 1.9, 0, 0, 6.2832); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(-6, s * 4); ctx.rotate(s * (2.3 - fl * 0.5));
      ctx.beginPath(); ctx.ellipse(2.2, 0, 3, 1.4, 0, 0, 6.2832); ctx.fill(); ctx.restore();
    }
    ctx.beginPath(); ctx.ellipse(10.5, 0, 3, 2.4, 0, 0, 6.2832); ctx.fill();   // the head
    ctx.fillStyle = '#1c1a22'; circle(ctx, 11.6, -1.3, 0.6); circle(ctx, 11.6, 1.3, 0.6);
    ctx.fillStyle = `hsl(${h},38%,${30 + surf * 8}%)`;   // the shell
    ctx.beginPath(); ctx.ellipse(0, 0, 8.6, 6.8, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = `hsl(${h + 10},34%,${40 + surf * 10}%)`;   // its plates
    for (const [px, py, r] of [[-2.8, 0, 2.3], [2.2, 0, 2.3], [-0.3, -3.6, 1.8], [-0.3, 3.6, 1.8], [5.4, 0, 1.4]]) {
      ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * 1.047; ctx.lineTo(px + Math.cos(a) * r, py + Math.sin(a) * r); } ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = a0;
    if (surf > 0.6) {   // a ring of water around it while it breathes at the surface
      ctx.strokeStyle = `rgba(235,250,255,${((surf - 0.6) * 1.1).toFixed(2)})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(sx, sy - 2, 19, 8.5, 0, 0, 6.2832); ctx.stroke();
    }
  };

  // ---------- the parrot: a bright bird with a hooked beak and a long tail ----------
  G.CREATURE_SPRITES.parrot = function (ctx, c, sx, sy, t) {
    const f = c.face, h = c.hue, flying = c.state === 'fly' || c.state === 'arrive';
    const k = Math.max(0.25, 1 - c.z / 120);
    ctx.fillStyle = `rgba(0,0,10,${(0.2 * k).toFixed(3)})`; ctx.beginPath(); ctx.ellipse(sx, sy, 6 * k, 2.4 * k, 0, 0, 6.2832); ctx.fill();
    const y = sy - c.z - 5;
    const body = `hsl(${h},78%,50%)`, wing = `hsl(${(h + 150) % 360},70%,44%)`, tip = `hsl(${(h + 200) % 360},70%,48%)`, face = `hsl(${(h + 40) % 360},85%,66%)`;
    if (flying) {
      const flap = Math.sin(c.ph);
      ctx.strokeStyle = wing; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx - 9, y - flap * 7); ctx.quadraticCurveTo(sx - 4, y - 2 - flap * 2, sx, y);
      ctx.quadraticCurveTo(sx + 4, y - 2 - flap * 2, sx + 9, y - flap * 7); ctx.stroke(); ctx.lineCap = 'butt';
      ctx.strokeStyle = tip; ctx.lineWidth = 1.6;   // the long tail streaming behind
      ctx.beginPath(); ctx.moveTo(sx - f * 2, y + 1); ctx.lineTo(sx - f * 9, y + 3); ctx.stroke();
      ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(sx, y + 0.5, 4, 2.5, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = face; circle(ctx, sx + f * 3.6, y - 0.4, 1.9);
      return;
    }
    const peck = c.peck > 0 ? 1 : 0;
    ctx.strokeStyle = tip; ctx.lineWidth = 2;   // the long tail, hanging down
    ctx.beginPath(); ctx.moveTo(sx - f * 1.5, y + 2); ctx.quadraticCurveTo(sx - f * 4, y + 6, sx - f * 5, y + 9); ctx.stroke();
    ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(sx, y, 3.6, 5, f * -0.25, 0, 6.2832); ctx.fill();   // upright body
    ctx.fillStyle = wing; ctx.beginPath(); ctx.ellipse(sx - f * 1.2, y + 0.6, 2.4, 3.8, f * -0.3, 0, 6.2832); ctx.fill();
    const hx = sx + f * (1.5 + peck * 1.5), hy = y - 5 + peck * 3;
    ctx.fillStyle = face; circle(ctx, hx, hy, 2.6);
    ctx.fillStyle = '#f4ecd8';   // a white eye patch and a dark hooked beak
    circle(ctx, hx + f * 0.8, hy - 0.4, 1.1);
    ctx.fillStyle = '#2b2630';
    ctx.beginPath(); ctx.moveTo(hx + f * 2, hy - 1.2); ctx.quadraticCurveTo(hx + f * 4.4, hy - 0.8, hx + f * 3.4, hy + 1.6); ctx.lineTo(hx + f * 2, hy + 0.8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1c1a22'; circle(ctx, hx + f * 0.9, hy - 0.5, 0.5);
    ctx.strokeStyle = '#5a4a40'; ctx.lineWidth = 0.8;   // feet
    ctx.beginPath(); ctx.moveTo(sx - 1, y + 4.5); ctx.lineTo(sx - 1, sy); ctx.moveTo(sx + 1.2, y + 4.5); ctx.lineTo(sx + 1.2, sy); ctx.stroke();
  };
})();
