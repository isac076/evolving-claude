// G.Market — the market stall's little trading panel (Night 13).
// Opens when you press E beside (or click) a village's market stall; shows today's
// swaps (G.Village.trades). Walking away or Esc closes it. The world keeps going.
window.G = window.G || {};

G.Market = class {
  constructor(state, ui, village) {
    this.state = state; this.ui = ui; this.village = village;
    this.el = document.getElementById('market');
    this.list = document.getElementById('market-list');
    this.vil = null; this.stall = null;
    document.getElementById('market-close').onclick = () => this.close();
    this.onTrade = null;
  }

  get isOpen() { return this.el.classList.contains('open'); }

  open(vil, stall) {
    this.vil = vil; this.stall = stall;
    document.getElementById('market-h').textContent = `${vil.name || 'Village'} market`;
    const keeper = vil.folk.find(v => !this.village.folk.indoors(v));
    document.getElementById('market-note').textContent = keeper
      ? `${keeper.name} minds the stall today. Each swap can be made ${G.MARKET.times} times a day — new swaps every morning.`
      : 'Each swap can be made a couple of times a day — new swaps every morning.';
    this.el.classList.add('open');
    document.body.classList.add('market-open');   // the minimap steps aside (Night 14)
    this.ui.toggleCraft(false);
    G.Sound.play('open');
    this.render();
  }

  close() {
    if (!this.isOpen) return;
    this.el.classList.remove('open');
    document.body.classList.remove('market-open');
    G.Sound.play('close');
  }

  render() {
    if (!this.vil) return;
    const s = this.state, items = o => Object.entries(o).map(([k, n]) =>
      `<span class="cost"><i style="background:${G.ITEMS[k].color}"></i>${n} ${G.ITEMS[k].name}</span>`).join('');
    this.list.innerHTML = '';
    for (const t of this.village.trades(s, this.vil)) {
      const ok = this.village.canTrade(s, t), b = document.createElement('button');
      b.className = 'trade' + (ok ? '' : ' cant');
      const give = Object.entries(t.give).map(([k, n]) =>
        `<span class="cost${(s.inv[k] || 0) < n ? ' short' : ''}"><i style="background:${G.ITEMS[k].color}"></i>${n} ${G.ITEMS[k].name}</span>`).join('');
      b.innerHTML = `<div>${give}<b>→</b>${items(t.get)}</div><small>${t.left > 0 ? `${t.left} left today` : 'All swapped for today'}</small>`;
      b.onclick = () => {
        if (!this.village.trade(s, this.vil, t)) { G.Sound.play('deny'); return; }
        G.Sound.play('gift');
        if (this.onTrade) this.onTrade(t, this.stall);
        this.ui.refresh();
        this.render();
      };
      this.list.appendChild(b);
    }
  }

  // close when the spirit walks away from the stall
  update() {
    if (!this.isOpen || !this.stall) return;
    const p = this.state.player, d = Math.hypot(p.x - (this.stall.tx + 0.5) * G.TILE, p.y - (this.stall.ty + 0.5) * G.TILE);
    if (d > 3.5 * G.TILE) this.close();
  }
};
