// Crafting rules shared by the game and the UI: workbenches, tools, and
// picking buildings back up (with their materials refunded).
window.G = window.G || {};

G.Crafting = {
  // the recipe that builds a structure type (for refunds)
  recipeFor(type) { return G.RECIPES.find(r => r.builds === type) || null; },

  // Is a workbench within reach of the player?
  nearWorkbench(state) {
    const p = state.player, w = state.world, R = G.WORKBENCH_REACH;
    if (!p || !w) return false;
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      const st = w.structureAt(p.tx + dx, p.ty + dy);
      if (st && G.STRUCTURES[st.type].workbench
        && Math.hypot((st.tx + 0.5) * G.TILE - p.x, (st.ty + 0.5) * G.TILE - p.y) <= (R + 0.5) * G.TILE) return true;
    }
    return false;
  },

  owns(state, item) { return (state.inv[item] || 0) > 0; },

  // Why can't this recipe be used right now? null = it can.
  blocker(state, r) {
    if (r.makes && G.ITEMS[r.makes].tool && this.owns(state, r.makes)) return 'owned';
    if (r.at === 'workbench' && !this.nearWorkbench(state)) return 'far';
    if (!state.canAfford(r)) return 'cost';
    return null;
  },

  // Can the player gather this object? Returns null, or a message why not.
  gatherBlocker(state, obj) {
    const need = G.OBJECTS[obj].needs;
    if (need && !this.owns(state, need)) return `You need a ${G.ITEMS[need].name} for that — craft one at a workbench.`;
    return null;
  },

  // Everything an object gives, including the bonus from a tool you own.
  dropsFor(state, obj) {
    const def = G.OBJECTS[obj], out = { ...def.drops };
    if (def.tool && def.bonus && this.owns(state, def.tool))
      for (const [k, n] of Object.entries(def.bonus)) out[k] = (out[k] || 0) + n;
    return out;
  },

  // Can this building be picked up? null = yes, else a message why not.
  pickupBlocker(state, st) {
    const def = G.STRUCTURES[st.type];
    if (def.fixed) return `The ${def.name} can't be moved — it holds the world together.`;
    const p = state.player;
    if (def.bridge && p.tx === st.tx && p.ty === st.ty) return 'Step off the bridge first.';
    return null;
  },

  // Remove a building and give back what it cost. Returns the refund.
  pickUp(state, tx, ty) {
    const st = state.world.remove(tx, ty);
    if (!st) return null;
    const r = this.recipeFor(st.type), refund = r ? { ...r.cost } : {};
    for (const [k, n] of Object.entries(refund)) state.inv[k] = (state.inv[k] || 0) + n;
    return refund;
  },
};
