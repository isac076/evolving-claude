// The goal tracker: shows the current first-steps goal (from G.GOALS),
// its progress, and celebrates each one when it's done.
window.G = window.G || {};

G.Goals = class {
  constructor(state, ui) {
    this.state = state; this.ui = ui;
    this.el = document.getElementById('goals');
    this.timer = 0;
    this.celebrate = 0;     // seconds left showing the "done!" state
    this.shownId = null;
  }

  get current() {
    const done = this.state.goalsDone;
    return G.GOALS.find(g => !done.includes(g.id)) || null;
  }

  // Build the pips + panel for the goal that's showing now.
  render(goal, value, justDone) {
    const done = this.state.goalsDone;
    const pips = G.GOALS.map(g =>
      `<i class="${done.includes(g.id) ? 'on' : ''}${goal && g.id === goal.id ? ' now' : ''}"></i>`).join('');
    if (!goal) {
      this.el.innerHTML = `<div class="goal-head">First steps <span class="pips">${pips}</span></div>
        <div class="goal-text">All done — the world is yours to bring back.</div>`;
      return;
    }
    const frac = G.clamp(value / goal.target, 0, 1);
    const count = goal.percent ? `${Math.floor(frac * 100)}%` : `${Math.min(value, goal.target)} / ${goal.target}`;
    const reward = goal.reward ? Object.entries(goal.reward).map(([k, n]) =>
      `<span class="reward"><i style="background:${G.ITEMS[k].color}"></i>+${n}</span>`).join('') : '';
    this.el.innerHTML = `<div class="goal-head">First steps <span class="pips">${pips}</span></div>
      <div class="goal-text">${justDone ? '✓ ' : ''}${goal.text}<b>${justDone ? 'Done!' : count}</b></div>
      <div class="goal-bar"><span style="width:${(justDone ? 1 : frac) * 100}%"></span></div>
      <div class="goal-hint">${goal.hint || ''}${reward ? ' <span class="rewards">Reward ' + reward + '</span>' : ''}</div>`;
  }

  update(dt) {
    const s = this.state;
    if (s.goalsHidden) return;
    if (this.celebrate > 0) {
      this.celebrate -= dt;
      if (this.celebrate <= 0) { this.el.classList.remove('done'); this.shownId = null; }
      return;
    }
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = 0.25;

    const goal = this.current;
    if (!goal) {
      if (this.shownId !== 'all') {
        this.shownId = 'all'; this.render(null);
        this.el.classList.add('show');
        this.finishTimer = 8;
      } else if ((this.finishTimer -= 0.25) <= 0) {
        this.el.classList.remove('show'); s.goalsHidden = true;
      }
      return;
    }
    const value = goal.progress(s);
    if (value >= goal.target) { this.complete(goal); return; }
    const key = goal.id + ':' + value;
    if (key !== this.shownId) { this.shownId = key; this.render(goal, value); this.el.classList.add('show'); }
  }

  complete(goal) {
    const s = this.state;
    s.goalsDone.push(goal.id);
    let msg = `Goal complete: ${goal.text}.`;
    if (goal.reward) {
      for (const [k, n] of Object.entries(goal.reward)) s.inv[k] = (s.inv[k] || 0) + n;
      msg += ' Gift: ' + Object.entries(goal.reward).map(([k, n]) => `${n} ${G.ITEMS[k].name}`).join(', ') + '.';
      this.ui.refresh();
    }
    G.Sound.play('goal');
    this.ui.toast(msg, 3);
    this.render(goal, goal.target, true);
    this.el.classList.add('show', 'done');
    this.celebrate = 1.8;
  }
};
