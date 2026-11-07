// G.ShrinePlay — what happens at the Ember Shrines (Night 15): sensing where they
// stand (after a few memory stones), finding them, making offerings at their four
// ember bowls, and the kindling — the hearth bursts into flame and a wave of
// colour rolls out across the land (its light's restore radius grows over
// G.SHRINE.kindleTime seconds). Saved as structures + stats.shrines =
// { sensed, found: {id: 1}, lit: [id, ...] , bowls }.
window.G = window.G || {};

G.ShrinePlay = class {
  // hooks: { ui, map, journal, burst(x, y, color, n), floater(x, y, text, color), pan(x) }
  constructor(state, hooks) {
    this.state = state; this.h = hooks;
    this.timer = 0;
    this.kindling = null;   // { site, t } while the wave of colour rolls out
    this.sparks = [];       // embers flying from the bowls into the hearth
  }

  get stats() { return this.state.stats.shrines || (this.state.stats.shrines = { found: {}, lit: [], bowls: 0 }); }

  say(key, o = {}) { return G.SHRINE_SAYS[key].replace(/\{(\w+)\}/g, (m, k) => o[k] !== undefined ? o[k] : m); }

  // E or a click on a shrine stone
  use(tx, ty, obj) {
    const w = this.state.world, site = G.Shrines.at(w, tx, ty);
    if (!site) return;
    this.found(site, true);
    if (G.OBJECTS[obj].bowl) this.offer(site, tx, ty);
    else if (G.OBJECTS[obj].hearth) {
      G.Sound.play('select');
      this.h.ui.toast(this.say('hearthCold', { n: G.Shrines.litBowls(w, site) }), 4);
    } else { G.Sound.play('select'); this.h.ui.toast(this.say('post'), 4); }
  }

  // a lit bowl or the burning hearth (clicked)
  about(st) {
    const w = this.state.world, site = G.Shrines.at(w, st.tx, st.ty);
    if (!site) return;
    G.Sound.play('select');
    this.h.ui.toast(st.type === 'shrineflame' ? this.say('hearthLit', { name: site.name })
      : `This bowl burns for the ${site.name}. (${G.Shrines.litBowls(w, site)} of 4 burn)`, 3.5);
  }

  // offer what a bowl wants: it catches, and when all four burn the hearth kindles
  offer(site, tx, ty) {
    const s = this.state, w = s.world, i = G.Shrines.bowlIndex(site, tx, ty);
    if (i < 0) return;
    const cost = site.def.bowls[i], text = G.Shrines.costText(cost);
    const short = Object.entries(cost).filter(([k, n]) => (s.inv[k] || 0) < n);
    if (short.length) {
      G.Sound.play('deny');
      const have = short.map(([k]) => `${s.inv[k] || 0} ${G.ITEMS[k].name}`).join(', ');
      this.h.ui.toast(Object.keys(cost).some(k => s.inv[k]) ? this.say('bowlShort', { cost: text, have }) : this.say('bowlWants', { cost: text }), 4.5);
      return;
    }
    for (const [k, n] of Object.entries(cost)) s.inv[k] -= n;
    w.build('emberflame', tx, ty);
    this.h.map.touch(tx, ty);
    this.stats.bowls = (this.stats.bowls || 0) + 1;
    const x = (tx + 0.5) * G.TILE, y = (ty + 0.5) * G.TILE, n = G.Shrines.litBowls(w, site);
    G.Sound.play('ember', { pan: this.h.pan(x), n });
    this.h.burst(x, y - 18, `hsla(${site.hue},95%,65%,A)`, 22);
    this.h.floater(x, y - 34, `−${text}`, '#ffd7a0');
    this.h.ui.toast(this.say('bowlLit', { n }), 3.5);
    if (n >= site.bowls.length) setTimeout(() => this.kindle(site), 900);
    this.h.ui.refresh();
  }

  // all four bowls burn: the hearth catches and the colour rolls out
  kindle(site) {
    const s = this.state, w = s.world;
    if (G.Shrines.isKindled(w, site)) return;
    // embers leap from each bowl to the hearth
    for (const b of site.bowls) this.sparks.push({ x0: (b.tx + 0.5) * G.TILE, y0: (b.ty + 0.5) * G.TILE - 22, t: 0, hue: site.hue, site });
    w.build('shrineflame', site.tx, site.ty);
    this.kindling = { site, t: 0, ver: 0 };
    this.setRadius(0.5);
    const lit = this.stats.lit || (this.stats.lit = []);
    if (!lit.includes(site.id)) lit.push(site.id);
    s.stats.shrinesLit = lit.length;
    const x = (site.tx + 0.5) * G.TILE, y = (site.ty + 0.5) * G.TILE;
    G.Sound.play('kindle', { pan: this.h.pan(x), n: lit.length });
    this.h.burst(x, y - 30, `hsla(${site.hue},95%,65%,A)`, 40);
    this.h.burst(x, y - 30, 'rgba(255,240,200,A)', 24);
    this.h.ui.toast(this.say('kindled', { name: site.name }), 6);
    this.h.ui.placeCaption(site.name, 'kindled');
  }

  // the kindled hearth's light: how far its colour reaches right now
  setRadius(r) {
    const k = this.kindling, w = this.state.world;
    if (!k) return;
    const x = (k.site.tx + 0.5) * G.TILE, y = (k.site.ty + 0.5) * G.TILE;
    for (const L of w.lights) if (L.type === 'shrineflame' && L.x === x && L.y === y) L.restore = r;
  }

  // the wave has reached the edge: rewards, the map fills in, the card
  finish(site) {
    const s = this.state, h = this.h, lit = this.stats.lit.length;
    s.explored.reveal(site.tx, site.ty, G.SHRINE.restore + 2);
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) h.map.touch(site.tx + dx * 14, site.ty + dy * 14);
    const x = (site.tx + 0.5) * G.TILE, y = site.ty * G.TILE;
    let k = 0;
    for (const [item, n] of Object.entries(site.def.gift)) {
      s.inv[item] = (s.inv[item] || 0) + n;
      s.stats.got[item] = (s.stats.got[item] || 0) + n;
      h.floater(x, y - 40 - k * 14, `+${n} ${G.ITEMS[item].name}`, G.ITEMS[item].color); k++;
    }
    const un = s.stats.unlocked || (s.stats.unlocked = []), teach = !un.includes('emberlamp');
    if (teach) un.push('emberlamp');
    h.journal.showCard(site.name, 'An ember wakes', site.def.words, `Ember Shrine ${lit} of ${G.SHRINES.length} kindled`, 'places');
    h.journal.onCardClosed = () => {
      if (teach) h.ui.toast(this.say('unlock'), 7);
      else if (lit >= G.SHRINES.length) h.ui.toast(this.say('all'), 8);
      else { const nx = G.Shrines.nextToKindle(s); if (nx) h.ui.toast(`The next ember waits at the ${nx.name}, far to the ${G.Ruins.direction(s.player.tx, s.player.ty, nx.tx, nx.ty)}.`, 6); }
    };
    h.ui.refresh();
  }

  // mark a shrine as found; true the first time
  found(site, quiet) {
    const st = this.stats;
    st.found = st.found || {};
    if (st.found[site.id]) return false;
    st.found[site.id] = 1;
    this.state.stats.shrinesFound = Object.keys(st.found).length;
    this.h.map.touch(site.tx, site.ty);
    if (!quiet) {
      G.Sound.play('ruin');
      this.h.ui.toast(this.say(this.state.stats.shrinesFound === 1 ? 'found' : 'foundAgain', { name: site.name }), 8);
      this.h.ui.placeCaption(site.name, 'an Ember Shrine');
    }
    return true;
  }

  update(dt) {
    const s = this.state, w = s.world, p = s.player;
    // the wave of colour rolling out from a kindled hearth
    if (this.kindling) {
      const k = this.kindling, R = G.SHRINE.restore;
      k.t += dt;
      const u = G.clamp(k.t / G.SHRINE.kindleTime, 0, 1), e = 1 - Math.pow(1 - u, 3);
      this.setRadius(0.5 + (R - 0.5) * e);
      if (Math.floor(k.t * 4) !== k.ver) { k.ver = Math.floor(k.t * 4); w.lightsVersion++; }   // the map recolours as it goes
      if (u >= 1) { this.kindling = null; w.rebuildLights(); this.finish(k.site); }
    }
    for (const sp of this.sparks) sp.t += dt;
    this.sparks = this.sparks.filter(sp => sp.t < 1);

    if ((this.timer -= dt) > 0) return;
    this.timer = 0.5;
    const st = this.stats;
    if (!st.sensed && (s.stats.memories || []).length >= G.SHRINE.senseMemories) {
      st.sensed = 1;
      const nx = G.Shrines.nextToKindle(s);
      for (const site of G.Shrines.list(w)) this.h.map.touch(site.tx, site.ty);
      if (nx) { G.Sound.play('ruin'); this.h.ui.toast(this.say('sensed', { dir: G.Ruins.direction(p.tx, p.ty, nx.tx, nx.ty) }), 9); }
    }
    for (const site of G.Shrines.list(w))
      if (Math.hypot(site.tx - p.tx, site.ty - p.ty) <= G.SHRINE.findAt) this.found(site);
  }
};
