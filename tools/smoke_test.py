"""Opens the game in a headless browser, plays for a few seconds, and fails if
anything crashes. Also saves screenshots to tools/screenshots/ so changes can
be looked at.

Run:  python3 tools/smoke_test.py
Needs: pip install playwright && python3 -m playwright install chromium
"""
import pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = ROOT / "tools" / "screenshots"


def main():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("playwright not installed - skipping browser test")
        return 0
    SHOTS.mkdir(exist_ok=True)
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        page = browser.new_page(viewport={"width": 1100, "height": 680})
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

        page.goto((ROOT / "index.html").as_uri())
        page.wait_for_timeout(800)
        page.screenshot(path=str(SHOTS / "1-title.png"))

        page.goto((ROOT / "index.html").as_uri() + "?autostart")
        page.wait_for_timeout(500)
        # walk around, gather, open crafting
        for key in ["d", "s", "a", "w"]:
            page.keyboard.down(key); page.wait_for_timeout(600); page.keyboard.up(key)
            page.keyboard.press("e")
        page.keyboard.press("c"); page.wait_for_timeout(400)
        page.screenshot(path=str(SHOTS / "2-day.png"))
        page.keyboard.press("c")
        # give materials, build a lantern, jump to night
        page.evaluate("""() => {
            const s = G.state; s.inv = {wood: 20, stone: 20, petal: 20};
            const p = s.player;
            const tx = p.tx + 3, ty = p.ty;
            for (let dx = 2; dx < 6; dx++) if (s.world.canBuild('lantern', p.tx + dx, p.ty)) { s.world.build('lantern', p.tx + dx, p.ty); break; }
            s.time = Math.floor(s.time / G.DAY_LENGTH + 1) * G.DAY_LENGTH + G.DAY_LENGTH * 0.5;
        }""")
        page.wait_for_timeout(1500)
        page.screenshot(path=str(SHOTS / "3-night.png"))
        result = page.evaluate("() => G.state.creatures.list.some(c => c.kind === 'moth') ? 'ok' : 'no moths around the lantern at night'")
        if result != "ok":
            errors.append(result)

        # goals + map: finish the first goals, walk to reveal the map, open it
        result = page.evaluate("""() => {
            const s = G.state;
            if (!document.querySelector('#goals .goal-text')) return 'goal tracker is empty';
            s.stats.got = { wood: 5, stone: 5, petal: 5 };
            if (s.explored.count < 300) return 'start area not explored: ' + s.explored.count;
            return 'ok';
        }""")
        if result != "ok":
            errors.append("Goals check failed: " + str(result))
        page.keyboard.down("d"); page.wait_for_timeout(1500); page.keyboard.up("d")
        page.wait_for_timeout(5000)   # goals celebrate one by one
        page.screenshot(path=str(SHOTS / "4-goals-minimap.png"))
        page.keyboard.press("m"); page.wait_for_timeout(700)
        page.screenshot(path=str(SHOTS / "5-map.png"))
        result = page.evaluate("""() => {
            const s = G.state;
            const need = ['wood', 'stone', 'petal', 'lantern', 'map'];
            for (const id of need) if (!s.goalsDone.includes(id)) return 'goal not done: ' + id + ' (done: ' + s.goalsDone + ')';
            if (!document.body.classList.contains('map-open')) return 'map did not open';
            // save, then load the save back and compare the explored map
            G.Save.write(s);
            const d = G.Save.read();
            if (d.version !== G.Save.VERSION) return 'bad save version';
            const e = new G.Explored(); e.load(d.explored);
            if (e.count !== s.explored.count) return 'explored map did not survive saving: ' + e.count + ' vs ' + s.explored.count;
            // an old version-1 save must still load
            const old = { version: 1, seed: 5, time: 10, player: { x: 0, y: 0 }, inv: { wood: 1 }, stats: { gathered: 1, built: 1 },
                          structures: [['heart', 0, 0], ['lantern', 3, 0]], harvested: [] };
            localStorage.setItem(G.Save.KEY, JSON.stringify(old));
            const u = G.Save.read();
            if (!u || u.version !== 2 || !u.goalsDone.includes('lantern') || !u.stats.got) return 'v1 save did not upgrade';
            G.Save.write(s);
            return 'ok';
        }""")
        if result != "ok":
            errors.append("Map/save check failed: " + str(result))
        page.keyboard.press("m"); page.wait_for_timeout(300)

        # sound: the engine should have woken on the first key press; play
        # every effect and footstep and run the soundscape through day/night
        result = page.evaluate("""async () => {
            const S = G.Sound;
            if (!S.ctx) return 'no AudioContext was created';
            await S.ctx.resume();
            if (S.ctx.state !== 'running') return 'AudioContext state: ' + S.ctx.state;
            S.setMuted(false);
            for (const k of Object.keys(G.SFX)) G.SFX[k](S, { pan: 0.3 });
            for (const k of Object.keys(G.STEP_SOUNDS)) G.STEP_SOUNDS[k](S, { alt: true });
            for (const t of Object.values(G.TILES)) if (t.step && !G.STEP_SOUNDS[t.step]) return 'missing step sound ' + t.step;
            for (const o of Object.values(G.OBJECTS)) if (o.sound && !G.SFX[o.sound]) return 'missing sfx ' + o.sound;
            for (const o of Object.values(G.STRUCTURES)) if (o.sound && !G.SFX[o.sound]) return 'missing sfx ' + o.sound;
            for (const day of [0, 1]) for (const r of [0, 1])
                for (let i = 0; i < 60; i++) G.Ambience.update(0.1, { restore: r, day, water: 0.5, active: true });
            document.getElementById('btn-sound').click();
            if (!S.muted) return 'mute button did not mute';
            document.getElementById('btn-sound').click();
            return 'ok';
        }""")
        if result != "ok":
            errors.append("Sound check failed: " + str(result))
        page.wait_for_timeout(300)

        # wildlife: by day in restored land, creatures arrive and behave
        result = page.evaluate("""() => {
            const s = G.state, w = s.world, T = G.TILE;
            // find a shore (grass beside water) near the start and restore it
            const p0 = s.player;
            let spot = null;
            for (let r = 2; r < 60 && !spot; r++) for (let dx = -r; dx <= r && !spot; dx++) for (const dy of [-r, r]) {
                const tx = p0.tx + dx, ty = p0.ty + dy;
                if (w.tileAt(tx, ty).type === 'grass' && w.isWater(tx + 3, ty) && !w.isSolid(tx, ty)) { spot = { tx, ty }; break; }
            }
            if (!spot) return 'no shore found';
            for (const [ox, oy] of [[-2, -2], [-6, 3], [2, 5], [-9, -4]])
                if (w.canBuild('lantern', spot.tx + ox, spot.ty + oy)) w.build('lantern', spot.tx + ox, spot.ty + oy);
            s.player.x = (spot.tx + 0.5) * T; s.player.y = (spot.ty + 0.5) * T;
            s.cam.x = s.player.x; s.cam.y = s.player.y;
            s.time = Math.floor(s.time / G.DAY_LENGTH + 1) * G.DAY_LENGTH + 5;   // bright morning
            const L = s.creatures;
            L.clear();
            const x = s.player.x, y = s.player.y;
            L.spawn('rabbit', x - 130, y + 40); L.spawn('butterfly', x + 20, y - 70); L.spawn('butterfly', x - 60, y - 30);
            L.spawn('fish', (spot.tx + 3.5) * T, (spot.ty + 0.5) * T);
            window.__spot = spot;
            return 'ok';
        }""")
        if result != "ok":
            errors.append("Wildlife setup failed: " + str(result))
        page.wait_for_timeout(4000)
        page.screenshot(path=str(SHOTS / "6-wildlife.png"))
        result = page.evaluate("""() => {
            const s = G.state, L = s.creatures;
            const kinds = new Set(L.list.map(c => c.kind));
            for (const k of ['rabbit', 'butterfly', 'fish']) if (!kinds.has(k)) return 'missing ' + k + ' (have ' + [...kinds] + ')';
            if (L.list.length < 5) return 'too few creatures arrived: ' + L.list.length;
            if (Object.keys(s.stats.met).length < 2) return 'meeting creatures was not counted: ' + JSON.stringify(s.stats.met);
            for (const k in G.CREATURES) {
                if (!G.CREATURE_SPRITES[k]) return 'no sprite for ' + k;
                if (typeof L[G.CREATURES[k].move] !== 'function') return 'no behaviour ' + G.CREATURES[k].move;
                if (G.CREATURES[k].sound && !G.SFX[G.CREATURES[k].sound]) return 'missing sfx ' + G.CREATURES[k].sound;
            }
            // walking up to birds startles them
            const b = L.spawn('bird', s.player.x + 150, s.player.y); b.state = 'peck'; b.x = b.tx; b.y = b.ty; b.z = 0;
            for (let i = 0; i < 20; i++) L.update(0.05, s, 1100, 680);
            s.player.x = b.x - 20; s.player.y = b.y;
            for (let i = 0; i < 4; i++) L.update(0.05, s, 1100, 680);
            if (b.state !== 'fly') return 'bird did not fly away (' + b.state + ')';
            return 'ok';
        }""")
        if result != "ok":
            errors.append("Wildlife check failed: " + str(result))

        # weather: rain (creatures shelter, frogs come out, plants regrow faster),
        # wind, fog, and a rainbow when the rain clears on a bright day
        result = page.evaluate("""() => {
            const s = G.state, wx = s.weather, T = G.TILE, spot = window.__spot;
            if (!wx || !G.WEATHER) return 'no weather';
            for (const k in G.WEATHER) for (const f of ['rain', 'wind', 'fog', 'cloud']) if (typeof (G.WEATHER[k][f] || 0) !== 'number') return 'bad weather ' + k;
            s.player.x = (spot.tx + 0.5) * T; s.player.y = (spot.ty + 0.5) * T; s.cam.x = s.player.x; s.cam.y = s.player.y;
            s.time = Math.floor(s.time / G.DAY_LENGTH + 1) * G.DAY_LENGTH + 8;
            // a gathered bloom should grow back faster in the rain
            s.world.harvested.set('9999,9999', s.time + 100);
            window.__wasHarvest = s.time + 100;
            wx.set('rain', true);
            const x = s.player.x, y = s.player.y;
            s.creatures.spawn('frog', x + 60, y + 30); s.creatures.spawn('frog', x - 70, y + 50);
            return 'ok';
        }""")
        if result != "ok":
            errors.append("Weather setup failed: " + str(result))
        page.wait_for_timeout(3500)
        page.screenshot(path=str(SHOTS / "10-rain.png"))
        result = page.evaluate("""() => {
            const s = G.state, wx = s.weather, L = s.creatures;
            if (wx.kind !== 'rain' || wx.v.rain < 0.9) return 'rain did not start: ' + wx.kind + ' ' + wx.v.rain;
            if (!document.getElementById('weather').textContent.includes('Rain')) return 'HUD does not show the rain';
            const kinds = new Set(L.list.filter(c => !c.leaving && c.state !== 'fly').map(c => c.kind));
            for (const k of ['butterfly', 'rabbit', 'bird']) if (kinds.has(k)) return k + ' did not shelter from the rain';
            if (!kinds.has('frog')) return 'no frogs in the rain (have ' + [...kinds] + ')';
            if (!(s.stats.rainTime > 1)) return 'time in the rain not counted';
            const left = s.world.harvested.get('9999,9999');
            if (!(left < window.__wasHarvest - 1)) return 'rain did not speed up regrowth';
            s.world.harvested.delete('9999,9999');
            // save and load the weather
            G.Save.write(s);
            const d = G.Save.read();
            if (!d.weather || d.weather.kind !== 'rain') return 'weather was not saved: ' + JSON.stringify(d.weather);
            const w2 = new G.Weather(); w2.load(d.weather);
            if (w2.kind !== 'rain' || w2.v.rain !== 1) return 'weather did not load';
            const w0 = new G.Weather(); w0.load(undefined);
            if (w0.kind !== 'clear') return 'missing weather should be clear';
            // every kind of weather can be picked, runs for a while and moves on
            const seen = new Set();
            const w3 = new G.Weather();
            for (let i = 0; i < 400; i++) { w3.left = 0; w3.update(0.1, s); seen.add(w3.kind); }
            if (seen.size < Object.keys(G.WEATHER).length) return 'some weather never happens: ' + [...seen];
            for (let i = 0; i < 50; i++) for (const k in G.WEATHER) {
                const n = w3.pickNext.call({ kind: k, def: G.WEATHER[k] });
                if (!G.WEATHER[n] || n === k) return 'bad next weather after ' + k + ': ' + n;
            }
            return 'ok';
        }""")
        if result != "ok":
            errors.append("Rain check failed: " + str(result))
        page.evaluate("() => { const w = G.state.weather; w.set('breezy', true); w.wasRainy = false; w.rainbow = 0; w.rainbowA = 0; }")
        page.wait_for_timeout(3500)
        page.screenshot(path=str(SHOTS / "11-breezy.png"))
        result = page.evaluate("() => G.windNow > 0.4 ? 'ok' : 'wind too weak: ' + G.windNow")
        if result != "ok":
            errors.append("Wind check failed: " + str(result))
        # rain, then clear skies on a bright day: a rainbow
        result = page.evaluate("""() => {
            const s = G.state, wx = s.weather, before = s.stats.rainbows || 0;
            wx.set('rain', true); wx.update(0.05, s);
            wx.set('clear', true); wx.update(0.05, s);
            if ((s.stats.rainbows || 0) !== before + 1 || !(wx.rainbow > 0)) return 'no rainbow after the rain';
            wx.rainbowA = 1;
            return 'ok';
        }""")
        if result != "ok":
            errors.append("Rainbow check failed: " + str(result))
        page.wait_for_timeout(1200)
        page.screenshot(path=str(SHOTS / "12-rainbow.png"))
        page.evaluate("() => { const s = G.state; s.weather.set('fog', true); s.weather.rainbow = 0; s.weather.rainbowA = 0; }")
        page.wait_for_timeout(1200)
        page.screenshot(path=str(SHOTS / "13-fog.png"))
        page.evaluate("""() => { const s = G.state; s.time = Math.floor(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + G.DAY_LENGTH * 0.5; s.weather.set('rain', true); }""")
        page.wait_for_timeout(1500)
        page.screenshot(path=str(SHOTS / "14-rain-night.png"))
        page.evaluate("() => G.state.weather.set('clear', true)")

        # workshop: build a workbench, craft tools there, mine crystal,
        # raise a beacon, decorate, and pick a building back up
        result = page.evaluate("""() => {
            const s = G.state, w = s.world, T = G.TILE;
            s.creatures.clear();
            // an open patch of grass near the heart stone
            const h = w.lights.find(L => L.type === 'heart'), htx = Math.floor(h.x / T), hty = Math.floor(h.y / T);
            let spot = null;
            for (let r = 3; r < 80 && !spot; r++) for (let dx = -r; dx <= r && !spot; dx++) for (const dy of [-r, r]) {
                const tx = htx + dx, ty = hty + dy; let ok = true;
                for (let x = -4; x <= 4 && ok; x++) for (let y = -3; y <= 3 && ok; y++)
                    if (w.isWater(tx + x, ty + y) || w.objectAt(tx + x, ty + y) || w.structureAt(tx + x, ty + y)) ok = false;
                if (ok) { spot = { tx, ty }; break; }
            }
            if (!spot) return 'no open spot for the workshop';
            s.player.x = (spot.tx + 0.5) * T; s.player.y = (spot.ty + 1.5) * T;
            s.cam.x = s.player.x; s.cam.y = s.player.y;
            s.inv = { wood: 40, stone: 40, petal: 20, fibre: 20, crystal: 0 };
            const bench = G.RECIPES.find(r => r.id === 'workbench');
            if (G.Crafting.blocker(s, G.RECIPES.find(r => r.id === 'axe')) !== 'far') return 'axe should need a workbench';
            w.build('workbench', spot.tx - 1, spot.ty);
            if (!G.Crafting.nearWorkbench(s)) return 'workbench not noticed';
            for (const id of ['axe', 'pick']) s.startBuild(G.RECIPES.find(r => r.id === id));
            if (!s.inv.axe || !s.inv.pick) return 'tools were not crafted: ' + JSON.stringify(s.inv);
            if (G.Crafting.blocker(s, G.RECIPES.find(r => r.id === 'axe')) !== 'owned') return 'axe should be owned';
            const d = G.Crafting.dropsFor(s, 'tree');
            if (d.wood !== 3) return 'axe gave no bonus: ' + JSON.stringify(d);
            s.inv.crystal = 6;
            w.build('beacon', spot.tx + 3, spot.ty - 1);
            for (let x = -4; x <= 0; x++) w.build('fence', spot.tx + x, spot.ty + 3);
            w.build('fence', spot.tx - 4, spot.ty + 2);
            w.build('flowerbed', spot.tx + 1, spot.ty + 3); w.build('flowerbed', spot.tx + 2, spot.ty + 3);
            w.build('bench', spot.tx + 1, spot.ty - 1);
            // pick up a bench: it disappears and refunds its cost
            w.build('bench', spot.tx + 4, spot.ty + 2);
            const before = s.inv.wood;
            if (G.Crafting.pickupBlocker(s, w.structureAt(htx, hty)) === null) return 'heart stone could be picked up';
            G.Crafting.pickUp(s, spot.tx + 4, spot.ty + 2);
            if (w.structureAt(spot.tx + 4, spot.ty + 2) || s.inv.wood !== before + 3) return 'pick up did not refund';
            s.time = Math.floor(s.time / G.DAY_LENGTH + 1) * G.DAY_LENGTH + 10;
            for (const k in G.STRUCTURES) if (!G.STRUCTURE_SPRITES[k]) return 'no sprite for ' + k;
            for (const k in G.OBJECTS) if (!G.OBJECT_SPRITES[k]) return 'no sprite for ' + k;
            for (const r of G.RECIPES) { for (const k in r.cost) if (!G.ITEMS[k]) return 'unknown item ' + k; if (!r.builds === !r.makes) return 'bad recipe ' + r.id; }
            window.__shop = spot;
            G.state.goalsDone = G.GOALS.map(g => g.id).filter(id => id !== 'decor');
            return 'ok';
        }""")
        if result != "ok":
            errors.append("Workshop check failed: " + str(result))
        page.keyboard.press("c"); page.wait_for_timeout(900)
        page.evaluate("() => { document.getElementById('craft').scrollTop = 9999; }")
        page.wait_for_timeout(100)
        page.screenshot(path=str(SHOTS / "7-workshop.png"))
        page.keyboard.press("c")
        page.evaluate("() => { const s = G.state; s.time = Math.floor(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + G.DAY_LENGTH * 0.5; }")
        page.wait_for_timeout(900)
        page.screenshot(path=str(SHOTS / "8-beacon-night.png"))
        # find a crystal in the highlands; it needs the pick
        result = page.evaluate("""() => {
            const s = G.state, w = s.world, T = G.TILE;
            let c = null;
            for (let r = 0; r < 300 && !c; r += 1) for (let a = 0; a < 64 && !c; a++) {
                const tx = Math.round(Math.cos(a / 64 * 6.283) * r), ty = Math.round(Math.sin(a / 64 * 6.283) * r);
                if (w.objectAt(tx, ty) === 'crystal') c = { tx, ty };
            }
            if (!c) return 'no crystal found in the world';
            const had = s.inv.pick; s.inv.pick = 0;
            if (!G.Crafting.gatherBlocker(s, 'crystal')) return 'crystal could be mined without a pick';
            s.inv.pick = had;
            s.player.x = (c.tx + 0.5) * T; s.player.y = (c.ty + 0.7) * T; s.cam.x = s.player.x; s.cam.y = s.player.y - 40;
            s.time = Math.floor(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + G.DAY_LENGTH * 0.29;
            window.__crystal = c;
            return 'ok';
        }""")
        if result != "ok":
            errors.append("Crystal check failed: " + str(result))
        page.wait_for_timeout(700)
        page.screenshot(path=str(SHOTS / "9-crystal.png"))
        result = page.evaluate("""() => {
            const s = G.state, n = s.inv.crystal || 0;
            s.wantGather = true;
            return new Promise(res => setTimeout(() => res((s.inv.crystal || 0) > n ? 'ok' : 'gathering crystal gave nothing; got ' + JSON.stringify(s.stats.got) + ' toast ' + document.getElementById('toast').textContent), 300));
        }""")
        if result != "ok":
            errors.append("Crystal check failed: " + str(result))

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

        # continue an old version-1 save from the title screen
        page.evaluate("""() => {
            window.onbeforeunload = null;
            G.state.running = false;
            localStorage.setItem('lumen-save', JSON.stringify({ version: 1, seed: 12345, time: 100,
              player: { x: G.state.world.lights[0].x, y: G.state.world.lights[0].y + 64 }, inv: { wood: 2 },
              stats: { gathered: 3, built: 1 }, structures: [['heart', G.state.world.lights[0].x / 32 - 0.5, G.state.world.lights[0].y / 32 - 0.5]], harvested: [] }));
        }""")
        page.goto((ROOT / "index.html").as_uri())
        page.wait_for_timeout(400)
        page.click("#btn-continue")
        page.wait_for_timeout(1200)
        result = page.evaluate("() => G.state.running && G.state.explored.count > 100 ? 'ok' : 'old save did not continue'")
        if result != "ok":
            errors.append(result)

        # the resting menu: Esc pauses the world, the sliders work, Esc lets it go on
        page.keyboard.press("Escape"); page.wait_for_timeout(600)
        result = page.evaluate("""() => new Promise(done => {
            if (!document.getElementById('settings').classList.contains('open')) return done('Esc did not open the resting menu');
            const t = G.state.time;
            const v = document.getElementById('set-volume'); v.value = 55; v.dispatchEvent(new Event('input'));
            if (Math.abs(G.Sound.volume - 0.55) > 0.001) return done('volume slider did nothing');
            setTimeout(() => done(G.state.time === t ? 'ok' : 'time kept running while resting'), 300);
        })""")
        if result != "ok":
            errors.append("Resting menu check failed: " + str(result))
        page.screenshot(path=str(SHOTS / "19-resting.png"))
        page.keyboard.press("Escape"); page.wait_for_timeout(500)
        result = page.evaluate("() => document.body.classList.contains('paused') ? 'Esc did not close the resting menu' : 'ok'")
        if result != "ok":
            errors.append(result)

        # rounded shores: stand on a beach by day
        page.evaluate("""() => {
            const s = G.state, w = s.world; let spot = null;
            for (let r = 6; r < 300 && !spot; r += 3) for (let a = 0; a < 24; a++) {
                const tx = Math.round(Math.cos(a / 24 * 6.283) * r) + s.player.tx, ty = Math.round(Math.sin(a / 24 * 6.283) * r) + s.player.ty;
                if (w.tileAt(tx, ty).type === 'sand' && !w.isSolid(tx, ty)) { spot = { tx, ty }; break; }
            }
            s.player.x = (spot.tx + 0.5) * 32; s.player.y = (spot.ty + 0.5) * 32; s.cam.x = s.player.x; s.cam.y = s.player.y;
            if (w.canBuild('beacon', spot.tx + 1, spot.ty + 1)) w.build('beacon', spot.tx + 1, spot.ty + 1);
            s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH; s.weather.set('clear', true);
        }""")
        page.wait_for_timeout(1200)
        page.screenshot(path=str(SHOTS / "20-shore.png"))
        browser.close()

    if errors:
        print("ERRORS:\n" + "\n".join(errors))
        return 1
    print("Smoke test passed. Screenshots in tools/screenshots/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
