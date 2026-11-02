// The friends' wishes list (Night 10): a small panel under the goal tracker
// showing who is wishing for what, how far along it is, and which ones are
// ready to come true. It sits just below the goals panel (or above it on phones).
window.G = window.G || {};

G.WishPanel = class {
  constructor(state, wishes) {
    this.state = state; this.wishes = wishes;
    this.el = document.getElementById('wishes');
    this.goals = document.getElementById('goals');
    this.timer = 0; this.html = '';
  }

  update(dt) {
    if ((this.timer -= dt) > 0) return;
    this.timer = 0.3;
    const s = this.state, list = s.running ? this.wishes.active(s) : [];
    const shown = list.slice(0, 4);
    let html = '';
    if (shown.length) {
      html = `<div class="wish-head">Friends' wishes</div>` + shown.map(({ v, w, p, ready }) => {
        const dot = `<i style="background:hsl(${v.hue},70%,70%);color:hsl(${v.hue},70%,70%)"></i>`;
        if (!v.wish.known) return `<div class="wish unknown">${dot}<span>${v.name} is wishing for something…</span></div>`;
        const count = ready ? '✓ talk to them' : p.need > 1 && w.type !== 'house' ? `${p.have}/${p.need}` : '';
        return `<div class="wish${ready ? ' ready' : ''}">${dot}<span>${v.name} <em>·</em> ${w.short}</span><b>${count}</b></div>`;
      }).join('') + (list.length > shown.length ? `<div class="wish-more">and ${list.length - shown.length} more…</div>` : '');
    }
    if (html !== this.html) { this.html = html; if (html) this.el.innerHTML = html; }
    this.el.classList.toggle('show', !!html);
    this.place();
  }

  // stay out of the goal tracker's way
  place() {
    const g = this.goals, small = window.innerWidth <= 600, on = g.classList.contains('show');
    if (small) {
      const r = g.getBoundingClientRect();
      this.el.style.top = 'auto';
      this.el.style.bottom = on ? (window.innerHeight - r.top + 8) + 'px' : '160px';
    } else {
      this.el.style.bottom = 'auto';
      this.el.style.top = on ? (g.offsetTop + g.offsetHeight + 8) + 'px' : '62px';
    }
  }
};
