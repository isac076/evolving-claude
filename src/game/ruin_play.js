// G.RuinPlay — what happens when you explore the ruins of the old world (Night 11):
// coming upon a ruin (it is "found", marked on the map and in the journal), looking
// at its old stones, and waking its memory stone — which lights up for good
// (it becomes a 'memorystone' structure that restores colour around it) and tells
// the next memory of the story (G.LORE, in order) on the memory card.
// Saved inside stats: stats.ruins.found = { siteId: 1 }, stats.ruinsFound,
// stats.memories = [siteId, ...] in the order they were woken.
window.G = window.G || {};

G.RuinPlay = class {
  // hooks: { ui, map, journal, burst(x, y, color, n), floater(x, y, text, color), pan(x) }
  constructor(state, hooks) {
    this.state = state; this.h = hooks;
    this.timer = 0;
  }

  // a look at an old stone you can't gather
  about(tx, ty, obj) {
    const site = this.state.world.tileAt(tx, ty).ruin;
    G.Sound.play('select');
    this.h.ui.toast(site ? `${site.name}. ${site.def.about}` : `${G.OBJECTS[obj].name} — worn smooth by time.`, 4.5);
  }

  // mark a ruin as found; true the first time
  found(site) {
    const s = this.state, R = s.stats.ruins || (s.stats.ruins = { found: {} });
    if (R.found[site.id]) return false;
    R.found[site.id] = 1;
    s.stats.ruinsFound = Object.keys(R.found).length;
    this.h.map.touch(site.tx, site.ty);
    return true;
  }

  // twice a second: has the spirit wandered close to a ruin it hasn't seen?
  update(dt) {
    if ((this.timer -= dt) > 0) return;
    this.timer = 0.5;
    const s = this.state, p = s.player;
    for (const site of G.Ruins.around(s.world, p.tx, p.ty, 1)) {
      if (Math.hypot(site.tx - p.tx, site.ty - p.ty) > G.RUIN.findAt || !this.found(site)) continue;
      G.Sound.play('ruin');
      const first = s.stats.ruinsFound === 1;
      this.h.ui.toast(first ? `Ruins! ${site.name} — ${site.def.about} A memory stone sleeps at its heart: stand beside it and press E.`
        : `You found an old ruin: ${site.name}.${G.Ruins.isRead(s.world, site) ? '' : ' Its memory stone is sleeping.'}`, first ? 9 : 5);
    }
  }

  // wake a sleeping memory stone: it lights up for good, and tells you a memory
  wake(tx, ty) {
    const s = this.state, w = s.world, h = this.h, site = w.tileAt(tx, ty).ruin;
    const x = (tx + 0.5) * G.TILE, y = (ty + 0.5) * G.TILE;
    if (site) this.found(site);
    w.build('memorystone', tx, ty);
    h.map.touch(tx, ty);
    const mem = s.stats.memories || (s.stats.memories = []);
    mem.push(site ? site.id : G.key(tx, ty));
    const i = mem.length - 1;
    G.Sound.play('memory', { pan: h.pan(x) });
    h.burst(x, y - 16, 'rgba(255,225,150,A)', 28);
    h.burst(x, y - 16, 'rgba(190,215,255,A)', 14);
    let k = 0;
    for (const [item, n] of Object.entries(G.RUIN.reward)) {
      s.inv[item] = (s.inv[item] || 0) + n;
      s.stats.got[item] = (s.stats.got[item] || 0) + n;
      h.floater(x, y - 30 - k * 14, `+${n} ${G.ITEMS[item].name}`, G.ITEMS[item].color); k++;
    }
    h.journal.showMemory(i < G.LORE.length ? i : -1, site, G.RUIN_ECHOES[i % G.RUIN_ECHOES.length]);
    h.journal.onCardClosed = () => {
      if (i === 0) h.ui.toast('The stone is awake, and the land around it remembers its colour. Your journal (J) keeps every memory you find.', 7);
      else if (i === G.LORE.length - 1) h.ui.toast('That was the last memory. Now you know why the world faded — and how to bring it back.', 7);
    };
    h.ui.refresh();
  }
};
