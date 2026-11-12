// G.Hush — the hushlings (Night 19; data in src/data/hush.js). Small shadows
// that rise out of the grey on dark nights, drift toward the spirit and hold on,
// sipping its glow (`player.glow`, 1 = full … G.HUSH.minGlow). Light eases them:
// in a lantern's glow, or touched by a Shine (F), they turn into a mote of
// starlight that floats to you. Never fought, never hurt — only remembered.
//
// main.js makes one (`state.hush`), calls update(dt) every frame while walking
// and shine() on F / the Shine button. Hushlings are not saved; `stats.hush =
// {met, eased, shines, dimmed}` is (inside stats — no version bump).
// The renderer reads `list`, `motes`, `rings` (G.HushFX draws them) and holes().
window.G = window.G || {};

G.Hush = class {
  constructor(state, fx) {
    this.state = state;
    this.fx = fx;            // {ui, burst, floater, panAt, touch}
    this.list = [];          // the hushlings: {x, y, vx, vy, a, mode, e, ph, size, seed, ang}
    this.motes = [];         // starlight on its way to you: {x, y, t, gave}
    this.rings = [];         // Shines spreading out: {x, y, t, r}
    this.spawnT = 0; this.cool = 0; this.whisperT = 2; this.lowSaid = 0; this.rest = 0;
  }

  stats() { const s = this.state.stats; return s.hush || (s.hush = { met: 0, eased: 0, shines: 0, dimmed: 0 }); }
  hasCharm() { return (this.state.inv.charm || 0) > 0; }
  clear() { this.list = []; this.motes = []; this.rings = []; this.rest = 0; }

  // the darkness that lets them come out (0 by day … 1 at deep night)
  dark() { return 1 - G.daylight(this.state.time); }

  // Moon lanterns: the nearest one's distance in tiles (Infinity if none)
  calmAt(x, y) {
    let best = Infinity;
    for (const L of this.state.world.lights) {
      const c = G.STRUCTURES[L.type] && G.STRUCTURES[L.type].calm;
      if (!c) continue;
      const d = Math.hypot(L.x - x, L.y - y) / G.TILE - c;
      if (d < best) best = d;
    }
    return best;   // < 0 = inside the calm
  }

  // how bright the land is for a hushling: lights' colour, a Moon lantern's calm
  warmth(x, y) {
    const w = this.state.world;
    let f = w.restoreAt(x, y, w.lights, true);
    const c = this.calmAt(x, y);
    if (c < 0) f = Math.max(f, 0.9); else if (c < 2) f = Math.max(f, 0.3 + (2 - c) * 0.1);
    return f;
  }

  clinging() { return this.list.filter(h => h.mode === 'cling'); }

  // ---------- each frame ----------
  update(dt) {
    const s = this.state, p = s.player, H = G.HUSH, T = G.TILE;
    if (p.glow === undefined) p.glow = 1;
    const flying = s.travel && s.travel.trip, dark = this.dark();
    const here = s.world.restoreAt(p.x, p.y, s.world.lights, true);

    // your glow comes back by a light, slowly by day, a little out in the grey
    const sipping = this.clinging().length;
    const back = here > 0.5 ? H.refill.light : dark < 0.45 ? H.refill.day : sipping ? 0 : H.refill.grey;
    p.glow = Math.min(1, p.glow + back * dt);
    this.cool = Math.max(0, this.cool - dt);

    // new ones rise out of the dark
    this.rest = Math.max(0, this.rest - dt);   // full ones leave the spirit in peace for a while
    if ((this.spawnT -= dt) <= 0 && !this.rest) {
      this.spawnT = H.spawnEvery;
      if (!flying && this.canCome(here)) this.trySpawn(here);
    }

    let sated = false;
    for (const h of this.list) {
      h.ph += dt;
      const dx = p.x - h.x, dy = (p.y - 10) - h.y, d = Math.hypot(dx, dy) || 1;
      const w = this.warmth(h.x, h.y);
      // day, a flight, or too far away: they fade back into the grey
      if (h.mode !== 'leave' && (dark < 0.4 || flying || d > H.leave * T)) h.mode = 'leave';

      if (h.mode === 'leave') {
        h.a -= dt * 0.7;
        h.vx += (-dx / d * 20 - h.vx) * Math.min(1, dt * 2); h.vy += (-dy / d * 20 - 10 - h.vy) * Math.min(1, dt * 2);
      } else if (h.mode === 'cling') {
        // circling close, held on by a thin dark thread, sipping your glow
        h.a = Math.min(1, h.a + dt);
        h.ang += dt * (0.9 + h.seed * 0.5);
        const r = H.orbit + Math.sin(h.ph * 1.7) * 3;
        const tx = p.x + Math.cos(h.ang) * r, ty = p.y - 12 + Math.sin(h.ang) * r * 0.6;
        h.vx = (tx - h.x) * 6; h.vy = (ty - h.y) * 6;
        p.glow -= H.drain * (this.hasCharm() ? G.HUSH.charm.drain : 1) * dt;
        if (p.glow <= H.minGlow) sated = true;
      } else {   // 'drift': toward your light, but never on their own into bright land
        h.a = Math.min(1, h.a + dt * 0.6);
        const sp = H.speed * (0.8 + 0.4 * h.seed);
        let vx = dx / d * sp + Math.cos(h.ph * 1.3 + h.seed * 9) * 14, vy = dy / d * sp + Math.sin(h.ph * 1.1) * 10;
        const nx = h.x + vx * 0.4, ny = h.y + vy * 0.4;
        if (w < H.easeAt && this.warmth(nx, ny) > H.warm && this.warmth(nx, ny) > w) {   // the light's edge: hover there, eyes glinting
          vx = -dx / d * 8 + Math.cos(h.ph * 2.1) * 10; vy = Math.sin(h.ph * 1.7) * 8;
        }
        h.vx += (vx - h.vx) * Math.min(1, dt * 2.5); h.vy += (vy - h.vy) * Math.min(1, dt * 2.5);
        if (d < H.clingAt && sipping < H.clingMax && h.e < 0.3) {
          h.mode = 'cling'; h.ang = Math.atan2(h.y - p.y + 12, h.x - p.x);
          this.fx.sound('hushcling', h.x);
        }
      }
      h.x += h.vx * dt; h.y += h.vy * dt;
      if (h.push) { h.x += h.push.x * dt; h.y += h.push.y * dt; h.push.x *= 1 - Math.min(1, dt * 3); h.push.y *= 1 - Math.min(1, dt * 3); }

      // light eases them: dragged into a lantern's glow (or a Moon lantern's calm), they slowly brighten
      if (h.mode !== 'leave') {
        if (w > H.easeAt) h.e += dt * (w - 0.3) / (0.7 * H.easeTime);
        else h.e = Math.max(0, h.e - dt * 0.04);
      }
      if (h.mode === 'leave' && w > H.easeAt && h.a > 0.3) h.e += dt / H.easeTime;   // one caught by the dawn near a lantern still eases

      // meeting one for the first time
      if (!this.stats().met && h.a > 0.5 && d < 6 * T && !flying) this.meet();
    }

    if (sated) this.sated();
    for (const h of this.list) if (h.e >= 1) this.ease(h);
    this.list = this.list.filter(h => h.e < 1 && h.a > 0);

    // a soft sigh now and then while one is close
    const near = this.list.find(h => h.mode !== 'leave' && Math.hypot(h.x - p.x, h.y - p.y) < 6 * T);
    if (near && (this.whisperT -= dt) <= 0) { this.whisperT = G.rand(H.whisper[0], H.whisper[1]); this.fx.sound('hush', near.x); }

    // "your light is getting small"
    if (p.glow < 0.5 && sipping && !this.lowSaid) { this.lowSaid = 1; this.fx.ui.toast(G.HUSH_SAYS.low, 4); }
    if (p.glow > 0.9) this.lowSaid = 0;

    this.updateMotes(dt);
    for (const r of this.rings) r.t += dt;
    this.rings = this.rings.filter(r => r.t < 0.9);
  }

  canCome(here) {
    const s = this.state, H = G.HUSH;
    return this.dark() > H.dark && here < H.greyAt && s.world.litCount() >= H.minLit && this.calmAt(s.player.x, s.player.y) > 2;
  }

  trySpawn(here) {
    const s = this.state, p = s.player, H = G.HUSH, T = G.TILE;
    const cap = Math.min(H.cap, 1 + Math.round((1 - here / H.greyAt) * (H.cap - 1)));
    if (this.list.filter(h => h.mode !== 'leave').length >= cap) return;
    const a = Math.random() * 6.2832, r = G.rand(H.dist[0], H.dist[1]) * T;
    const x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r;
    if (this.warmth(x, y) > H.spawnGrey) return;
    this.list.push({ x, y, vx: 0, vy: 0, a: 0, mode: 'drift', e: 0, ph: Math.random() * 6, size: G.rand(0.85, 1.15),
      seed: Math.random(), ang: 0 });
  }

  meet() {
    const st = this.stats();
    st.met = 1;
    this.fx.sound('hushmeet');
    const touch = !matchMedia('(hover: hover) and (pointer: fine)').matches;
    this.fx.ui.toast(touch ? G.HUSH_SAYS.meetTouch : G.HUSH_SAYS.meet, 9);
    this.fx.ui.refresh();
  }

  // the spirit's light is as small as it can go: the hushlings let go and drift away, full
  sated() {
    for (const h of this.list) if (h.mode === 'cling') { h.mode = 'leave'; h.a = Math.min(h.a, 1); }
    this.state.player.glow = G.HUSH.minGlow;
    this.stats().dimmed++;
    this.rest = G.HUSH.rest;
    this.fx.ui.toast(G.HUSH_SAYS.dim, 6);
    this.fx.sound('hushsated');
  }

  // ---------- Shine (F): a ring of light from the spirit ----------
  shine() {
    const s = this.state, p = s.player, H = G.HUSH, c = this.hasCharm() ? H.charm : null;
    if (s.travel && s.travel.trip) return false;
    if (this.cool > 0) return false;
    if (p.glow < H.minGlow + H.shine.cost * 0.5) { this.fx.ui.toast(G.HUSH_SAYS.shineLow, 3.5); G.Sound.play('deny'); return false; }
    p.glow = Math.max(H.minGlow, p.glow - H.shine.cost);
    this.cool = H.shine.cooldown;
    const R = H.shine.radius * (c ? c.radius : 1);
    this.rings.push({ x: p.x, y: p.y - 10, t: 0, r: R });
    this.stats().shines++;
    this.fx.sound('shine', p.x);
    this.fx.burst(p.x, p.y - 12, 'rgba(255,240,200,A)', 14);
    for (const h of this.list) {
      const dx = h.x - p.x, dy = h.y - (p.y - 10), d = Math.hypot(dx, dy) || 1;
      if (d > R || h.mode === 'leave') continue;
      h.e += (c ? c.ease : H.shine.ease) * (1 - d / R * 0.2);
      if (h.mode === 'cling') h.mode = 'drift';
      h.push = { x: dx / d * H.shine.push, y: dy / d * H.shine.push };
    }
    return true;
  }

  // ---------- a hushling remembers the light ----------
  ease(h) {
    const st = this.stats(), first = !st.eased;
    st.eased++;
    this.fx.burst(h.x, h.y, 'rgba(225,230,255,A)', 18);
    this.fx.burst(h.x, h.y, 'rgba(255,240,170,A)', 8);
    this.fx.fireflies(h.x, h.y, 4);
    this.fx.sound('hushease', h.x);
    this.motes.push({ x: h.x, y: h.y, t: 0, vx: h.vx * 0.3, vy: -40 });
    const un = this.state.stats.unlocked || (this.state.stats.unlocked = []);
    if (first) {
      if (!un.includes('moonlantern')) un.push('moonlantern');
      this.fx.ui.toast(G.HUSH_SAYS.firstEase, 8);
      this.fx.ui.refresh();
    } else if (st.eased === G.HUSH.unlockCharm && !un.includes('charm')) {
      un.push('charm');
      setTimeout(() => this.fx.ui.toast(G.HUSH_SAYS.charm.replace('{n}', st.eased), 7), 1600);
      this.fx.ui.refresh();
    } else if (Math.random() < 0.5) this.fx.ui.toast(G.HUSH_SAYS.ease[st.eased % G.HUSH_SAYS.ease.length], 3);
  }

  // starlight rises, hangs a moment, then glides into the spirit
  updateMotes(dt) {
    const p = this.state.player;
    for (const m of this.motes) {
      m.t += dt;
      if (m.t < 0.7) { m.x += m.vx * dt; m.y += m.vy * dt; m.vy *= 1 - Math.min(1, dt * 3); }
      else {
        const dx = p.x - m.x, dy = (p.y - 12) - m.y, d = Math.hypot(dx, dy) || 1, sp = Math.min(d / dt, 120 + (m.t - 0.7) * 500);
        m.x += dx / d * sp * dt; m.y += dy / d * sp * dt;
        if (d < 8 && !m.gave) {
          m.gave = true;
          this.state.inv.starlight = (this.state.inv.starlight || 0) + 1;
          const got = this.state.stats.got; got.starlight = (got.starlight || 0) + 1;
          this.fx.floater(p.x, p.y - 34, '+1 Starlight', G.ITEMS.starlight.color);
          this.fx.sound('starlight', p.x);
          this.fx.ui.refresh();
        }
      }
    }
    this.motes = this.motes.filter(m => !m.gave && m.t < 6);
  }

  // extra holes in the night: a Shine spreading out, easing hushlings glowing (screen coords)
  holes(out, camX, camY) {
    for (const r of this.rings) {
      const k = r.t / 0.9;
      out.push({ x: r.x - camX, y: r.y - camY, r: r.r * Math.min(1, k * 2.2), hue: 48, a: (1 - k) * 0.9 });
    }
    for (const h of this.list) if (h.e > 0.15) out.push({ x: h.x - camX, y: h.y - camY, r: 30 * h.e, hue: 228 });
    for (const m of this.motes) out.push({ x: m.x - camX, y: m.y - camY, r: 26, hue: 230 });
  }
};
