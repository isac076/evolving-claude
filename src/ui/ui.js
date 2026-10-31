// Everything on screen that isn't the world: inventory, crafting, messages.
window.G = window.G || {};

G.UI = class {
  constructor(state) {
    this.state = state;
    this.$ = id => document.getElementById(id);
    this.toastTimer = 0;
    this.$('btn-craft').onclick = () => this.toggleCraft();
    this.$('btn-gather').onclick = () => { state.wantGather = true; };
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
      { title: 'Anywhere', recipes: G.RECIPES.filter(r => !r.at && !r.garden) },
      { title: 'Garden', recipes: G.RECIPES.filter(r => r.garden && !r.at) },
      { title: 'At a workbench', id: 'bench-head', recipes: G.RECIPES.filter(r => r.at === 'workbench') },
    ];
    for (const g of groups) {
      const h = document.createElement('div');
      h.className = 'craft-group';
      if (g.id) h.id = g.id;
      h.innerHTML = `<span>${g.title}</span><em></em>`;
      list.appendChild(h);
      for (const r of g.recipes) {
        const name = r.builds ? G.STRUCTURES[r.builds].name : G.ITEMS[r.makes].name;
        const b = document.createElement('button');
        b.className = 'recipe' + (r.makes ? ' tool' : '');
        b.dataset.id = r.id;
        const cost = Object.entries(r.cost).map(([k, n]) =>
          `<span class="cost" data-item="${k}" data-n="${n}"><i style="background:${G.ITEMS[k].color}"></i>${n} ${G.ITEMS[k].name}</span>`).join('');
        b.innerHTML = `<b>${name}${r.makes ? ' <span class="tag">tool</span>' : ''}<span class="owned">✓ Yours</span></b><small>${r.desc}</small><div>${cost}</div>`;
        b.onclick = () => {
          const why = G.Crafting.blocker(this.state, r);
          this.state.startBuild(r);
          if (!why && r.builds) this.toggleCraft(false);
          else this.refresh();
        };
        list.appendChild(b);
      }
    }
  }

  get craftOpen() { return this.$('craft').classList.contains('open'); }

  toggleCraft(force) {
    const el = this.$('craft');
    const was = el.classList.contains('open');
    const open = force === undefined ? !was : force;
    el.classList.toggle('open', open);
    document.body.classList.toggle('craft-open', open);
    if (open !== was) G.Sound.play(open ? 'open' : 'close');
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
    bar.innerHTML = Object.keys(G.ITEMS).map(k => {
      const it = G.ITEMS[k];
      if (it.tool) return inv[k] ? `<span class="slot tool" title="${it.desc}"><i style="background:${it.color}"></i>${it.name}</span>` : '';
      if (!inv[k] && !got[k] && !['wood', 'stone', 'petal'].includes(k)) return '';
      return `<span class="slot${inv[k] ? '' : ' empty'}"><i style="background:${it.color}"></i>${it.name}<b>${inv[k] || 0}</b></span>`;
    }).join('');
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
    for (const b of document.querySelectorAll('.recipe')) {
      const r = G.RECIPES.find(x => x.id === b.dataset.id);
      const why = G.Crafting.blocker(this.state, r);
      b.classList.toggle('cant', !!why);
      b.classList.toggle('far', why === 'far');
      b.classList.toggle('is-owned', why === 'owned');
      for (const c of b.querySelectorAll('.cost')) c.classList.toggle('short', (inv[c.dataset.item] || 0) < +c.dataset.n);
    }
  }

  updateClock(time, lanterns, weather, friends = 0) {
    const day = Math.floor(time / G.DAY_LENGTH) + 1;
    const phase = (time % G.DAY_LENGTH) / G.DAY_LENGTH;
    const names = ['Noon', 'Afternoon', 'Dusk', 'Night', 'Night', 'Night', 'Dawn', 'Morning'];
    const name = names[Math.floor(((phase + 0.0625) % 1) * 8)];
    this.$('clock').textContent = `Day ${day} · ${name}`;
    const wname = weather ? weather.def.name : '';
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

  update(dt) {
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.$('toast').classList.remove('show');
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
      : 'WASD / arrows or click to move · E gather / talk / water · C craft · X pick up · M map · Esc rest';
  }
};
