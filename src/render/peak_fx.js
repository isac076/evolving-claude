// G.PeakFX — the air of the Snowy Peaks (Night 22). Nothing here is saved.
//  - air(): before the lighting — light snow drifting down over the peaks, and
//    little puffs of frosty breath from the spirit when it stands on snow.
//  - sky(): after the lighting, so it shines in the dark — glints of frost
//    twinkling in the sunlit air by day, and on clear nights the northern
//    lights: curtains of green, teal and violet light rippling across the sky.
// How strong they are comes from state.peaks (G.PeakPlay): `near` = how much of
// the land around is snowfield, `sky` = how strongly the northern lights want to shine.
window.G = window.G || {};

G.PeakFX = {
  flakes: [], puffs: [], glints: [],
  aurora: 0, breathT: 0, strips: null,
  HUES: [150, 172, 288],

  // a tall vertical stroke of light for one curtain: bright along its lower edge, fading up into the dark
  strip(h) {
    const c = document.createElement('canvas'); c.width = 1; c.height = 96;
    const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 96);
    g.addColorStop(0, `hsla(${h + 30},90%,60%,0)`); g.addColorStop(0.45, `hsla(${h + 15},90%,60%,.22)`);
    g.addColorStop(0.85, `hsla(${h},100%,62%,.6)`); g.addColorStop(0.95, `hsla(${h - 10},100%,80%,.8)`); g.addColorStop(1, `hsla(${h},100%,70%,0)`);
    x.fillStyle = g; x.fillRect(0, 0, 1, 96);
    return c;
  },

  air(ctx, state, camX, camY, W, H, dt, t) {
    const pk = state.peaks;
    if (!pk || !state.world) return;
    const near = pk.near, wind = G.windNow || 0, dir = G.windDir || 1;
    // drifting snow: more the more of the view is snowfield
    const want = Math.round(G.PEAKS.flakes * G.clamp(near * 1.4, 0, 1) * (G.calm ? 0.35 : 1));
    const list = this.flakes;
    while (list.length < want) list.push({ x: G.rand(0, W), y: G.rand(-20, H), z: G.rand(0.5, 1.3), ph: Math.random() * 6.3, a: 0 });
    if (list.length > want) list.length = Math.max(want, list.length - Math.ceil(dt * 60));
    if (list.length) {
      const path = new Path2D();
      for (const f of list) {
        f.ph += dt * (0.7 + f.z); f.a = Math.min(1, f.a + dt);
        f.y += (14 + 22 * f.z) * dt;
        f.x += (Math.sin(f.ph) * 12 * f.z + dir * (6 + wind * 90) * f.z) * dt;
        if (f.y > H + 10) { f.y = -10; f.x = G.rand(0, W); }
        if (f.x > W + 20) f.x -= W + 40; else if (f.x < -20) f.x += W + 40;
        const r = (0.7 + f.z * 1.1) * f.a;
        path.moveTo(f.x + r, f.y); path.arc(f.x, f.y, r, 0, 6.2832);
      }
      ctx.fillStyle = 'rgba(240,246,255,.75)'; ctx.fill(path);
    }
    // frosty breath: a little white puff now and then while standing on snow
    const p = state.player, w = state.world;
    if (p && dt > 0 && w.tileAt(p.tx, p.ty).type === 'frost' && (this.breathT -= dt) <= 0) {
      this.breathT = G.rand(1.4, 2.2);
      const fc = p.facing || 1;
      for (let i = 0; i < 3; i++) this.puffs.push({ x: p.x + fc * (5 + i * 2), y: p.y - 16 + G.rand(-1, 1), vx: fc * G.rand(6, 12) + dir * wind * 10,
        vy: -G.rand(2, 6), r: 1.6 + i * 0.6, life: 0, max: G.rand(1, 1.6) });
    }
    for (const q of this.puffs) { q.life += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.r += dt * 3; }
    this.puffs = this.puffs.filter(q => q.life < q.max);
    for (const q of this.puffs) {
      ctx.fillStyle = `rgba(240,248,255,${(0.45 * (1 - q.life / q.max)).toFixed(3)})`;
      G.circle(ctx, q.x - camX, q.y - camY, q.r);
    }
  },

  sky(ctx, state, camX, camY, W, H, dt, t, dark) {
    const pk = state.peaks;
    if (!pk) return;
    const P = G.PEAKS, cloud = state.weather ? state.weather.v.cloud : 0;
    ctx.globalCompositeOperation = 'lighter';
    // glints of frost in the air on bright days (diamond dust)
    const want = Math.round(P.glints * G.clamp(pk.near * 1.5, 0, 1) * (1 - dark) * (1 - cloud));
    if (this.glints.length < want && Math.random() < 0.5) this.glints.push({ x: G.rand(0, W), y: G.rand(0, H), life: 0, max: G.rand(0.6, 1.4), s: G.rand(1.5, 3.5) });
    for (const g of this.glints) { g.life += dt; g.y += dt * 6; }
    this.glints = this.glints.filter(g => g.life < g.max);
    for (const g of this.glints) {
      const a = Math.sin(g.life / g.max * Math.PI), s = g.s * a;
      ctx.fillStyle = `rgba(255,255,255,${(0.8 * a).toFixed(2)})`;
      ctx.fillRect(g.x - s, g.y - 0.4, s * 2, 0.8); ctx.fillRect(g.x - 0.4, g.y - s, 0.8, s * 2);
    }
    // the northern lights
    const target = pk.sky || 0;
    this.aurora += (target - this.aurora) * Math.min(1, dt * P.aurora.fade);
    if (this.aurora > 0.01) this.drawAurora(ctx, camX, W, H, t, this.aurora);
    ctx.globalCompositeOperation = 'source-over';
  },

  drawAurora(ctx, camX, W, H, t, a) {
    if (!this.strips) this.strips = this.HUES.map(h => this.strip(h));
    const tt = t * (G.calm ? 0.3 : 1), col = 7;
    // a faint green wash over the top of the sky
    const wash = ctx.createLinearGradient(0, 0, 0, H * 0.6);
    wash.addColorStop(0, `hsla(160,80%,45%,${(0.12 * a).toFixed(3)})`); wash.addColorStop(1, 'hsla(160,80%,45%,0)');
    ctx.fillStyle = wash; ctx.fillRect(0, 0, W, H * 0.6);
    for (let i = 0; i < G.PEAKS.aurora.ribbons; i++) {
      const img = this.strips[i % this.strips.length], y0 = H * (0.14 + 0.11 * i), drift = camX * 0.04;
      for (let x = -col; x < W + col; x += col) {
        const ph = (x + drift) / W;
        const yb = y0 + Math.sin(ph * 5 + tt * 0.22 + i * 2.1) * H * 0.06 + Math.sin(ph * 12 - tt * 0.37 + i) * H * 0.018;
        const h = H * (0.13 + 0.06 * Math.sin(ph * 7 + tt * 0.5 + i * 1.3));
        const ray = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(ph * 19 + tt * 0.8 + i * 4)) * (0.6 + 0.4 * Math.sin(ph * 6 - tt * 1.1));
        const edge = G.clamp(Math.min(x + col, W - x) / (W * 0.18), 0, 1);
        const alpha = a * ray * edge * (i === 2 ? 0.5 : 0.7);
        if (alpha < 0.01) continue;
        ctx.globalAlpha = alpha;
        ctx.drawImage(img, x, yb - h, col, h);   // exactly side by side: overlaps would add up into bright seams
      }
    }
    ctx.globalAlpha = 1;
  },
};
