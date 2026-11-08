"""The lantern roads (Night 16): standing by a light, the big map shows roads to
every other light; clicking one flies the spirit there as a mote of light.
Called from smoke_test.py with an open page that is already playing."""


def run(page, shots, errors):
    def check(name, js):
        result = page.evaluate(js)
        if result != "ok":
            errors.append(name + " failed: " + str(result))

    check("Travel data", """() => {
        for (const id in G.TRAVEL_STOPS) {
            const d = G.STRUCTURES[id];
            if (!d || !d.travel || !G.STRUCTURE_SPRITES[id]) return 'stop without structure/sprite: ' + id;
            if (!G.TRAVEL_STOPS[id].name) return 'stop without a name: ' + id;
        }
        if (!G.GOALS.find(g => g.id === 'travel')) return 'no lantern roads goal';
        if (!G.SFX.travelGo || !G.SFX.travelArrive) return 'no travel sounds';
        return 'ok';
    }""")

    # far from every light: no road to set off on
    check("Travel needs a light", """() => {
        const s = G.state, p = s.player, tr = s.travel, sp = s.world.spawnSpot();
        s.stats.travel = s.stats.travel || { trips: 0, seen: {}, hinted: 1, far: 0 };
        s.stats.travel.hinted = 1;
        p.x = (sp.tx + 0.5) * G.TILE; p.y = (sp.ty + 8.5) * G.TILE; p.moveTarget = null;
        if (tr.stopNear(p.x, p.y)) return 'test spot is unexpectedly near a light';
        const L = s.world.lights.find(L => L.type === 'shrineflame');
        if (!L) return 'no kindled shrine to fly to';
        if (tr.go(L)) return 'set off without standing by a light';
        if (!document.getElementById('toast').textContent.includes('Stand beside')) return 'no word about standing by a light';
        return 'ok';
    }""")

    # beside the Heart Stone: the map shows the roads, and the shrine under the pointer shows its name
    page.evaluate("""() => {
        const s = G.state, p = s.player, sp = s.world.spawnSpot();
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + 20; s.world.time = s.time; s.weather.set('clear', true);
        p.x = (sp.tx + 0.5) * G.TILE; p.y = (sp.ty + 1.5) * G.TILE; p.moveTarget = null;
        s.cam.x = p.x; s.cam.y = p.y;
        if (!s.world.lights.some(L => L.type === 'lantern'))   // a second stop close to home
            for (let dx = 7; dx < 20; dx++) if (s.world.canBuild('lantern', sp.tx + dx, sp.ty + 2)) { s.world.build('lantern', sp.tx + dx, sp.ty + 2); break; }
    }""")
    page.wait_for_timeout(300)
    page.keyboard.press("m")
    page.wait_for_timeout(500)
    target = page.evaluate("""() => {
        const s = G.state, mm = G.state.travel.map;
        mm.zoom = 3; mm.pan.x = 0; mm.pan.y = 0;
        return new Promise(done => setTimeout(() => {
            const o = (mm.stopsOnScreen || []).find(o => o.L.type === 'shrineflame');
            if (!o) return done(null);
            const r = mm.bcanvas.getBoundingClientRect();
            done({ x: r.left + o.x, y: r.top + o.y });
        }, 200));
    }""")
    if not target:
        errors.append("Roads map failed: the kindled shrine is not on the roads map")
        return
    page.mouse.move(target["x"], target["y"])
    page.wait_for_timeout(300)
    check("Roads map", """() => {
        const mm = G.state.travel.map;
        if (!document.getElementById('bigmap-help').textContent.includes('click another light')) return 'map help does not mention travel';
        if (!mm.hoverStop || mm.hoverStop.L.type !== 'shrineflame') return 'hovering the shrine did not pick it';
        const name = G.state.travel.nameOf(mm.hoverStop.L);
        if (!name.startsWith('Shrine')) return 'odd stop name: ' + name;
        if (!G.state.travel.nameOf(G.state.world.lights.find(L => L.type === 'lantern')).startsWith('Lantern ')) return 'lantern name';
        return 'ok';
    }""")
    page.screenshot(path=str(shots / "51-roads-map.png"))

    # click: the spirit takes off
    page.mouse.click(target["x"], target["y"])
    page.wait_for_timeout(100)
    check("Flight begins", """() => {
        const s = G.state, tr = s.travel;
        if (!tr.trip) return 'clicking the shrine did not set off';
        if (tr.map.isOpen) return 'the map stayed open';
        if (!s.player.flying) return 'the spirit is not flying';
        window._trip = { dur: tr.trip.dur, to: tr.trip.to, x1: tr.trip.x1, y1: tr.trip.y1 };
        return 'ok';
    }""")
    dur = page.evaluate("() => window._trip.dur")
    page.wait_for_timeout(int(dur * 450))
    page.screenshot(path=str(shots / "52-flight.png"))
    check("Mid-flight", """() => {
        const s = G.state, tr = s.travel;
        if (!tr.trip) return 'the flight ended too soon';
        if (tr.trip.z < 30) return 'the mote is not up in the sky (z=' + tr.trip.z.toFixed(1) + ')';
        if (Math.hypot(s.cam.x - s.player.x, s.cam.y - s.player.y) > 200) return 'the camera lost the mote';
        return 'ok';
    }""")
    page.wait_for_timeout(int(dur * 650) + 400)
    page.screenshot(path=str(shots / "53-landed.png"))
    check("Landed", """() => {
        const s = G.state, p = s.player, t = window._trip;
        if (s.travel.trip || p.flying) return 'still flying';
        if (Math.hypot(p.x - t.x1, p.y - t.y1) > 2) return 'landed in the wrong place';
        if (s.world.isSolid(p.tx, p.ty)) return 'landed inside something solid';
        if (Math.hypot(p.x - t.to.x, p.y - t.to.y) > 3 * G.TILE) return 'landed too far from the light';
        if (s.stats.travel.trips !== 1 || Object.keys(s.stats.travel.seen).length !== 1) return 'trips not counted: ' + JSON.stringify(s.stats.travel);
        if (!G.GOALS.find(g => g.id === 'travel').progress(s)) return 'the goal did not notice';
        return 'ok';
    }""")

    # back home at night, with a friend in tow; Esc pauses mid-flight
    page.evaluate("""() => {
        const s = G.state, tr = s.travel;
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + G.DAY_LENGTH * 0.5; s.world.time = s.time;
        const home = s.world.lights.find(L => L.type === 'heart');
        tr.go(home);
    }""")
    page.wait_for_timeout(500)
    page.keyboard.press("Escape")
    page.wait_for_timeout(300)
    check("Pause mid-flight", """() => new Promise(done => {
        const tr = G.state.travel;
        if (!document.getElementById('settings').classList.contains('open')) return done('Esc did not pause the flight');
        const t = tr.trip && tr.trip.t;
        setTimeout(() => done(tr.trip && tr.trip.t === t ? 'ok' : 'the flight went on while resting'), 250);
    })""")
    page.keyboard.press("Escape")
    page.wait_for_timeout(int(dur * 300))
    page.screenshot(path=str(shots / "54-flight-night.png"))
    page.wait_for_timeout(int(dur * 1000) + 300)
    check("Home again", """() => {
        const s = G.state, home = s.world.lights.find(L => L.type === 'heart');
        if (s.travel.trip) return 'still flying';
        if (Math.hypot(s.player.x - home.x, s.player.y - home.y) > 3 * G.TILE) return 'did not land by the Heart Stone';
        if (s.stats.travel.trips !== 2) return 'second trip not counted';
        return 'ok';
    }""")
    page.evaluate("() => { const s = G.state; s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + 20; s.world.time = s.time; }")
    check("Journal roads", """() => {
        const s = G.state, j = Object.assign(Object.create(G.Journal.prototype), { state: s }).page_places();
        return j.includes('Lantern roads') && j.includes('2 flights') ? 'ok' : 'the journal does not mention the flights';
    }""")
