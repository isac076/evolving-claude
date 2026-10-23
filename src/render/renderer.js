// Draws the world each frame: ground, objects, player, particles, then
// day/night lighting on top.
window.G = window.G || {};

// 0 at deep night, 1 at full day.
G.daylight = function (time) {
  const phase = (time % G.DAY_LENGTH) / G.DAY_LENGTH;   // 0 = noon
  return G.clamp(0.5 + 0.75 * Math.cos(phase * 6.2832), 0, 1);
};

G.Renderer = class {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.light = document.createElement('canvas');
    this.lctx = this.light.getContext('2d');
    this.particles = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = window.innerWidth; this.H = window.innerHeight;
    for (const c of [this.canvas, this.light]) {
      c.width = Math.floor(this.W * this.dpr); c.height = Math.floor(this.H * this.dpr);
    }
    this.canvas.style.width = this.W + 'px'; this.canvas.style.height = this.H + 'px';
  }

  burst(x, y, color, n = 12) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, sp = G.rand(20, 90);
      this.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, life: 1, decay: G.rand(1.2, 2), color, size: G.rand(1.5, 3), grav: 80 });
    }
  }

  render(state, dt) {
    const { world, player, cam, time } = state;
    const ctx = this.ctx, T = G.TILE, W = this.W, H = this.H;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const camX = Math.round(cam.x - W / 2), camY = Math.round(cam.y - H / 2);
    const tx0 = Math.floor(camX / T) - 1, ty0 = Math.floor(camY / T) - 1;
    const tx1 = Math.ceil((camX + W) / T) + 1, ty1 = Math.ceil((camY + H) / T) + 2;

    // lights near the screen
    const margin = 16 * T;
    const lights = world.lights.filter(L => L.x > camX - margin && L.x < camX + W + margin && L.y > camY - margin && L.y < camY + H + margin);

    // restoration per visible tile (computed once per frame)
    const cols = tx1 - tx0 + 1;
    const fmap = new Float32Array(cols * (ty1 - ty0 + 1));
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const px = (tx + 0.5) * T, py = (ty + 0.5) * T;
      let f = world.restoreAt(px, py, lights);
      const dp = Math.hypot(px - player.x, py - player.y) / T;      // the spirit's own small warmth
      f = Math.max(f, 0.3 * G.clamp(1 - (dp - 1.5) / 2, 0, 1));
      fmap[(ty - ty0) * cols + (tx - tx0)] = f;
    }
    const fAt = (tx, ty) => fmap[(ty - ty0) * cols + (tx - tx0)];

    // ground + floor structures
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const x = tx * T - camX, y = ty * T - camY, f = fAt(tx, ty);
      G.drawGround(ctx, world.tileAt(tx, ty), x, y, f, time, tx, ty);
      const st = world.structureAt(tx, ty);
      if (st && G.STRUCTURES[st.type].floor) G.STRUCTURE_SPRITES[st.type](ctx, x, y, f, time, st);
    }

    // objects, standing structures and the player, row by row (back to front)
    const nightGlows = [];
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        const x = tx * T - camX, y = ty * T - camY, f = fAt(tx, ty);
        const st = world.structureAt(tx, ty);
        if (st && !G.STRUCTURES[st.type].floor) G.STRUCTURE_SPRITES[st.type](ctx, x, y, f, time, st);
        const o = world.objectAt(tx, ty);
        if (o) {
          G.OBJECT_SPRITES[o](ctx, x, y, f, time, world.tileAt(tx, ty));
          if (G.OBJECTS[o].light) nightGlows.push({ x: x + 16, y: y + 13, r: G.OBJECTS[o].light, hue: world.tileAt(tx, ty).hue });
        }
      }
      if (player.ty === ty) G.drawPlayer(ctx, player, player.x - camX, player.y - camY, time);
    }

    // build preview
    if (state.placing) {
      const p = state.placing;
      const x = p.tx * T - camX, y = p.ty * T - camY;
      ctx.globalAlpha = 0.6;
      G.STRUCTURE_SPRITES[p.type](ctx, x, y, 1, time, { tx: p.tx, ty: p.ty });
      ctx.globalAlpha = 1;
      ctx.strokeStyle = p.ok ? 'rgba(180,255,190,.9)' : 'rgba(255,120,120,.9)';
      ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, T - 2, T - 2);
    }

    // particles
    const dark = 1 - G.daylight(time);
    this.updateParticles(dt, dark, camX, camY, lights, world);
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.particles) {
      ctx.fillStyle = p.color.replace('A', Math.max(0, p.life * (p.firefly ? 0.4 + dark * 0.6 : 1)).toFixed(2));
      G.circle(ctx, p.x - camX, p.y - camY, p.size);
    }
    ctx.globalCompositeOperation = 'source-over';

    this.drawLighting(dark, camX, camY, lights, nightGlows, player, time);

    // soft vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(5,5,20,.45)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }

  updateParticles(dt, dark, camX, camY, lights, world) {
    // fireflies drift around restored places at dusk and night
    if (dark > 0.3 && this.particles.length < 140 && Math.random() < dark * 0.5) {
      const x = camX + Math.random() * this.W, y = camY + Math.random() * this.H;
      if (world.restoreAt(x, y, lights) > 0.5) {
        this.particles.push({ x, y, vx: G.rand(-8, 8), vy: G.rand(-8, 8), life: 1, decay: G.rand(0.08, 0.2),
          color: 'rgba(255,240,150,A)', size: G.rand(1.2, 2.2), grav: 0, firefly: true, ph: Math.random() * 6 });
      }
    }
    for (const p of this.particles) {
      if (p.firefly) { p.ph += dt; p.vx += Math.sin(p.ph * 1.7) * 10 * dt; p.vy += Math.cos(p.ph * 1.3) * 10 * dt; }
      p.vy += p.grav * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.life -= p.decay * dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  drawLighting(dark, camX, camY, lights, nightGlows, player, time) {
    const ctx = this.ctx, W = this.W, H = this.H;
    // warm/cool tint through the day (golden at dusk, blue at night)
    const daylight = 1 - dark;
    const dusk = Math.max(0, 1 - Math.abs(daylight - 0.45) / 0.3);
    if (dusk > 0) { ctx.fillStyle = `rgba(255,140,60,${dusk * 0.12})`; ctx.fillRect(0, 0, W, H); }
    if (dark < 0.02) return;

    const l = this.lctx;
    l.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    l.globalCompositeOperation = 'source-over';
    l.clearRect(0, 0, W, H);
    l.fillStyle = `rgba(6,8,28,${(dark * 0.84).toFixed(3)})`;
    l.fillRect(0, 0, W, H);
    l.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r, a = 1) => {
      const g = l.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.55, `rgba(0,0,0,${a * 0.6})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      l.fillStyle = g; l.beginPath(); l.arc(x, y, r, 0, 6.2832); l.fill();
    };
    const pr = 120 + Math.sin(time * 3) * 3;
    hole(player.x - camX, player.y - camY - 8, pr, 0.95);
    for (const L of lights) if (L.light) hole(L.x - camX, L.y - camY - 14, L.light);
    for (const g of nightGlows) hole(g.x, g.y, g.r, 0.8);
    ctx.drawImage(this.light, 0, 0, W, H);

    // warm glow on top
    ctx.globalCompositeOperation = 'lighter';
    const glow = (x, y, r, c) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    };
    glow(player.x - camX, player.y - camY - 8, 50, `rgba(255,210,140,${0.25 * dark})`);
    for (const L of lights) if (L.light) glow(L.x - camX, L.y - camY - 18, L.light * 0.35, `rgba(255,190,110,${0.3 * dark})`);
    for (const g of nightGlows) glow(g.x, g.y, 18, `hsla(${g.hue},90%,65%,${0.5 * dark})`);
    ctx.globalCompositeOperation = 'source-over';
  }
};
