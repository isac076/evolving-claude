"""The hush of night (Night 19): hushlings rise out of the grey on dark nights,
hold on and sip the spirit's glow; a Shine (F) or a lantern's light eases them
into starlight; starlight makes a Moon lantern that keeps them away.
Called from smoke_test.py with an open page that is already playing
(or run on its own: python3 tools/smoke_hush.py)."""
import pathlib, sys


def run(page, shots, errors):
    def check(name, js):
        result = page.evaluate(js)
        if result != "ok":
            errors.append(name + " failed: " + str(result))

    check("Hush data", """() => {
        if (!G.HushFX || !G.STRUCTURE_SPRITES.moonlantern) return 'missing hush drawing';
        for (const s of ['hush', 'hushcling', 'hushmeet', 'hushsated', 'shine', 'hushease', 'starlight', 'moonlantern'])
            if (!G.SFX[s]) return 'missing sound ' + s;
        if (!G.STRUCTURES.moonlantern.travel || !G.TRAVEL_STOPS.moonlantern) return 'the moon lantern is not a road stop';
        const i = G.GOALS.findIndex(g => g.id === 'hushmeet'), j = G.GOALS.findIndex(g => g.chapter === 'Echoes of the old world');
        if (i < 0 || i > j) return 'hush goals in the wrong place: ' + i + ' / ' + j;
        if (!document.getElementById('btn-shine')) return 'no Shine button';
        return 'ok';
    }""")

    # two lanterns by the Heart Stone, then out into the grey at midnight
    page.evaluate("""() => {
        const s = G.state, w = s.world, sp = w.spawnSpot();
        s.goalsDone = G.GOALS.map(g => g.id).filter(id => !['hushmeet', 'hushease', 'moonlantern', 'hush5', 'charm'].includes(id));
        s.goalsHidden = false;
        delete s.stats.hush;
        s.stats.unlocked = (s.stats.unlocked || []).filter(u => u !== 'moonlantern' && u !== 'charm');
        delete s.inv.charm; s.inv.starlight = 0;
        while (w.litCount() < 2) {
            for (let r = 4; r < 30; r++) { const tx = sp.tx + r, ty = sp.ty - 3; if (w.canBuild('lantern', tx, ty)) { w.build('lantern', tx, ty); break; } }
        }
        s.weather.set('clear', true);
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + G.DAY_LENGTH * 0.5; w.time = s.time;
        // a grey spot far from every light
        let spot = null;
        for (let r = 30; r < 120 && !spot; r += 3) for (let a = 0; a < 16 && !spot; a++) {
            const tx = Math.round(sp.tx + Math.cos(a / 16 * 6.283) * r), ty = Math.round(sp.ty + Math.sin(a / 16 * 6.283) * r);
            const x = (tx + 0.5) * 32, y = (ty + 0.5) * 32;
            if (!w.isSolid(tx, ty) && !G.TILES[w.tileAt(tx, ty).type].water && w.restoreAt(x, y, w.lights) === 0 && s.hush.calmAt(x, y) > 5) spot = { tx, ty };
        }
        window._greySpot = spot;
        s.player.x = (spot.tx + 0.5) * 32; s.player.y = (spot.ty + 0.5) * 32; s.player.moveTarget = null; s.player.glow = 1;
        s.cam.x = s.player.x; s.cam.y = s.player.y;
        s.hush.clear();
    }""")
    page.wait_for_timeout(2500)
    check("Hushlings come", """() => {
        const h = G.state.hush;
        if (!h.list.length) return 'no hushlings rose in the grey at midnight';
        return 'ok';
    }""")
    # bring them close so they hold on
    page.evaluate("""() => {
        const s = G.state, h = s.hush, p = s.player;
        while (h.list.length < 3) h.trySpawn(0);
        h.list.forEach((x, i) => { x.x = p.x + 60 + i * 30; x.y = p.y - 20 + i * 18; x.a = 1; });
    }""")
    page.wait_for_timeout(4000)
    page.screenshot(path=str(shots / "65-hush-night.png"))
    check("Hushlings sip your light", """() => {
        const s = G.state, h = s.hush;
        if (!s.stats.hush || !s.stats.hush.met) return 'never met a hushling';
        if (!h.clinging().length) return 'none held on: ' + h.list.map(x => x.mode + '@' + Math.round(Math.hypot(x.x - s.player.x, x.y - s.player.y))).join(',');
        if (s.player.glow > 0.95) return 'glow did not fall: ' + s.player.glow;
        if (!document.getElementById('goals').textContent.includes('Ease a hushling')) return 'the tracker is not on the next hush goal';
        return 'ok';
    }""")

    # Shine twice: the ones close by turn to starlight, which floats to you
    page.keyboard.press("f")
    page.wait_for_timeout(250)
    page.screenshot(path=str(shots / "66-hush-shine.png"))
    page.wait_for_timeout(2900)
    page.evaluate("() => { G.state.hush.list.forEach(h => { const p = G.state.player; if (h.mode !== 'leave') { h.x = p.x + 30; h.y = p.y - 10; } }); }")
    page.keyboard.press("f")
    page.wait_for_timeout(2600)
    check("Shine eases them", """() => {
        const s = G.state, st = s.stats.hush;
        if (st.shines < 2) return 'shines: ' + st.shines;
        if (!st.eased) return 'nothing eased; ' + s.hush.list.map(h => h.mode + ' e=' + h.e.toFixed(2)).join(',');
        if (!(s.inv.starlight > 0)) return 'no starlight reached you';
        if (!s.stats.unlocked.includes('moonlantern')) return 'the moon lantern was not learned';
        return 'ok';
    }""")

    # one holds on, and you lead it into a lantern's light
    page.evaluate("""() => {
        const s = G.state, h = s.hush, p = s.player;
        h.list = []; h.trySpawn(0);
        const x = h.list[0]; x.x = p.x + 20; x.y = p.y - 12; x.a = 1;
        window._eased = s.stats.hush.eased;
    }""")
    page.wait_for_timeout(600)
    page.evaluate("""() => {
        const s = G.state, L = s.world.lights.find(L => L.type === 'lantern'), p = s.player;
        p.x = L.x; p.y = L.y + 40; s.cam.x = p.x; s.cam.y = p.y;
        for (const h of s.hush.list) { h.x = p.x + 18; h.y = p.y - 14; }
    }""")
    page.wait_for_timeout(2500)
    check("A lantern's light eases them", """() => {
        const s = G.state;
        if (s.stats.hush.eased <= window._eased) return 'led into the light but not eased: ' + s.hush.list.map(h => h.mode + ' e=' + h.e.toFixed(2)).join(',');
        if (s.player.glow < 0.5) return 'glow does not come back by a lantern: ' + s.player.glow;
        return 'ok';
    }""")

    # a Moon lantern out in the grey keeps them away
    page.evaluate("""() => {
        const s = G.state, w = s.world, sp = window._greySpot, p = s.player;
        s.inv.starlight = 5; s.inv.stone = 10; s.inv.wood = 10;
        p.x = (sp.tx + 0.5) * 32; p.y = (sp.ty + 0.5) * 32; s.cam.x = p.x; s.cam.y = p.y; p.glow = 1;
        for (let r = 2; r < 6; r++) if (w.canBuild('moonlantern', sp.tx + r, sp.ty - 1)) { w.build('moonlantern', sp.tx + r, sp.ty - 1); window._moon = [sp.tx + r, sp.ty - 1]; break; }
        s.hush.list = []; s.hush.trySpawn(0);
        const x = s.hush.list[0]; if (x) { x.x = p.x + 40; x.y = p.y; x.a = 1; }
    }""")
    page.wait_for_timeout(2500)
    page.screenshot(path=str(shots / "67-moon-lantern.png"))
    check("Moon lantern calm", """() => {
        const s = G.state, h = s.hush;
        if (!window._moon) return 'could not build a moon lantern';
        if (h.canCome(0)) return 'hushlings may still come right beside a moon lantern';
        if (h.list.some(x => x.mode !== 'leave' && x.e < 0.5)) return 'a hushling stays in the calm';
        if (!s.travel.stops().some(L => L.type === 'moonlantern')) return 'the moon lantern is not a road stop';
        return 'ok';
    }""")

    # far out in the grey, with three holding on, the light goes small but never out
    page.evaluate("""() => {
        const s = G.state, w = s.world, [mx, my] = window._moon;
        w.remove(mx, my);
        const p = s.player; p.glow = 0.3; s.hush.list = [];
        for (let i = 0; i < 3; i++) { s.hush.trySpawn(0); }
        s.hush.list.forEach((x, i) => { x.x = p.x + 15; x.y = p.y - 12 + i * 4; x.a = 1; });
        s.hush.cool = 9;
    }""")
    page.wait_for_timeout(2500)
    check("The light never goes out", """() => {
        const s = G.state;
        if (!s.stats.hush.dimmed) return 'they never let go: glow ' + s.player.glow;
        if (s.player.glow < G.HUSH.minGlow - 0.01) return 'glow fell too low: ' + s.player.glow;
        if (s.hush.clinging().length) return 'still holding on after the light was full';
        return 'ok';
    }""")

    # the journal knows them; by day they fade away
    page.keyboard.press("j")
    page.wait_for_timeout(300)
    page.evaluate("() => document.querySelector('.journal-tabs [data-tab=creatures]').click()")
    page.wait_for_timeout(300)
    check("Journal hushling", """() => document.getElementById('journal-page').textContent.includes('Hushling') ? 'ok' : 'no hushling in the journal'""")
    page.keyboard.press("j")
    page.evaluate("() => { const s = G.state; s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + 5; s.world.time = s.time; s.hush.trySpawn(0); }")
    page.wait_for_timeout(2500)
    check("Gone by day", """() => G.state.hush.list.length === 0 ? 'ok' : G.state.hush.list.length + ' hushlings still about by day'""")


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
    print("\n".join(errs) if errs else "hush ok")
    sys.exit(1 if errs else 0)
