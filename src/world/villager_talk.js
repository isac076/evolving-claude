// Talking with friends: the short hello when you pass by, and a full conversation
// (a wish, a daily gift, a hint toward a lost spirit or a ruin, or a line that fits the
// weather, season and time). Added to G.Villagers' prototype — moved out of villagers.js on Night 14.
window.G = window.G || {};

(function () {
  const T = G.TILE;
  const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
  const DIRS = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'];

  Object.assign(G.Villagers.prototype, {
    hello(v, state) {
      const n = v.name, W = this.wishes;
      if (W && v.wish && state) {   // a friend with a wish says so (Night 10)
        if (W.canGrant(v, state)) return pick(W.def(v).type === 'bring' ? G.WISH_SAYS.carry : G.WISH_SAYS.ready);
        if (!v.wish.known) return pick(['Psst! Can I tell you a wish?', 'Oh! I was hoping you\'d come. I have a wish…', 'Come here — I have a little wish!']);
      }
      return pick([`Hello, little light!`, `Oh, it's you! Hello!`, `${n} says hi!`, `Hi! Come and talk to me.`, `There you are!`]);
    },

    // a full conversation line (and a gift, once a day)
    talk(v, state) {
      const S = G.VILLAGER_SAYS, world = state.world, day = Math.floor(state.time / G.DAY_LENGTH);
      state.stats.talks = (state.stats.talks || 0) + 1;
      v.face = state.player.x < v.x ? -1 : 1;
      v.greetCd = Math.max(v.greetCd, 20);
      if (v.state === 'sleep') { this.say(v, pick(S.sleep), 2.5); return; }
      if (v.state === 'walk' || v.state === 'go') { v.state = 'idle'; v.t = 3; }
      if (this.wishes && this.wishes.talk(v, state)) return;   // wishes come first (Night 10)
      this.voice(v);
      if (v.giftDay !== day) {
        v.giftDay = day;
        this.say(v, pick(S.gift), 4.5);
        let k = 0;
        const extra = (v.hearts || 0) >= G.WISH.giftHearts ? 1 : 0;   // close friends give a little more
        for (const [item, n0] of Object.entries(v.def.gift)) {
          const n = n0 + extra;
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
      if (r >= 0.3 && r < 0.42) {   // friends remember the old ruins (Night 11)
        const ruin = G.Ruins.nearestUnfound(world, state.stats, Math.floor(v.x / T), Math.floor(v.y / T));
        if (ruin) {
          const dir = G.Ruins.direction(v.x / T, v.y / T, ruin.tx, ruin.ty);
          this.say(v, pick(S.ruins).replace('{dir}', dir), 5); return;
        }
      }
      if (r < 0.45 && !this.findLiked(world, v)) { this.say(v, v.def.wish, 5); return; }
      const wx = state.weather, dl = G.daylight(state.time), phase = (state.time % G.DAY_LENGTH) / G.DAY_LENGTH;
      let pool = [...v.def.lines, ...v.def.lines];
      if (wx && wx.rain > 0.4 && G.Seasons.snowing() < 0.5) pool = pool.concat(S.rain, S.rain);
      if (wx && wx.v.fog > 0.4) pool = pool.concat(S.fog);
      if (G.SEASON_NOW && S[G.SEASON_NOW.id]) pool = pool.concat(S[G.SEASON_NOW.id]);   // what the season brings to mind
      if (wx && wx.rainbow > 0) pool = pool.concat(S.rainbow, S.rainbow, S.rainbow);
      if (dl < 0.35) pool = pool.concat(S.night);
      if (phase > 0.72 && phase < 0.95 && dl > 0.3) pool = pool.concat(S.morning);
      if (this.list.length >= 3) pool = pool.concat(S.friends);
      if (v.state === 'busy') pool.push(`${v.name} ${v.def.visit}. "Isn't it lovely?"`);
      let line = pick(pool);
      if (line === v.lastLine) line = pick(pool);
      v.lastLine = line;
      this.say(v, line, 4.5);
    },
  });
})();
