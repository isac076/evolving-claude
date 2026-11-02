"""Friends' wishes and cottages (Night 10).
Called from smoke_test.py with an open page that is already playing (after the
village tests, so there are friends living by the beacon)."""


def run(page, shots, errors):
    def check(name, js):
        result = page.evaluate(js)
        if result != "ok":
            errors.append(name + " failed: " + str(result))

    # the data adds up: every wish names real items, buildings and kinds
    check("Wish data", """() => {
        const types = ['bring', 'build', 'stat', 'house'], stats = ['planted', 'flowers', 'lights', 'friends'];
        let easy = 0;
        for (const [id, w] of Object.entries(G.WISHES)) {
            if (!types.includes(w.type)) return id + ' has an unknown type';
            if (!w.text || !w.short || !w.thanks) return id + ' is missing words';
            for (const k of Object.keys({ ...(w.items || {}), ...(w.reward || {}) })) if (!G.ITEMS[k]) return id + ' uses an unknown item ' + k;
            if (w.type === 'bring' && !w.items) return id + ' brings nothing';
            if (w.type === 'build' && (!G.STRUCTURES[w.structure] || !w.n)) return id + ' builds something unknown';
            if (w.type === 'stat' && (!stats.includes(w.stat) || !w.n)) return id + ' counts something unknown';
            for (const k of w.kinds || []) if (!G.VILLAGER_KINDS[k]) return id + ' names an unknown kind ' + k;
            if (w.easy) easy++;
        }
        for (const k in G.VILLAGER_KINDS) if (!Object.values(G.WISHES).some(w => w.easy && (!w.kinds || w.kinds.includes(k)))) return k + ' has no easy first wish';
        if (!G.RECIPES.some(r => r.unlock === G.WISH.unlockFirst)) return 'the first wish unlocks no recipe';
        return 'ok';
    }""")

    # a wish is heard, then granted: items taken, a heart, a gift, the cottage recipe learned
    check("Wish granted", """() => {
        const s = G.state, F = s.villagers, W = s.wishes, w = s.world, T = G.TILE;
        if (!W || F.list.length < 2) return 'need two friends, have ' + F.list.length;
        s.weather.set('clear', true);
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + 15; w.time = s.time;
        s.stats.unlocked = [];
        const v = F.list[0], today = Math.floor(s.time / G.DAY_LENGTH);
        v.giftDay = today; v.state = 'idle'; v.t = 5; v.hearts = 0; v.wishes = 0;
        v.wish = { id: 'petals', base: 0, known: false };
        s.inv.petal = 0;
        s.player.x = v.x + 30; s.player.y = v.y + 4; s.cam.x = s.player.x; s.cam.y = s.player.y;
        if (W.canGrant(v, s)) return 'a wish could be granted without the petals';
        F.talk(v, s);
        if (!v.wish.known || !(s.stats.wishesHeard >= 1)) return 'talking did not tell the wish';
        if (!v.say || !v.say.includes('petal')) return 'the friend did not say their wish: ' + v.say;
        s.inv.petal = 5;
        if (!W.canGrant(v, s)) return 'carrying the petals does not make the wish grantable';
        const seeds = s.inv.seed || 0, before = s.stats.wishes || 0;
        v.say = null; F.talk(v, s);
        if (v.wish) return 'the wish is still open after talking with the petals';
        if (s.inv.petal !== 2) return 'the petals were not taken: ' + s.inv.petal;
        if ((s.inv.seed || 0) !== seeds + 2) return 'no gift back';
        if (v.hearts !== 1 || s.stats.wishes !== before + 1) return 'no heart for a granted wish';
        if (!(s.stats.unlocked || []).includes('cottage')) return 'the cottage recipe was not learned';
        if (G.Crafting.blocker(s, G.RECIPES.find(r => r.id === 'cottage')) === 'locked') return 'cottage recipe still locked';
        // a brand-new world does not know the cottage
        if (G.Crafting.known({ stats: {} }, G.RECIPES.find(r => r.id === 'cottage'))) return 'cottage known without a friend teaching it';
        // a second friend wishes for paths near their home; building them makes it come true
        const v2 = F.list[1];
        v2.state = 'idle'; v2.giftDay = today;
        v2.wish = { id: 'paths', base: W.counter(G.WISHES.paths, v2, s), known: true };
        let n = 0;
        for (let r = 1; r < 6 && n < 3; r++) for (let dx = -r; dx <= r && n < 3; dx++) {
            const tx = v2.home.tx + dx, ty = v2.home.ty + r + 1;
            if (w.canBuild('path', tx, ty)) { w.build('path', tx, ty); n++; }
        }
        if (n < 3) return 'no room for paths';
        W.timer = 0; W.update(0.6, s);
        if (!v2.wish.ready || !W.canGrant(v2, s)) return 'building the paths did not make the wish come true';
        // a third wish waits unheard, for the screenshot
        if (F.list[2]) F.list[2].wish = { id: 'flowerbed', base: 99, known: false };
        for (const o of F.list) { o.say = null; o.greetCd = 60; o.state = 'idle'; o.t = 30; }
        v2.x = v.x + 70; v2.y = v.y + 10;
        if (F.list[2]) { F.list[2].x = v.x - 60; F.list[2].y = v.y + 20; }
        F.say(v, 'Look — a heart for every wish that came true!', 30);
        return 'ok';
    }""")
    page.wait_for_timeout(900)
    page.screenshot(path=str(shots / "23-wishes.png"))
    check("Wishes panel", """() => {
        const el = document.getElementById('wishes');
        if (!el.classList.contains('show')) return 'the wishes panel is hidden';
        if (!el.querySelector('.wish.ready')) return 'a ready wish is not shown as ready: ' + el.innerHTML;
        const r = el.getBoundingClientRect(), g = document.getElementById('goals').getBoundingClientRect();
        if (document.getElementById('goals').classList.contains('show') && r.top < g.bottom - 1 && r.bottom > g.top) return 'the wishes panel covers the goals';
        return 'ok';
    }""")

    # a cottage near a friend's light: they move in, sleep inside at night, and it all saves
    check("Cottage", """() => {
        const s = G.state, F = s.villagers, W = s.wishes, w = s.world, T = G.TILE, v = F.list[0];
        F.list[1].wish = null;
        let spot = null;
        for (let r = 5; r < 8 && !spot; r++) for (let dx = -r; dx <= r && !spot; dx++) for (const dy of [-r, r - 1]) {
            const tx = v.home.tx + dx, ty = v.home.ty + dy;
            if (w.canBuild('cottage', tx, ty) && !w.isSolid(tx, ty + 1) && !w.structureAt(tx, ty + 1) && !w.isSolid(tx - 1, ty) && !w.isSolid(tx + 1, ty)) { spot = [tx, ty]; break; }
        }
        if (!spot) return 'no room for a cottage';
        for (const o of F.list) if (o !== v) o.house = null;
        w.build('cottage', spot[0], spot[1]);
        W.timer = 0; W.update(0.6, s);
        if (!v.house && !F.list.some(o => o.house)) return 'nobody moved into the cottage';
        const owner = F.list.find(o => o.house);
        if (w.structureAt(spot[0], spot[1]).owner !== owner) return 'the cottage does not know its owner';
        s.cottage = spot; s.cottageOwner = owner.id;
        // save and load: the house, hearts and wishes come back
        G.Save.write(s);
        const d = G.Save.read(), saved = d.villagers.list.find(o => o.id === owner.id);
        if (!saved.house || saved.house[0] !== spot[0]) return 'the house was not saved';
        const F2 = new G.Villagers(); F2.wishes = new G.Wishes(F2); F2.load(d.villagers, w, s.player);
        const back = F2.list.find(o => o.id === owner.id);
        if (!back.house || back.hearts !== owner.hearts) return 'the house or hearts did not load';
        const v1 = F2.list.find(o => o.id === v.id);
        if (v1.hearts !== 1) return 'hearts did not load: ' + v1.hearts;
        // an old save (no wishes at all) still loads
        const F3 = new G.Villagers(); F3.wishes = new G.Wishes(F3);
        F3.load({ rescued: ['x'], list: [{ id: 'x', name: 'Moss', kind: 'gardener', hue: 120, home: d.villagers.list[0].home, gift: -1 }], follow: [] }, w, s.player);
        if (F3.list.length !== 1 || F3.list[0].wish || F3.list[0].house) return 'an old villager did not load cleanly';
        // stand by the cottage in daylight
        s.player.x = (spot[0] + 2.2) * T; s.player.y = (spot[1] + 1.4) * T; s.cam.x = s.player.x; s.cam.y = s.player.y - 20;
        for (const o of F.list) { o.say = null; o.greetCd = 60; }   // quiet, for the picture
        owner.x = (spot[0] + 0.5) * T + 26; owner.y = (spot[1] + 1.3) * T; owner.state = 'idle'; owner.t = 20;
        return 'ok';
    }""")
    page.wait_for_timeout(900)
    page.screenshot(path=str(shots / "24-cottage.png"))
    check("Cottage at night", """() => {
        const s = G.state, F = s.villagers, owner = F.list.find(o => o.id === s.cottageOwner), d = s.wishes.door(owner);
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + G.DAY_LENGTH * 0.5; s.world.time = s.time;
        owner.x = d.x; owner.y = d.y; owner.bed = null;
        return 'ok';
    }""")
    page.wait_for_timeout(1600)
    page.screenshot(path=str(shots / "25-cottage-night.png"))
    check("Sleeping inside", """() => {
        const s = G.state, F = s.villagers, W = s.wishes, w = s.world, owner = F.list.find(o => o.id === s.cottageOwner);
        if (!F.indoors(owner)) return 'the owner is not asleep inside at night (state ' + owner.state + ')';
        if ([...F.rows().values()].some(a => a.includes(owner))) return 'a friend asleep inside is still drawn';
        // picking the cottage up sends them back out
        w.remove(s.cottage[0], s.cottage[1]);
        W.timer = 0; W.update(0.6, s);
        if (owner.house) return 'the friend still lives in a cottage that is gone';
        if (F.indoors(owner)) return 'the friend is stuck inside a cottage that is gone';
        w.build('cottage', s.cottage[0], s.cottage[1]);
        return 'ok';
    }""")

    # on a phone the wishes list sits above the goal tracker, never on top of it
    page.set_viewport_size({"width": 390, "height": 800})
    check("Wishes on a phone", """() => {
        const s = G.state, F = s.villagers;
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + 10; s.world.time = s.time;
        F.list[0].wish = { id: 'petals', base: 0, known: true }; F.list[1].wish = { id: 'lantern', base: 99, known: false };
        return 'ok';
    }""")
    page.wait_for_timeout(1200)
    page.screenshot(path=str(shots / "26-phone-wishes.png"))
    check("Wishes panel on a phone", """() => {
        const el = document.getElementById('wishes'), g = document.getElementById('goals');
        if (!el.classList.contains('show')) return 'hidden on a phone';
        const r = el.getBoundingClientRect(), q = g.getBoundingClientRect();
        if (g.classList.contains('show') && r.bottom > q.top + 1 && r.top < q.bottom) return 'covers the goals on a phone';
        if (r.top < 0) return 'off the top of the screen';
        return 'ok';
    }""")
    page.set_viewport_size({"width": 1100, "height": 680})
