"""Photo mode and the title (Night 24): P hides the HUD and frees the camera
(within reach of the spirit), time can be held still, every filter and frame
draws, the shutter keeps a photo in the journal's album, Esc comes back; the
title lights its letters, blooms from grey, writes a summary of your world and
eases you in on Continue.
Called from smoke_test.py with an open page that is already playing
(or run on its own: python3 tools/smoke_photo.py)."""
import pathlib, sys


def run(page, shots, errors):
    def check(name, js):
        result = page.evaluate(js)
        if result != "ok":
            errors.append(name + " failed: " + str(result))

    check("Photo data", """() => {
        for (const s of ['lens', 'shutter', 'arrive']) if (!G.SFX[s]) return 'missing sound ' + s;
        if (G.PHOTO_FILTERS.length < 4 || G.PHOTO_FRAMES.length < 3) return 'too few looks';
        if (!G.Photo || !G.PhotoFX || !G.Title) return 'missing module';
        if (!document.getElementById('btn-photo')) return 'no camera button';
        if (!document.querySelector('.journal-tabs [data-tab=album]')) return 'no album page';
        return 'ok';
    }""")

    # a lovely evening by a few lanterns
    page.evaluate("""() => {
        const s = G.state, w = s.world, p = s.player;
        try { localStorage.removeItem('lumen-album'); } catch (e) {}
        if (s.photo.isOpen) s.photo.toggle(false);
        s.journal && s.journal.toggle && s.journal.toggle(false);
        const sp = w.spawnSpot();
        p.x = (sp.tx + 0.5) * 32; p.y = (sp.ty + 2.5) * 32; p.vx = p.vy = 0; p.moveTarget = null; p.afloat = false;
        s.cam.x = p.x; s.cam.y = p.y;
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + G.DAY_LENGTH * 0.24; w.time = s.time;
        s.weather.set('clear', true);
    }""")
    page.wait_for_timeout(300)
    page.keyboard.press("p")
    page.wait_for_timeout(500)
    check("Photo mode opens", """() => {
        const s = G.state, ph = s.photo;
        if (!ph.isOpen) return 'P did not open photo mode';
        if (!document.body.classList.contains('photo')) return 'HUD still shows';
        if (getComputedStyle(document.getElementById('hud')).visibility !== 'hidden') return 'HUD not hidden';
        if (!s.stats.photo || !s.stats.photo.opened) return 'not counted';
        return 'ok';
    }""")
    # time held still, the camera wanders but stays near
    check("Still time", """() => new Promise(done => {
        const s = G.state, ph = s.photo;
        ph.sp = 0; ph.show();
        const t = s.time;
        setTimeout(() => done(s.time === t ? 'ok' : 'time moved while still'), 300);
    })""")
    page.keyboard.down("d"); page.wait_for_timeout(2500); page.keyboard.up("d")
    check("Camera stays in reach", """() => {
        const s = G.state, d = Math.hypot(s.cam.x - s.player.x, s.cam.y - s.player.y);
        if (d < 100) return 'the camera did not move: ' + d.toFixed(0);
        if (d > G.PHOTO.reach * G.TILE + 2) return 'the camera wandered too far: ' + d.toFixed(0);
        return 'ok';
    }""")
    check("Every look draws", """() => new Promise(done => {
        const ph = G.state.photo, combos = [];
        for (let f = 0; f < G.PHOTO_FILTERS.length; f++) for (let r = 0; r < G.PHOTO_FRAMES.length; r++) combos.push([f, r]);
        let i = 0;
        const next = () => {
            if (i >= combos.length) return done('ok');
            [ph.f, ph.fr] = combos[i++]; ph.show();
            requestAnimationFrame(() => requestAnimationFrame(next));
        };
        next();
    })""")
    # a keepsake card at golden hour, zoomed in a little
    page.evaluate("""() => {
        const s = G.state, ph = s.photo;
        s.cam.x = s.player.x + 40; s.cam.y = s.player.y - 30;
        ph.f = G.PHOTO_FILTERS.findIndex(f => f.id === 'golden'); ph.fr = G.PHOTO_FRAMES.findIndex(f => f.id === 'card'); ph.sp = 1; ph.show();
    }""")
    page.keyboard.press("=")
    page.wait_for_timeout(1200)
    check("Zoom", """() => {
        const R = G.state.photo.hooks.renderer;
        return R.zoomGoal > 1.1 && R.zoom > 1.05 ? 'ok' : 'zoom did not change: ' + R.zoom.toFixed(2);
    }""")
    page.screenshot(path=str(shots / "86-photo-keepsake.png"))
    page.keyboard.press(" ")
    page.wait_for_timeout(700)
    check("The shutter keeps a photo", """() => {
        const s = G.state, a = G.Photo.album();
        if (a.length !== 1) return 'album has ' + a.length;
        if (!a[0].src.startsWith('data:image/jpeg')) return 'not a picture';
        if (!a[0].place || !a[0].when.startsWith('Day')) return 'no caption: ' + JSON.stringify([a[0].place, a[0].when]);
        if (s.stats.photo.taken !== 1) return 'not counted';
        if (!document.getElementById('photo-kept').classList.contains('show')) return 'no kept card';
        return 'ok';
    }""")
    page.screenshot(path=str(shots / "87-photo-kept.png"))
    # night, moonlit, cinema bars, the spirit hidden
    page.evaluate("""() => {
        const s = G.state, ph = s.photo;
        s.time = Math.floor(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + G.DAY_LENGTH * 0.5; s.world.time = s.time;
        ph.f = G.PHOTO_FILTERS.findIndex(f => f.id === 'moon'); ph.fr = G.PHOTO_FRAMES.findIndex(f => f.id === 'wide'); ph.sp = 0; ph.show();
        document.getElementById('photo-kept').classList.remove('show');
    }""")
    page.keyboard.press("h")
    page.wait_for_timeout(500)
    check("Spirit hidden", "() => G.state.player.hidden ? 'ok' : 'H did not hide the spirit'")
    page.screenshot(path=str(shots / "88-photo-cinema-night.png"))
    page.keyboard.press(" ")
    page.wait_for_timeout(300)
    page.keyboard.press("Escape")
    page.wait_for_timeout(1500)
    check("Photo mode closes", """() => {
        const s = G.state, R = s.photo.hooks.renderer;
        if (s.photo.isOpen || document.body.classList.contains('photo')) return 'still open';
        if (s.player.hidden) return 'the spirit stayed hidden';
        if (Math.abs(R.zoom - 1) > 0.02) return 'zoom did not ease back: ' + R.zoom.toFixed(2);
        if (G.Photo.album().length !== 2) return 'second photo not kept';
        return 'ok';
    }""")
    # the album in the journal
    page.keyboard.press("j")
    page.wait_for_timeout(300)
    page.click(".journal-tabs [data-tab=album]")
    page.wait_for_timeout(300)
    check("Album page", "() => document.querySelectorAll('#journal-page .j-photo').length === 2 ? 'ok' : 'album shows ' + document.querySelectorAll('#journal-page .j-photo').length")
    page.screenshot(path=str(shots / "89-album.png"))
    page.click("#journal-page .j-photo >> nth=1")
    page.wait_for_timeout(200)
    page.click("[data-album=drop]"); page.click("[data-album=drop]")
    page.wait_for_timeout(200)
    check("Let a photo go", "() => G.Photo.album().length === 1 && document.querySelectorAll('#journal-page .j-photo').length === 1 ? 'ok' : 'photo not removed'")
    page.keyboard.press("Escape")
    page.wait_for_timeout(300)

    # photo mode on a phone: the bar fits, the shutter can be reached
    vp = page.viewport_size
    page.set_viewport_size({"width": 390, "height": 720})
    page.wait_for_timeout(300)
    page.keyboard.press("p")
    page.wait_for_timeout(500)
    check("Photo bar on a phone", """() => {
        const row = document.querySelector('.ph-row').getBoundingClientRect(), sh = document.getElementById('ph-shutter').getBoundingClientRect();
        if (row.left < 0 || row.right > innerWidth + 1) return 'the bar runs off: ' + row.left.toFixed(0) + '..' + row.right.toFixed(0);
        if (sh.bottom > row.top + 1) return 'the shutter sits on the bar';
        return 'ok';
    }""")
    page.screenshot(path=str(shots / "90-photo-phone.png"))
    page.keyboard.press("Escape")
    page.set_viewport_size(vp)
    page.wait_for_timeout(300)

    # the title: letters, a summary of your world, and a gentle way in
    page.evaluate("() => { G.Save.write(G.state); window.onbeforeunload = null; G.state.running = false; }")
    page.goto(page.url.split("?")[0])
    page.wait_for_timeout(4800)
    check("Title", """() => {
        if (document.querySelectorAll('#title h1 span').length !== 5) return 'letters not split';
        const sum = document.getElementById('title-summary').textContent;
        if (!/^Day \\d+ · \\w+/.test(sum)) return 'summary: ' + sum;
        if (G.state.running) return 'already playing';
        return 'ok';
    }""")
    page.screenshot(path=str(shots / "91-title.png"))
    page.click("#btn-continue")
    page.wait_for_timeout(700)
    check("Arriving", """() => {
        const R = G.state.photo.hooks.renderer;
        if (!G.state.running) return 'did not continue';
        if (!document.getElementById('veil') || document.getElementById('veil').classList.contains('on')) return 'the veil stayed';
        return G.calm || R.zoom > 1.02 ? 'ok' : 'no ease-in: ' + R.zoom.toFixed(2);
    }""")
    page.wait_for_timeout(2600)
    check("Arrived", "() => Math.abs(G.state.photo.hooks.renderer.zoom - 1) < 0.02 ? 'ok' : 'still zoomed'")
    page.screenshot(path=str(shots / "92-arrived.png"))


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
    print("\n".join(errs) if errs else "photo ok")
    sys.exit(1 if errs else 0)
