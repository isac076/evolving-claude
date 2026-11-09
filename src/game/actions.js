// G.Actions — what the player does with their hands: gather, water, talk, use village
// things, craft tools, place buildings and pick them back up, and what a click means.
// Moved out of main.js on Night 14 (review night). main.js builds one and calls
// `gatherNearest()` (E), `click()` (mouse), `updateBuild()` / `updateRemove()` and `craftItem()`.
window.G = window.G || {};

G.Actions = class {
  // h = { state, input, renderer, ui, map, ruins, shrines, garden, village, market, folk, travel, floater(x, y, text, color), panAt(x) }
  constructor(h) {
    Object.assign(this, h);
    this.REACH = 2.2 * G.TILE;       // how far the player can gather
    this.BUILD_REACH = 5 * G.TILE;   // how far away the player can build
  }

  screenToTile(sx, sy) {
    const r = this.renderer, cam = this.state.cam;
    const wx = sx + cam.x - r.W / 2, wy = sy + cam.y - r.H / 2;
    return { wx, wy, tx: Math.floor(wx / G.TILE), ty: Math.floor(wy / G.TILE) };
  }

  // distance from the player to the middle of a tile
  far(tx, ty) {
    const p = this.state.player;
    return Math.hypot((tx + 0.5) * G.TILE - p.x, (ty + 0.5) * G.TILE - p.y);
  }

  gatherAt(tx, ty) {
    const state = this.state, w = state.world, obj = w.objectAt(tx, ty);
    if (!obj) return false;
    if (G.OBJECTS[obj].shrine) { this.shrines.use(tx, ty, obj); return true; }   // an Ember Shrine's stones (Night 15)
    if (G.OBJECTS[obj].read) { this.ruins.wake(tx, ty); return true; }
    if (!G.OBJECTS[obj].drops) { this.ruins.about(tx, ty, obj); return true; }
    const why = G.Crafting.gatherBlocker(state, obj);
    if (why) { G.Sound.play('deny'); this.ui.toast(why, 3); return true; }
    const drops = G.Crafting.dropsFor(state, obj);
    const o = w.harvest(tx, ty);
    G.Sound.play(G.OBJECTS[o].sound, { pan: this.panAt((tx + 0.5) * G.TILE) });
    let k = 0;
    for (const [item, n] of Object.entries(drops)) {
      state.inv[item] = (state.inv[item] || 0) + n;
      state.stats.got[item] = (state.stats.got[item] || 0) + n;
      this.floater((tx + 0.5) * G.TILE, ty * G.TILE - k++ * 14, `+${n} ${G.ITEMS[item].name}`, G.ITEMS[item].color);
    }
    const c = { bloom: 'rgba(255,220,140,A)', tree: 'rgba(150,220,120,A)', reeds: 'rgba(210,225,130,A)', crystal: 'rgba(160,235,255,A)' }[o] || 'rgba(200,205,220,A)';
    this.renderer.burst((tx + 0.5) * G.TILE, (ty + 0.5) * G.TILE, c);
    state.stats.gathered++;
    this.ui.refresh();
    return true;
  }

  waterPlant(st) {
    this.garden.water(this.state, st);
    this.floater((st.tx + 0.5) * G.TILE, st.ty * G.TILE, 'Watered', '#9fd4ff');
    if (this.state.stats.watered === 1) this.ui.toast('Splish! Damp soil makes plants grow three times as fast. Rain waters them too.', 5);
    this.ui.refresh();
  }

  // clicking a planting: water it if you can, otherwise say how it is doing
  tendPlant(st) {
    if (st.wet <= 0 && G.Crafting.owns(this.state, 'can')) { this.waterPlant(st); return; }
    G.Sound.play('select');
    this.ui.toast(this.garden.describe(this.state, st), 4);
  }

  // the well waters gardens, the stall opens the market, the ribbon pole tells of festivals
  useVillage(st) {
    const state = this.state, village = this.village;
    const vil = village.villageAt(st), x = (st.tx + 0.5) * G.TILE, y = st.ty * G.TILE;
    if (st.type === 'stall' && vil) { this.market.open(vil, st); return; }
    if (st.type === 'well') {
      const n = village.drawWater(state, st, this.garden);
      G.Sound.play('water', { pan: this.panAt(x) }); this.renderer.burst(x, y + 6, 'rgba(150,210,255,A)', 16);
      this.ui.toast(n ? G.pick(G.VILLAGE_SAYS.well) : G.VILLAGE_SAYS.wellDry, 4.5); this.ui.refresh();
      return;
    }
    G.Sound.play('select');
    this.ui.toast(village.festivalNear(state.player) ? 'Everyone is dancing around the ribbon pole — what a night!' : village.nextFestival(state), 4.5);
  }

  talkTo(v) {
    this.folk.talk(v, this.state);
    this.ui.refresh();
  }

  // E / space: talk to a friend, use a village thing, water, wake a stone, or gather — whatever is nearest
  gatherNearest() {
    const state = this.state, p = state.player, REACH = this.REACH;
    const friend = this.folk.nearest(p.x, p.y, 46);
    if (friend) { this.talkTo(friend); return; }
    const vb = this.village.nearest(state.world, p.x, p.y, 1.8 * G.TILE);
    if (vb) { this.useVillage(vb); return; }
    if (G.Crafting.owns(state, 'can')) {   // water a dry planting before gathering
      const dry = this.garden.dryNear(state.world, p.x, p.y, REACH);
      if (dry) { this.waterPlant(dry); return; }
    }
    let best = null, bd = Infinity, locked = null, stone = null, oldStone = null, shrine = null, sd = Infinity;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const tx = p.tx + dx, ty = p.ty + dy, o = state.world.objectAt(tx, ty);
      if (!o) continue;
      const d = this.far(tx, ty);
      if (d > REACH) continue;
      if (G.OBJECTS[o].bowl || G.OBJECTS[o].hearth) { if (d < sd) { sd = d; shrine = { tx, ty, o }; } continue; }   // a shrine's bowl or hearth comes first
      if (G.OBJECTS[o].read) { stone = { tx, ty }; continue; }    // then a sleeping memory stone
      if (!G.OBJECTS[o].drops) { oldStone = { tx, ty, o }; continue; }   // ruins can't be gathered
      if (G.Crafting.gatherBlocker(state, o)) { locked = { tx, ty }; continue; }   // skip what you can't gather yet
      if (d < bd) { bd = d; best = { tx, ty }; }
    }
    if (shrine) this.shrines.use(shrine.tx, shrine.ty, shrine.o);
    else if (stone) this.ruins.wake(stone.tx, stone.ty);
    else if (best || locked) this.gatherAt((best || locked).tx, (best || locked).ty);
    else if (oldStone) this.gatherAt(oldStone.tx, oldStone.ty);   // a look at an old stone (ruin or shrine)
    else {
      let plant = null, pd = REACH;
      for (const st of this.garden.plants(state.world)) { const d = this.far(st.tx, st.ty); if (d <= pd) { pd = d; plant = st; } }
      if (plant) { this.tendPlant(plant); return; }
      if (this.travel && this.travel.canTravel()) { this.map.toggle(true); this.ui.toggleCraft(false); return; }   // beside a light: the lantern roads
      G.Sound.play('deny'); this.ui.toast('Nothing to gather here — walk up to a tree, rock or bloom.', 2.5);
    }
  }

  // a click (or held mouse) on the world when nothing is being built or picked up
  click() {
    const state = this.state, input = this.input, p = state.player;
    const { wx, wy, tx, ty } = this.screenToTile(input.mouse.x, input.mouse.y);
    if (!input.mouse.clicked) { p.moveTarget = { x: wx, y: wy }; return; }   // held: keep walking toward the pointer
    const close = this.far(tx, ty) <= this.REACH;
    const friend = this.folk.at(wx, wy);
    if (friend) {
      if (Math.hypot(friend.x - p.x, friend.y - p.y) < 3 * G.TILE) this.talkTo(friend);
      else p.moveTarget = { x: friend.x, y: friend.y + 14 };
      return;
    }
    if (close && state.world.objectAt(tx, ty)) { this.gatherAt(tx, ty); return; }
    const vb = close && this.village.nearest(state.world, wx, wy + 8, 20);
    if (vb) { this.useVillage(vb); return; }
    const st = close && state.world.structureAt(tx, ty);
    if (st && G.STRUCTURES[st.type].grow) { this.tendPlant(st); return; }
    if (st && G.STRUCTURES[st.type].ember && st.type !== 'emberlamp') { this.shrines.about(st); return; }
    if (st && G.STRUCTURES[st.type].travel && this.travel.canTravel()) { this.map.toggle(true); this.ui.toggleCraft(false); return; }   // Night 16
    p.moveTarget = { x: wx, y: wy };
  }

  // make an item (a tool) straight into your pockets
  craftItem(r) {
    const state = this.state;
    for (const [k, n] of Object.entries(r.cost)) state.inv[k] -= n;
    state.inv[r.makes] = (state.inv[r.makes] || 0) + 1;
    state.stats.crafted = state.stats.crafted || {};
    state.stats.crafted[r.makes] = (state.stats.crafted[r.makes] || 0) + 1;
    const it = G.ITEMS[r.makes], p = state.player;
    G.Sound.play('craft');
    this.renderer.burst(p.x, p.y - 10, 'rgba(255,225,150,A)', 18);
    this.floater(p.x, p.y - 26, `${it.name}!`, it.color);
    this.ui.toast(`You made a ${it.name}. ${it.desc || ''}`, 4.5);
    this.ui.refresh();
  }

  // pick-up mode: click a building near you to take it back
  updateRemove() {
    const state = this.state, input = this.input;
    const { wx, wy, tx, ty } = this.screenToTile(input.mouse.x, input.mouse.y);
    const p = state.player, st = state.world.structureAt(tx, ty);
    const near = this.far(tx, ty) <= this.BUILD_REACH;
    state.removeHover = st ? { tx, ty, ok: near && !G.Crafting.pickupBlocker(state, st) } : null;
    if (!input.mouse.clicked) return;
    if (!st) { p.moveTarget = { x: wx, y: wy }; return; }
    const why = G.Crafting.pickupBlocker(state, st);
    if (why || !near) { G.Sound.play('deny'); this.ui.toast(why || 'Too far away — move closer.', 2.5); return; }
    const refund = G.Crafting.pickUp(state, tx, ty);
    this.map.touch(tx, ty);
    const x = (tx + 0.5) * G.TILE, y = (ty + 0.5) * G.TILE;
    G.Sound.play('pickup', { pan: this.panAt(x) });
    this.renderer.burst(x, y, 'rgba(255,240,200,A)', 12);
    let k = 0;
    for (const [item, n] of Object.entries(refund)) { this.floater(x, y - 6 - k * 14, `+${n} ${G.ITEMS[item].name}`, G.ITEMS[item].color); k++; }
    state.removeHover = null;
    this.ui.refresh();
  }

  // placing a building: a ghost follows the pointer, a click builds it
  updateBuild() {
    const state = this.state, input = this.input, r = state.buildRecipe;
    if (!r) { state.placing = null; return; }
    const { tx, ty } = this.screenToTile(input.mouse.x, input.mouse.y);
    const p = state.player, def = G.STRUCTURES[r.builds];
    const near = this.far(tx, ty) <= this.BUILD_REACH;
    const ok = near && state.world.canBuild(r.builds, tx, ty)
      && !(Math.abs((tx + 0.5) * G.TILE - p.x) < 20 && Math.abs((ty + 0.5) * G.TILE - p.y) < 20 && def.solid);
    state.placing = { type: r.builds, tx, ty, ok };
    if (!input.mouse.clicked) return;
    if (!ok) { G.Sound.play('deny'); this.ui.toast(near ? "Can't build there." : 'Too far away — move closer.', 2); return; }
    for (const [k, n] of Object.entries(r.cost)) state.inv[k] -= n;
    state.world.build(r.builds, tx, ty);
    this.map.touch(tx, ty);
    state.stats.built++;
    G.Sound.play(def.sound, { pan: this.panAt((tx + 0.5) * G.TILE) });
    this.renderer.burst((tx + 0.5) * G.TILE, (ty + 0.5) * G.TILE, 'rgba(255,230,160,A)', 20);
    const say = G.Actions.BUILT_SAYS[r.builds];
    if (say) this.ui.toast(say[0], say[1]);
    if (def.grow) this.planted(tx, ty);
    this.ui.refresh();
    if (!state.canAfford(r)) { state.buildRecipe = null; state.placing = null; }
  }

  planted(tx, ty) {
    const state = this.state;
    state.stats.planted = (state.stats.planted || 0) + 1;
    const f = state.world.restoreAt((tx + 0.5) * G.TILE, (ty + 0.5) * G.TILE, state.world.lights);
    if (f < G.GARDEN.colourNeeded * 0.5) this.ui.toast('Seeds grow only slowly in the grey. Plant them where the colour has come back.', 5);
    else if (state.stats.planted === 1) this.ui.toast('Planted! Watch it grow — rain or a watering can (made at a workbench) speeds it up.', 6);
  }
};

// a word when you build something special: [text, seconds]
G.Actions.BUILT_SAYS = {
  lantern: ['The land around the lantern remembers its colour.', 3.5],
  beacon: ['The crystal sings, and the land far around it remembers its colour.', 5],
  cottage: ['A cottage! A friend whose light is close by will move in.', 4.5],
  emberlamp: ['A spark of the shrine\'s ember settles into the bowl. The land around it glows warm.', 4.5],
  shroomlamp: ['The mushroom lamp glows, cool and kind. The land around it remembers its colour.', 4.5],
  workbench: ['A workbench! Stand near it and open Craft (C) for tools and more.', 5],
};
