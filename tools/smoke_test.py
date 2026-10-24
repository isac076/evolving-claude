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
