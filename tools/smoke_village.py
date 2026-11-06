"""The growing village (Night 13): cottages close together become a hamlet with a well,
then a market stall, then a green with a ribbon pole and a festival.
Called from smoke_test.py with an open page that is already playing (after the
wishes tests, so there are friends and the cottage recipe is known)."""


def run(page, shots, errors):
    def check(name, js):
        result = page.evaluate(js)
        if result != "ok":
            errors.append(name + " failed: " + str(result))

    check("Village data", """() => {
        for (const st of G.VILLAGE_STAGES) if (!G.STRUCTURES[st.build] || !G.STRUCTURES[st.build].village) return 'stage builds ' + st.build;
        for (const t of G.MARKET_TRADES) for (const k of Object.keys({ ...t.give, ...t.get })) if (!G.ITEMS[k]) return 'trade uses ' + k;
        for (const sd of G.SEASONS) if (!G.FESTIVALS[sd.id]) return 'no festival in ' + sd.id;
        for (const f of Object.values(G.FESTIVALS)) for (const k in f.gift) if (!G.ITEMS[k]) return 'festival gift ' + k;
        for (const k of ['well', 'stall', 'maypole']) if (!G.STRUCTURE_SPRITES[k]) return 'no sprite for ' + k;
        if (!G.MUSIC_MOODS.festival) return 'no festival music';
        if (G.Music.moodFor({ festival: 'Fernbrook', rain: 0, fog: 0, day: 0.1 }) !== 'festival') return 'a festival does not change the music';
        return 'ok';
    }""")

    # an open meadow with a beacon: four friends live there
    check("Village setup", """() => {
        const s = G.state, w = s.world, F = s.villagers, W = s.wishes, T = G.TILE;
        s.weather.set('clear', true);
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + 20; w.time = s.time;
        let c = null, best = 1e9;   // the open land with the fewest trees and rocks
        for (let r = 24; r < 400; r += 5) for (let a = 0; a < 24; a++) {
            const tx = s.player.tx + Math.round(Math.cos(a / 24 * 6.283) * r), ty = s.player.ty + Math.round(Math.sin(a / 24 * 6.283) * r);
            let ok = true, n = 0;
            for (let dy = -7; dy <= 7 && ok; dy++) for (let dx = -7; dx <= 7 && ok; dx++) {
                const t = w.tileAt(tx + dx, ty + dy);
                if (w.isWater(tx + dx, ty + dy) || w.structureAt(tx + dx, ty + dy) || t.ruin) ok = false;
                else if (w.objectAt(tx + dx, ty + dy)) n += G.OBJECTS[w.objectAt(tx + dx, ty + dy)].solid ? 3 : 1;
            }
            if (ok && n < best) { best = n; c = { tx, ty }; }
        }
        if (!c) return 'no open meadow found';
        for (let dy = -7; dy <= 7; dy++) for (let dx = -7; dx <= 7; dx++) if (w.objectAt(c.tx + dx, c.ty + dy)) w.harvest(c.tx + dx, c.ty + dy);
        w.build('beacon', c.tx, c.ty);
        const L = w.lights.find(L => L.type === 'beacon' && Math.floor(L.x / T) === c.tx && Math.floor(L.y / T) === c.ty);
        while (F.list.length < 4) {
            const v = F.make(w, 'vtest' + F.list.length, (c.tx + 0.5) * T, (c.ty + 2) * T);
            v.mode = 'home'; v.f = 1; F.list.push(v);
        }
        s.vfolk = F.list.slice(0, 4).map(v => v.id);
        F.list.slice(0, 4).forEach((v, i) => {
            F.setHome(v, L); v.house = null; v.wish = null; v.wishT = 999; v.state = 'idle'; v.t = 2;
            v.x = (c.tx + 0.5 + (i - 1.5) * 1.5) * T; v.y = (c.ty + 1.6) * T;
        });
        for (const v of F.list.slice(4)) v.wishT = 999;
        s.vc = c;
        s.vspots = [[c.tx - 4, c.ty - 2], [c.tx + 4, c.ty - 2], [c.tx - 4, c.ty + 4], [c.tx + 4, c.ty + 4]];
        for (const [tx, ty] of s.vspots.slice(0, 2)) w.build('cottage', tx, ty);
        W.timer = 0; W.update(0.6, s);
        const owned = s.vspots.slice(0, 2).filter(([tx, ty]) => w.structureAt(tx, ty).owner).length;
        if (owned !== 2) return 'friends did not move into both cottages (' + owned + ')';
        s.player.x = (c.tx + 0.5) * T; s.player.y = (c.ty + 3.2) * T; s.cam.x = s.player.x; s.cam.y = s.player.y - 30;
        return 'ok';
    }""")

    # two homes: a well rises between them, and the hamlet gets a name
    check("Hamlet and well", """() => {
        const s = G.state, w = s.world, V = s.village;
        V.timer = 0; V.update(0.01, s);
        if (V.list.length < 1) return 'two cottages side by side did not make a village';
        const vil = V.list.find(v => v.cottages.some(c => c.tx === s.vspots[0][0] && c.ty === s.vspots[0][1]));
        if (!vil || !vil.has.well) return 'no well was built';
        const well = vil.has.well;
        if (!(well.rise < 1)) return 'the well did not start rising';
        if (!vil.name || vil.name.length < 5) return 'the hamlet has no name';
        if (!G.Crafting.pickupBlocker(s, well)) return 'the well can be picked up';
        V.update(0.01, s);
        if (w.count('stall')) return 'a stall came with only two homes';
        well.rise = 0.45;   // half built, for the picture
        s.vwell = [well.tx, well.ty];
        return 'ok';
    }""")
    page.wait_for_timeout(250)
    page.screenshot(path=str(shots / "40-village-rising.png"))

    check("Market and green", """() => {
        const s = G.state, w = s.world, V = s.village, W = s.wishes;
        V.update(G.VILLAGE.rise + 1, s);
        const well = w.structureAt(s.vwell[0], s.vwell[1]);
        if (well.rise < 1) return 'the well never finished';
        w.build('cottage', s.vspots[2][0], s.vspots[2][1]);
        W.timer = 0; W.update(0.6, s);
        V.timer = 0; V.update(0.01, s);
        if (w.count('stall') !== 1) return 'three homes did not bring a market stall';
        V.update(G.VILLAGE.rise + 1, s);
        w.build('cottage', s.vspots[3][0], s.vspots[3][1]);
        W.timer = 0; W.update(0.6, s);
        V.timer = 0; V.update(0.01, s);
        if (w.count('maypole') !== 1) return 'four homes did not raise a ribbon pole';
        V.update(G.VILLAGE.rise + 1, s);
        V.timer = 0; V.update(0.01, s);
        const vil = V.list.find(v => v.has.maypole);
        if (!vil || vil.homes !== 4 || vil.title !== 'village green') return 'the village did not grow to a green: ' + (vil && vil.title);
        if (!((s.stats.village || {}).firstFest || []).length) return 'no first festival planned';
        // the market: three swaps today, and a swap works
        const t = V.trades(s, vil);
        if (t.length !== G.MARKET.offers) return 'market offers ' + t.length;
        const one = t[0];
        for (const [k, n] of Object.entries(one.give)) s.inv[k] = (s.inv[k] || 0) + n * 3;
        const before = Object.fromEntries(Object.keys(one.get).map(k => [k, s.inv[k] || 0]));
        if (!V.trade(s, vil, one)) return 'a swap failed';
        for (const [k, n] of Object.entries(one.get)) if (s.inv[k] !== before[k] + n) return 'the swap did not give ' + k;
        let left = V.trades(s, vil)[0].left;
        if (left !== G.MARKET.times - 1) return 'swaps left did not go down: ' + left;
        V.trade(s, vil, V.trades(s, vil)[0]);
        if (V.trade(s, vil, V.trades(s, vil)[0])) return 'a swap worked more times than allowed';
        // the well waters plantings around it
        let sp = null;
        for (let r = 1; r < 5 && !sp; r++) for (let dx = -r; dx <= r && !sp; dx++) { const tx = well.tx + dx, ty = well.ty + r + 1; if (w.canBuild('sprout', tx, ty)) sp = [tx, ty]; }
        if (!sp) return 'no room for a sprout by the well';
        w.build('sprout', sp[0], sp[1]);
        const st = w.structureAt(sp[0], sp[1]); st.wet = 0;
        if (!V.drawWater(s, well, s.garden) || !(st.wet > 0)) return 'the well did not water the sprout';
        w.remove(sp[0], sp[1]);
        return 'ok';
    }""")

    # E beside the stall opens the market panel
    check("Market panel", """() => {
        const s = G.state, w = s.world, V = s.village, T = G.TILE, stall = V.list.find(v => v.has.stall).has.stall;
        for (const v of s.villagers.list) { v.x += 400; v.state = 'idle'; v.t = 30; }
        s.player.x = (stall.tx + 0.5) * T; s.player.y = (stall.ty + 1.5) * T; s.cam.x = s.player.x; s.cam.y = s.player.y - 20;
        s.vstall = [stall.tx, stall.ty];
        return 'ok';
    }""")
    page.wait_for_timeout(200)
    page.keyboard.press("e")
    page.wait_for_timeout(700)
    check("Market open", """() => {
        const el = document.getElementById('market');
        if (!el.classList.contains('open')) return 'E beside the stall did not open the market';
        if (el.querySelectorAll('.trade').length !== G.MARKET.offers) return 'the market shows ' + el.querySelectorAll('.trade').length + ' swaps';
        if (!document.body.classList.contains('market-open')) return 'the minimap still shows through the market';
        return 'ok';
    }""")
    page.screenshot(path=str(shots / "41-market.png"))
    page.keyboard.press("Escape")
    page.wait_for_timeout(500)
    check("Market closed", """() => document.getElementById('market').classList.contains('open') ? 'Esc did not close the market'
        : document.body.classList.contains('market-open') ? 'the minimap stayed hidden after the market closed'
        : document.getElementById('settings').classList.contains('open') ? 'Esc opened the resting menu instead' : 'ok'""")

    # by day the village stands in the sun
    check("Village by day", """() => {
        const s = G.state, c = s.vc, T = G.TILE, F = s.villagers;
        F.list.forEach((v, i) => { if (s.vfolk.includes(v.id)) { v.x = (c.tx - 1 + i) * T; v.y = (c.ty + 2.4) * T; v.state = 'idle'; v.t = 20; v.say = null; } });
        s.player.x = (c.tx + 0.5) * T; s.player.y = (c.ty + 3.5) * T; s.cam.x = s.player.x; s.cam.y = (c.ty + 1) * T;
        return 'ok';
    }""")
    page.wait_for_timeout(900)
    page.screenshot(path=str(shots / "42-village.png"))

    # dusk: friends meet at the well
    check("Evening at the well", """() => {
        const s = G.state, V = s.village, F = s.villagers;
        s.time = Math.floor(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + G.DAY_LENGTH * 0.2; s.world.time = s.time;
        const v = F.list.find(o => o.id === s.vfolk[0]);
        let spot = null;
        for (let i = 0; i < 40 && !spot; i++) spot = V.evening(v, s);
        if (!spot || spot.at.type !== 'well') return 'nobody wants to meet at the well at dusk';
        s.time += G.DAY_LENGTH * 0.25; s.world.time = s.time;
        for (let i = 0; i < 20; i++) if (V.evening(v, s)) return 'friends meet at the well in the middle of the night';
        return 'ok';
    }""")

    # the first festival: everyone dances around the ribbon pole at night, lanterns float up
    check("Festival", """() => {
        const s = G.state, V = s.village, F = s.villagers, T = G.TILE;
        s.time = Math.floor(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + G.DAY_LENGTH * 0.36; s.world.time = s.time;
        const pole = V.list.find(v => v.has.maypole).has.maypole;
        s.player.x = (pole.tx + 2.5) * T; s.player.y = (pole.ty + 2.6) * T; s.cam.x = (pole.tx + 0.5) * T; s.cam.y = (pole.ty + 0.2) * T;
        const gifts = s.stats.festivals || 0;
        V.timer = 0; V.update(0.01, s);
        if (V.fests.size !== 1) return 'no festival on the first night';
        const fest = [...V.fests.values()][0];
        if (fest.dancers.length < 4) return 'only ' + fest.dancers.length + ' dancers';
        if (fest.dancers.some(v => v.state !== 'dance')) return 'a dancer is not dancing';
        if ((s.stats.festivals || 0) !== gifts + 1) return 'joining the festival was not counted';
        if (!V.festivalNear(s.player)) return 'the music does not know the festival is near';
        F.update(0.1, s, 1100, 680);
        if (fest.dancers.some(v => v.state === 'sleep' || v.state === 'tobed')) return 'dancers went to bed during the festival';
        for (const v of fest.dancers) v.say = null;
        return 'ok';
    }""")
    page.wait_for_timeout(4200)
    page.screenshot(path=str(shots / "43-festival-night.png"))
    check("Festival lights", """() => {
        const V = G.state.village;
        if (!V.lanterns.length) return 'no sky lanterns rose';
        const fest = [...V.fests.values()][0];
        if (!fest) return 'the festival ended too soon';
        const pole = fest.pole, T = G.TILE;
        if (fest.dancers.some(v => Math.hypot(v.x - (pole.tx + 0.5) * T, v.y - (pole.ty + 0.75) * T) > G.VILLAGE.ring * T + 30)) return 'a dancer is not in the ring';
        return 'ok';
    }""")
    check("Festival ends", """() => {
        const s = G.state, V = s.village;
        const dancers = [...V.fests.values()][0].dancers;
        s.time = Math.floor(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + G.DAY_LENGTH * 0.5; s.world.time = s.time;
        V.timer = 0; V.update(0.01, s);
        if (V.fests.size) return 'the festival did not end';
        if (dancers.some(v => v.festival || v.state === 'dance')) return 'a friend kept dancing';
        if (((s.stats.village || {}).firstFest || []).length) return 'the first festival is still waiting';
        // only on the last day of a season after that
        s.time = Math.floor(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + G.DAY_LENGTH * 1.25; s.world.time = s.time;
        G.Seasons.update(s, true);
        const vil = V.list.find(v => v.has.maypole), last = G.Seasons.phase(s.time).day === G.SEASON.days;
        if (V.festivalOn(vil, s) !== last) return 'festival evening on the wrong day';
        return 'ok';
    }""")

    # saved and loaded: the village buildings come back; the journal and map know the village
    check("Village saves", """() => {
        const s = G.state;
        G.Save.write(s);
        const d = G.Save.read();
        for (const k of ['well', 'stall', 'maypole']) if (!d.structures.some(x => x[0] === k)) return k + ' was not saved';
        const w2 = new G.World(d.seed); w2.loadStructures(d.structures);
        if (w2.count('maypole') !== 1) return 'the ribbon pole did not load';
        const vil = s.village.list.find(v => v.has.maypole);
        const j = document.createElement('div'); j.innerHTML = G.Journal.prototype.page_places.call({ state: s, villages: G.Journal.prototype.villages, ruinPlaces: G.Journal.prototype.ruinPlaces });
        if (!j.textContent.includes(vil.name)) return 'the journal does not list the village';
        return 'ok';
    }""")
