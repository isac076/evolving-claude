"""Ruins of the old world, memory stones and the journal (Night 11).
Called from smoke_test.py with an open page that is already playing."""


def run(page, shots, errors):
    def check(name, js, arg=None):
        result = page.evaluate(js, arg) if arg is not None else page.evaluate(js)
        if result != "ok":
            errors.append(name + " failed: " + str(result))

    # the data adds up: every stamp is a tidy rectangle with exactly one memory stone
    check("Ruin data", """() => {
        for (const [id, d] of Object.entries(G.RUIN_SITES)) {
            if (!d.name || !d.about || !d.ground || !d.ground.length) return id + ' is missing words or ground';
            const w = d.stamp[0].length;
            if (d.stamp.length > 11 || w > 11) return id + ' is too big for a cell';
            let m = 0;
            for (const row of d.stamp) {
                if (row.length !== w) return id + ' has rows of different lengths';
                for (const ch of row) {
                    if (ch === 'M') m++;
                    if (ch !== ' ' && ch !== '.' && !G.RUIN_PIECES[ch]) return id + ' uses an unknown letter ' + ch;
                }
                const a = row.indexOf('A');
                if (a >= 0 && row[a + 2] !== 'a') return id + ' has an arch without its right foot';
            }
            if (m !== 1) return id + ' needs exactly one memory stone, has ' + m;
        }
        for (const o of Object.values(G.RUIN_PIECES)) if (!G.OBJECTS[o] || !G.OBJECT_SPRITES[o]) return 'piece without object or sprite: ' + o;
        if (!G.STRUCTURE_SPRITES.memorystone) return 'no sprite for an awake memory stone';
        if (G.LORE.length < 10 || G.LORE.some(m => !m.title || !m.text)) return 'the story is too short or has gaps';
        return 'ok';
    }""")

    # ruins are the same every time for a seed, stay off water and away from the start
    check("Ruin placement", """() => {
        const w = G.state.world, sp = w.spawnSpot(), sites = G.Ruins.around(w, sp.tx, sp.ty, 3);
        if (sites.length < 4) return 'only ' + sites.length + ' ruins near the start';
        const w2 = new G.World(w.seed);
        for (const s of sites) {
            const t = G.Ruins.siteOf(w2, ...s.id.split(',').map(Number));
            if (!t || t.kind !== s.kind || t.tx !== s.tx || t.ty !== s.ty) return 'ruin ' + s.id + ' moved in a fresh world';
            if (Math.hypot(s.tx - sp.tx, s.ty - sp.ty) < G.RUIN.awayFromStart) return 'a ruin is too close to the start';
            for (let y = s.y0; y < s.y0 + s.h; y++) for (let x = s.x0; x < s.x0 + s.w; x++) if (w.isWater(x, y)) return 'ruin on water at ' + x + ',' + y;
            if (w.objectAt(s.memory.tx, s.memory.ty) !== 'memory' && !G.Ruins.isRead(w, s)) return 'no memory stone at ' + s.id;
        }
        const kinds = new Set(G.Ruins.around(w, sp.tx, sp.ty, 6).map(s => s.kind));
        if (kinds.size < Object.keys(G.RUIN_SITES).length) return 'only these kinds appear: ' + [...kinds];
        return 'ok';
    }""")

    # walk up to the nearest ruin: it is found, its stones can't be gathered, the memory stone wakes with E
    check("Ruin found", """() => {
        const s = G.state, w = s.world, p = s.player;
        s.weather.set('clear', true);
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + 20; w.time = s.time;
        let best = null;
        for (const site of G.Ruins.around(w, p.tx, p.ty, 3))
            if (!G.Ruins.isRead(w, site) && site.kind !== 'gate' && (!best || Math.hypot(site.tx - p.tx, site.ty - p.ty) < Math.hypot(best.tx - p.tx, best.ty - p.ty))) best = site;
        if (!best) return 'no sleeping ruin nearby';
        window._ruin = best;
        p.x = (best.memory.tx + 0.5) * G.TILE; p.y = (best.memory.ty + 1.55) * G.TILE; p.moveTarget = null;
        s.cam.x = p.x; s.cam.y = p.y - 30;
        return 'ok';
    }""")
    page.wait_for_timeout(1200)
    page.screenshot(path=str(shots / "27-ruin-grey.png"))
    check("Ruin noticed", """() => {
        const s = G.state, r = window._ruin;
        if (!(s.stats.ruins && s.stats.ruins.found[r.id])) return 'walking up to the ruin did not find it';
        if (!(s.stats.ruinsFound >= 1)) return 'ruinsFound not counted';
        const P = Object.keys(G.OBJECTS).filter(k => G.OBJECTS[k].ruin && !G.OBJECTS[k].drops);
        for (const k of P) if (G.Crafting.dropsFor(s, k).stone) return k + ' gives stone';
        return 'ok';
    }""")
    page.evaluate("() => { G.state._mem0 = (G.state.stats.memories || []).length; G.state._lit0 = G.state.world.litCount(); G.state._petal0 = G.state.inv.petal || 0; }")
    page.keyboard.press("e")
    page.wait_for_timeout(1300)
    page.screenshot(path=str(shots / "28-memory-card.png"))
    check("Memory woken", """() => {
        const s = G.state, w = s.world, r = window._ruin;
        if (!document.getElementById('memory').classList.contains('open')) return 'the memory card did not open';
        if (!G.Ruins.isRead(w, r)) return 'the memory stone is not awake';
        if ((s.stats.memories || []).length !== s._mem0 + 1) return 'the memory was not kept';
        if (w.litCount() !== s._lit0 + 1) return 'the awake stone does not light up the land';
        if ((s.inv.petal || 0) !== s._petal0 + G.RUIN.reward.petal) return 'no gift from the stone';
        const i = s.stats.memories.length - 1;
        if (i < G.LORE.length && document.getElementById('memory-title').textContent !== G.LORE[i].title) return 'the card shows the wrong memory';
        if (G.Crafting.pickupBlocker(s, w.structureAt(r.memory.tx, r.memory.ty)) === null) return 'an awake stone can be picked up';
        const f = w.restoreAt((r.memory.tx + 0.5) * G.TILE, (r.memory.ty + 0.5) * G.TILE, w.lights);
        if (f < 0.99) return 'no colour around the awake stone: ' + f;
        return 'ok';
    }""")
    t0 = page.evaluate("() => G.state.time")
    page.wait_for_timeout(400)
    if page.evaluate("() => G.state.time") != t0:
        errors.append("Memory card: the world did not pause while reading")
    page.keyboard.press("e")
    page.wait_for_timeout(700)
    check("Memory card closes", """() => {
        if (document.getElementById('memory').classList.contains('open')) return 'the card is still open';
        if (document.body.classList.contains('paused')) return 'the world is still paused';
        return 'ok';
    }""")
    page.screenshot(path=str(shots / "29-ruin-awake.png"))

    # the next stone tells the next memory, in order
    check("Second memory", """() => {
        const s = G.state, w = s.world, p = s.player, n = s.stats.memories.length;
        const next = G.Ruins.around(w, p.tx, p.ty, 4).find(site => !G.Ruins.isRead(w, site));
        if (!next) return 'no second sleeping ruin';
        p.x = (next.memory.tx + 0.5) * G.TILE; p.y = (next.memory.ty + 1.55) * G.TILE;
        s.cam.x = p.x; s.cam.y = p.y;
        return 'ok';
    }""")
    page.keyboard.press("e")
    page.wait_for_timeout(700)
    check("Second memory text", """() => {
        const s = G.state, i = s.stats.memories.length - 1;
        if (document.getElementById('memory-title').textContent !== G.LORE[i].title) return 'wrong memory: ' + document.getElementById('memory-title').textContent;
        return 'ok';
    }""")
    page.keyboard.press("Escape")
    page.wait_for_timeout(500)

    # night at the ruin: the stone and the keeper's lantern glow
    page.evaluate("""() => {
        const s = G.state, r = window._ruin, p = s.player;
        p.x = (r.memory.tx + 0.5) * G.TILE; p.y = (r.memory.ty + 1.55) * G.TILE; s.cam.x = p.x; s.cam.y = p.y - 30;
        s.time = Math.floor(s.time / G.DAY_LENGTH + 1) * G.DAY_LENGTH + G.DAY_LENGTH * 0.5;
    }""")
    page.wait_for_timeout(1000)
    page.screenshot(path=str(shots / "30-ruin-night.png"))

    # the journal: J opens it, every page draws, arrows flip pages, J closes it
    page.keyboard.press("j")
    page.wait_for_timeout(600)
    page.screenshot(path=str(shots / "31-journal.png"))
    check("Journal memories", """() => {
        const s = G.state;
        if (!document.getElementById('journal').classList.contains('open')) return 'J did not open the journal';
        if (!(s.stats.journal >= 1)) return 'opening the journal was not counted';
        const n = document.querySelectorAll('.j-memory:not(.sleeping)').length;
        if (n !== Math.min(s.stats.memories.length, G.LORE.length)) return 'journal shows ' + n + ' memories';
        return 'ok';
    }""")
    for tab in ["places", "creatures", "friends"]:
        page.keyboard.press("ArrowRight")
        page.wait_for_timeout(250)
        check("Journal " + tab, """(tab) => {
            const on = document.querySelector('.journal-tabs button.on');
            if (!on || on.dataset.tab !== tab) return 'arrow did not turn to ' + tab;
            if (document.getElementById('journal-page').textContent.length < 20) return tab + ' page is empty';
            if (tab === 'places' && !document.querySelector('.j-place.read')) return 'the awake ruin is not listed';
            return 'ok';
        }""", tab)
        if tab == "places":
            page.screenshot(path=str(shots / "32-journal-places.png"))
    page.keyboard.press("j")
    page.wait_for_timeout(500)
    check("Journal closes", """() => document.getElementById('journal').classList.contains('open') ? 'still open' : 'ok'""")

    # saving and loading keeps found ruins and awake stones; a friend can hint at a ruin
    check("Ruins saved", """() => {
        const s = G.state;
        G.Save.write(s);
        const d = G.Save.read();
        if (!d.stats.ruins || !d.stats.ruins.found[window._ruin.id]) return 'found ruin not saved';
        if (!d.structures.some(x => x[0] === 'memorystone')) return 'awake stone not saved';
        if ((d.stats.memories || []).length !== s.stats.memories.length) return 'memories not saved';
        const w2 = new G.World(d.seed); w2.loadStructures(d.structures);
        if (!G.Ruins.isRead(w2, G.Ruins.siteOf(w2, ...window._ruin.id.split(',').map(Number)))) return 'stone asleep again after loading';
        if (!G.VILLAGER_SAYS.ruins.every(l => l.includes('{dir}'))) return 'a ruin hint without a direction';
        return 'ok';
    }""")
