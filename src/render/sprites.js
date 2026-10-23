// How every thing in the world is drawn. All art is drawn with code.
// f = how restored (colourful) the spot is, 0..1. t = time in seconds.
window.G = window.G || {};

// Colour that fades toward grey when the land is not yet restored.
G.shade = function (h, s, l, f, a) {
  const S = s * (0.12 + 0.88 * f), L = l * (0.62 + 0.38 * f);
  return a === undefined
    ? `hsl(${h},${S.toFixed(1)}%,${L.toFixed(1)}%)`
    : `hsla(${h},${S.toFixed(1)}%,${L.toFixed(1)}%,${a})`;
};

function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill(); }
function shadow(ctx, x, y, w, h, a = 0.22) {
  ctx.fillStyle = `rgba(0,0,10,${a})`;
  ctx.beginPath(); ctx.ellipse(x, y, w, h, 0, 0, 6.2832); ctx.fill();
}
G.circle = circle;

// ---------- ground ----------
G.drawGround = function (ctx, tile, x, y, f, t, tx, ty) {
  const T = G.TILE, d = G.TILES[tile.type];
  let l = d.l + (tile.v - 0.5) * 2.4 + (tile.soft - 0.5) * 7;
  if (d.water) l += Math.sin(t * 1.4 + tx * 0.55 + ty * 0.35) * 1.8;
  ctx.fillStyle = G.shade(d.h, d.s, l, f);
  ctx.fillRect(x, y, T, T);

  if (tile.type === 'grass' || tile.type === 'forest') {
    if (tile.v > 0.72) {
      ctx.strokeStyle = G.shade(d.h + 6, d.s + 8, d.l + 9, f);
      ctx.lineWidth = 1.2;
      const ox = x + 6 + tile.v * 14, oy = y + 10 + (tile.v * 97 % 1) * 14;
      const sw = Math.sin(t * 2 + tx) * 1.2;
      ctx.beginPath();
      ctx.moveTo(ox, oy + 6); ctx.lineTo(ox - 2 + sw, oy);
      ctx.moveTo(ox + 3, oy + 6); ctx.lineTo(ox + 4 + sw, oy - 1);
      ctx.moveTo(ox + 6, oy + 6); ctx.lineTo(ox + 9 + sw, oy + 1);
      ctx.stroke();
    }
  } else if (d.water && tile.v > 0.9) {
    const a = Math.max(0, Math.sin(t * 2 + tile.v * 40)) * 0.5 * (0.3 + 0.7 * f);
    ctx.fillStyle = `rgba(220,240,255,${a})`;
    ctx.fillRect(x + tile.v * 20, y + 12 + tile.v * 8, 6, 1.5);
  } else if (tile.type === 'sand' && tile.v > 0.85) {
    ctx.fillStyle = G.shade(35, 30, 52, f);
    ctx.fillRect(x + tile.v * 24, y + tile.v * 20, 2, 2);
  }
};

// ---------- natural objects (drawn with base at bottom-centre of the tile) ----------
G.OBJECT_SPRITES = {
  tree(ctx, x, y, f, t, tile) {
    const cx = x + 16, by = y + 28;
    const sway = Math.sin(t * 1.1 + tile.v * 10) * 1.3;
    const h = 112 + tile.v * 34;
    shadow(ctx, cx, by, 13, 5);
    ctx.fillStyle = G.shade(28, 38, 26, f);
    ctx.fillRect(cx - 3, by - 13, 6, 13);
    ctx.fillStyle = G.shade(h, 45, 20, f); circle(ctx, cx + sway * 0.6, by - 21, 14);
    ctx.fillStyle = G.shade(h, 48, 28, f); circle(ctx, cx - 6 + sway, by - 27, 10); circle(ctx, cx + 6 + sway, by - 25, 9);
    ctx.fillStyle = G.shade(h, 52, 37, f); circle(ctx, cx - 2 + sway * 1.3, by - 33, 7);
  },
  rock(ctx, x, y, f, t, tile) {
    const cx = x + 16, by = y + 26, w = 10 + tile.v * 5;
    shadow(ctx, cx, by + 1, w + 2, 4);
    ctx.fillStyle = G.shade(220, 8, 40, f);
    ctx.beginPath(); ctx.ellipse(cx, by - 5, w, 8, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = G.shade(220, 10, 58, f);
    ctx.beginPath(); ctx.ellipse(cx - 3, by - 8, w * 0.5, 3.5, -0.2, 0, 6.2832); ctx.fill();
  },
  bloom(ctx, x, y, f, t, tile) {
    const cx = x + 16, by = y + 26, sway = Math.sin(t * 1.6 + tile.v * 20) * 1.5;
    ctx.strokeStyle = G.shade(130, 40, 32, f); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(cx, by); ctx.quadraticCurveTo(cx, by - 6, cx + sway, by - 12); ctx.stroke();
    const hue = tile.hue, px = cx + sway, py = by - 13;
    ctx.fillStyle = G.shade(hue, 85, 70, Math.max(f, 0.45));
    for (let i = 0; i < 5; i++) {
      const a = i * 1.2566 + t * 0.4;
      circle(ctx, px + Math.cos(a) * 3.2, py + Math.sin(a) * 3.2, 2.4);
    }
    ctx.fillStyle = '#fff6d8'; circle(ctx, px, py, 1.6);
  },
};

// ---------- structures ----------
G.STRUCTURE_SPRITES = {
  path(ctx, x, y, f, t, st) {
    const v = G.hash2(st.tx, st.ty, 5);
    ctx.fillStyle = G.shade(35, 14, 50, f, 0.85);
    ctx.fillRect(x + 2, y + 2, 28, 28);
    ctx.fillStyle = G.shade(35, 12, 60, f);
    for (let i = 0; i < 4; i++) {
      const a = G.hash2(st.tx * 4 + i, st.ty, 9);
      ctx.beginPath();
      ctx.ellipse(x + 6 + (i % 2) * 15 + a * 4, y + 7 + Math.floor(i / 2) * 15 + v * 3, 6, 4.5, a, 0, 6.2832);
      ctx.fill();
    }
  },
  bridge(ctx, x, y, f) {
    ctx.fillStyle = G.shade(28, 40, 30, f); ctx.fillRect(x, y + 2, 32, 28);
    ctx.fillStyle = G.shade(30, 42, 42, f);
    for (let i = 0; i < 4; i++) ctx.fillRect(x + 1 + i * 8, y + 3, 6, 26);
    ctx.fillStyle = G.shade(28, 40, 22, f); ctx.fillRect(x, y + 2, 32, 2); ctx.fillRect(x, y + 28, 32, 2);
  },
  lantern(ctx, x, y, f, t) {
    const cx = x + 16, by = y + 28;
    shadow(ctx, cx, by, 8, 3);
    ctx.fillStyle = G.shade(28, 30, 24, 1); ctx.fillRect(cx - 2, by - 26, 4, 26);
    ctx.fillRect(cx - 7, by - 3, 14, 3);
    const flick = 0.85 + Math.sin(t * 9) * 0.05 + Math.sin(t * 13.7) * 0.05;
    ctx.fillStyle = `rgba(255,214,130,${flick})`;
    ctx.fillRect(cx - 5, by - 36, 10, 11);
    ctx.fillStyle = G.shade(28, 30, 20, 1); ctx.fillRect(cx - 7, by - 38, 14, 3);
  },
  heart(ctx, x, y, f, t) {
    const cx = x + 16, by = y + 28, p = Math.sin(t * 1.4) * 0.5 + 0.5;
    shadow(ctx, cx, by, 16, 5, 0.3);
    ctx.fillStyle = '#3a3550';
    ctx.beginPath(); ctx.ellipse(cx, by - 3, 15, 6, 0, 0, 6.2832); ctx.fill();
    const fl = 4 * Math.sin(t * 1.2);
    ctx.fillStyle = `hsl(${45 + p * 10},95%,${68 + p * 10}%)`;
    ctx.beginPath();
    ctx.moveTo(cx, by - 48 + fl); ctx.lineTo(cx + 10, by - 26 + fl); ctx.lineTo(cx, by - 8 + fl); ctx.lineTo(cx - 10, by - 26 + fl);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,240,.7)';
    ctx.beginPath(); ctx.moveTo(cx, by - 46 + fl); ctx.lineTo(cx + 4, by - 28 + fl); ctx.lineTo(cx, by - 14 + fl); ctx.closePath(); ctx.fill();
  },
};

// ---------- player ----------
G.drawPlayer = function (ctx, p, sx, sy, t) {
  const b = Math.sin(p.bob) * 2.5;
  shadow(ctx, sx, sy + 8, 8, 3, 0.3);
  // soft body
  const g = ctx.createRadialGradient(sx, sy - 8 + b, 0, sx, sy - 8 + b, 13);
  g.addColorStop(0, 'rgba(255,250,235,1)'); g.addColorStop(0.5, 'rgba(255,226,160,.9)'); g.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.fillStyle = g; circle(ctx, sx, sy - 8 + b, 13);
  // eyes
  ctx.fillStyle = '#3b2c4a';
  circle(ctx, sx - 2.5 + p.facing * 1.5, sy - 9 + b, 1.3);
  circle(ctx, sx + 2.5 + p.facing * 1.5, sy - 9 + b, 1.3);
};
