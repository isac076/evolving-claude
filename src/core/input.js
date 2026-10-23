// Keyboard, mouse and touch input.
window.G = window.G || {};

G.Input = class {
  constructor(canvas) {
    this.keys = {};
    this.pressed = {};        // keys pressed this frame
    this.mouse = { x: 0, y: 0, down: false, clicked: false };
    window.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      if (!this.keys[k]) this.pressed[k] = true;
      this.keys[k] = true;
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
    });
    window.addEventListener('keyup', e => { this.keys[e.key.toLowerCase()] = false; });
    const pos = e => {
      const p = e.touches ? e.touches[0] : e;
      if (p) { this.mouse.x = p.clientX; this.mouse.y = p.clientY; }
    };
    canvas.addEventListener('mousemove', pos);
    canvas.addEventListener('mousedown', e => { pos(e); this.mouse.down = true; this.mouse.clicked = true; });
    window.addEventListener('mouseup', () => { this.mouse.down = false; });
    canvas.addEventListener('touchstart', e => { pos(e); this.mouse.down = true; this.mouse.clicked = true; e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchmove', e => { pos(e); e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchend', () => { this.mouse.down = false; });
  }
  held(...ks) { return ks.some(k => this.keys[k]); }
  hit(...ks) { return ks.some(k => this.pressed[k]); }
  endFrame() { this.pressed = {}; this.mouse.clicked = false; }
};
