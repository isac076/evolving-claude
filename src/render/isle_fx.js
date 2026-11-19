// G.IsleFX — the glowing tide of the Far Isles (Night 27). Drawn after the
// lighting, so it shines in the dark. On dark nights around an island
// (state.isles.tide, worked out by G.IslePlay), every little wave that runs up
// the coral sand lights up blue: a soft glowing line along the shore that swells
// and fades with the waves, with sparks of light in it; the lagoon twinkles with
// tiny lights, and the boat's wake glows where it stirs the water.
// Nothing here is saved.
window.G = window.G || {};

G.IsleFX = {
  // the shore edges of a lagoon tile: which sides touch the sand
  SIDES: [[0, -1, 0, 0, 1, 0], [1, 0, 1, 0, 0, 1], [0, 1, 0, 1, 1, 0], [-1, 0, 0, 0, 0, 1]],   // [dx, dy, edge x0, y0, along x, y]

  // a soft blue glow, drawn once
  puffImg: null,
  puff() {
    if (this.puffImg) return this.puffImg;
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const x = c.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(170,245,255,.75)'); g.addColorStop(0.35, 'rgba(70,200,255,.35)'); g.addColorStop(1, 'rgba(40,150,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 32, 32);
    return (this.puffImg = c);
  },

  sky(ctx, state, camX, camY, W, H, dt, t, dark) {
    const is = state.isles, w = state.world;
    if (!is || !w || is.tide < 0.02) return;
    const T = G.TILE, k = is.tide, calm = G.calm;
    const tx0 = Math.floor(camX / T) - 1, ty0 = Math.floor(camY / T) - 1, tx1 = Math.ceil((camX + W) / T), ty1 = Math.ceil((camY + H) / T);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const tile = w.tileAt(tx, ty);
      if (tile.type !== 'lagoon') continue;
      const x = tx * T - camX, y = ty * T - camY, v = tile.v;
      // the lagoon twinkles: one tiny light per tile, coming and going
      const tw = calm ? 0.5 : Math.max(0, Math.sin(t * (0.8 + v) + v * 40));
      if (tw > 0.3) {
        ctx.fillStyle = `rgba(120,230,255,${(k * 0.5 * tw).toFixed(3)})`;
        G.circle(ctx, x + ((v * 31) % 1) * 28 + 2, y + ((v * 57) % 1) * 28 + 2, 0.9 + tw * 0.6);
      }
      for (const [dx, dy, ex, ey, ax, ay] of this.SIDES) {
        if (w.tileAt(tx + dx, ty + dy).type !== 'strand') continue;
        // the wave: runs up the sand, glows brightest as it breaks, then slides back
        const ph = calm ? 0.6 : (t * 0.32 + G.hash2(tx, ty, 404) * 0.5 + (tx + ty) * 0.04) % 1;
        const swell = Math.sin(ph * Math.PI), a = k * (0.25 + 0.75 * swell);
        const into = 3 + (1 - swell) * 6;   // how far out from the sand the glowing line sits
        const lx = x + ex * T - dx * into, ly = y + ey * T - dy * into;
        // soft puffs of blue light along the wave (a sprite drawn once — no straight lines, so the corners stay soft)
        for (let i = 0; i < 3; i++) {
          const h = G.hash2(tx * 3 + i, ty * 3 + dx + 2 * dy, 77), along = 5 + i * 11 + (h - 0.5) * 6, wob = (h * 13 % 1) * 3;
          const r = 9 + h * 5;
          ctx.globalAlpha = Math.min(1, a * (0.55 + 0.45 * h));
          ctx.drawImage(this.puff(), lx + ax * along - dx * wob - r, ly + ay * along - dy * wob - r * 0.7, r * 2, r * 1.4);
        }
        ctx.globalAlpha = 1;
        for (let i = 0; i < G.ISLES.tide.sparks; i++) {   // sparks of light in the breaking wave
          const h = G.hash2(tx * 4 + dx + 1, ty * 4 + dy + 1, i + 9), sp = calm ? 0.6 : Math.max(0, Math.sin(t * 3 + h * 30));
          if (sp < 0.4) continue;
          const along = 3 + h * (T - 6), off = (h * 7 % 1) * 3;
          ctx.fillStyle = `rgba(210,250,255,${(a * sp * 0.8).toFixed(3)})`;
          G.circle(ctx, lx + ax * along - dx * off, ly + ay * along - dy * off, 0.8 + sp * 0.7);
        }
      }
    }
    // the boat's wake glows where it stirs the water
    const sail = state.sail;
    if (sail && sail.wake.length) {
      for (const p of sail.wake) {
        const age = 1 - p.life, spread = (2.5 + age * 24) * p.s, back = age * 8, ca = Math.cos(p.a), sa = Math.sin(p.a);
        const a = p.life * k * 0.7;
        if (a < 0.02) continue;
        for (const side of [-1, 1]) {
          const x = p.x - camX - ca * back - sa * spread * side, y = p.y - camY - sa * back * 0.5 + ca * spread * side * 0.5;
          ctx.fillStyle = `rgba(110,225,255,${(a * 0.35).toFixed(3)})`; G.circle(ctx, x, y, 3.2);
          ctx.fillStyle = `rgba(210,250,255,${(a * 0.8).toFixed(3)})`; G.circle(ctx, x, y, 1.1);
        }
      }
    }
    ctx.lineCap = 'butt';
    ctx.globalCompositeOperation = 'source-over';
  },
};
