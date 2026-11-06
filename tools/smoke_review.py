"""Review night 14: the things a play-through found and fixed.
Called from smoke_test.py with an open page that is already playing."""


def run(page, shots, errors):
    def check(name, js):
        result = page.evaluate(js)
        if result != "ok":
            errors.append(name + " failed: " + str(result))

    # the player's actions live in G.Actions now (moved out of main.js)
    check("Actions", """() => {
        if (typeof G.Actions !== 'function') return 'no G.Actions';
        for (const m of ['gatherNearest', 'gatherAt', 'click', 'updateBuild', 'updateRemove', 'craftItem', 'useVillage'])
            if (typeof G.Actions.prototype[m] !== 'function') return 'G.Actions has no ' + m;
        for (const m of ['hello', 'talk']) if (typeof G.Villagers.prototype[m] !== 'function') return 'villagers cannot ' + m;
        return 'ok';
    }""")

    # with every goal done, the tracker's pips stay inside its panel
    check("All goals pips", """() => {
        const s = G.state, keep = s.goalsDone.slice(), el = document.getElementById('goals');
        s.goalsDone = G.GOALS.map(g => g.id); s.goalsHidden = false;
        G.Goals.prototype.render.call({ state: s, el }, null);
        const box = el.getBoundingClientRect(), pips = el.querySelector('.pips').getBoundingClientRect();
        s.goalsDone = keep;
        if (!el.textContent.includes('All done')) return 'no all-done message';
        if (pips.right > box.right + 1 || pips.left < box.left - 1) return 'pips run off the panel: ' + pips.left + '..' + pips.right + ' in ' + box.left + '..' + box.right;
        return 'ok';
    }""")

    # shore foam: a beach with the water beside it, drawn without errors
    check("Shore foam", """() => {
        if (!G.ShoreFX) return 'no G.ShoreFX';
        const s = G.state, w = s.world; let spot = null;
        for (let r = 6; r < 300 && !spot; r += 2) for (let a = 0; a < 32; a++) {
            const tx = Math.round(Math.cos(a / 32 * 6.283) * r) + s.player.tx, ty = Math.round(Math.sin(a / 32 * 6.283) * r) + s.player.ty;
            if (w.tileAt(tx, ty).type === 'water' && !G.TILES[w.tileAt(tx + 1, ty).type].water) { spot = { tx, ty }; break; }
        }
        if (!spot) return 'no shore found';
        s.player.x = (spot.tx + 2.5) * 32; s.player.y = (spot.ty + 0.5) * 32; s.cam.x = s.player.x; s.cam.y = s.player.y;
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + G.DAY_LENGTH * 0.05; s.weather.set('clear', true);
        return 'ok';
    }""")
    page.wait_for_timeout(1200)
    page.screenshot(path=str(shots / "44-shore-foam.png"))
