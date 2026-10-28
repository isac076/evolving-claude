// G.WeatherFX — draws the weather over the world each frame: drifting cloud
// shadows, the grey dimming of a cloudy sky, falling rain with little splashes
// (and ripples on water), leaves and petals riding the wind, rolling mist and
// the rainbow that follows the rain. The renderer calls draw() just before the
// day/night lighting, so at night the dark covers it all except near lights.
// Values come from state.weather.v (see world/weather.js).
window.G = window.G || {};

G.WeatherFX = class {
  constructor() {
    this.drops = []; this.splashes = []; this.leaves = [];
    this.shadowPuffs = []; this.fogPuffs = [];
    this.white = this.puff('255,255,255');
    this.dark = this.puff('12,16,38');
    this.bow = document.createElement('canvas');
  }

  // a soft round blob, drawn once and stretched as needed
  puff(rgb) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(0.45, `rgba(${rgb},.55)`); g.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    return c;
  }

  draw(ctx, state, camX, camY, W, H, dt, dpr) {
    const wx = state.weather;
    if (!wx) return;
    const v = wx.v, wind = G.windNow || 0, dir = wx.dir;
    this.view = { camX, camY, W, H };
    this.drawShadows(ctx, v.shadows, wind, dir, dt);
    if (v.cloud > 0.01) {    // a grey, cool sky dims and cools the colours
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = `rgba(118,130,165,${(v.cloud * 0.68).toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    }
    this.drawSplashes(ctx, dt);
    this.drawLeaves(ctx, state, wind, dir, dt);
    this.drawRainbow(ctx, state, wx.rainbowA, W, H, dpr);
    this.drawRain(ctx, state, v.rain, wind, dir, dt);
    this.drawFog(ctx, state, v.fog, wind, dir, dt);
  }

  // ---------- cloud shadows: big soft dark shapes gliding over the land ----------
  drawShadows(ctx, amount, wind, dir, dt) {
    const { camX, camY, W, H } = this.view, list = this.shadowPuffs;
    if (amount < 0.02) return;
    while (list.length < 6) list.push({ x: camX + G.rand(-300, W + 300), y: camY + G.rand(-200, H + 200), s: G.rand(260, 520), q: G.rand(0.6, 1) });
    const sp = (10 + wind * 40) * dir;
    ctx.globalAlpha = amount * 0.2;
    for (const p of list) {
      p.x += sp * dt; p.y += sp * 0.25 * dt;
      // drift out of view → come back in on the upwind side
      if (p.x - p.s > camX + W + 320) p.x = camX - p.s - 280; else if (p.x + p.s < camX - 320) p.x = camX + W + p.s + 280;
      if (p.y - p.s > camY + H + 260) p.y = camY - p.s - 200; else if (p.y + p.s < camY - 260) p.y = camY + H + p.s + 200;
      ctx.drawImage(this.dark, p.x - camX - p.s * 1.4, p.y - camY - p.s * 0.8 * p.q, p.s * 2.8, p.s * 1.6 * p.q);
    }
    ctx.globalAlpha = 1;
  }

  // ---------- rain ----------
  newDrop(d, top) {
    const { camX, camY, W, H } = this.view;
    d.x = camX + G.rand(-120, W + 120);
    d.y = camY + G.rand(0, H + 650);          // where it will land
    d.z = G.rand(0.55, 1.1);                  // nearer drops are faster, longer, brighter
    d.h = top ? G.rand(350, 700) : G.rand(0, 650);
    return d;
  }

  drawRain(ctx, state, rain, wind, dir, dt) {
    const { camX, camY, W, H } = this.view, drops = this.drops;
    const want = Math.floor(rain * W * (H + 650) / 2300);
    while (drops.length < want) drops.push(this.newDrop({}, drops.length > 40));
    if (drops.length > want) drops.length = Math.max(want, drops.length - Math.ceil(dt * 300));
    if (!drops.length) return;
    const world = state.world, slant = dir * (40 + wind * 260);
    const paths = [new Path2D(), new Path2D(), new Path2D()];
    for (const d of drops) {
      const vy = 500 + d.z * 520, vx = slant * d.z;
      d.h -= vy * dt; d.x += vx * dt;
      if (d.h <= 0) {
        this.land(world, state, d.x, d.y, d.z);
        this.newDrop(d, true);
        continue;
      }
      if (d.x < camX - 160 || d.x > camX + W + 160 || d.y < camY - 60 || d.y > camY + H + 720) { this.newDrop(d, false); continue; }
      const sx = d.x - camX, sy = d.y - d.h - camY;
      if (sy < -30 || sy > H + 10) continue;
      const len = 0.022 + d.z * 0.012;
      const p = paths[d.z < 0.75 ? 0 : d.z < 0.95 ? 1 : 2];
      p.moveTo(sx - vx * len, sy - vy * len); p.lineTo(sx, sy);
    }
    ctx.lineCap = 'round';
    [[0.18, 1], [0.28, 1.2], [0.4, 1.5]].forEach(([a, w], i) => {
      ctx.strokeStyle = `rgba(205,220,248,${(a * (0.5 + rain * 0.5)).toFixed(3)})`;
      ctx.lineWidth = w; ctx.stroke(paths[i]);
    });
    ctx.lineCap = 'butt';
  }

  land(world, state, x, y, z) {
    const { camX, camY, W, H } = this.view;
    if (x < camX || x > camX + W || y < camY || y > camY + H) return;
    const tx = Math.floor(x / G.TILE), ty = Math.floor(y / G.TILE);
    if (world.isWater(tx, ty) && !world.structureAt(tx, ty)) {
      if (state.creatures && Math.random() < 0.35) state.creatures.ripple(x, y, 0.45 + z * 0.2);
    } else if (this.splashes.length < 160) {
      this.splashes.push({ x, y, life: 1, z });
    }
  }

  drawSplashes(ctx, dt) {
    const { camX, camY } = this.view;
    if (!this.splashes.length) return;
    ctx.strokeStyle = 'rgba(215,228,250,.5)'; ctx.fillStyle = 'rgba(215,228,250,.6)'; ctx.lineWidth = 1;
    for (const s of this.splashes) {
      s.life -= dt * 4;
      const k = 1 - s.life, x = s.x - camX, y = s.y - camY, r = 1.5 + k * 4 * s.z;
      ctx.globalAlpha = Math.max(0, s.life);
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.4, 0, 0, 6.2832); ctx.stroke();
      // two tiny droplets jump up and fall back
      const hop = Math.sin(k * 3.1416) * 5 * s.z;
      ctx.fillRect(x - r * 0.8, y - hop, 1.2, 1.2); ctx.fillRect(x + r * 0.7, y - hop * 0.8, 1.2, 1.2);
    }
    ctx.globalAlpha = 1;
    this.splashes = this.splashes.filter(s => s.life > 0);
  }

  // ---------- leaves, petals (and grey fluff in faded land) on the wind ----------
  drawLeaves(ctx, state, wind, dir, dt) {
    const { camX, camY, W, H } = this.view, list = this.leaves, world = state.world;
    const want = Math.max(0, Math.floor((wind - 0.3) * 80));
    if (list.length < want && Math.random() < dt * 20) {
      // most blow in from the upwind edge; some appear mid-air so a new breeze fills the view quickly
      const edge = Math.random() < 0.6;
      const x = edge ? (dir > 0 ? camX - 20 : camX + W + 20) : camX + G.rand(0, W), y = camY + G.rand(-40, H);
      const f = world.restoreAt(x + dir * 200, y, world.lights);
      const kind = f > 0.5 ? (Math.random() < 0.3 ? 'petal' : 'leaf') : 'fluff';
      const hue = kind === 'petal' ? G.pick([330, 45, 285, 10]) : kind === 'leaf' ? G.pick([95, 110, 35, 25, 70]) : 0;
      list.push({ x, y, z: G.rand(0.6, 1.2), a: Math.random() * 6.28, spin: G.rand(-5, 5), ph: Math.random() * 6.28, kind, hue, life: 1, age: edge ? 1 : 0 });
    }
    for (const l of list) {
      l.ph += dt; l.age += dt;
      l.x += dir * (70 + wind * 150) * l.z * dt;
      l.y += (Math.sin(l.ph * 2.1) * 26 + 8) * l.z * dt;
      l.a += l.spin * dt;
      if (wind < 0.25) l.life -= dt * 0.6;
      if (l.x < camX - 60 || l.x > camX + W + 60) l.life = 0;
    }
    this.leaves = list.filter(l => l.life > 0);
    for (const l of this.leaves) {
      const x = l.x - camX, y = l.y - camY;
      ctx.save(); ctx.translate(x, y); ctx.rotate(l.a); ctx.globalAlpha = Math.min(1, l.life * 1.5, l.age * 1.5);
      if (l.kind === 'fluff') { ctx.fillStyle = 'rgba(225,228,235,.6)'; G.circle(ctx, 0, 0, 1.8 * l.z); }
      else {
        ctx.fillStyle = l.kind === 'petal' ? `hsl(${l.hue},80%,76%)` : `hsl(${l.hue},55%,${l.hue < 60 ? 52 : 42}%)`;
        ctx.beginPath(); ctx.ellipse(0, 0, 4.4 * l.z, 2.2 * l.z * Math.abs(Math.cos(l.ph * 3)) + 0.5, 0, 0, 6.2832); ctx.fill();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  // ---------- fog: a soft haze, thicker away from the spirit, with rolling banks ----------
  drawFog(ctx, state, fog, wind, dir, dt) {
    if (fog < 0.02) return;
    const { camX, camY, W, H } = this.view, list = this.fogPuffs;
    while (list.length < 12) list.push({ x: camX + G.rand(-200, W + 200), y: camY + G.rand(-150, H + 150), s: G.rand(160, 300), q: G.rand(0.45, 0.8), sp: G.rand(0.6, 1.4) });
    const px = state.player.x - camX, py = state.player.y - camY - 8;
    const g = ctx.createRadialGradient(px, py, 70, px, py, Math.max(W, H) * 0.62);
    g.addColorStop(0, `rgba(208,214,228,${(fog * 0.1).toFixed(3)})`);
    g.addColorStop(1, `rgba(208,214,228,${(fog * 0.62).toFixed(3)})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = fog * 0.32;
    for (const p of list) {
      p.x += (8 + wind * 40) * dir * p.sp * dt;
      if (p.x - p.s > camX + W + 220) p.x = camX - p.s - 200; else if (p.x + p.s < camX - 220) p.x = camX + W + p.s + 200;
      if (p.y - p.s > camY + H + 160) p.y = camY - p.s - 150; else if (p.y + p.s < camY - 160) p.y = camY + H + p.s + 150;
      ctx.drawImage(this.white, p.x - camX - p.s * 1.5, p.y - camY - p.s * p.q, p.s * 3, p.s * 2 * p.q);
    }
    ctx.globalAlpha = 1;
  }

  // ---------- rainbow: a soft arc in the sky after the rain ----------
  drawRainbow(ctx, state, a, W, H, dpr) {
    if (a < 0.01) return;
    const b = this.bow;
    if (b.width !== Math.floor(W * dpr) || b.height !== Math.floor(H * dpr)) { b.width = Math.floor(W * dpr); b.height = Math.floor(H * dpr); }
    const c = b.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, W, H);
    // brighter and truer colours over restored land; a pale ghost of a bow over grey land
    const w = state.world, f = w.restoreAt(state.cam.x, state.cam.y, w.lights);
    const sat = 35 + 55 * f, R = Math.max(W, H) * 0.72, cx = W * 0.58, cy = H * 1.12, band = R * 0.016;
    const hues = [0, 28, 52, 110, 195, 235, 275];
    c.globalAlpha = 1;
    c.filter = `blur(${Math.max(2, band * 0.5).toFixed(1)}px)`;   // soft edges (ignored where unsupported)
    hues.forEach((h, i) => {
      c.strokeStyle = `hsl(${h},${sat}%,${62 + 6 * (1 - f)}%)`;
      c.lineWidth = band * 1.15;
      c.beginPath(); c.arc(cx, cy, R - i * band, Math.PI * 1.02, Math.PI * 1.98); c.stroke();
    });
    c.filter = 'none';
    // fade the feet of the arc into the land
    c.globalCompositeOperation = 'destination-in';
    const g = c.createLinearGradient(0, cy - R, 0, H * 0.95);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,.7)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = a * (0.16 + 0.16 * f);
    ctx.drawImage(b, 0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
};
