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
    this.buildCraftList();
  }

  buildCraftList() {
    const list = this.$('craft-list');
    list.innerHTML = '';
    for (const r of G.RECIPES) {
      const def = G.STRUCTURES[r.builds];
      const b = document.createElement('button');
      b.className = 'recipe';
      b.dataset.id = r.id;
      const cost = Object.entries(r.cost).map(([k, n]) =>
        `<span class="cost" data-item="${k}" data-n="${n}"><i style="background:${G.ITEMS[k].color}"></i>${n} ${G.ITEMS[k].name}</span>`).join('');
      b.innerHTML = `<b>${def.name}</b><small>${r.desc}</small><div>${cost}</div>`;
      b.onclick = () => { this.state.startBuild(r); this.toggleCraft(false); };
      list.appendChild(b);
    }
  }

  toggleCraft(force) {
    const el = this.$('craft');
    const open = force === undefined ? !el.classList.contains('open') : force;
    el.classList.toggle('open', open);
    if (open) this.refresh();
  }

  refresh() {
    const inv = this.state.inv;
    // inventory bar
    const bar = this.$('inventory');
    bar.innerHTML = Object.keys(G.ITEMS).map(k =>
      `<span class="slot${inv[k] ? '' : ' empty'}"><i style="background:${G.ITEMS[k].color}"></i>${G.ITEMS[k].name}<b>${inv[k] || 0}</b></span>`).join('');
    // recipe affordability
    for (const b of document.querySelectorAll('.recipe')) {
      const r = G.RECIPES.find(x => x.id === b.dataset.id);
      b.classList.toggle('cant', !this.state.canAfford(r));
      for (const c of b.querySelectorAll('.cost')) c.classList.toggle('short', (inv[c.dataset.item] || 0) < +c.dataset.n);
    }
  }

  updateClock(time, lanterns) {
    const day = Math.floor(time / G.DAY_LENGTH) + 1;
    const phase = (time % G.DAY_LENGTH) / G.DAY_LENGTH;
    const names = ['Noon', 'Afternoon', 'Dusk', 'Night', 'Night', 'Night', 'Dawn', 'Morning'];
    const name = names[Math.floor(((phase + 0.0625) % 1) * 8)];
    this.$('clock').textContent = `Day ${day} · ${name}`;
    this.$('restored').textContent = `Lanterns lit: ${lanterns}`;
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
    this.$('hint').textContent = this.state.placing
      ? 'Click to build · Esc to stop building'
      : 'WASD / arrows or click to move · E gather · C craft';
  }
};
