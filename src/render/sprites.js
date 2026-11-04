// How every thing in the world is drawn. All art is drawn with code.
// f = how restored (colourful) the spot is, 0..1. t = time in seconds.
window.G = window.G || {};

// Colour that fades toward grey when the land is not yet restored.
// Solid colours are remembered (the ground asks for the same few thousand
// every frame), which saves building a new string for each tile.
const shadeCache = new Map();
G.shade = function (h, s, l, f, a) {
  const S = s * (0.12 + 0.88 * f), L = l * (0.62 + 0.38 * f);
  if (a !== undefined) return `hsla(${h},${S.toFixed(1)}%,${L.toFixed(1)}%,${a})`;
  const si = Math.round(S * 10), li = Math.round(L * 10);
  const k = (Math.round(h * 10) * 1024 + si) * 1024 + li;
  let c = shadeCache.get(k);
  if (c === undefined) {
    if (shadeCache.size > 30000) shadeCache.clear();
    c = `hsl(${h},${(si / 10).toFixed(1)}%,${(li / 10).toFixed(1)}%)`;
    shadeCache.set(k, c);
  }
  return c;
};

function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill(); }
function shadow(ctx, x, y, w, h, a = 0.22) {
  ctx.fillStyle = `rgba(0,0,10,${a})`;
  ctx.beginPath(); ctx.ellipse(x, y, w, h, 0, 0, 6.2832); ctx.fill();
}
G.circle = circle;
G.shadow = shadow;

// How far a plant leans: its own gentle sway, plus the wind (G.windNow 0..1,
// set by world/weather.js) bending it downwind and making it shake faster.
G.sway = function (t, seed, amp) {
  const w = G.windNow || 0, dir = G.windDir || 1;
  return Math.sin(t + seed) * amp * (1 + w * 1.2) + Math.sin(t * 2.7 + seed * 1.3) * amp * w * 0.7 + dir * w * amp * 2.2;
};

// ---------- ground ----------
// fc = optional restoration at the four corners [top-left, top-right,
// bottom-left, bottom-right]: where they differ (the edge of a lantern's
// colour) the tile is filled in small blended squares so colour fades softly.
// the lightness of a ground tile (its own variation, and water shimmering)
// d = the ground's colour this season (G.SEASON_NOW.tiles, see world/seasons.js)
function groundL(tile, d, t, tx, ty) {
  let l = d.l + (tile.v - 0.5) * 2.4 + (tile.soft - 0.5) * 7;
  if (d.water) l += Math.sin(t * 1.4 + tx * 0.55 + ty * 0.35) * 1.8;
  return l;
}

// The colour of a piece of ground. Under snow, faded land keeps a thinner,
// patchier cover than coloured land, so you can still see where the colour reaches.
function groundFill(d, l, f) {
  if (!d.snow) return G.shade(d.h, d.s, l, f);
  const k = Math.round(d.snow * (0.35 + 0.65 * f) * 20) / 20, b = d.base, sn = G.SNOW, dl = l - d.l;
  return G.shade(b[0] + (sn.h - b[0]) * k, b[1] + (sn.s - b[1]) * k, b[2] + (sn.l - b[2]) * k + dl, f);
}

// Rounded corners where two grounds meet. nb = neighbour tiles [up, right,
// down, left]. A corner whose two neighbours are both lower ground is rounded
// off (painted with the lower ground); a corner tucked between two higher
// grounds gets a little fillet of the higher one. Together: curving shores.
const CORNERS = [[0, 3, 0, 0, 1, 1], [0, 1, 1, 0, -1, 1], [2, 3, 0, 1, 1, -1], [2, 1, 1, 1, -1, -1]];  // [n1, n2, ox, oy, sx, sy]
const NB_OFF = [[0, -1], [1, 0], [0, 1], [-1, 0]];
function roundCorners(ctx, d, x, y, f, t, tx, ty, fc, nb) {
  const T = G.TILE, R = 11, r = d.rank;
  for (let c = 0; c < 4; c++) {
    const [i1, i2, ox, oy, sx, sy] = CORNERS[c];
    const a = nb[i1], b = nb[i2], da = G.TILES[a.type], db = G.TILES[b.type], tiles = G.SEASON_NOW.tiles;
    let pick = -1;
    if (da.rank < r && db.rank < r) pick = da.rank >= db.rank ? i1 : i2;         // sticking out: round it off
    else if (da.rank > r && db.rank > r) pick = da.rank <= db.rank ? i1 : i2;    // tucked in: fill the nook
    if (pick < 0) continue;
    const n = nb[pick], dn = tiles[n.type], ntx = tx + NB_OFF[pick][0], nty = ty + NB_OFF[pick][1];
    const cx = x + ox * T, cy = y + oy * T;
    ctx.fillStyle = groundFill(dn, groundL(n, dn, t, ntx, nty), fc ? fc[c] : f);
    ctx.beginPath();
    ctx.moveTo(cx + sx * R, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + sy * R);
    ctx.arcTo(cx, cy, cx + sx * R, cy, R);
    ctx.closePath(); ctx.fill();
  }
}

G.drawGround = function (ctx, tile, x, y, f, t, tx, ty, fc, nb) {
  const T = G.TILE, d = G.SEASON_NOW.tiles[tile.type];
  const l = groundL(tile, d, t, tx, ty);
  if (fc && Math.max(fc[0], fc[1], fc[2], fc[3]) - Math.min(fc[0], fc[1], fc[2], fc[3]) > 0.03) {
    const N = 4, S = T / N;
    for (let j = 0; j < N; j++) {
      const v = (j + 0.5) / N, fl = fc[0] + (fc[2] - fc[0]) * v, fr = fc[1] + (fc[3] - fc[1]) * v;
      for (let i = 0; i < N; i++) {
        ctx.fillStyle = groundFill(d, l, fl + (fr - fl) * (i + 0.5) / N);
        ctx.fillRect(x + i * S, y + j * S, S + 0.5, S + 0.5);
      }
    }
  } else {
    ctx.fillStyle = groundFill(d, l, f);
    ctx.fillRect(x, y, T, T);
  }
  if (nb) roundCorners(ctx, d, x, y, f, t, tx, ty, fc, nb);

  if (d.snow > 0.05) drawSnowCover(ctx, tile, d, x, y, f, t, tx, ty);
  if (tile.type === 'grass' || tile.type === 'forest') {
    if (tile.v > G.SEASON_NOW.tufts && d.snow < 0.6) {   // more tufts in summer
      ctx.strokeStyle = G.shade(d.h + 6, d.s + 8, d.l + 9, f);
      ctx.lineWidth = 1.2;
      const ox = x + 4 + (tile.v * 7.7 % 1) * 18, oy = y + 8 + (tile.v * 97 % 1) * 16;
      const sw = G.sway(t * 2, tx, 1.2);
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

// snow: soft drifts in a lighter white, blue hollows, and a glint now and then
function drawSnowCover(ctx, tile, d, x, y, f, t, tx, ty) {
  const a = d.snow * (0.3 + 0.7 * f), v = tile.v, w = (v * 53.7) % 1;
  ctx.fillStyle = G.shade(d.h, d.s * 0.6, Math.min(97, d.l + 6), f, (0.55 * a).toFixed(2));
  ctx.beginPath(); ctx.ellipse(x + 8 + w * 16, y + 9 + v * 14, 9 + w * 5, 3.2, 0, 0, 6.2832); ctx.fill();
  if (w > 0.5) {
    ctx.fillStyle = G.shade(d.h + 6, d.s + 14, d.l - 12, f, (0.28 * a).toFixed(2));
    ctx.beginPath(); ctx.ellipse(x + 20 - w * 10, y + 24 - v * 6, 6, 2, 0, 0, 6.2832); ctx.fill();
  }
  if (v > 0.8 && f > 0.4) {   // sparkle in the sun
    const g = Math.max(0, Math.sin(t * 1.3 + tx * 1.7 + ty * 2.3)) ** 6;
    if (g > 0.05) { ctx.fillStyle = `rgba(255,255,255,${(g * a).toFixed(2)})`; ctx.fillRect(x + w * 26, y + v * 26, 1.6, 1.6); }
  }
}

// ---------- natural objects (drawn with base at bottom-centre of the tile) ----------
G.OBJECT_SPRITES = {
  // Trees follow the seasons (G.SEASON_NOW): blossom in spring, gold and red in
  // autumn, bare branches with snow in winter. About a third are evergreens that
  // keep their (bluer) needles all year and just wear a cap of snow.
  tree(ctx, x, y, f, t, tile) {
    const S = G.SEASON_NOW, v = tile.v, cx = x + 16, by = y + 28;
    const sway = G.sway(t * 1.1, v * 10, 1.3);
    const ever = (v * 7.31) % 1 < 0.33, bare = ever ? 0 : S.bare, leaf = 1 - bare;
    let h = 112 + v * 34, ds = 0, dl = S.leafL;
    if (ever) { h += 14; ds = -6; dl = S.leafL * 0.4 - 3; }
    else if (S.autumn > 0) {
      const ah = G.AUTUMN_HUES[Math.floor(((v * 13.7) % 1) * G.AUTUMN_HUES.length)];
      h += (ah - h) * S.autumn; ds = 22 * S.autumn; dl += 6 * S.autumn;
    }
    shadow(ctx, cx, by, 13 * (0.55 + 0.45 * leaf), 5);
    ctx.fillStyle = G.shade(28, 38, 26, f);
    ctx.fillRect(cx - 3, by - 13, 6, 13);
    if (bare > 0.02) {   // the branches show through as the leaves fall
      ctx.strokeStyle = G.shade(26, 30, 24, f); ctx.lineCap = 'round';
      ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(cx, by - 12); ctx.lineTo(cx + sway * 0.4, by - 34); ctx.stroke();
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx, by - 16); ctx.lineTo(cx - 10 + sway * 0.6, by - 27);
      ctx.moveTo(cx + 0.5, by - 20); ctx.lineTo(cx + 10 + sway * 0.6, by - 30);
      ctx.moveTo(cx + sway * 0.2, by - 27); ctx.lineTo(cx - 6 + sway, by - 38);
      ctx.moveTo(cx + sway * 0.3, by - 30); ctx.lineTo(cx + 5 + sway, by - 40);
      ctx.stroke();
      ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(cx - 6 + sway * 0.5, by - 24); ctx.lineTo(cx - 12 + sway * 0.7, by - 22);
      ctx.moveTo(cx + 6 + sway * 0.5, by - 26); ctx.lineTo(cx + 12 + sway * 0.7, by - 26);
      ctx.stroke(); ctx.lineCap = 'butt';
      if (S.snow > 0.05) {   // a line of snow along the branches
        ctx.fillStyle = G.shade(212, 30, 94, f, (0.85 * S.snow * bare).toFixed(2));
        for (const [bx, bh] of [[-9, 28], [9, 31], [-5, 38], [4, 40], [0, 34]]) {
          ctx.beginPath(); ctx.ellipse(cx + bx + sway * 0.8, by - bh, 2.6, 1.2, 0, 0, 6.2832); ctx.fill();
        }
      }
    }
    if (leaf > 0.02) {
      ctx.globalAlpha = leaf;
      ctx.fillStyle = G.shade(h, 45 + ds, 20 + dl, f); circle(ctx, cx + sway * 0.6, by - 21, 14);
      ctx.fillStyle = G.shade(h, 48 + ds, 28 + dl, f); circle(ctx, cx - 6 + sway, by - 27, 10); circle(ctx, cx + 6 + sway, by - 25, 9);
      ctx.fillStyle = G.shade(h, 52 + ds, 37 + dl, f); circle(ctx, cx - 2 + sway * 1.3, by - 33, 7);
      if (!ever && S.blossom > 0.02 && (v * 5.3) % 1 < 0.6) {   // spring blossom
        ctx.globalAlpha = leaf * S.blossom;
        const bh = (v * 31) % 1 < 0.5 ? 340 : 0;
        for (let i = 0; i < 9; i++) {
          const a = i * 2.4 + v * 9, r = 3 + (i * 3.7 % 9);
          ctx.fillStyle = G.shade(bh, 75, i % 3 ? 84 : 92, Math.max(f, 0.3));
          circle(ctx, cx + Math.cos(a) * r + sway * 1.1, by - 27 + Math.sin(a) * r * 0.8, i % 3 ? 2.1 : 1.6);
        }
      }
      if (ever && S.snow > 0.05) {   // evergreens wear a cap of snow
        ctx.globalAlpha = S.snow;
        ctx.fillStyle = G.shade(212, 30, 94, f);
        ctx.beginPath(); ctx.ellipse(cx - 2 + sway * 1.3, by - 37, 6, 3, 0, 3.1, 6.3); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx - 6 + sway, by - 33, 7, 2.6, 0, 3.1, 6.3); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 7 + sway, by - 30, 6, 2.4, 0, 3.1, 6.3); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  },
  rock(ctx, x, y, f, t, tile) {
    const cx = x + 16, by = y + 26, w = 10 + tile.v * 5;
    shadow(ctx, cx, by + 1, w + 2, 4);
    ctx.fillStyle = G.shade(220, 8, 40, f);
    ctx.beginPath(); ctx.ellipse(cx, by - 5, w, 8, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = G.shade(220, 10, 58, f);
    ctx.beginPath(); ctx.ellipse(cx - 3, by - 8, w * 0.5, 3.5, -0.2, 0, 6.2832); ctx.fill();
    const sn = G.SEASON_NOW.snow;
    if (sn > 0.05) {   // a cap of snow
      ctx.fillStyle = G.shade(212, 30, 94, f, sn.toFixed(2));
      ctx.beginPath(); ctx.ellipse(cx, by - 9, w * 0.85, 4.2, 0, 3.05, 6.37); ctx.fill();
    }
  },
  bloom(ctx, x, y, f, t, tile) {
    const cx = x + 16, by = y + 26, sway = G.sway(t * 1.6, tile.v * 20, 1.5);
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
