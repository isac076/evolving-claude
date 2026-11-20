"""The Star Chart (Night 26): deeds light stars in nine constellations; a banner
and a chime for each new star; a finished constellation gives stardust and
teaches the Star lantern; old saves light their earned stars quietly; the
journal's Stars page draws the sky and lists a constellation's stars.
Called from smoke_test.py with an open page that is already playing
(or run on its own: python3 tools/smoke_stars.py)."""
import pathlib, sys


def run(page, shots, errors):
    def check(name, js):
        result = page.evaluate(js)
        if result != "ok":
            errors.append(name + " failed: " + str(result))

    check("Star data", """() => {
        if (G.CONSTELLATIONS.length !== 9) return 'expected 9 constellations';
        const ids = new Set();
        for (const c of G.CONSTELLATIONS) {
            if (c.stars.length < 4) return c.id + ' has too few stars';
            for (const st of c.stars) {
                if (ids.has(st.id)) return 'duplicate star id ' + st.id;
                ids.add(st.id);
                if (!(st.at[0] >= 0 && st.at[0] <= 1 && st.at[1] >= 0 && st.at[1] <= 1)) return st.id + ' is outside its box';
                const v = G.StarChart.value(G.state, st), n = G.StarChart.need(st);
                if (typeof v !== 'number' || isNaN(v) || !(n > 0)) return st.id + ' has a bad value/need: ' + v + ' / ' + n;
            }
            for (const [a, z] of c.lines) if (!c.stars[a] || !c.stars[z]) return c.id + ' has a line to nowhere';
        }
        for (const s of ['star', 'constellation', 'starlantern']) if (!G.SFX[s]) return 'missing sound ' + s;
        if (!G.STRUCTURE_SPRITES.starlantern) return 'no Star lantern sprite';
        if (!G.RECIPES.some(r => r.id === 'starlantern' && r.unlock)) return 'no Star lantern recipe';
        if (!document.querySelector('.journal-tabs [data-tab=stars]')) return 'no Stars page';
        if (!G.state.chart) return 'no star chart';
        return 'ok';
    }""")

    # an old save meets the chart: stars already earned light quietly, no banners
    check("Old save lights quietly", """() => {
        const s = G.state, c = s.chart;
        delete s.stats.chart; delete s.stats.chartDone;
        c.reset();
        if (!s.stats.chart) return 'no chart made';
        if (c.queue.length) return 'old stars queued banners: ' + c.queue.length;
        if (!s.stats.chart.light1) return 'lanterns are lit but First light is dark';
        return 'ok';
    }""")

    # sail the seas (on paper): every star of The Boat lights, and it is complete
    page.evaluate("""() => {
        const s = G.state, w = s.world, sp = w.spawnSpot(), p = s.player;
        if (s.journal) s.journal.toggle(false);
        p.x = (sp.tx + 0.5) * 32; p.y = (sp.ty + 3.5) * 32; p.vx = p.vy = 0; p.moveTarget = null; p.afloat = false;
        s.cam.x = p.x; s.cam.y = p.y;
        for (const st of G.CONSTELLATIONS.find(c => c.id === 'boat').stars) delete s.stats.chart[st.id];
        s.stats.chartDone = (s.stats.chartDone || []).filter(id => id !== 'boat');
        s.stats.unlocked = (s.stats.unlocked || []).filter(id => id !== 'starlantern');
        s.inv.stardust = 0;
        s.stats.sea = { launched: 2, deep: 1, crossed: 1, sailed: 700, far: 40 };
        s.stats.met = s.stats.met || {}; s.stats.met.whale = 1;
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + 20; w.time = s.time; s.weather.set('clear', true);
    }""")
    page.wait_for_timeout(1700)
    page.screenshot(path=str(shots / "96-star-banner.png"))
    check("Stars light with a banner", """() => {
        const s = G.state, c = s.chart, b = document.getElementById('star-banner');
        for (const id of ['sail', 'deep', 'shore', 'whale', 'sailed']) if (!s.stats.chart[id]) return 'star ' + id + ' did not light';
        if (!b.classList.contains('show')) return 'no banner';
        if (!/[0-9]+ new stars/.test(b.textContent)) return 'five stars at once should share one banner, it says: ' + b.textContent;
        if (c.queue.some(q => !q.done)) return 'single star banners still queued: ' + c.queue.length;
        if (!s.stats.chartDone.includes('boat')) return 'The Boat is not complete';
        if (!(s.inv.stardust >= 3)) return 'no stardust: ' + s.inv.stardust;
        if (!s.stats.unlocked.includes('starlantern')) return 'the Star lantern was not taught';
        if (!c.queue.some(q => q.done)) return 'no constellation banner waiting';
        return 'ok';
    }""")
    # let the banners play out, catching the constellation one
    page.evaluate("""() => { const c = G.state.chart; c.queue = c.queue.filter(q => q.done); c.showT = 0.01; }""")
    page.wait_for_timeout(1400)
    page.screenshot(path=str(shots / "97-constellation.png"))
    check("Constellation banner", """() => {
        const b = document.getElementById('star-banner');
        return b.classList.contains('whole') && /The Boat/.test(b.textContent) ? 'ok' : 'no constellation banner: ' + b.textContent;
    }""")

    # the Stars page of the journal
    page.keyboard.press("j"); page.wait_for_timeout(300)
    page.evaluate("() => G.state.journal ? 0 : 0")
    page.click(".journal-tabs [data-tab=stars]")
    page.wait_for_timeout(900)
    page.screenshot(path=str(shots / "98-star-chart.png"))
    check("Star chart page", """() => {
        const cv = document.getElementById('star-sky'), list = document.getElementById('star-list');
        if (!cv || cv.width < 100 || cv.height < 60) return 'no sky drawn';
        if (!/The Boat/.test(list.textContent)) return 'the list does not show the newest constellation: ' + list.textContent.slice(0, 80);
        if (list.querySelectorAll('.sc-star.lit').length !== 5) return 'expected 5 lit stars in The Boat';
        if (!G.state.stats.chartOpened) return 'opening the chart was not counted';
        // the middle of the sky holds a lit star's glow, not just black
        const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
        let bright = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 600) bright++;
        return bright > 20 ? 'ok' : 'the sky has no bright stars: ' + bright;
    }""")
    # click The Lantern (top-left) to read it
    box = page.locator("#star-sky").bounding_box()
    page.mouse.click(box["x"] + box["width"] * 0.16, box["y"] + box["height"] * 0.15)
    page.wait_for_timeout(300)
    check("Clicking reads another constellation", """() => /The Lantern/.test(document.getElementById('star-list').textContent) ? 'ok' : 'click did not switch'""")
    page.keyboard.press("j"); page.wait_for_timeout(400)

    # a Star lantern at dusk
    page.evaluate("""() => {
        const s = G.state, w = s.world, p = s.player;
        for (let r = 1; r < 6; r++) for (const [dx, dy] of [[2, 0], [-2, 0], [r, 1], [-r, 1], [0, -r]])
            if (w.canBuild('starlantern', p.tx + dx, p.ty + dy)) { w.build('starlantern', p.tx + dx, p.ty + dy); r = 9; break; }
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + G.DAY_LENGTH * 0.4; w.time = s.time;
    }""")
    page.wait_for_timeout(1200)
    page.screenshot(path=str(shots / "99-star-lantern.png"))
    check("Star lantern", """() => {
        const s = G.state, L = s.world.lights.find(L => L.type === 'starlantern');
        if (!L) return 'no Star lantern light';
        const h = L.hue; if (typeof h !== 'number' || isNaN(h)) return 'its light has no colour';
        if (!s.travel.stops().some(x => x.type === 'starlantern')) return 'not a lantern-road stop';
        return 'ok';
    }""")


if __name__ == "__main__":
    sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
    import smoke_test
    sys.exit(smoke_test.main())
