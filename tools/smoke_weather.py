"""Weather (Night 5): rain, wind, fog, rainbows, frogs and sheltering creatures.
Called from smoke_test.py with an open page that is already playing (split out on Night 14)."""


def run(page, SHOTS, errors):
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
