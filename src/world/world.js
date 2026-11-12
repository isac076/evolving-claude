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
    this.floor = 0;               // once the Great Sun burns, all land is at least this coloured (Night 20)
    this.floorScale = 1;          // 0..1 while the Sun is rising (G.SunPlay eases it in)
    this.time = 0;                // game time in seconds (set by main)
  }

  // ---------- generation ----------
  // The ground type at a tile, straight from the seed (no cache, no objects).
  // base = the old ground only, without the Glowcap Hollows (Night 17): the start,
  // the ruins and the hollows themselves are placed from it, so they never move.
  groundType(tx, ty, base) {
    const s = this.seed;
    const e = G.fbm(tx * 0.018, ty * 0.018, s, 5);            // elevation
    if (e < 0.36) return 'deep';
    if (e < 0.42) return 'water';
    if (e < 0.445) return 'sand';
    if (e > 0.68) return 'stone';
    const m = G.fbm(tx * 0.03 + 100, ty * 0.03, s + 777, 3);  // moisture
    if (!base && m > 0.2 && G.Hollow.at(this, tx, ty, m)) return 'mushwood';
    return m > 0.55 ? 'forest' : 'grass';
  }

  tileAt(tx, ty) {
    const k = G.key(tx, ty);
    let t = this.cache.get(k);
    if (t) return t;
    const s = this.seed;
    const type = this.groundType(tx, ty);

    const v = G.hash2(tx, ty, s + 7);      // colour variation
    const o = G.hash2(tx, ty, s + 31);     // object placement
    let obj = null;
    if (type === 'forest') obj = o < 0.32 ? 'tree' : o > 0.975 ? 'bloom' : null;
    else if (type === 'grass') obj = o < 0.035 ? 'tree' : o > 0.978 ? 'bloom' : o < 0.045 ? 'rock' : null;
    else if (type === 'stone') obj = o < 0.14 ? 'rock' : o > 0.99 ? 'crystal' : null;
    else if (type === 'sand') obj = o < 0.015 ? 'rock' : o > 0.93 ? 'reeds' : null;
    if (type === 'grass' && !obj && o > 0.966) obj = 'reeds';
    if (type === 'mushwood') obj = o < 0.035 ? 'tree' : o < 0.15 ? 'bigshroom' : o > 0.956 ? 'glowcap' : null;
    // soft clay where the shallows meet the shore (Night 18)
    const cr = !obj && G.RIVER.clayOn[type];
    if (cr && o >= cr[0] && o < cr[1] && this.besideShallows(tx, ty)) obj = 'claybank';

    const soft = G.valueNoise(tx * 0.15, ty * 0.15, s + 55);  // gentle colour patches
    t = { type, v, soft, obj, hue: Math.floor(G.hash2(tx, ty, s + 99) * 360) };
    // ruins of the old world (world/ruins.js) clear the ground they stand on
    const ruin = G.Ruins.pieceAt(this, tx, ty);
    if (ruin) {
      t.obj = G.RUIN_PIECES[ruin.ch] || null;
      t.ruin = ruin.site;
      if (ruin.ch === '.') t.pave = true;
    }
    // the Ember Shrines (world/shrines.js) do the same, with warm ember flagstones
    const shrine = G.Shrines.pieceAt(this, tx, ty);
    if (shrine && shrine.ch !== ' ') {
      t.obj = G.SHRINE_PIECES[shrine.ch] || null;
      t.shrine = shrine.site;
      t.pave = true;
    } else if (shrine) { t.obj = null; t.shrine = shrine.site; }
    // the Sun's Hearth (world/sun.js, Night 20): golden flagstones, pillars, four sockets and the altar
    const sun = !shrine && G.Sun.pieceAt(this, tx, ty);
    if (sun) {
      t.obj = sun.ch === ' ' ? null : G.SUN_PIECES[sun.ch] || null;
      t.sun = sun.site;
      if (sun.ch !== ' ') t.pave = true;
      if (sun.ch === 'S') t.sock = G.Sun.socketAt(this, tx, ty);   // which shrine's ember it waits for
    }
    if (this.cache.size > 150000) this.cache.clear();
    this.cache.set(k, t);
    return t;
  }

  // is shallow water right next to this tile? (ground only, so it is safe inside tileAt)
  besideShallows(tx, ty) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (this.groundType(tx + dx, ty + dy) === 'water') return true;
    return false;
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
    if (def.on === 'shallow') return this.tileAt(tx, ty).type === 'water';   // stepping stones: not in the deep
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

  // lights that bring colour back, not counting the Heart Stone or a shrine's ember bowls
  litCount() { let n = 0; for (const L of this.lights) if (L.restore && L.type !== 'heart' && L.type !== 'emberflame') n++; return n; }

  count(type) { let n = 0; for (const s of this.structures.values()) if (s.type === type) n++; return n; }

  rebuildLights() {
    this.lightsVersion++;
    this.lights = [];
    this.floor = 0;
    for (const st of this.structures.values()) {
      const def = G.STRUCTURES[st.type];
      if (def.sun) this.floor = G.SUN.floor * this.floorScale;
      if (def.restore || def.light) {
        this.lights.push({
          type: st.type, x: (st.tx + 0.5) * G.TILE, y: (st.ty + 0.5) * G.TILE,
          restore: def.restore || 0, light: def.light || 0,
          hue: def.ember ? G.Shrines.hueAt(this, st.tx, st.ty) : def.lightHue,   // a shrine's ember colour, a mushroom lamp's teal
        });
      }
    }
  }

  // How "restored" (colourful) the world is at a pixel position: 0..1
  // (never below `floor` once the Great Sun burns — unless raw: the hushlings only feel real light)
  restoreAt(px, py, lights, raw) {
    let f = raw ? 0 : this.floor;
    for (const L of lights) {
      if (!L.restore) continue;
      const d = Math.hypot(px - L.x, py - L.y) / G.TILE;
      const v = 1 - (d - L.restore) / 3;
      if (v > f) { f = v; if (f >= 1) return 1; }
    }
    return G.clamp(f, 0, 1);
  }

  // Find a good spawn point near the origin: open grass with land around it.
  // Uses only the ground (not objects or ruins), so ruins can stay away from it.
  spawnSpot() {
    if (this.spawn) return this.spawn;
    const water = (x, y) => !!G.TILES[this.groundType(x, y, true)].water;
    for (let r = 0; r < 400; r += 2) {
      for (let a = 0; a < 16; a++) {
        const tx = Math.round(Math.cos(a / 16 * 6.283) * r);
        const ty = Math.round(Math.sin(a / 16 * 6.283) * r);
        let ok = true;
        for (let dx = -3; dx <= 3 && ok; dx++)
          for (let dy = -3; dy <= 3 && ok; dy++)
            if (water(tx + dx, ty + dy)) ok = false;
        if (ok && this.groundType(tx, ty, true) === 'grass') return (this.spawn = { tx, ty });
      }
    }
    return (this.spawn = { tx: 0, ty: 0 });
  }

  findSpawn() { return { ...this.spawnSpot() }; }
};
