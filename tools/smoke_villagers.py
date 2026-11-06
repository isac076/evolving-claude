"""Villagers (Night 6): lost spirits, followers, settling, talking, day and night, saving, rehoming.
Called from smoke_test.py with an open page that is already playing (split out on Night 14)."""


def run(page, SHOTS, errors):
    # villagers: find the first lost spirit, lead it home, fill a little
    # village, watch their day and night, talk, save and load them
    result = page.evaluate("""() => {
        const s = G.state, F = s.villagers, w = s.world, T = G.TILE;
        if (!F) return 'no villagers';
        for (const k in G.VILLAGER_KINDS) {
            const d = G.VILLAGER_KINDS[k];
            if (!G.STRUCTURES[d.likes]) return k + ' likes an unknown structure ' + d.likes;
            if (!G.VILLAGER_HATS[d.hat]) return k + ' has no hat ' + d.hat;
            for (const i in d.gift) if (!G.ITEMS[i]) return k + ' gives an unknown item ' + i;
            if (!d.lines.length || !d.wish || !d.visit) return k + ' has nothing to say';
        }
        F.reset();
        const f = F.firstSpot(w);
        if (!f) return 'no first lost spirit near the Heart Stone';
        if (w.restoreAt((f.tx + 0.5) * T, (f.ty + 0.5) * T, w.lights) > 0.3) return 'first spirit is already in coloured land';
        let n = 0;
        for (let cy = -12; cy < 12; cy++) for (let cx = -12; cx < 12; cx++) if (F.spotOf(w, cx, cy)) n++;
        if (n < 5) return 'too few lost spirits in the world: ' + n;
        s.time = Math.floor(s.time / G.DAY_LENGTH + 1) * G.DAY_LENGTH + G.DAY_LENGTH * 0.08;
        s.player.x = (f.tx + 0.5) * T + 95; s.player.y = (f.ty + 0.5) * T + 10;
        s.cam.x = s.player.x - 40; s.cam.y = s.player.y;
        F.refreshLost(w, s.cam);
        if (!F.lost.get('first')) return 'first lost spirit did not appear';
        return 'ok';
    }""")
    if result != "ok":
        errors.append("Villager setup failed: " + str(result))
    page.wait_for_timeout(1800)
    page.screenshot(path=str(SHOTS / "15-lost-spirit.png"))
    result = page.evaluate("""() => {
        const s = G.state, F = s.villagers, v = F.lost.get('first');
        if (!v) return 'lost spirit wandered off';
        const before = s.stats.spiritsFound || 0;
        s.player.x = v.x + 12; s.player.y = v.y + 4;
        F.update(0.05, s, 1100, 680);
        if (F.followers.length !== 1 || F.lost.has('first')) return 'spirit did not take your light';
        if ((s.stats.spiritsFound || 0) !== before + 1) return 'finding was not counted';
        s.player.x += 70; s.cam.x = s.player.x; s.cam.y = s.player.y;
        return 'ok';
    }""")
    if result != "ok":
        errors.append("Lost spirit check failed: " + str(result))
    page.wait_for_timeout(900)
    page.screenshot(path=str(SHOTS / "16-follow.png"))
    result = page.evaluate("""() => {
        const s = G.state, F = s.villagers, w = s.world, T = G.TILE, spot = window.__shop;
        // walk into the beacon's light: the follower settles there
        const B = w.lights.find(L => L.type === 'beacon');
        if (!B) return 'no beacon from the workshop test';
        s.player.x = B.x - 40; s.player.y = B.y + 50; s.cam.x = s.player.x; s.cam.y = s.player.y;
        for (let i = 0; i < 40; i++) F.update(0.05, s, 1100, 680);
        if (F.followers.length || F.list.length !== 1) return 'follower did not settle (' + F.followers.length + ' following, ' + F.list.length + ' home)';
        if (!F.rescued.has('first')) return 'rescue not remembered';
        // more friends move in: the beacon has room for 4, then it is full
        const kinds = Object.keys(G.VILLAGER_KINDS);
        for (let i = 0; i < 3; i++) {
            const v = F.make(w, 'test' + i, B.x + 30 * i - 30, B.y + 40);
            v.kind = kinds[(i + 1) % kinds.length]; v.def = G.VILLAGER_KINDS[v.kind]; v.hue = v.def.hues[0];
            const h = F.homeFor(w, v.x, v.y);
            if (!h || !h.light) return 'no home for friend ' + i;
            F.settle(v, h.light, s);
        }
        if (F.living(F.lightKey(B)) !== 4) return 'beacon should have 4 friends: ' + F.living(F.lightKey(B));
        const full = F.homeFor(w, B.x, B.y + 40);
        if (full && full.light === B) return 'a full beacon still offered a home';
        if (new Set(F.list.map(v => v.name)).size !== F.list.length) return 'two friends share a name';
        // send each friend to something they love, and hear one speak
        for (const v of F.list) {
            v.say = null;
            const g = F.findLiked(w, v);
            if (g) { v.x = g.x; v.y = g.y; v.state = 'busy'; v.t = 60; v.goal = g; }
        }
        const talker = F.list[0];
        talker.giftDay = -1;
        const inv = JSON.stringify(s.inv), talks = s.stats.talks || 0;
        F.talk(talker, s);
        if (JSON.stringify(s.inv) === inv) return 'no gift on the first talk of the day';
        if ((s.stats.talks || 0) !== talks + 1 || !talker.say) return 'talking did not work';
        const g2 = JSON.stringify(s.inv); F.talk(talker, s);
        if (JSON.stringify(s.inv) !== g2) return 'a second gift on the same day';
        s.player.x = B.x - 20; s.player.y = B.y + 90; s.cam.x = s.player.x; s.cam.y = s.player.y - 20;
        return 'ok';
    }""")
    if result != "ok":
        errors.append("Village check failed: " + str(result))
    page.wait_for_timeout(1500)
    page.screenshot(path=str(SHOTS / "17-village.png"))
    result = page.evaluate("""() => {
        const s = G.state, F = s.villagers, w = s.world;
        // night: everyone walks home to sleep beside their light
        s.time = Math.floor(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + G.DAY_LENGTH * 0.5;
        for (const v of F.list) { v.t = 0; v.say = null; }
        for (let i = 0; i < 600; i++) F.update(0.05, s, 1100, 680);
        const awake = F.list.filter(v => v.state !== 'sleep');
        if (awake.length) return 'not asleep at night: ' + awake.map(v => v.name + ':' + v.state);
        // save and load the village
        G.Save.write(s);
        const d = G.Save.read();
        if (!d.villagers || d.villagers.list.length !== F.list.length) return 'villagers were not saved';
        const F2 = new G.Villagers(); F2.load(d.villagers, w, s.player);
        if (F2.list.map(v => v.name + v.home.key).join() !== F.list.map(v => v.name + v.home.key).join()) return 'villagers did not load the same';
        if (!F2.rescued.has('first')) return 'rescued spirits not loaded';
        const F3 = new G.Villagers(); F3.load(undefined, w, s.player);
        if (F3.list.length || F3.followers.length) return 'a save without villagers should load empty';
        return 'ok';
    }""")
    if result != "ok":
        errors.append("Village night check failed: " + str(result))
    page.wait_for_timeout(1500)
    page.screenshot(path=str(SHOTS / "18-village-night.png"))
    result = page.evaluate("""() => {
        const s = G.state, F = s.villagers, w = s.world, T = G.TILE;
        // pick the beacon up: its friends move to another light
        const B = w.lights.find(L => L.type === 'beacon');
        G.Crafting.pickUp(s, Math.floor(B.x / T), Math.floor(B.y / T));
        for (let i = 0; i < 60; i++) F.update(0.05, s, 1100, 680);
        for (const v of F.list) if (!w.structureAt(v.home.tx, v.home.ty)) return v.name + ' was left without a home';
        return 'ok';
    }""")
    if result != "ok":
        errors.append("Rehoming check failed: " + str(result))
