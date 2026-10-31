// Saving and loading progress in the browser (localStorage).
// If you change what gets saved, bump VERSION and keep loading old saves working.
window.G = window.G || {};

G.Save = {
  KEY: 'lumen-save',
  VERSION: 2,   // 2: explored map + first-steps goals (Night 2)

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
        structures: [...w.structures.values()].map(s => s.g === undefined ? [s.type, s.tx, s.ty]
          : [s.type, s.tx, s.ty, Math.round(s.g * 1000) / 1000, Math.round(s.wet || 0)]),   // planted things keep their growth (Night 8)
        grown: [...w.grown.entries()],   // optional (Night 8): things grown from seed
        harvested: [...w.harvested.entries()].filter(([, t]) => t > state.time),
        explored: state.explored.serialize(),
        goalsDone: state.goalsDone,
        goalsHidden: !!state.goalsHidden,
        weather: state.weather ? state.weather.serialize() : null,   // optional (Night 5): older saves start clear
        villagers: state.villagers ? state.villagers.serialize() : null,   // optional (Night 6): older saves have nobody yet
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
      return this.upgrade(d);
    } catch (e) { return null; }
  },

  // Bring saves from older versions up to date.
  upgrade(d) {
    d.stats = d.stats || { gathered: 0, built: 0 };
    d.stats.got = d.stats.got || {};
    d.stats.met = d.stats.met || {};   // creature kinds met (Night 3) — optional, no version bump needed
    if (!(d.version >= 2)) {
      // v1 had no map or goals: the map starts from what's around you and your
      // lanterns, and anyone who already lit a lantern skips the first lessons.
      d.explored = null;
      const lit = (d.structures || []).some(s => s[0] === 'lantern');
      d.goalsDone = lit ? ['wood', 'stone', 'petal', 'lantern'] : [];
      d.version = 2;
    }
    d.goalsDone = Array.isArray(d.goalsDone) ? d.goalsDone : [];
    return d;
  },

  clear() { try { localStorage.removeItem(this.KEY); } catch (e) {} },
};
