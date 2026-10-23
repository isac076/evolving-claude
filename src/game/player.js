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
    const len = Math.hypot(ix, iy) || 1;
    const tvx = ix / len * this.speed, tvy = iy / len * this.speed;
    const k = 1 - Math.pow(0.0005, dt);           // smooth acceleration
    this.vx += (tvx - this.vx) * k;
    this.vy += (tvy - this.vy) * k;
    if (Math.abs(this.vx) > 5) this.facing = Math.sign(this.vx);

    this.moveAxis(this.vx * dt, 0, world);
    this.moveAxis(0, this.vy * dt, world);
    this.bob += dt * (2 + Math.hypot(this.vx, this.vy) / 40);
  }

  moveAxis(dx, dy, world) {
    const nx = this.x + dx, ny = this.y + dy, r = this.r, T = G.TILE;
    const pts = [[nx - r, ny], [nx + r, ny], [nx, ny - r * 0.6], [nx, ny + r * 0.6]];
    for (const [px, py] of pts) {
      if (world.isSolid(Math.floor(px / T), Math.floor(py / T))) {
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
