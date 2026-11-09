"""The Glowcap Hollows (Night 17): a new biome of giant mushrooms. Every world
has one a walk from the start; walking in finds it; spores make a Mushroom lamp;
glow snails come out in coloured hollow land; spore patches grow into glowcaps.
Called from smoke_test.py with an open page that is already playing
(or run on its own: python3 tools/smoke_hollow.py)."""
import pathlib, sys


def run(page, shots, errors):
    def check(name, js):
        result = page.evaluate(js)
        if result != "ok":
            errors.append(name + " failed: " + str(result))

    check("Hollow data", """() => {
        for (const o of ['bigshroom', 'glowcap']) if (!G.OBJECT_SPRITES[o] || !G.REGROW_SPRITES[o]) return 'no sprite for ' + o;
        for (const st of ['shroomlamp', 'sporebed']) if (!G.STRUCTURE_SPRITES[st]) return 'no sprite for ' + st;
        if (!G.CREATURE_SPRITES.snail || !G.Creatures.prototype.crawl) return 'no glow snail';
        if (!G.SEASON_NOW.tiles.mushwood) return 'the seasons do not know the hollow ground';
        if (!G.STEP_SOUNDS.moss || !G.SFX.spore || !G.SFX.hollow) return 'missing hollow sounds';
        if (!G.STRUCTURES.shroomlamp.travel) return 'the mushroom lamp is not on the lantern roads';
        for (const s of G.SEASONS) if (!s.ground.mushwood) return 'season without hollow colours: ' + s.id;
        return 'ok';
    }""")

    # the old world keeps its shape: the start and the ruins come from the ground without hollows
    check("Hollows leave the start alone", """() => {
        const w = G.state.world, sp = w.spawnSpot();
        for (let y = -20; y <= 20; y += 2) for (let x = -20; x <= 20; x += 2)
            if (w.groundType(sp.tx + x, sp.ty + y) === 'mushwood') return 'a hollow right by the start at ' + x + ',' + y;
        const c = G.Hollow.first(w), d = Math.hypot(c.tx - sp.tx, c.ty - sp.ty);
        if (d < 50 || d > 75) return 'first hollow at an odd distance: ' + d;
        let n = 0;
        for (let y = -12; y <= 12; y++) for (let x = -12; x <= 12; x++) if (w.tileAt(c.tx + x, c.ty + y).type === 'mushwood') n++;
        if (n < 120) return 'the first hollow is tiny: ' + n + ' tiles';
        return 'ok';
    }""")

    # walk into the first hollow by day: it is found, named, and the goal hint points there first
    page.evaluate("""() => {
        const s = G.state, w = s.world, c = G.Hollow.first(w);
        s.goalsDone = G.GOALS.map(g => g.id).filter(id => !['hollowfind', 'spores', 'shroomlamp', 'snail', 'sporegrow'].includes(id));
        s.goalsHidden = false;
        if (s.stats.hollow) delete s.stats.hollow;
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + 10; w.time = s.time; s.weather.set('clear', true);
        // stand a little way off first, so the hint has a direction to give
        s.player.x = (c.tx + 0.5) * 32; s.player.y = (c.ty + 40.5) * 32; s.cam.x = s.player.x; s.cam.y = s.player.y;
    }""")
    page.wait_for_timeout(700)
    check("Hint points the way", """() => {
        const t = document.getElementById('goals').textContent;
        return /steps north/.test(t) ? 'ok' : 'goal hint has no direction: ' + t;
    }""")
    page.evaluate("""() => {
        const s = G.state, w = s.world, c = G.Hollow.first(w);
        let spot = null;   // an open hollow tile near the middle
        for (let r = 0; r < 14 && !spot; r++) for (let a = 0; a < 16 && !spot; a++) {
            const tx = Math.round(c.tx + Math.cos(a / 16 * 6.283) * r), ty = Math.round(c.ty + Math.sin(a / 16 * 6.283) * r);
            if (w.tileAt(tx, ty).type === 'mushwood' && !w.isSolid(tx, ty) && !w.structureAt(tx, ty)) spot = { tx, ty };
        }
        s.player.x = (spot.tx + 0.5) * 32; s.player.y = (spot.ty + 0.5) * 32; s.player.moveTarget = null;
        s.cam.x = s.player.x; s.cam.y = s.player.y;
        window._hollowSpot = spot;
    }""")
    page.wait_for_timeout(1400)
    page.screenshot(path=str(shots / "55-hollow-found.png"))
    check("Hollow found", """() => {
        const H = G.state.stats.hollow;
        if (!H || !H.at.first || H.found !== Object.keys(H.at).length) return 'not found: ' + JSON.stringify(H);
        if (!document.getElementById('place-name').textContent.includes('Hollow')) return 'no place caption';
        return 'ok';
    }""")

    # gather spores, then build a mushroom lamp: colour returns and snails come out
    check("Find a glowcap", """() => {
        const s = G.state, w = s.world, sp = window._hollowSpot;
        for (let r = 0; r < 12; r++) for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
            if (w.objectAt(sp.tx + x, sp.ty + y) !== 'glowcap') continue;
            s.player.x = (sp.tx + x + 0.5) * 32; s.player.y = (sp.ty + y + 0.6) * 32; s.player.moveTarget = null;
            return 'ok';
        }
        return 'no glowcaps around the hollow';
    }""")
    page.keyboard.press("e")
    page.wait_for_timeout(300)
    check("Spores in the pocket", """() => (G.state.stats.got.spore || 0) > 0 ? 'ok' : 'pressing E by a mushroom gave no spores: ' + JSON.stringify(G.state.inv)""")
    page.evaluate("""() => {
        const s = G.state, w = s.world, sp = window._hollowSpot;
        s.inv.spore = 20; s.inv.wood = 10; s.inv.fibre = 10;
        s.player.x = (sp.tx + 0.5) * 32; s.player.y = (sp.ty + 0.5) * 32; s.cam.x = s.player.x; s.cam.y = s.player.y;
        let placed = null;
        for (let r = 1; r < 6 && !placed; r++) for (const [dx, dy] of [[r, 0], [-r, 0], [0, -r], [r, -r], [-r, -r]])
            if (!placed && w.canBuild('shroomlamp', sp.tx + dx, sp.ty + dy)) { w.build('shroomlamp', sp.tx + dx, sp.ty + dy); placed = [sp.tx + dx, sp.ty + dy]; }
        window._lamp = placed;
        // a spore patch close by, almost grown
        for (let r = 2; r < 7; r++) for (const [dx, dy] of [[0, r], [r, r], [-r, r]])
            if (!window._bed && w.canBuild('sporebed', sp.tx + dx, sp.ty + dy)) { w.build('sporebed', sp.tx + dx, sp.ty + dy); window._bed = [sp.tx + dx, sp.ty + dy]; w.structureAt(sp.tx + dx, sp.ty + dy).g = 0.7; }
    }""")
    page.wait_for_timeout(3500)
    page.screenshot(path=str(shots / "56-hollow-day.png"))
    check("Mushroom lamp", """() => {
        const s = G.state, L = s.world.lights.find(L => L.type === 'shroomlamp');
        if (!L) return 'no mushroom lamp light';
        if (L.hue !== G.STRUCTURES.shroomlamp.lightHue) return 'the lamp light is not teal';
        if (!s.travel.stops().some(x => x.type === 'shroomlamp')) return 'the lamp is not a lantern-road stop';
        if (!window._bed) return 'could not plant a spore patch';
        return 'ok';
    }""")
    check("Glow snails", """() => {
        const s = G.state, snails = s.creatures.list.filter(c => c.kind === 'snail');
        if (!snails.length) return 'no glow snails in the coloured hollow';
        return 'ok';
    }""")
    # make sure a snail is close enough to be met (they are slow)
    page.evaluate("""() => {
        const s = G.state, c = s.creatures.list.find(c => c.kind === 'snail');
        if (c) { s.player.x = c.x + 70; s.player.y = c.y; }
    }""")
    page.wait_for_timeout(400)
    check("Met a snail", """() => G.state.stats.met.snail ? 'ok' : 'never met a glow snail'""")

    # the spore patch grows into glowcaps (or, rarely, a giant mushroom)
    check("Spores grow", """() => {
        const s = G.state, w = s.world, [tx, ty] = window._bed, st = w.structureAt(tx, ty);
        if (!st) return 'the spore patch is gone';
        st.g = 0.999; st.wet = 30;
        s.garden.update(1, s);
        const o = w.objectAt(tx, ty);
        if (o !== 'glowcap' && o !== 'bigshroom') return 'the patch grew into ' + o;
        if (!(s.stats.grown.glowcap || s.stats.grown.bigshroom)) return 'growth not counted';
        return 'ok';
    }""")

    # night in the hollow: glowcaps shine, spores drift, snails glow
    page.evaluate("""() => {
        const s = G.state, sp = window._hollowSpot;
        s.time = Math.floor(s.time / G.DAY_LENGTH + 1) * G.DAY_LENGTH + G.DAY_LENGTH * 0.5; s.world.time = s.time;
        s.player.x = (sp.tx + 0.5) * 32; s.player.y = (sp.ty + 3.5) * 32; s.cam.x = s.player.x; s.cam.y = s.player.y;
    }""")
    page.wait_for_timeout(2500)
    page.screenshot(path=str(shots / "57-hollow-night.png"))
    check("Spores drift", """() => G.SporeFX.motes.length > 5 ? 'ok' : 'only ' + G.SporeFX.motes.length + ' spores in the air'""")

    # the hollow's edge on the map, and in the journal
    page.keyboard.press("m")
    page.wait_for_timeout(600)
    page.screenshot(path=str(shots / "58-hollow-map.png"))
    page.keyboard.press("m")
    page.evaluate("() => { G.state.time = Math.ceil(G.state.time / G.DAY_LENGTH) * G.DAY_LENGTH; }")
    page.keyboard.press("j")
    page.wait_for_timeout(300)
    page.evaluate("() => G.state.journal ? 0 : document.querySelector('.journal-tabs button[data-tab=places]').click()")
    page.wait_for_timeout(300)
    check("Journal lists the hollow", """() => document.getElementById('journal').textContent.includes('Glowcap Hollow') ? 'ok' : 'no hollow on the Places page'""")
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
    print("\n".join(errs) if errs else "hollow ok")
    sys.exit(1 if errs else 0)
