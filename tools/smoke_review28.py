"""Review night 28: the things a play-through found and fixed.
A meadow without a chequer (soft light and shade instead of a step per tile), recipes that stay a
secret until you find what they need, an inventory bar that folds, many stars sharing one banner,
and the phone HUD with larger text kept clear of the minimap and the touch buttons.
Called from smoke_test.py with an open page that is already playing."""


def run(page, shots, errors):
    def check(name, js, arg=None):
        result = page.evaluate(js, arg) if arg is not None else page.evaluate(js)
        if result != "ok":
            errors.append(name + " failed: " + str(result))

    # neighbouring meadow tiles at the same colour now meet without a step, and the land gets soft patches
    check("No chequer", """() => {
        const cv = document.createElement('canvas'); cv.width = 96; cv.height = 32; const ctx = cv.getContext('2d');
        const mk = (v, soft) => ({ type: 'grass', v, soft, hue: 0 });
        // two tiles with very different per-tile rolls but the same slow patch: they must look the same
        G.drawGround(ctx, mk(0.02, 0.5), 0, 0, 1, 0, 0, 0, null, null);
        G.drawGround(ctx, mk(0.84, 0.5), 32, 0, 1, 0, 1, 0, null, null);
        const a = ctx.getImageData(30, 2, 1, 1).data, b = ctx.getImageData(33, 2, 1, 1).data;
        if (!(G.SEASON_NOW.tiles.grass.snow > 0.05) && Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) > 3) return 'tiles still step: ' + [...a] + ' vs ' + [...b];
        // the light-and-shade sweep paints the land, and leaves the water alone
        const c2 = document.createElement('canvas'); c2.width = c2.height = 128; const x = c2.getContext('2d');
        x.fillStyle = '#4a8a3a'; x.fillRect(0, 0, 128, 128);
        const tiles = []; for (let ty = -1; ty <= 4; ty++) for (let tx = -1; tx <= 4; tx++) tiles.push({ type: tx >= 2 ? 'water' : 'grass' });
        G.mottleGround(x, tiles, 6, 0, 0, 3, 3, 0, 0);
        const land = x.getImageData(0, 0, 64, 128).data, sea = x.getImageData(64, 0, 64, 128).data;
        let varied = 0, wet = 0;
        for (let i = 0; i < land.length; i += 4) if (land[i + 1] !== 0x8a) varied++;
        for (let i = 0; i < sea.length; i += 4) if (sea[i + 1] !== 0x8a) wet++;
        if (varied < 500) return 'no soft patches on the land: ' + varied;
        if (wet) return 'the sweep spilled onto water: ' + wet;
        return 'ok';
    }""")

    # a meadow by day, close up, after the change
    page.evaluate("""() => {
        const s = G.state, w = s.world, sp = w.spawnSpot(), p = s.player;
        if (s.journal) s.journal.toggle(false);
        p.x = (sp.tx + 0.5) * 32; p.y = (sp.ty + 2.5) * 32; p.vx = p.vy = 0; p.moveTarget = null; p.afloat = false;
        s.cam.x = p.x; s.cam.y = p.y;
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + G.DAY_LENGTH * 0.04; w.time = s.time; s.weather.set('clear', true);
    }""")
    page.wait_for_timeout(1500)
    page.screenshot(path=str(shots / "105-meadow.png"))

    # recipes stay secret until you have found what they need
    check("Secret recipes", """() => {
        const s = G.state, ui = G.ui;
        const keep = { inv: s.inv.spore || 0, got: s.stats.got.spore || 0 };
        s.inv.spore = 0; s.stats.got.spore = 0; ui.refresh();
        const lamp = document.querySelector('.recipe[data-id="' + G.RECIPES.find(r => r.builds === 'mushlamp' || (r.cost && r.cost.spore)).id + '"]');
        if (!lamp) return 'no recipe that needs glow spores';
        if (!lamp.classList.contains('unseen') || getComputedStyle(lamp).display !== 'none') return 'a glow-spore recipe shows before any spores were found';
        const more = document.querySelector('.craft-more[data-group="' + lamp.dataset.group + '"]');
        if (!more || more.hidden || !/to discover/.test(more.textContent)) return 'no "more to discover" line: ' + (more && more.textContent);
        for (const id of ['lantern', 'path']) {
            const b = document.querySelector('.recipe[data-id="' + id + '"]');
            if (b && b.classList.contains('unseen')) return 'a first-day recipe is hidden: ' + id;
        }
        if (ui.fresh) ui.fresh.delete(lamp.dataset.id);   // earlier chapters may have found spores already
        s.stats.got.spore = 1; ui.refresh();
        if (lamp.classList.contains('unseen')) return 'still hidden after finding spores';
        if (!lamp.classList.contains('fresh')) return 'no "new" tag on the recipe just found';
        if (!/Something new to make/.test(ui.laterNote || '')) return 'no note about the new recipe: ' + ui.laterNote;
        ui.toggleCraft(true);
        return 'ok';
    }""")
    page.wait_for_timeout(500)
    page.evaluate("() => { const el = document.getElementById('craft'), b = el.querySelector('.recipe.fresh'); if (b) el.scrollTop = b.offsetTop - 120; }")
    page.wait_for_timeout(400)
    page.screenshot(path=str(shots / "106-craft-secrets.png"))
    check("Fresh tag clears", """() => {
        G.ui.toggleCraft(false);
        return document.querySelector('.recipe.fresh') ? 'the "new" tag stayed after closing' : 'ok';
    }""")

    page.wait_for_timeout(600)   # the bottom bar slides back from beside the craft panel
    # the inventory bar folds behind "+ N more", opens on a tap and while crafting
    check("Folding bag", """() => {
        const s = G.state, ui = G.ui, bar = document.getElementById('inventory');
        for (const k of Object.keys(G.ITEMS)) if (!G.ITEMS[k].tool) { s.inv[k] = (s.inv[k] || 0) + 1; s.stats.got[k] = (s.stats.got[k] || 0) + 1; }
        ui.refresh();
        if (!bar.classList.contains('compact')) return 'a full bag did not fold';
        const vis = [...bar.querySelectorAll('.slot')].filter(e => getComputedStyle(e).display !== 'none');
        const more = bar.querySelector('.slot.more');
        if (!more || getComputedStyle(more).display === 'none' || !/more/.test(more.textContent)) return 'no "+ N more" chip';
        if (vis.length > G.UI_BAG.desk + 1) return 'too many slots showing: ' + vis.length;
        if (bar.getBoundingClientRect().height > 60) return 'the bar is still two rows: ' + bar.getBoundingClientRect().height;
        s.inv.wood += 1; ui.refresh();   // what you just touched is kept in view
        const wood = [...bar.querySelectorAll('.slot')].find(e => /Wood/.test(e.textContent));
        if (!wood || getComputedStyle(wood).display === 'none') return 'the wood you just got is folded away';
        bar.querySelector('.slot.more').click();
        const all = [...bar.querySelectorAll('.slot:not(.more):not(.less)')].filter(e => getComputedStyle(e).display !== 'none');
        if (all.length !== bar.querySelectorAll('.slot:not(.more):not(.less)').length) return 'tapping "more" did not open the whole bag';
        bar.querySelector('.slot.less').click();
        if (bar.classList.contains('open')) return '"Less" did not fold it again';
        return 'ok';
    }""")

    # the phone with larger text: the status bar stays clear of the minimap, the goals clear of the touch buttons
    vp = page.viewport_size
    page.set_viewport_size({"width": 390, "height": 760})
    page.evaluate("() => { document.body.classList.add('big-text'); G.ui.refresh(); }")
    page.wait_for_timeout(600)
    check("Phone with larger text", """() => {
        const st = document.getElementById('status').getBoundingClientRect(), mm = document.getElementById('minimap').getBoundingClientRect();
        // the minimap is round: the corner of its box is empty
        if (st.right > mm.left + mm.width * 0.15 && st.top < mm.bottom) return 'the status bar runs under the minimap: ' + st.right.toFixed(0) + ' > ' + mm.left.toFixed(0);
        const g = document.getElementById('goals').getBoundingClientRect(), tb = document.getElementById('touch-buttons');
        if (tb && getComputedStyle(tb).display !== 'none') {
            const t = tb.getBoundingClientRect();
            if (g.right > t.left && g.bottom > t.top && g.top < t.bottom) return 'the goals sit under the touch buttons';
        }
        return 'ok';
    }""")
    page.screenshot(path=str(shots / "107-phone-bigtext.png"))
    page.evaluate("() => { document.body.classList.remove('big-text'); }")
    page.set_viewport_size(vp)
    page.wait_for_timeout(300)
    page.evaluate("() => G.ui.refresh()")
