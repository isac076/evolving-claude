// The player: a small lantern spirit.
window.G = window.G || {};

G.Player = class {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.r = 9;            // collision radius
    this.speed = 150;      // px per second
    this.facing = 1;
    this.moveTarget = null;
    this.bob = 0;
    this.glow = 1;         // the spirit's light: hushlings sip it at night (Night 19)
    this.canSail = false;  // owns a leaf boat: water is no longer a wall (set by G.Sailing, Night 23)
    this.afloat = false;   // in the boat right now (on a water tile with no bridge under it)
    this.bumpWater = 0;    // seconds ago the spirit last walked into water it couldn't cross
    this.tilt = 0;         // the boat leans into turns
  }

  // can the spirit go onto this tile? (water is open to a sailor, unless something stands there)
  blocked(world, tx, ty) {
    if (this.canSail && world.isWater(tx, ty)) {
      const st = world.structureAt(tx, ty);
      return !!(st && G.STRUCTURES[st.type].solid);
    }
    return world.isSolid(tx, ty);
  }

  update(dt, input, world) {
    let ix = 0, iy = 0;
    if (input.held('a', 'arrowleft')) ix -= 1;
    if (input.held('d', 'arrowright')) ix += 1;
    if (input.held('w', 'arrowup')) iy -= 1;
    if (input.held('s', 'arrowdown')) iy += 1;
    if (ix || iy) this.moveTarget = null;
    if (!ix && !iy && this.moveTarget) {
      const dx = this.moveTarget.x - this.x, dy = this.moveTarget.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d < 6) this.moveTarget = null; else { ix = dx / d; iy = dy / d; }
    }
    const len = Math.hypot(ix, iy) || 1, sp = this.afloat ? G.SEA.speed : this.speed;
    const tvx = ix / len * sp, tvy = iy / len * sp;
    const k = 1 - Math.pow(this.afloat ? G.SEA.grip : 0.0005, dt);   // smooth acceleration (afloat: a long, easy glide)
    const ovx = this.vx;
    this.vx += (tvx - this.vx) * k;
    this.vy += (tvy - this.vy) * k;
    if (Math.abs(this.vx) > 5) this.facing = Math.sign(this.vx);

    this.moveAxis(this.vx * dt, 0, world);
    this.moveAxis(0, this.vy * dt, world);
    this.bob += dt * (2 + Math.hypot(this.vx, this.vy) / 40);
    this.bumpWater += dt;
    const here = world.structureAt(this.tx, this.ty);
    this.afloat = this.canSail && world.isWater(this.tx, this.ty) && !(here && G.STRUCTURES[here.type].floor);
    // lean into a turn, settle back when gliding straight
    const lean = this.afloat ? G.clamp((this.vx - ovx) / Math.max(dt, 0.001) / 900, -1, 1) * 0.12 : 0;
    this.tilt += (lean - this.tilt) * Math.min(1, dt * 4);
  }

  moveAxis(dx, dy, world) {
    const nx = this.x + dx, ny = this.y + dy, r = this.r, T = G.TILE;
    const pts = [[nx - r, ny], [nx + r, ny], [nx, ny - r * 0.6], [nx, ny + r * 0.6]];
    // something grew (or stood) where the spirit already is: let it walk out
    if (this.blocked(world, Math.floor(this.x / T), Math.floor(this.y / T))) { this.x = nx; this.y = ny; return; }
    for (const [px, py] of pts) {
      const bx = Math.floor(px / T), by = Math.floor(py / T);
      if (this.blocked(world, bx, by)) {
        if (!this.canSail && world.isWater(bx, by) && !world.structureAt(bx, by)) this.bumpWater = 0;
        if (dx) this.vx *= 0.2; if (dy) this.vy *= 0.2;
        this.moveTarget = null;
        return;
      }
    }
    this.x = nx; this.y = ny;
  }

  get tx() { return Math.floor(this.x / G.TILE); }
  get ty() { return Math.floor(this.y / G.TILE); }
};
