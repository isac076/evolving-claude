"""The turning seasons (Night 12): blossom, summer, autumn leaves and snow.
Called from smoke_test.py with an open page that is already playing."""


def run(page, shots, errors):
    def check(name, js, arg=None):
        result = page.evaluate(js, arg) if arg is not None else page.evaluate(js)
        if result != "ok":
            errors.append(name + " failed: " + str(result))

    check("Season data", """() => {
        if (G.SEASONS.length !== 4) return 'there should be four seasons';
        for (const s of G.SEASONS) {
            if (!s.name || !s.icon || !s.say || !s.first) return s.id + ' is missing words';
            for (const k of ['snow', 'autumn', 'bare', 'blossom', 'leafL', 'grow', 'birds', 'crickets', 'fireflies'])
                if (typeof s[k] !== 'number') return s.id + ' has no ' + k;
            for (const t in s.ground) if (!G.TILES[t]) return s.id + ' colours an unknown ground ' + t;
            for (const w in s.weather || {}) if (!G.WEATHER[w]) return s.id + ' favours unknown weather ' + w;
            if (s.tint.length !== 4) return s.id + ' tint needs r, g, b, alpha';
        }
        return 'ok';
    }""")

    # the year follows the clock, and every blended number stays between its two seasons
    check("Season clock", """() => {
        const D = G.DAY_LENGTH * G.SEASON.days, S = G.Seasons;
        if (S.phase(0).i !== 0 || S.phase(0).k !== 0) return 'a new world should begin in plain spring';
        const want = ['spring', 'summer', 'autumn', 'winter', 'spring'];
        for (let i = 0; i < 5; i++) {
            const at = S.at(i * D + D * 0.5);
            if (at.id !== want[i]) return 'season ' + i + ' is ' + at.id;
        }
        let last = null;
        for (let t = D * 2.8; t < D * 3.2; t += 7) {   // autumn into winter: snow comes in gently
            const a = S.at(t);
            if (a.snow < 0 || a.snow > 1) return 'snow out of range';
            if (last !== null && a.snow + 1e-9 < last) return 'snow went backwards while winter arrived';
            if (last !== null && a.snow - last > 0.2) return 'snow jumped from ' + last + ' to ' + a.snow;
            last = a.snow;
        }
        if (last < 0.99) return 'winter should be fully snowy, got ' + last;
        if (S.at(D * 3.5).tiles.grass.l < 70) return 'winter grass should be white with snow';
        if (Math.abs(S.at(D * 0.5).tiles.water.h - G.TILES.water.h) > 1) return 'spring should not change the water';
        return 'ok';
    }""")

    # set the scene: a bright spot by the Heart Stone with a friend, at noon
    page.evaluate("""() => {
        const s = G.state, w = s.world, h = w.lights[0];
        s.player.x = h.x + 40; s.player.y = h.y + 70; s.cam.x = s.player.x; s.cam.y = s.player.y;
        s.weather.set('clear', true);
    }""")

    names = ["spring", "summer", "autumn", "winter"]
    for i, name in enumerate(names):
        # noon on the second day of the season
        page.evaluate("(i) => { G.state.time = (i * G.SEASON.days + 1) * G.DAY_LENGTH; G.state.weather.set('clear', true); }", i)
        page.wait_for_timeout(900)
        got = page.evaluate("() => [G.SEASON_NOW.id, document.getElementById('season').textContent]")
        if got[0] != name or name.capitalize() not in got[1]:
            errors.append("Season HUD failed: expected " + name + ", got " + str(got))
        page.screenshot(path=str(shots / ("%d-%s.png" % (33 + i, name))))

    check("Season turns", """() => {
        const st = G.state.stats.seasons;
        if (!st || !st.seen.spring || !st.seen.winter) return 'seasons seen: ' + JSON.stringify(st);
        if (st.turns < 3) return 'only ' + st.turns + ' turns of the year noticed';
        return 'ok';
    }""")

    # winter: rain falls as snow, butterflies and frogs stay away, gardens grow slowly, friends wear scarves
    check("Winter", """() => {
        const s = G.state;
        s.weather.set('rain', true);
        if (G.Seasons.snowing() < 0.9) return 'it should be snowing, not raining';
        if (s.weather.name() !== 'Snowfall') return 'weather is called ' + s.weather.name();
        if (G.Seasons.allows(G.CREATURES.butterfly) || G.Seasons.allows(G.CREATURES.frog)) return 'butterflies or frogs in winter';
        if (!G.Seasons.allows(G.CREATURES.rabbit)) return 'rabbits should stay all year';
        if (G.SEASON_NOW.grow >= 0.5) return 'gardens grow too fast in winter';
        return 'ok';
    }""")
    page.keyboard.down("s"); page.wait_for_timeout(900); page.keyboard.up("s")
    page.keyboard.down("d"); page.wait_for_timeout(700); page.keyboard.up("d")
    page.wait_for_timeout(600)
    if page.evaluate("() => G.Seasons.prints.length") < 3:
        errors.append("Footprints failed: the spirit left no prints in the snow")
    page.screenshot(path=str(shots / "37-snowfall.png"))

    page.evaluate("() => { G.state.time = (3 * G.SEASON.days + 1.5) * G.DAY_LENGTH; G.state.weather.set('clear', true); }")
    page.wait_for_timeout(900)
    page.screenshot(path=str(shots / "38-winter-night.png"))

    # autumn with a breeze: falling leaves in their autumn colours
    page.evaluate("() => { G.state.time = (2 * G.SEASON.days + 1.05) * G.DAY_LENGTH; G.state.weather.set('breezy', true); }")
    page.wait_for_timeout(2500)
    check("Autumn leaves", """() => {
        if (G.SEASON_NOW.id !== 'autumn') return 'not autumn';
        if (!G.SEASON_NOW.drift || G.SEASON_NOW.drift.kind !== 'leaf') return 'autumn should drop leaves';
        return 'ok';
    }""")
    page.screenshot(path=str(shots / "39-autumn-breeze.png"))

    # an old save (no season stats) still loads, and the season comes from its clock
    check("Old save seasons", """() => {
        const d = G.Save.read();
        if (!d) return 'no save to test with';
        delete d.stats.seasons; d.time = G.DAY_LENGTH * G.SEASON.days * 1.5;
        G.Save.upgrade && G.Save.upgrade(d);
        const at = G.Seasons.at(d.time);
        return at.id === 'summer' ? 'ok' : 'old save season is ' + at.id;
    }""")

    # back to spring for any later tests
    page.evaluate("() => { G.state.time = G.DAY_LENGTH * 1; G.state.weather.set('clear', true); }")
    page.wait_for_timeout(300)
