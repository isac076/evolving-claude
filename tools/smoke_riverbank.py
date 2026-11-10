"""Riverbanks & waymarks (Night 18): clay banks beside shallow water, stepping
stones across the shallows, signposts that carry a typed name (shown over the
post, on the map and on the lantern roads) and banners that change colour.
Called from smoke_test.py with an open page that is already playing
(or run on its own: python3 tools/smoke_riverbank.py)."""
import pathlib, sys


def run(page, shots, errors):
    def check(name, js):
        result = page.evaluate(js)
        if result != "ok":
            errors.append(name + " failed: " + str(result))

    check("Riverbank data", """() => {
        if (!G.OBJECT_SPRITES.claybank || !G.REGROW_SPRITES.claybank) return 'no clay sprite';
        for (const st of ['stepstones', 'signpost', 'banner', 'claypot']) {
            if (!G.STRUCTURE_SPRITES[st]) return 'no sprite for ' + st;
            if (!G.RECIPES.find(r => r.builds === st)) return 'no recipe for ' + st;
        }
        for (const s of ['clay', 'stepstones', 'banner', 'sign']) if (!G.SFX[s]) return 'no sound ' + s;
        if (!G.state.signs || !document.getElementById('signpanel')) return 'no signs';
        return 'ok';
    }""")

    # clay only lies beside shallow water; walk to the nearest bank and dig it
    page.evaluate("""() => {
        const s = G.state, w = s.world;
        s.goalsDone = G.GOALS.map(g => g.id).filter(id => !['clay', 'stepstones', 'signpost', 'banner'].includes(id));
        s.goalsHidden = false;
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + 20; w.time = s.time; s.weather.set('clear', true);
        const sp = w.spawnSpot();
        s.player.x = (sp.tx + 0.5) * 32; s.player.y = (sp.ty + 0.5) * 32; s.player.moveTarget = null;
        s.cam.x = s.player.x; s.cam.y = s.player.y;
        G.Signs.clayMemo = null;
    }""")
    page.wait_for_timeout(500)
    check("Clay hint points the way", """() => {
        const t = document.getElementById('goals').textContent;
        return /clay/i.test(t) && /(steps (north|south|east|west)|Right here|Follow a shore)/.test(t) ? 'ok' : 'odd clay hint: ' + t;
    }""")
    check("Clay by the shallows", """() => {
        const s = G.state, w = s.world, sp = w.spawnSpot();
        let bank = null, n = 0;
        for (let r = 0; r < 160 && !bank; r++) for (let dx = -r; dx <= r && !bank; dx++) for (const dy of [-r, r]) {
            const tx = sp.tx + dx, ty = sp.ty + dy;
            if (w.objectAt(tx, ty) !== 'claybank') continue;
            n++;
            if (!w.besideShallows(tx, ty)) return 'clay away from the shallows at ' + tx + ',' + ty;
            // a shallow tile next to it, with land on the other side of the bank to stand on
            for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                if (w.tileAt(tx + ax, ty + ay).type !== 'water' || w.structureAt(tx + ax, ty + ay)) continue;
                const fx = tx - ax, fy = ty - ay;
                if (w.isSolid(fx, fy) || w.isWater(fx, fy)) continue;
                bank = { tx, ty, wx: tx + ax, wy: ty + ay, fx, fy, ax, ay }; break;
            }
        }
        if (!bank) return 'no clay bank with a free shore found near the start';
        window._bank = bank;
        s.player.x = (bank.tx + 0.5) * 32; s.player.y = (bank.ty + 0.5) * 32;   // clay is soft: stand right on it s.player.moveTarget = null;
        s.cam.x = s.player.x; s.cam.y = s.player.y;
        return 'ok';
    }""")
    page.wait_for_timeout(300)
    page.keyboard.press("e")
    page.wait_for_timeout(300)
    check("Dug clay", """() => {
        const s = G.state;
        if (!(s.stats.got.clay >= 2)) return 'no clay from the bank: ' + JSON.stringify(s.stats.got);
        if (!/clay/i.test(document.getElementById('toast').textContent)) return 'no first-clay word';
        if (G.state.world.objectAt(window._bank.tx, window._bank.ty)) return 'the bank did not get dug';
        return 'ok';
    }""")

    # stepping stones: only in the shallows, and you can walk on them
    check("Stepping stones", """() => {
        const s = G.state, w = s.world, b = window._bank;
        if (w.canBuild('stepstones', b.fx, b.fy)) return 'stepping stones allowed on land';
        let deep = null;
        for (let r = 1; r < 200 && !deep; r++) for (let a = 0; a < 16 && !deep; a++) {
            const tx = Math.round(b.tx + Math.cos(a / 16 * 6.283) * r), ty = Math.round(b.ty + Math.sin(a / 16 * 6.283) * r);
            if (w.tileAt(tx, ty).type === 'deep') deep = [tx, ty];
        }
        if (deep && w.canBuild('stepstones', deep[0], deep[1])) return 'stepping stones allowed in deep water';
        if (!w.canBuild('stepstones', b.wx, b.wy)) return 'stepping stones not allowed in the shallows';
        // lay a short line out into the water
        let n = 0;
        for (let k = 0; k < 4; k++) {
            const tx = b.wx + b.ax * k, ty = b.wy + b.ay * k;
            if (w.canBuild('stepstones', tx, ty)) { w.build('stepstones', tx, ty); n++; } else break;
        }
        if (w.isSolid(b.wx, b.wy)) return 'cannot stand on the stepping stones';
        return n ? 'ok' : 'none laid';
    }""")

    # a signpost through the real craft → place → name flow
    page.evaluate("""() => {
        const s = G.state, b = window._bank;
        s.stats.got.clay = Math.max(3, s.stats.got.clay);   // as if a second bank were dug
        s.inv.wood = 20; s.inv.clay = 10; s.inv.fibre = 10; s.inv.petal = 10; s.inv.stone = 10;
        s.player.x = (b.fx + 0.5) * 32; s.player.y = (b.fy + 0.5) * 32; s.cam.x = s.player.x; s.cam.y = s.player.y;
        s.startBuild(G.RECIPES.find(r => r.id === 'signpost'));
        // a free land tile beside the spirit for the sign
        const w = s.world;
        let spot = null;
        for (const [dx, dy] of [[-1, -1], [1, -1], [-2, 0], [2, 0], [-1, 1], [1, 1], [0, -2], [-2, -1], [2, -1]])
            if (!spot && w.canBuild('signpost', b.fx + dx, b.fy + dy)) spot = [b.fx + dx, b.fy + dy];
        window._signSpot = spot;
    }""")
    page.wait_for_timeout(100)

    def click_tile(tx, ty, dy=0.5):
        pos = page.evaluate("""([tx, ty, dy]) => {
            const s = G.state, c = document.getElementById('game');
            const W = c.clientWidth, H = c.clientHeight;
            return [(tx + 0.5) * 32 - s.cam.x + W / 2, (ty + dy) * 32 - s.cam.y + H / 2];
        }""", [tx, ty, dy])
        page.mouse.click(pos[0], pos[1])

    spot = page.evaluate("() => window._signSpot")
    if not spot:
        errors.append("Signpost failed: no free spot by the river")
        return
    page.evaluate("() => { const s = G.state; s.cam.x = s.player.x; s.cam.y = s.player.y; }")
    click_tile(spot[0], spot[1])
    page.wait_for_timeout(400)
    check("Name panel opens", """() => {
        const s = G.state;
        if (!s.world.structureAt(...window._signSpot)) return 'the signpost was not built';
        if (!s.signs.isOpen || !document.getElementById('signpanel').classList.contains('open')) return 'no name panel';
        if (!document.getElementById('sign-name').value) return 'no suggested name';
        window._px = s.player.x;
        return 'ok';
    }""")
    page.screenshot(path=str(shots / "61-sign-naming.png"))
    page.keyboard.press("Control+a")
    page.keyboard.type("Otter Ford dddd")
    for _ in range(5):
        page.keyboard.press("Backspace")
    page.wait_for_timeout(200)
    check("Typing does not walk", """() => Math.abs(G.state.player.x - window._px) < 1 ? 'ok' : 'the spirit walked while typing'""")
    page.keyboard.press("Enter")
    page.wait_for_timeout(300)
    check("Sign named", """() => {
        const s = G.state, [tx, ty] = window._signSpot;
        if (s.signs.isOpen) return 'panel still open';
        if (s.stats.signs[tx + ',' + ty] !== 'Otter Ford') return 'name not kept: ' + JSON.stringify(s.stats.signs);
        if (!s.signs.list().some(x => x.name === 'Otter Ford')) return 'not in the sign list';
        return 'ok';
    }""")

    # a lantern near the sign takes its name on the roads; a banner changes colour when clicked
    page.evaluate("""() => {
        const s = G.state, w = s.world, b = window._bank;
        s.buildRecipe = null; s.placing = null;
        let lamp = null, ban = null;
        for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1], [0, 2], [2, 0], [-2, 0]])
            if (!ban && w.canBuild('banner', b.fx + dx, b.fy + dy)) { w.build('banner', b.fx + dx, b.fy + dy); ban = [b.fx + dx, b.fy + dy]; }
        for (let r = 2; r < 7 && !lamp; r++) for (const [dx, dy] of [[r, -1], [-r, -1], [r, 1], [-r, 1], [0, -r], [1, -r], [-1, -r]]) {
            const tx = b.fx + dx, ty = b.fy + dy;
            if (!lamp && w.canBuild('lantern', tx, ty)) { w.build('lantern', tx, ty); lamp = [tx, ty]; }
        }
        if (w.canBuild('claypot', b.fx + 1, b.fy)) w.build('claypot', b.fx + 1, b.fy);
        window._lamp = lamp; window._banner = ban;
        s.signs.refreshList();
        s.player.x = (b.fx + 0.5) * 32; s.player.y = (b.fy + 0.5) * 32; s.cam.x = s.player.x; s.cam.y = s.player.y;
        G.windNow = 0.6;
    }""")
    check("Lantern road name", """() => {
        const s = G.state, [tx, ty] = window._lamp, L = s.world.lights.find(L => L.type === 'lantern' && Math.floor(L.x / 32) === tx && Math.floor(L.y / 32) === ty);
        if (!L) return 'no lantern';
        const n = s.travel.nameOf(L);
        return n === 'Lantern at Otter Ford' ? 'ok' : 'lantern called ' + n;
    }""")
    ban = page.evaluate("() => window._banner")
    if ban:
        page.evaluate("() => { const s = G.state; window._bb = JSON.stringify(s.stats.banners || {}); s.cam.x = s.player.x; s.cam.y = s.player.y; }")
        click_tile(ban[0], ban[1], 0.6)
        page.wait_for_timeout(200)
        check("Banner recolours", """() => JSON.stringify(G.state.stats.banners || {}) !== window._bb ? 'ok' : 'clicking the banner changed nothing'""")
    else:
        errors.append("Banner failed: no spot for a banner")
    page.wait_for_timeout(6500)   # goals finish one after another
    page.screenshot(path=str(shots / "62-riverbank-day.png"))
    check("Riverbank goals", """() => {
        const d = G.state.goalsDone;
        for (const id of ['clay', 'stepstones', 'signpost']) if (!d.includes(id)) return 'goal not done: ' + id;
        return 'ok';
    }""")

    # dusk by the ford: the name tag still reads above the night
    page.evaluate("""() => {
        const s = G.state;
        s.time = Math.floor(s.time / G.DAY_LENGTH + 1) * G.DAY_LENGTH + G.DAY_LENGTH * 0.47; s.world.time = s.time;
    }""")
    page.wait_for_timeout(1500)
    page.screenshot(path=str(shots / "63-riverbank-night.png"))

    # the name on the big map, and in the journal
    page.keyboard.press("m")
    page.wait_for_timeout(700)
    page.screenshot(path=str(shots / "64-sign-map.png"))
    page.keyboard.press("m")
    page.evaluate("() => { G.state.time = Math.ceil(G.state.time / G.DAY_LENGTH) * G.DAY_LENGTH; }")
    page.keyboard.press("j")
    page.wait_for_timeout(300)
    page.evaluate("() => document.querySelector('.journal-tabs button[data-tab=places]').click()")
    page.wait_for_timeout(300)
    check("Journal lists the named place", """() => document.getElementById('journal').textContent.includes('Otter Ford') ? 'ok' : 'no named place on the Places page'""")
    page.keyboard.press("j")
    page.wait_for_timeout(200)

    # old saves keep working: names live inside stats
    check("Saved with the world", """() => {
        G.Save.write(G.state);
        const d = G.Save.read();
        if (!d.stats.signs || !Object.values(d.stats.signs).includes('Otter Ford')) return 'sign name not saved';
        if (!d.structures.some(x => x[0] === 'stepstones')) return 'stepping stones not saved';
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
    print("\n".join(errs) if errs else "riverbank ok")
    sys.exit(1 if errs else 0)
