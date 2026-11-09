// G.SporeFX — the air of the Glowcap Hollows (Night 17): tiny glowing spores
// drift up from the mossy ground and from Mushroom lamps, swaying as they rise.
// They are drawn after the night layer, so they shine in the dark (faintly by day).
// Glow snails get a soft halo here too. Nothing is saved.
window.G = window.G || {};

G.SporeFX = {
  motes: [],
  HUES: [168, 182, 196, 278, 300],

  spawn(x, y, f, lamp) {
    const hue = lamp ? 172 + Math.random() * 14 : this.HUES[Math.floor(Math.random() * this.HUES.length)];
    this.motes.push({ x, y, vx: G.rand(-4, 4), vy: -G.rand(5, lamp ? 18 : 12), ph: Math.random() * 6.3,
      life: 0, max: G.rand(4, 8), size: G.rand(0.9, 1.9), hue, sat: f > 0.4 || lamp ? 85 : 25 });
  },

  update(state, camX, camY, W, H, dt) {
    const w = state.world, T = G.TILE;
    if (dt > 0 && this.motes.length < G.HOLLOW.motes) {
      for (let i = 0; i < 3; i++) {   // a few tries a frame at random spots on screen
        const x = camX + Math.random() * W, y = camY + Math.random() * H;
        if (w.tileAt(Math.floor(x / T), Math.floor(y / T)).type === 'mushwood' && Math.random() < 0.45)
          this.spawn(x, y, w.restoreAt(x, y, w.lights), false);
      }
      for (const L of w.lights) {   // mushroom lamps breathe out a few spores of their own
        if (L.type !== 'shroomlamp' || L.x < camX - 40 || L.x > camX + W + 40 || L.y < camY - 60 || L.y > camY + H + 60) continue;
        if (Math.random() < dt * 2.2) this.spawn(L.x + G.rand(-12, 12), L.y - 22 - G.rand(0, 8), 1, true);
      }
    }
    for (const m of this.motes) {
      m.ph += dt; m.life += dt;
      m.x += (m.vx + Math.sin(m.ph * 1.3) * 6 + (G.windNow || 0) * (G.windDir || 1) * 14) * dt;
      m.y += m.vy * dt;
    }
    this.motes = this.motes.filter(m => m.life < m.max && m.x > camX - 80 && m.x < camX + W + 80 && m.y > camY - 80 && m.y < camY + H + 80);
  },

  draw(ctx, state, camX, camY, W, H, dt, t, dark) {
    if (!state.world) return;
    this.update(state, camX, camY, W, H, dt);
    const k = 0.35 + 0.65 * dark;
    ctx.globalCompositeOperation = 'lighter';
    for (const m of this.motes) {
      const a = Math.min(1, m.life / 0.8, (m.max - m.life) / 1.2) * k * (0.6 + 0.4 * Math.sin(m.ph * 4)) * (m.sat > 50 ? 1 : 0.55);   // pale and faint in the grey
      if (a <= 0.01) continue;
      const x = m.x - camX, y = m.y - camY;
      ctx.fillStyle = `hsla(${m.hue},${m.sat}%,70%,${(a * 0.25).toFixed(3)})`; G.circle(ctx, x, y, m.size * 3.2);
      ctx.fillStyle = `hsla(${m.hue},${m.sat}%,88%,${a.toFixed(3)})`; G.circle(ctx, x, y, m.size);
    }
    if (dark > 0.1 && state.creatures) for (const c of state.creatures.list) {   // glow snails shine in the dark
      if (c.kind !== 'snail') continue;
      const x = c.x - camX - c.face * 1.5, y = c.y - camY - 6;
      if (x < -30 || y < -30 || x > W + 30 || y > H + 30) continue;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 20);
      g.addColorStop(0, `hsla(${c.hue},90%,70%,${(0.45 * dark * c.a).toFixed(3)})`); g.addColorStop(1, 'hsla(0,0%,0%,0)');
      ctx.fillStyle = g; G.circle(ctx, x, y, 20);
    }
    ctx.globalCompositeOperation = 'source-over';
  },
};
