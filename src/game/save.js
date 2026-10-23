// Saving and loading progress in the browser (localStorage).
// If you change what gets saved, bump VERSION and keep loading old saves working.
window.G = window.G || {};

G.Save = {
  KEY: 'lumen-save',
  VERSION: 1,

  write(state) {
    try {
      const w = state.world;
      const data = {
        version: this.VERSION,
        seed: w.seed,
        time: state.time,
        player: { x: state.player.x, y: state.player.y },
        inv: state.inv,
        stats: state.stats,
        structures: [...w.structures.values()].map(s => [s.type, s.tx, s.ty]),
        harvested: [...w.harvested.entries()].filter(([, t]) => t > state.time),
      };
      localStorage.setItem(this.KEY, JSON.stringify(data));
    } catch (e) { /* storage unavailable — game still works, just won't save */ }
  },

  read() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return null;
      const d = JSON.parse(raw);
      if (!d || typeof d.seed !== 'number') return null;
      return d;
    } catch (e) { return null; }
  },

  clear() { try { localStorage.removeItem(this.KEY); } catch (e) {} },
};
