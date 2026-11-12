"""The Great Sun (Night 20): the Sun's Hearth stands beyond the farthest shrine;
its sockets burn for kindled shrines; with all four burning the altar wakes the
Sun: dawn, every hushling eased, colour everywhere (world.floor), the ending,
and play goes on. Saved as a structure.
Called from smoke_test.py with an open page that is already playing
(or run on its own: python3 tools/smoke_sun.py)."""
import pathlib, sys


def run(page, shots, errors):
    def check(name, js):
        result = page.evaluate(js)
        if result != "ok":
            errors.append(name + " failed: " + str(result))

    check("Sun data", """() => {
        const w = G.SUN_STAMP[0].length; let S = 0, A = 0;
        for (const row of G.SUN_STAMP) {
            if (row.length !== w) return 'stamp rows differ in length';
            for (const ch of row) { if (ch === 'S') S++; if (ch === 'A') A++; if (ch !== ' ' && ch !== '.' && !G.SUN_PIECES[ch]) return 'unknown letter ' + ch; }
        }
        if (S !== G.SHRINES.length || A !== 1) return 'the hearth needs a socket per shrine and 1 altar, has ' + S + ' and ' + A;
        for (const o of Object.values(G.SUN_PIECES)) if (!G.OBJECTS[o] || !G.OBJECT_SPRITES[o]) return 'piece without object or sprite: ' + o;
        if (!G.STRUCTURE_SPRITES.sunflame || !G.STRUCTURES.sunflame.travel) return 'the risen Sun has no sprite or is not a road stop';
        for (const s of ['sungather', 'sunrise']) if (!G.SFX[s]) return 'missing sound ' + s;
        const i = G.GOALS.findIndex(g => g.id === 'sunfind'), j = G.GOALS.findIndex(g => g.id === 'shrines4');
        if (i < j) return 'the Sun goals come before the shrines';
        if (!document.getElementById('ending')) return 'no ending page';
        return 'ok';
    }""")

    check("Sun placement", """() => {
        const w = G.state.world, sp = w.spawnSpot(), s = G.Sun.site(w), s2 = G.Sun.site(new G.World(w.seed));
        if (s.tx !== s2.tx || s.ty !== s2.ty) return 'it moved in a fresh world';
        const d = Math.hypot(s.tx - sp.tx, s.ty - sp.ty);
        if (d < 70) return 'too close to the start (' + Math.round(d) + ')';
        for (let y = s.y0; y < s.y0 + s.h; y++) for (let x = s.x0; x < s.x0 + s.w; x++) if (w.isWater(x, y)) return 'on water at ' + x + ',' + y;
        if (w.tileAt(s.tx, s.ty).obj !== 'sunaltar') return 'no altar in the middle';
        for (const k of s.sockets) if (w.tileAt(k.tx, k.ty).obj !== 'sunsocket') return 'no socket at ' + k.tx + ',' + k.ty;
        for (const sh of G.Shrines.list(w)) if (Math.hypot(sh.tx - s.tx, sh.ty - s.ty) < 20) return 'it stands on top of ' + sh.name;
        for (const r of G.Ruins.around(w, s.tx, s.ty, 1)) if (Math.hypot(r.tx - s.tx, r.ty - s.ty) < G.SUN.keepRuinsAway) return 'a ruin stands in it';
        return 'ok';
    }""")

    # a fresh start for this chapter: two shrines kindled, then walk up to the hearth by day
    page.evaluate("""() => {
        const s = G.state, w = s.world, p = s.player, site = G.Sun.site(w), list = G.Shrines.list(w);
        s.goalsDone = G.GOALS.map(g => g.id).filter(id => id !== 'sunfind' && id !== 'sunrise'); s.goalsHidden = false;
        delete s.stats.sun;
        for (const sh of list) { const st = w.structureAt(sh.tx, sh.ty); if (st && st.type === 'shrineflame') w.remove(sh.tx, sh.ty); }
        for (const sh of list.slice(0, 2)) w.build('shrineflame', sh.tx, sh.ty);
        s.stats.shrinesLit = 2; s.stats.shrines = s.stats.shrines || { found: {}, lit: [], bowls: 0 }; s.stats.shrines.lit = list.slice(0, 2).map(x => x.id);
        s.weather.set('clear', true);
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + 30; w.time = s.time;
        p.x = (site.tx + 0.5) * G.TILE; p.y = (site.ty + 3.6) * G.TILE; p.moveTarget = null; p.glow = 1;
        s.cam.x = p.x; s.cam.y = p.y - 50;
        s.hush.clear();
    }""")
    page.wait_for_timeout(1400)
    page.screenshot(path=str(shots / "68-sun-hearth-cold.png"))
    check("Hearth found early", """() => {
        const s = G.state;
        if (!(s.stats.sun && s.stats.sun.found)) return 'walking up did not find it';
        if (G.Sun.litSockets(s.world) !== 2) return 'sockets lit: ' + G.Sun.litSockets(s.world);
        return 'ok';
    }""")
    # the altar stays cold with only two embers
    page.evaluate("""() => { const s = G.state, site = G.Sun.site(s.world); s.player.x = (site.tx + 0.5) * G.TILE; s.player.y = (site.ty + 1.6) * G.TILE; }""")
    page.keyboard.press("e")
    page.wait_for_timeout(200)
    check("Altar cold", """() => {
        const s = G.state;
        if (s.sun.rising || G.Sun.isLit(s.world)) return 'the Sun rose with only two embers';
        if (!document.getElementById('toast').textContent.includes('2 of 4')) return 'no word about the embers: ' + document.getElementById('toast').textContent;
        return 'ok';
    }""")

    # the last two shrines kindle: the hearth is sensed, the sockets all burn
    page.evaluate("""() => {
        const s = G.state, w = s.world, list = G.Shrines.list(w), sp = w.spawnSpot();
        delete s.stats.sun.sensed;
        for (const sh of list.slice(2)) w.build('shrineflame', sh.tx, sh.ty);
        s.stats.shrinesLit = 4; s.stats.shrines.lit = list.map(x => x.id);
        s.player.x = (sp.tx + 0.5) * G.TILE; s.player.y = (sp.ty + 3.5) * G.TILE; s.cam.x = s.player.x; s.cam.y = s.player.y;
    }""")
    page.wait_for_timeout(1200)
    page.screenshot(path=str(shots / "69-sun-guide.png"))
    check("Hearth sensed", """() => {
        const s = G.state;
        if (!s.stats.sun.sensed) return 'four kindled shrines did not point the way';
        if (!G.Sun.guideTarget(s)) return 'no golden arrow';
        if (G.Sun.litSockets(s.world) !== 4) return 'sockets lit: ' + G.Sun.litSockets(s.world);
        return 'ok';
    }""")
    page.keyboard.press("m")
    page.wait_for_timeout(500)
    page.screenshot(path=str(shots / "70-sun-map.png"))
    page.keyboard.press("m")

    # at night, with hushlings about, wake the Sun
    page.evaluate("""() => {
        const s = G.state, w = s.world, site = G.Sun.site(w), p = s.player;
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + G.DAY_LENGTH * 0.45; w.time = s.time;
        p.x = (site.tx + 0.5) * G.TILE; p.y = (site.ty + 1.6) * G.TILE; p.moveTarget = null;
        s.cam.x = p.x; s.cam.y = p.y - 60;
        s.hush.list.push({ x: p.x + 80, y: p.y - 30, vx: 0, vy: 0, a: 1, mode: 'drift', e: 0, ph: 0, size: 1, seed: 0.5, ang: 0 });
        window._night = G.daylight(s.time); window._eased = (s.stats.hush && s.stats.hush.eased) || 0;
    }""")
    page.wait_for_timeout(700)
    page.screenshot(path=str(shots / "71-sun-altar-night.png"))
    page.keyboard.press("e")
    page.wait_for_function("() => G.state.sun.rising && G.state.sun.rising.t > 4", timeout=15000)
    page.screenshot(path=str(shots / "72-sun-gathering.png"))
    page.wait_for_function("() => G.state.sun.rising && G.state.sun.rising.t > G.SUN.dawnAt + 2.5", timeout=15000)
    page.screenshot(path=str(shots / "73-sunrise.png"))
    check("Dawn", """() => {
        const s = G.state;
        if (window._night > 0.3) return 'the test did not start at night';
        if (G.daylight(s.time) < 0.6) return 'the night did not turn to morning: ' + G.daylight(s.time).toFixed(2);
        if (!G.Sun.isLit(s.world)) return 'no Sun on the altar';
        if (s.hush.list.length) return 'hushlings still about';
        if (((s.stats.hush && s.stats.hush.eased) || 0) <= window._eased) return 'the hushling was not eased';
        return 'ok';
    }""")
    page.wait_for_function("() => document.getElementById('ending').classList.contains('open')", timeout=20000)
    page.wait_for_timeout(9500)   # the lines fade in
    page.screenshot(path=str(shots / "74-ending.png"))
    check("Ending", """() => {
        const t = document.getElementById('ending').textContent;
        if (!t.includes('Great Sun') || !t.includes('Keep shining')) return 'the ending page is missing words';
        if (!document.body.classList.contains('paused')) return 'the world is not paused';
        if (!/\\d+ days?/.test(document.getElementById('ending-journey').textContent)) return 'no journey numbers';
        return 'ok';
    }""")
    page.evaluate("() => document.getElementById('ending-go').click()")
    page.wait_for_timeout(1500)
    check("Sun risen", """() => {
        const s = G.state, w = s.world, sp = w.spawnSpot(), T = G.TILE;
        if (document.getElementById('ending').classList.contains('open')) return 'the ending did not close';
        if (!s.stats.sun.lit) return 'stats.sun.lit not set';
        if (Math.abs(w.floor - G.SUN.floor) > 0.001) return 'floor = ' + w.floor;
        // grey land far from any light now has some colour — but the hushlings still feel only real light
        const fx = (sp.tx - 300) * T, fy = (sp.ty - 300) * T;
        if (w.restoreAt(fx, fy, w.lights) < G.SUN.floor - 0.001) return 'far land is still grey';
        if (w.restoreAt(fx, fy, w.lights, true) > 0.01) return 'raw light is not raw';
        if (!s.goalsDone.includes('sunrise') && G.GOALS.find(g => g.id === 'sunrise').progress(s) < 1) return 'the goal is not done';
        return 'ok';
    }""")
    page.wait_for_timeout(1500)
    page.screenshot(path=str(shots / "75-sun-after.png"))

    # far away in the grey under the risen Sun, by day: soft colour and shafts of light
    page.evaluate("""() => {
        const s = G.state, w = s.world, sp = w.spawnSpot(), p = s.player;
        let spot = null;
        for (let r = 50; r < 200 && !spot; r += 4) for (let a = 0; a < 16; a++) {
            const tx = Math.round(sp.tx + Math.cos(a * 0.39 + 2) * r), ty = Math.round(sp.ty + Math.sin(a * 0.39 + 2) * r);
            if (w.tileAt(tx, ty).type === 'grass' && !w.isSolid(tx, ty) && w.restoreAt((tx + 0.5) * 32, (ty + 0.5) * 32, w.lights, true) === 0) { spot = { tx, ty }; break; }
        }
        p.x = (spot.tx + 0.5) * 32; p.y = (spot.ty + 0.5) * 32; s.cam.x = p.x; s.cam.y = p.y;
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + 20; w.time = s.time;
    }""")
    page.wait_for_timeout(1300)
    page.screenshot(path=str(shots / "76-sun-world.png"))

    check("Sun saved", """() => {
        G.Save.write(G.state);
        const d = G.Save.read();
        if (!d.structures.some(x => x[0] === 'sunflame')) return 'the risen Sun was not saved';
        const w = new G.World(d.seed); w.loadStructures(d.structures);
        if (!G.Sun.isLit(w) || Math.abs(w.floor - G.SUN.floor) > 0.001) return 'a reloaded world forgot the Sun';
        return 'ok';
    }""")


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
    print("\n".join(errs) if errs else "sun ok")
    sys.exit(1 if errs else 0)
