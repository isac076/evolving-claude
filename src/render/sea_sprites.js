// Sprites for "Across the water" (Night 23): lily pads, driftwood and pearl beds
// on the water (and growing back), the Sea lantern on its raft, the leaf boat
// the spirit sails in (G.drawBoat, called by G.drawPlayer), the whale and the
// moon jelly, and G.SeaFX.wake — the soft V of foam behind the boat.
// Same rules as sprites.js: f = restoration 0..1, t = time, base at bottom-centre.
window.G = window.G || {};

(function () {
  const circle = G.circle;
  const bobOf = (t, seed, amp) => G.calm ? 0 : Math.sin(t * 0.9 + seed) * amp;

  // one round lily pad with its notch, seen from above (flattened)
  function pad(ctx, x, y, r, rot, f, l) {
    ctx.fillStyle = G.shade(118, 42, l, f);
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.ellipse(x, y, r, r * 0.55, 0, rot + 0.35, rot + 6.2832 - 0.35); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = G.shade(110, 40, l + 12, f, 0.6); ctx.lineWidth = 0.8;   // a pale rim
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.55, 0, rot + 0.5, rot + 3.2); ctx.stroke();
  }

  Object.assign(G.OBJECT_SPRITES, {
    lilypad(ctx, x, y, f, t, tile) {
      const v = tile.v, b = bobOf(t, v * 20, 0.8);
      const cx = x + 10 + v * 10, cy = y + 16 + b;
      pad(ctx, cx, cy, 8, v * 6, f, 30);
      pad(ctx, cx + 9 - v * 4, cy + 5, 5.5, v * 11 + 2, f, 34);
      if (v > 0.35) pad(ctx, cx - 7, cy + 6, 4.5, v * 3 + 4, f, 32);
      if (v > 0.45) {   // a water lily: pink or white petals around a golden heart
        const hue = v > 0.75 ? 48 : 332, fx = cx + 1, fy = cy - 2;
        for (let i = 0; i < 6; i++) {
          const a = i / 6 * 6.2832 + v * 3;
          ctx.fillStyle = G.shade(hue, v > 0.75 ? 25 : 70, v > 0.75 ? 92 : 80, f);
          ctx.beginPath(); ctx.ellipse(fx + Math.cos(a) * 2.6, fy + Math.sin(a) * 1.5 - 1, 2.8, 1.5, a, 0, 6.2832); ctx.fill();
        }
        ctx.fillStyle = G.shade(45, 90, 62, f); circle(ctx, fx, fy - 1.5, 1.6);
      }
    },

    driftwood(ctx, x, y, f, t, tile) {
      const v = tile.v, b = bobOf(t * 0.8, v * 30, 1.2), rot = (v - 0.5) * 0.9;
      const cx = x + 16, cy = y + 17 + b;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
      ctx.fillStyle = 'rgba(235,245,255,.18)';   // a ring of calm water around it
      ctx.beginPath(); ctx.ellipse(0, 2, 17, 5.5, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = G.shade(28, 22, 34, f);
      ctx.beginPath(); ctx.ellipse(0, 0, 13, 3.6, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = G.shade(30, 18, 48, f);    // weathered silver on top
      ctx.beginPath(); ctx.ellipse(-1, -1.2, 11, 1.6, 0, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = G.shade(28, 22, 30, f); ctx.lineWidth = 1.6; ctx.lineCap = 'round';   // a broken branch
      ctx.beginPath(); ctx.moveTo(5, -1); ctx.lineTo(9, -6); ctx.stroke(); ctx.lineCap = 'butt';
      ctx.fillStyle = G.shade(30, 25, 58, f); circle(ctx, 12.5, 0, 1.4);   // the cut end
      ctx.restore();
    },

    // an open shell on the sea floor with a pearl that shimmers through the water (it kept its shine through the Fading)
    pearlbed(ctx, x, y, f, t, tile) {
      const v = tile.v, F = Math.max(f, 0.55), cx = x + 16, cy = y + 18;
      ctx.fillStyle = G.shade(260, 30, 60, F, 0.35);   // the lower shell, seen through the water
      ctx.beginPath(); ctx.ellipse(cx, cy + 2, 9, 4.2, 0, 0, 3.1416); ctx.fill();
      ctx.fillStyle = G.shade(280, 25, 72, F, 0.3);    // the lid, tipped open
      ctx.beginPath(); ctx.ellipse(cx - 1, cy - 2, 8.5, 3.6, -0.2, 3.1416, 6.2832); ctx.fill();
      ctx.strokeStyle = G.shade(270, 30, 80, F, 0.35); ctx.lineWidth = 0.8;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(cx - 1, cy - 1.5); ctx.lineTo(cx - 1 + i * 3.4, cy - 5); ctx.stroke(); }
      const sh = 0.5 + 0.5 * Math.sin(t * 1.7 + v * 20);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 9);
      g.addColorStop(0, `hsla(${280 + sh * 60},80%,92%,${0.55 * F})`); g.addColorStop(1, 'rgba(240,230,255,0)');
      ctx.fillStyle = g; circle(ctx, cx, cy, 9);
      ctx.fillStyle = `hsl(${270 + sh * 40},40%,${90 + sh * 6}%)`; circle(ctx, cx, cy, 2.6);
      ctx.fillStyle = 'rgba(255,255,255,.9)'; circle(ctx, cx - 0.8, cy - 0.9, 0.9);
      if (sh > 0.7) {   // a glint that crosses the surface now and then
        ctx.strokeStyle = `rgba(255,255,255,${((sh - 0.7) * 2.4).toFixed(2)})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx + 5, cy - 9); ctx.lineTo(cx + 5, cy - 3); ctx.moveTo(cx + 2, cy - 6); ctx.lineTo(cx + 8, cy - 6); ctx.stroke();
      }
    },
  });

  Object.assign(G.REGROW_SPRITES, {
    lilypad(ctx, x, y, f, t, tile, p) {   // a tiny new pad unfurling
      pad(ctx, x + 14 + tile.v * 6, y + 18, 2 + p * 4, tile.v * 6, f, 34);
    },
    pearlbed(ctx, x, y, f, t, tile, p) {  // the shell, closed, slowly growing a new pearl
      const cx = x + 16, cy = y + 18, F = Math.max(f, 0.5);
      ctx.fillStyle = G.shade(265, 25, 62, F, 0.3);
      ctx.beginPath(); ctx.ellipse(cx, cy, 8.5, 3.6, 0, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = G.shade(270, 30, 78, F, 0.3 + p * 0.3); ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy); ctx.stroke();
    },
  });

  // ---------- the Sea lantern: a lamp on a little round raft ----------
  G.STRUCTURE_SPRITES.buoy = function (ctx, x, y, f, t, st) {
    const k = st && st.tx !== undefined ? G.hash2(st.tx, st.ty, 808) : 0.3;
    const b = bobOf(t * 1.6, k * 20, 1.3), lean = G.calm ? 0 : Math.sin(t * 1.3 + k * 9) * 0.05;
    const cx = x + 16, by = y + 26, p = 0.5 + 0.5 * Math.sin(t * 2.1 + k * 5) * Math.sin(t * 3.3 + 1);
    // a pool of teal light and a ring of foam on the water
    const pool = ctx.createRadialGradient(cx, by, 2, cx, by, 26);
    pool.addColorStop(0, `rgba(150,240,220,${(0.22 + 0.08 * p).toFixed(2)})`); pool.addColorStop(1, 'rgba(120,230,210,0)');
    ctx.fillStyle = pool; ctx.beginPath(); ctx.ellipse(cx, by, 26, 10, 0, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = 'rgba(235,250,255,.45)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(cx, by + 1, 14 + p, 5, 0, 0, 6.2832); ctx.stroke();
    ctx.save(); ctx.translate(cx, by + b); ctx.rotate(lean);
    // the raft: round planks with a darker rim
    ctx.fillStyle = G.shade(28, 35, 26, f); ctx.beginPath(); ctx.ellipse(0, 0, 12, 4.6, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = G.shade(30, 40, 42, f); ctx.beginPath(); ctx.ellipse(0, -1.2, 11, 3.8, 0, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = G.shade(28, 30, 30, f); ctx.lineWidth = 0.8;
    for (const dx of [-5, 0, 5]) { ctx.beginPath(); ctx.moveTo(dx, -4.6); ctx.lineTo(dx, 2.2); ctx.stroke(); }
    // the post and the lamp
    ctx.fillStyle = G.shade(28, 30, 30, f); ctx.fillRect(-1.5, -24, 3, 23);
    ctx.fillStyle = G.shade(30, 30, 24, f); ctx.fillRect(-6, -26, 12, 2.5);   // the lamp's base
    const g = ctx.createRadialGradient(0, -32, 1, 0, -32, 10);
    g.addColorStop(0, `rgba(230,255,245,${(0.85 + 0.15 * p).toFixed(2)})`); g.addColorStop(0.55, `rgba(120,235,210,${(0.5 + 0.2 * p).toFixed(2)})`);
    g.addColorStop(1, 'rgba(90,220,200,0)');
    ctx.fillStyle = g; ctx.fillRect(-5, -38, 10, 12);
    ctx.strokeStyle = G.shade(30, 25, 22, f); ctx.lineWidth = 1.2; ctx.strokeRect(-5, -38, 10, 12);
    ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(0, -26); ctx.stroke();
    ctx.fillStyle = G.shade(168, 45, 32, f);   // a little roof
    ctx.beginPath(); ctx.moveTo(-7.5, -38); ctx.lineTo(0, -44); ctx.lineTo(7.5, -38); ctx.closePath(); ctx.fill();
    ctx.fillStyle = G.shade(45, 80, 60, f); circle(ctx, 0, -45, 1.4);
    // a small pennant streaming in the wind
    const w = G.windNow || 0, dir = G.windDir || 1, fl = G.calm ? 0 : Math.sin(t * 6 + k * 7) * (1 + w * 2);
    ctx.fillStyle = G.shade(168, 70, 58, f);
    ctx.beginPath(); ctx.moveTo(1.5, -20); ctx.quadraticCurveTo(1.5 + dir * 5, -21 + fl * 0.5, 1.5 + dir * (8 + w * 3), -18.5 + fl); ctx.lineTo(1.5, -16); ctx.closePath(); ctx.fill();
    ctx.restore();
  };

  // ---------- the leaf boat (part 0 = behind the spirit, 1 = in front) ----------
  G.boatBob = function (p, t) { return G.calm ? 0 : Math.sin(t * 2.2 + p.bob * 0.15) * 1.3; };
  G.drawBoat = function (ctx, p, sx, sy, t, part) {
    const b = G.boatBob(p, t), rock = (G.calm ? 0 : Math.sin(t * 1.7) * 0.04) + p.tilt;
    ctx.save(); ctx.translate(sx, sy + 3 + b); ctx.rotate(rock); ctx.scale(p.facing, 1);
    if (part === 0) {
      // the water's edge all around the hull
      ctx.fillStyle = 'rgba(10,30,60,.18)'; ctx.beginPath(); ctx.ellipse(0, 5, 20, 4.5, 0, 0, 6.2832); ctx.fill();
      // the hollow inside of the leaf
      ctx.fillStyle = '#4f7d38';
      ctx.beginPath(); ctx.ellipse(-1, -1, 15, 3.6, 0, 0, 6.2832); ctx.fill();
      // a twig mast and a petal sail that fills with the wind
      const w = G.windNow || 0, fill = (G.windDir || 1) * p.facing * (2 + w * 3) + (G.calm ? 0 : Math.sin(t * 3) * 0.6);
      ctx.strokeStyle = '#7a5530'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-6, -27); ctx.stroke();
      ctx.fillStyle = '#ffd3e4';
      ctx.beginPath(); ctx.moveTo(-5.5, -26); ctx.quadraticCurveTo(3 + fill, -18, -5.5, -7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffb8d2';
      ctx.beginPath(); ctx.moveTo(-5.5, -22); ctx.quadraticCurveTo(-1 + fill * 0.6, -17, -5.5, -10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffe28a'; circle(ctx, -6, -28, 1.5);   // a tiny golden bead on top
    } else {
      // the outside of the leaf: a curled crescent with a pale midrib and veins
      ctx.fillStyle = '#6fae4c';
      ctx.beginPath();
      ctx.moveTo(-17, -4);
      ctx.quadraticCurveTo(-19, -7, -15, -7);                 // the curled stern
      ctx.quadraticCurveTo(-13, -1, -10, -1);
      ctx.lineTo(10, -1);
      ctx.quadraticCurveTo(15, -2, 19, -8);                   // the pointed bow lifts up
      ctx.quadraticCurveTo(17, 4, 4, 6.5);
      ctx.quadraticCurveTo(-8, 7, -15, 2);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#88c463';
      ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.quadraticCurveTo(14, 1.5, 4, 2.5); ctx.quadraticCurveTo(-6, 2.5, -12, 0); ctx.fill();
      ctx.strokeStyle = 'rgba(225,245,190,.75)'; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(-14, 1.5); ctx.quadraticCurveTo(0, 5, 16, -4); ctx.stroke();
      ctx.strokeStyle = 'rgba(225,245,190,.4)';
      for (const vx of [-8, -2, 4, 10]) { ctx.beginPath(); ctx.moveTo(vx, 3.8 - vx * 0.08); ctx.lineTo(vx + 3, 0.5); ctx.stroke(); }
      // a line of light water lapping at the hull
      ctx.strokeStyle = 'rgba(235,248,255,.55)'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(-15, 4.5); ctx.quadraticCurveTo(0, 8.5 + b * 0.4, 15, 3.5); ctx.stroke();
    }
    ctx.restore();
  };

  // ---------- G.SeaFX: the wake ----------
  G.SeaFX = {
    // two arms of foam spreading out behind the boat: each puff is a point on both arms,
    // and neighbouring puffs are joined, so the arms are smooth lines that widen and fade
    wake(ctx, state, camX, camY) {
      const sail = state.sail;
      if (!sail || sail.wake.length < 2) return;
      const arm = (k, side) => {
        const age = 1 - k.life, spread = (2.5 + age * 24) * k.s, back = age * 8;
        const ca = Math.cos(k.a), sa = Math.sin(k.a);
        return [k.x - camX - ca * back - sa * spread * side, k.y - camY - sa * back * 0.5 + ca * spread * side * 0.5];
      };
      ctx.lineCap = 'round';
      for (let i = 1; i < sail.wake.length; i++) {
        const k0 = sail.wake[i - 1], k1 = sail.wake[i];
        if (Math.hypot(k1.x - k0.x, k1.y - k0.y) > 40) continue;   // a jump (the lantern roads): don't join
        const a = Math.min(k0.life, k1.life);
        ctx.strokeStyle = `rgba(240,250,255,${(a * a * 0.5).toFixed(3)})`; ctx.lineWidth = 0.6 + a * 1.4;
        for (const side of [-1, 1]) {
          const p0 = arm(k0, side), p1 = arm(k1, side);
          ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
        }
      }
      ctx.lineCap = 'butt';
    },
  };

  // ---------- creatures of the sea ----------
  G.CREATURE_SPRITES.whale = function (ctx, c, sx, sy, t) {
    const s = c.size || 1, surf = c.surf || 0, dir = c.dir || 0, hue = c.hue;
    ctx.save(); ctx.translate(sx, sy);
    // the great shape under the water
    ctx.save(); ctx.scale(1, 0.6); ctx.rotate(dir); ctx.scale(s, s);   // seen from above, on flattened water
    const wag = Math.sin((c.ph || 0) * 1.3) * 5;
    ctx.fillStyle = `hsla(${hue},40%,12%,${(0.26 + 0.14 * surf).toFixed(3)})`;
    ctx.beginPath(); ctx.ellipse(0, 0, 44, 12.5, 0, 0, 6.2832); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-30, -7); ctx.quadraticCurveTo(-50, -2, -56, wag * 0.3); ctx.quadraticCurveTo(-50, 2, -30, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-60, wag * 0.4 - 8, 9, 4, 0.6, 0, 6.2832); ctx.ellipse(-60, wag * 0.4 + 8, 9, 4, -0.6, 0, 6.2832); ctx.fill();
    ctx.beginPath(); ctx.ellipse(10, -15, 11, 3.5, -0.5, 0, 6.2832); ctx.ellipse(10, 15, 11, 3.5, 0.5, 0, 6.2832); ctx.fill();
    ctx.restore();
    // the back breaking the surface
    const fa = Math.atan2(Math.sin(dir) * 0.6, Math.cos(dir));   // the angle as seen on the flattened water
    if (surf > 0.02) {
      ctx.save(); ctx.rotate(fa);
      const L = 28 * s, H = 9 * s * surf;
      ctx.fillStyle = `rgba(215,238,255,${(0.16 * surf).toFixed(3)})`;   // pale, stirred water around the back
      ctx.beginPath(); ctx.ellipse(0, 1.5, L + 7, 4 + H * 0.45, 0, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = `rgba(240,250,255,${(0.5 * surf).toFixed(3)})`; ctx.lineWidth = 1.3;   // foam along the waterline in front
      ctx.beginPath(); ctx.ellipse(0, 1.2, L + 2, 2.6 + H * 0.15, 0, 0.15, 3.0); ctx.stroke();
      ctx.fillStyle = `hsl(${hue},20%,${(24 + 6 * surf).toFixed(0)}%)`;
      ctx.beginPath(); ctx.ellipse(0, 1, L, H + 1, 0, 3.1416, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-L * 0.55, 1 - H * 0.55); ctx.quadraticCurveTo(-L * 0.45, -H - 4 * surf, -L * 0.3, 1 - H * 0.8); ctx.fill();   // a small fin
      ctx.fillStyle = `hsla(${hue},35%,70%,${(0.45 * surf).toFixed(3)})`;   // the wet shine along its back
      ctx.beginPath(); ctx.ellipse(-L * 0.05, 1 - H * 0.7, L * 0.55, Math.max(0.5, H * 0.18), 0, 0, 6.2832); ctx.fill();
      ctx.restore();
    }
    const fx = Math.cos(fa), fy = Math.sin(fa);
    // a fountain of spray from the blowhole
    if (c.blow >= 0) {
      const k = c.blow / 1.8, bx = fx * 18 * s, by = fy * 18 * s - 6 * surf * s;
      for (let i = 0; i < 16; i++) {
        const r = G.hash2(i, 3, 77), spread = (r - 0.5) * 1.3, up = Math.min(1, k * 2.2);
        const h = 38 * s * Math.sin(up * Math.PI * 0.5) - Math.max(0, k - 0.45) * 60 * (0.6 + r * 0.6);
        const dx = spread * (10 + k * 26);
        const a = (1 - k) * (0.5 + r * 0.4);
        if (a <= 0 || h < -4) continue;
        ctx.fillStyle = `rgba(235,248,255,${a.toFixed(3)})`;
        circle(ctx, bx + dx, by - Math.max(0, h) - r * 4, 1.4 + r * 1.6 + k * 1.5);
      }
    }
    // the tail lifting out of the water as it dives
    if (c.fluke >= 0) {
      const k = c.fluke / 1.6, up = Math.sin(Math.min(1, k) * Math.PI), tx = -fx * 40 * s, ty = -fy * 40 * s;
      ctx.fillStyle = `hsl(${hue},22%,26%)`;
      ctx.beginPath();
      ctx.moveTo(tx - 2, ty); ctx.lineTo(tx - 1.5, ty - 14 * up);
      ctx.quadraticCurveTo(tx - 14 * s, ty - 22 * up, tx - 16 * s, ty - 15 * up);
      ctx.quadraticCurveTo(tx - 6, ty - 15 * up, tx, ty - 13 * up);
      ctx.quadraticCurveTo(tx + 6, ty - 15 * up, tx + 16 * s, ty - 15 * up);
      ctx.quadraticCurveTo(tx + 14 * s, ty - 22 * up, tx + 1.5, ty - 14 * up);
      ctx.lineTo(tx + 2, ty); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(235,248,255,.7)';   // water streaming off it
      for (let i = 0; i < 6; i++) circle(ctx, tx + (i - 2.5) * 5 * s, ty - 14 * up + ((k * 40 + i * 7) % 16), 1);
      ctx.strokeStyle = `rgba(235,248,255,${(0.6 * up).toFixed(3)})`; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.ellipse(tx, ty + 1, 9 * s, 3, 0, 0, 6.2832); ctx.stroke();
    }
    ctx.restore();
  };

  G.CREATURE_SPRITES.jelly = function (ctx, c, sx, sy, t) {
    const pl = Math.sin(c.pulse || 0), sq = 1 + pl * 0.14, hue = c.hue, sz = 0.8 + c.seed * 0.5;
    ctx.save(); ctx.translate(sx, sy); ctx.scale(sz, sz);
    const g = ctx.createRadialGradient(0, -1, 0, 0, -1, 14);
    g.addColorStop(0, `hsla(${hue},90%,78%,.35)`); g.addColorStop(1, `hsla(${hue},90%,70%,0)`);
    ctx.fillStyle = g; circle(ctx, 0, -1, 14);
    ctx.strokeStyle = `hsla(${hue},80%,82%,.4)`; ctx.lineWidth = 0.8;   // trailing tentacles
    for (let i = 0; i < 4; i++) {
      const ox = (i - 1.5) * 2.4, w = Math.sin((c.pulse || 0) * 0.8 + i) * 1.6;
      ctx.beginPath(); ctx.moveTo(ox, 1); ctx.quadraticCurveTo(ox + w, 6, ox - w * 0.6, 11 - pl); ctx.stroke();
    }
    ctx.fillStyle = `hsla(${hue},70%,82%,.6)`;   // the bell, squeezing as it swims
    ctx.beginPath(); ctx.ellipse(0, 0, 6.2 * sq, 5 / sq, 0, 3.1416, 6.2832); ctx.quadraticCurveTo(0, 2.5, -6.2 * sq, 0); ctx.fill();
    ctx.fillStyle = `hsla(${hue},90%,92%,.75)`;  // four soft rings inside
    for (const [dx, dy] of [[-2, -2], [2, -2], [-1, -3.5], [1, -3.5]]) circle(ctx, dx * sq, dy / sq, 0.9);
    ctx.restore();
  };
})();
