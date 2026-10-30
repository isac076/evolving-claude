// G.Settings — the "Resting" menu (Esc or the gear button). The world pauses
// while it is open. Sound volume, comfort options, how to play, and the way
// back to the title screen or to a brand new world.
// Comfort options live in localStorage 'lumen-prefs' (not in the save).
window.G = window.G || {};

G.Settings = class {
  constructor(state, ui, hooks) {
    this.state = state; this.ui = ui; this.hooks = hooks;   // hooks: { title(), newWorld() }
    this.$ = id => document.getElementById(id);
    this.el = this.$('settings');
    this.isOpen = false;
    this.prefs = { bigText: false, hints: true };
    try { Object.assign(this.prefs, JSON.parse(localStorage.getItem('lumen-prefs') || '{}')); } catch (e) {}
    this.applyPrefs();

    this.$('btn-settings').onclick = () => this.toggle();
    this.$('settings-close').onclick = () => this.toggle(false);
    this.$('set-resume').onclick = () => this.toggle(false);
    this.el.addEventListener('pointerdown', e => { if (e.target === this.el) this.toggle(false); });   // click outside

    // sound
    const vol = this.$('set-volume'), world = this.$('set-world');
    vol.oninput = () => { G.Sound.setVolume(vol.value / 100); if (G.Sound.muted) { G.Sound.setMuted(false); this.ui.showSound(); } this.showSound(); };
    world.oninput = () => { G.Sound.setWorld(world.value / 100); this.showSound(); };
    vol.onchange = () => G.Sound.play('select');
    this.$('set-sound').onclick = () => { this.ui.toggleSound(); this.showSound(); };

    // comfort
    this.$('set-bigtext').onclick = () => { this.prefs.bigText = !this.prefs.bigText; this.savePrefs(); };
    this.$('set-hints').onclick = () => { this.prefs.hints = !this.prefs.hints; this.savePrefs(); };

    // leaving
    this.$('set-title').onclick = () => this.hooks.title();
    const fresh = this.$('set-new');
    fresh.onclick = () => {
      if (!fresh.classList.contains('sure')) {   // ask once more, gently, right on the button
        fresh.classList.add('sure'); fresh.textContent = 'Really start over?';
        G.Sound.play('deny');
        clearTimeout(this.sureTimer);
        this.sureTimer = setTimeout(() => this.resetNew(), 4000);
        return;
      }
      this.hooks.newWorld();
    };
  }

  resetNew() { const b = this.$('set-new'); b.classList.remove('sure'); b.textContent = 'New world'; }

  toggle(force) {
    const open = force === undefined ? !this.isOpen : force;
    if (open === this.isOpen || !this.state.running) return;
    this.isOpen = open;
    this.el.classList.toggle('open', open);
    document.body.classList.toggle('paused', open);
    G.Sound.play(open ? 'open' : 'close');
    G.Sound.duck(open);
    this.resetNew();
    if (open) {
      G.Save.write(this.state);   // a safe moment to save
      this.showSound(); this.showPrefs(); this.showSummary();
    }
  }

  showSound() {
    const vol = this.$('set-volume'), world = this.$('set-world');
    vol.value = Math.round(G.Sound.volume * 100);
    world.value = Math.round(G.Sound.world * 100);
    this.$('set-volume-n').textContent = G.Sound.muted ? 'off' : vol.value + '%';
    this.$('set-world-n').textContent = world.value + '%';
    this.setSwitch('set-sound', !G.Sound.muted);
    this.el.classList.toggle('muted', G.Sound.muted);
  }

  setSwitch(id, on) { const b = this.$(id); b.classList.toggle('on', on); b.setAttribute('aria-checked', on); }

  savePrefs() {
    try { localStorage.setItem('lumen-prefs', JSON.stringify(this.prefs)); } catch (e) {}
    G.Sound.play('toggle');
    this.applyPrefs(); this.showPrefs();
  }
  applyPrefs() {
    document.body.classList.toggle('big-text', !!this.prefs.bigText);
    document.body.classList.toggle('no-hints', !this.prefs.hints);
  }
  showPrefs() { this.setSwitch('set-bigtext', !!this.prefs.bigText); this.setSwitch('set-hints', !!this.prefs.hints); }

  // a little line about the world so far
  showSummary() {
    const s = this.state, w = s.world;
    const day = Math.floor(s.time / G.DAY_LENGTH) + 1;
    const lit = w.litCount(), friends = s.villagers ? s.villagers.list.length : 0;
    const bits = [`Day ${day}`, `${lit} light${lit === 1 ? '' : 's'} lit`];
    if (friends) bits.push(`${friends} friend${friends === 1 ? '' : 's'} at home`);
    bits.push(`${s.explored.count.toLocaleString()} places seen`);
    this.$('settings-summary').textContent = bits.join(' · ');
  }
};
