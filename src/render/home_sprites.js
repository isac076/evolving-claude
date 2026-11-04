// Sprites for friends' homes and wishes (Night 10): the cottage, and the little
// heart bubble over a friend who is wishing for something.
// Same rules as sprites.js: f = restoration 0..1, t = time, base at bottom-centre.
window.G = window.G || {};

(function () {
  const circle = G.circle, shadow = G.shadow;

  // a heart path centred on (x, y), r = half its width
  G.heartPath = function (ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y + r * 0.9);
    ctx.bezierCurveTo(x - r * 1.3, y + r * 0.05, x - r * 0.9, y - r * 1.05, x, y - r * 0.35);
    ctx.bezierCurveTo(x + r * 0.9, y - r * 1.05, x + r * 1.3, y + r * 0.05, x, y + r * 0.9);
    ctx.closePath();
  };

  G.COTTAGE_SCALE = 1.35;
  Object.assign(G.STRUCTURE_SPRITES, {
    // A small round-doored cottage. Its door and roof take the colour of the
    // friend who lives there; at night, when they're inside, the window glows
    // and a thread of smoke curls from the chimney.
    cottage(ctx, x, y, f, t, st) {
      const cx = x + 16, by = y + 29, o = st && st.owner, hue = o ? o.hue : 28;
      const home = o && o.state === 'sleep' && o.house;   // they're inside
      const day = G.daylight(t);   // t is the game time
      const K = G.COTTAGE_SCALE;   // a house should look bigger than the friends who live in it
      ctx.save(); ctx.translate(cx, by); ctx.scale(K, K); ctx.translate(-cx, -by);
      shadow(ctx, cx + 2, by, 22, 5, 0.26);
      // walls: warm plaster with a timber frame
      const wl = 18, wr = 18, wh = 21;
      ctx.fillStyle = G.shade(38, 40, 76, f);
      ctx.fillRect(cx - wl, by - wh, wl + wr, wh);
      ctx.fillStyle = G.shade(36, 30, 64, f);                       // a little shade on the right
      ctx.fillRect(cx + wr - 5, by - wh, 5, wh);
      ctx.fillStyle = G.shade(26, 40, 30, f);                       // beams
      ctx.fillRect(cx - wl, by - wh, wl + wr, 2); ctx.fillRect(cx - wl, by - 2, wl + wr, 2);
      ctx.fillRect(cx - wl, by - wh, 2, wh); ctx.fillRect(cx + wr - 2, by - wh, 2, wh);
      // stone footing
      ctx.fillStyle = G.shade(220, 8, 52, f);
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(cx - 15 + i * 6, by - 0.5, 3.2, 2, 0, 0, 6.2832); ctx.fill(); }

      // round door in the owner's colour
      const dx = cx - 6;
      ctx.fillStyle = G.shade(26, 35, 26, f);
      ctx.beginPath(); ctx.moveTo(dx - 5.5, by - 1); ctx.lineTo(dx - 5.5, by - 9); ctx.arc(dx, by - 9, 5.5, Math.PI, 0); ctx.lineTo(dx + 5.5, by - 1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = G.shade(hue, o ? 55 : 30, o ? 46 : 38, f);
      ctx.beginPath(); ctx.moveTo(dx - 4.3, by - 1); ctx.lineTo(dx - 4.3, by - 9); ctx.arc(dx, by - 9, 4.3, Math.PI, 0); ctx.lineTo(dx + 4.3, by - 1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = G.shade(hue, 40, 34, f); ctx.fillRect(dx - 0.5, by - 13, 1, 12);
      ctx.fillStyle = G.shade(48, 80, 70, f); circle(ctx, dx + 2.6, by - 6.5, 0.9);     // knob

      // window with a cross, warm at night when someone's home
      const wx = cx + 9, wy = by - 15;
      ctx.fillStyle = G.shade(26, 40, 30, f); ctx.fillRect(wx - 5, wy - 1, 10, 9);
      const lit = home ? 1 : 0, dark = 1 - day;
      ctx.fillStyle = lit ? `rgba(255,${200 + Math.sin(t * 3) * 10 | 0},120,${0.75 + dark * 0.25})` : G.shade(205, 35, 58 + dark * -18, f);
      ctx.fillRect(wx - 4, wy, 8, 7);
      if (!lit) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(wx - 3, wy + 1, 2, 2); }
      ctx.fillStyle = G.shade(26, 40, 30, f); ctx.fillRect(wx - 0.5, wy, 1, 7); ctx.fillRect(wx - 4, wy + 3, 8, 1);
      // flower box under the window
      ctx.fillStyle = G.shade(26, 45, 34, f); ctx.fillRect(wx - 5.5, wy + 8, 11, 2.5);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = G.shade((hue + 140 + i * 50) % 360, 70, 66, f);
        circle(ctx, wx - 4 + i * 2.7, wy + 7.4 + G.sway(t * 1.2, i, 0.3), 1.3);
      }

      // chimney (behind the roof's peak, on the right)
      const chx = cx + 9;
      ctx.fillStyle = G.shade(10, 25, 40, f); ctx.fillRect(chx - 3, by - wh - 22, 6, 12);
      ctx.fillStyle = G.shade(10, 20, 30, f); ctx.fillRect(chx - 3.5, by - wh - 23, 7, 2);

      // roof: soft thatch-like tiles in the owner's colour (warm straw if nobody lives here yet)
      const rh = hue, rs = o ? 42 : 45, rl = o ? 40 : 48, ry = by - wh;
      ctx.fillStyle = G.shade(rh, rs, rl - 10, f);
      ctx.beginPath(); ctx.moveTo(cx - 23, ry + 2); ctx.lineTo(cx, ry - 21); ctx.lineTo(cx + 23, ry + 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = G.shade(rh, rs, rl, f);
      ctx.beginPath(); ctx.moveTo(cx - 21, ry); ctx.lineTo(cx, ry - 19); ctx.lineTo(cx + 21, ry); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = G.shade(rh, rs, rl - 9, f); ctx.lineWidth = 1;   // rows of tiles
      for (let k = 1; k < 4; k++) {
        const yy = ry - k * 4.6, half = 21 * (1 - k * 4.6 / 19);
        ctx.beginPath();
        for (let i = -half; i < half; i += 4) { ctx.moveTo(cx + i, yy); ctx.quadraticCurveTo(cx + i + 2, yy + 2.2, cx + i + 4, yy); }
        ctx.stroke();
      }
      ctx.fillStyle = G.shade(rh, rs, rl + 14, f);                    // light along the ridge
      ctx.beginPath(); ctx.moveTo(cx - 21, ry); ctx.lineTo(cx, ry - 19); ctx.lineTo(cx - 1, ry - 15); ctx.lineTo(cx - 17, ry); ctx.closePath(); ctx.fill();
      const snow = G.SEASON_NOW.snow;
      if (snow > 0.05) {   // a soft blanket of snow on the roof, with a lip hanging over the eaves (Night 12)
        ctx.fillStyle = G.shade(212, 30, 94, f, snow.toFixed(2));
        ctx.beginPath(); ctx.moveTo(cx - 23, ry + 1); ctx.lineTo(cx, ry - 22); ctx.lineTo(cx + 23, ry + 1);
        ctx.quadraticCurveTo(cx + 12, ry - 6, cx, ry - 12); ctx.quadraticCurveTo(cx - 12, ry - 6, cx - 23, ry + 1); ctx.fill();
        for (let i = -20; i <= 20; i += 8) circle(ctx, cx + i, ry + 1.2 - Math.abs(i) * 0.05, 1.8);
        ctx.fillRect(chx - 3.5, by - wh - 25, 7, 2.5);
      }
      // a round attic window
      ctx.fillStyle = G.shade(26, 40, 28, f); circle(ctx, cx, ry - 7, 3.2);
      ctx.fillStyle = lit ? 'rgba(255,214,140,.9)' : G.shade(205, 30, 52, f); circle(ctx, cx, ry - 7, 2.2);

      // smoke curls up while someone is home (or at dusk and dawn, putting the kettle on)
      if (o && (home || day < 0.7)) {
        for (let i = 0; i < 4; i++) {
          const k = (t * 0.22 + i / 4) % 1, w = G.windNow || 0, dir = G.windDir || 1;
          const sx = chx + Math.sin(t * 0.9 + i * 1.7) * 3 * k + dir * w * 26 * k * k, sy = by - wh - 26 - k * 34;
          ctx.fillStyle = `rgba(${200 + f * 30 | 0},${200 + f * 25 | 0},${210 + f * 20 | 0},${(0.38 * (1 - k) * Math.min(1, k * 6)).toFixed(3)})`;
          circle(ctx, sx, sy, 2.5 + k * 5);
        }
      }
      ctx.restore();
    },
  });

  // ---------- drawn after the night lighting ----------
  // a little paper bubble with a heart over a friend who has a wish:
  // pale while unheard, pink once you know it, golden and bobbing when it can come true
  G.drawWishMark = function (ctx, v, sx, sy, t, ready) {
    if (!v.wish || v.say || v.state === 'sleep') return;
    const bob = Math.sin(t * (ready ? 4 : 2) + v.ph) * (ready ? 2.2 : 1.2);
    const x = sx + 10, y = sy - 44 - (v.sit || 0) * 24 + bob;
    ctx.save();
    if (ready) {
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x, y, 0, x, y, 18);
      g.addColorStop(0, 'rgba(255,210,120,.55)'); g.addColorStop(1, 'rgba(255,210,120,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 18, 0, 6.2832); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.fillStyle = ready ? 'rgba(255,246,214,.96)' : 'rgba(255,248,236,.9)';
    ctx.strokeStyle = ready ? 'rgba(230,170,60,.9)' : `hsla(${v.hue},45%,55%,.7)`;
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(x, y, 10, 0, 6.2832); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 7, y + 11.5, 2.2, 0, 6.2832); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 10, y + 15.5, 1.3, 0, 6.2832); ctx.fill();
    const pulse = ready ? 1 + Math.sin(t * 6) * 0.12 : 1;
    G.heartPath(ctx, x, y + 0.5, 5.6 * pulse);
    ctx.fillStyle = ready ? '#ffb43c' : v.wish.known ? '#ff7fa8' : 'rgba(255,127,168,.45)';
    ctx.fill();
    if (!v.wish.known) {   // a tiny question mark: go and ask!
      ctx.fillStyle = '#7a4a66'; ctx.font = '700 8px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('?', x, y + 0.5);
    }
    ctx.restore();
  };

  // hearts rising from a friend whose wish just came true
  G.drawHeartFx = function (ctx, v, sx, sy, dt) {
    if (!(v.heartFx > 0)) return;
    v.heartFx -= dt;
    const k = 1 - v.heartFx / 1.6;
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const kk = G.clamp(k * 1.3 - i * 0.12, 0, 1);
      if (kk <= 0 || kk >= 1) continue;
      ctx.globalAlpha = Math.sin(kk * Math.PI);
      G.heartPath(ctx, sx + Math.sin(kk * 5 + i * 2) * (8 + i * 3) + (i - 1.5) * 6, sy - 30 - kk * 40, 3.5 + i % 2);
      ctx.fillStyle = i % 2 ? '#ffc0d6' : '#ff8fb5'; ctx.fill();
    }
    ctx.restore();
  };
})();
