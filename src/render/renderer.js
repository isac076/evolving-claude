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
    this.weatherFx = new G.WeatherFX();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = window.innerWidth; this.H = window.innerHeight;
    this.canvas.width = Math.floor(this.W * this.dpr); this.canvas.height = Math.floor(this.H * this.dpr);
    // the night layer is all soft gradients, so it is drawn at half size and
    // stretched: a quarter of the pixels to fill each frame (much kinder to phones)
    this.ls = this.dpr * 0.5;
    this.light.width = Math.ceil(this.W * this.ls); this.light.height = Math.ceil(this.H * this.ls);
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
    // and at tile corners, so the ground can blend smoothly between tiles
    const ccols = cols + 1, cmap = new Float32Array(ccols * (ty1 - ty0 + 2));
    for (let ty = ty0; ty <= ty1 + 1; ty++) for (let tx = tx0; tx <= tx1 + 1; tx++) {
      const px = tx * T, py = ty * T;
      let f = world.restoreAt(px, py, lights);
      const dp = Math.hypot(px - player.x, py - player.y) / T;
      f = Math.max(f, 0.3 * G.clamp(1 - (dp - 1.5) / 2, 0, 1));
      cmap[(ty - ty0) * ccols + (tx - tx0)] = f;
    }
    const fc = [0, 0, 0, 0];
    const cornersAt = (tx, ty) => {
      const i = (ty - ty0) * ccols + (tx - tx0);
      fc[0] = cmap[i]; fc[1] = cmap[i + 1]; fc[2] = cmap[i + ccols]; fc[3] = cmap[i + ccols + 1];
      return fc;
    };

    // ground, then fish + ripples under the surface, then floor structures (paths, bridges)
    // the visible tiles plus a one-tile border, so each tile can see its neighbours
    const gcols = cols + 2, tiles = new Array(gcols * (ty1 - ty0 + 3));
    for (let ty = ty0 - 1; ty <= ty1 + 1; ty++) for (let tx = tx0 - 1; tx <= tx1 + 1; tx++) tiles[(ty - ty0 + 1) * gcols + (tx - tx0 + 1)] = world.tileAt(tx, ty);
    const nb = [null, null, null, null];
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const i = (ty - ty0 + 1) * gcols + (tx - tx0 + 1);
      nb[0] = tiles[i - gcols]; nb[1] = tiles[i + 1]; nb[2] = tiles[i + gcols]; nb[3] = tiles[i - 1];
      G.drawGround(ctx, tiles[i], tx * T - camX, ty * T - camY, fAt(tx, ty), time, tx, ty, cornersAt(tx, ty), nb);
    }
    const life = state.creatures;
    if (life) life.drawWater(ctx, camX, camY, time);
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const st = world.structureAt(tx, ty);
      if (st && G.STRUCTURES[st.type].floor) G.STRUCTURE_SPRITES[st.type](ctx, tx * T - camX, ty * T - camY, fAt(tx, ty), time, st);
    }

    // objects, standing structures and the player, row by row (back to front)
    const nightGlows = [];
    const groundLife = life ? life.groundRows() : null;
    const folk = state.villagers ? state.villagers.rows() : null;
    for (let ty = ty0; ty <= ty1; ty++) {
      const critters = groundLife && groundLife.get(ty);
      if (critters) for (const c of critters) life.drawOne(ctx, c, camX, camY, time);
      for (let tx = tx0; tx <= tx1; tx++) {
        const x = tx * T - camX, y = ty * T - camY, f = fAt(tx, ty);
        const st = world.structureAt(tx, ty);
        if (st && !G.STRUCTURES[st.type].floor) G.STRUCTURE_SPRITES[st.type](ctx, x, y, f, time, st);
        const o = world.objectAt(tx, ty);
        if (o) {
          G.OBJECT_SPRITES[o](ctx, x, y, f, time, world.tileAt(tx, ty));
          const od = G.OBJECTS[o];
          if (od.light) {
            const hue = od.glowHue !== undefined ? od.glowHue + (world.tileAt(tx, ty).hue % 50) : world.tileAt(tx, ty).hue;
            nightGlows.push({ x: x + 16, y: y + 13, r: od.light, hue });
          }
        }
      }
      const people = folk && folk.get(ty);
      if (people) for (const v of people) G.drawVillager(ctx, v, v.x - camX, v.y - camY, time);
      if (player.ty === ty) G.drawPlayer(ctx, player, player.x - camX, player.y - camY, time);
    }
    if (state.villagers) state.villagers.glows(nightGlows, camX, camY);

    if (life) life.drawAir(ctx, camX, camY, time);

    // weather: cloud shadows, grey skies, rain, wind-blown leaves, mist, rainbows
    this.weatherFx.draw(ctx, state, camX, camY, W, H, dt, this.dpr);

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

    // pick-up mode: a soft dashed outline around the building under the cursor
    if (state.removeHover) {
      const h = state.removeHover, x = h.tx * T - camX, y = h.ty * T - camY;
      ctx.setLineDash([5, 4]); ctx.lineDashOffset = -time * 12;
      ctx.strokeStyle = h.ok ? 'rgba(255,215,122,.95)' : 'rgba(255,140,130,.85)';
      ctx.lineWidth = 2; ctx.strokeRect(x + 1, y - 10, T - 2, T + 8);
      ctx.setLineDash([]);
    }

    // particles
    const dark = 1 - G.daylight(time);
    const wv = state.weather ? state.weather.v : { rain: 0, fog: 0 };
    this.updateParticles(dt, dark * (1 - wv.rain * 0.8), camX, camY, lights, world);
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.particles) {
      ctx.fillStyle = p.color.replace('A', Math.max(0, p.life * (p.firefly ? 0.4 + dark * 0.6 : 1)).toFixed(2));
      G.circle(ctx, p.x - camX, p.y - camY, p.size);
    }
    ctx.globalCompositeOperation = 'source-over';

    this.drawLighting(dark, camX, camY, lights, nightGlows, player, time, wv.fog);

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

  drawLighting(dark, camX, camY, lights, nightGlows, player, time, fog = 0) {
    const ctx = this.ctx, W = this.W, H = this.H;
    // warm/cool tint through the day (golden at dusk, blue at night)
    const daylight = 1 - dark;
    const dusk = Math.max(0, 1 - Math.abs(daylight - 0.45) / 0.3);
    if (dusk > 0) { ctx.fillStyle = `rgba(255,140,60,${dusk * 0.12})`; ctx.fillRect(0, 0, W, H); }
    if (dark < 0.02) return;

    const l = this.lctx;
    l.setTransform(this.ls, 0, 0, this.ls, 0, 0);
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
    ctx.drawImage(this.light, 0, 0, this.light.width / this.ls, this.light.height / this.ls);

    // warm glow on top (lights bloom wider in the mist)
    ctx.globalCompositeOperation = 'lighter';
    const fb = 1 + fog * 0.9;
    const glow = (x, y, r, c) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    };
    glow(player.x - camX, player.y - camY - 8, 50 * fb, `rgba(255,210,140,${0.25 * dark})`);
    for (const L of lights) if (L.light) {
      if (L.type === 'beacon') glow(L.x - camX, L.y - camY - 34, L.light * 0.4 * fb, `rgba(140,215,255,${0.32 * dark})`);
      else glow(L.x - camX, L.y - camY - 18, L.light * 0.35 * fb, `rgba(255,190,110,${0.3 * dark})`);
    }
    for (const g of nightGlows) glow(g.x, g.y, 18, `hsla(${g.hue},90%,65%,${0.5 * dark})`);
    ctx.globalCompositeOperation = 'source-over';
  }
};
