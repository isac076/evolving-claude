"""The Snowy Peaks (Night 22): the second new biome. Every world has a snowy peak a
walk from the start; walking onto the snow finds it; ice spires give ice for an Ice
lantern, snowdrifts give snow for a Snow spirit; snow foxes come out in coloured
snow; on clear nights the northern lights shine over the peaks.
Called from smoke_test.py with an open page that is already playing
(or run on its own: python3 tools/smoke_peaks.py)."""
import pathlib, sys

PEAK_GOALS = "['peakfind', 'ice', 'icelantern', 'snowspirit', 'fox', 'aurora']"


def run(page, shots, errors):
    def check(name, js):
        result = page.evaluate(js)
        if result != "ok":
            errors.append(name + " failed: " + str(result))

    check("Peak data", """() => {
        for (const o of ['firpine', 'snowdrift', 'icespire', 'snowbell']) if (!G.OBJECT_SPRITES[o] || !G.REGROW_SPRITES[o]) return 'no sprite for ' + o;
        for (const st of ['icelantern', 'snowspirit']) if (!G.STRUCTURE_SPRITES[st]) return 'no sprite for ' + st;
        if (!G.CREATURE_SPRITES.fox) return 'no snow fox';
        if (!G.SEASON_NOW.tiles.frost) return 'the seasons do not know the snowfield';
        for (const s of ['ice', 'snowball', 'snowbell', 'peaks', 'aurora']) if (!G.SFX[s]) return 'missing sound ' + s;
        if (!G.STRUCTURES.icelantern.travel) return 'the ice lantern is not on the lantern roads';
        if (!G.MUSIC_PLACES.frost) return 'the peaks have no music';
        const i = G.GOALS.findIndex(g => g.id === 'peakfind'), r = G.GOALS.findIndex(g => g.id === 'banner');
        if (i !== r + 1) return 'the peaks chapter is not right after the riverbanks';
        return 'ok';
    }""")

    # the start keeps its shape (base ground has no peaks), and the first peak is a real snowfield a walk away
    check("Peaks leave the start alone", """() => {
        const w = G.state.world, sp = w.spawnSpot();
        for (let y = -30; y <= 30; y += 2) for (let x = -30; x <= 30; x += 2)
            if (w.groundType(sp.tx + x, sp.ty + y) === 'frost') return 'snow right by the start at ' + x + ',' + y;
        if (w.groundType(sp.tx, sp.ty, true) !== 'grass') return 'the start is not on grass';
        const c = G.Peaks.first(w), d = Math.hypot(c.tx - sp.tx, c.ty - sp.ty);
        if (d < 75 || d > 100) return 'first peak at an odd distance: ' + d;
        let n = 0;
        for (let y = -14; y <= 14; y++) for (let x = -14; x <= 14; x++) if (w.tileAt(c.tx + x, c.ty + y).type === 'frost') n++;
        if (n < 250) return 'the first peak is tiny: ' + n + ' tiles';
        return 'ok';
    }""")

    # stand off to the south first: the hint gives a direction
    page.evaluate("""() => {
        const s = G.state, w = s.world, c = G.Peaks.first(w);
        s.goalsDone = G.GOALS.map(g => g.id).filter(id => !""" + PEAK_GOALS + """.includes(id));
        s.goalsHidden = false;
        delete s.stats.peaks; if (s.stats.met) delete s.stats.met.fox;
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + 10; w.time = s.time; s.weather.set('clear', true);
        s.player.x = (c.tx + 0.5) * 32; s.player.y = (c.ty + 45.5) * 32; s.player.moveTarget = null; s.cam.x = s.player.x; s.cam.y = s.player.y;
    }""")
    page.wait_for_timeout(700)
    check("Hint points the way", """() => {
        const t = document.getElementById('goals').textContent;
        return /steps north/.test(t) ? 'ok' : 'goal hint has no direction: ' + t;
    }""")
    page.evaluate("""() => {
        const s = G.state, w = s.world, c = G.Peaks.first(w);
        let spot = null;   // an open snow tile near the middle
        for (let r = 0; r < 14 && !spot; r++) for (let a = 0; a < 16 && !spot; a++) {
            const tx = Math.round(c.tx + Math.cos(a / 16 * 6.283) * r), ty = Math.round(c.ty + Math.sin(a / 16 * 6.283) * r);
            if (w.tileAt(tx, ty).type === 'frost' && !w.isSolid(tx, ty) && !w.structureAt(tx, ty)) spot = { tx, ty };
        }
        s.player.x = (spot.tx + 0.5) * 32; s.player.y = (spot.ty + 0.5) * 32; s.player.moveTarget = null;
        s.cam.x = s.player.x; s.cam.y = s.player.y;
        window._peakSpot = spot;
    }""")
    page.wait_for_timeout(1500)
    page.screenshot(path=str(shots / "78-peaks-found.png"))
    check("Peak found", """() => {
        const P = G.state.stats.peaks;
        if (!P || !P.at.first || P.found !== 1) return 'not found: ' + JSON.stringify(P);
        if (!document.getElementById('place-name').textContent.includes(G.PEAK_NAMES[0])) return 'no place caption';
        if (G.PeakFX.flakes.length < 10) return 'no snow drifting over the peaks: ' + G.PeakFX.flakes.length;
        return 'ok';
    }""")

    # gather ice from a spire and snow from a drift
    for obj, item in (("icespire", "ice"), ("snowdrift", "snow")):
        check("Find " + obj, """() => {
            const s = G.state, w = s.world, sp = window._peakSpot;
            for (let r = 0; r < 14; r++) for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
                if (w.objectAt(sp.tx + x, sp.ty + y) !== '""" + obj + """') continue;
                const tx = sp.tx + x, ty = sp.ty + y + 1;
                if (w.isSolid(tx, ty)) continue;
                // clear the things right around it, so E picks this one
                for (let j = -2; j <= 3; j++) for (let i = -2; i <= 2; i++) if ((i || j) && w.objectAt(sp.tx + x + i, sp.ty + y + j)) w.harvest(sp.tx + x + i, sp.ty + y + j);
                s.player.x = (tx + 0.5) * 32; s.player.y = (ty + 0.3) * 32; s.player.moveTarget = null;
                return 'ok';
            }
            return 'no """ + obj + """ on the peak';
        }""")
        page.keyboard.press("e")
        page.wait_for_timeout(300)
        check("Got " + item, "() => (G.state.stats.got." + item + " || 0) > 0 ? 'ok' : 'pressing E gave no " + item + ": ' + JSON.stringify(G.state.inv)")

    # an Ice lantern and a Snow spirit: colour comes back to the snow, and foxes come out
    page.evaluate("""() => {
        const s = G.state, w = s.world, sp = window._peakSpot;
        s.inv.ice = 10; s.inv.stone = 10; s.inv.petal = 5; s.inv.snow = 6; s.inv.wood = 5;
        s.player.x = (sp.tx + 0.5) * 32; s.player.y = (sp.ty + 0.5) * 32; s.cam.x = s.player.x; s.cam.y = s.player.y;
        const put = (type) => {
            for (let r = 1; r < 6; r++) for (const [dx, dy] of [[r, -1], [-r, -1], [0, -r], [r, 0], [-r, 0], [r, -r], [-r, -r]])
                if (w.canBuild(type, sp.tx + dx, sp.ty + dy)) { w.build(type, sp.tx + dx, sp.ty + dy); return [sp.tx + dx, sp.ty + dy]; }
            return null;
        };
        window._iceLamp = put('icelantern'); window._snowman = put('snowspirit');
    }""")
    page.wait_for_timeout(3500)
    page.screenshot(path=str(shots / "79-peaks-day.png"))
    check("Ice lantern", """() => {
        const s = G.state, L = s.world.lights.find(L => L.type === 'icelantern');
        if (!L) return 'no ice lantern light';
        if (L.hue !== G.STRUCTURES.icelantern.lightHue) return 'the ice lantern light is the wrong colour';
        if (!s.travel.stops().some(x => x.type === 'icelantern')) return 'the ice lantern is not a lantern-road stop';
        if (!window._snowman || s.world.count('snowspirit') < 1) return 'could not build a snow spirit';
        return 'ok';
    }""")
    page.wait_for_timeout(2500)
    check("Snow foxes", """() => G.state.creatures.list.some(c => c.kind === 'fox') ? 'ok' : 'no snow fox on the coloured peak'""")
    page.evaluate("""() => {
        const s = G.state, c = s.creatures.list.find(c => c.kind === 'fox');
        if (c) { s.player.x = c.x + 90; s.player.y = c.y; }
    }""")
    page.wait_for_timeout(400)
    check("Met a fox", """() => G.state.stats.met.fox ? 'ok' : 'never met a snow fox'""")
    check("Footprints in the snow", """() => {
        const s = G.state, sp = window._peakSpot, n = G.Seasons.prints.length;
        G.Seasons.step(s.world, (sp.tx + 0.5) * 32, (sp.ty + 0.5) * 32, false);
        return G.Seasons.prints.length > n || G.Seasons.prints.length >= 80 ? 'ok' : 'no footprints on the snowfield';
    }""")

    # a clear night on the peak: the northern lights
    page.evaluate("""() => {
        const s = G.state, sp = window._peakSpot;
        s.time = Math.floor(s.time / G.DAY_LENGTH + 1) * G.DAY_LENGTH + G.DAY_LENGTH * 0.5; s.world.time = s.time; s.weather.set('clear', true);
        s.player.x = (sp.tx + 0.5) * 32; s.player.y = (sp.ty + 0.5) * 32; s.player.moveTarget = null; s.cam.x = s.player.x; s.cam.y = s.player.y;
    }""")
    page.wait_for_timeout(6000)
    page.screenshot(path=str(shots / "80-peaks-aurora.png"))
    check("Northern lights", """() => {
        const s = G.state;
        if (!(s.stats.peaks.aurora)) return 'the northern lights were never seen (sky ' + s.peaks.sky.toFixed(2) + ')';
        if (G.PeakFX.aurora < 0.25) return 'the northern lights are too faint: ' + G.PeakFX.aurora.toFixed(2);
        return 'ok';
    }""")
    # and they fade by day
    page.evaluate("""() => { const s = G.state; s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + 60; s.world.time = s.time; }""")
    page.wait_for_timeout(1300)
    check("No northern lights by day", """() => G.state.peaks.sky < 0.05 ? 'ok' : 'still shining by day: ' + G.state.peaks.sky""")

    page.keyboard.press("m")
    page.wait_for_timeout(600)
    page.screenshot(path=str(shots / "81-peaks-map.png"))
    page.keyboard.press("m")
    page.keyboard.press("j")
    page.wait_for_timeout(300)
    page.evaluate("() => document.querySelector('.journal-tabs button[data-tab=places]') && document.querySelector('.journal-tabs button[data-tab=places]').click()")
    page.wait_for_timeout(300)
    check("Journal lists the peak", """() => document.getElementById('journal').textContent.includes(G.PEAK_NAMES[0]) ? 'ok' : 'no peak on the Places page'""")
    page.keyboard.press("j")
    page.wait_for_timeout(200)


if __name__ == "__main__":
    from playwright.sync_api import sync_playwright
    ROOT = pathlib.Path(__file__).resolve().parent.parent
    SHOTS = ROOT / "tools" / "screenshots"
    errs = []
    with sync_playwright() as p:
        b = p.chromium.launch()
        page = b.new_page(viewport={"width": 1100, "height": 680})
        page.on("pageerror", lambda e: errs.append(str(e)))
        page.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        page.goto((ROOT / "index.html").as_uri() + "?autostart")
        page.wait_for_timeout(600)
        run(page, SHOTS, errs)
        b.close()
    print("\n".join(errs) if errs else "peaks ok")
    sys.exit(1 if errs else 0)
