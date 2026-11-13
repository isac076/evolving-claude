"""Review night 21: the things a play-through found and fixed.
Soft wavy edges where kinds of land meet, smooth colour edges, names on the big map
that never pile up, the Calm motion option, and the ending page on a phone.
Called from smoke_test.py with an open page that is already playing."""


def run(page, shots, errors):
    def check(name, js):
        result = page.evaluate(js)
        if result != "ok":
            errors.append(name + " failed: " + str(result))

    # the edge of a Glowcap Hollow against the land beside it: wavy, not a straight staircase
    check("Hollow edge", """() => {
        const s = G.state, w = s.world, c = G.Hollow.first(w);
        let spot = null;
        for (let i = 0; i < 80 && !spot; i++) {
            const tx = c.tx + i, ty = c.ty;
            if (w.tileAt(tx, ty).type === 'mushwood' && !G.TILES[w.tileAt(tx + 1, ty).type].water && w.tileAt(tx + 1, ty).type !== 'mushwood') spot = { tx: tx + 1, ty };
        }
        if (!spot) return 'no hollow edge found';
        s.player.x = (spot.tx + 0.5) * 32; s.player.y = (spot.ty + 0.5) * 32; s.cam.x = s.player.x; s.cam.y = s.player.y;
        s.player.moveTarget = null;
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + G.DAY_LENGTH * 0.02; s.weather.set('clear', true);
        // draw that edge tile alone and make sure the hollow's colour reaches into it
        const cv = document.createElement('canvas'); cv.width = cv.height = 32; const ctx = cv.getContext('2d');
        const t = w.tileAt(spot.tx, spot.ty), nb = [w.tileAt(spot.tx, spot.ty - 1), w.tileAt(spot.tx + 1, spot.ty), w.tileAt(spot.tx, spot.ty + 1), w.tileAt(spot.tx - 1, spot.ty)];
        let painted = 0;
        for (let k = 0; k < 40; k++) {   // some edges bulge the other way: try a few rows for one that bulges in
            const ty = spot.ty + (k % 2 ? 1 : -1) * Math.ceil(k / 2);
            const tt = w.tileAt(spot.tx, ty), left = w.tileAt(spot.tx - 1, ty);
            if (left.type !== 'mushwood' || tt.type === 'mushwood' || G.TILES[tt.type].water) continue;
            ctx.clearRect(0, 0, 32, 32);
            G.drawGround(ctx, tt, 0, 0, 1, 0, spot.tx, ty, null, [w.tileAt(spot.tx, ty - 1), w.tileAt(spot.tx + 1, ty), w.tileAt(spot.tx, ty + 1), left]);
            const d = ctx.getImageData(0, 4, 6, 24).data, g = G.SEASON_NOW.tiles.mushwood;
            for (let i = 0; i < d.length; i += 4) if (d[i + 2] > d[i + 1] + 8) painted++;   // violet moss is bluer than it is green
            if (painted) break;
        }
        if (!painted) return 'no moss reached over the edge';
        return 'ok';
    }""")
    page.wait_for_timeout(1200)
    page.screenshot(path=str(shots / "77-hollow-edge.png"))

    # colour edges: the gradient path draws (no squares), and is quick
    check("Smooth colour edge", """() => {
        const cv = document.createElement('canvas'); cv.width = cv.height = 32; const ctx = cv.getContext('2d');
        const w = G.state.world, t = w.tileAt(G.state.player.tx, G.state.player.ty);
        const t0 = performance.now();
        for (let i = 0; i < 400; i++) G.drawGround(ctx, t, 0, 0, 0.5, 0, 0, 0, [0, 0.4, 0.2, 1], null);
        const ms = performance.now() - t0;
        const a = ctx.getImageData(1, 1, 1, 1).data, b = ctx.getImageData(30, 30, 1, 1).data;
        if (a[1] === b[1] && a[0] === b[0]) return 'grey corner and coloured corner look the same';
        if (ms > 200) return 'blended tiles are slow: ' + ms.toFixed(0) + 'ms for 400';
        return 'ok';
    }""")

    # names on the big map never print on top of each other
    check("Map labels", """() => {
        const cv = document.createElement('canvas'); cv.width = 400; cv.height = 300; const ctx = cv.getContext('2d');
        const L = G.MapLabels; L.begin();
        L.add("The Sun's Hearth", 200, 150, { pri: 3, below: 36 });
        L.add('Shrine of Stars', 205, 152, { pri: 2, below: 30 });
        L.add('Otter Ford', 198, 149, { pri: 1, below: 23 });
        L.add('Mossy Bend', 202, 151, { below: -19 });
        L.flush(ctx);
        const r = L.last || [];
        if (r.length !== 4) return 'expected 4 placed names, got ' + r.length;
        for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) {
            const a = r[i], b = r[j];
            if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) return 'names ' + i + ' and ' + j + ' overlap';
        }
        return 'ok';
    }""")

    # Calm motion: a comfort switch that stills the swaying, and is remembered
    check("Calm motion", """() => {
        const btn = document.getElementById('set-calm');
        if (!btn) return 'no Calm motion switch';
        const was = !!G.calm;
        if (was) btn.click();
        const a = Math.abs(G.sway(1, 2, 3));
        btn.click();
        if (!G.calm) return 'switch did not turn calm on';
        if (!document.body.classList.contains('calm')) return 'body has no calm class';
        const b = Math.abs(G.sway(1, 2, 3));
        if (!(b < a * 0.5)) return 'plants still sway as much: ' + a + ' -> ' + b;
        if (!JSON.parse(localStorage.getItem('lumen-prefs')).calm) return 'not remembered';
        btn.click();
        if (G.calm) return 'switch did not turn calm off';
        if (was) btn.click();
        return 'ok';
    }""")

    # the ending page fits a phone: its button can always be reached
    vp = page.viewport_size
    page.set_viewport_size({"width": 390, "height": 700})
    page.wait_for_timeout(300)
    check("Ending on a phone", """() => {
        const e = G.state.sun.h.ending, card = document.querySelector('.ending-card');
        const before = (G.state.stats.sun || {}).ending || 0;
        e.open(null);
        const r = card.getBoundingClientRect(), ok = r.bottom <= innerHeight + 1 && r.top >= -1;
        const bg = getComputedStyle(card).backgroundImage;
        e.close(); G.state.stats.sun.ending = before;
        if (!ok) return 'the card runs off the screen: ' + r.top.toFixed(0) + '..' + r.bottom.toFixed(0) + ' of ' + innerHeight;
        if (/rgba\\([^)]*,\\s*0?\\.9/.test(bg)) return 'the card is see-through';
        return 'ok';
    }""")
    page.set_viewport_size(vp)
    page.wait_for_timeout(300)
