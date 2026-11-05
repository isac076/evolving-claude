// G.Village — friends' cottages grow into villages (Night 13; data in data/village.js).
//
// Every second the cottages that have someone living in them are grouped: cottages
// within G.VILLAGE.link tiles of each other belong together. A group of 2+ is a
// village. As it gains homes its friends build the next thing in G.VILLAGE_STAGES
// (a well, a market stall, a ribbon pole) near its middle — a real structure that
// rises over a few seconds while the friends gather round to help. The village's
// name comes from where its well stands, so it never changes.
//
// At dusk friends meet at their well (villagers.js asks `evening()`), and on the
// last evening of every season — and the first evening after the ribbon pole goes
// up — a village with a green holds a festival: everyone dances in a ring around the
// pole, bunting lights up and paper lanterns float into the night sky.
// Nothing new is saved except a few numbers in stats; the buildings are structures.
window.G = window.G || {};

(function () {
  const T = G.TILE;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const dayPhase = time => (time % G.DAY_LENGTH) / G.DAY_LENGTH;

  G.Village = class {
    constructor(folk) {
      this.folk = folk;        // G.Villagers
      this.list = [];          // villages found in the last check
      this.byFriend = new Map();
      this.fests = new Map();  // ribbon pole key -> { vil, def, dancers, joined }
      this.lanterns = [];      // paper lanterns floating up from festivals
      this.timer = 0; this.chatT = 2; this.lanternT = 0;
      this.here = null;        // the village you are standing in (its key)
      this.fx = null;          // same helpers as folk.fx
      this.onRaise = null; this.onRisen = null; this.onArrive = null; this.onFestival = null;
    }

    reset() { this.list = []; this.byFriend.clear(); this.fests.clear(); this.lanterns = []; this.here = null; }

    nameAt(world, tx, ty) {
      const N = G.VILLAGE_NAMES;
      return N.a[Math.floor(G.hash2(tx, ty, world.seed + 777) * N.a.length)] + N.b[Math.floor(G.hash2(ty, tx, world.seed + 778) * N.b.length)];
    }

    // ---------- which cottages make a village ----------
    find(state) {
      const world = state.world, homes = [], extras = [];
      for (const st of world.structures.values()) {
        const def = G.STRUCTURES[st.type];
        if (def.house && st.owner) homes.push(st);
        else if (def.village) extras.push(st);
      }
      const L = G.VILLAGE.link, groups = [], done = new Set();
      for (const c of homes) {
        if (done.has(c)) continue;
        const g = [c]; done.add(c);
        for (let i = 0; i < g.length; i++) for (const o of homes)
          if (!done.has(o) && Math.hypot(o.tx - g[i].tx, o.ty - g[i].ty) <= L) { done.add(o); g.push(o); }
        if (g.length >= 2) groups.push(g);
      }
      const list = groups.map(g => {
        const cx = g.reduce((a, c) => a + c.tx, 0) / g.length, cy = g.reduce((a, c) => a + c.ty, 0) / g.length;
        return { cottages: g, homes: g.length, cx, cy, folk: g.map(c => c.owner), has: {} };
      });
      for (const st of extras) {   // each village building belongs to the nearest village in reach
        let best = null, bd = G.VILLAGE.reach;
        for (const v of list) { const d = Math.hypot(st.tx - v.cx, st.ty - v.cy); if (d <= bd) { bd = d; best = v; } }
        if (best && !best.has[st.type]) best.has[st.type] = st;
      }
      this.byFriend.clear();
      for (const v of list) {
        const w = v.has.well;
        v.key = w ? G.key(w.tx, w.ty) : null;
        v.name = w ? this.nameAt(world, w.tx, w.ty) : null;
        const stage = [...G.VILLAGE_STAGES].reverse().find(s => v.has[s.build]);
        v.title = stage ? stage.title : 'hamlet';
        for (const f of v.folk) this.byFriend.set(f, v);
      }
      this.list = list;
      return list;
    }

    villageOf(v) { return this.byFriend.get(v) || null; }
    count(type) { let n = 0; for (const v of this.list) if (v.has[type]) n++; return n; }

    // ---------- growing ----------
    grow(state, vil) {
      for (const b of Object.values(vil.has)) if (b.rise !== undefined && b.rise < 1) return;   // one thing at a time
      const stage = G.VILLAGE_STAGES.find(s => vil.homes >= s.homes && !vil.has[s.build]);
      if (!stage) return;
      const spot = this.spotFor(state.world, vil, stage.build);
      if (!spot) return;
      state.world.build(stage.build, spot.tx, spot.ty);
      const st = state.world.structureAt(spot.tx, spot.ty);
      st.rise = 0;
      vil.has[stage.build] = st;
      if (stage.build === 'well') { vil.key = G.key(st.tx, st.ty); vil.name = this.nameAt(state.world, st.tx, st.ty); }
      vil.title = stage.title;
      if (stage.build === 'maypole') {   // the first festival is tonight
        const V = state.stats.village || (state.stats.village = {});
        (V.firstFest || (V.firstFest = [])).push(G.key(st.tx, st.ty));
      }
      this.helpers(vil, st);
      if (this.onRaise) this.onRaise(vil, stage, st);
    }

    // friends who are awake come over to lend a hand
    helpers(vil, st) {
      const sides = [[-1, 0], [1, 0], [0, 1], [-1, 1], [1, 1]];
      vil.folk.forEach((v, i) => {
        if (v.state === 'sleep' || v.state === 'tobed' || v.festival) return;
        const [dx, dy] = sides[i % sides.length];
        v.state = 'go'; v.goal = { x: (st.tx + dx + 0.5) * T - dx * 6, y: (st.ty + dy + 0.55) * T, at: st, side: [dx, dy] };
        v.tx2 = v.goal.x; v.ty2 = v.goal.y;
      });
    }

    // a good free spot near the village's middle: room around it, not in front of or behind a cottage
    spotFor(world, vil, type) {
      const cx = Math.round(vil.cx), cy = Math.round(vil.cy) + 1;
      for (const room of type === 'maypole' ? [2, 1, 0] : [1, 0]) {
        for (let r = 0; r <= 7; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          if (this.clear(world, cx + dx, cy + dy, type, room)) return { tx: cx + dx, ty: cy + dy };
        }
      }
      return null;
    }

    clear(world, tx, ty, type, room) {
      if (!world.canBuild(type, tx, ty) || world.isSolid(tx, ty)) return false;
      for (const st of world.structures.values()) {
        const def = G.STRUCTURES[st.type], dx = tx - st.tx, dy = ty - st.ty;
        if (def.house && Math.abs(dx) <= 1 && dy >= -2 && dy <= 1) return false;   // a cottage is big
        if (!def.floor && (def.village || def.restore || def.workbench) && Math.abs(dx) <= 1 && Math.abs(dy) <= 1) return false;
      }
      for (let dy = -room; dy <= room; dy++) for (let dx = -room; dx <= room; dx++) {
        if (!dx && !dy) continue;
        if (world.isSolid(tx + dx, ty + dy)) return false;
      }
      return true;
    }

    // ---------- per frame ----------
    update(dt, state) {
      const world = state.world;
      if (!world) return;
      for (const st of world.structures.values()) {   // buildings going up
        if (st.rise === undefined || st.rise >= 1) continue;
        st.rise = Math.min(1, st.rise + dt / G.VILLAGE.rise);
        const x = (st.tx + 0.5) * T, y = st.ty * T + 20;
        if (this.fx && Math.random() < dt * 6) this.fx.burst(x + G.rand(-14, 14), y - st.rise * 40, 'rgba(255,230,170,A)', 3);
        if (this.fx && Math.random() < dt * 2.5) this.fx.sound(st.type === 'well' ? 'placeStone' : 'placeWood', x);
        if (st.rise >= 1) {
          if (this.fx) { this.fx.burst(x, y - 20, 'rgba(255,225,150,A)', 26); this.fx.burst(x, y - 30, 'rgba(255,170,210,A)', 14); this.fx.sound('meet', x); }
          if (this.onRisen) this.onRisen(st);
        }
      }
      this.dance(dt, state);
      this.floatLanterns(dt, state);
      if ((this.chatT -= dt) <= 0) { this.chatT = G.rand(2, 4); this.chatter(state); }
      if ((this.timer -= dt) > 0) return;
      this.timer = 1;
      this.find(state);
      for (const vil of this.list) this.grow(state, vil);
      this.festivals(state);
      this.arrive(state);
    }

    // ---------- evenings at the well (asked by villagers.js when a friend is idle) ----------
    evening(v, state) {
      const ph = dayPhase(state.time), [g0, g1] = G.VILLAGE.gather;
      if (ph < g0 || ph > g1 || Math.random() > 0.6) return null;
      const vil = this.villageOf(v), well = vil && vil.has.well;
      if (!well || (well.rise !== undefined && well.rise < 1)) return null;
      const i = Math.max(0, vil.folk.indexOf(v)), n = vil.folk.length;
      for (let k = 0; k < 6; k++) {
        const a = (i + k * 0.37) / n * 6.283 + Math.random() * 0.3, ox = Math.cos(a) * 1.35 * T, oy = Math.sin(a) * 0.9 * T + 6;
        const x = (well.tx + 0.5) * T + ox, y = (well.ty + 0.7) * T + oy;
        if (world_ok(state.world, x, y)) return { x, y, at: well, side: [ox > 0 ? 1 : -1, 0] };
      }
      return null;
    }

    // ---------- festivals ----------
    festivalDef() { return G.FESTIVALS[(G.SEASON_NOW && G.SEASON_NOW.id) || 'spring'] || G.FESTIVALS.spring; }

    festivalOn(vil, state) {
      const pole = vil.has.maypole;
      if (!pole || (pole.rise !== undefined && pole.rise < 1)) return false;
      const ph = dayPhase(state.time), [f0, f1] = G.VILLAGE.festival;
      if (ph < f0 || ph > f1) return false;
      const first = ((state.stats.village || {}).firstFest || []).includes(G.key(pole.tx, pole.ty));
      return first || G.Seasons.phase(state.time).day === G.SEASON.days;
    }

    festivals(state) {
      const live = new Set();
      for (const vil of this.list) {
        if (!this.festivalOn(vil, state)) continue;
        const pole = vil.has.maypole, key = G.key(pole.tx, pole.ty);
        live.add(key);
        let fest = this.fests.get(key);
        if (!fest) {
          fest = { vil, pole, def: this.festivalDef(), dancers: [], day: Math.floor(state.time / G.DAY_LENGTH), joined: false };
          this.fests.set(key, fest);
        }
        fest.vil = vil; pole.fest = fest.def.hues;
        // everyone from the village, and friends whose light is close by, comes to dance
        for (const v of this.folk.list) {
          if (v.festival || fest.dancers.includes(v)) continue;
          const mine = vil.folk.includes(v) || (v.home && Math.hypot(v.home.tx - pole.tx, v.home.ty - pole.ty) <= G.VILLAGE.reach + 4);
          if (!mine) continue;
          v.festival = key; v.state = 'dance'; v.sit = 0; v.goal = null;
          fest.dancers.push(v);
        }
        fest.dancers = fest.dancers.filter(v => this.folk.list.includes(v));
        const p = state.player;
        if (!fest.joined && state.running && Math.hypot(p.x - (pole.tx + 0.5) * T, p.y - (pole.ty + 0.5) * T) < 10 * T) {
          fest.joined = true;
          const st = state.stats, seen = `${fest.day}:${key}`, firstEver = !st.festivals;
          let gift = null;
          if (st.festSeen !== seen) {   // one gift per festival
            st.festSeen = seen; st.festivals = (st.festivals || 0) + 1;
            gift = fest.def.gift;
            for (const [k, n] of Object.entries(gift)) { state.inv[k] = (state.inv[k] || 0) + n; st.got[k] = (st.got[k] || 0) + n; }
          }
          if (this.onFestival) this.onFestival(vil, fest, gift, firstEver);
        }
      }
      for (const [key, fest] of this.fests) {   // festivals that are over: everyone heads home to bed
        if (live.has(key)) continue;
        for (const v of fest.dancers) { delete v.festival; v.state = 'idle'; v.t = G.rand(0.3, 1.5); v.bed = null; }
        delete fest.pole.fest;
        this.fests.delete(key);
        const V = state.stats.village;
        if (V && V.firstFest) V.firstFest = V.firstFest.filter(k => k !== key);
      }
    }

    // dancers go round and round the ribbon pole
    dance(dt, state) {
      for (const fest of this.fests.values()) {
        const px = (fest.pole.tx + 0.5) * T, py = (fest.pole.ty + 0.75) * T, n = fest.dancers.length, R = G.VILLAGE.ring * T;
        fest.dancers.forEach((v, i) => {
          const a = i / n * 6.283 + state.time * 0.45;
          const tx = px + Math.cos(a) * R, ty = py + Math.sin(a) * R * 0.62 + 4;
          const dx = tx - v.x, dy = ty - v.y, d = Math.hypot(dx, dy);
          if (d > 600) { v.x = tx; v.y = ty; }
          else if (d > 0.5) { const s = Math.min(d, (d > 40 ? 70 : 140) * dt); v.x += dx / d * s; v.y += dy / d * s; }
          v.face = d > 40 ? Math.sign(dx) || v.face : (-Math.sin(a) >= 0 ? 1 : -1);
          v.walking = true;
          v.f = Math.max(v.f, 0.6);
        });
      }
    }

    floatLanterns(dt, state) {
      const dark = 1 - G.daylight(state.time);
      if (dark > 0.15 && (this.lanternT -= dt) <= 0) {
        this.lanternT = G.VILLAGE.lanternEvery * G.rand(0.6, 1.4);
        for (const fest of this.fests.values()) {
          const v = pick(fest.dancers);
          if (!v || this.lanterns.length > 46) continue;
          this.lanterns.push({ x: v.x, y: v.y - 20, vx: G.rand(-4, 4), vy: -6, life: 1, age: 0, ph: Math.random() * 6, hue: pick(fest.def.hues) });
        }
      }
      for (const L of this.lanterns) {
        L.age += dt; L.ph += dt;
        L.vy += (-17 - L.vy) * Math.min(1, dt * 0.5);
        L.x += (L.vx + Math.sin(L.ph * 0.7) * 5 + (G.windNow || 0) * (G.windDir || 1) * 14) * dt;
        L.y += L.vy * dt;
        if (L.age > 12) L.life -= dt * 0.35;
      }
      this.lanterns = this.lanterns.filter(L => L.life > 0);
    }

    // the festival near the player (for the music), or null
    festivalNear(p) {
      for (const fest of this.fests.values())
        if (Math.hypot(p.x - (fest.pole.tx + 0.5) * T, p.y - (fest.pole.ty + 0.5) * T) < 14 * T) return fest;
      return null;
    }

    // ---------- little words ----------
    chatter(state) {
      if (!state.running) return;
      const p = state.player, S = G.VILLAGE_SAYS, ph = dayPhase(state.time);
      const near = this.folk.list.filter(v => !v.say && Math.hypot(v.x - p.x, v.y - p.y) < 420);
      const dancing = near.filter(v => v.festival);
      if (dancing.length && Math.random() < 0.8) { this.folk.say(pick(dancing), pick(S.festival), 3); return; }
      const building = near.filter(v => v.state === 'busy' && v.goal && v.goal.at && v.goal.at.rise < 1);
      if (building.length) { this.folk.say(pick(building), pick(S.build), 2.5); return; }
      const atWell = near.filter(v => v.state === 'busy' && v.goal && v.goal.at && v.goal.at.type === 'well');
      if (atWell.length && ph > G.VILLAGE.gather[0] - 0.02 && ph < G.VILLAGE.gather[1] + 0.05 && Math.random() < 0.6) {
        const v = pick(atWell);
        this.folk.say(v, pick(S.square), 3.5); this.folk.voice(v);
      }
    }

    // arriving in a village shows its name
    arrive(state) {
      if (!state.running) return;
      const p = state.player;
      let best = null, bd = Infinity;
      for (const vil of this.list) {
        const w = vil.has.well;
        if (!w) continue;
        const d = Math.hypot(p.x / T - (w.tx + 0.5), p.y / T - (w.ty + 0.5));
        if (d < bd) { bd = d; best = vil; }
      }
      if (best && bd <= G.VILLAGE.welcome) {
        if (this.here !== best.key) { this.here = best.key; if (this.onArrive) this.onArrive(best); }
      } else if (!best || bd > G.VILLAGE.welcome + 4) this.here = null;
    }

    // ---------- using village buildings (E or a click) ----------
    // the village building within `reach` px of (x, y), or null
    nearest(world, x, y, reach) {
      let best = null, bd = reach;
      for (const vil of this.list) for (const st of Object.values(vil.has)) {
        if (st.rise !== undefined && st.rise < 1) continue;
        const d = Math.hypot((st.tx + 0.5) * T - x, (st.ty + 0.5) * T - y);
        if (d <= bd) { bd = d; best = st; }
      }
      return best;
    }
    villageAt(st) { return this.list.find(v => Object.values(v.has).includes(st)) || null; }

    // draw water: every planting near the well is watered. Returns how many.
    drawWater(state, well, garden) {
      let n = 0;
      for (const st of garden.plants(state.world)) {
        if (Math.hypot(st.tx - well.tx, st.ty - well.ty) > G.VILLAGE.wellWater) continue;
        garden.water(state, st); n++;
      }
      state.stats.wellUses = (state.stats.wellUses || 0) + 1;
      return n;
    }

    // the next festival, in words
    nextFestival(state) {
      const ph = G.Seasons.phase(state.time), def = this.festivalDef();
      if (ph.day === G.SEASON.days) return `The ${def.name} is this evening!`;
      const d = G.SEASON.days - ph.day;
      return `The next festival is the ${def.name}, ${d === 1 ? 'tomorrow evening' : `in ${d} days`}.`;
    }

    // ---------- the market stall ----------
    trades(state, vil) {
      const day = Math.floor(state.time / G.DAY_LENGTH), key = vil.key || '0,0', [kx, ky] = key.split(',').map(Number);
      const idx = [], N = G.MARKET_TRADES.length;
      for (let i = 0; idx.length < G.MARKET.offers && i < 40; i++) {
        const k = Math.floor(G.hash2(day * 7 + i, kx * 31 + ky, state.world.seed + 55) * N);
        if (!idx.includes(k)) idx.push(k);
      }
      const M = this.marketDay(state);
      return idx.map(k => ({ k, ...G.MARKET_TRADES[k], left: G.MARKET.times - (M.used[key + ':' + k] || 0) }));
    }

    marketDay(state) {
      const day = Math.floor(state.time / G.DAY_LENGTH);
      let M = state.stats.market;
      if (!M || M.day !== day) M = state.stats.market = { day, used: {} };
      return M;
    }

    canTrade(state, t) { return t.left > 0 && Object.entries(t.give).every(([k, n]) => (state.inv[k] || 0) >= n); }

    trade(state, vil, t) {
      if (!this.canTrade(state, t)) return false;
      for (const [k, n] of Object.entries(t.give)) state.inv[k] -= n;
      for (const [k, n] of Object.entries(t.get)) { state.inv[k] = (state.inv[k] || 0) + n; state.stats.got[k] = (state.stats.got[k] || 0) + n; }
      const M = this.marketDay(state), id = (vil.key || '0,0') + ':' + t.k;
      M.used[id] = (M.used[id] || 0) + 1;
      state.stats.trades = (state.stats.trades || 0) + 1;
      return true;
    }
  };

  function world_ok(world, x, y) { return !world.isSolid(Math.floor(x / T), Math.floor(y / T)); }
})();
