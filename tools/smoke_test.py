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
        browser.close()

    if errors:
        print("ERRORS:\n" + "\n".join(errors))
        return 1
    print("Smoke test passed. Screenshots in tools/screenshots/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
