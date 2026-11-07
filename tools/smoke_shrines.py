"""The Ember Shrines (Night 15): where they stand, offerings at their bowls,
the kindling and its wave of colour, the map and the journal.
Called from smoke_test.py with an open page that is already playing."""


def run(page, shots, errors):
    def check(name, js):
        result = page.evaluate(js)
        if result != "ok":
            errors.append(name + " failed: " + str(result))

    # the data adds up
    check("Shrine data", """() => {
        if (G.SHRINES.length !== G.SHRINE.dist.length) return 'a distance per shrine is needed';
        const w = G.SHRINE_STAMP[0].length; let B = 0, H = 0;
        for (const row of G.SHRINE_STAMP) {
            if (row.length !== w) return 'stamp rows differ in length';
            for (const ch of row) { if (ch === 'B') B++; if (ch === 'H') H++; if (ch !== ' ' && ch !== '.' && !G.SHRINE_PIECES[ch]) return 'unknown letter ' + ch; }
        }
        if (B !== 4 || H !== 1) return 'a shrine needs 4 bowls and 1 hearth, has ' + B + ' and ' + H;
        for (const d of G.SHRINES) {
            if (!d.name || !d.words || d.bowls.length !== 4) return d.id + ' is missing words or bowls';
            for (const c of d.bowls.concat([d.gift])) for (const k in c) if (!G.ITEMS[k]) return d.id + ' wants an unknown item ' + k;
        }
        for (const o of Object.values(G.SHRINE_PIECES)) if (!G.OBJECTS[o] || !G.OBJECT_SPRITES[o]) return 'piece without object or sprite: ' + o;
        for (const k of ['emberflame', 'shrineflame', 'emberlamp']) if (!G.STRUCTURES[k] || !G.STRUCTURE_SPRITES[k]) return 'no structure/sprite ' + k;
        if (!G.RECIPES.find(r => r.builds === 'emberlamp' && r.unlock)) return 'the Ember lantern is not a taught recipe';
        return 'ok';
    }""")

    # four shrines, the same every time, on land, each further out, ruins keep away
    check("Shrine placement", """() => {
        const w = G.state.world, sp = w.spawnSpot(), list = G.Shrines.list(w), w2 = new G.World(w.seed), l2 = G.Shrines.list(w2);
        let prev = 0;
        for (const s of list) {
            const t = l2[s.i];
            if (t.tx !== s.tx || t.ty !== s.ty) return s.id + ' moved in a fresh world';
            const d = Math.hypot(s.tx - sp.tx, s.ty - sp.ty);
            if (d < 30) return s.id + ' is too close to the start (' + d + ')';
            if (d < prev - 6) return s.id + ' is nearer than the shrine before it';
            prev = d;
            for (let y = s.y0; y < s.y0 + s.h; y++) for (let x = s.x0; x < s.x0 + s.w; x++) if (w.isWater(x, y)) return s.id + ' on water at ' + x + ',' + y;
            for (const b of s.bowls) if (w.tileAt(b.tx, b.ty).obj !== 'emberbowl') return s.id + ' has no bowl at ' + b.tx + ',' + b.ty;
            if (w.tileAt(s.tx, s.ty).obj !== 'hearth') return s.id + ' has no hearth';
            for (const r of G.Ruins.around(w, s.tx, s.ty, 1)) if (Math.hypot(r.tx - s.tx, r.ty - s.ty) < G.SHRINE.keepRuinsAway) return 'a ruin stands in ' + s.id;
        }
        return 'ok';
    }""")

    # walk to the first shrine in the daytime
    check("Shrine found", """() => {
        const s = G.state, w = s.world, p = s.player, site = G.Shrines.list(w)[0];
        s.weather.set('clear', true);
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + 30; w.time = s.time;
        window._shrine = site;
        p.x = (site.tx + 0.5) * G.TILE; p.y = (site.ty + 2.6) * G.TILE; p.moveTarget = null;
        s.cam.x = p.x; s.cam.y = p.y - 40;
        return 'ok';
    }""")
    page.wait_for_timeout(1300)
    page.screenshot(path=str(shots / "45-shrine-cold.png"))
    check("Shrine noticed", """() => {
        const s = G.state, site = window._shrine;
        if (!(s.stats.shrines && s.stats.shrines.found[site.id])) return 'walking up did not find the shrine';
        if (s.stats.shrinesFound !== 1) return 'shrinesFound = ' + s.stats.shrinesFound;
        return 'ok';
    }""")

    # a bowl with nothing to give stays cold; with the offering it catches
    page.evaluate("""() => {
        const s = G.state, site = window._shrine, b = site.bowls[0], p = s.player;
        for (const k in site.def.bowls[0]) s.inv[k] = 0;
        p.x = (b.tx + 0.5) * G.TILE; p.y = (b.ty + 1.6) * G.TILE; p.moveTarget = null;
    }""")
    page.keyboard.press("e")
    page.wait_for_timeout(200)
    check("Bowl wants", """() => {
        const w = G.state.world, b = window._shrine.bowls[0];
        if (G.Shrines.isBowlLit(w, b)) return 'a bowl caught without its offering';
        if (!document.getElementById('toast').textContent.includes('wants')) return 'no word about what the bowl wants: ' + document.getElementById('toast').textContent;
        return 'ok';
    }""")
    for i in range(4):
        page.evaluate("""(i) => {
            const s = G.state, site = window._shrine, b = site.bowls[i], p = s.player;
            for (const [k, n] of Object.entries(site.def.bowls[i])) s.inv[k] = (s.inv[k] || 0) + n;
            p.x = (b.tx + 0.5) * G.TILE; p.y = (b.ty + 1.6) * G.TILE; p.moveTarget = null;
            s.cam.x = (site.tx + 0.5) * G.TILE; s.cam.y = (site.ty + 0.5) * G.TILE;
        }""", i)
        page.keyboard.press("e")
        page.wait_for_timeout(250)
    check("Bowls lit", """() => {
        const w = G.state.world, site = window._shrine;
        if (G.Shrines.litBowls(w, site) !== 4) return 'only ' + G.Shrines.litBowls(w, site) + ' bowls burn';
        if (G.state.stats.shrines.bowls !== 4) return 'bowls counted: ' + G.state.stats.shrines.bowls;
        return 'ok';
    }""")
    # the hearth kindles by itself, and the colour rolls out
    page.wait_for_function("() => G.state.shrines.kindling && G.state.shrines.kindling.t > 1.6", timeout=15000)
    page.screenshot(path=str(shots / "46-shrine-kindling.png"))
    page.wait_for_function("() => !G.state.shrines.kindling && document.getElementById('memory').classList.contains('open')", timeout=30000)
    page.wait_for_timeout(700)   # the card fades in
    page.screenshot(path=str(shots / "47-shrine-card.png"))
    page.keyboard.press("e")
    page.wait_for_timeout(300)
    check("Shrine kindled", """() => {
        const s = G.state, w = s.world, site = window._shrine, T = G.TILE;
        if (!G.Shrines.isKindled(w, site)) return 'the hearth is not burning';
        if (s.stats.shrinesLit !== 1) return 'shrinesLit = ' + s.stats.shrinesLit;
        const far = w.restoreAt((site.tx + 20.5) * T, (site.ty + 0.5) * T, w.lights);
        if (far < 0.95) return 'land 20 tiles out is only ' + far.toFixed(2) + ' restored';
        if (!G.Crafting.known(s, G.RECIPES.find(r => r.id === 'emberlamp'))) return 'the Ember lantern was not taught';
        if (!s.explored.has(site.tx + 18, site.ty)) return 'the land around was not revealed on the map';
        if (document.getElementById('memory').classList.contains('open')) return 'the card did not close';
        const L = w.lights.find(L => L.type === 'shrineflame');
        if (!L || L.hue !== site.hue) return 'the hearth light has no ember colour';
        return 'ok';
    }""")
    # it survives saving and loading (structures, no new save fields)
    check("Shrine saved", """() => {
        G.Save.write(G.state);
        const d = G.Save.read(), types = d.structures.map(x => x[0]);
        if (!types.includes('shrineflame')) return 'kindled hearth not saved';
        if (types.filter(t => t === 'emberflame').length < 4) return 'lit bowls not saved';
        const w = new G.World(d.seed); w.loadStructures(d.structures);
        if (!G.Shrines.isKindled(w, G.Shrines.list(w)[0])) return 'a reloaded world forgot the kindled shrine';
        return 'ok';
    }""")
    # at night the hearth throws a beam of light into the sky
    page.evaluate("""() => {
        const s = G.state, site = window._shrine, p = s.player;
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + G.DAY_LENGTH * 0.5; s.world.time = s.time;
        p.x = (site.tx + 0.5) * G.TILE; p.y = (site.ty + 4.5) * G.TILE; p.moveTarget = null;
        s.cam.x = p.x; s.cam.y = p.y - 70;
    }""")
    page.wait_for_timeout(900)
    page.screenshot(path=str(shots / "48-shrine-night.png"))

    # the other shrines: sensed after a few memories, on the map, and an ember arrow points the way
    page.evaluate("""() => {
        const s = G.state, sp = s.world.spawnSpot(), p = s.player;
        s.stats.memories = s.stats.memories || [];
        while (s.stats.memories.length < G.SHRINE.senseMemories) s.stats.memories.push('test' + s.stats.memories.length);
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + 40; s.world.time = s.time;
        p.x = (sp.tx + 0.5) * G.TILE; p.y = (sp.ty + 3.5) * G.TILE; p.moveTarget = null;
        s.cam.x = p.x; s.cam.y = p.y;
    }""")
    page.wait_for_timeout(1200)
    check("Shrines sensed", """() => {
        const s = G.state, nx = G.Shrines.nextToKindle(s);
        if (!s.stats.shrines.sensed) return 'the shrines were not sensed';
        if (G.Shrines.known(s).length !== G.SHRINES.length) return 'not every shrine is known';
        if (!nx || nx.id === window._shrine.id) return 'the guide points at the wrong shrine';
        const j = Object.assign(Object.create(G.Journal.prototype), { state: s }).page_places();
        if (!j.includes(nx.name) || !j.includes('1 of 4 Ember Shrines kindled')) return 'the journal does not list the shrines';
        return 'ok';
    }""")
    page.screenshot(path=str(shots / "49-shrine-guide.png"))
    page.keyboard.press("m")
    page.wait_for_timeout(700)
    page.screenshot(path=str(shots / "50-shrine-map.png"))
    page.keyboard.press("m")
    page.wait_for_timeout(200)
