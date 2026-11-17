"""The Amber Dunes (Night 25): the third new biome. Every world has dunes a walk from
the start with an oasis in their heart; walking onto the sand finds them; sunstones
and soft sand make an Amber lantern and a Sand castle; sand geckos come out in
coloured dunes; tumbleweeds roll by; on clear nights falling stars streak over the sand.
Called from smoke_test.py with an open page that is already playing
(or run on its own: python3 tools/smoke_dunes.py)."""
import pathlib, sys

DUNE_GOALS = "['dunefind', 'oasis', 'sunstone', 'amberlantern', 'sandcastle', 'gecko', 'fallingstar']"


def run(page, shots, errors):
    def check(name, js):
        result = page.evaluate(js)
        if result != "ok":
            errors.append(name + " failed: " + str(result))

    check("Dune data", """() => {
        for (const o of ['cactus', 'dunegrass', 'sandheap', 'sunrock', 'palm']) if (!G.OBJECT_SPRITES[o] || !G.REGROW_SPRITES[o]) return 'no sprite for ' + o;
        for (const st of ['amberlantern', 'sandcastle']) if (!G.STRUCTURE_SPRITES[st]) return 'no sprite for ' + st;
        for (const c of ['gecko', 'tortoise']) if (!G.CREATURE_SPRITES[c]) return 'no sprite for the ' + c;
        if (!G.Creatures.prototype.dart) return 'the gecko cannot dart';
        if (!G.SEASON_NOW.tiles.dune) return 'the seasons do not know the dunes';
        for (const s of ['sunstone', 'sand', 'cactus', 'dunes', 'oasis', 'fallingstar', 'gecko']) if (!G.SFX[s]) return 'missing sound ' + s;
        if (!G.INSTRUMENTS.oud || G.MUSIC_PLACES.dune.inst !== 'oud') return 'the dunes have no oud';
        if (!G.STRUCTURES.amberlantern.travel) return 'the amber lantern is not on the lantern roads';
        const i = G.GOALS.findIndex(g => g.id === 'dunefind'), r = G.GOALS.findIndex(g => g.id === 'whale');
        if (i !== r + 1) return 'the dunes chapter is not right after the sea';
        if (G.GOALS.findIndex(g => g.id === 'sunfind') < i) return 'the dunes come after the Great Sun';
        return 'ok';
    }""")

    # the start keeps its shape (base ground has no dunes), and the first dunes are big, a walk away, with an oasis
    check("Dunes leave the start alone", """() => {
        const w = G.state.world, sp = w.spawnSpot();
        for (let y = -30; y <= 30; y += 2) for (let x = -30; x <= 30; x += 2)
            if (w.groundType(sp.tx + x, sp.ty + y) === 'dune') return 'dunes right by the start at ' + x + ',' + y;
        const c = G.Dunes.first(w), d = Math.hypot(c.tx - sp.tx, c.ty - sp.ty);
        if (d < 65 || d > 90) return 'first dunes at an odd distance: ' + d;
        let n = 0, pool = 0, palms = 0;
        for (let y = -14; y <= 14; y++) for (let x = -14; x <= 14; x++) {
            const t = w.tileAt(c.tx + x, c.ty + y);
            if (t.type === 'dune') n++;
            if (t.obj === 'palm') palms++;
            if (Math.abs(x) < 5 && Math.abs(y) < 5 && t.type === 'water') pool++;
        }
        if (n < 250) return 'the first dunes are tiny: ' + n + ' tiles';
        if (pool < 12) return 'no oasis pool in the middle: ' + pool;
        if (palms < 3) return 'no palms around the oasis: ' + palms;
        const hol = G.Hollow.first(w), pk = G.Peaks.first(w);
        if (Math.hypot(c.tx - hol.tx, c.ty - hol.ty) < 30 || Math.hypot(c.tx - pk.tx, c.ty - pk.ty) < 40) return 'the dunes sit on the hollow or the peak';
        return 'ok';
    }""")

    # stand off to the south first: the hint gives a direction
    page.evaluate("""() => {
        const s = G.state, w = s.world, c = G.Dunes.first(w);
        s.goalsDone = G.GOALS.map(g => g.id).filter(id => !""" + DUNE_GOALS + """.includes(id));
        s.goalsHidden = false;
        delete s.stats.dunes; if (s.stats.met) delete s.stats.met.gecko;
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + 10; w.time = s.time; s.weather.set('clear', true);
        let ty = c.ty + 45;
        while (w.isSolid(c.tx, ty) || w.isWater(c.tx, ty)) ty++;
        s.player.x = (c.tx + 0.5) * 32; s.player.y = (ty + 0.5) * 32; s.player.moveTarget = null; s.cam.x = s.player.x; s.cam.y = s.player.y;
    }""")
    page.wait_for_timeout(700)
    check("Hint points the way", """() => {
        const t = document.getElementById('goals').textContent;
        return /steps north/.test(t) ? 'ok' : 'goal hint has no direction: ' + t;
    }""")
    # walk onto the dunes just south of the oasis
    page.evaluate("""() => {
        const s = G.state, w = s.world, c = G.Dunes.first(w);
        let spot = null;   // an open dune tile just beside the pool
        for (let r = 3; r < 14 && !spot; r++) for (let a = 0; a < 24 && !spot; a++) {
            const tx = Math.round(c.tx + Math.cos(1.57 + a / 24 * 6.283) * r), ty = Math.round(c.ty + Math.sin(1.57 + a / 24 * 6.283) * r);
            if (w.tileAt(tx, ty).type === 'dune' && !w.isSolid(tx, ty) && !w.structureAt(tx, ty) && s.dunes.nearPool(w, tx, ty)) spot = { tx, ty };
        }
        s.player.x = (spot.tx + 0.5) * 32; s.player.y = (spot.ty + 0.5) * 32; s.player.moveTarget = null;
        s.cam.x = s.player.x; s.cam.y = s.player.y;
        window._duneSpot = spot;
    }""")
    page.wait_for_timeout(1500)
    page.screenshot(path=str(shots / "93-dunes-found.png"))
    check("Dunes and oasis found", """() => {
        const D = G.state.stats.dunes;
        if (!D || !D.at.first || D.found !== 1) return 'not found: ' + JSON.stringify(D);
        if (!D.oasis) return 'standing by the pool did not find the oasis';
        if (!document.getElementById('place-name').textContent.includes(G.DUNE_NAMES[0])) return 'no place caption';
        if (G.DuneFX.wisps.length < 5) return 'no sand blowing over the dunes: ' + G.DuneFX.wisps.length;
        return 'ok';
    }""")

    # gather sunstones and sand
    for obj, item in (("sunrock", "sunstone"), ("sandheap", "sand")):
        check("Find " + obj, """() => {
            const s = G.state, w = s.world, sp = window._duneSpot;
            for (let r = 0; r < 18; r++) for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
                if (w.objectAt(sp.tx + x, sp.ty + y) !== '""" + obj + """') continue;
                const tx = sp.tx + x, ty = sp.ty + y + 1;
                if (w.isSolid(tx, ty) || w.isWater(tx, ty)) continue;
                for (let j = -2; j <= 3; j++) for (let i = -2; i <= 2; i++) if ((i || j) && w.objectAt(sp.tx + x + i, sp.ty + y + j)) w.harvest(sp.tx + x + i, sp.ty + y + j);
                s.player.x = (tx + 0.5) * 32; s.player.y = (ty + 0.3) * 32; s.player.moveTarget = null;
                return 'ok';
            }
            return 'no """ + obj + """ in the dunes';
        }""")
        page.keyboard.press("e")
        page.wait_for_timeout(300)
        check("Got " + item, "() => (G.state.stats.got." + item + " || 0) > 0 ? 'ok' : 'pressing E gave no " + item + ": ' + JSON.stringify(G.state.inv)")

    # an Amber lantern and a Sand castle: colour comes back to the dunes, and geckos come out
    page.evaluate("""() => {
        const s = G.state, w = s.world, sp = window._duneSpot;
        s.inv.sunstone = 10; s.inv.sand = 10; s.inv.wood = 5; s.inv.petal = 5;
        s.player.x = (sp.tx + 0.5) * 32; s.player.y = (sp.ty + 0.5) * 32; s.cam.x = s.player.x; s.cam.y = s.player.y;
        const put = (type) => {
            for (let r = 1; r < 6; r++) for (const [dx, dy] of [[r, 1], [-r, 1], [0, r], [r, 0], [-r, 0], [r, r], [-r, r]])
                if (w.canBuild(type, sp.tx + dx, sp.ty + dy)) { w.build(type, sp.tx + dx, sp.ty + dy); return [sp.tx + dx, sp.ty + dy]; }
            return null;
        };
        window._amber = put('amberlantern'); window._castle = put('sandcastle');
        // a tumbleweed rolling past
        G.DuneFX.weeds.push({ x: s.cam.x - 120, y: s.cam.y + 60, z: 8, vz: 30, rot: 0, s: 1, sp: 30 });
    }""")
    page.wait_for_timeout(5000)
    page.screenshot(path=str(shots / "94-dunes-day.png"))
    check("Amber lantern", """() => {
        const s = G.state, L = s.world.lights.find(L => L.type === 'amberlantern');
        if (!L) return 'no amber lantern light';
        if (L.hue !== G.STRUCTURES.amberlantern.lightHue) return 'the amber lantern light is the wrong colour';
        if (!s.travel.stops().some(x => x.type === 'amberlantern')) return 'the amber lantern is not a lantern-road stop';
        if (!window._castle || s.world.count('sandcastle') < 1) return 'could not build a sand castle';
        return 'ok';
    }""")
    page.wait_for_timeout(3000)
    check("Sand geckos", """() => G.state.creatures.list.some(c => c.kind === 'gecko') ? 'ok' : 'no sand gecko in the coloured dunes'""")
    page.evaluate("""() => {
        const s = G.state, c = s.creatures.list.find(c => c.kind === 'gecko');
        if (c) { s.player.x = c.x + 100; s.player.y = c.y; }
    }""")
    page.wait_for_timeout(400)
    check("Met a gecko", """() => G.state.stats.met.gecko ? 'ok' : 'never met a sand gecko'""")
    check("Geckos dart", """() => {
        const s = G.state, c = s.creatures.list.find(c => c.kind === 'gecko');
        if (!c) return 'the gecko left';
        const x = c.x, y = c.y;
        s.creatures.dart(c, 0.01, s.world, { x: c.x + 20, y: c.y }, -20, 0, 20);
        for (let i = 0; i < 10; i++) s.creatures.dart(c, 0.03, s.world, { x: x + 20, y }, c.x - x - 20, c.y - y, Math.hypot(c.x - x - 20, c.y - y));
        return Math.hypot(c.x - x, c.y - y) > 4 ? 'ok' : 'a startled gecko did not dash away';
    }""")

    # a clear night on the dunes: stars, and a falling star
    page.evaluate("""() => {
        const s = G.state, sp = window._duneSpot;
        s.time = Math.floor(s.time / G.DAY_LENGTH + 1) * G.DAY_LENGTH + G.DAY_LENGTH * 0.5; s.world.time = s.time; s.weather.set('clear', true);
        s.player.x = (sp.tx + 0.5) * 32; s.player.y = (sp.ty + 0.5) * 32; s.player.moveTarget = null; s.cam.x = s.player.x; s.cam.y = s.player.y;
    }""")
    page.wait_for_timeout(6500)
    page.evaluate("() => G.DuneFX.shoot()")
    page.wait_for_timeout(350)
    page.screenshot(path=str(shots / "95-dunes-night.png"))
    check("Falling star", """() => {
        const s = G.state;
        if (!(s.stats.dunes.stars > 0)) return 'no falling star was seen (sky ' + s.dunes.sky.toFixed(2) + ')';
        if (G.DuneFX.starA < 0.3) return 'the desert stars are too faint: ' + G.DuneFX.starA.toFixed(2);
        return 'ok';
    }""")
    page.evaluate("""() => { const s = G.state; s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + 60; s.world.time = s.time; }""")
    page.wait_for_timeout(1300)
    check("No stars by day", """() => G.state.dunes.sky < 0.05 ? 'ok' : 'still starry by day: ' + G.state.dunes.sky""")

    page.keyboard.press("m")
    page.wait_for_timeout(600)
    page.screenshot(path=str(shots / "96-dunes-map.png"))
    page.keyboard.press("m")
    page.keyboard.press("j")
    page.wait_for_timeout(300)
    page.evaluate("() => document.querySelector('.journal-tabs button[data-tab=places]') && document.querySelector('.journal-tabs button[data-tab=places]').click()")
    page.wait_for_timeout(300)
    check("Journal lists the dunes", """() => {
        const t = document.getElementById('journal').textContent;
        return t.includes(G.DUNE_NAMES[0]) && t.includes('oasis') ? 'ok' : 'no dunes or oasis on the Places page';
    }""")
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
    print("\n".join(errs) if errs else "dunes ok")
    sys.exit(1 if errs else 0)
