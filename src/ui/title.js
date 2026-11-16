// G.Title — the title screen (Night 24). The word "Lumen" lights up letter by
// letter, the world behind starts grey and blooms into colour, warm motes rise,
// and the camera drifts slowly from one of your lights to the next while the day
// turns. Continue / New world dim the screen, set you down, and the view eases
// out around the spirit as the HUD fades in.
window.G = window.G || {};

G.Title = class {
  constructor(state, renderer) {
    this.state = state; this.renderer = renderer;
    this.el = document.getElementById('title');
    this.veil = document.getElementById('veil');
    this.motes = []; this.leaving = false;
    this.tour = null; this.seen = new Set();
    // one span per letter, so each can light up in turn (CSS: .title-word span)
    const h1 = this.el.querySelector('h1'), word = h1.textContent.trim();
    h1.setAttribute('aria-label', word);
    h1.innerHTML = [...word].map((c, i) => `<span style="--i:${i}" aria-hidden="true">${c}</span>`).join('');
  }

  // the world behind the title is ready: write the little summary and let the colour bloom
  start(saved, friends) {
    const s = this.state, w = s.world, T = G.TITLE, line = document.getElementById('title-summary');
    if (saved) {
      const day = Math.floor((saved.time || 0) / G.DAY_LENGTH) + 1, sn = G.Seasons.at(saved.time || 0);
      line.textContent = G.TITLE_LINES.summary(day, sn.def.name, w.litCount(), friends);
    } else line.textContent = G.TITLE_LINES.fresh;
    const b = document.body;
    if (G.calm) return;   // calm motion: no grey-to-colour sweep
    b.classList.add('title-grey');
    setTimeout(() => b.classList.add('title-bloom'), T.bloomDelay * 1000);
    setTimeout(() => b.classList.remove('title-grey', 'title-bloom'), (T.bloomDelay + T.bloomTime + 0.3) * 1000);
  }

  // every frame while the title shows: the day passes a little faster and the camera drifts
  frame(dt) {
    const s = this.state, T = G.TITLE;
    s.time += dt * T.timeSpeed;
    if (s.world) s.world.time = s.time;
    if (this.leaving) return;
    const lights = s.world.lights.filter(L => L.restore || L.light), cam = s.cam;
    if (!lights.length) { cam.x += dt * 12; return; }
    const aim = L => ({ x: L.x, y: L.y - this.renderer.vh * 0.14 });   // the light sits a little below the words
    if (lights.length === 1) {   // a young world: circle slowly around its only light
      const a = aim(lights[0]), t = s.time * 0.035;
      this.circleK = Math.min(1, (this.circleK || 0) + dt * 0.25);
      cam.x += (a.x + Math.cos(t) * 170 - cam.x) * this.circleK * dt * 2;
      cam.y += (a.y + Math.sin(t) * 70 - cam.y) * this.circleK * dt * 2;
      return;
    }
    if (!this.tour || this.tour.t > T.tour + 3) {   // on to the nearest light not yet visited
      let next = null, bd = Infinity;
      for (let pass = 0; pass < 2 && !next; pass++) {
        for (const L of lights) {
          const k = L.x + ',' + L.y;
          if (this.seen.has(k) || (this.tour && this.tour.L === L)) continue;
          const d = Math.hypot(L.x - cam.x, L.y - cam.y);
          if (d < bd) { bd = d; next = L; }
        }
        if (!next) this.seen.clear();
      }
      if (!next) next = lights[0];
      this.seen.add(next.x + ',' + next.y);
      // a long way off: take longer over it (never a dizzy rush across the world)
      const len = Math.max(T.tour, Math.min(40, bd / 40));
      this.tour = { L: next, from: { x: cam.x, y: cam.y }, t: 0, len };
    }
    const tr = this.tour, a = aim(tr.L);
    tr.t += dt * T.tour / tr.len;
    const k = G.clamp(tr.t / T.tour, 0, 1), e = k * k * (3 - 2 * k);
    cam.x = tr.from.x + (a.x - tr.from.x) * e;
    cam.y = tr.from.y + (a.y - tr.from.y) * e;
  }

  // warm motes rising behind the words (screen space, after the world is drawn)
  drawMotes(dt) {
    const R = this.renderer, ctx = R.ctx, W = R.W, H = R.H, n = G.calm ? 8 : G.TITLE.motes;
    ctx.setTransform(R.dpr, 0, 0, R.dpr, 0, 0);
    while (this.motes.length < n) this.motes.push({ x: Math.random() * W, y: H * (0.5 + Math.random() * 0.6), vy: G.rand(8, 22), ph: Math.random() * 6.3, r: G.rand(1, 2.4), life: 0 });
    ctx.globalCompositeOperation = 'lighter';
    for (const m of this.motes) {
      m.life += dt; m.ph += dt;
      m.y -= m.vy * dt * (G.calm ? 0.4 : 1); m.x += Math.sin(m.ph * 0.7) * 8 * dt;
      const a = Math.min(1, m.life / 2) * G.clamp(m.y / (H * 0.6), 0, 1) * (0.55 + 0.45 * Math.sin(m.ph * 2.1));
      if (a <= 0.01) continue;
      const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 5);
      g.addColorStop(0, `rgba(255,224,150,${(a * 0.8).toFixed(3)})`); g.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(m.x, m.y, m.r * 5, 0, 6.283); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    this.motes = this.motes.filter(m => m.y > -20);
  }

  // Continue / New world: the words drift up, the screen dims, `go` loads the world, then we arrive
  leave(go) {
    if (this.leaving) return;
    this.leaving = true;
    this.el.classList.add('leaving');
    this.veil.classList.add('on');
    G.Sound.play('arrive');
    setTimeout(() => { go(); this.arrive(); }, G.TITLE.arrive.veil * 1000);
  }

  // set down beside the spirit: the veil lifts, the view eases out, a little ring of sparks
  arrive() {
    const A = G.TITLE.arrive, R = this.renderer, p = this.state.player;
    document.body.classList.remove('title-grey', 'title-bloom');
    if (!G.calm) { R.zoom = A.zoom; R.zoomTo(1, 0.2); }
    this.veil.classList.remove('on');
    if (p) { R.burst(p.x, p.y - 12, 'rgba(255,222,150,A)', 18); R.fireflies(p.x, p.y - 8, 6); }
  }
};
