// Which tiles the player has seen — the "fog of war" behind the map.
// The world is cut into chunks of CHUNK x CHUNK tiles; each explored chunk
// keeps one byte per tile (1 = seen). Saved compactly as base64 bitmasks.
window.G = window.G || {};

G.CHUNK = 16;

G.Explored = class {
  constructor() {
    this.chunks = new Map();   // "cx,cy" -> Uint8Array(CHUNK*CHUNK)
    this.count = 0;            // total tiles seen
    this.version = 0;          // bumps whenever something new is seen
    this.dirty = new Set();    // chunk keys whose map image must be redrawn
  }

  static chunkOf(tx, ty) {
    const C = G.CHUNK;
    const cx = Math.floor(tx / C), cy = Math.floor(ty / C);
    return { cx, cy, i: (ty - cy * C) * C + (tx - cx * C) };
  }

  has(tx, ty) {
    const { cx, cy, i } = G.Explored.chunkOf(tx, ty);
    const c = this.chunks.get(cx + ',' + cy);
    return !!(c && c[i]);
  }

  // Mark a circle of tiles around (tx, ty) as seen.
  reveal(tx, ty, r) {
    const r2 = r * r;
    let added = 0;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const x = tx + dx, y = ty + dy;
      const { cx, cy, i } = G.Explored.chunkOf(x, y);
      const k = cx + ',' + cy;
      let c = this.chunks.get(k);
      if (!c) { c = new Uint8Array(G.CHUNK * G.CHUNK); this.chunks.set(k, c); }
      if (!c[i]) { c[i] = 1; added++; this.dirty.add(k); }
    }
    if (added) { this.count += added; this.version++; }
    return added;
  }

  // ---------- saving ----------
  serialize() {
    const out = [];
    for (const [k, c] of this.chunks) {
      const bytes = new Uint8Array(c.length / 8);
      for (let i = 0; i < c.length; i++) if (c[i]) bytes[i >> 3] |= 1 << (i & 7);
      out.push([k, btoa(String.fromCharCode.apply(null, bytes))]);
    }
    return out;
  }

  load(list) {
    for (const [k, b64] of list || []) {
      let s;
      try { s = atob(b64); } catch (e) { continue; }
      const c = new Uint8Array(G.CHUNK * G.CHUNK);
      for (let i = 0; i < c.length; i++) if (s.charCodeAt(i >> 3) & (1 << (i & 7))) { c[i] = 1; this.count++; }
      this.chunks.set(k, c);
      this.dirty.add(k);
    }
    this.version++;
  }
};
