// Everything on screen that isn't the world: inventory, crafting, messages.
window.G = window.G || {};

G.UI = class {
  constructor(state) {
    this.state = state;
    this.$ = id => document.getElementById(id);
    this.toastTimer = 0;
    this.$('btn-craft').onclick = () => this.toggleCraft();
    this.$('btn-gather').onclick = () => { state.wantGather = true; };
    this.$('btn-shine').onclick = () => { state.wantShine = true; };
    this.$('craft-close').onclick = () => this.toggleCraft(false);
    this.$('btn-sound').onclick = () => this.toggleSound();
    this.$('btn-pickup').onclick = () => { state.setRemoving(); this.toggleCraft(false); };
    this.nearTimer = 0; this.wasNear = null;
    this.showSound();
    this.buildCraftList();
  }

  // Recipes in two groups: things you can make anywhere, and things that
  // need a workbench nearby.
  buildCraftList() {
    const list = this.$('craft-list');
    list.innerHTML = '';
    const groups = [
      { title: 'Anywhere', recipes: G.RECIPES.filter(r => !r.at && !r.garden && !r.home) },
      { title: 'Homes for friends', id: 'home-head', recipes: G.RECIPES.filter(r => r.home && !r.at) },
      { title: 'Garden', recipes: G.RECIPES.filter(r => r.garden && !r.at) },
      { title: 'At a workbench', id: 'bench-head', recipes: G.RECIPES.filter(r => r.at === 'workbench') },
    ];
    groups.forEach((g, gi) => {
      const h = document.createElement('div');
      h.className = 'craft-group';
      if (g.id) h.id = g.id;
      h.innerHTML = `<span>${g.title}</span><em></em>`;
      list.appendChild(h);
      for (const r of g.recipes) {
        const name = r.builds ? G.STRUCTURES[r.builds].name : G.ITEMS[r.makes].name;
        const b = document.createElement('button');
        b.className = 'recipe' + (r.makes ? ' tool' : '');
        b.dataset.id = r.id; b.dataset.group = gi;
        const cost = Object.entries(r.cost).map(([k, n]) =>
          `<span class="cost" data-item="${k}" data-n="${n}"><i style="background:${G.ITEMS[k].color}"></i>${n} ${G.ITEMS[k].name}</span>`).join('');
        b.innerHTML = `<b>${name}${r.makes ? ' <span class="tag">tool</span>' : ''}<span class="tag new">new</span><span class="owned">✓ Yours</span></b><small>${r.desc}</small><div>${cost}</div>`;
        b.onclick = () => {
          const why = G.Crafting.blocker(this.state, r);
          this.state.startBuild(r);
          if (!why && r.builds) this.toggleCraft(false);
          else this.refresh();
        };
        list.appendChild(b);
      }
      const more = document.createElement('div');   // "2 more to discover" (Night 28)
      more.className = 'craft-more'; more.dataset.group = gi; more.hidden = true;
      list.appendChild(more);
    });
    this.fresh = null;   // which recipes were already in view (see refreshRecipes)
  }

  // Night 28: a recipe stays a secret until you have found every material it needs (wood, stone, petals and
  // the other first-day things always count as found), so the far lands' lanterns are a surprise
  itemFound(k) {
    const st = this.state.stats || {};
    return G.CRAFT_KNOWN.includes(k) || (this.state.inv[k] || 0) > 0 || ((st.got || {})[k] || 0) > 0;
  }
  recipeSeen(r) { return Object.keys(r.cost).every(k => this.itemFound(k)); }

  get craftOpen() { return this.$('craft').classList.contains('open'); }

  toggleCraft(force) {
    const el = this.$('craft');
    const was = el.classList.contains('open');
    const open = force === undefined ? !was : force;
    el.classList.toggle('open', open);
    document.body.classList.toggle('craft-open', open);
    if (open !== was) G.Sound.play(open ? 'open' : 'close');
    if (!open && was) for (const b of document.querySelectorAll('.recipe.fresh')) b.classList.remove('fresh');
    if (open) this.refresh();
  }

  toggleSound() {
    const muted = G.Sound.toggleMute();
    if (!muted) G.Sound.play('toggle');
    this.showSound();
    this.toast(muted ? 'Sound off (N to turn back on).' : 'Sound on.', 1.8);
  }

  showSound() {
    const b = this.$('btn-sound'), m = G.Sound.muted;
    b.classList.toggle('muted', m);
    b.title = m ? 'Sound is off — click or press N' : 'Sound is on — click or press N';
    b.setAttribute('aria-label', b.title);
  }

  refresh() {
    const inv = this.state.inv;
    // inventory bar: materials always (new ones once you've found some), tools once you own them
    const got = this.state.stats.got || {};
    const bar = this.$('inventory');
    // Night 28: with many materials the bar grew to two full rows. It now keeps the few you touched last
    // (and every tool) behind a "+ N more" chip; the whole bag shows while crafting or when the chip is tapped.
    if (this.invWorld !== this.state.world) { this.invWorld = this.state.world; this.lastInv = {}; this.touched = {}; this.tick = 0; this.bagOpen = false; }
    const mats = [], tools = [], now = ++this.tick;   // everything changed by one event shares a moment
    Object.keys(G.ITEMS).forEach((k, i) => {
      const it = G.ITEMS[k];
      if ((inv[k] || 0) !== (this.lastInv[k] || 0)) { this.touched[k] = now; this.lastInv[k] = inv[k] || 0; }
      if (it.tool) { if (inv[k]) tools.push(k); return; }
      if (!inv[k] && !got[k] && !['wood', 'stone', 'petal'].includes(k)) return;
      mats.push(k);
    });
    const limit = window.innerWidth < 760 ? G.UI_BAG.phone : G.UI_BAG.desk, compact = mats.length + tools.length > limit + 2;
    const keep = new Set(compact ? mats.slice().sort((a, b) => (this.touched[b] || 0) - (this.touched[a] || 0)).slice(0, limit) : mats);
    const extra = mats.length - keep.size + (compact ? tools.length : 0);
    const slot = (k) => {
      const it = G.ITEMS[k], x = keep.has(k) ? '' : ' extra';
      if (it.tool) return `<span class="slot tool${compact ? ' extra' : ''}" title="${it.desc}"><i style="background:${it.color}"></i>${it.name}</span>`;
      return `<span class="slot${inv[k] ? '' : ' empty'}${x}"><i style="background:${it.color}"></i>${it.name}<b>${inv[k] || 0}</b></span>`;
    };
    bar.innerHTML = mats.map(slot).join('') + tools.map(slot).join('') +
      (compact ? `<button class="slot more" title="Show everything you carry">+ ${extra} more</button><button class="slot less" title="Show fewer">Less</button>` : '');
    bar.classList.toggle('compact', compact);
    bar.classList.toggle('open', compact && this.bagOpen);
    if (compact) for (const b of bar.querySelectorAll('.more, .less')) b.onclick = (e) => { e.stopPropagation(); this.bagOpen = !this.bagOpen; bar.classList.toggle('open', this.bagOpen); G.Sound.play('toggle'); };
    this.refreshRecipes();
  }

  // recipe affordability, workbench distance, tools already owned
  refreshRecipes() {
    const inv = this.state.inv, near = G.Crafting.nearWorkbench(this.state);
    this.wasNear = near;
    const head = this.$('bench-head');
    if (head) {
      head.classList.toggle('near', near);
      head.querySelector('em').textContent = near ? 'workbench nearby ✓' : this.state.world && this.state.world.count('workbench')
        ? 'walk to your workbench' : 'build a workbench first';
    }
    const homeHead = this.$('home-head');   // the homes group appears once a friend teaches you
    if (homeHead) homeHead.classList.toggle('locked', !G.RECIPES.some(r => r.home && G.Crafting.known(this.state, r)));
    const hiddenIn = {}, first = !this.fresh || this.freshWorld !== this.state.world, newly = [];   // a new or loaded world starts quietly
    if (first) { this.fresh = new Set(); this.freshWorld = this.state.world; }
    for (const b of document.querySelectorAll('.recipe')) {
      const r = G.RECIPES.find(x => x.id === b.dataset.id);
      const why = G.Crafting.blocker(this.state, r), seen = this.recipeSeen(r);
      b.classList.toggle('locked', why === 'locked');
      b.classList.toggle('unseen', !seen);
      if (!seen && why !== 'locked') hiddenIn[b.dataset.group] = (hiddenIn[b.dataset.group] || 0) + 1;
      if (seen && why !== 'locked' && !this.fresh.has(r.id)) {   // newly found: a little "new" tag until the panel closes
        this.fresh.add(r.id);
        if (!first) { b.classList.add('fresh'); newly.push(r); }
      }
      b.classList.toggle('cant', !!why);
      b.classList.toggle('far', why === 'far');
      b.classList.toggle('is-owned', why === 'owned');
      for (const c of b.querySelectorAll('.cost')) c.classList.toggle('short', (inv[c.dataset.item] || 0) < +c.dataset.n);
    }
    for (const m of document.querySelectorAll('.craft-more')) {
      const n = hiddenIn[m.dataset.group] || 0;
      m.hidden = !n;
      if (n) m.textContent = `✧ ${n === 1 ? 'One more thing' : n + ' more things'} to discover — made from something you haven't found yet`;
    }
    const shown = newly.filter(r => !r.unlock);   // friend-taught recipes have their own words
    if (shown.length) {
      const names = shown.map(r => r.builds ? G.STRUCTURES[r.builds].name : G.ITEMS[r.makes].name);
      const list = names.length > 2 ? names.slice(0, 2).join(', ') + ' and more' : names.join(' and ');
      this.laterNote = `Something new to make: ${list}. Open Craft (C) to see.`;   // after whatever is being said now
    }
  }

  updateClock(time, lanterns, weather, friends = 0) {
    const day = Math.floor(time / G.DAY_LENGTH) + 1;
    const phase = (time % G.DAY_LENGTH) / G.DAY_LENGTH;
    const names = ['Noon', 'Afternoon', 'Dusk', 'Night', 'Night', 'Night', 'Dawn', 'Morning'];
    const name = names[Math.floor(((phase + 0.0625) % 1) * 8)];
    this.$('clock').textContent = `Day ${day} · ${name}`;
    const sn = G.SEASON_NOW;
    if (sn && sn.id !== this.sname) {   // the season, with its little sign (and a glow when it turns)
      const el = this.$('season'), turned = !!this.sname;
      this.sname = sn.id;
      el.innerHTML = `<i>${sn.def.icon}</i><span>${sn.def.name}</span>`; el.dataset.kind = sn.id;
      el.title = `${sn.def.name} — the seasons turn every ${G.SEASON.days} days`;
      if (turned) { el.classList.remove('turning'); void el.offsetWidth; el.classList.add('turning'); }
    }
    const wname = weather ? weather.name() : '';
    if (wname !== this.wname) {
      this.wname = wname;
      const el = this.$('weather');
      el.textContent = wname; el.dataset.kind = weather ? weather.kind : '';
    }
    this.$('restored').textContent = `Lanterns lit: ${lanterns}`;
    this.$('friends').textContent = friends ? `Friends: ${friends}` : '';
  }

  toast(msg, secs = 3.5) {
    const el = this.$('toast');
    el.textContent = msg; el.classList.add('show');
    this.toastTimer = secs;
  }

  // the name of the piece of music that just began, softly in the corner
  musicCaption(title, grey) {
    const el = this.$('music-caption');
    el.textContent = title; el.classList.toggle('grey', !!grey); el.classList.add('show');
    this.captionTimer = 6;
  }

  // a village's name, shown softly as you arrive (Night 13)
  placeCaption(name, sub) {
    this.$('place-name').textContent = name; this.$('place-sub').textContent = sub;
    this.$('place-caption').classList.add('show');
    this.placeTimer = 4.5;
  }

  update(dt) {
    if (this.placeTimer > 0 && (this.placeTimer -= dt) <= 0) this.$('place-caption').classList.remove('show');
    if (this.captionTimer > 0 && (this.captionTimer -= dt) <= 0) this.$('music-caption').classList.remove('show');
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.$('toast').classList.remove('show');
    } else if (this.laterNote && (this.laterT = (this.laterT || 0) + dt) > 0.6) {   // a quiet note waits for a free moment
      const m = this.laterNote; this.laterNote = null; this.laterT = 0; this.toast(m, 4);
    }
    // keep the workbench groups up to date while the craft panel is open
    if (this.$('craft').classList.contains('open') && (this.nearTimer -= dt) <= 0) {
      this.nearTimer = 0.3;
      if (G.Crafting.nearWorkbench(this.state) !== this.wasNear) this.refreshRecipes();
    }
    document.body.classList.toggle('removing', !!this.state.removing);
    this.$('hint').textContent = this.state.placing
      ? 'Click to build · Esc to stop building'
      : this.state.removing ? 'Click a building to pick it up · Esc or X to stop'
      : 'WASD / arrows or click to move · E gather / talk / water · F shine · C craft · X pick up · M map · P photo · Esc rest';
  }
};
