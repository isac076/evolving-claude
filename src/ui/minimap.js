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
      const t = world.tileAt(tx, ty), def = G.SEASON_NOW.tiles[t.type];   // this season's colours
      const f = world.restoreAt((tx + 0.5) * G.TILE, (ty + 0.5) * G.TILE, world.lights);
      let h = def.h, s = def.s, l = def.l + (t.soft - 0.5) * 6;
      const st = world.structures.get(G.key(tx, ty));
      const sd = st && G.STRUCTURES[st.type];
      if (sd && sd.map) { [h, s, l] = sd.map; }
      else if (t.obj === 'tree') { h += 6; l -= 9; }
      else if (t.obj === 'rock') { s = 6; l = 58; }
      else if (t.obj === 'bloom' && f > 0.3) { h = t.hue; s = 80; l = 68; }
      else if (t.obj && G.OBJECTS[t.obj].ruin) { h = 36; s = 16; l = 74; }   // old stones (Night 11)
      else if (t.pave && t.shrine) { h = 22; s = 40; l = 58; }   // ember flagstones (Night 15)
      else if (t.pave) { h = 36; s = 12; l = 60; }
      const S = s * (0.1 + 0.9 * f), L = l * (0.66 + 0.4 * f);
      const [r, g, b] = G.hslToRgb(h, S, Math.min(92, L));
      d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255;
    }
    img.ctx.putImageData(img.data, 0, 0);
    img.lv = this.version();
    return img;
  }

  // the images need redrawing when the lights change — or the season turns the land another colour
  version() { return this.state.world.lightsVersion + ':' + G.Seasons.version; }

  // Redraw a few stale chunk images per frame so nothing ever stutters.
  refreshImages(budget) {
    const ex = this.state.explored, lv = this.version();
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
      const heart = L.type === 'heart', beacon = L.type === 'beacon';
      const r = (heart || beacon ? 9 : 6) * (big ? 1.2 : 1);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const lh = G.STRUCTURES[L.type].lightHue;   // a coloured light (the mushroom lamp's teal)
      g.addColorStop(0, heart ? 'rgba(255,240,190,.95)' : beacon ? 'rgba(170,240,255,.95)' : lh !== undefined ? `hsla(${lh},85%,72%,.95)` : 'rgba(255,214,130,.9)');
      g.addColorStop(1, beacon ? 'rgba(90,190,255,0)' : lh !== undefined ? `hsla(${lh},85%,60%,0)` : 'rgba(255,190,90,0)');
      ctx.fillStyle = g; G.circle(ctx, x, y, r);
    }
    ctx.globalCompositeOperation = 'source-over';
    for (const L of world.lights) {
      if (!L.restore) continue;
      const x = toX(L.x), y = toY(L.y);
      const big9 = L.type === 'heart' || L.type === 'beacon';
      ctx.fillStyle = L.type === 'heart' ? '#fff6dc' : L.type === 'beacon' ? '#dff8ff' : G.STRUCTURES[L.type].lightHue !== undefined ? '#c8fff0' : '#ffd77a';
      if (big9) { ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x + 3, y); ctx.lineTo(x, y + 4); ctx.lineTo(x - 3, y); ctx.fill(); }
      else G.circle(ctx, x, y, 1.6);
    }
    // ruins you have found: a pale stone mark, gold once its memory stone is awake
    const found = (this.state.stats.ruins && this.state.stats.ruins.found) || {};
    for (const id in found) {
      const [cx, cy] = id.split(',').map(Number), site = G.Ruins.siteOf(world, cx, cy);
      if (!site) continue;
      const x = toX((site.tx + 0.5) * T), y = toY((site.ty + 0.5) * T);
      if (!big && Math.hypot(x - sx, y - sy) > 84) continue;
      const read = G.Ruins.isRead(world, site), r = big ? 4.5 : 3.5;
      ctx.fillStyle = 'rgba(10,12,30,.55)'; ctx.fillRect(x - r - 1, y - r - 1, r * 2 + 2, r * 2 + 2);
      ctx.strokeStyle = read ? '#ffd77a' : 'rgba(225,228,240,.9)'; ctx.lineWidth = 1.3;
      ctx.strokeRect(x - r, y - r, r * 2, r * 2);
      ctx.fillStyle = read ? '#ffd77a' : 'rgba(225,228,240,.7)';
      ctx.fillRect(x - r + 2, y - 0.6, r * 2 - 4, 1.2); ctx.fillRect(x - 0.6, y - r + 2, 1.2, r * 2 - 4);
    }
    // the Ember Shrines you know of (Night 15): a flame mark in the shrine's colour — hollow while cold, bright once kindled
    for (const site of G.Shrines.known(this.state)) {
      let x = toX((site.tx + 0.5) * T), y = toY((site.ty + 0.5) * T);
      const lit = G.Shrines.isKindled(world, site), dx = x - sx, dy = y - sy, dd = Math.hypot(dx, dy);
      if (!big && dd > 66) { x = sx + dx / dd * 66; y = sy + dy / dd * 66; }   // on the corner map, far shrines sit on the rim
      if (big) {   // on the big map, shrines beyond the view wait at its edge (sx, sy is the middle of the view)
        const k = Math.min(1, Math.abs(dx) > 0 ? (sx - 18) / Math.abs(dx) : 1, Math.abs(dy) > 0 ? (sy - 28) / Math.abs(dy) : 1);
        x = sx + dx * k; y = sy + dy * k;
      }
      const r = big ? 6 : 4.5, fl = 0.5 + 0.5 * Math.sin(t * 3 + site.i);
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.4);
      g.addColorStop(0, `hsla(${site.hue},100%,62%,${lit ? 0.75 : 0.25 + fl * 0.2})`); g.addColorStop(1, `hsla(${site.hue},100%,60%,0)`);
      ctx.fillStyle = g; G.circle(ctx, x, y, r * 2.4);
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath(); ctx.moveTo(x, y - r * 1.3); ctx.quadraticCurveTo(x + r, y, x, y + r * 0.8); ctx.quadraticCurveTo(x - r, y, x, y - r * 1.3);
      if (lit) { ctx.fillStyle = `hsl(${site.hue + 15},100%,78%)`; ctx.fill(); }
      else { ctx.strokeStyle = `hsla(${site.hue},90%,72%,.95)`; ctx.lineWidth = 1.3; ctx.stroke(); }
      if (big) {
        ctx.font = 'italic 12px Georgia, serif'; ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(10,12,30,.7)'; ctx.fillText(site.name, x + 1, y - r * 1.6);
        ctx.fillStyle = lit ? '#ffe2b8' : '#e8dccb'; ctx.fillText(site.name, x, y - r * 1.6 - 1);
      }
    }
    // lost spirits you have seen (pale, pulsing) and friends at home (their own colour)
    const folk = this.state.villagers;
    if (folk) {
      const ex = this.state.explored, pulse2 = 0.5 + 0.5 * Math.sin(t * 2.2), lost = [];
      const f = folk.firstSpot(world); if (f) lost.push(f);
      const C = G.CHUNK, hw = (big ? this.bcanvas.clientWidth / 2 : 90) / s, hh = (big ? this.bcanvas.clientHeight / 2 : 90) / s;
      for (let cy = Math.floor((oy - hh) / C); cy <= Math.floor((oy + hh) / C); cy++)
        for (let cx = Math.floor((ox - hw) / C); cx <= Math.floor((ox + hw) / C); cx++) {
          if (!ex.chunks.has(cx + ',' + cy)) continue;
          const sp = folk.spotOf(world, cx, cy); if (sp) lost.push(sp);
        }
      for (const sp of lost) {
        if (folk.taken(sp.id) || !ex.has(sp.tx, sp.ty)) continue;
        const x = toX((sp.tx + 0.5) * T), y = toY((sp.ty + 0.5) * T);
        if (!big && Math.hypot(x - sx, y - sy) > 86) continue;
        ctx.fillStyle = `rgba(215,220,255,${0.18 + 0.2 * pulse2})`; G.circle(ctx, x, y, 3.5 + pulse2 * 2.5);
        ctx.fillStyle = 'rgba(235,238,255,.95)'; G.circle(ctx, x, y, 1.6);
      }
      for (const v of folk.list) {
        const x = toX(v.x), y = toY(v.y);
        if (!big && Math.hypot(x - sx, y - sy) > 86) continue;
        ctx.fillStyle = `hsl(${v.hue},70%,72%)`; G.circle(ctx, x, y, big ? 1.8 : 1.3);
      }
    }
    // villages (Night 13): a little house mark, and the name on the big map
    if (this.state.village) for (const vil of this.state.village.list) {
      const w = vil.has.well;
      if (!w) continue;
      const x = toX((w.tx + 0.5) * T), y = toY((w.ty + 0.5) * T);
      if (!big && Math.hypot(x - sx, y - sy) > 84) continue;
      ctx.fillStyle = '#ffe2b0';
      ctx.beginPath(); ctx.moveTo(x - 3.5, y); ctx.lineTo(x, y - 3.5); ctx.lineTo(x + 3.5, y); ctx.lineTo(x + 3.5, y + 3); ctx.lineTo(x - 3.5, y + 3); ctx.closePath(); ctx.fill();
      if (big && vil.name) {
        ctx.font = 'italic 12px Georgia, serif'; ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(10,12,30,.7)'; ctx.fillText(vil.name, x + 1, y - 7);
        ctx.fillStyle = '#ffe9c4'; ctx.fillText(vil.name, x, y - 8);
      }
    }
    if (this.state.signs) this.state.signs.drawMap(ctx, toX, toY, big, sx, sy);   // named places (Night 18)
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
    this.drawRoads(ctx, ox, oy, W / 2, H / 2, s, t, W, H);
    const ex = this.state.explored.count, lit = this.state.world.litCount();
    const fr = this.state.villagers ? this.state.villagers.list.length : 0;
    document.getElementById('bigmap-info').textContent =
      `${ex.toLocaleString()} tiles explored · ${lit} lantern${lit === 1 ? '' : 's'} lit` + (fr ? ` · ${fr} friend${fr === 1 ? '' : 's'} home` : '');
  }

  // ---------- the lantern roads (Night 16) ----------
  // Beside a light, threads of light run from it to every other light; the one under
  // the pointer grows and shows its name. Clicking it sets off (G.Travel.go).
  drawRoads(ctx, ox, oy, sx, sy, s, t, W, H) {
    const tr = this.travel, T = G.TILE;
    this.stopsOnScreen = [];
    const help = document.getElementById('bigmap-help');
    if (!tr) return;
    const here = tr.here(), stops = tr.stops();
    if (help) help.textContent = here && stops.length > 1 ? G.TRAVEL_SAYS.mapNear : G.TRAVEL_SAYS.mapFar;
    if (!here || stops.length < 2) return;
    const toX = px => sx + (px / T - ox) * s, toY = py => sy + (py / T - oy) * s;
    const hx = toX(here.x), hy = toY(here.y);
    let hover = null, hd = G.TRAVEL.pick;
    for (const L of stops) {
      const x = toX(L.x), y = toY(L.y);
      this.stopsOnScreen.push({ L, x, y });
      if (L !== here && this.hover) { const d = Math.hypot(x - this.hover.x, y - this.hover.y); if (d < hd) { hd = d; hover = { L, x, y }; } }
    }
    this.hoverStop = hover;
    this.bcanvas.style.cursor = hover ? 'pointer' : '';
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (const o of this.stopsOnScreen) {
      if (o.L === here) continue;
      const on = hover && hover.L === o.L, dx = o.x - hx, dy = o.y - hy, len = Math.hypot(dx, dy) || 1;
      const side = G.hash2(Math.floor(o.L.x / T), Math.floor(here.x / T), 61) < 0.5 ? -1 : 1, bend = len * G.TRAVEL.bend * side;
      const cx = (hx + o.x) / 2 - dy / len * bend, cy = (hy + o.y) / 2 + dx / len * bend;
      ctx.setLineDash(on ? [] : [2, 6]); ctx.lineDashOffset = -t * 14;
      ctx.lineWidth = on ? 2.4 : 1.3;
      ctx.strokeStyle = on ? 'rgba(255,232,170,.85)' : 'rgba(255,215,140,.32)';
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo(cx, cy, o.x, o.y); ctx.stroke();
    }
    ctx.setLineDash([]);
    // a soft ring on every stop; the one you stand by breathes gold
    const pulse = 0.5 + 0.5 * Math.sin(t * 3);
    for (const o of this.stopsOnScreen) {
      const me = o.L === here, on = hover && hover.L === o.L, def = G.TRAVEL_STOPS[o.L.type] || { hue: 40 };
      const r = me ? 8 + pulse * 3 : on ? 11 : 6.5;
      ctx.lineWidth = on ? 2.2 : 1.3;
      ctx.strokeStyle = `hsla(${o.L.hue !== undefined ? o.L.hue : def.hue},95%,${on ? 80 : 72}%,${me ? 0.5 + pulse * 0.4 : on ? 0.95 : 0.55})`;
      ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, 6.2832); ctx.stroke();
      if (on) {
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, 24);
        g.addColorStop(0, 'rgba(255,235,180,.45)'); g.addColorStop(1, 'rgba(255,220,150,0)');
        ctx.fillStyle = g; G.circle(ctx, o.x, o.y, 24);
      }
    }
    ctx.restore();
    if (hover) {   // the name, and how long the flight is
      const name = this.travel.nameOf(hover.L), tiles = Math.round(Math.hypot(hover.L.x - here.x, hover.L.y - here.y) / T);
      ctx.font = 'italic 13px Georgia, serif'; ctx.textAlign = 'center';
      const y = hover.y + 26 > this.bcanvas.clientHeight - 20 ? hover.y - 30 : hover.y + 26, x = G.clamp(hover.x, 80, W - 80);
      const sub = `${tiles} steps · ${'ontouchstart' in window ? 'tap' : 'click'} to fly`;
      const bw = Math.max(ctx.measureText(name).width, sub.length * 5.6) + 18;
      ctx.fillStyle = 'rgba(12,14,36,.82)'; ctx.strokeStyle = 'rgba(255,215,140,.45)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - bw / 2, y - 15, bw, 34, 8) : ctx.rect(x - bw / 2, y - 15, bw, 34); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff0cc'; ctx.fillText(name, x, y);
      ctx.font = '11px Georgia, serif';
      ctx.fillStyle = 'rgba(255,230,180,.75)'; ctx.fillText(sub, x, y + 14);
    }
  }

  // a click or tap on the big map (not a drag): fly to the light under it
  pick(x, y) {
    if (!this.travel || !this.travel.here()) return false;
    let best = null, bd = G.TRAVEL.pick + 4;
    for (const o of this.stopsOnScreen || []) { const d = Math.hypot(o.x - x, o.y - y); if (d < bd) { bd = d; best = o; } }
    if (!best) return false;
    this.travel.go(best.L);
    return true;
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
    const start = (x, y) => { drag = { x, y, px: this.pan.x, py: this.pan.y, moved: 0 }; };
    const local = (x, y) => { const r = c.getBoundingClientRect(); return { x: x - r.left, y: y - r.top }; };
    const end = (x, y) => {   // a press that hardly moved is a click
      if (drag && drag.moved < 6 && x !== undefined) { const q = local(x, y); this.pick(q.x, q.y); }
      drag = null;
    };
    const move = (x, y) => {
      if (!drag) return;
      drag.moved = Math.max(drag.moved, Math.hypot(x - drag.x, y - drag.y));
      this.pan.x = drag.px - (x - drag.x) / this.zoom;
      this.pan.y = drag.py - (y - drag.y) / this.zoom;
    };
    c.addEventListener('mousedown', e => start(e.clientX, e.clientY));
    window.addEventListener('mousemove', e => move(e.clientX, e.clientY));
    window.addEventListener('mouseup', e => end(e.target === c ? e.clientX : undefined, e.clientY));
    c.addEventListener('mousemove', e => { this.hover = local(e.clientX, e.clientY); });
    c.addEventListener('mouseleave', () => { this.hover = null; });
    c.addEventListener('touchstart', e => { const p = e.touches[0]; start(p.clientX, p.clientY); this.hover = local(p.clientX, p.clientY); e.preventDefault(); }, { passive: false });
    c.addEventListener('touchmove', e => { const p = e.touches[0]; move(p.clientX, p.clientY); e.preventDefault(); }, { passive: false });
    c.addEventListener('touchend', e => { const p = e.changedTouches[0]; end(p && p.clientX, p && p.clientY); });
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
    if (!p.flying && (p.tx !== this.lastTx || p.ty !== this.lastTy)) {   // not while flying the lantern roads
      this.lastTx = p.tx; this.lastTy = p.ty;
      ex.reveal(p.tx, p.ty, 11);
    }
    this.refreshImages(this.isOpen ? 24 : 6);
    this.timer -= dt;
    if (this.isOpen) this.drawBig(t);
    else if (this.timer <= 0) { this.timer = 1 / 20; this.drawSmall(t); }
  }
};
