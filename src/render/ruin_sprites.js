// Sprites for the ruins of the old world (Night 11): pillars, walls, a gate,
// the keeper statue, the dry fountain, rubble, old flagstones and the memory
// stones. Same rules as sprites.js: f = restoration 0..1, t = game time,
// drawn with the base at the bottom-centre of the tile. In grey land the
// stone is cold and bare; as colour returns it warms to honey sandstone and
// ivy, moss and little flowers creep over it.
window.G = window.G || {};

(function () {
  const circle = G.circle, shadow = G.shadow;
  const stone = (f, dl = 0, a) => G.shade(36, 22, 66 + dl, f, a);

  // Has this tile's ruin had its memory stone woken? (then the fountain runs, the keeper's lantern glows)
  function awake(tile) {
    const s = tile && tile.ruin, w = G.state && G.state.world;
    if (!s || !w) return false;
    if (s.awake === undefined || s.awakeV !== w.lightsVersion) { s.awake = G.Ruins.isRead(w, s); s.awakeV = w.lightsVersion; }
    return s.awake;
  }

  // ivy climbing a stone from (x, y0) up to (x, y1), only where the colour is back
  function ivy(ctx, x, y0, y1, f, seed, spread = 5) {
    if (f < 0.3) return;
    const a = Math.min(1, (f - 0.3) / 0.4), n = Math.floor((y0 - y1) / 4);
    ctx.globalAlpha = a;
    for (let i = 0; i < n; i++) {
      const y = y0 - i * 4, wob = Math.sin(i * 0.9 + seed * 6) * spread;
      ctx.fillStyle = G.shade(110 + (i % 3) * 8, 48, 30 + (i % 2) * 8, f);
      circle(ctx, x + wob, y, 2.3);
      if (i % 3 === 1) circle(ctx, x + wob + (wob > 0 ? -3 : 3), y - 1, 1.7);
    }
    ctx.fillStyle = G.shade(330 + seed * 40, 70, 78, f);
    for (let i = 2; i < n; i += 4) circle(ctx, x + Math.sin(i * 0.9 + seed * 6) * spread + 1.5, y0 - i * 4 - 1, 1.2);
    ctx.globalAlpha = 1;
  }

  // a tuft of moss / grass at the foot of a stone
  function tuft(ctx, x, y, f, w = 8) {
    if (f < 0.25) return;
    ctx.globalAlpha = Math.min(1, (f - 0.25) / 0.4);
    ctx.fillStyle = G.shade(105, 45, 34, f);
    ctx.beginPath(); ctx.ellipse(x, y, w, 2.6, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = G.shade(50, 85, 70, f); circle(ctx, x - w * 0.5, y - 1.5, 1.2);
    ctx.globalAlpha = 1;
  }

  // a rounded standing slab carved with a spiral — the heart of every ruin
  function slab(ctx, x, y, f, t, glow, seed) {
    const cx = x + 16, by = y + 28, w = 11, h = 38;
    shadow(ctx, cx, by, 13, 4, 0.28);
    ctx.fillStyle = G.shade(230, 10, 40, f);   // a darker, older stone than the rest
    ctx.beginPath();
    ctx.moveTo(cx - w, by); ctx.lineTo(cx - w, by - h + w); ctx.arc(cx, by - h + w, w, Math.PI, 0); ctx.lineTo(cx + w, by);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = G.shade(230, 10, 52, f);
    ctx.fillRect(cx - w + 2, by - h + w, 3, h - w - 2);
    // the carving: a spiral and three small marks, glowing silver (asleep) or gold (awake)
    const p = 0.5 + 0.5 * Math.sin(t * (glow ? 1.6 : 1.1) + seed);
    const col = glow ? `rgba(255,${205 + p * 30},${120 + p * 40},${0.75 + p * 0.25})` : `rgba(200,215,255,${0.25 + p * 0.35})`;
    ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 26; i++) {
      const a = i * 0.42, r = 0.6 + i * 0.24, px = cx + Math.cos(a) * r, py = by - 19 + Math.sin(a) * r;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 3; i++) { ctx.moveTo(cx - 4 + i * 4, by - 7); ctx.lineTo(cx - 4 + i * 4, by - 4); }
    ctx.stroke();
    if (glow) {   // little motes circling an awake stone, and flowers at its foot
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) {
        const a = t * 0.8 + i * 1.2566, r = 15 + Math.sin(t * 1.3 + i) * 2;
        ctx.fillStyle = `rgba(255,220,140,${0.35 + 0.3 * Math.sin(t * 2 + i * 2)})`;
        circle(ctx, cx + Math.cos(a) * r, by - 20 + Math.sin(a) * r * 0.45 - 4, 1.4);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = G.shade(110, 45, 34, f);
      ctx.beginPath(); ctx.ellipse(cx, by, 13, 3, 0, 0, 6.2832); ctx.fill();
      for (let i = 0; i < 5; i++) { ctx.fillStyle = G.shade((seed * 90 + i * 70) % 360, 75, 74, f); circle(ctx, cx - 11 + i * 5.5, by - 1 + (i % 2), 1.6); }
    } else {
      // asleep: now and then a pale breath of light drifts up from the carving
      const k = (t * 0.35 + seed) % 1;
      ctx.fillStyle = `rgba(215,225,255,${0.4 * Math.sin(k * Math.PI)})`;
      circle(ctx, cx + Math.sin(k * 6 + seed) * 3, by - 22 - k * 22, 1.5);
      tuft(ctx, cx, by, f, 9);
    }
  }

  Object.assign(G.OBJECT_SPRITES, {
    pillar(ctx, x, y, f, t, tile) {
      const cx = x + 16, by = y + 28, v = tile.v, h = 40 + v * 30, w = 7;
      shadow(ctx, cx, by, 13, 4);
      ctx.fillStyle = stone(f, -8); ctx.fillRect(cx - 10, by - 5, 20, 5);      // plinth
      ctx.fillStyle = stone(f); ctx.fillRect(cx - w, by - h, w * 2, h - 5);    // shaft
      ctx.fillStyle = stone(f, 10); ctx.fillRect(cx - w + 2, by - h, 3, h - 5);
      ctx.fillStyle = stone(f, -14); ctx.fillRect(cx + w - 3, by - h, 3, h - 5);
      ctx.fillStyle = stone(f, -6);
      for (let i = -1; i <= 1; i++) ctx.fillRect(cx + i * 4 - 0.5, by - h + 2, 1, h - 9);   // fluting
      if (v > 0.6) {   // whole, with its capital
        ctx.fillStyle = stone(f, -4); ctx.fillRect(cx - 10, by - h - 5, 20, 5);
        ctx.fillStyle = stone(f, 8); ctx.fillRect(cx - 10, by - h - 5, 20, 1.5);
      } else {         // broken off: a jagged top
        ctx.fillStyle = stone(f, 4);
        ctx.beginPath(); ctx.moveTo(cx - w, by - h);
        ctx.lineTo(cx - 3, by - h - 4 - v * 4); ctx.lineTo(cx, by - h - 1); ctx.lineTo(cx + 3, by - h - 6); ctx.lineTo(cx + w, by - h + 2);
        ctx.lineTo(cx + w, by - h + 3); ctx.lineTo(cx - w, by - h + 3); ctx.closePath(); ctx.fill();
      }
      ivy(ctx, cx + (v > 0.5 ? -2 : 2), by - 4, by - h * (0.4 + v * 0.5), f, v);
      tuft(ctx, cx, by, f, 11);
    },
    stump(ctx, x, y, f, t, tile) {
      const cx = x + 14, by = y + 28, h = 14 + tile.v * 10;
      shadow(ctx, cx + 4, by, 15, 4);
      ctx.fillStyle = stone(f, -8); ctx.fillRect(cx - 10, by - 5, 20, 5);
      ctx.fillStyle = stone(f); ctx.fillRect(cx - 7, by - h, 14, h - 5);
      ctx.fillStyle = stone(f, 10); ctx.fillRect(cx - 5, by - h, 3, h - 5);
      ctx.fillStyle = stone(f, 4);
      ctx.beginPath(); ctx.moveTo(cx - 7, by - h); ctx.lineTo(cx - 2, by - h - 4); ctx.lineTo(cx + 2, by - h - 1); ctx.lineTo(cx + 7, by - h - 3); ctx.lineTo(cx + 7, by - h + 2); ctx.lineTo(cx - 7, by - h + 2); ctx.fill();
      // a fallen drum of the column, lying in the grass
      const dx = cx + 12, dy = by - 3;
      ctx.fillStyle = stone(f, -6); ctx.fillRect(dx - 6, dy - 6, 10, 9);
      ctx.fillStyle = stone(f, 6); ctx.beginPath(); ctx.ellipse(dx + 4, dy - 1.5, 3, 4.5, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = stone(f, -12); ctx.beginPath(); ctx.ellipse(dx + 4, dy - 1.5, 1.2, 2.2, 0, 0, 6.2832); ctx.fill();
      ivy(ctx, cx - 3, by - 4, by - h + 2, f, tile.v, 3);
      tuft(ctx, cx + 4, by, f, 13);
    },
    ruinwall(ctx, x, y, f, t, tile) {
      const by = y + 28, v = tile.v, h = 14 + v * 8;
      shadow(ctx, x + 16, by, 18, 4);
      ctx.fillStyle = stone(f, -4); ctx.fillRect(x, by - h, 32, h);
      ctx.fillStyle = stone(f, 8); ctx.fillRect(x, by - h, 32, 2);
      ctx.strokeStyle = stone(f, -16); ctx.lineWidth = 1;
      ctx.beginPath();
      for (let r = 0; r * 7 < h - 2; r++) {
        const yy = by - h + 2 + r * 7; ctx.moveTo(x, yy); ctx.lineTo(x + 32, yy);
        for (let c = (r % 2) * 5; c < 32; c += 10) { ctx.moveTo(x + c, yy); ctx.lineTo(x + c, Math.min(by, yy + 7)); }
      }
      ctx.stroke();
      // a stone or two fallen off the top
      ctx.fillStyle = G.hash2(tile.hue, 3, 7) > 0.5 ? stone(f, 2) : stone(f, -8);
      ctx.fillRect(x + 6 + v * 16, by - h - 4, 8, 4);
      if (f > 0.3) {   // moss along the top
        ctx.globalAlpha = Math.min(1, (f - 0.3) / 0.4);
        ctx.fillStyle = G.shade(105, 45, 36, f);
        for (let i = 0; i < 5; i++) circle(ctx, x + 3 + i * 6.5, by - h + 0.5 + (i % 2), 2.4);
        ctx.globalAlpha = 1;
      }
      tuft(ctx, x + 16, by, f, 15);
    },
    // the whole arch is drawn from its left foot and spans three tiles (A . a)
    arch(ctx, x, y, f, t, tile) {
      const by = y + 28, lx = x + 16, rx = x + 80, mx = x + 48, top = by - 50;
      shadow(ctx, mx, by, 46, 5, 0.18);
      for (const cx of [lx, rx]) {
        ctx.fillStyle = stone(f, -8); ctx.fillRect(cx - 10, by - 5, 20, 5);
        ctx.fillStyle = stone(f); ctx.fillRect(cx - 7, top, 14, by - top - 5);
        ctx.fillStyle = stone(f, 10); ctx.fillRect(cx - 5, top, 3, by - top - 5);
        ctx.fillStyle = stone(f, -14); ctx.fillRect(cx + 4, top, 3, by - top - 5);
      }
      // the curve: blocks of stone, one missing near the top where it cracked
      const R = 39, r = 25;
      for (let i = 0; i < 9; i++) {
        if (i === 5) continue;
        const a0 = Math.PI + i * Math.PI / 9, a1 = a0 + Math.PI / 9 - 0.03;
        ctx.fillStyle = stone(f, i % 2 ? 2 : -3);
        ctx.beginPath(); ctx.arc(mx, top, R, a0, a1); ctx.arc(mx, top, r, a1, a0, true); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = stone(f, 12);
      ctx.beginPath(); ctx.arc(mx, top, R, Math.PI, Math.PI * 1.55); ctx.arc(mx, top, R - 2, Math.PI * 1.55, Math.PI, true); ctx.fill();
      // the missing block lies at the foot of the right column
      ctx.fillStyle = stone(f, -2); ctx.save(); ctx.translate(rx - 16, by - 4); ctx.rotate(0.3); ctx.fillRect(-6, -4, 12, 7); ctx.restore();
      ivy(ctx, lx + 3, by - 4, top - 4, f, 0.2, 3);
      if (f > 0.3) {   // ivy hanging from the curve
        ctx.globalAlpha = Math.min(1, (f - 0.3) / 0.4);
        for (let i = 0; i < 4; i++) {
          const a = Math.PI * (1.2 + i * 0.12), hx = mx + Math.cos(a) * r, hy = top + Math.sin(a) * r, len = 6 + (i % 2) * 6;
          const sw = G.sway(t * 1.2, i, 1.2);
          ctx.fillStyle = G.shade(112, 46, 32 + (i % 2) * 6, f);
          for (let k = 0; k < len; k += 3) circle(ctx, hx + sw * k / len, hy + k, 1.8);
        }
        ctx.globalAlpha = 1;
      }
      tuft(ctx, lx, by, f, 11); tuft(ctx, rx, by, f, 11);
    },
    archfoot() {},   // drawn by the arch
    statue(ctx, x, y, f, t, tile) {
      const cx = x + 16, by = y + 28, lit = awake(tile);
      shadow(ctx, cx, by, 16, 5, 0.26);
      ctx.fillStyle = stone(f, -10); ctx.fillRect(cx - 13, by - 10, 26, 10);    // plinth
      ctx.fillStyle = stone(f, 2); ctx.fillRect(cx - 13, by - 10, 26, 2);
      // the keeper: a hooded robe, one arm raised with a lantern
      ctx.fillStyle = stone(f, 4);
      ctx.beginPath(); ctx.moveTo(cx - 10, by - 10); ctx.lineTo(cx - 6, by - 40); ctx.lineTo(cx + 6, by - 40); ctx.lineTo(cx + 10, by - 10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = stone(f, -10);
      ctx.beginPath(); ctx.moveTo(cx + 2, by - 40); ctx.lineTo(cx + 6, by - 40); ctx.lineTo(cx + 10, by - 10); ctx.lineTo(cx + 4, by - 10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = stone(f, 6); circle(ctx, cx, by - 44, 7);                 // hood
      ctx.fillStyle = stone(f, -24); circle(ctx, cx + 1, by - 43, 4.2);          // the shadow of the face
      ctx.strokeStyle = stone(f, 2); ctx.lineWidth = 4; ctx.lineCap = 'round';   // the raised arm
      ctx.beginPath(); ctx.moveTo(cx + 4, by - 34); ctx.lineTo(cx + 13, by - 46); ctx.stroke();
      ctx.lineCap = 'butt';
      ctx.strokeStyle = stone(f, -16); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx + 13, by - 48); ctx.lineTo(cx + 13, by - 52); ctx.stroke();
      ctx.fillStyle = stone(f, -12); ctx.fillRect(cx + 9, by - 54, 8, 2);
      if (lit) {
        const fl = 0.85 + Math.sin(t * 8) * 0.08;
        ctx.fillStyle = `rgba(255,214,130,${fl})`; ctx.fillRect(cx + 10, by - 52, 6, 7);
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(cx + 13, by - 48, 0, cx + 13, by - 48, 16);
        g.addColorStop(0, 'rgba(255,200,120,.45)'); g.addColorStop(1, 'rgba(255,180,90,0)');
        ctx.fillStyle = g; circle(ctx, cx + 13, by - 48, 16);
        ctx.globalCompositeOperation = 'source-over';
      } else { ctx.fillStyle = stone(f, -20); ctx.fillRect(cx + 10, by - 52, 6, 7); }
      ctx.fillStyle = stone(f, -12); ctx.fillRect(cx + 9, by - 45, 8, 1.5);
      ivy(ctx, cx - 9, by - 10, by - 26, f, 0.7, 2);
      tuft(ctx, cx, by, f, 15);
    },
    fountain(ctx, x, y, f, t, tile) {
      const cx = x + 16, by = y + 26, lit = awake(tile);
      shadow(ctx, cx, by + 2, 26, 7, 0.22);
      // the basin: a low round wall
      ctx.fillStyle = stone(f, -10); ctx.beginPath(); ctx.ellipse(cx, by - 4, 24, 9, 0, 0, 6.2832); ctx.fill();
      ctx.fillRect(cx - 24, by - 9, 48, 5);
      ctx.fillStyle = stone(f, 6); ctx.beginPath(); ctx.ellipse(cx, by - 9, 24, 9, 0, 0, 6.2832); ctx.fill();
      if (lit) {   // water has come back
        ctx.fillStyle = G.shade(200, 60, 52, f); ctx.beginPath(); ctx.ellipse(cx, by - 9, 20, 6.5, 0, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = 'rgba(220,240,255,.5)'; ctx.lineWidth = 1;
        for (let i = 0; i < 2; i++) {
          const k = (t * 0.5 + i * 0.5) % 1;
          ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.ellipse(cx, by - 9, 5 + k * 14, (5 + k * 14) * 0.32, 0, 0, 6.2832); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      } else {     // dry and cracked, with a few dead leaves
        ctx.fillStyle = stone(f, -18); ctx.beginPath(); ctx.ellipse(cx, by - 9, 20, 6.5, 0, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = stone(f, -28); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx - 14, by - 10); ctx.lineTo(cx - 8, by - 8); ctx.lineTo(cx - 3, by - 11); ctx.moveTo(cx + 6, by - 6); ctx.lineTo(cx + 12, by - 9); ctx.stroke();
        ctx.fillStyle = G.shade(30, 40, 40, f); circle(ctx, cx - 10, by - 7, 1.5); circle(ctx, cx + 11, by - 11, 1.3);
      }
      // the column and the little bowl on top
      ctx.fillStyle = stone(f); ctx.fillRect(cx - 3, by - 32, 6, 23);
      ctx.fillStyle = stone(f, 10); ctx.fillRect(cx - 2, by - 32, 2, 23);
      ctx.fillStyle = stone(f, -6); ctx.beginPath(); ctx.ellipse(cx, by - 32, 9, 3.5, 0, 0, Math.PI); ctx.fill();
      ctx.fillStyle = stone(f, 8); ctx.beginPath(); ctx.ellipse(cx, by - 33, 9, 3, 0, 0, 6.2832); ctx.fill();
      if (lit) {   // a little jet, falling back in sparkling drops
        ctx.fillStyle = 'rgba(200,235,255,.8)';
        for (let i = 0; i < 10; i++) {
          const k = (t * 0.9 + i / 10) % 1, side = i % 2 ? 1 : -1;
          const px = cx + side * k * 9, py = by - 36 - Math.sin(k * Math.PI) * 9 + k * 5;
          circle(ctx, px, py, 1.1);
        }
        ctx.fillStyle = 'rgba(220,245,255,.9)'; ctx.fillRect(cx - 0.7, by - 44, 1.4, 9);
      }
      if (f > 0.3) {   // flowers growing in the cracks of the rim
        ctx.globalAlpha = Math.min(1, (f - 0.3) / 0.4);
        for (let i = 0; i < 6; i++) {
          const a = i * 1.047 + 0.4, px = cx + Math.cos(a) * 23, py = by - 8 + Math.sin(a) * 8.5;
          ctx.fillStyle = G.shade(110, 45, 34, f); circle(ctx, px, py, 2.4);
          ctx.fillStyle = G.shade((i * 63 + 300) % 360, 75, 74, f); circle(ctx, px + 1, py - 1.5, 1.3);
        }
        ctx.globalAlpha = 1;
      }
    },
    rubble(ctx, x, y, f, t, tile) {
      const cx = x + 16, by = y + 26, v = tile.v;
      shadow(ctx, cx, by + 1, 14, 4);
      const blocks = [[-8, -3, 9, 6, 0.2], [2, -2, 10, 6, -0.15], [-3, -7, 8, 5, 0.1 + v], [7, -6, 6, 4, 0.5]];
      blocks.forEach(([dx, dy, w, h, r], i) => {
        ctx.save(); ctx.translate(cx + dx, by + dy); ctx.rotate(r);
        ctx.fillStyle = stone(f, i % 2 ? -6 : 0); ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.fillStyle = stone(f, 10); ctx.fillRect(-w / 2, -h / 2, w, 1.5);
        ctx.restore();
      });
      tuft(ctx, cx + 3, by + 1, f, 12);
    },
    memory(ctx, x, y, f, t, tile) { slab(ctx, x, y, f, t, false, tile.v * 6); },
  });

  // a woken memory stone (a structure, so it stays awake and saves itself)
  G.STRUCTURE_SPRITES.memorystone = function (ctx, x, y, f, t, st) {
    slab(ctx, x, y, f, t, true, st ? G.hash2(st.tx, st.ty, 3) * 6 : 0);
  };

  // old flagstones on the ground of a ruin (drawn with the floors)
  G.drawPave = function (ctx, x, y, f, tile) {
    const v = tile.v, h = tile.hue;
    ctx.fillStyle = G.shade(36, 12, 44, f, 0.4);   // the old bedding, worn into the ground
    ctx.fillRect(x, y, 32, 32);
    for (let i = 0; i < 4; i++) {
      const a = G.hash2(h + i, 11, 5), b = G.hash2(h, i + 3, 7);
      if (a < 0.16) continue;   // a missing stone, grass showing through
      const sx = x + 1.5 + (i % 2) * 15.5 + (b - 0.5) * 2, sy = y + 1.5 + Math.floor(i / 2) * 15.5 + (a - 0.5) * 2;
      const w = 12 + b * 2, hh = 12 + a * 2;
      ctx.fillStyle = G.shade(34 + b * 8, 14 + a * 6, 56 + a * 10, f);
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(sx, sy, w, hh, 3); else ctx.rect(sx, sy, w, hh);
      ctx.fill();
      ctx.fillStyle = G.shade(36, 14, 70 + a * 6, f, 0.5);   // a lighter worn top edge
      ctx.fillRect(sx + 2, sy + 1, w - 4, 1.5);
    }
    if (v > 0.6) {
      ctx.strokeStyle = G.shade(36, 14, 40, f); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + 4, y + 6 + v * 10); ctx.lineTo(x + 12, y + 10 + v * 8); ctx.lineTo(x + 18, y + 8 + v * 12); ctx.stroke();
    }
    if (f > 0.35 && v < 0.45) {   // moss and a tiny flower in the cracks
      ctx.fillStyle = G.shade(105, 45, 36, f);
      circle(ctx, x + 16, y + 16, 2.2); circle(ctx, x + 14, y + 17.5, 1.6); circle(ctx, x + 17.5, y + 14.5, 1.4);
      if (v < 0.2) { ctx.fillStyle = G.shade(h, 70, 76, f); circle(ctx, x + 16.5, y + 15.5, 1.1); }
    }
  };
})();
