// G.Photo (`state.photo`) — photo mode (Night 24). P (or the little camera at the
// top) hides everything but the world: the camera floats free near the spirit,
// zooms, and time can be held still, slowed or hurried towards the sunset. Pick a
// filter and a frame, press Space — the picture is kept in the journal's album
// (a small copy in localStorage 'lumen-album', not in the save) and can be downloaded.
window.G = window.G || {};

(function () {
const ALBUM_KEY = 'lumen-album';

G.Photo = class {
  constructor(state, hooks) {
    this.state = state; this.hooks = hooks;   // { ui, renderer, input, canClose: () => {}, closeAll: () => {} }
    this.$ = id => document.getElementById(id);
    this.isOpen = false;
    this.f = 0; this.fr = 0; this.sp = 1;        // filter, frame and time speed (indexes into the data lists)
    this.zoomGoal = 1; this.drag = null; this.wantShot = false; this.lastUrl = null;
    const tap = (id, fn) => { const b = this.$(id); b.onclick = e => { fn(); b.blur(); e.stopPropagation(); }; };
    tap('btn-photo', () => this.toggle());
    tap('ph-filter', () => this.cycle('f'));
    tap('ph-frame', () => this.cycle('fr'));
    tap('ph-time', () => this.cycle('sp'));
    tap('ph-spirit', () => this.toggleSpirit());
    tap('ph-in', () => this.zoomBy(1));
    tap('ph-out', () => this.zoomBy(-1));
    tap('ph-shutter', () => { this.wantShot = true; });
    tap('ph-done', () => this.toggle(false));
    tap('pk-close', () => this.$('photo-kept').classList.remove('show'));
    this.$('photobar').addEventListener('pointermove', () => { this.idle = 0; });
    hooks.renderer.canvas.addEventListener('wheel', e => {
      if (!this.isOpen) return;
      e.preventDefault();
      this.zoomBy(e.deltaY < 0 ? 1 : -1);
    }, { passive: false });
  }

  get speed() { return G.PHOTO.speeds[this.sp].k; }
  get filterId() { return G.PHOTO_FILTERS[this.f].id; }
  get frameId() { return G.PHOTO_FRAMES[this.fr].id; }

  toggle(force) {
    const open = force === undefined ? !this.isOpen : force, s = this.state;
    if (open === this.isOpen || !s.running) return;
    if (open && !this.hooks.canOpen()) return;
    this.isOpen = open;
    document.body.classList.toggle('photo', open);
    const p = s.player;
    if (open) {
      this.hooks.closeAll();
      const st = s.stats.photo || (s.stats.photo = { taken: 0, opened: 0 });
      st.opened++;
      this.zoomGoal = this.hooks.renderer.zoomGoal;
      this.drag = null; this.idle = 0;
      this.show();
      G.Sound.play('lens');
      const touch = window.matchMedia && window.matchMedia('(hover: none)').matches;
      this.$('ph-help').textContent = touch ? G.PHOTO_SAYS.openTouch : G.PHOTO_SAYS.open;
    } else {
      p.hidden = false;
      document.body.classList.remove('ph-idle');
      this.hooks.renderer.zoomTo(1, 0.05);
      this.$('photo-kept').classList.remove('show');
      G.Sound.play('close');
    }
  }

  cycle(which) {
    const list = which === 'f' ? G.PHOTO_FILTERS : which === 'fr' ? G.PHOTO_FRAMES : G.PHOTO.speeds;
    this[which] = (this[which] + 1) % list.length;
    G.Sound.play('page');
    this.show();
  }
  toggleSpirit() { const p = this.state.player; p.hidden = !p.hidden; G.Sound.play('select'); this.show(); }
  zoomBy(dir) {
    const Z = G.PHOTO.zoom;
    this.zoomGoal = G.clamp(this.zoomGoal * (dir > 0 ? Z.step : 1 / Z.step), Z.min, Z.max);
    if (Math.abs(this.zoomGoal - 1) < 0.04) this.zoomGoal = 1;
    this.hooks.renderer.zoomTo(this.zoomGoal, 0.004);
    this.show();
  }

  // the labels on the photo bar
  show() {
    const set = (id, v) => { this.$(id).querySelector('b').textContent = v; };
    set('ph-filter', G.PHOTO_FILTERS[this.f].name);
    set('ph-frame', G.PHOTO_FRAMES[this.fr].name);
    set('ph-time', G.PHOTO.speeds[this.sp].name);
    set('ph-spirit', this.state.player.hidden ? 'Hidden' : 'Shown');
    this.$('ph-zoom').textContent = Math.round(this.zoomGoal * 100) + '%';
  }

  // keys and dragging while photo mode is open (real time, whatever the world's speed)
  keys(input, dt) {
    if (input.hit('escape', 'p')) { this.toggle(false); return; }
    if (input.hit(' ', 'enter')) this.wantShot = true;
    if (input.hit('f')) this.cycle('f');
    if (input.hit('r')) this.cycle('fr');
    if (input.hit('t')) this.cycle('sp');
    if (input.hit('h')) this.toggleSpirit();
    if (input.hit('+', '=')) this.zoomBy(1);
    if (input.hit('-', '_')) this.zoomBy(-1);
    if (input.hit('n')) this.hooks.ui.toggleSound();
    const R = this.hooks.renderer, z = R.zoom, cam = this.state.cam, s = G.PHOTO.pan / z * dt;
    let dx = 0, dy = 0;
    if (input.held('a', 'arrowleft')) dx -= 1;
    if (input.held('d', 'arrowright')) dx += 1;
    if (input.held('w', 'arrowup')) dy -= 1;
    if (input.held('s', 'arrowdown')) dy += 1;
    if (dx || dy) { const l = Math.hypot(dx, dy); cam.x += dx / l * s; cam.y += dy / l * s; }
    const m = input.mouse;   // drag the world with the mouse or a finger
    // the bar fades away while you just look, and comes back on any key or move
    const moved = m.x !== this.mx || m.y !== this.my; this.mx = m.x; this.my = m.y;
    const busy = moved || m.down || Object.keys(input.pressed).length || Object.values(input.keys).some(Boolean);
    this.idle = busy ? 0 : this.idle + dt;
    document.body.classList.toggle('ph-idle', this.idle > 2.2);
    if (m.down) {
      if (this.drag && !m.clicked) { cam.x -= (m.x - this.drag.x) / z; cam.y -= (m.y - this.drag.y) / z; }
      this.drag = { x: m.x, y: m.y };
    } else this.drag = null;
    // never wander too far from the spirit
    const p = this.state.player, reach = G.PHOTO.reach * G.TILE, d = Math.hypot(cam.x - p.x, cam.y - p.y);
    if (d > reach) { cam.x = p.x + (cam.x - p.x) * reach / d; cam.y = p.y + (cam.y - p.y) * reach / d; }
  }

  // the world goes on at the chosen speed (nothing else of the game runs)
  step(dt) {
    const s = this.state;
    s.time += dt; s.world.time = s.time;
  }

  // where and when, for the frames that write on the picture
  caption() {
    const s = this.state, w = s.world, T = G.TILE, tx = Math.floor(s.cam.x / T), ty = Math.floor(s.cam.y / T);
    let place = '';
    const sign = s.signs && s.signs.near(tx, ty, 12);
    if (sign) place = sign.name;
    const vils = s.village ? s.village.list : [];
    const vil = !place && vils.find(v => v.name && Math.hypot(v.cx - tx, v.cy - ty) < 14);
    if (vil) place = vil.name;
    if (!place && G.Sun.known(s)) { const h = G.Sun.site(w); if (Math.hypot(h.tx - tx, h.ty - ty) < 14) place = h.name; }
    if (!place) for (const sh of G.Shrines.known(s)) if (Math.hypot(sh.tx - tx, sh.ty - ty) < 12) { place = sh.name; break; }
    const ground = w.tileAt(tx, ty).type;
    if (!place && ground === 'mushwood') place = G.Hollow.placeOf(w, tx, ty).name;
    if (!place && ground === 'frost') place = G.Peaks.placeOf(w, tx, ty).name;
    if (!place) place = G.PHOTO_GROUNDS[ground] || 'Somewhere in Lumen';
    const day = Math.floor(s.time / G.DAY_LENGTH) + 1, sn = G.SEASON_NOW;
    const phase = (s.time % G.DAY_LENGTH) / G.DAY_LENGTH;
    const names = ['noon', 'afternoon', 'dusk', 'night', 'night', 'night', 'dawn', 'morning'];
    const when = `Day ${day} · ${sn.def.name.toLowerCase()} ${names[Math.floor(((phase + 0.0625) % 1) * 8)]}`;
    return { place, when, day };
  }

  // after the world is drawn: the filter and the frame, then the shutter if it was pressed
  draw(renderer) {
    if (!this.isOpen) return;
    const ctx = renderer.ctx, W = renderer.W, H = renderer.H;
    ctx.setTransform(renderer.dpr, 0, 0, renderer.dpr, 0, 0);
    G.PhotoFX.filter(ctx, this.filterId, W, H, this.state.time);
    const cap = G.PHOTO_FRAMES[this.fr].caption ? this.caption() : null;
    G.PhotoFX.frame(ctx, this.frameId, W, H, cap);
    if (this.wantShot) { this.wantShot = false; this.shoot(renderer.canvas, cap || this.caption()); }
  }

  // take the photo: a flash, a click, a copy in the album and a full-size download
  shoot(canvas, cap) {
    const s = this.state, st = s.stats.photo || (s.stats.photo = { taken: 0, opened: 0 });
    st.taken++;
    G.Sound.play('shutter');
    const flash = this.$('photo-flash');
    flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
    const tw = Math.min(G.PHOTO.thumb, canvas.width), th = Math.round(canvas.height * tw / canvas.width);
    const t = document.createElement('canvas'); t.width = tw; t.height = th;
    const c = t.getContext('2d'); c.imageSmoothingQuality = 'high';
    c.drawImage(canvas, 0, 0, tw, th);
    let src = '';
    try { src = t.toDataURL('image/jpeg', G.PHOTO.quality); } catch (e) { /* a tainted canvas can't be read — never happens with drawn art */ }
    const kept = src ? G.Photo.keep({ src, place: cap.place, when: cap.when, t: Date.now() }) : 'none';
    const name = `lumen-day${cap.day}-${cap.place.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.png`;
    const link = this.$('pk-download');
    link.download = name; link.removeAttribute('href');
    if (canvas.toBlob) canvas.toBlob(b => {
      if (!b) return;
      if (this.lastUrl) URL.revokeObjectURL(this.lastUrl);
      this.lastUrl = URL.createObjectURL(b); link.href = this.lastUrl;
    }, 'image/png');
    this.$('pk-img').src = src;
    this.$('pk-text').textContent = kept === 'none' ? G.PHOTO_SAYS.noRoom : kept === 'full' ? G.PHOTO_SAYS.full : `${G.PHOTO_SAYS.kept} · ${cap.place}`;
    const card = this.$('photo-kept');
    card.classList.remove('show'); void card.offsetWidth; card.classList.add('show');
    clearTimeout(this.keptTimer);
    this.keptTimer = setTimeout(() => card.classList.remove('show'), 6000);
  }

  // once, on a lovely evening (or under a rainbow), suggest photo mode
  hint() {
    const s = this.state, st = s.stats.photo || (s.stats.photo = { taken: 0, opened: 0 });
    if (st.hinted || st.opened || s.time < (G.PHOTO.hintDay - 1) * G.DAY_LENGTH) return;
    const phase = (s.time % G.DAY_LENGTH) / G.DAY_LENGTH, rainbow = s.weather && s.weather.rainbowA > 0.5;
    if (!rainbow && !(phase > 0.2 && phase < 0.28)) return;
    if (s.world.restoreAt(s.player.x, s.player.y, s.world.lights) < 0.6) return;
    st.hinted = 1;
    const touch = window.matchMedia && window.matchMedia('(hover: none)').matches;
    this.hooks.ui.toast(touch ? G.PHOTO_SAYS.hintTouch : G.PHOTO_SAYS.hint, 6);
  }

  // ---------- the album (localStorage, newest first) ----------
  static album() {
    try { const a = JSON.parse(localStorage.getItem(ALBUM_KEY) || '[]'); return Array.isArray(a) ? a.filter(p => p && p.src) : []; }
    catch (e) { return []; }
  }
  // keep a photo; returns 'ok', 'full' (the oldest was let go) or 'none' (no room at all)
  static keep(photo) {
    let list = [photo, ...G.Photo.album()], out = 'ok';
    if (list.length > G.PHOTO.album) { list = list.slice(0, G.PHOTO.album); out = 'full'; }
    while (list.length) {
      try { localStorage.setItem(ALBUM_KEY, JSON.stringify(list)); return out; }
      catch (e) { if (list.length === 1) break; list.pop(); out = 'full'; }   // too big for storage: let the oldest go
    }
    return 'none';
  }
  static remove(i) {
    const list = G.Photo.album();
    list.splice(i, 1);
    try { localStorage.setItem(ALBUM_KEY, JSON.stringify(list)); } catch (e) {}
  }
};
})();
