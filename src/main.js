// Ties everything together: game state, the main loop, and player actions.
window.G = window.G || {};

(function () {
  const canvas = document.getElementById('game');
  const input = new G.Input(canvas);
  const renderer = new G.Renderer(canvas);

  const state = {
    world: null, player: null, inv: {}, time: 0, stats: { gathered: 0, built: 0, got: {} },
    explored: new G.Explored(), goalsDone: [], goalsHidden: false, weather: null,
    cam: { x: 0, y: 0 }, placing: null, buildRecipe: null, wantGather: false, removing: false, removeHover: null,
    floaters: [], running: false, saveTimer: 0,

    canAfford(r) { return Object.entries(r.cost).every(([k, n]) => (this.inv[k] || 0) >= n); },
    startBuild(r) {
      const why = G.Crafting.blocker(this, r);
      const name = r.builds ? G.STRUCTURES[r.builds].name : G.ITEMS[r.makes].name;
      if (why) {
        G.Sound.play('deny');
        ui.toast(why === 'locked' ? `Nobody has shown you how to make a ${name} yet.`
          : why === 'owned' ? `You already have a ${name}.`
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
  const journal = new G.Journal(state, ui);   // discoveries journal (J) + the memory card (Night 11)
  // ruins of the old world: finding them, and waking their memory stones (Night 11)
  const ruins = new G.RuinPlay(state, {
    ui, map, journal, burst: (x, y, color, n) => renderer.burst(x, y, color, n),
    floater: (x, y, text, color) => addFloater(x, y, text, color), pan: x => panAt(x),
  });
  // the Ember Shrines: offerings at their bowls, the kindling and its wave of colour (Night 15)
  const shrines = new G.ShrinePlay(state, {
    ui, map, journal, burst: (x, y, color, n) => renderer.burst(x, y, color, n),
    floater: (x, y, text, color) => addFloater(x, y, text, color), pan: x => panAt(x),
  });
  state.shrines = shrines;
  // the Glowcap Hollows: noticing when you walk into one (Night 17)
  const hollows = new G.HollowPlay(state, { ui, map, burst: (x, y, color, n) => renderer.burst(x, y, color, n) });
  // the resting menu (Esc): pauses the world; can lead back to the title or to a new world
  const settings = new G.Settings(state, ui, {
    title() { if (state.travel && state.travel.trip) state.travel.arrive(); G.Save.write(state); state.running = false; location.href = location.pathname; },
    newWorld() {
      G.Save.clear(); state.running = false;
      try { sessionStorage.setItem('lumen-new', '1'); } catch (e) {}
      location.href = location.pathname;
    },
  });

  const sounds = new G.Soundscape(state, settings);   // feeds the music and the ambience

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

  // hushlings: small shadows of the Fading that sip your light on dark nights; light eases them (Night 19)
  const hush = new G.Hush(state, {
    ui, burst: (x, y, color, n) => renderer.burst(x, y, color, n), floater: (x, y, text, color) => addFloater(x, y, text, color),
    sound: (name, x) => { if (state.running) G.Sound.play(name, x === undefined ? {} : { pan: panAt(x) }); },
    fireflies: (x, y, n) => renderer.fireflies(x, y, n),
  });
  state.hush = hush;

  // lost spirits and the friends who live by your lanterns (saved)
  const folk = new G.Villagers();
  state.villagers = folk;
  folk.fx = {
    burst: (x, y, color, n) => renderer.burst(x, y, color, n),
    sound: (name, x, o) => { if (state.running) G.Sound.play(name, { ...(o || {}), pan: panAt(x) }); },
    floater: (x, y, text, color) => addFloater(x, y, text, color),
    toast: (msg, secs) => { if (state.running) ui.toast(msg, secs); },
    refresh: () => ui.refresh(),
  };
  folk.onFound = v => {
    const first = (state.stats.spiritsFound || 0) <= 1;
    ui.toast(first ? 'A lost spirit! It holds on to your light. Lead it into the colour around a lantern and it will make a home there.'
      : `${v.name} takes hold of your light. Lead them to a lantern with room for one more.`, first ? 8 : 5);
  };
  folk.onSettle = (v, L) => {
    map.touch(Math.floor(L.x / G.TILE), Math.floor(L.y / G.TILE));
    ui.toast(`${v.name} has made a home by your ${G.STRUCTURES[L.type].name}. Click them to say hello!`, 6);
    ui.refresh();
  };

  // friends' wishes and the cottages they move into (saved inside each villager)
  const wishes = new G.Wishes(folk);
  folk.wishes = wishes; state.wishes = wishes;
  wishes.fx = folk.fx;
  const wishPanel = new G.WishPanel(state, wishes);
  wishes.onHeard = () => {
    if (state.stats.wishesHeard === 1) ui.toast('A wish! Friends with a heart bubble are wishing for something. Their wishes are listed on the left.', 7);
  };
  wishes.onReady = (v, w) => {
    addFloater(v.x, v.y - 40, `${v.name}'s wish came true!`, '#ffd77a');
    ui.toast(`${v.name}'s wish came true — go and say hello!`, 4.5);
    G.Sound.play('meet', { pan: panAt(v.x) });
  };
  wishes.onGrant = (v, w, before) => {
    if (v.hearts > before) addFloater(v.x - 30, v.y - 30, `${v.name} ${'♥'.repeat(v.hearts)}`, '#ffa8c8');
    ui.refresh();
  };
  wishes.onUnlock = (id, v) => {
    const r = G.RECIPES.find(r => r.unlock === id), name = r ? G.STRUCTURES[r.builds].name : id;
    setTimeout(() => ui.toast(`${v.name} shows you how to build a ${name}! Find it in Craft (C) — friends move into cottages near their light.`, 8), 1800);
    ui.refresh();
  };
  wishes.onMoveIn = (v, st) => {
    map.touch(st.tx, st.ty);
    ui.toast(`${v.name} has moved into the cottage! At night you'll see the window glow.`, 6);
  };

  // friends' cottages grow into villages: a well, a market stall, a festival green (Night 13)
  const village = new G.Village(folk);
  folk.village = village; state.village = village;
  village.fx = folk.fx;
  const market = new G.Market(state, ui, village);
  village.onRaise = (vil, stage, st) => { map.touch(st.tx, st.ty); ui.toast(stage.say, 7); };
  village.onRisen = st => {
    map.touch(st.tx, st.ty);
    addFloater((st.tx + 0.5) * G.TILE, st.ty * G.TILE - 30, `${G.STRUCTURES[st.type].name}!`, '#ffd77a');
    const vil = village.villageAt(st);
    if (st.type === 'well' && vil) setTimeout(() => ui.placeCaption(vil.name, 'a new hamlet'), 900);
  };
  village.onArrive = vil => ui.placeCaption(vil.name, `a ${vil.title} of ${vil.homes} homes`);
  village.onFestival = (vil, fest, gift) => {
    G.Sound.play('rainbow');
    const g = gift ? ' Gift: ' + Object.entries(gift).map(([k, n]) => `${n} ${G.ITEMS[k].name}`).join(', ') + '.' : '';
    ui.toast(`The ${fest.def.name} in ${vil.name}! ${fest.def.say}${g}`, 7);
    ui.placeCaption(fest.def.name, vil.name);
    ui.refresh();
  };
  market.onTrade = (t, st) => {
    const x = (st.tx + 0.5) * G.TILE, y = st.ty * G.TILE;
    renderer.burst(x, y, 'rgba(255,225,150,A)', 12);
    Object.entries(t.get).forEach(([k, n], i) => addFloater(x, y - 10 - i * 14, `+${n} ${G.ITEMS[k].name}`, G.ITEMS[k].color));
  };

  // gardens: sprouts and saplings grow into blooms, moonflowers and trees (not a separate save — they are structures)
  const garden = new G.Garden();
  state.garden = garden;
  garden.fx = {
    burst: (x, y, color, n) => renderer.burst(x, y, color, n),
    sound: (name, x) => { if (state.running) G.Sound.play(name, { pan: panAt(x) }); },
    touch: (tx, ty) => map.touch(tx, ty),
  };
  garden.onGrown = (st, into, first) => {
    const k = G.GROW_KINDS[G.STRUCTURES[st.type].grow];
    addFloater((st.tx + 0.5) * G.TILE, st.ty * G.TILE - 10, `${G.OBJECTS[into].name}!`, into === 'tree' ? '#a8e090' : into === 'moonflower' ? '#bfe2ff' : G.OBJECTS[into].drops.spore ? '#a8f0e0' : '#ffc8e6');
    if (first) ui.toast(into === k.rare ? k.firstRare : k.first, 6);
  };

  // the sky: weather drifts on its own; tell the player when it changes
  function makeWeather() {
    const wx = new G.Weather();
    wx.onChange = kind => {
      if (!state.running) return;
      const snowy = G.WEATHER[kind].snow && G.Seasons.snowing() > 0.5, def = snowy ? G.WEATHER[kind].snow : G.WEATHER[kind];
      const seen = state.stats.weatherSeen || (state.stats.weatherSeen = {}), id = snowy ? kind + '-snow' : kind;
      const firstTime = !seen[id];
      seen[id] = 1;
      const msg = firstTime ? def.first : def.say;
      if (msg) ui.toast(msg, firstTime ? 6 : 3.5);
    };
    wx.onRainbow = () => {
      if (!state.running) return;
      state.stats.rainbows = (state.stats.rainbows || 0) + 1;
      G.Sound.play('rainbow');
      ui.toast('A rainbow! The rain has washed the sky clean.', 5);
    };
    return wx;
  }
  state.weather = makeWeather();

  // music: the world writes its own tunes; friends nearby join in
  G.Music.onCaption = (title, grey) => { if (state.running) ui.musicCaption(title, grey); };
  G.Music.onJoin = (v, def) => {
    if (!state.running) return;
    addFloater(v.x, v.y - 34, `♪ ${v.name} ${def.joins}`, `hsl(${v.hue},85%,80%)`);
    if ((state.stats.music || {}).joined === 1) ui.toast('Your friends play along when you are near them — every kind of friend has its own part in the song.', 6);
  };

  // the seasons turn with the days (nothing to save: the clock says which one it is)
  G.Seasons.onChange = (def, firstTime) => {
    if (!state.running) return;
    G.Sound.play('season', { season: def.id });
    ui.toast(firstTime ? def.first : def.say, firstTime ? 7 : 4.5);
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
    state.weather = makeWeather();   // a new world begins under a clear sky
    folk.reset(); village.reset();
    afterLoad();
    setTimeout(() => G.Sound.play('welcome'), 350);   // give the audio a moment to wake up
    ui.toast('The world has faded. Gather wood, stone and glow petals, then craft a Lantern (C) to bring the colour back.', 9);
  }

  function loadGame(d) {
    state.world = new G.World(d.seed);
    state.world.loadStructures(d.structures);
    for (const [k, o] of d.grown || []) if (G.OBJECTS[o]) state.world.grown.set(k, o);   // older saves grew nothing yet
    for (const [k, t] of d.harvested || []) state.world.harvested.set(k, t);
    state.player = new G.Player(d.player.x, d.player.y);
    state.inv = d.inv || {}; state.time = d.time || 0; state.stats = d.stats;
    state.explored = new G.Explored();
    if (d.explored) state.explored.load(d.explored);
    else {   // older save: reveal the land around you and around every lantern
      for (const L of state.world.lights) if (L.restore) state.explored.reveal(Math.floor(L.x / G.TILE), Math.floor(L.y / G.TILE), L.restore + 4);
    }
    state.goalsDone = d.goalsDone; state.goalsHidden = !!d.goalsHidden;
    state.weather = makeWeather();
    state.weather.load(d.weather);   // older saves have no weather: it starts clear
    folk.load(d.villagers, state.world, state.player);   // older saves have nobody yet
    village.reset();
    afterLoad();
    ui.toast('Welcome back.');
  }

  function afterLoad() {
    life.clear(); hush.clear();
    shrines.kindling = null; shrines.sparks = [];
    travel.trip = null; travel.landed = null; travel.trail = [];
    G.Seasons.reset(); G.Seasons.update(state, true);
    signs.close(); signs.refreshList();
    state.stats.met = state.stats.met || {};
    state.world.time = state.time;
    state.cam.x = state.player.x; state.cam.y = state.player.y;
    state.running = true;
    document.getElementById('title').classList.add('hidden');
    document.body.classList.add('playing');
    ui.refresh();
  }

  // ---------- actions (src/game/actions.js) ----------
  // stereo position of a world point relative to the player: -1 left .. 1 right
  const panAt = x => G.clamp((x - state.player.x) / 240, -1, 1);
  function addFloater(x, y, text, color) { state.floaters.push({ x, y, text, color, life: 1.4 }); }
  // the lantern roads: fly from light to light on the big map (Night 16)
  const travel = new G.Travel(state, { ui, map, renderer, folk, floater: addFloater, panAt });
  state.travel = travel; map.travel = travel;
  // signposts with names you write, and banners (Night 18)
  const signs = new G.Signs(state, { ui, input, map, burst: (x, y, color, n) => renderer.burst(x, y, color, n), floater: addFloater, panAt });
  state.signs = signs;
  const act = new G.Actions({ state, input, renderer, ui, map, ruins, shrines, garden, village, market, folk, travel, signs, floater: addFloater, panAt });
  const craftItem = r => act.craftItem(r);

  // ---------- loop ----------
  function update(dt) {
    state.time += dt;
    state.world.time = state.time;

    travel.update(dt);
    hush.update(dt);
    if (travel.trip) flying();
    else if (walking(dt)) return;   // the journal or the resting menu just opened

    for (const f of state.floaters) { f.life -= dt; f.y -= 22 * dt; }
    state.floaters = state.floaters.filter(f => f.life > 0);

    if (state.weather.rain > 0.3) state.stats.rainTime = (state.stats.rainTime || 0) + dt;

    state.saveTimer += dt;
    if (state.saveTimer > 10 && !travel.trip) { state.saveTimer = 0; G.Save.write(state); }
    ui.updateClock(state.time, state.world.litCount(), state.weather, folk.list.length);
    ui.update(dt);
    map.update(dt, state.time);
    goals.update(dt);
    garden.update(dt, state);
    wishes.update(dt, state);
    village.update(dt, state); market.update();
    wishPanel.update(dt);
    ruins.update(dt);
    shrines.update(dt);
    hollows.update(dt);
    signs.update(dt);
  }

  // on foot: keys, clicks, walking and the camera
  function walking(dt) {
    if (input.hit('c')) ui.toggleCraft();
    if (input.hit('x')) state.setRemoving();
    if (input.hit('n')) ui.toggleSound();
    if (input.hit('e', ' ') || state.wantGather) { state.wantGather = false; act.gatherNearest(); }
    if (input.hit('f') || state.wantShine) { state.wantShine = false; hush.shine(); }

    if (input.hit('m')) { map.toggle(); if (map.isOpen) ui.toggleCraft(false); }
    if (input.hit('j')) { map.toggle(false); ui.toggleCraft(false); journal.toggle(true); return true; }
    // Esc closes the nearest thing first; with nothing open it is time to rest
    if (input.hit('escape')) {
      if (map.isOpen) map.toggle(false);
      else if (state.buildRecipe) { state.buildRecipe = null; state.placing = null; }
      else if (state.removing) state.setRemoving(false);
      else if (market.isOpen) market.close();
      else if (ui.craftOpen) ui.toggleCraft(false);
      else { settings.toggle(true); return true; }
    }
    if (map.isOpen) { /* the big map has the mouse */ }
    else if (state.buildRecipe) act.updateBuild();
    else if (state.removing) act.updateRemove();
    else if (input.mouse.clicked || input.mouse.down) act.click();

    const px = state.player.x, py = state.player.y;
    state.player.update(dt, input, state.world);
    footsteps(Math.hypot(state.player.x - px, state.player.y - py));
    const k = 1 - Math.pow(0.02, dt);
    state.cam.x += (state.player.x - state.cam.x) * k;
    state.cam.y += (state.player.y - state.cam.y) * k;
  }

  // in the air on the lantern roads: G.Travel moves the spirit and the camera; keys only pause or mute
  function flying() {
    if (input.hit('n')) ui.toggleSound();
    if (input.hit('escape')) settings.toggle(true);
  }

  // ---------- sound ----------
  let stepDist = 0, stepAlt = false;
  function footsteps(moved) {
    stepDist += moved;
    if (stepDist < 34) return;
    stepDist = 0; stepAlt = !stepAlt;
    const p = state.player, st = state.world.structureAt(p.tx, p.ty);
    const kind = (st && G.STRUCTURES[st.type].step) || G.TILES[state.world.tileAt(p.tx, p.ty).type].step;
    if (kind) G.Sound.step(G.SEASON_NOW.tiles[state.world.tileAt(p.tx, p.ty).type].snow > 0.5 && !st ? 'snow' : kind, { alt: stepAlt });
    G.Seasons.step(state.world, p.x, p.y, stepAlt);
  }

  // followers' threads of light and everyone's speech bubbles, above the night
  function drawFolk() {
    const ctx = renderer.ctx, camX = Math.round(state.cam.x - renderer.W / 2), camY = Math.round(state.cam.y - renderer.H / 2);
    G.drawFollowThreads(ctx, state.player, folk.followers, camX, camY, state.time);
    G.MusicFX.draw(ctx, G.Music.notes, camX, camY, renderer.W, renderer.H);
    G.drawSkyLanterns(ctx, village.lanterns, camX, camY, renderer.W, renderer.H, state.time);
    for (const v of folk.list) {
      if (folk.indoors(v)) continue;
      G.drawHeartFx(ctx, v, v.x - camX, v.y - camY, frameDt);
      G.drawWishMark(ctx, v, v.x - camX, v.y - camY, state.time, wishes.canGrant(v, state));
    }
    for (const v of folk.all()) if (v.say) G.drawSpeech(ctx, v, v.x - camX, v.y - camY, renderer.W, renderer.H);
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

  let prev = performance.now(), frameDt = 0;
  function frame(now) {
    const paused = settings.isOpen || journal.paused || signs.isOpen;   // writing a sign's name pauses too
    const realDt = Math.min(0.1, (now - prev) / 1000), dt = paused ? 0 : Math.min(0.05, realDt); prev = now;
    frameDt = dt;
    if (settings.isOpen) { if (input.hit('escape')) settings.toggle(false); }
    else if (journal.paused) journal.keys(input);
    else if (signs.isOpen) { if (input.hit('escape')) signs.close(); else if (input.hit('enter')) signs.confirm(); }
    G.Sound.duck(paused);
    if (state.world) { G.Seasons.update(state, !state.running); state.weather.update(dt, state); }
    if (state.running) {
      if (!paused) update(dt);
      renderer.render(state, dt);
      drawFolk();
      G.drawSignTags(renderer.ctx, signs.list(), state.player, Math.round(state.cam.x - renderer.W / 2), Math.round(state.cam.y - renderer.H / 2), renderer.W, renderer.H, state.time);
      drawFloaters();
    } else {
      renderer.render(state, dt);   // title screen: world drifts behind the menu
      state.time += dt; state.cam.x += dt * 12;
      if (state.world) state.world.time = state.time;
    }
    life.update(dt, state, renderer.W, renderer.H);
    folk.update(dt, state, renderer.W, renderer.H);
    sounds.ambience(dt);
    sounds.music(realDt);
    input.endFrame();
    requestAnimationFrame(frame);
  }

  // ---------- title screen ----------
  const saved = G.Save.read();
  const btnContinue = document.getElementById('btn-continue');
  if (!saved) btnContinue.style.display = 'none';
  btnContinue.onclick = () => loadGame(saved);
  const btnNew = document.getElementById('btn-new');
  btnNew.onclick = () => {
    if (saved && !btnNew.classList.contains('sure')) {   // ask once more, right on the button
      btnNew.classList.add('sure'); btnNew.textContent = 'Replace your world?';
      setTimeout(() => { btnNew.classList.remove('sure'); btnNew.textContent = 'New world'; }, 4000);
      return;
    }
    G.Save.clear();
    newGame(Math.floor(Math.random() * 1e9));
  };
  window.addEventListener('beforeunload', () => { if (state.running) { if (travel.trip) travel.arrive(); G.Save.write(state); } });

  // a peaceful world drifts behind the title screen
  state.world = new G.World(saved ? saved.seed : 12345);
  if (saved) { state.world.loadStructures(saved.structures); for (const [k, o] of saved.grown || []) if (G.OBJECTS[o]) state.world.grown.set(k, o); state.weather.load(saved.weather); folk.load(saved.villagers, state.world, null); }
  else { const sp = state.world.findSpawn(); state.world.build('heart', sp.tx, sp.ty); }
  state.player = new G.Player(-9999, -9999);
  const l0 = state.world.lights[0] || { x: 0, y: 0 };
  state.cam.x = l0.x - 200; state.cam.y = l0.y;
  state.time = G.DAY_LENGTH * 0.2;

  // allow tests/tools to start instantly: index.html?autostart
  if (location.search.includes('autostart')) newGame(12345);
  else {   // "New world" from the resting menu reloads the page and lands here
    let fresh = false;
    try { fresh = sessionStorage.getItem('lumen-new') === '1'; sessionStorage.removeItem('lumen-new'); } catch (e) {}
    if (fresh) newGame(Math.floor(Math.random() * 1e9));
  }

  requestAnimationFrame(frame);
})();
