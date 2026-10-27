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
        browser.close()

    if errors:
        print("ERRORS:\n" + "\n".join(errors))
        return 1
    print("Smoke test passed. Screenshots in tools/screenshots/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
