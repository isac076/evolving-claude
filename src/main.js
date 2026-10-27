// Ties everything together: game state, the main loop, and player actions.
window.G = window.G || {};

(function () {
  const canvas = document.getElementById('game');
  const input = new G.Input(canvas);
  const renderer = new G.Renderer(canvas);
  const REACH = 2.2 * G.TILE;       // how far the player can gather
  const BUILD_REACH = 5 * G.TILE;   // how far away the player can build

  const state = {
    world: null, player: null, inv: {}, time: 0, stats: { gathered: 0, built: 0, got: {} },
    explored: new G.Explored(), goalsDone: [], goalsHidden: false,
    cam: { x: 0, y: 0 }, placing: null, buildRecipe: null, wantGather: false, removing: false, removeHover: null,
    floaters: [], running: false, saveTimer: 0,

    canAfford(r) { return Object.entries(r.cost).every(([k, n]) => (this.inv[k] || 0) >= n); },
    startBuild(r) {
      const why = G.Crafting.blocker(this, r);
      const name = r.builds ? G.STRUCTURES[r.builds].name : G.ITEMS[r.makes].name;
      if (why) {
        G.Sound.play('deny');
        ui.toast(why === 'owned' ? `You already have a ${name}.`
          : why === 'far' ? `Stand near a Workbench to make a ${name}.`
          : `Not enough materials for a ${name}.`);
        return;
      }
      this.setRemoving(false);
      if (r.makes) { craftItem(r); return; }
      G.Sound.play('select');
      this.buildRecipe = r;
    },
    setRemoving(on) {
      on = on === undefined ? !this.removing : on;
      if (on === this.removing) return;
      this.removing = on; this.removeHover = null;
      if (on) { this.buildRecipe = null; this.placing = null; G.Sound.play('select'); ui.toast('Click a building near you to pick it up — you get its materials back. Esc or X to stop.', 4); }
      ui.update(0);
    },
  };
  G.state = state;   // handy for debugging in the browser console
  const ui = new G.UI(state);
  const map = new G.Minimap(state);
  const goals = new G.Goals(state, ui);

  // creatures that return to restored land (not saved — they come and go)
  const life = new G.Creatures();
  state.creatures = life;
  life.fx = {
    burst: (x, y, color, n) => renderer.burst(x, y, color, n),
    sound: (name, x) => { if (state.running) G.Sound.play(name, { pan: panAt(x) }); },
  };
  life.onMeet = kind => {
    const def = G.CREATURES[kind];
    G.Sound.play('meet');
    ui.toast(def.meet, 5);
  };

  // ---------- starting / loading ----------
  function newGame(seed) {
    state.world = new G.World(seed);
    const sp = state.world.findSpawn();
    state.world.build('heart', sp.tx, sp.ty);
    state.player = new G.Player((sp.tx + 0.5) * G.TILE, (sp.ty + 2.5) * G.TILE);
    state.inv = {}; state.time = G.DAY_LENGTH * 0.85; state.stats = { gathered: 0, built: 0, got: {} };
    state.explored = new G.Explored(); state.explored.reveal(sp.tx, sp.ty, 12);
    state.goalsDone = []; state.goalsHidden = false;
    state.stats.met = {};
    afterLoad();
    setTimeout(() => G.Sound.play('welcome'), 350);   // give the audio a moment to wake up
    ui.toast('The world has faded. Gather wood, stone and glow petals, then craft a Lantern (C) to bring the colour back.', 9);
  }

  function loadGame(d) {
    state.world = new G.World(d.seed);
    for (const [type, tx, ty] of d.structures || []) if (G.STRUCTURES[type]) state.world.structures.set(G.key(tx, ty), { type, tx, ty });
    state.world.rebuildLights();
    for (const [k, t] of d.harvested || []) state.world.harvested.set(k, t);
    state.player = new G.Player(d.player.x, d.player.y);
    state.inv = d.inv || {}; state.time = d.time || 0; state.stats = d.stats;
    state.explored = new G.Explored();
    if (d.explored) state.explored.load(d.explored);
    else {   // older save: reveal the land around you and around every lantern
      for (const L of state.world.lights) if (L.restore) state.explored.reveal(Math.floor(L.x / G.TILE), Math.floor(L.y / G.TILE), L.restore + 4);
    }
    state.goalsDone = d.goalsDone; state.goalsHidden = !!d.goalsHidden;
    afterLoad();
    ui.toast('Welcome back.');
  }

  function afterLoad() {
    life.clear();
    state.stats.met = state.stats.met || {};
    state.world.time = state.time;
    state.cam.x = state.player.x; state.cam.y = state.player.y;
    state.running = true;
    document.getElementById('title').classList.add('hidden');
    document.body.classList.add('playing');
    ui.refresh();
  }

  // ---------- actions ----------
  function screenToTile(sx, sy) {
    const wx = sx + state.cam.x - renderer.W / 2, wy = sy + state.cam.y - renderer.H / 2;
    return { wx, wy, tx: Math.floor(wx / G.TILE), ty: Math.floor(wy / G.TILE) };
  }

  // stereo position of a world point relative to the player: -1 left .. 1 right
  const panAt = x => G.clamp((x - state.player.x) / 240, -1, 1);

  function gatherAt(tx, ty) {
    const w = state.world, obj = w.objectAt(tx, ty);
    if (!obj) return false;
    const why = G.Crafting.gatherBlocker(state, obj);
    if (why) { G.Sound.play('deny'); ui.toast(why, 3); return true; }
    const drops = G.Crafting.dropsFor(state, obj);
    const o = w.harvest(tx, ty);
    const def = G.OBJECTS[o];
    G.Sound.play(def.sound, { pan: panAt((tx + 0.5) * G.TILE) });
    for (const [k, n] of Object.entries(drops)) {
      state.inv[k] = (state.inv[k] || 0) + n;
      state.stats.got[k] = (state.stats.got[k] || 0) + n;
      addFloater((tx + 0.5) * G.TILE, ty * G.TILE, `+${n} ${G.ITEMS[k].name}`, G.ITEMS[k].color);
    }
    const c = { bloom: 'rgba(255,220,140,A)', tree: 'rgba(150,220,120,A)', reeds: 'rgba(210,225,130,A)', crystal: 'rgba(160,235,255,A)' }[o] || 'rgba(200,205,220,A)';
    renderer.burst((tx + 0.5) * G.TILE, (ty + 0.5) * G.TILE, c);
    state.stats.gathered++;
    ui.refresh();
    return true;
  }

  function gatherNearest() {
    const p = state.player; let best = null, bd = Infinity, locked = null;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const tx = p.tx + dx, ty = p.ty + dy, o = state.world.objectAt(tx, ty);
      if (!o) continue;
      const d = Math.hypot((tx + 0.5) * G.TILE - p.x, (ty + 0.5) * G.TILE - p.y);
      if (d > REACH) continue;
      if (G.Crafting.gatherBlocker(state, o)) { locked = { tx, ty }; continue; }   // skip what you can't gather yet
      if (d < bd) { bd = d; best = { tx, ty }; }
    }
    if (best || locked) gatherAt((best || locked).tx, (best || locked).ty);
    else { G.Sound.play('deny'); ui.toast('Nothing to gather here — walk up to a tree, rock or bloom.', 2.5); }
  }

  // make an item (a tool) straight into your pockets
  function craftItem(r) {
    for (const [k, n] of Object.entries(r.cost)) state.inv[k] -= n;
    state.inv[r.makes] = (state.inv[r.makes] || 0) + 1;
    state.stats.crafted = state.stats.crafted || {};
    state.stats.crafted[r.makes] = (state.stats.crafted[r.makes] || 0) + 1;
    const it = G.ITEMS[r.makes], p = state.player;
    G.Sound.play('craft');
    renderer.burst(p.x, p.y - 10, 'rgba(255,225,150,A)', 18);
    addFloater(p.x, p.y - 26, `${it.name}!`, it.color);
    ui.toast(`You made a ${it.name}. ${it.desc || ''}`, 4.5);
    ui.refresh();
  }

  // pick-up mode: click a building near you to take it back
  function updateRemove() {
    if (input.hit('escape')) { state.setRemoving(false); return; }
    const { wx, wy, tx, ty } = screenToTile(input.mouse.x, input.mouse.y);
    const p = state.player, st = state.world.structureAt(tx, ty);
    const near = Math.hypot((tx + 0.5) * G.TILE - p.x, (ty + 0.5) * G.TILE - p.y) <= BUILD_REACH;
    state.removeHover = st ? { tx, ty, ok: near && !G.Crafting.pickupBlocker(state, st) } : null;
    if (!input.mouse.clicked) return;
    if (!st) { p.moveTarget = { x: wx, y: wy }; return; }
    const why = G.Crafting.pickupBlocker(state, st);
    if (why || !near) { G.Sound.play('deny'); ui.toast(why || 'Too far away — move closer.', 2.5); return; }
    const refund = G.Crafting.pickUp(state, tx, ty);
    map.touch(tx, ty);
    const x = (tx + 0.5) * G.TILE, y = (ty + 0.5) * G.TILE;
    G.Sound.play('pickup', { pan: panAt(x) });
    renderer.burst(x, y, 'rgba(255,240,200,A)', 12);
    let k = 0;
    for (const [item, n] of Object.entries(refund)) { addFloater(x, y - 6 - k * 14, `+${n} ${G.ITEMS[item].name}`, G.ITEMS[item].color); k++; }
    state.removeHover = null;
    ui.refresh();
  }

  function addFloater(x, y, text, color) { state.floaters.push({ x, y, text, color, life: 1.4 }); }

  function updateBuild() {
    const r = state.buildRecipe;
    if (!r) { state.placing = null; return; }
    if (input.hit('escape')) { state.buildRecipe = null; state.placing = null; return; }
    const { tx, ty } = screenToTile(input.mouse.x, input.mouse.y);
    const p = state.player;
    const near = Math.hypot((tx + 0.5) * G.TILE - p.x, (ty + 0.5) * G.TILE - p.y) <= BUILD_REACH;
    const ok = near && state.world.canBuild(r.builds, tx, ty)
      && !(Math.abs((tx + 0.5) * G.TILE - p.x) < 20 && Math.abs((ty + 0.5) * G.TILE - p.y) < 20 && G.STRUCTURES[r.builds].solid);
    state.placing = { type: r.builds, tx, ty, ok };
    if (input.mouse.clicked) {
      if (!ok) { G.Sound.play('deny'); ui.toast(near ? "Can't build there." : 'Too far away — move closer.', 2); return; }
      for (const [k, n] of Object.entries(r.cost)) state.inv[k] -= n;
      state.world.build(r.builds, tx, ty);
      map.touch(tx, ty);
      state.stats.built++;
      G.Sound.play(G.STRUCTURES[r.builds].sound, { pan: panAt((tx + 0.5) * G.TILE) });
      renderer.burst((tx + 0.5) * G.TILE, (ty + 0.5) * G.TILE, 'rgba(255,230,160,A)', 20);
      if (r.builds === 'lantern') ui.toast('The land around the lantern remembers its colour.');
      if (r.builds === 'beacon') ui.toast('The crystal sings, and the land far around it remembers its colour.', 5);
      if (r.builds === 'workbench') ui.toast('A workbench! Stand near it and open Craft (C) for tools and more.', 5);
      ui.refresh();
      if (!state.canAfford(r)) { state.buildRecipe = null; state.placing = null; }
    }
  }

  // ---------- loop ----------
  function update(dt) {
    state.time += dt;
    state.world.time = state.time;

    if (input.hit('c')) ui.toggleCraft();
    if (input.hit('x')) state.setRemoving();
    if (input.hit('n')) ui.toggleSound();
    if (input.hit('e', ' ') || state.wantGather) { state.wantGather = false; gatherNearest(); }

    if (input.hit('m')) { map.toggle(); if (map.isOpen) ui.toggleCraft(false); }
    if (map.isOpen && input.hit('escape')) map.toggle(false);
    else if (state.buildRecipe) updateBuild();
    else if (state.removing) updateRemove();
    else if (input.mouse.clicked || input.mouse.down) {
      const { wx, wy, tx, ty } = screenToTile(input.mouse.x, input.mouse.y);
      const p = state.player;
      const close = Math.hypot((tx + 0.5) * G.TILE - p.x, (ty + 0.5) * G.TILE - p.y) <= REACH;
      if (input.mouse.clicked && close && state.world.objectAt(tx, ty)) gatherAt(tx, ty);
      else p.moveTarget = { x: wx, y: wy };
    }

    const px = state.player.x, py = state.player.y;
    state.player.update(dt, input, state.world);
    footsteps(Math.hypot(state.player.x - px, state.player.y - py));
    const k = 1 - Math.pow(0.02, dt);
    state.cam.x += (state.player.x - state.cam.x) * k;
    state.cam.y += (state.player.y - state.cam.y) * k;

    for (const f of state.floaters) { f.life -= dt; f.y -= 22 * dt; }
    state.floaters = state.floaters.filter(f => f.life > 0);

    state.saveTimer += dt;
    if (state.saveTimer > 10) { state.saveTimer = 0; G.Save.write(state); }
    ui.updateClock(state.time, state.world.litCount());
    ui.update(dt);
    map.update(dt, state.time);
    goals.update(dt);
  }

  // ---------- sound ----------
  let stepDist = 0, stepAlt = false;
  function footsteps(moved) {
    stepDist += moved;
    if (stepDist < 34) return;
    stepDist = 0; stepAlt = !stepAlt;
    const p = state.player, st = state.world.structureAt(p.tx, p.ty);
    const kind = (st && G.STRUCTURES[st.type].step) || G.TILES[state.world.tileAt(p.tx, p.ty).type].step;
    if (kind) G.Sound.step(kind, { alt: stepAlt });
  }

  // how much water is near a point, 0..1 (sampled a few times a second)
  let waterNear = 0, waterTimer = 0;
  function updateAmbience(dt) {
    if (!G.Sound.ctx || !state.world) return;
    const x = state.cam.x, y = state.cam.y, w = state.world;
    waterTimer -= dt;
    if (waterTimer <= 0) {
      waterTimer = 0.3;
      const tx = Math.floor(x / G.TILE), ty = Math.floor(y / G.TILE);
      let n = 0;
      for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) if (w.isWater(tx + dx, ty + dy)) n++;
      waterNear = Math.min(1, n / 40);
    }
    G.Ambience.update(dt, { restore: w.restoreAt(x, y, w.lights), day: G.daylight(state.time), water: waterNear, active: state.running });
  }

  function drawFloaters() {
    const ctx = renderer.ctx;
    ctx.font = '600 13px Georgia, serif'; ctx.textAlign = 'center';
    for (const f of state.floaters) {
      const x = f.x - state.cam.x + renderer.W / 2, y = f.y - state.cam.y + renderer.H / 2;
      ctx.globalAlpha = Math.min(1, f.life);
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillText(f.text, x + 1, y + 1);
      ctx.fillStyle = f.color; ctx.fillText(f.text, x, y);
    }
    ctx.globalAlpha = 1;
  }

  let prev = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
    if (state.running) {
      update(dt);
      renderer.render(state, dt);
      drawFloaters();
    } else {
      renderer.render(state, dt);   // title screen: world drifts behind the menu
      state.time += dt; state.cam.x += dt * 12;
      if (state.world) state.world.time = state.time;
    }
    life.update(dt, state, renderer.W, renderer.H);
    updateAmbience(dt);
    input.endFrame();
    requestAnimationFrame(frame);
  }

  // ---------- title screen ----------
  const saved = G.Save.read();
  const btnContinue = document.getElementById('btn-continue');
  if (!saved) btnContinue.style.display = 'none';
  btnContinue.onclick = () => loadGame(saved);
  document.getElementById('btn-new').onclick = () => {
    if (saved && !confirm('Start a new world? Your current world will be replaced.')) return;
    G.Save.clear();
    newGame(Math.floor(Math.random() * 1e9));
  };
  window.addEventListener('beforeunload', () => { if (state.running) G.Save.write(state); });

  // a peaceful world drifts behind the title screen
  state.world = new G.World(saved ? saved.seed : 12345);
  if (saved) { for (const [t, x, y] of saved.structures || []) if (G.STRUCTURES[t]) state.world.structures.set(G.key(x, y), { type: t, tx: x, ty: y }); state.world.rebuildLights(); }
  else { const sp = state.world.findSpawn(); state.world.build('heart', sp.tx, sp.ty); }
  state.player = new G.Player(-9999, -9999);
  const l0 = state.world.lights[0] || { x: 0, y: 0 };
  state.cam.x = l0.x - 200; state.cam.y = l0.y;
  state.time = G.DAY_LENGTH * 0.2;

  // allow tests/tools to start instantly: index.html?autostart
  if (location.search.includes('autostart')) newGame(12345);

  requestAnimationFrame(frame);
})();
