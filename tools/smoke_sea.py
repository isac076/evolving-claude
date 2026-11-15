"""Across the water (Night 23): the leaf boat. Without a boat water is a wall;
with one the spirit sails in, leaving a wake; deep water, pearl beds, a Sea
lantern on the water, a whale that surfaces and blows, moon jellies at night,
and stepping ashore on a far shore.
Called from smoke_test.py with an open page that is already playing
(or run on its own: python3 tools/smoke_sea.py)."""
import pathlib, sys

SEA_GOALS = "['boat', 'sail', 'pearl', 'buoy', 'cross', 'jelly', 'whale']"


def run(page, shots, errors):
    def check(name, js):
        result = page.evaluate(js)
        if result != "ok":
            errors.append(name + " failed: " + str(result))

    check("Sea data", """() => {
        for (const o of ['lilypad', 'driftwood', 'pearlbed']) if (!G.OBJECT_SPRITES[o]) return 'no sprite for ' + o;
        for (const o of ['lilypad', 'pearlbed']) if (!G.REGROW_SPRITES[o]) return 'no regrow sprite for ' + o;
        if (!G.STRUCTURE_SPRITES.buoy) return 'no sea lantern sprite';
        for (const k of ['whale', 'jelly']) if (!G.CREATURE_SPRITES[k] || !G.Creatures.prototype[k]) return 'no ' + k;
        for (const s of ['launch', 'ashore', 'deepsea', 'whale', 'pearl', 'lily', 'buoy']) if (!G.SFX[s]) return 'missing sound ' + s;
        if (!G.STEP_SOUNDS.paddle) return 'no paddle strokes';
        if (!G.STRUCTURES.buoy.travel) return 'the sea lantern is not on the lantern roads';
        const i = G.GOALS.findIndex(g => g.id === 'boat'), r = G.GOALS.findIndex(g => g.id === 'aurora');
        if (i !== r + 1) return 'the sea chapter is not right after the peaks';
        if (!G.RECIPES.find(r => r.id === 'boat' && r.at === 'workbench')) return 'the boat is not made at a workbench';
        return 'ok';
    }""")

    # find a shore near the start: open land with two tiles of plain water to its east
    check("Find a shore", """() => {
        const s = G.state, w = s.world, sp = w.spawnSpot();
        for (let r = 4; r < 160; r++) for (let a = 0; a < 48; a++) {
            const tx = Math.round(sp.tx + Math.cos(a / 48 * 6.283) * r), ty = Math.round(sp.ty + Math.sin(a / 48 * 6.283) * r);
            if (w.isWater(tx, ty) || w.isSolid(tx, ty) || w.structureAt(tx, ty)) continue;
            let ok = true;
            for (let i = 1; i <= 3 && ok; i++) for (const dy of [-1, 0, 1]) if (!w.isWater(tx + i, ty + dy) || w.structureAt(tx + i, ty + dy)) ok = false;
            if (w.isSolid(tx, ty - 1) || w.isSolid(tx, ty + 1)) ok = false;
            if (!ok) continue;
            window._shore = { tx, ty };
            return 'ok';
        }
        return 'no shore near the start';
    }""")
    page.evaluate("""() => {
        const s = G.state, sh = window._shore;
        s.goalsDone = G.GOALS.map(g => g.id).filter(id => !""" + SEA_GOALS + """.includes(id));
        s.goalsHidden = false;
        delete s.stats.sea; delete s.inv.boat; if (s.stats.met) { delete s.stats.met.whale; delete s.stats.met.jelly; }
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + 20; s.world.time = s.time; s.weather.set('clear', true);
        s.player.x = (sh.tx + 0.5) * 32; s.player.y = (sh.ty + 0.5) * 32; s.player.vx = s.player.vy = 0; s.player.moveTarget = null;
        s.cam.x = s.player.x; s.cam.y = s.player.y;
    }""")
    page.keyboard.down("d")
    page.wait_for_timeout(700)
    page.keyboard.up("d")
    check("Water is a wall without a boat", """() => {
        const p = G.state.player;
        if (p.afloat || G.state.world.isWater(p.tx, p.ty)) return 'walked into the water with no boat';
        return 'ok';
    }""")

    # with a boat: walk east into the water and sail
    page.evaluate("() => { G.state.inv.boat = 1; G.state.inv.wood = (G.state.inv.wood || 0) + 10; G.state.inv.petal = (G.state.inv.petal || 0) + 5; }")
    page.keyboard.down("d")
    page.wait_for_timeout(1100)
    page.keyboard.up("d")
    page.wait_for_timeout(150)
    page.screenshot(path=str(shots / "82-sea-launch.png"))
    check("Sailing", """() => {
        const s = G.state, p = s.player, S = s.stats.sea;
        if (!p.afloat) return 'not afloat at ' + p.tx + ',' + p.ty + ' (' + s.world.tileAt(p.tx, p.ty).type + ')';
        if (!S || S.launched !== 1) return 'launch not counted: ' + JSON.stringify(S);
        if (!s.sail.wake.length) return 'no wake behind the boat';
        if (!G.GOALS.find(g => g.id === 'boat').progress(s)) return 'the boat goal does not see the boat';
        return 'ok';
    }""")
    check("Hint points to the deep", """() => {
        const t = G.Sailing.hint(G.state);
        return /Deep water lies about \\d+ steps|deep sea is right here/.test(t) ? 'ok' : 'goal hint is odd: ' + t;
    }""")

    # out to the deep water: find a deep tile with plenty of deep sea around it
    check("Find the deep sea", """() => {
        const s = G.state, w = s.world, sh = window._shore;
        for (let r = 0; r < 220; r += 2) for (let a = 0; a < 64; a++) {
            const tx = Math.round(sh.tx + Math.cos(a / 64 * 6.283) * r), ty = Math.round(sh.ty + Math.sin(a / 64 * 6.283) * r);
            let ok = true;
            for (let y = -6; y <= 6 && ok; y++) for (let x = -9; x <= 9 && ok; x++) if (w.tileAt(tx + x, ty + y).type !== 'deep' || w.structureAt(tx + x, ty + y)) ok = false;
            if (!ok) continue;
            window._deep = { tx, ty };
            s.player.x = (tx + 0.5) * 32; s.player.y = (ty + 0.5) * 32; s.player.vx = s.player.vy = 0; s.cam.x = s.player.x; s.cam.y = s.player.y;
            return 'ok';
        }
        return 'no open deep sea within reach';
    }""")
    page.keyboard.down("a")
    page.wait_for_timeout(500)
    page.keyboard.up("a")
    page.wait_for_timeout(200)
    check("Reached the deep", """() => {
        const S = G.state.stats.sea;
        if (!S.deep) return 'deep water not noticed';
        if (!G.state.player.afloat) return 'not afloat at sea';
        return 'ok';
    }""")

    # a pearl bed: sail beside one and press E
    check("Find a pearl bed", """() => {
        const s = G.state, w = s.world, d = window._deep;
        for (let r = 0; r < 90; r++) for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
            if (Math.max(Math.abs(x), Math.abs(y)) !== r) continue;
            const tx = d.tx + x, ty = d.ty + y;
            if (w.objectAt(tx, ty) !== 'pearlbed' || !w.isWater(tx, ty + 1)) continue;
            for (let j = -2; j <= 3; j++) for (let i = -2; i <= 2; i++) if ((i || j) && w.objectAt(tx + i, ty + j)) w.harvest(tx + i, ty + j);
            s.player.x = (tx + 0.5) * 32; s.player.y = (ty + 1.3) * 32; s.player.vx = s.player.vy = 0; s.cam.x = s.player.x; s.cam.y = s.player.y;
            window._pearl = { tx, ty };
            return 'ok';
        }
        return 'no pearl bed on the water';
    }""")
    page.wait_for_timeout(150)
    page.keyboard.press("e")
    page.wait_for_timeout(300)
    check("Got a pearl", """() => (G.state.stats.got.pearl || 0) > 0 ? 'ok' : 'pressing E gave no pearl: ' + JSON.stringify(G.state.inv)""")

    # a Sea lantern out in the deep: colour comes back to the water, and it is a road stop
    page.evaluate("""() => {
        const s = G.state, w = s.world, d = window._deep;
        s.inv.pearl = 6; s.inv.wood = 10; s.inv.petal = 5;
        s.player.x = (d.tx + 0.5) * 32; s.player.y = (d.ty + 2.5) * 32; s.player.vx = s.player.vy = 0; s.cam.x = s.player.x; s.cam.y = s.player.y;
        if (w.canBuild('buoy', d.tx, d.ty)) w.build('buoy', d.tx, d.ty);
        if (w.canBuild('buoy', d.tx + 7, d.ty - 2)) w.build('buoy', d.tx + 7, d.ty - 2);
    }""")
    page.wait_for_timeout(400)
    check("Sea lantern", """() => {
        const s = G.state, w = s.world, d = window._deep, L = w.lights.find(L => L.type === 'buoy');
        if (!L) return 'no sea lantern light';
        if (L.hue !== G.STRUCTURES.buoy.lightHue) return 'wrong light colour';
        if (!s.travel.stops().some(x => x.type === 'buoy')) return 'the sea lantern is not a road stop';
        if (w.restoreAt((d.tx + 3.5) * 32, (d.ty + 0.5) * 32, w.lights) < 0.9) return 'no colour on the water around it';
        if (w.canBuild('buoy', d.tx + 30, d.ty + 30) && w.canBuild('buoy', window._shore.tx, window._shore.ty)) return 'a sea lantern can be built on land';
        return 'ok';
    }""")
    # a whale rises beside the boat
    page.evaluate("""() => {
        const s = G.state, d = window._deep, life = s.creatures;
        life.list = life.list.filter(c => c.kind !== 'whale');
        const c = life.spawn('whale', (d.tx + 3.5) * 32, (d.ty + 1.2) * 32);
        c.a = 1; c.dir = 0.2; life.whale(c, 0.01, s.world, s.player, 0, 0, 999); c.state = 'rise'; c.surf = 0.6;
        window._whale = c;
    }""")
    page.wait_for_timeout(1700)
    page.screenshot(path=str(shots / "83-sea-whale.png"))
    check("Whale", """() => {
        const s = G.state, c = window._whale;
        if (!s.creatures.list.includes(c)) return 'the whale vanished';
        if (c.state !== 'breathe' && c.state !== 'sink') return 'the whale never surfaced: ' + c.state + ' ' + c.surf;
        if (!s.stats.met.whale) return 'never met the whale';
        if (!s.creatures.suits(G.CREATURES.whale, s.world, (window._deep.tx + 2.5) * 32, (window._deep.ty + 0.5) * 32)) return 'coloured deep sea does not suit whales';
        return 'ok';
    }""")

    # night on the water: moon jellies glow
    page.evaluate("""() => {
        const s = G.state;
        s.time = Math.floor(s.time / G.DAY_LENGTH + 1) * G.DAY_LENGTH + G.DAY_LENGTH * 0.5; s.world.time = s.time; s.weather.set('clear', true);
        s.player.x += 6 * 32; s.cam.x = s.player.x;
    }""")
    page.wait_for_timeout(5000)
    page.evaluate("""() => {
        const s = G.state, c = s.creatures.list.find(c => c.kind === 'jelly');
        if (c) { s.player.x = c.x + 60; s.player.y = c.y; s.cam.x = s.player.x; s.cam.y = s.player.y; }
    }""")
    page.wait_for_timeout(700)
    page.screenshot(path=str(shots / "84-sea-night.png"))
    check("Moon jellies", """() => {
        const s = G.state, n = s.creatures.list.filter(c => c.kind === 'jelly').length;
        if (!n) return 'no moon jellies at night';
        if (!s.stats.met.jelly) return 'never met a moon jelly';
        return 'ok';
    }""")

    # sailing home to a far shore counts as a crossing; the boat folds away on land
    page.evaluate("""() => {
        const s = G.state, sh = window._shore;
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + 30; s.world.time = s.time;
        s.player.x = (sh.tx + 1.6) * 32; s.player.y = (sh.ty + 0.5) * 32; s.player.vx = s.player.vy = 0; s.cam.x = s.player.x; s.cam.y = s.player.y;
        s.sail.from = { tx: sh.tx + 60, ty: sh.ty };
    }""")
    page.wait_for_timeout(100)
    page.keyboard.down("a")
    page.wait_for_timeout(700)
    page.keyboard.up("a")
    check("Crossed to a far shore", """() => {
        const s = G.state, p = s.player;
        if (p.afloat) return 'still afloat on land at ' + p.tx + ',' + p.ty;
        if (!s.stats.sea.crossed) return 'the crossing was not counted: ' + JSON.stringify(s.stats.sea);
        return 'ok';
    }""")
    check("Bridges still go over lily pads", """() => {
        const w = G.state.world, sp = w.spawnSpot();
        for (let r = 0; r < 200; r++) for (let x = -r; x <= r; x++) for (const y of [-r, r]) {
            const tx = sp.tx + x, ty = sp.ty + y;
            if (w.objectAt(tx, ty) === 'lilypad') return w.canBuild('bridge', tx, ty) ? 'ok' : 'a lily pad blocks a bridge';
        }
        return 'no lily pads anywhere';
    }""")
    page.wait_for_timeout(500)
    page.keyboard.press("m")
    page.wait_for_timeout(600)
    page.screenshot(path=str(shots / "85-sea-map.png"))
    page.keyboard.press("m")
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
    print("\n".join(errs) if errs else "sea ok")
    sys.exit(1 if errs else 0)
