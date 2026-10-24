// The map: a round minimap in the corner and a big map you open with M.
// Explored land is drawn one pixel per tile into small cached chunk images
// (colour where the land is restored, grey where it is still faded).
window.G = window.G || {};

// hsl (0-360, 0-100, 0-100) -> [r, g, b] 0-255
G.hslToRgb = function (h, s, l) {
  h = ((h % 360) + 360) % 360 / 360; s /= 100; l /= 100;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = t => {
    t = (t + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
};

G.Minimap = class {
  constructor(state) {
    this.state = state;
    this.images = new Map();     // chunk key -> { canvas, lv }
    this.small = document.getElementById('minimap');
    this.sctx = this.small.getContext('2d');
    this.big = document.getElementById('bigmap');
    this.bcanvas = document.getElementById('bigmap-canvas');
    this.bctx = this.bcanvas.getContext('2d');
    this.isOpen = false;
    this.zoom = 6;               // big map: screen px per tile
    this.pan = { x: 0, y: 0 };   // big map: offset (in tiles) from the player
    this.timer = 0;
    this.lv = -1;                // lights version the images were drawn with

    this.small.addEventListener('click', () => this.toggle(true));
    document.getElementById('bigmap-close').onclick = () => this.toggle(false);
    this.bindBigMap();
  }

  // ---------- chunk images ----------
  drawChunk(key, img) {
    const { world, explored } = this.state, C = G.CHUNK;
    const mask = explored.chunks.get(key);
    const [cx, cy] = key.split(',').map(Number);
    if (!img) {
      const c = document.createElement('canvas'); c.width = c.height = C;
      img = { canvas: c, ctx: c.getContext('2d') };
      img.data = img.ctx.createImageData(C, C);
      this.images.set(key, img);
    }
    const d = img.data.data;
    for (let j = 0; j < C; j++) for (let i = 0; i < C; i++) {
      const n = j * C + i, o = n * 4;
      if (!mask || !mask[n]) { d[o + 3] = 0; continue; }
      const tx = cx * C + i, ty = cy * C + j;
      const t = world.tileAt(tx, ty), def = G.TILES[t.type];
      const f = world.restoreAt((tx + 0.5) * G.TILE, (ty + 0.5) * G.TILE, world.lights);
      let h = def.h, s = def.s, l = def.l + (t.soft - 0.5) * 6;
      const st = world.structures.get(G.key(tx, ty));
      const sd = st && G.STRUCTURES[st.type];
      if (sd && sd.map) { [h, s, l] = sd.map; }
      else if (t.obj === 'tree') { h += 6; l -= 9; }
      else if (t.obj === 'rock') { s = 6; l = 58; }
      else if (t.obj === 'bloom' && f > 0.3) { h = t.hue; s = 80; l = 68; }
      const S = s * (0.1 + 0.9 * f), L = l * (0.66 + 0.4 * f);
      const [r, g, b] = G.hslToRgb(h, S, Math.min(92, L));
      d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255;
    }
    img.ctx.putImageData(img.data, 0, 0);
    img.lv = world.lightsVersion;
    return img;
  }

  // Redraw a few stale chunk images per frame so nothing ever stutters.
  refreshImages(budget) {
    const ex = this.state.explored, lv = this.state.world.lightsVersion;
    for (const k of ex.dirty) {
      if (budget-- <= 0) return;
      ex.dirty.delete(k);
      this.drawChunk(k, this.images.get(k));
    }
    if (this.lv !== lv) {
      // lights changed: recolour chunks, nearest to the player first
      const p = this.state.player, C = G.CHUNK * G.TILE;
      const stale = [...this.images.entries()].filter(([, im]) => im.lv !== lv);
      if (!stale.length) { this.lv = lv; return; }
      stale.sort((a, b) => this.chunkDist(a[0], p, C) - this.chunkDist(b[0], p, C));
      for (const [k, im] of stale) { if (budget-- <= 0) return; this.drawChunk(k, im); }
    }
  }
  chunkDist(k, p, C) { const [x, y] = k.split(','); return Math.abs((+x + 0.5) * C - p.x) + Math.abs((+y + 0.5) * C - p.y); }

  // Invalidate the chunk image under a tile (after building there).
  touch(tx, ty) {
    const { cx, cy } = G.Explored.chunkOf(tx, ty);
    this.state.explored.dirty.add(cx + ',' + cy);
  }

  // ---------- drawing ----------
  // Draw the explored world into ctx so that tile (ox, oy) is at (sx, sy), `s` px per tile.
  drawWorld(ctx, ox, oy, sx, sy, s, w, h) {
    const C = G.CHUNK;
    const tx0 = ox - sx / s, ty0 = oy - sy / s, tx1 = tx0 + w / s, ty1 = ty0 + h / s;
    ctx.imageSmoothingEnabled = false;
    for (let cy = Math.floor(ty0 / C); cy <= Math.floor(ty1 / C); cy++)
      for (let cx = Math.floor(tx0 / C); cx <= Math.floor(tx1 / C); cx++) {
        const im = this.images.get(cx + ',' + cy);
        if (!im) continue;
        ctx.drawImage(im.canvas, sx + (cx * C - ox) * s, sy + (cy * C - oy) * s, C * s + 0.5, C * s + 0.5);
      }
  }

  drawMarkers(ctx, ox, oy, sx, sy, s, t, big) {
    const { world, player } = this.state, T = G.TILE;
    const toX = px => sx + (px / T - ox) * s, toY = py => sy + (py / T - oy) * s;
    ctx.globalCompositeOperation = 'lighter';
    for (const L of world.lights) {
      if (!L.restore) continue;
      const x = toX(L.x), y = toY(L.y);
      if (!big && Math.hypot(x - sx, y - sy) > 90) continue;
      const heart = L.restore >= 9;
      const r = (heart ? 9 : 6) * (big ? 1.2 : 1);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, heart ? 'rgba(255,240,190,.95)' : 'rgba(255,214,130,.9)');
      g.addColorStop(1, 'rgba(255,190,90,0)');
      ctx.fillStyle = g; G.circle(ctx, x, y, r);
    }
    ctx.globalCompositeOperation = 'source-over';
    for (const L of world.lights) {
      if (!L.restore) continue;
      const x = toX(L.x), y = toY(L.y);
      ctx.fillStyle = L.restore >= 9 ? '#fff6dc' : '#ffd77a';
      if (L.restore >= 9) { ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x + 3, y); ctx.lineTo(x, y + 4); ctx.lineTo(x - 3, y); ctx.fill(); }
      else G.circle(ctx, x, y, 1.6);
    }
    // the player: a soft pulsing light
    const px = toX(player.x), py = toY(player.y), pulse = 0.5 + 0.5 * Math.sin(t * 3);
    ctx.strokeStyle = `rgba(255,250,235,${0.25 + 0.35 * (1 - pulse)})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(px, py, 4 + pulse * 4, 0, 6.2832); ctx.stroke();
    ctx.fillStyle = '#fffaf0'; G.circle(ctx, px, py, 2.6);
    ctx.fillStyle = '#ffd77a'; G.circle(ctx, px, py, 1.4);
  }

  drawSmall(t) {
    const c = this.small, ctx = this.sctx, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = c.clientWidth || 160;
    if (c.width !== Math.round(W * dpr)) { c.width = c.height = Math.round(W * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, W);
    ctx.save();
    ctx.beginPath(); ctx.arc(W / 2, W / 2, W / 2 - 1, 0, 6.2832); ctx.clip();
    ctx.fillStyle = '#0d1029'; ctx.fillRect(0, 0, W, W);
    const p = this.state.player, s = 2;
    this.drawWorld(ctx, p.x / G.TILE, p.y / G.TILE, W / 2, W / 2, s, W, W);
    // gentle night tint
    const dark = 1 - G.daylight(this.state.time);
    if (dark > 0.02) { ctx.fillStyle = `rgba(8,10,40,${dark * 0.35})`; ctx.fillRect(0, 0, W, W); }
    this.drawMarkers(ctx, p.x / G.TILE, p.y / G.TILE, W / 2, W / 2, s, t, false);
    // soft inner edge
    const g = ctx.createRadialGradient(W / 2, W / 2, W * 0.32, W / 2, W / 2, W / 2);
    g.addColorStop(0, 'rgba(10,12,34,0)'); g.addColorStop(1, 'rgba(10,12,34,.75)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, W);
    ctx.restore();
    // north mark
    ctx.fillStyle = 'rgba(255,215,122,.85)'; ctx.font = '10px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText('N', W / 2, 12);
  }

  drawBig(t) {
    const c = this.bcanvas, ctx = this.bctx, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = c.clientWidth, H = c.clientHeight;
    if (!W || !H) return;
    if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0b0e26'; ctx.fillRect(0, 0, W, H);
    // faint star-paper texture behind unexplored land
    ctx.fillStyle = 'rgba(255,230,170,.05)';
    for (let i = 0; i < 70; i++) { const a = G.hash2(i, 3, 77), b = G.hash2(i, 9, 77); ctx.fillRect(a * W, b * H, 1.5, 1.5); }
    const p = this.state.player, s = this.zoom;
    const ox = p.x / G.TILE + this.pan.x, oy = p.y / G.TILE + this.pan.y;
    this.drawWorld(ctx, ox, oy, W / 2, H / 2, s, W, H);
    this.drawMarkers(ctx, ox, oy, W / 2, H / 2, s, t, true);
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7);
    g.addColorStop(0, 'rgba(11,14,38,0)'); g.addColorStop(1, 'rgba(11,14,38,.7)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const ex = this.state.explored.count, lit = this.state.world.lights.length - 1;
    document.getElementById('bigmap-info').textContent =
      `${ex.toLocaleString()} tiles explored · ${lit} lantern${lit === 1 ? '' : 's'} lit`;
  }

  // ---------- big map controls ----------
  toggle(force) {
    const open = force === undefined ? !this.isOpen : force;
    if (open === this.isOpen) return;
    this.isOpen = open;
    this.big.classList.toggle('open', open);
    document.body.classList.toggle('map-open', open);
    G.Sound.play(open ? 'mapOpen' : 'close');
    if (open) { this.pan.x = this.pan.y = 0; this.state.stats.mapOpened = (this.state.stats.mapOpened || 0) + 1; }
  }

  bindBigMap() {
    const c = this.bcanvas;
    let drag = null;
    const start = (x, y) => { drag = { x, y, px: this.pan.x, py: this.pan.y }; };
    const move = (x, y) => {
      if (!drag) return;
      this.pan.x = drag.px - (x - drag.x) / this.zoom;
      this.pan.y = drag.py - (y - drag.y) / this.zoom;
    };
    c.addEventListener('mousedown', e => start(e.clientX, e.clientY));
    window.addEventListener('mousemove', e => move(e.clientX, e.clientY));
    window.addEventListener('mouseup', () => { drag = null; });
    c.addEventListener('touchstart', e => { const p = e.touches[0]; start(p.clientX, p.clientY); e.preventDefault(); }, { passive: false });
    c.addEventListener('touchmove', e => { const p = e.touches[0]; move(p.clientX, p.clientY); e.preventDefault(); }, { passive: false });
    c.addEventListener('touchend', () => { drag = null; });
    c.addEventListener('dblclick', () => { this.pan.x = this.pan.y = 0; });
    c.addEventListener('wheel', e => { e.preventDefault(); this.zoomBy(e.deltaY < 0 ? 1 : -1); }, { passive: false });
    document.getElementById('bigmap-in').onclick = () => this.zoomBy(1);
    document.getElementById('bigmap-out').onclick = () => this.zoomBy(-1);
    document.getElementById('bigmap-home').onclick = () => { this.pan.x = this.pan.y = 0; };
  }

  zoomBy(dir) {
    const steps = [1.5, 2, 3, 4, 6, 8, 12];
    let i = steps.indexOf(this.zoom); if (i < 0) i = 4;
    this.zoom = steps[G.clamp(i + dir, 0, steps.length - 1)];
  }

  // ---------- per frame ----------
  update(dt, t) {
    const ex = this.state.explored, p = this.state.player;
    if (p.tx !== this.lastTx || p.ty !== this.lastTy) {
      this.lastTx = p.tx; this.lastTy = p.ty;
      ex.reveal(p.tx, p.ty, 11);
    }
    this.refreshImages(this.isOpen ? 24 : 6);
    this.timer -= dt;
    if (this.isOpen) this.drawBig(t);
    else if (this.timer <= 0) { this.timer = 1 / 20; this.drawSmall(t); }
  }
};
