// G.Wishes — friends' wishes and cottages (Night 10; the wishes are data in data/wishes.js).
//
// Every settled friend now and then makes a wish (v.wish = { id, base, known, ready }).
// `base` is where the counter stood when they asked, so "build 3 paths" means 3 more.
// Talking to them tells you the wish (known), and once it can be granted — you carry
// what they asked for, or it already came true — talking grants it: they take the
// items, give a gift back and you gain a friendship heart (v.hearts, up to 5).
// The first wish you ever grant teaches the Cottage recipe (stats.unlocked).
// A friend without a house moves into a free cottage near their light; at night they
// walk to its door and sleep inside (the window glows), and come out in the morning.
// Saved inside each villager (wish, hearts, house, wishT) — older saves just start fresh.
window.G = window.G || {};

(function () {
  const T = G.TILE;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  G.Wishes = class {
    constructor(folk) {
      this.folk = folk;     // G.Villagers
      this.timer = 0;
      this.fx = null;       // same helpers as folk.fx
      this.onUnlock = null; this.onGrant = null; this.onMoveIn = null; this.onReady = null;
    }

    def(v) { return v.wish && G.WISHES[v.wish.id]; }

    // ---------- how far along a wish is: { have, need } ----------
    progress(v, state) {
      const w = this.def(v);
      if (!w) return { have: 0, need: 1 };
      const base = v.wish.base || 0;
      if (w.type === 'bring') {
        let have = 0, need = 0;
        for (const [k, n] of Object.entries(w.items)) { have += Math.min(n, state.inv[k] || 0); need += n; }
        return { have, need };
      }
      if (w.type === 'house') return { have: v.house ? 1 : 0, need: 1 };
      return { have: G.clamp(this.counter(w, v, state) - base, 0, w.n), need: w.n };
    }

    counter(w, v, state) {
      if (w.type === 'build') {
        let n = 0; const R = G.WISH.near, h = v.home;
        for (const s of state.world.structures.values())
          if (s.type === w.structure && Math.abs(s.tx - h.tx) <= R && Math.abs(s.ty - h.ty) <= R) n++;
        return n;
      }
      const st = state.stats;
      if (w.stat === 'planted') return st.planted || 0;
      if (w.stat === 'flowers') return ((st.grown || {}).bloom || 0) + ((st.grown || {}).moonflower || 0);
      if (w.stat === 'lights') return state.world.litCount();
      if (w.stat === 'friends') return this.folk.list.length;
      return 0;
    }

    canGrant(v, state) { const p = this.progress(v, state); return !!v.wish && p.have >= p.need; }

    // ---------- making a wish ----------
    choose(v, state) {
      const first = !v.wishes, pool = [];
      for (const [id, w] of Object.entries(G.WISHES)) {
        if (first && !w.easy) continue;
        if (w.kinds && !w.kinds.includes(v.kind)) continue;
        if (id === v.lastWish) continue;
        if (w.type === 'house' && v.house) continue;
        if (w.if && !w.if(state, v)) continue;
        for (let i = 0; i < (w.weight || 1); i++) pool.push(id);
      }
      return pool.length ? pick(pool) : null;
    }

    make(v, state) {
      const id = this.choose(v, state);
      if (!id) { v.wishT = 30; return; }
      const w = G.WISHES[id];
      v.wish = { id, base: 0, known: false };
      if (w.type === 'build' || w.type === 'stat') v.wish.base = this.counter(w, v, state);
      if (this.fx) this.fx.burst(v.x, v.y - 40, 'rgba(255,190,215,A)', 8);
    }

    // ---------- per frame ----------
    update(dt, state) {
      if (!state.world) return;
      for (const v of this.folk.list) {
        if (v.nextSay && !v.say && v.state !== 'sleep') { this.folk.say(v, v.nextSay, 5); v.nextSay = null; }
      }
      if ((this.timer -= dt) > 0) return;
      const step = 0.5 - this.timer; this.timer = 0.5;
      this.houses(state);
      for (const v of this.folk.list) {
        if (!v.wish) {
          if (v.wishT === undefined) v.wishT = G.WISH.first;
          if ((v.wishT -= step) <= 0) this.make(v, state);
          continue;
        }
        const w = this.def(v);
        if (!w) { v.wish = null; v.wishT = 5; continue; }
        // a wish that came true by itself (built, planted, moved in): tell the player once
        if (w.type !== 'bring' && !v.wish.ready && this.canGrant(v, state)) {
          v.wish.ready = true;
          if (state.running && this.onReady) this.onReady(v, w);
        }
      }
    }

    // ---------- cottages ----------
    // who lives where: free cottages near a friend's light are claimed; picked-up ones are left
    houses(state) {
      const world = state.world, owners = new Map();
      for (const v of this.folk.list) {
        if (!v.house) continue;
        const st = world.structureAt(v.house.tx, v.house.ty);
        if (!st || !G.STRUCTURES[st.type].house || owners.has(G.key(v.house.tx, v.house.ty))) {
          v.house = null; v.bed = null;
          if (v.state === 'sleep') { v.state = 'idle'; v.t = 1; }
          continue;
        }
        owners.set(G.key(v.house.tx, v.house.ty), v);
      }
      const free = [];
      for (const st of world.structures.values()) {
        if (!G.STRUCTURES[st.type].house) continue;
        st.owner = owners.get(G.key(st.tx, st.ty)) || null;
        if (!st.owner) free.push(st);
      }
      if (!free.length) return;
      for (const v of this.folk.list) {
        if (v.house || !v.home) continue;
        let best = null, bd = Infinity;
        for (const st of free) {
          if (st.owner) continue;
          const d = Math.max(Math.abs(st.tx - v.home.tx), Math.abs(st.ty - v.home.ty));
          if (d <= G.WISH.near && d < bd) { bd = d; best = st; }
        }
        if (!best) continue;
        best.owner = v;
        this.moveIn(v, best, state);
      }
    }

    moveIn(v, st, state) {
      v.house = { tx: st.tx, ty: st.ty }; v.bed = null;
      if (!state.running) return;
      state.stats.housed = (state.stats.housed || 0) + 1;
      this.folk.say(v, pick(G.WISH_SAYS.movein), 4);
      v.spark = 2;
      const x = (st.tx + 0.5) * T, y = st.ty * T;
      if (this.fx) { this.fx.burst(x, y - 10, `hsla(${v.hue},90%,75%,A)`, 22); this.fx.burst(x, y - 30, 'rgba(255,225,170,A)', 12); }
      this.folk.sound('movein', x);
      if (this.onMoveIn) this.onMoveIn(v, st);
    }

    // where a friend with a house sleeps: on its doorstep (they then go inside)
    door(v) { return { x: (v.house.tx + 0.5) * T - 8, y: (v.house.ty + 1) * T + 3 }; }
    inside(v) { return !!v.house && v.state === 'sleep'; }

    // ---------- talking: true if the wish took over the conversation ----------
    talk(v, state) {
      if (v.state === 'sleep') return false;
      const w = this.def(v);
      if (!w) return false;
      if (this.canGrant(v, state)) { this.grant(v, w, state); return true; }
      if (!v.wish.known) {
        v.wish.known = true;
        state.stats.wishesHeard = (state.stats.wishesHeard || 0) + 1;
        if (this.onHeard) this.onHeard(v, w);
        if (v.giftDay !== Math.floor(state.time / G.DAY_LENGTH)) { v.nextSay = w.text; return false; }   // the gift first, then the wish
        this.folk.say(v, w.text, 6); this.folk.voice(v);
        return true;
      }
      if (v.giftDay === Math.floor(state.time / G.DAY_LENGTH)) {   // gift already given today: remind now and then
        if (Math.random() < 0.5) {
          const p = this.progress(v, state);
          let line = pick(G.WISH_SAYS.remind).replace('{short}', w.short);
          if (p.need > 1 && w.type !== 'house') line += ` (${p.have}/${p.need})`;
          this.folk.say(v, line.charAt(0).toUpperCase() + line.slice(1), 4.5); this.folk.voice(v);
          return true;
        }
      }
      return false;
    }

    grant(v, w, state) {
      if (w.type === 'bring') for (const [k, n] of Object.entries(w.items)) state.inv[k] = Math.max(0, (state.inv[k] || 0) - n);
      let k = 0;
      for (const [item, n] of Object.entries(w.reward || {})) {
        state.inv[item] = (state.inv[item] || 0) + n;
        state.stats.got[item] = (state.stats.got[item] || 0) + n;
        if (this.fx) this.fx.floater(v.x + 36, v.y - 8 - k * 14, `+${n} ${G.ITEMS[item].name}`, G.ITEMS[item].color);
        k++;
      }
      const before = v.hearts || 0;
      v.hearts = Math.min(G.WISH.maxHearts, before + 1);
      v.wishes = (v.wishes || 0) + 1;
      v.lastWish = v.wish.id; v.wish = null;
      v.wishT = G.rand(G.WISH.between[0], G.WISH.between[1]);
      state.stats.wishes = (state.stats.wishes || 0) + 1;
      let line = w.thanks;
      if (v.hearts >= G.WISH.giftHearts && before < G.WISH.giftHearts) line += ' ' + pick(G.WISH_SAYS.hearts);
      this.folk.say(v, line, 5.5);
      this.folk.voice(v);
      v.spark = 2.2; v.heartFx = 1.6;
      if (this.fx) { this.fx.burst(v.x, v.y - 20, 'rgba(255,150,190,A)', 18); this.fx.floater(v.x, v.y - 48, '♥', '#ff9fc4'); this.fx.refresh(); }
      this.folk.sound('wish', v.x);
      const un = state.stats.unlocked || (state.stats.unlocked = []);
      if (!un.includes(G.WISH.unlockFirst)) { un.push(G.WISH.unlockFirst); if (this.onUnlock) this.onUnlock(G.WISH.unlockFirst, v); }
      if (this.onGrant) this.onGrant(v, w, before);
    }

    // the friends' wishes for the HUD list: nearest first
    active(state) {
      const p = state.player;
      return this.folk.list.filter(v => v.wish && G.WISHES[v.wish.id])
        .map(v => ({ v, w: G.WISHES[v.wish.id], p: this.progress(v, state), ready: this.canGrant(v, state), d: Math.hypot(v.x - p.x, v.y - p.y) }))
        .sort((a, b) => (b.ready - a.ready) || (a.d - b.d));
    }

    // ---------- saving (stored inside each villager) ----------
    save(v) {
      const o = {};
      if (v.wish) o.wish = [v.wish.id, v.wish.base || 0, v.wish.known ? 1 : 0];
      if (v.hearts) o.hearts = v.hearts;
      if (v.wishes) o.wishes = v.wishes;
      if (v.house) o.house = [v.house.tx, v.house.ty];
      if (v.wishT !== undefined && !v.wish) o.wishT = Math.round(v.wishT);
      return o;
    }
    load(v, s) {
      if (s.wish && G.WISHES[s.wish[0]]) v.wish = { id: s.wish[0], base: +s.wish[1] || 0, known: !!s.wish[2] };
      v.hearts = +s.hearts || 0; v.wishes = +s.wishes || 0;
      if (s.house) v.house = { tx: s.house[0], ty: s.house[1] };
      if (s.wishT !== undefined) v.wishT = +s.wishT;
    }
  };
})();
