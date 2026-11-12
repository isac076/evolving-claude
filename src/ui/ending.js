// G.Ending — the little ending after the Great Sun rises (Night 20; words in
// G.ENDING, src/data/sun.js). A warm full-screen page: the title, a few lines
// that fade in one by one, your journey in numbers, and "Keep shining" — which
// closes it and lets you play on. While it is open the world is paused.
window.G = window.G || {};

G.Ending = class {
  constructor(state) {
    this.state = state;
    this.el = document.getElementById('ending');
    this.isOpen = false; this.t0 = 0; this.done = null;
    document.getElementById('ending-go').onclick = () => this.close();
  }

  // the journey in numbers (only the ones that are more than zero)
  journey() {
    const s = this.state, st = s.stats, count = v => !v ? 0 : Array.isArray(v) ? v.length : typeof v === 'object' ? Object.keys(v).length : +v || 0;
    const days = Math.max(1, Math.floor(s.time / G.DAY_LENGTH) + 1);
    const folk = s.villagers ? s.villagers.list.length : 0;
    const rows = [
      [days, 'day', 'days'],
      [s.world.litCount(), 'light lit', 'lights lit'],
      [folk, 'friend home', 'friends home'],
      [count(st.memories), 'memory', 'memories'],
      [count(st.met), 'kind of creature met', 'kinds of creature met'],
      [count(st.seasons && st.seasons.seen), 'season seen', 'seasons seen'],
      [(st.travel && st.travel.trips) || 0, 'flight on the lantern roads', 'flights on the lantern roads'],
      [(st.hush && st.hush.eased) || 0, 'hushling eased', 'hushlings eased'],
    ].filter(r => r[0] > 0);
    return rows.map(([n, one, many]) => `<span><b>${n}</b> ${n === 1 ? one : many}</span>`).join('');
  }

  open(done) {
    const E = G.ENDING;
    this.done = done || null;
    document.getElementById('ending-title').textContent = E.title;
    document.getElementById('ending-lines').innerHTML = E.lines.map((l, i) => `<p style="animation-delay:${1.2 + i * 2.2}s">${l}</p>`).join('');
    const after = 1.2 + E.lines.length * 2.2;
    document.getElementById('ending-journey').innerHTML = `<small>${E.journey}</small><div>${this.journey()}</div>`;
    document.getElementById('ending-journey').style.animationDelay = after + 's';
    const close = document.getElementById('ending-close');
    close.textContent = E.close; close.style.animationDelay = (after + 1.4) + 's';
    const go = document.getElementById('ending-go');
    go.textContent = E.button; go.style.animationDelay = (after + 2.4) + 's';
    this.ready = (after + 2.4) * 1000;
    this.isOpen = true; this.t0 = performance.now();
    this.el.classList.remove('open'); void this.el.offsetWidth;   // restart the fade-ins
    this.el.classList.add('open');
    document.body.classList.add('paused');
    const st = this.state.stats.sun || (this.state.stats.sun = {});
    st.ending = (st.ending || 0) + 1;
  }

  // keys while it is open: Enter / E / Space close it once the button has appeared (Esc a little sooner)
  keys(input) {
    const t = performance.now() - this.t0;
    if ((input.hit('enter', 'e', ' ') && t > this.ready) || (input.hit('escape') && t > 2500)) this.close();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.el.classList.remove('open');
    document.body.classList.remove('paused');
    G.Sound.play('close');
    if (this.done) { const f = this.done; this.done = null; f(); }
  }
};
