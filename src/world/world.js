// The endless world: terrain generated from the seed, plus everything the
// player has changed (gathered objects, buildings).
window.G = window.G || {};

G.key = (tx, ty) => tx + ',' + ty;

G.World = class {
  constructor(seed) {
    this.seed = seed;
    this.cache = new Map();       // generated tiles
    this.harvested = new Map();   // key -> game time when it regrows
    this.structures = new Map();  // key -> { type, tx, ty } (planted things also carry g = growth 0..1, wet = seconds)
    this.grown = new Map();       // key -> object type grown from a seed (a garden bloom, a planted tree)
    this.lights = [];             // derived from structures
    this.lightsVersion = 0;       // bumps when lights change (the map recolours)
    this.time = 0;                // game time in seconds (set by main)
  }

  // ---------- generation ----------
  tileAt(tx, ty) {
    const k = G.key(tx, ty);
    let t = this.cache.get(k);
    if (t) return t;
    const s = this.seed;
    const e = G.fbm(tx * 0.018, ty * 0.018, s, 5);            // elevation
    const m = G.fbm(tx * 0.03 + 100, ty * 0.03, s + 777, 3);  // moisture
    let type;
    if (e < 0.36) type = 'deep';
    else if (e < 0.42) type = 'water';
    else if (e < 0.445) type = 'sand';
    else if (e > 0.68) type = 'stone';
    else if (m > 0.55) type = 'forest';
    else type = 'grass';

    const v = G.hash2(tx, ty, s + 7);      // colour variation
    const o = G.hash2(tx, ty, s + 31);     // object placement
    let obj = null;
    if (type === 'forest') obj = o < 0.32 ? 'tree' : o > 0.975 ? 'bloom' : null;
    else if (type === 'grass') obj = o < 0.035 ? 'tree' : o > 0.978 ? 'bloom' : o < 0.045 ? 'rock' : null;
    else if (type === 'stone') obj = o < 0.14 ? 'rock' : o > 0.99 ? 'crystal' : null;
    else if (type === 'sand') obj = o < 0.015 ? 'rock' : o > 0.93 ? 'reeds' : null;
    if (type === 'grass' && !obj && o > 0.966) obj = 'reeds';

    const soft = G.valueNoise(tx * 0.15, ty * 0.15, s + 55);  // gentle colour patches
    t = { type, v, soft, obj, hue: Math.floor(G.hash2(tx, ty, s + 99) * 360) };
    if (this.cache.size > 150000) this.cache.clear();
    this.cache.set(k, t);
    return t;
  }

  // ---------- queries ----------
  objectAt(tx, ty) {
    const k = G.key(tx, ty);
    if (this.structures.has(k)) return null;
    const obj = this.tileAt(tx, ty).obj || this.grown.get(k);
    if (!obj) return null;
    const regrow = this.harvested.get(k);
    if (regrow !== undefined) {
      if (this.time < regrow) return null;
      this.harvested.delete(k);
    }
    return obj;
  }

  // A gathered object that is growing back: { obj, p } with p = 0 (just gathered) .. 1 (back), or null.
  regrowAt(tx, ty) {
    const t = this.tileAt(tx, ty);
    if (!t.obj && !this.grown.size) return null;
    const k = G.key(tx, ty), at = this.harvested.get(k);
    if (at === undefined || this.time >= at) return null;
    const obj = t.obj || this.grown.get(k);
    if (!obj || this.structures.has(k)) return null;
    return { obj, p: G.clamp(1 - (at - this.time) / G.OBJECTS[obj].regrow, 0, 1) };
  }

  structureAt(tx, ty) { return this.structures.get(G.key(tx, ty)) || null; }

  isWater(tx, ty) { return !!G.TILES[this.tileAt(tx, ty).type].water; }

  isSolid(tx, ty) {
    const st = this.structureAt(tx, ty);
    if (st) return !!G.STRUCTURES[st.type].solid;
    if (this.isWater(tx, ty)) return true;
    const o = this.objectAt(tx, ty);
    return o ? !!G.OBJECTS[o].solid : false;
  }

  // ---------- changes ----------
  harvest(tx, ty) {
    const o = this.objectAt(tx, ty);
    if (!o) return null;
    this.harvested.set(G.key(tx, ty), this.time + G.OBJECTS[o].regrow);
    return o;
  }

  canBuild(type, tx, ty) {
    const def = G.STRUCTURES[type];
    if (this.structureAt(tx, ty)) return false;
    if (this.objectAt(tx, ty)) return false;
    if (def.soil) {   // plants need the right ground, and a spot nothing else will grow back on
      const t = this.tileAt(tx, ty), k = G.key(tx, ty);
      if (!def.soil.includes(t.type) || t.obj || this.grown.has(k)) return false;
    }
    const water = this.isWater(tx, ty);
    return def.on === 'water' ? water : !water;
  }

  build(type, tx, ty) {
    const st = { type, tx, ty };
    if (G.STRUCTURES[type].grow) { st.g = 0; st.wet = 0; }
    this.structures.set(G.key(tx, ty), st);
    const def = G.STRUCTURES[type];
    if (def.restore || def.light) this.rebuildLights();
  }

  // Saved structures: [type, tx, ty] or, for planted things, [type, tx, ty, growth, wet].
  loadStructures(list) {
    for (const [type, tx, ty, g, wet] of list || []) {
      if (!G.STRUCTURES[type]) continue;
      const st = { type, tx, ty };
      if (G.STRUCTURES[type].grow) { st.g = +g || 0; st.wet = +wet || 0; }
      this.structures.set(G.key(tx, ty), st);
    }
    this.rebuildLights();
  }

  remove(tx, ty) {
    const k = G.key(tx, ty), st = this.structures.get(k);
    if (!st) return null;
    this.structures.delete(k);
    const def = G.STRUCTURES[st.type];
    if (def.restore || def.light) this.rebuildLights();
    return st;
  }

  // lights that bring colour back, not counting the Heart Stone
  litCount() { let n = 0; for (const L of this.lights) if (L.restore && L.type !== 'heart') n++; return n; }

  count(type) { let n = 0; for (const s of this.structures.values()) if (s.type === type) n++; return n; }

  rebuildLights() {
    this.lightsVersion++;
    this.lights = [];
    for (const st of this.structures.values()) {
      const def = G.STRUCTURES[st.type];
      if (def.restore || def.light) {
        this.lights.push({
          type: st.type, x: (st.tx + 0.5) * G.TILE, y: (st.ty + 0.5) * G.TILE,
          restore: def.restore || 0, light: def.light || 0,
        });
      }
    }
  }

  // How "restored" (colourful) the world is at a pixel position: 0..1
  restoreAt(px, py, lights) {
    let f = 0;
    for (const L of lights) {
      if (!L.restore) continue;
      const d = Math.hypot(px - L.x, py - L.y) / G.TILE;
      const v = 1 - (d - L.restore) / 3;
      if (v > f) { f = v; if (f >= 1) return 1; }
    }
    return G.clamp(f, 0, 1);
  }

  // Find a good spawn point near the origin: open grass with land around it.
  findSpawn() {
    for (let r = 0; r < 400; r += 2) {
      for (let a = 0; a < 16; a++) {
        const tx = Math.round(Math.cos(a / 16 * 6.283) * r);
        const ty = Math.round(Math.sin(a / 16 * 6.283) * r);
        let ok = true;
        for (let dx = -3; dx <= 3 && ok; dx++)
          for (let dy = -3; dy <= 3 && ok; dy++)
            if (this.isWater(tx + dx, ty + dy)) ok = false;
        if (ok && this.tileAt(tx, ty).type === 'grass') return { tx, ty };
      }
    }
    return { tx: 0, ty: 0 };
  }
};
