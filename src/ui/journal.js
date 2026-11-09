// G.Journal — your discoveries journal (J, or the book by the moon button), and
// the card that opens when a memory stone wakes (Night 11). The world pauses
// while either is open. Pages: Memories (the story of the Fading, in order),
// Places (ruins you've found), Creatures (who you've met) and Friends.
window.G = window.G || {};

(function () {
G.Journal = class {
  constructor(state, ui) {
    this.state = state; this.ui = ui;
    this.$ = id => document.getElementById(id);
    this.el = this.$('journal'); this.card = this.$('memory');
    this.isOpen = false; this.cardOpen = false; this.cardT = 0;   // cardT = when the card opened (ms)
    this.tab = 'memories';
    this.$('btn-journal').onclick = () => this.toggle();
    this.$('journal-close').onclick = () => this.toggle(false);
    this.el.addEventListener('pointerdown', e => { if (e.target === this.el) this.toggle(false); });
    for (const b of this.el.querySelectorAll('.journal-tabs button')) b.onclick = () => { this.show(b.dataset.tab); G.Sound.play('page'); };
    this.card.addEventListener('pointerdown', () => this.closeCard());
    this.$('memory-journal').onclick = e => { e.stopPropagation(); this.closeCard(); this.toggle(true, this.cardTab || 'memories'); };
  }

  get paused() { return this.isOpen || this.cardOpen; }

  toggle(force, tab) {
    const open = force === undefined ? !this.isOpen : force;
    if (!this.state.running || open === this.isOpen) { if (open && tab) this.show(tab); return; }
    this.isOpen = open;
    this.el.classList.toggle('open', open);
    document.body.classList.toggle('paused', open);
    G.Sound.play(open ? 'mapOpen' : 'close');
    if (open) {
      this.state.stats.journal = (this.state.stats.journal || 0) + 1;
      this.show(tab || this.tab);
    }
  }

  // keys while open: J/Esc close, arrows flip between pages
  keys(input) {
    if (this.cardOpen) {
      if (performance.now() - this.cardT > 450 && input.hit('escape', 'e', ' ', 'enter', 'j')) this.closeCard();
      return;
    }
    if (input.hit('escape', 'j')) { this.toggle(false); return; }
    const tabs = ['memories', 'places', 'creatures', 'friends'], i = tabs.indexOf(this.tab);
    if (input.hit('arrowright', 'd')) { this.show(tabs[(i + 1) % tabs.length]); G.Sound.play('page'); }
    if (input.hit('arrowleft', 'a')) { this.show(tabs[(i + 3) % tabs.length]); G.Sound.play('page'); }
  }

  show(tab) {
    this.tab = tab;
    for (const b of this.el.querySelectorAll('.journal-tabs button')) b.classList.toggle('on', b.dataset.tab === tab);
    const page = this.$('journal-page');
    page.innerHTML = this['page_' + tab]();
    page.scrollTop = 0;
  }

  // ---------- pages ----------
  page_memories() {
    const read = this.memories(), n = G.LORE.length;
    let h = `<p class="j-note">${read.length ? `${Math.min(read.length, n)} of ${n} memories remembered.` : 'No memories yet.'} Memory stones sleep at the heart of old ruins — stand beside one and press E (or click it) to wake it.</p>`;
    G.LORE.forEach((m, i) => {
      if (i < read.length) h += `<div class="j-memory"><b>${roman(i + 1)}. ${m.title}</b><p>${m.text}</p></div>`;
      else if (i === read.length) h += `<div class="j-memory sleeping"><b>${roman(i + 1)}. ···</b><p>This memory still sleeps in an old stone somewhere out in the grey.</p></div>`;
    });
    if (read.length >= n) h += `<p class="j-note">You know the whole story now. The old stones still murmur, if you listen.</p>`;
    return h;
  }

  // your friends' villages (Night 13), shown above the ruins
  villages() {
    const V = this.state.village, p = this.state.player;
    if (!V || !V.list.some(v => v.name)) return '';
    let h = '';
    for (const vil of V.list) {
      if (!vil.name) continue;
      const w = vil.has.well, d = Math.round(Math.hypot(w.tx - p.tx, w.ty - p.ty));
      const where = d < 8 ? 'right here' : `about ${d} steps ${G.Ruins.direction(p.tx, p.ty, w.tx, w.ty)}`;
      const built = ['well', 'stall', 'maypole'].filter(k => vil.has[k]).map(k => G.STRUCTURES[k].name.toLowerCase());
      h += `<div class="j-place read"><b>${vil.name}</b><em>${where}</em><p>A ${vil.title} of ${vil.homes} homes: ${vil.folk.map(v => v.name).join(', ')}.</p>
        <small>⌂ It has a ${built.join(', a ')}.</small></div>`;
    }
    return h;
  }

  page_places() {
    const vh = this.villages() + this.shrinePlaces() + G.HollowPlay.places(this.state);
    return this.roads() + vh + this.ruinPlaces(!!vh);
  }

  // the lantern roads (Night 16): one line about your flights
  roads() {
    const tr = this.state.stats.travel;
    if (!tr || !tr.trips) return '';
    const stops = this.state.travel ? this.state.travel.stops().length : 0;
    return `<p class="j-note">✦ Lantern roads: ${stops} lights on the roads · ${tr.trips} flight${tr.trips === 1 ? '' : 's'} · the longest ${tr.far} steps.</p>`;
  }

  // the Ember Shrines you know of (Night 15), shown above the ruins
  shrinePlaces() {
    const s = this.state, p = s.player, w = s.world, known = G.Shrines.known(s);
    if (!known.length) return '';
    let h = `<p class="j-note">${G.Shrines.kindledCount(w)} of ${G.SHRINES.length} Ember Shrines kindled.</p>`;
    for (const site of known) {
      const lit = G.Shrines.isKindled(w, site), n = G.Shrines.litBowls(w, site), d = Math.round(Math.hypot(site.tx - p.tx, site.ty - p.ty));
      const where = d < 8 ? 'right here' : `about ${d} steps ${G.Ruins.direction(p.tx, p.ty, site.tx, site.ty)}`;
      const wants = site.def.bowls.filter((c, i) => !G.Shrines.isBowlLit(w, site.bowls[i])).map(c => G.Shrines.costText(c)).join(' · ');
      h += `<div class="j-place${lit ? ' read' : ''}" style="border-left:3px solid hsla(${site.hue},90%,62%,.75)"><b>${site.name}</b><em>${where}</em>
        <p>${lit ? site.def.words : 'Four ember bowls ring a great cold hearth. Each wants an offering.'}</p>
        <small>${lit ? '✦ Its hearth burns again.' : `◇ ${n} of 4 bowls burn.${wants ? ' Still wanted: ' + wants + '.' : ''}`}</small></div>`;
    }
    return h;
  }

  ruinPlaces(hasVillage) {
    const s = this.state, found = (s.stats.ruins && s.stats.ruins.found) || {}, p = s.player;
    const sites = Object.keys(found).map(id => { const [cx, cy] = id.split(',').map(Number); return G.Ruins.siteOf(s.world, cx, cy); }).filter(Boolean);
    if (!sites.length && hasVillage) return '';
    if (!sites.length) return '<p class="j-note">You haven\'t found any ruins yet. Old stones stand all over the faded land — friends sometimes remember where. Found ruins show on your map as small stone marks.</p>';
    sites.sort((a, b) => Math.hypot(a.tx - p.tx, a.ty - p.ty) - Math.hypot(b.tx - p.tx, b.ty - p.ty));
    let h = `<p class="j-note">${sites.length} ruin${sites.length === 1 ? '' : 's'} found, nearest first.</p>`;
    for (const site of sites) {
      const read = G.Ruins.isRead(s.world, site), d = Math.round(Math.hypot(site.tx - p.tx, site.ty - p.ty));
      const where = d < 8 ? 'right here' : `about ${d} steps ${G.Ruins.direction(p.tx, p.ty, site.tx, site.ty)}`;
      h += `<div class="j-place${read ? ' read' : ''}"><b>${site.name}</b><em>${where}</em><p>${site.def.about}</p>
        <small>${read ? '✦ Its memory stone is awake.' : '◇ Its memory stone still sleeps.'}</small></div>`;
    }
    return h;
  }

  page_creatures() {
    const met = this.state.stats.met || {}, kinds = Object.keys(G.CREATURES), n = kinds.filter(k => met[k]).length;
    let h = `<p class="j-note">${n} of ${kinds.length} kinds of wildlife met. They return to land where the colour is back.</p><div class="j-grid">`;
    for (const k of kinds) {
      const c = G.CREATURES[k];
      if (met[k]) h += `<div class="j-card"><i style="background:hsl(${c.hues[0]},70%,65%)"></i><b>${c.name}</b><p>${c.meet}</p></div>`;
      else h += `<div class="j-card unknown"><i></i><b>???</b><p>${creatureHint(c)}</p></div>`;
    }
    return h + '</div>';
  }

  page_friends() {
    const folk = this.state.villagers, list = folk ? folk.list : [];
    if (!list.length) return '<p class="j-note">No friends at home yet. Lost spirits wander the grey — lead them into the colour around a lantern.</p>';
    let h = `<p class="j-note">${list.length} friend${list.length === 1 ? '' : 's'} at home.</p><div class="j-grid">`;
    for (const v of list) {
      const likes = G.STRUCTURES[v.def.likes] ? G.STRUCTURES[v.def.likes].name.toLowerCase() : '';
      const home = v.house ? 'lives in a cottage' : v.home ? `lives by a ${G.STRUCTURES[v.home.type] ? G.STRUCTURES[v.home.type].name.toLowerCase() : 'light'}` : '';
      h += `<div class="j-card"><i style="background:hsl(${v.hue},70%,70%)"></i><b>${v.name}</b>
        <span class="hearts">${'♥'.repeat(v.hearts || 0)}<s>${'♥'.repeat(Math.max(0, 5 - (v.hearts || 0)))}</s></span>
        <p>A ${v.kind} who loves a ${likes}. ${home ? cap(home) + '.' : ''}${v.wishes ? ` ${v.wishes} wish${v.wishes === 1 ? '' : 'es'} came true.` : ''}</p></div>`;
    }
    return h + '</div>';
  }

  memories() { return this.state.stats.memories || []; }

  // ---------- the memory card ----------
  // Shows a memory that just woke. i = its place in G.LORE (or -1 for an echo).
  showMemory(i, site, echo) {
    const m = G.LORE[i];
    this.showCard(site ? site.name : '', m ? m.title : 'An echo', m ? m.text : echo,
      m ? `Memory ${roman(i + 1)} of ${roman(G.LORE.length)}` : 'You know the whole story now');
  }

  // the same card for anything worth a pause: where, a title, a few words, a footnote (Night 15: the Ember Shrines)
  showCard(where, title, text, foot, tab = 'memories') {
    this.cardTab = tab;   // the journal page "Kept in your journal" opens
    this.$('memory-where').textContent = where;
    this.$('memory-title').textContent = title;
    this.$('memory-text').textContent = text;
    this.$('memory-count').textContent = foot;
    this.cardOpen = true; this.cardT = performance.now();
    this.card.classList.add('open');
    document.body.classList.add('paused');
  }

  closeCard() {
    if (!this.cardOpen) return;
    this.cardOpen = false;
    this.card.classList.remove('open');
    if (!this.isOpen) document.body.classList.remove('paused');
    G.Sound.play('close');
    if (this.onCardClosed) { const f = this.onCardClosed; this.onCardClosed = null; f(); }
  }
};

function roman(n) {
  const r = [['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]];
  let s = '';
  for (const [k, v] of r) while (n >= v) { s += k; n -= v; }
  return s;
}
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function creatureHint(c) {
  if (c.rainy) return 'Comes out only in the rain.';
  if (c.nearLight) return 'Seen near lights after dark.';
  if (c.move === 'swim') return 'Lives in coloured water.';
  if (c.when === 'night') return 'Comes out at night.';
  return 'Lives where the colour is bright.';
}
})();
