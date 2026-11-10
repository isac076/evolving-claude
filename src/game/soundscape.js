// G.Soundscape — feeds the music (G.Music) and the ambience (G.Ambience) every frame
// with what is around the camera: how coloured the land is, the time of day, the
// weather, the season, nearby water, friends — and a village festival (Night 13).
// (Moved out of main.js on Night 13 to keep it small.)
window.G = window.G || {};

G.Soundscape = class {
  constructor(state, settings) {
    this.state = state; this.settings = settings;
    this.waterNear = 0; this.waterTimer = 0;   // how much water is near, 0..1 (sampled a few times a second)
  }

  active() { return this.state.running && !this.settings.isOpen; }

  music(realDt) {
    const state = this.state;
    if (!state.world) return;
    const w = state.world, x = state.cam.x, y = state.cam.y, p = state.running ? state.player : null;
    const tx = Math.floor((p ? p.x : x) / G.TILE), ty = Math.floor((p ? p.y : y) / G.TILE);
    const st = w.structureAt(tx, ty), wv = state.weather.v;
    const fest = p && state.village ? state.village.festivalNear(p) : null;
    G.Music.update(realDt, {
      restore: w.restoreAt(x, y, w.lights), day: G.daylight(state.time), phase: (state.time % G.DAY_LENGTH) / G.DAY_LENGTH,
      rain: wv.rain * (1 - G.Seasons.snowing()), fog: wv.fog, ground: this.ground(st, w.tileAt(tx, ty).type),
      player: p, friends: state.villagers ? state.villagers.list : [], active: this.active(), stats: state.stats,
      festival: fest ? fest.vil.name || 'the village' : null,
    });
  }

  ground(st, type) {
    if (st && G.STRUCTURES[st.type].bridge) return 'water';   // bridges and stepping stones
    return G.SEASON_NOW.tiles[type].snow > 0.5 ? 'snow' : type;   // snowy land rings like glass
  }

  ambience(dt) {
    const state = this.state;
    if (!G.Sound.ctx || !state.world) return;
    const x = state.cam.x, y = state.cam.y, w = state.world;
    this.waterTimer -= dt;
    if (this.waterTimer <= 0) {
      this.waterTimer = 0.3;
      const tx = Math.floor(x / G.TILE), ty = Math.floor(y / G.TILE);
      let n = 0;
      for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) if (w.isWater(tx + dx, ty + dy)) n++;
      this.waterNear = Math.min(1, n / 40);
    }
    const wv = state.weather.v;
    const sn = G.SEASON_NOW, snow = G.Seasons.snowing();   // snow falls silently; the seasons change who sings
    G.Ambience.update(dt, { restore: w.restoreAt(x, y, w.lights), day: G.daylight(state.time), water: this.waterNear, active: this.active(),
      rain: wv.rain * (1 - snow), snow: wv.rain * snow, wind: G.windNow || 0, fog: wv.fog, birds: sn.birds, crickets: sn.crickets });
  }
};
