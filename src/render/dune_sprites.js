// Sprites for the Amber Dunes (Night 25): the dune ground (wind ripples that run
// on from tile to tile, pebbles, glints of quartz), cacti that flower, dune
// grass, soft sand heaps, sunstones (which keep a warm glow even in grey land),
// palms by the oasis, the Amber lantern, the Sand castle, things growing back,
// the sand gecko and the dune tortoise.
// Same rules as sprites.js: f = restoration 0..1, t = time, base at bottom-centre.
window.G = window.G || {};

(function () {
  const circle = G.circle, shadow = G.shadow, T = 32;
  const FLAGS = [350, 12, 40, 160, 198, 268, 318];        // the sand castles' petal flags
  const BLOOMS = [330, 350, 18, 44, 290];                // cactus flowers: pink, rose, coral, gold, violet

  // ---------- ground: ripples carved by the wind ----------
  // Each ripple is a gentle wave in world space (so it runs on across tiles), broken here and there
  // so the sand doesn't look combed: a dark line in the hollow, a light one on the crest. The waves
  // repeat every 8×9 tiles, so they are drawn once into a small atlas in soft see-through tones (they
  // suit grey sand and golden sand alike) and each tile just copies its piece with one drawImage —
  // stroking them per tile was ~4× slower than plain grass.
  const RS = 9, AW = 8, AH = 9;   // px between ripples; atlas size in tiles (AH·32 is a whole number of ripples)
  let atlas = null;
  function makeAtlas() {
    const c = document.createElement('canvas'); c.width = AW * T; c.height = AH * T;
    const x = c.getContext('2d'), lines = AH * T / RS, k1 = 6.2832 * 2 / (AW * T), k2 = 6.2832 / (AW * T);
    x.lineWidth = 1.1; x.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      x.strokeStyle = pass === 0 ? 'rgba(110,70,35,.32)' : 'rgba(255,247,225,.45)';
      const dy = pass === 0 ? 1.1 : -0.6;
      for (let j = 0; j < lines; j++) for (let seg = 0; seg < 4; seg++) {
        if (G.hash2(j, seg, 616) < 0.22) continue;   // a gap in this ripple
        x.beginPath();   // drawn three times, an atlas-height apart, so lines near the top and bottom wrap seamlessly
        for (const wrap of [-AH * T, 0, AH * T]) {
          for (let px = seg * 64; px <= (seg + 1) * 64; px += 4) {
            const py = j * RS + Math.sin(px * k1 + j * 0.9) * 3 + Math.sin(px * k2 + j * 0.37) * 5 + dy + wrap;
            if (px === seg * 64) x.moveTo(px, py); else x.lineTo(px, py);
          }
        }
        x.stroke();
      }
    }
    return c;
  }
  G.drawDuneGround = function (ctx, tile, d, x, y, f, t, tx, ty) {
    if (!atlas) atlas = makeAtlas();
    ctx.drawImage(atlas, (((tx % AW) + AW) % AW) * T, (((ty % AH) + AH) % AH) * T, T, T, x, y, T, T);
    const v = tile.v, u = (v * 17.3) % 1, w = (v * 53.7) % 1;
    if (v < 0.035) {   // a few small pebbles
      ctx.fillStyle = G.shade(24, 22, 46, f);
      circle(ctx, x + 8 + u * 14, y + 18 + w * 8, 1.8); circle(ctx, x + 12 + u * 14, y + 20 + w * 8, 1.2);
    }
    if (u > 0.82) {   // a grain of quartz catching the sun
      const g = Math.max(0, Math.sin(t * 1.2 + tx * 1.9 + ty * 2.7)) ** 8;
      if (g > 0.08) { ctx.fillStyle = `rgba(255,250,230,${(g * (0.3 + 0.6 * f)).toFixed(2)})`; ctx.fillRect(x + w * 26 + 2, y + v * 26 + 2, 1.5, 1.5); }
    }
  };

  // a cactus column: rounded top, ribs, little spines
  function column(ctx, cx, top, by, r, f, h) {
    ctx.fillStyle = G.shade(h, 38, 34, f);
    ctx.beginPath(); ctx.moveTo(cx - r, by); ctx.lineTo(cx - r, top + r); ctx.arc(cx, top + r, r, Math.PI, 0); ctx.lineTo(cx + r, by); ctx.fill();
    ctx.fillStyle = G.shade(h - 4, 36, 26, f);   // the shaded side
    ctx.beginPath(); ctx.moveTo(cx + r * 0.35, by); ctx.lineTo(cx + r * 0.35, top + r * 0.6); ctx.arc(cx, top + r, r, -0.8, 0); ctx.lineTo(cx + r, by); ctx.fill();
    ctx.strokeStyle = G.shade(h + 6, 34, 46, f); ctx.lineWidth = 0.8;   // ribs
    ctx.beginPath(); ctx.moveTo(cx - r * 0.4, by - 1); ctx.lineTo(cx - r * 0.4, top + r * 0.7); ctx.stroke();
    ctx.fillStyle = G.shade(50, 30, 88, f, 0.8);   // spines
    for (let yy = top + r + 2; yy < by - 2; yy += 4) { ctx.fillRect(cx - r - 0.8, yy, 1, 0.8); ctx.fillRect(cx + r - 0.2, yy + 2, 1, 0.8); }
  }

  function bloom(ctx, x, y, hue, f, s) {
    if (f < 0.25) return;
    const a = Math.min(1, (f - 0.25) * 2.5);
    ctx.fillStyle = `hsla(${hue},80%,68%,${a.toFixed(2)})`;
    for (let i = 0; i < 5; i++) { const an = i * 1.2566 - 1.57; circle(ctx, x + Math.cos(an) * 1.8 * s, y + Math.sin(an) * 1.4 * s, 1.5 * s); }
    ctx.fillStyle = `hsla(50,90%,75%,${a.toFixed(2)})`; circle(ctx, x, y, 1 * s);
  }

  // a palm: a curved, ringed trunk and a crown of drooping fronds that sway in the wind
  function palm(ctx, cx, by, hgt, lean, f, sway, v) {
    const topX = cx + lean + sway * 0.6, topY = by - hgt;
    ctx.strokeStyle = G.shade(32, 32, 38, f); ctx.lineWidth = 3.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, by - 1); ctx.quadraticCurveTo(cx + lean * 0.2, by - hgt * 0.55, topX, topY); ctx.stroke();
    ctx.strokeStyle = G.shade(30, 30, 28, f); ctx.lineWidth = 1;   // rings on the trunk
    for (let i = 1; i < 6; i++) {
      const k = i / 6, py = by - 1 - (by - 1 - topY) * k;   // along the curve (near enough)
      const qx = (1 - k) * (1 - k) * cx + 2 * (1 - k) * k * (cx + lean * 0.2) + k * k * topX;
      ctx.beginPath(); ctx.moveTo(qx - 1.6, py); ctx.lineTo(qx + 1.6, py + 0.6); ctx.stroke();
    }
    ctx.lineCap = 'butt';
    // fronds: six long arching leaves
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.62 + sway * 0.03, len = 14 + ((v * (7 + i)) % 1) * 4;
      const ex = topX + Math.cos(a) * len * 1.15, ey = topY + Math.sin(a) * len * 0.45 + len * 0.55;
      const mx = topX + Math.cos(a) * len * 0.6, my = topY + Math.sin(a) * len * 0.5 - 3;
      ctx.strokeStyle = G.shade(120 + v * 20, 40, i % 2 ? 30 : 36, f); ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(topX, topY); ctx.quadraticCurveTo(mx, my, ex, ey); ctx.stroke();
      ctx.strokeStyle = G.shade(110, 40, 48, f); ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(topX, topY); ctx.quadraticCurveTo(mx, my - 0.6, ex, ey - 0.4); ctx.stroke();
    }
    ctx.fillStyle = G.shade(28, 46, 30, f); circle(ctx, topX - 1.5, topY + 2, 1.8); circle(ctx, topX + 1.6, topY + 2.4, 1.8);   // coconuts
  }

  // a sunstone: a rounded amber pebble with a warm light inside
  function stone(ctx, sx, sy, r, g, pulse) {
    const glow = ctx.createRadialGradient(sx, sy - r * 0.3, 0.5, sx, sy, r);
    glow.addColorStop(0, `hsla(46,100%,${(78 + 10 * pulse * g).toFixed(0)}%,1)`);
    glow.addColorStop(0.6, `hsla(32,90%,${(52 + 8 * g).toFixed(0)}%,1)`);
    glow.addColorStop(1, `hsla(22,70%,${(36 + 6 * g).toFixed(0)}%,1)`);
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.ellipse(sx, sy, r, r * 0.78, 0, Math.PI, 0); ctx.lineTo(sx + r, sy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,250,225,.75)'; ctx.fillRect(sx - r * 0.45, sy - r * 0.55, 1.4, 1.1);
  }

  Object.assign(G.OBJECT_SPRITES, {
    cactus(ctx, x, y, f, t, tile) {
      const v = tile.v, cx = x + 16, by = y + 28, h = 120 + ((v * 9.7) % 1) * 22, top = by - 22 - ((v * 13.1) % 1) * 8;
      shadow(ctx, cx + 2, by, 10, 3.2);
      column(ctx, cx, top, by, 4.4, f, h);
      const arms = (v * 31) % 1;
      if (arms > 0.25) {   // a right arm reaching up
        const ay = by - 10 - ((v * 5.1) % 1) * 4;
        ctx.fillStyle = G.shade(h, 38, 32, f); ctx.fillRect(cx + 3, ay - 3, 7, 4);
        column(ctx, cx + 9, ay - 11, ay + 1, 2.8, f, h);
        bloom(ctx, cx + 9, ay - 11, BLOOMS[Math.floor(tile.hue / 72) % 5], f, 0.7);
      }
      if (arms > 0.6) {   // and a left one
        const ay = by - 13 - ((v * 7.9) % 1) * 3;
        ctx.fillStyle = G.shade(h, 38, 32, f); ctx.fillRect(cx - 10, ay - 3, 7, 4);
        column(ctx, cx - 9, ay - 9, ay + 1, 2.8, f, h);
      }
      bloom(ctx, cx, top + 0.5, BLOOMS[tile.hue % 5], f, 1);
    },

    dunegrass(ctx, x, y, f, t, tile) {
      const v = tile.v, cx = x + 16, by = y + 27;
      ctx.lineWidth = 1.1;
      for (let i = 0; i < 7; i++) {
        const dx = (i - 3) * 1.8, h = 8 + ((v * (11 + i * 3)) % 1) * 7, sw = G.sway(t * 1.4, v * 9 + i * 0.7, 1.4);
        ctx.strokeStyle = G.shade(56 + (i % 3) * 8, 34, 48 + (i % 2) * 10, f);
        ctx.beginPath(); ctx.moveTo(cx + dx * 0.6, by); ctx.quadraticCurveTo(cx + dx, by - h * 0.6, cx + dx * 1.7 + sw, by - h); ctx.stroke();
      }
      ctx.fillStyle = G.shade(42, 40, 70, f, 0.8);   // feathery seed heads on two of them
      ctx.beginPath(); ctx.ellipse(cx - 4 + G.sway(t * 1.4, v * 9, 1.4), by - 14, 1, 2.6, -0.3, 0, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 5 + G.sway(t * 1.4, v * 9 + 4, 1.4), by - 12, 1, 2.4, 0.3, 0, 6.2832); ctx.fill();
    },

    sandheap(ctx, x, y, f, t, tile) {
      const v = tile.v, cx = x + 16, by = y + 27, w = 10 + ((v * 7.7) % 1) * 4;
      ctx.fillStyle = G.shade(30, 50, 50, f, 0.45);   // its shaded side
      ctx.beginPath(); ctx.ellipse(cx + 2, by - 0.5, w + 1, 4, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = G.shade(40, 60, 72, f);
      ctx.beginPath(); ctx.moveTo(cx - w, by); ctx.quadraticCurveTo(cx - w * 0.5, by - 9, cx, by - 9); ctx.quadraticCurveTo(cx + w * 0.6, by - 8, cx + w, by); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = G.shade(34, 50, 56, f, 0.6); ctx.lineWidth = 0.9;   // little ripples on its flank
      ctx.beginPath(); ctx.moveTo(cx - w * 0.6, by - 2.5); ctx.quadraticCurveTo(cx, by - 4.5, cx + w * 0.7, by - 2.5); ctx.stroke();
      ctx.fillStyle = G.shade(44, 60, 86, f, 0.9);   // sunlit crest
      ctx.beginPath(); ctx.ellipse(cx - 2, by - 7.5, w * 0.4, 1.3, -0.1, 0, 6.2832); ctx.fill();
    },

    // sunstones kept the day's warmth through the Fading: they glow softly even in grey land
    sunrock(ctx, x, y, f, t, tile) {
      const v = tile.v, cx = x + 16, by = y + 26, g = Math.max(f, 0.45), pulse = 0.5 + 0.5 * Math.sin(t * 1.1 + v * 30);
      const halo = ctx.createRadialGradient(cx, by - 3, 1, cx, by - 3, 18);
      halo.addColorStop(0, `hsla(38,100%,70%,${(0.14 + 0.1 * pulse).toFixed(2)})`); halo.addColorStop(1, 'hsla(38,100%,70%,0)');
      ctx.fillStyle = halo; circle(ctx, cx, by - 3, 18);
      ctx.fillStyle = G.shade(30, 40, 46, f, 0.5);   // a little scoop of sand around them
      ctx.beginPath(); ctx.ellipse(cx, by + 0.5, 11, 3.2, 0, 0, 6.2832); ctx.fill();
      stone(ctx, cx - 5, by, 5.6, g, pulse);
      stone(ctx, cx + 4.5, by + 0.5, 4.4, g, pulse);
      if ((v * 7) % 1 > 0.4) stone(ctx, cx + 0.5, by + 1.8, 3.2, g, pulse);
      ctx.fillStyle = G.shade(40, 60, 70, f);   // sand drifted over their feet
      ctx.beginPath(); ctx.ellipse(cx, by + 1.2, 10, 1.6, 0, 0, 6.2832); ctx.fill();
    },

    palm(ctx, x, y, f, t, tile) {
      const v = tile.v, cx = x + 16, by = y + 28, lean = (((v * 3.7) % 1) - 0.5) * 14;
      shadow(ctx, cx + lean * 0.8, by, 14, 4);
      palm(ctx, cx, by, 30 + ((v * 13.1) % 1) * 8, lean, f, G.sway(t * 0.8, v * 10, 1.4), v);
    },
  });

  Object.assign(G.STRUCTURE_SPRITES, {
    // a lantern of amber glass on a sandstone plinth, a sunstone glowing inside
    amberlantern(ctx, x, y, f, t) {
      const cx = x + 16, by = y + 28, p = 0.5 + 0.5 * Math.sin(t * 1.9) * Math.sin(t * 3.1 + 1);
      const pool = ctx.createRadialGradient(cx, by - 2, 2, cx, by - 2, 26);   // a warm pool of light on the sand
      pool.addColorStop(0, `rgba(255,200,110,${(0.26 + 0.08 * p).toFixed(2)})`); pool.addColorStop(1, 'rgba(255,180,90,0)');
      ctx.fillStyle = pool; ctx.beginPath(); ctx.ellipse(cx, by - 2, 26, 10, 0, 0, 6.2832); ctx.fill();
      shadow(ctx, cx, by, 10, 3.5);
      ctx.fillStyle = '#b98a5c'; ctx.fillRect(cx - 9, by - 8, 18, 7);   // sandstone plinth
      ctx.fillStyle = '#d6aa76'; ctx.fillRect(cx - 9, by - 8, 18, 2);
      ctx.fillStyle = '#9a6e45'; ctx.fillRect(cx - 9, by - 3, 18, 1.2);
      ctx.fillStyle = '#7a5434'; ctx.fillRect(cx - 7, by - 11, 14, 3);   // the lantern's foot
      // the amber glass body
      const top = by - 31;
      const g = ctx.createRadialGradient(cx, by - 19, 1, cx, by - 19, 13);
      g.addColorStop(0, `rgba(255,248,215,${(0.9 + 0.1 * p).toFixed(2)})`); g.addColorStop(0.45, `rgba(255,190,80,${(0.82).toFixed(2)})`);
      g.addColorStop(1, 'rgba(210,110,40,.85)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(cx - 5, by - 11); ctx.quadraticCurveTo(cx - 10, by - 19, cx - 6, top + 4); ctx.lineTo(cx + 6, top + 4);
      ctx.quadraticCurveTo(cx + 10, by - 19, cx + 5, by - 11); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#6f4a2c'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.strokeStyle = 'rgba(120,70,30,.6)'; ctx.lineWidth = 0.8;   // the lead lines of the glass
      ctx.beginPath(); ctx.moveTo(cx, top + 4); ctx.lineTo(cx, by - 11); ctx.moveTo(cx - 8, by - 19); ctx.lineTo(cx + 8, by - 19); ctx.stroke();
      ctx.fillStyle = `hsl(44,100%,${(80 + p * 10).toFixed(0)}%)`; circle(ctx, cx, by - 19, 2.6 + p * 0.6);   // the sunstone heart
      ctx.fillStyle = 'rgba(255,255,240,.6)'; ctx.fillRect(cx - 6, by - 24, 1.4, 7);   // a glint on the glass
      // a little dome cap with a finial
      ctx.fillStyle = '#7a5434';
      ctx.beginPath(); ctx.ellipse(cx, top + 4, 7.5, 3.6, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(cx - 7.5, top + 3, 15, 2);
      ctx.fillStyle = '#e0a85a'; circle(ctx, cx, top - 0.5, 1.6);
    },

    // three little towers, a gate, and a petal flag streaming in the wind
    sandcastle(ctx, x, y, f, t, st) {
      const cx = x + 16, by = y + 28, k = st && st.tx !== undefined ? G.hash2(st.tx, st.ty, 525) : 0.4, hue = FLAGS[Math.floor(k * FLAGS.length)];
      const sand = G.shade(40, 60, 72, f), shade = G.shade(32, 50, 56, f), lite = G.shade(44, 60, 84, f);
      shadow(ctx, cx, by, 14, 3.5);
      ctx.fillStyle = sand; ctx.beginPath(); ctx.ellipse(cx, by - 2, 14, 3.6, 0, 0, 6.2832); ctx.fill();   // its mound
      const tower = (tx, w, h) => {
        ctx.fillStyle = sand; ctx.fillRect(tx - w, by - 3 - h, w * 2, h);
        ctx.fillStyle = shade; ctx.fillRect(tx + w * 0.3, by - 3 - h, w * 0.7, h);
        for (let i = 0; i < 3; i++) { ctx.fillStyle = i === 2 ? shade : sand; ctx.fillRect(tx - w + i * (w * 2 / 3), by - 3 - h - 2.4, w * 0.5, 2.4); }   // crenels
        ctx.fillStyle = lite; ctx.fillRect(tx - w, by - 3 - h, w * 1.2, 0.9);
      };
      ctx.fillStyle = sand; ctx.fillRect(cx - 10, by - 11, 20, 8);   // the wall between
      ctx.fillStyle = shade; ctx.fillRect(cx - 10, by - 5, 20, 2);
      tower(cx - 9, 3.4, 12); tower(cx + 9, 3.4, 11); tower(cx, 4.4, 17);
      ctx.fillStyle = G.shade(28, 40, 32, f);   // the gate
      ctx.beginPath(); ctx.moveTo(cx - 2.4, by - 3); ctx.lineTo(cx - 2.4, by - 7); ctx.arc(cx, by - 7, 2.4, Math.PI, 0); ctx.lineTo(cx + 2.4, by - 3); ctx.fill();
      ctx.fillStyle = G.shade(28, 40, 34, f);   // little windows
      ctx.fillRect(cx - 9.6, by - 11, 1.3, 2); ctx.fillRect(cx + 8.4, by - 10, 1.3, 2); ctx.fillRect(cx - 0.6, by - 15, 1.3, 2.2);
      // a shell pressed into the wall
      ctx.fillStyle = G.shade(10, 60, 84, f); ctx.beginPath(); ctx.ellipse(cx - 5, by - 7, 1.6, 1.2, 0, Math.PI, 0); ctx.fill();
      // the flag: a stick and a petal pennant streaming downwind
      const wd = (G.windDir || 1) * (0.5 + (G.windNow || 0) * 0.8), fl = G.calm ? 0 : Math.sin(t * 6 + k * 7) * 1.2;
      const fx = cx, fy = by - 23;
      ctx.strokeStyle = G.shade(28, 40, 32, f); ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(fx, by - 22); ctx.lineTo(fx, fy - 7); ctx.stroke();
      ctx.fillStyle = G.shade(hue, 75, 62, f);
      ctx.beginPath(); ctx.moveTo(fx, fy - 7); ctx.quadraticCurveTo(fx + wd * 4, fy - 6.5 + fl, fx + wd * 8, fy - 5 + fl); ctx.quadraticCurveTo(fx + wd * 4, fy - 3.5 + fl * 0.5, fx, fy - 3.5); ctx.fill();
    },
  });

  // growing back after they were gathered (p = 0 .. 1)
  Object.assign(G.REGROW_SPRITES, {
    cactus(ctx, x, y, f, t, tile, p) {
      const cx = x + 16, by = y + 28;
      column(ctx, cx, by - 4 - p * 12, by, 2 + p * 2, f, 128);
    },
    dunegrass(ctx, x, y, f, t, tile, p) {
      const cx = x + 16, by = y + 27;
      ctx.strokeStyle = G.shade(60, 34, 50, f); ctx.lineWidth = 1;
      ctx.beginPath(); for (const dx of [-2, 0, 2]) { ctx.moveTo(cx + dx, by); ctx.lineTo(cx + dx * 1.6, by - 2 - p * 6); } ctx.stroke();
    },
    sandheap(ctx, x, y, f, t, tile, p) {
      const cx = x + 16, by = y + 27, w = 4 + p * 8;
      ctx.fillStyle = G.shade(40, 60, 72, f);
      ctx.beginPath(); ctx.ellipse(cx, by - 1, w, 1.5 + p * 4, 0, 3.1, 6.33); ctx.fill();
    },
    sunrock(ctx, x, y, f, t, tile, p) {
      const cx = x + 16, by = y + 26;
      ctx.fillStyle = G.shade(30, 40, 46, f, 0.5);
      ctx.beginPath(); ctx.ellipse(cx, by + 0.5, 8, 2.6, 0, 0, 6.2832); ctx.fill();
      stone(ctx, cx, by + 1, 1 + p * 3, Math.max(f, 0.45) * p, 0.5);
    },
    palm(ctx, x, y, f, t, tile, p) {
      const cx = x + 16, by = y + 28;
      shadow(ctx, cx, by, 5 + p * 6, 2.5, 0.16);
      ctx.fillStyle = G.shade(32, 30, 34, f); ctx.fillRect(cx - 3, by - 4, 6, 4);   // a stump …
      if (p > 0.3) palm(ctx, cx + 8, by + 1, 6 + p * 10, 0, f, 0, 0.4);             // … and a little palm beside it
    },
  });

  // ---------- the sand gecko: a long slim lizard with a curly tail; it does push-ups ----------
  G.CREATURE_SPRITES.gecko = function (ctx, c, sx, sy, t) {
    const f = c.face, h = c.hue, run = c.state === 'dash', bob = c.bob > 0 ? Math.abs(Math.sin(c.bob * 16)) * 2 : 0;
    const skin = `hsl(${h},55%,58%)`, dark = `hsl(${h},50%,40%)`;
    G.shadow(ctx, sx, sy + 0.5, 9, 2, 0.18);
    ctx.save(); ctx.translate(sx, sy - 2);
    if (run) ctx.rotate(f * (c.ang || 0) * 0.5);
    const lg = run ? Math.sin(c.legs) * 2.2 : 0;
    ctx.strokeStyle = dark; ctx.lineWidth = 1.2;   // four splayed legs
    ctx.beginPath();
    ctx.moveTo(f * 3, 0); ctx.lineTo(f * (5 + lg), 2.6); ctx.moveTo(f * 3, 0); ctx.lineTo(f * (5 - lg), -2.6 + bob * 0.3);
    ctx.moveTo(-f * 3, 0); ctx.lineTo(-f * (5 - lg), 2.6); ctx.moveTo(-f * 3, 0); ctx.lineTo(-f * (5 + lg), -2.6);
    ctx.stroke();
    ctx.strokeStyle = skin; ctx.lineWidth = 2;   // the tail, curling
    const tw = Math.sin(t * 3 + (c.seed || 0) * 9) * (run ? 2.5 : 1);
    ctx.beginPath(); ctx.moveTo(-f * 4, 0); ctx.quadraticCurveTo(-f * 10, 2 + tw, -f * 13, -1 - tw * 0.5); ctx.stroke();
    ctx.fillStyle = skin;   // body and head (raised for a push-up)
    ctx.beginPath(); ctx.ellipse(0, -bob * 0.5, 5.2, 2.1, 0, 0, 6.2832); ctx.fill();
    ctx.beginPath(); ctx.ellipse(f * 6, -0.6 - bob, 2.6, 1.8, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = dark; circle(ctx, -f * 1.5, -bob * 0.5 - 0.4, 0.7); circle(ctx, f * 1.5, -bob * 0.5, 0.6);   // spots
    ctx.fillStyle = '#1c1a22'; circle(ctx, f * 6.8, -1.3 - bob, 0.75);
    ctx.fillStyle = '#fff'; circle(ctx, f * 7, -1.5 - bob, 0.3);
    ctx.restore();
    if (run && !G.calm) {   // a little spray of sand behind it
      ctx.fillStyle = 'rgba(235,205,150,.55)';
      for (let i = 0; i < 3; i++) circle(ctx, sx - f * (9 + i * 2.5), sy - 1 - (i % 2) * 1.5, 0.9);
    }
  };

  // ---------- the dune tortoise: a domed shell with a pattern of plates; it tucks its head in ----------
  G.CREATURE_SPRITES.tortoise = function (ctx, c, sx, sy, t) {
    const f = c.face, h = c.hue, out = 1 - (c.hide || 0), step = Math.sin((c.ph || 0) * 4) * out;
    G.shadow(ctx, sx, sy + 1, 10, 2.8, 0.22);
    const skin = `hsl(${h + 8},28%,52%)`;
    ctx.fillStyle = skin;   // stubby legs
    for (const [lx, s] of [[-5, 1], [-1.5, -1], [2.5, 1], [5.5, -1]]) ctx.fillRect(sx + f * lx - 1.2 + step * s * 0.6, sy - 2.5, 2.4, 2.6 * (0.4 + 0.6 * out));
    if (out > 0.1) {   // the head on its neck
      const hx = sx + f * (7 + 3 * out), hy = sy - 4.5 - Math.sin((c.ph || 0) * 0.7) * 0.6 * out;
      ctx.beginPath(); ctx.ellipse(sx + f * 6.5, sy - 4, 2.2 * out + 0.5, 1.6, 0, 0, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.ellipse(hx, hy, 2.6, 2, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = '#1c1a22'; circle(ctx, hx + f * 1, hy - 0.5, 0.6);
    }
    // the shell
    ctx.fillStyle = `hsl(${h},42%,36%)`;
    ctx.beginPath(); ctx.ellipse(sx, sy - 3, 8.5, 7, 0, Math.PI, 0); ctx.lineTo(sx + 8.5, sy - 2.2); ctx.lineTo(sx - 8.5, sy - 2.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = `hsl(${h},36%,46%)`;   // plates
    for (const [px, py, r] of [[0, -7, 2.6], [-4.4, -4.6, 2], [4.4, -4.6, 2], [0, -3.4, 1.6]]) {
      ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * 1.047; ctx.lineTo(sx + px + Math.cos(a) * r, sy + py + Math.sin(a) * r * 0.8); } ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = `hsl(${h + 10},50%,62%)`; ctx.fillRect(sx - 3, sy - 9.4, 4, 0.9);   // sun on the shell's top
    ctx.fillStyle = `hsl(${h},40%,28%)`; ctx.fillRect(sx - 8.5, sy - 2.6, 17, 1.4);       // its rim
  };
})();
