// G.Villagers — lost spirits wandering the grey, the ones following you home,
// and the friends who live by your lanterns (kinds and words: data/villagers.js).
//
// Lost spirits sit at fixed spots made from the seed: some 16×16 chunks have
// one (G.SPIRITS.chance), plus a "first" one placed a short walk from the
// Heart Stone. Walk up to one and it takes your light and follows you. Bring
// it into coloured land around a lantern, beacon or the Heart Stone that has
// room (STRUCTURES[type].homes) and it settles there as a villager.
// Saved: which spots were rescued, the villagers and who is following you.
window.G = window.G || {};

(function () {
  const T = G.TILE;
  const strHash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
  const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
  const DIRS = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'];
  const BED = [[-1, 1], [1, 1], [0, 1], [-1, 0], [1, 0], [-2, 1], [2, 1], [-1, 2], [1, 2], [0, 2], [-2, 0], [2, 0]];

  G.Villagers = class {
    constructor() {
      this.lost = new Map();     // id -> lost spirit near the camera
      this.followers = [];       // in order: the first walks right behind you
      this.list = [];            // settled villagers
      this.rescued = new Set();  // spot ids that have found a home
      this.spots = new Map();    // "cx,cy" -> spot or null (memo)
      this.first = undefined;    // the spot near the Heart Stone (memo)
      this.timer = 0;
      this.fx = null;            // { burst, sound(name, x, opts), floater(x, y, text, color), toast(msg, secs), refresh() }
      this.fullWarned = 0;
    }

    reset() { this.lost.clear(); this.followers = []; this.list = []; this.rescued.clear(); this.spots.clear(); this.first = undefined; }

    // ---------- where lost spirits are ----------
    spotOf(world, cx, cy) {
      const k = cx + ',' + cy;
      if (this.spots.has(k)) return this.spots.get(k);
      let spot = null;
      if (G.hash2(cx, cy, world.seed + 4242) < G.SPIRITS.chance) {
        for (let i = 0; i < 10 && !spot; i++) {
          const tx = cx * G.CHUNK + 2 + Math.floor(G.hash2(cx * 7 + i, cy, world.seed + 91) * (G.CHUNK - 4));
          const ty = cy * G.CHUNK + 2 + Math.floor(G.hash2(cx, cy * 7 + i, world.seed + 93) * (G.CHUNK - 4));
          if (!world.isSolid(tx, ty) && !world.structureAt(tx, ty)) spot = { id: k, tx, ty };
        }
      }
      this.spots.set(k, spot);
      return spot;
    }

    firstSpot(world) {
      if (this.first !== undefined) return this.first;
      this.first = null;
      const h = world.lights.find(L => L.type === 'heart');
      if (!h) return null;
      const hx = Math.floor(h.x / T), hy = Math.floor(h.y / T), a0 = G.hash2(1, 2, world.seed) * 6.283;
      for (let r = 17; r < 30 && !this.first; r++) for (let a = 0; a < 24; a++) {
        const ang = a0 + a / 24 * 6.283, tx = hx + Math.round(Math.cos(ang) * r), ty = hy + Math.round(Math.sin(ang) * r);
        if (world.isSolid(tx, ty) || world.isSolid(tx + 1, ty) || world.isSolid(tx - 1, ty)) continue;
        this.first = { id: 'first', tx, ty }; break;
      }
      return this.first;
    }

    taken(id) { return this.rescued.has(id) || this.followers.some(v => v.id === id); }

    // nearest lost spot (not yet found) from a point, within `chunks` chunks
    nearestLost(world, x, y, chunks = 8) {
      const ccx = Math.floor(x / T / G.CHUNK), ccy = Math.floor(y / T / G.CHUNK);
      let best = null, bd = Infinity;
      const f = this.firstSpot(world), cands = f ? [f] : [];
      for (let cy = ccy - chunks; cy <= ccy + chunks; cy++) for (let cx = ccx - chunks; cx <= ccx + chunks; cx++) {
        const s = this.spotOf(world, cx, cy); if (s) cands.push(s);
      }
      for (const s of cands) {
        if (this.taken(s.id)) continue;
        const d = Math.hypot((s.tx + 0.5) * T - x, (s.ty + 0.5) * T - y);
        if (d < bd && d > 12 * T) { bd = d; best = s; }
      }
      return best;
    }

    // ---------- who someone is (decided by their spot, so it never changes) ----------
    make(world, id, x, y) {
      const r = G.rng(strHash(id) ^ world.seed);
      const kinds = Object.keys(G.VILLAGER_KINDS), kind = kinds[Math.floor(r() * kinds.length)], def = G.VILLAGER_KINDS[kind];
      const used = new Set([...this.list, ...this.followers].map(v => v.name));
      let ni = Math.floor(r() * G.VILLAGER_NAMES.length);
      for (let i = 0; i < G.VILLAGER_NAMES.length && used.has(G.VILLAGER_NAMES[ni]); i++) ni = (ni + 1) % G.VILLAGER_NAMES.length;
      return {
        id, kind, def, name: G.VILLAGER_NAMES[ni], hue: pick(def.hues, r) + Math.floor(r() * 16 - 8),
        x, y, vx: 0, vy: 0, face: 1, ph: r() * 6.283, mode: 'lost', state: 'idle', t: 1, f: 0, a: 1,
        say: null, sayT: 0, greetCd: 0, home: null, giftDay: -1, check: 0, hx: x, hy: y,
        sit: 0, stuck: 0, walking: false, giftReady: false,
      };
    }

    // ---------- per frame ----------
    update(dt, state, W, H) {
      const world = state.world;
      if (!world) return;
      this.view = { x0: state.cam.x - W / 2 - 60, y0: state.cam.y - H / 2 - 60, x1: state.cam.x + W / 2 + 60, y1: state.cam.y + H / 2 + 80 };
      this.timer -= dt;
      if (this.timer <= 0) { this.timer = 0.5; this.refreshLost(world, state.cam); }
      const p = state.player, day = G.daylight(state.time);
      this.fullWarned -= dt;
      for (const v of this.lost.values()) this.stepLost(v, dt, state, p);
      let lead = p;
      for (const v of [...this.followers]) { this.stepFollow(v, dt, state, lead); lead = v; }
      for (const v of this.list) this.stepHome(v, dt, state, p, day);
      for (const v of this.all()) {
        v.ph += dt; v.greetCd -= dt;
        if (v.say && (v.sayT -= dt) <= 0) v.say = null;
        if (v.spark !== undefined && (v.spark -= dt) <= 0) delete v.spark;
      }
    }

    all() { return [...this.lost.values(), ...this.followers, ...this.list]; }

    say(v, text, secs = 4) { v.say = text; v.sayT = secs; }

    refreshLost(world, cam) {
      const C = G.CHUNK * T, ccx = Math.floor(cam.x / C), ccy = Math.floor(cam.y / C);
      const want = [];
      for (let cy = ccy - 2; cy <= ccy + 2; cy++) for (let cx = ccx - 3; cx <= ccx + 3; cx++) {
        const s = this.spotOf(world, cx, cy); if (s) want.push(s);
      }
      const f = this.firstSpot(world); if (f) want.push(f);
      for (const s of want) {
        if (this.lost.has(s.id) || this.taken(s.id)) continue;
        const x = (s.tx + 0.5) * T, y = (s.ty + 0.5) * T;
        if (Math.hypot(x - cam.x, y - cam.y) > 1500) continue;
        const v = this.make(world, s.id, x, y);
        v.hx = x; v.hy = y; v.a = 0;
        this.lost.set(s.id, v);
      }
      for (const [id, v] of this.lost) if (Math.hypot(v.x - cam.x, v.y - cam.y) > 1900) this.lost.delete(id);
    }

    // a lost spirit drifts sadly around its spot until you come close
    stepLost(v, dt, state, p) {
      v.a = Math.min(1, v.a + dt * 0.5);
      v.t -= dt;
      if (v.t <= 0) {
        v.t = G.rand(2, 5);
        const a = Math.random() * 6.283, r = G.rand(0, 1.6) * T;
        v.tx2 = v.hx + Math.cos(a) * r; v.ty2 = v.hy + Math.sin(a) * r * 0.6;
      }
      if (v.tx2 !== undefined) {
        v.x += (v.tx2 - v.x) * Math.min(1, dt * 0.5); v.y += (v.ty2 - v.y) * Math.min(1, dt * 0.5);
        if (Math.abs(v.tx2 - v.x) > 1) v.face = Math.sign(v.tx2 - v.x);
      }
      v.f += (Math.min(0.15, state.world.restoreAt(v.x, v.y, state.world.lights)) - v.f) * Math.min(1, dt * 2);
      if (!state.running) return;
      const d = Math.hypot(v.x - p.x, v.y - p.y);
      if (d < 190 && v.greetCd <= 0) { v.greetCd = G.rand(7, 11); this.say(v, pick(G.VILLAGER_SAYS.lost), 3.2); this.sound('sigh', v.x); }
      if (d < G.SPIRITS.touch) {
        if (this.followers.length >= G.SPIRITS.maxFollow) {
          if (this.fullWarned <= 0) { this.fullWarned = 8; this.toast(`You can only lead ${G.SPIRITS.maxFollow} spirits at once — bring these home first.`, 4); }
          return;
        }
        this.lost.delete(v.id);
        v.mode = 'follow'; v.greetCd = 6;
        this.followers.push(v);
        this.say(v, pick(G.VILLAGER_SAYS.found), 4);
        state.stats.spiritsFound = (state.stats.spiritsFound || 0) + 1;
        if (this.fx) { this.fx.burst(v.x, v.y - 12, 'rgba(220,220,255,A)', 16); }
        this.sound('spiritFound', v.x);
        if (this.onFound) this.onFound(v);
      }
    }

    // a follower floats along behind you (or behind the one ahead of it)
    stepFollow(v, dt, state, lead) {
      const world = state.world;
      const dx = lead.x - v.x, dy = lead.y - v.y, d = Math.hypot(dx, dy);
      if (d > 700) { v.x = lead.x - 20; v.y = lead.y + 6; }
      else if (d > 30) {
        const sp = Math.min(260, (d - 26) * 3.2);
        v.vx += (dx / d * sp - v.vx) * Math.min(1, dt * 5); v.vy += (dy / d * sp - v.vy) * Math.min(1, dt * 5);
      } else { v.vx *= Math.pow(0.02, dt); v.vy *= Math.pow(0.02, dt); }
      v.x += v.vx * dt; v.y += v.vy * dt;
      if (Math.abs(v.vx) > 6) v.face = Math.sign(v.vx);
      v.walking = Math.hypot(v.vx, v.vy) > 20;
      const here = world.restoreAt(v.x, v.y, world.lights);
      v.f += (here - v.f) * Math.min(1, dt * 1.5);
      if (state.running && v.greetCd <= 0 && Math.random() < dt * 0.08) { v.greetCd = 14; this.say(v, pick(G.VILLAGER_SAYS.follow), 3.5); }
      if ((v.check -= dt) > 0) return;
      v.check = 0.25;
      if (here < G.SPIRITS.settle) return;
      const home = this.homeFor(world, v.x, v.y);
      if (home && home.light) this.settle(v, home.light, state);
      else if (home && home.full && this.fullWarned <= 0) {
        this.fullWarned = 12;
        this.say(v, G.VILLAGER_SAYS.full[0], 4);
        this.toast(`Every home by this ${G.STRUCTURES[home.full.type].name} is taken. Light another lantern nearby for ${v.name}.`, 5);
      }
    }

    // ---------- homes ----------
    lightKey(L) { return G.key(Math.floor(L.x / T), Math.floor(L.y / T)); }
    capacity(L) { return (G.STRUCTURES[L.type] && G.STRUCTURES[L.type].homes) || 0; }
    living(key) { let n = 0; for (const v of this.list) if (v.home && v.home.key === key) n++; return n; }

    // the nearest restoring light around (x, y) with room for one more
    homeFor(world, x, y, anywhere) {
      const ls = world.lights.filter(L => L.restore && this.capacity(L))
        .map(L => ({ L, d: Math.hypot(L.x - x, L.y - y) / T }))
        .filter(o => anywhere || o.d <= o.L.restore + 0.5)
        .sort((a, b) => a.d - b.d);
      for (const o of ls) if (this.living(this.lightKey(o.L)) < this.capacity(o.L)) return { light: o.L };
      return ls.length ? { full: ls[0].L } : null;
    }

    setHome(v, L) {
      const tx = Math.floor(L.x / T), ty = Math.floor(L.y / T);
      v.home = { tx, ty, key: G.key(tx, ty), type: L.type };
      v.bed = null;
    }

    settle(v, L, state) {
      this.followers = this.followers.filter(o => o !== v);
      this.rescued.add(v.id);
      v.mode = 'home'; v.state = 'idle'; v.t = 2.5; v.greetCd = 8; v.spark = 2.5;
      this.setHome(v, L);
      this.list.push(v);
      this.say(v, pick(G.VILLAGER_SAYS.settle), 5);
      if (this.fx) { this.fx.burst(v.x, v.y - 12, `hsla(${v.hue},90%,75%,A)`, 26); this.fx.burst(v.x, v.y - 12, 'rgba(255,235,170,A)', 14); }
      this.sound('homecoming', v.x);
      if (this.onSettle) this.onSettle(v, L);
    }

    // where a villager sleeps: a free spot beside its home light
    bedFor(world, v) {
      if (v.bed) return v.bed;
      const mates = this.list.filter(o => o.home && o.home.key === v.home.key), idx = Math.max(0, mates.indexOf(v));
      const free = BED.filter(([dx, dy]) => !world.isSolid(v.home.tx + dx, v.home.ty + dy));
      const [dx, dy] = free.length ? free[idx % free.length] : [0, 1];
      v.bed = { x: (v.home.tx + dx + 0.5) * T + (idx % 2 ? -4 : 4), y: (v.home.ty + dy + 0.6) * T };
      return v.bed;
    }

    // something this villager loves, near its home: { x, y, at } or null
    findLiked(world, v) {
      const want = v.def.likes, hx = v.home.tx, hy = v.home.ty, R = G.SPIRITS.visit, out = [];
      for (const s of world.structures.values()) {
        if (s.type !== want || Math.abs(s.tx - hx) > R || Math.abs(s.ty - hy) > R) continue;
        if (G.STRUCTURES[s.type].floor) { out.push({ x: (s.tx + 0.5) * T, y: (s.ty + 0.6) * T, at: s }); continue; }
        for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) {
          if (world.isSolid(s.tx + dx, s.ty + dy)) continue;
          out.push({ x: (s.tx + dx + 0.5) * T - dx * 8, y: (s.ty + dy + 0.55) * T - dy * 6, at: s, side: [dx, dy] }); break;
        }
      }
      return out.length ? pick(out) : null;
    }

    // ---------- a villager's day ----------
    stepHome(v, dt, state, p, day) {
      const world = state.world;
      v.walking = false;
      v.giftReady = v.giftDay !== Math.floor(state.time / G.DAY_LENGTH);
      v.f += (Math.max(0.35, world.restoreAt(v.x, v.y, world.lights)) - v.f) * Math.min(1, dt * 2);
      if ((v.check -= dt) <= 0) {   // is my home still there?
        v.check = 2;
        const st = world.structureAt(v.home.tx, v.home.ty);
        if (!st || !G.STRUCTURES[st.type].homes) {
          const h = this.homeFor(world, v.x, v.y, true);
          const L = h && (h.light || h.full);
          if (L) { this.setHome(v, L); this.toast(`${v.name} has moved to live by another light.`, 3.5); v.state = 'idle'; v.t = 0.5; }
        }
      }
      const night = v.state === 'sleep' || v.state === 'tobed' ? day < 0.36 : day < 0.24;
      if (night && v.state !== 'sleep' && v.state !== 'tobed') { v.state = 'tobed'; const b = this.bedFor(world, v); v.tx2 = b.x; v.ty2 = b.y; v.sit = 0; }
      if (!night && (v.state === 'sleep' || v.state === 'tobed')) { v.state = 'idle'; v.t = G.rand(0.5, 2); }

      const dp = Math.hypot(v.x - p.x, v.y - p.y);
      const near = state.running && dp < G.SPIRITS.greet && v.state !== 'sleep' && v.state !== 'tobed';
      if (near) {   // stop and look at the spirit; say hello now and then
        v.face = p.x < v.x ? -1 : 1;
        if (v.state === 'walk' || v.state === 'go') { v.state = 'idle'; v.t = 2; }
        if (v.greetCd <= 0) { v.greetCd = 30; this.say(v, this.hello(v, state), 3.5); this.voice(v); }
      }

      if (v.state === 'idle') {
        v.sit -= v.sit * Math.min(1, dt * 6);
        if (near) return;
        if ((v.t -= dt) > 0) return;
        const liked = Math.random() < 0.4 && day > 0.4 && this.findLiked(world, v);
        if (liked) { v.state = 'go'; v.tx2 = liked.x; v.ty2 = liked.y; v.goal = liked; return; }
        for (let i = 0; i < 8; i++) {
          const a = Math.random() * 6.283, r = G.rand(0.5, G.SPIRITS.wander) * T;
          const x = (v.home.tx + 0.5) * T + Math.cos(a) * r, y = (v.home.ty + 0.8) * T + Math.sin(a) * r * 0.7;
          if (!world.isSolid(Math.floor(x / T), Math.floor(y / T))) { v.state = 'walk'; v.tx2 = x; v.ty2 = y; return; }
        }
        v.t = 1;
      } else if (v.state === 'walk' || v.state === 'go' || v.state === 'tobed') {
        if (this.walk(v, dt, world)) {
          if (v.state === 'tobed') { v.state = 'sleep'; return; }
          if (v.state === 'go') {
            v.state = 'busy'; v.t = G.rand(7, 12); v.face = v.goal.side ? -v.goal.side[0] || v.face : v.face;
            if (v.goal.side && v.goal.side[1] === 1) v.face = v.x < (v.goal.at.tx + 0.5) * T ? 1 : -1;
            state.stats.visits = (state.stats.visits || 0) + 1;
            return;
          }
          v.state = 'idle'; v.t = G.rand(1.5, 5);
        } else if (v.stuck > 1.5) { v.state = v.state === 'tobed' ? 'sleep' : 'idle'; v.t = 1; }
      } else if (v.state === 'busy') {
        const sits = v.def.doing === 'sit' && v.goal && v.goal.side && v.goal.side[1] === 1;
        v.sit += ((sits ? 1 : 0) - v.sit) * Math.min(1, dt * 5);
        if (v.def.doing === 'hum' && dp < 260 && Math.random() < dt * 0.6) this.sound('hum', v.x, { pitch: v.hue });
        if ((v.t -= dt) <= 0) { v.state = 'idle'; v.t = G.rand(2, 4); v.goal = null; }
      }
    }

    // step toward (tx2, ty2); true once there. Villagers walk around solid things.
    walk(v, dt, world) {
      const dx = v.tx2 - v.x, dy = v.ty2 - v.y, d = Math.hypot(dx, dy);
      if (d < 3) { v.stuck = 0; return true; }
      const sp = v.state === 'tobed' ? 30 : 36, nx = v.x + dx / d * sp * dt, ny = v.y + dy / d * sp * dt;
      const ok = (x, y) => !world.isSolid(Math.floor(x / T), Math.floor(y / T));
      if (ok(nx, ny)) { v.x = nx; v.y = ny; v.stuck = 0; }
      else if (ok(nx, v.y)) { v.x = nx; v.stuck = (v.stuck || 0) + dt * 0.5; }
      else if (ok(v.x, ny)) { v.y = ny; v.stuck = (v.stuck || 0) + dt * 0.5; }
      else v.stuck = (v.stuck || 0) + dt;
      if (Math.abs(dx) > 2) v.face = Math.sign(dx);
      v.walking = true;
      return false;
    }

    // ---------- talking ----------
    hello(v) {
      const n = v.name;
      return pick([`Hello, little light!`, `Oh, it's you! Hello!`, `${n} says hi!`, `Hi! Come and talk to me.`, `There you are!`]);
    }

    // a full conversation line (and a gift, once a day)
    talk(v, state) {
      const S = G.VILLAGER_SAYS, world = state.world, day = Math.floor(state.time / G.DAY_LENGTH);
      state.stats.talks = (state.stats.talks || 0) + 1;
      v.face = state.player.x < v.x ? -1 : 1;
      v.greetCd = Math.max(v.greetCd, 20);
      if (v.state === 'sleep') { this.say(v, pick(S.sleep), 2.5); return; }
      if (v.state === 'walk' || v.state === 'go') { v.state = 'idle'; v.t = 3; }
      this.voice(v);
      if (v.giftDay !== day) {
        v.giftDay = day;
        this.say(v, pick(S.gift), 4.5);
        let k = 0;
        for (const [item, n] of Object.entries(v.def.gift)) {
          state.inv[item] = (state.inv[item] || 0) + n;
          state.stats.got[item] = (state.stats.got[item] || 0) + n;
          if (this.fx) this.fx.floater(v.x + 34, v.y - 8 - k * 14, `+${n} ${G.ITEMS[item].name}`, G.ITEMS[item].color);
          k++;
        }
        state.stats.gifts = (state.stats.gifts || 0) + 1;
        this.sound('gift', v.x);
        if (this.fx) this.fx.refresh();
        return;
      }
      const r = Math.random();
      if (r < 0.3) {
        const lost = this.nearestLost(world, v.x, v.y);
        if (lost) {
          const a = Math.atan2((lost.ty + 0.5) * T - v.y, (lost.tx + 0.5) * T - v.x);
          const dir = DIRS[(Math.round(a / (Math.PI / 4)) + 8) % 8];
          this.say(v, pick(S.heard).replace('{dir}', dir), 5); return;
        }
      }
      if (r < 0.45 && !this.findLiked(world, v)) { this.say(v, v.def.wish, 5); return; }
      const wx = state.weather, dl = G.daylight(state.time), phase = (state.time % G.DAY_LENGTH) / G.DAY_LENGTH;
      let pool = [...v.def.lines, ...v.def.lines];
      if (wx && wx.rain > 0.4) pool = pool.concat(S.rain, S.rain);
      if (wx && wx.v.fog > 0.4) pool = pool.concat(S.fog);
      if (wx && wx.rainbow > 0) pool = pool.concat(S.rainbow, S.rainbow, S.rainbow);
      if (dl < 0.35) pool = pool.concat(S.night);
      if (phase > 0.72 && phase < 0.95 && dl > 0.3) pool = pool.concat(S.morning);
      if (this.list.length >= 3) pool = pool.concat(S.friends);
      if (v.state === 'busy') pool.push(`${v.name} ${v.def.visit}. "Isn't it lovely?"`);
      let line = pick(pool);
      if (line === v.lastLine) line = pick(pool);
      v.lastLine = line;
      this.say(v, line, 4.5);
    }

    // the villager under a world point (for clicks)
    at(x, y) {
      let best = null, bd = 20;
      for (const v of this.list) { const d = Math.hypot(v.x - x, v.y - 12 - y); if (d < bd) { bd = d; best = v; } }
      return best;
    }
    nearest(x, y, r) {
      let best = null, bd = r;
      for (const v of this.list) { const d = Math.hypot(v.x - x, v.y - y); if (d < bd) { bd = d; best = v; } }
      return best;
    }

    voice(v) { this.sound('chirp', v.x, { pitch: v.hue, n: 2 + Math.floor(Math.random() * 3) }); }
    sound(name, x, opts) {
      if (!this.fx) return;
      const now = performance.now(), gap = name === 'hum' ? 1600 : name === 'sigh' ? 1200 : 250;
      this.last = this.last || {};
      if (now - (this.last[name] || 0) < gap) return;
      this.last[name] = now;
      this.fx.sound(name, x, opts);
    }
    toast(msg, secs) { if (this.fx) this.fx.toast(msg, secs); }

    // ---------- drawing helpers for the renderer ----------
    rows() {
      const m = new Map(), vw = this.view;
      for (const v of this.all()) {
        if (vw && (v.x < vw.x0 || v.x > vw.x1 || v.y < vw.y0 || v.y > vw.y1)) continue;
        const r = Math.floor(v.y / T);
        if (!m.has(r)) m.set(r, []);
        m.get(r).push(v);
      }
      for (const arr of m.values()) arr.sort((a, b) => a.y - b.y);
      return m;
    }

    // each villager's little lantern glows at night
    glows(out, camX, camY) {
      for (const v of this.lost.values()) out.push({ x: v.x - camX, y: v.y - camY - 14, r: 30 * v.a, hue: 235 });   // a pale shimmer in the dark
      for (const v of [...this.followers, ...this.list]) {
        const a = v.mode === 'home' ? 1 : v.f;
        if (a > 0.2) out.push({ x: v.x - camX + v.face * 9, y: v.y - camY - 12, r: 46 * a, hue: v.hue });
      }
    }

    // ---------- saving ----------
    serialize() {
      return {
        rescued: [...this.rescued],
        list: this.list.map(v => ({ id: v.id, name: v.name, kind: v.kind, hue: v.hue, home: [v.home.tx, v.home.ty], gift: v.giftDay })),
        follow: this.followers.map(v => v.id),
      };
    }

    load(d, world, player) {
      this.reset();
      if (!d) return;
      for (const id of d.rescued || []) this.rescued.add(id);
      for (const s of d.list || []) {
        if (!G.VILLAGER_KINDS[s.kind]) continue;
        const v = this.make(world, s.id, 0, 0);
        Object.assign(v, { name: s.name || v.name, kind: s.kind, def: G.VILLAGER_KINDS[s.kind], hue: s.hue, giftDay: s.gift ?? -1, mode: 'home', f: 1 });
        const L = world.lights.find(L => this.lightKey(L) === G.key(s.home[0], s.home[1])) || world.lights.find(L => L.type === 'heart');
        if (!L) continue;
        this.setHome(v, L);
        this.list.push(v);
        const b = this.bedFor(world, v);
        v.x = b.x; v.y = b.y; v.t = Math.random() * 3;
      }
      if (player) for (const id of d.follow || []) {
        if (this.rescued.has(id)) continue;
        const v = this.make(world, id, player.x - 24 * (this.followers.length + 1), player.y + 6);
        v.mode = 'follow'; v.greetCd = 10;
        this.followers.push(v);
      }
    }
  };
})();
