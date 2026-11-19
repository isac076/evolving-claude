"""The Far Isles (Night 27): islands out at sea, reached by boat. Every world has one
within a sail of the start; stepping onto its coral sand finds it; seashells, tide
pools and coral make a Shell lantern and a Shell chime; hermit crabs scuttle,
parrots land, sea turtles rise to breathe; on dark nights the tide glows.
Called from smoke_test.py with an open page that is already playing
(or run on its own: python3 tools/smoke_isles.py)."""
import pathlib, sys

ISLE_GOALS = "['islefind', 'shells', 'coral', 'shelllantern', 'windchime', 'crab', 'seaturtle', 'glowtide']"


def run(page, shots, errors):
    def check(name, js):
        result = page.evaluate(js)
        if result != "ok":
            errors.append(name + " failed: " + str(result))

    check("Isle data", """() => {
        for (const o of ['seashell', 'tidepool', 'hibiscus', 'fern', 'coral']) if (!G.OBJECT_SPRITES[o] || !G.REGROW_SPRITES[o]) return 'no sprite for ' + o;
        for (const st of ['shelllantern', 'windchime']) if (!G.STRUCTURE_SPRITES[st]) return 'no sprite for ' + st;
        for (const c of ['crab', 'seaturtle', 'parrot']) if (!G.CREATURE_SPRITES[c]) return 'no sprite for the ' + c;
        if (!G.Creatures.prototype.scuttle || !G.Creatures.prototype.glide) return 'the crab or turtle cannot move';
        for (const t of ['lagoon', 'strand', 'isle']) if (!G.SEASON_NOW.tiles[t]) return 'the seasons do not know ' + t;
        for (const s of ['shell', 'tidepool', 'coral', 'isles', 'glowtide', 'chime', 'crab', 'turtle', 'parrot']) if (!G.SFX[s]) return 'missing sound ' + s;
        if (!G.INSTRUMENTS.steeldrum || G.MUSIC_PLACES.strand.inst !== 'steeldrum') return 'the isles have no steel drum';
        if (!G.STRUCTURES.shelllantern.travel) return 'the shell lantern is not on the lantern roads';
        const i = G.GOALS.findIndex(g => g.id === 'islefind'), r = G.GOALS.findIndex(g => g.id === 'fallingstar');
        if (i !== r + 1) return 'the isles chapter is not right after the dunes';
        return 'ok';
    }""")

    # the start and the land keep their shape; the first island is out at sea, a sail away, with all three grounds
    check("The first island", """() => {
        const w = G.state.world, sp = w.spawnSpot();
        for (let y = -30; y <= 30; y += 2) for (let x = -30; x <= 30; x += 2) {
            const g = w.groundType(sp.tx + x, sp.ty + y);
            if (g === 'isle' || g === 'strand' || g === 'lagoon') return 'an island right by the start at ' + x + ',' + y;
        }
        const c = G.Isles.first(w), d = Math.hypot(c.tx - sp.tx, c.ty - sp.ty);
        if (c.forced) return 'no open sea found for the first island';
        if (d < 50 || d > 240) return 'first island at an odd distance: ' + d;
        const n = { isle: 0, strand: 0, lagoon: 0 };
        let palms = 0, shells = 0, coral = 0, landOk = true;
        for (let y = -16; y <= 16; y++) for (let x = -16; x <= 16; x++) {
            const t = w.tileAt(c.tx + x, c.ty + y);
            if (n[t.type] !== undefined) {
                n[t.type]++;
                if (!G.TILES[w.groundType(c.tx + x, c.ty + y, true)].water) landOk = false;   // islands only rise out of the sea
            }
            if (t.obj === 'palm') palms++;
            if (t.obj === 'seashell' || t.obj === 'tidepool') shells++;
            if (t.obj === 'coral') coral++;
        }
        if (!landOk) return 'an island covers old land';
        if (n.isle < 30 || n.strand < 60 || n.lagoon < 80) return 'the first island is missing a part: ' + JSON.stringify(n);
        if (palms < 3 || shells < 2 || coral < 3) return 'the first island is bare: palms ' + palms + ', shells ' + shells + ', coral ' + coral;
        // other islands dot the open sea
        let more = 0;
        for (let cy = -6; cy < 6; cy++) for (let cx = -6; cx < 6; cx++) if (G.Isles.inCell(w, cx, cy)) more++;
        if (more < 1) return 'no other islands in the sea around';
        return 'ok';
    }""")

    # stand on land to the far side: the hint gives a direction (and mentions the boat if there is none)
    page.evaluate("""() => {
        const s = G.state, w = s.world;
        s.goalsDone = G.GOALS.map(g => g.id).filter(id => !""" + ISLE_GOALS + """.includes(id));
        s.goalsHidden = false;
        delete s.stats.isles; if (s.stats.met) { delete s.stats.met.crab; delete s.stats.met.seaturtle; delete s.stats.met.parrot; }
        delete s.inv.boat;
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + 10; w.time = s.time; s.weather.set('clear', true);
        const sp = w.spawnSpot();
        s.player.x = (sp.tx + 0.5) * 32; s.player.y = (sp.ty + 0.5) * 32; s.player.moveTarget = null; s.cam.x = s.player.x; s.cam.y = s.player.y;
    }""")
    page.wait_for_timeout(700)
    check("Hint points the way", """() => {
        const t = document.getElementById('goals').textContent;
        return /steps (north|south|east|west)/.test(t) && /boat/.test(t) ? 'ok' : 'goal hint has no direction or boat: ' + t;
    }""")

    # sail up and step onto the sand
    page.evaluate("""() => {
        const s = G.state, w = s.world, c = G.Isles.first(w);
        s.inv.boat = 1;
        let spot = null;   // an open strand tile on the island's south side
        for (let r = 3; r < 14 && !spot; r++) for (let a = 0; a < 24 && !spot; a++) {
            const tx = Math.round(c.tx + Math.cos(1.57 + a / 24 * 6.283) * r), ty = Math.round(c.ty + Math.sin(1.57 + a / 24 * 6.283) * r);
            if (w.tileAt(tx, ty).type === 'strand' && !w.isSolid(tx, ty) && !w.structureAt(tx, ty)) spot = { tx, ty };
        }
        s.player.x = (spot.tx + 0.5) * 32; s.player.y = (spot.ty + 0.5) * 32; s.player.moveTarget = null;
        s.cam.x = s.player.x; s.cam.y = s.player.y;
        window._isleSpot = spot;
    }""")
    page.wait_for_timeout(1500)
    page.screenshot(path=str(shots / "100-isle-found.png"))
    check("Island found", """() => {
        const I = G.state.stats.isles;
        if (!I || !I.at.first || I.found !== 1) return 'not found: ' + JSON.stringify(I);
        if (!document.getElementById('place-name').textContent.includes(G.ISLE_NAMES[0])) return 'no place caption';
        if (!G.state.goalsDone.includes('islefind')) return 'the find goal is not done';
        return 'ok';
    }""")

    # gather seashells on the sand, then coral from the boat
    for obj, item, afloat in (("seashell", "shell", False), ("tidepool", "shell", False), ("coral", "coral", True)):
        check("Find " + obj, """() => {
            const s = G.state, w = s.world, c = G.Isles.first(w), afloat = """ + ("true" if afloat else "false") + """;
            for (let r = 0; r < 18; r++) for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
                if (Math.max(Math.abs(x), Math.abs(y)) !== r || w.objectAt(c.tx + x, c.ty + y) !== '""" + obj + """') continue;
                const tx = c.tx + x, ty = c.ty + y + 1;
                if (afloat ? !w.isWater(tx, ty) : (w.isSolid(tx, ty) || w.isWater(tx, ty))) continue;
                for (let j = -2; j <= 3; j++) for (let i = -2; i <= 2; i++) if ((i || j) && w.objectAt(tx + i, ty - 1 + j)) w.harvest(tx + i, ty - 1 + j);
                s.player.x = (tx + 0.5) * 32; s.player.y = (ty + 0.3) * 32; s.player.vx = s.player.vy = 0; s.player.moveTarget = null;
                s.cam.x = s.player.x; s.cam.y = s.player.y;
                return 'ok';
            }
            return 'no """ + obj + """ on the first island';
        }""")
        page.wait_for_timeout(150)
        page.keyboard.press("e")
        page.wait_for_timeout(300)
        check("Got " + item + " from " + obj, "() => (G.state.stats.got." + item + " || 0) > 0 ? 'ok' : 'pressing E gave no " + item + ": ' + JSON.stringify(G.state.inv)")

    # a Shell lantern and a Shell chime on the island: colour comes back, crabs and parrots come out
    page.evaluate("""() => {
        const s = G.state, w = s.world, sp = window._isleSpot;
        s.inv.shell = 10; s.inv.coral = 6; s.inv.wood = 5; s.inv.fibre = 5;
        s.player.x = (sp.tx + 0.5) * 32; s.player.y = (sp.ty + 0.5) * 32; s.player.vx = s.player.vy = 0; s.cam.x = s.player.x; s.cam.y = s.player.y;
        const put = (type, near) => {
            for (let r = 1; r < 7; r++) for (const [dx, dy] of [[r, -1], [-r, -1], [0, -r], [r, 0], [-r, 0], [r, -r], [-r, -r]])
                if (w.canBuild(type, near.tx + dx, near.ty + dy)) { w.build(type, near.tx + dx, near.ty + dy); return { tx: near.tx + dx, ty: near.ty + dy }; }
            return null;
        };
        window._shellL = put('shelllantern', sp); window._chime = put('windchime', sp);
    }""")
    page.wait_for_timeout(4500)
    check("Shell lantern and chime", """() => {
        const s = G.state, L = s.world.lights.find(L => L.type === 'shelllantern');
        if (!L) return 'no shell lantern light';
        if (L.hue !== G.STRUCTURES.shelllantern.lightHue) return 'the shell lantern light is the wrong colour';
        if (!s.travel.stops().some(x => x.type === 'shelllantern')) return 'the shell lantern is not a lantern-road stop';
        if (!window._chime || s.world.count('windchime') < 1) return 'could not hang a shell chime';
        if (!s.isles.anyChime()) return 'the island does not know about its chime';
        return 'ok';
    }""")
    check("Crabs on the sand", """() => {
        const s = G.state;
        if (!s.creatures.list.some(c => c.kind === 'crab')) {   // help one along if the dice were slow
            const sp = window._isleSpot, w = s.world;
            for (let r = 2; r < 8; r++) for (let a = 0; a < 16; a++) {
                const x = (sp.tx + 0.5) * 32 + Math.cos(a) * r * 32, y = (sp.ty + 0.5) * 32 + Math.sin(a) * r * 32;
                if (s.creatures.suits(G.CREATURES.crab, w, x, y)) { s.creatures.spawn('crab', x, y); return 'ok'; }
            }
            return 'no crab on the coloured sand';
        }
        return 'ok';
    }""")
    page.wait_for_timeout(600)
    page.screenshot(path=str(shots / "101-isle-day.png"))
    check("Crabs are drawn and scuttle", """() => {
        const s = G.state, c = s.creatures.list.find(c => c.kind === 'crab');
        if (!c) return 'the crab left';
        const rows = s.creatures.groundRows(); let drawn = false;
        for (const list of rows.values()) if (list.includes(c)) drawn = true;
        if (!drawn) return 'crabs are not in the ground rows (never drawn)';
        const x = c.x, y = c.y;
        for (let i = 0; i < 12; i++) s.creatures.scuttle(c, 0.04, s.world, { x: x - 30, y }, c.x - x + 30, c.y - y, Math.hypot(c.x - x + 30, c.y - y));
        if (Math.hypot(c.x - x, c.y - y) < 3 && c.hide < 0.1) return 'a startled crab neither ran nor hid';
        // the geckos (Night 25) walk the ground too, and are drawn now
        const g = s.creatures.spawn('gecko', c.x, c.y); let gd = false;
        for (const list of s.creatures.groundRows().values()) if (list.includes(g)) gd = true;
        g.gone = true;
        return gd ? 'ok' : 'geckos are still never drawn';
    }""")
    # a sea turtle rises to breathe in the lagoon beside you
    check("Sea turtle", """() => {
        const s = G.state, w = s.world, c = G.Isles.first(w);
        let spot = null;
        for (let r = 6; r < 16 && !spot; r++) for (let a = 0; a < 32 && !spot; a++) {
            const tx = Math.round(c.tx + Math.cos(a / 32 * 6.283) * r), ty = Math.round(c.ty + Math.sin(a / 32 * 6.283) * r);
            if (w.tileAt(tx, ty).type === 'lagoon' && w.tileAt(tx + 1, ty).type === 'lagoon' && w.tileAt(tx - 1, ty).type === 'lagoon') spot = { tx, ty };
        }
        if (!spot) return 'no open lagoon';
        const t = s.creatures.spawn('seaturtle', (spot.tx + 0.5) * 32, (spot.ty + 0.5) * 32);
        t.a = 1; t.surf = 1; t.up = 4; t.breathT = 10;
        s.player.x = t.x; s.player.y = t.y + 70; s.player.vx = s.player.vy = 0; s.cam.x = s.player.x; s.cam.y = s.player.y - 40;
        window._turtle = t;
        return 'ok';
    }""")
    page.wait_for_timeout(500)
    page.screenshot(path=str(shots / "102-isle-turtle.png"))
    check("Met a turtle", """() => {
        const s = G.state, t = window._turtle;
        if (!s.stats.met.seaturtle) return 'never met the sea turtle (surf ' + (t && t.surf) + ')';
        const x = t.x, y = t.y;
        for (let i = 0; i < 20; i++) s.creatures.glide(t, 0.05, s.world, { x, y: y + 20 }, 0, -20, 20);
        return Math.hypot(t.x - x, t.y - y) > 2 ? 'ok' : 'the turtle does not swim';
    }""")

    # a dark night on the island's shore: the tide glows
    page.evaluate("""() => {
        const s = G.state, sp = window._isleSpot, w = s.world;
        // stand on sand right by the lagoon
        let best = sp;
        for (let r = 0; r < 8; r++) for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
            const tx = sp.tx + x, ty = sp.ty + y;
            if (w.tileAt(tx, ty).type === 'strand' && !w.isSolid(tx, ty) && w.tileAt(tx, ty + 1).type === 'lagoon') { best = { tx, ty }; r = 99; break; }
        }
        s.time = Math.floor(s.time / G.DAY_LENGTH + 1) * G.DAY_LENGTH + G.DAY_LENGTH * 0.5; w.time = s.time; s.weather.set('clear', true);
        s.player.x = (best.tx + 0.5) * 32; s.player.y = (best.ty + 0.5) * 32; s.player.moveTarget = null; s.player.vx = s.player.vy = 0;
        s.cam.x = s.player.x; s.cam.y = s.player.y;
    }""")
    page.wait_for_timeout(3000)
    page.screenshot(path=str(shots / "103-isle-night.png"))
    check("The glowing tide", """() => {
        const s = G.state;
        if (!(s.isles.tide > G.ISLES.tide.need)) return 'the tide is not glowing: ' + s.isles.tide.toFixed(2);
        if (!s.stats.isles.glow) return 'standing on the shore at night did not see the glowing tide';
        return 'ok';
    }""")
    page.evaluate("""() => { const s = G.state; s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + 60; s.world.time = s.time; }""")
    page.wait_for_timeout(1300)
    check("No glow by day", """() => G.state.isles.tide < 0.05 ? 'ok' : 'the tide still glows by day: ' + G.state.isles.tide""")

    page.keyboard.press("m")
    page.wait_for_timeout(600)
    page.screenshot(path=str(shots / "104-isle-map.png"))
    page.keyboard.press("m")
    page.keyboard.press("j")
    page.wait_for_timeout(300)
    page.evaluate("() => document.querySelector('.journal-tabs button[data-tab=places]') && document.querySelector('.journal-tabs button[data-tab=places]').click()")
    page.wait_for_timeout(300)
    check("Journal lists the island", """() => {
        const t = document.getElementById('journal').textContent;
        return t.includes(G.ISLE_NAMES[0]) ? 'ok' : 'no island on the Places page';
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
    print("\n".join(errs) if errs else "isles ok")
    sys.exit(1 if errs else 0)
