// G.DuneFX — the air of the Amber Dunes (Night 25). Nothing here is saved.
//  - air(): before the lighting — thin streaks of sand blowing low over the dunes
//    (more in the wind), and now and then a tumbleweed bouncing across.
//  - sky(): after the lighting, so it shines in the dark — on clear nights over the
//    dunes, a sky full of twinkling stars, and falling stars streaking across it
//    (G.DunePlay decides when one falls and calls shoot()).
// How strong they are comes from state.dunes (G.DunePlay): `near` = how much of the
// land around is dunes, `sky` = how clear and dark the night over them is.
window.G = window.G || {};

G.DuneFX = {
  wisps: [], weeds: [], falling: [], stars: null, starA: 0, weedImg: null,

  // a tumbleweed: a ball of tangled dry twigs, drawn once
  weed() {
    const c = document.createElement('canvas'); c.width = c.height = 24;
    const x = c.getContext('2d');
    x.lineWidth = 1; x.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * 6.283, b = a + G.rand(1, 2.6), r1 = G.rand(3, 10), r2 = G.rand(4, 10.5);
      x.strokeStyle = `hsla(${G.rand(30, 42)},${G.rand(30, 45)}%,${G.rand(42, 62)}%,.9)`;
      x.beginPath(); x.moveTo(12 + Math.cos(a) * r1, 12 + Math.sin(a) * r1);
      x.quadraticCurveTo(12 + Math.cos((a + b) / 2) * 11, 12 + Math.sin((a + b) / 2) * 11, 12 + Math.cos(b) * r2, 12 + Math.sin(b) * r2); x.stroke();
    }
    return c;
  },

  air(ctx, state, camX, camY, W, H, dt, t) {
    const dn = state.dunes;
    if (!dn || !state.world) return;
    const near = dn.near, wind = G.windNow || 0, dir = G.windDir || 1;
    // blowing sand: low streaks drifting downwind (they live in world space, so they don't slide with the camera)
    const want = Math.round(G.DUNES.wisps * G.clamp(near * 1.5, 0, 1) * (0.35 + 0.65 * wind) * (G.calm ? 0.3 : 1));
    const list = this.wisps, w = state.world;
    while (list.length < want) list.push({ x: camX + G.rand(0, W), y: camY + G.rand(0, H), len: G.rand(14, 34), ph: Math.random() * 6.3, life: 0, max: G.rand(1.6, 3.2) });
    if (list.length > want) list.length = Math.max(want, list.length - Math.ceil(dt * 30));
    if (list.length) {
      ctx.lineWidth = 1; ctx.lineCap = 'round';
      for (const s of list) {
        s.life += dt; s.ph += dt * 3;
        s.x += dir * (30 + wind * 110) * dt; s.y += Math.sin(s.ph) * 4 * dt;
        if (s.life > s.max || s.x < camX - 60 || s.x > camX + W + 60) { s.x = camX + G.rand(0, W); s.y = camY + G.rand(0, H); s.life = 0; }
        if (w.tileAt(Math.floor(s.x / 32), Math.floor(s.y / 32)).type !== 'dune') continue;
        const a = Math.sin(s.life / s.max * Math.PI) * 0.35, x = s.x - camX, y = s.y - camY;
        ctx.strokeStyle = `rgba(255,236,190,${a.toFixed(3)})`;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - dir * s.len * 0.5, y - 1.5 + Math.sin(s.ph) * 1.5, x - dir * s.len, y); ctx.stroke();
      }
      ctx.lineCap = 'butt';
    }
    // tumbleweeds: roll in from the upwind side and bounce across the sand
    if (!this.weedImg) this.weedImg = this.weed();
    if (near > 0.35 && this.weeds.length < G.DUNES.weeds && dt > 0 && Math.random() < dt * (0.08 + wind * 0.25)) {
      const y = camY + G.rand(H * 0.15, H * 0.9), x = dir > 0 ? camX - 20 : camX + W + 20;
      this.weeds.push({ x, y, z: 0, vz: 0, rot: 0, s: G.rand(0.7, 1.1), sp: G.rand(40, 60) });
    }
    for (const q of this.weeds) {
      q.x += dir * (q.sp + wind * 80) * dt;
      q.vz -= 260 * dt; q.z += q.vz * dt;
      if (q.z <= 0) { q.z = 0; q.vz = G.rand(50, 90) * (0.6 + wind * 0.6); }
      q.rot += dir * (q.sp + wind * 80) * dt / (10 * q.s);
    }
    this.weeds = this.weeds.filter(q => q.x > camX - 60 && q.x < camX + W + 60);
    for (const q of this.weeds) {
      const x = q.x - camX, y = q.y - camY, r = 10 * q.s;
      G.shadow(ctx, x, y + 2, r * 0.9 * (1 - q.z / 60), r * 0.3, 0.18);
      ctx.save(); ctx.translate(x, y - r - q.z); ctx.rotate(q.rot); ctx.scale(q.s, q.s);
      ctx.drawImage(this.weedImg, -12, -12); ctx.restore();
    }
  },

  // a falling star (called by G.DunePlay); its path is kept in screen fractions
  shoot() {
    const fromLeft = Math.random() < 0.5;
    this.falling.push({ x: fromLeft ? G.rand(0.05, 0.5) : G.rand(0.5, 0.95), y: G.rand(0.04, 0.3), vx: (fromLeft ? 1 : -1) * G.rand(0.45, 0.7),
      vy: G.rand(0.18, 0.3), life: 0, max: G.rand(0.8, 1.2) });
  },

  sky(ctx, state, camX, camY, W, H, dt, t, dark) {
    const dn = state.dunes;
    if (!dn) return;
    const target = dn.sky || 0;
    this.starA += (target - this.starA) * Math.min(1, dt * 0.6);
    if (this.starA < 0.01 && !this.falling.length) return;
    ctx.globalCompositeOperation = 'lighter';
    // a sky full of stars: fixed points that drift very slowly with the camera and twinkle
    if (!this.stars) {
      this.stars = [];
      for (let i = 0; i < 90; i++) this.stars.push({ x: Math.random(), y: Math.random() * 0.75, s: Math.random() < 0.14 ? 1.9 : G.rand(0.9, 1.4), ph: Math.random() * 6.3, hue: G.rand(30, 220) });
    }
    if (this.starA > 0.01) {
      const ox = -camX * 0.02, oy = -camY * 0.02;
      for (const s of this.stars) {
        const tw = G.calm ? 0.8 : 0.55 + 0.45 * Math.sin(t * (1.3 + s.s) + s.ph);
        const a = this.starA * tw * (1 - s.y * 0.5);
        if (a < 0.03) continue;
        const x = ((s.x * W + ox) % W + W) % W, y = ((s.y * H + oy) % H + H) % H;
        ctx.fillStyle = `hsla(${s.hue},60%,90%,${a.toFixed(2)})`;
        ctx.fillRect(x - s.s / 2, y - s.s / 2, s.s, s.s);
        if (s.s > 1.8 && tw > 0.8) { ctx.fillRect(x - 3, y - 0.3, 6, 0.6); ctx.fillRect(x - 0.3, y - 3, 0.6, 6); }
      }
    }
    // falling stars: a bright head and a long fading tail
    for (const f of this.falling) {
      f.life += dt;
      const k = f.life / f.max, a = Math.sin(Math.min(1, k) * Math.PI);
      const hx = (f.x + f.vx * f.life) * W, hy = (f.y + f.vy * f.life) * H, tl = 0.22 * Math.min(1, k * 3);
      const tx = hx - f.vx * tl * W, ty = hy - f.vy * tl * H;
      const g = ctx.createLinearGradient(tx, ty, hx, hy);
      g.addColorStop(0, 'rgba(255,230,180,0)'); g.addColorStop(1, `rgba(255,248,225,${(0.9 * a).toFixed(2)})`);
      ctx.strokeStyle = g; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.fillStyle = `rgba(255,255,240,${a.toFixed(2)})`; G.circle(ctx, hx, hy, 1.8);
      ctx.fillStyle = `rgba(255,220,150,${(0.25 * a).toFixed(2)})`; G.circle(ctx, hx, hy, 5);
    }
    this.falling = this.falling.filter(f => f.life < f.max);
    ctx.globalCompositeOperation = 'source-over';
  },
};
