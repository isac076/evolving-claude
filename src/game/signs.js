// G.Signs — waymarks (Night 18; data in src/data/riverbank.js). Signposts carry a
// name you type: it floats over the post when you are near, shows on the big map,
// lists on the journal's Places page, and lights near a sign take it on the lantern
// roads ("Lantern at Mossy Bend"). Banners change colour when clicked.
// Saved inside stats (no version bump): stats.signs = { "tx,ty": name },
// stats.banners = { "tx,ty": colour index }, stats.signsNamed = how many names given.
window.G = window.G || {};

G.Signs = class {
  // h = { ui, input, map, burst(x, y, color, n), floater(x, y, text, color), panAt(x) }
  constructor(state, h) {
    this.state = state;
    Object.assign(this, h);
    this.cache = []; this.timer = 0;
    this.editing = null;   // the signpost whose name is being written
    this.idea = 0;
    this.el = document.getElementById('signpanel');
    this.inp = document.getElementById('sign-name');
    this.inp.maxLength = G.RIVER.nameMax;
    this.inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); this.confirm(); }
      else if (e.key === 'Escape') { e.preventDefault(); this.close(); }
    });
    document.getElementById('sign-ok').onclick = () => this.confirm();
    document.getElementById('sign-idea').onclick = () => { this.inp.value = this.suggest(this.editing.tx, this.editing.ty, ++this.idea); this.inp.focus(); G.Sound.play('select'); };
    document.getElementById('sign-close').onclick = () => this.close();
  }

  get isOpen() { return !!this.editing; }

  names() { const s = this.state.stats; return s.signs || (s.signs = {}); }

  // every signpost in the world with its name (refreshed twice a second, and whenever a name changes)
  list() { return this.cache; }
  refreshList() {
    const out = [], names = this.names();
    for (const st of this.state.world.structures.values()) {
      if (!G.STRUCTURES[st.type].sign) continue;
      out.push({ tx: st.tx, ty: st.ty, name: names[st.tx + ',' + st.ty] || this.suggest(st.tx, st.ty) });
    }
    this.cache = out;
  }

  update(dt) {
    if ((this.timer -= dt) > 0) return;
    this.timer = 0.5;
    this.refreshList();
  }

  nameAt(tx, ty) { return this.names()[tx + ',' + ty] || this.suggest(tx, ty); }

  // the nearest signpost within `reach` tiles of a tile, or null
  near(tx, ty, reach = G.RIVER.signNear) {
    let best = null, bd = reach;
    for (const s of this.cache) { const d = Math.hypot(s.tx - tx, s.ty - ty); if (d <= bd) { bd = d; best = s; } }
    return best;
  }

  // a name the land itself suggests ("Mossy Bend", "Heron Ford"); k picks another idea
  suggest(tx, ty, k = 0) {
    const w = this.state.world, W = G.SIGN_WORDS;
    let ground = w.tileAt(tx, ty).type;
    if (w.besideShallows(tx, ty) || w.isWater(tx, ty)) ground = 'water';
    const a = W.first[ground] || W.first.grass, b = W.last[ground] || W.last.grass;
    const i = Math.floor(G.hash2(tx, ty, 404) * a.length) + k, j = Math.floor(G.hash2(tx, ty, 405) * b.length) + k * 2;
    return a[i % a.length] + ' ' + b[j % b.length];
  }

  // a signpost was just built: it gets the land's idea of a name, then you may write your own
  placed(st) {
    this.names()[st.tx + ',' + st.ty] = this.suggest(st.tx, st.ty);
    this.refreshList();
    this.open(st, true);
  }

  open(st, fresh) {
    this.editing = st; this.idea = 0; this.fresh = !!fresh;
    this.input.keys = {};   // nothing stays "held" while you type
    document.getElementById('sign-h').textContent = G.RIVER_SAYS.signAsk;
    this.inp.value = this.nameAt(st.tx, st.ty);
    this.el.classList.add('open');
    G.Sound.play('open');
    setTimeout(() => { this.inp.focus(); this.inp.select(); }, 30);
  }

  close() {
    if (!this.editing) return;
    const st = this.editing;
    this.editing = null;
    this.el.classList.remove('open');
    this.inp.blur();
    if (this.fresh) this.announce(st);
  }

  // write the name onto the sign
  confirm() {
    const st = this.editing;
    if (!st) return;
    const name = this.inp.value.replace(/\s+/g, ' ').trim().slice(0, G.RIVER.nameMax) || this.suggest(st.tx, st.ty);
    this.names()[st.tx + ',' + st.ty] = name;
    const s = this.state.stats;
    s.signsNamed = (s.signsNamed || 0) + 1;
    this.refreshList();
    const x = (st.tx + 0.5) * G.TILE;
    G.Sound.play('sign', { pan: this.panAt(x) });
    this.burst(x, st.ty * G.TILE, 'rgba(255,225,160,A)', 14);
    this.map.touch(st.tx, st.ty);
    this.fresh = false;
    this.close();
    this.ui.toast(G.pick(G.RIVER_SAYS.signSet).replace('{name}', name) + (s.signsNamed === 1 ? ' ' + G.RIVER_SAYS.signOnMap : ''), s.signsNamed === 1 ? 6 : 3);
  }

  announce(st) { this.ui.toast(G.RIVER_SAYS.signSet[0].replace('{name}', this.nameAt(st.tx, st.ty)), 3); }

  read(st) {
    G.Sound.play('select');
    this.ui.toast(G.RIVER_SAYS.signRead.replace('{name}', this.nameAt(st.tx, st.ty)), 4);
  }

  // click a banner: the next colour
  recolour(st) {
    const s = this.state.stats, b = s.banners || (s.banners = {}), k = st.tx + ',' + st.ty;
    const cur = b[k] !== undefined ? b[k] : Math.floor(G.hash2(st.tx, st.ty, 77) * G.BANNER_HUES.length);
    b[k] = (cur + 1) % G.BANNER_HUES.length;
    const [h, sat, l] = G.BANNER_HUES[b[k]], x = (st.tx + 0.5) * G.TILE;
    G.Sound.play('banner', { pan: this.panAt(x) });
    this.burst(x, st.ty * G.TILE - 10, `hsla(${h},${sat}%,${Math.min(85, l + 15)}%,A)`, 10);
    this.floater(x, st.ty * G.TILE - 34, G.pick(G.RIVER_SAYS.bannerColour), `hsl(${h},${sat}%,${Math.min(85, l + 15)}%)`);
  }

  // the big map: a little post and the name of every sign; the minimap shows just the post
  drawMap(ctx, toX, toY, big, sx, sy) {
    const T = G.TILE;
    for (const s of this.cache) {
      const x = toX((s.tx + 0.5) * T), y = toY((s.ty + 0.5) * T);
      if (!big && Math.hypot(x - sx, y - sy) > 84) continue;
      ctx.fillStyle = '#f2d6a6';
      ctx.fillRect(x - 0.6, y - 4, 1.4, 5);
      ctx.beginPath(); ctx.moveTo(x - 3, y - 5); ctx.lineTo(x + 2.5, y - 5); ctx.lineTo(x + 4, y - 3.5); ctx.lineTo(x + 2.5, y - 2); ctx.lineTo(x - 3, y - 2); ctx.closePath(); ctx.fill();
      if (big) G.MapLabels.add(s.name, x, y + 11, { below: -19, font: 'italic 11px Georgia, serif', color: '#f6e2bc' });   // under the post, or above it
    }
  }

  // the journal's Places page: the places you have named, nearest first
  places() {
    if (!this.cache.length) return '';
    const p = this.state.player;
    const list = [...this.cache].sort((a, b) => Math.hypot(a.tx - p.tx, a.ty - p.ty) - Math.hypot(b.tx - p.tx, b.ty - p.ty));
    const shown = list.slice(0, 8).map(s => {
      const d = Math.round(Math.hypot(s.tx - p.tx, s.ty - p.ty));
      return `<b>${signEsc(s.name)}</b> <em>${d < 8 ? 'right here' : `${d} steps ${G.Ruins.direction(p.tx, p.ty, s.tx, s.ty)}`}</em>`;
    }).join(' · ');
    return `<p class="j-note j-signs">⚑ Places you have named: ${shown}${list.length > 8 ? ` · and ${list.length - 8} more` : ''}.</p>`;
  }

  // the goal tracker's hint: which way to the nearest clay bank (looked up again after you walk a little way)
  static clayHint(s) {
    const S = G.RIVER_SAYS, p = s.player, w = s.world;
    if (!w || !p) return S.clayHintNone;
    const memo = G.Signs.clayMemo;
    if (!memo || memo.w !== w || Math.hypot(memo.tx - p.tx, memo.ty - p.ty) > 6) {
      let found = null;
      for (let r = 0; r <= 45 && !found; r++) {   // ring by ring outward
        for (let dx = -r; dx <= r && !found; dx++) for (const dy of (Math.abs(dx) === r ? signRange(-r, r) : [-r, r])) {
          if (w.objectAt(p.tx + dx, p.ty + dy) === 'claybank') { found = { tx: p.tx + dx, ty: p.ty + dy }; break; }
        }
      }
      G.Signs.clayMemo = { w, tx: p.tx, ty: p.ty, found };
    }
    const f = G.Signs.clayMemo.found;
    if (!f) return S.clayHintNone;
    const d = Math.round(Math.hypot(f.tx - p.tx, f.ty - p.ty));
    if (d < 5) return S.clayHintNear;
    return S.clayHintFar.replace('{d}', Math.max(5, Math.round(d / 5) * 5)).replace('{dir}', G.Ruins.direction(p.tx, p.ty, f.tx, f.ty));
  }
};

function signRange(a, b) { const out = []; for (let i = a; i <= b; i++) out.push(i); return out; }
function signEsc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
