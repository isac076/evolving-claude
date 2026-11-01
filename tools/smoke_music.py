"""Music (Night 9): the composer, its moods and instruments, the band of friends.
Called from smoke_test.py with an open page that is already playing (after the
village and garden tests, so there are friends living by the beacon)."""


def run(page, shots, errors):
    def check(name, js):
        result = page.evaluate(js)
        if result != "ok":
            errors.append(name + " failed: " + str(result))

    # the data: every instrument, chord and rhythm the composer may ask for exists and adds up
    check("Music data", """() => {
        const I = G.INSTRUMENTS;
        for (const [k, m] of Object.entries(G.MUSIC_MOODS)) {
            if (m.inst && !I[m.inst]) return k + ' uses an unknown instrument ' + m.inst;
            for (const p of m.progs) { if (p.length !== 4) return k + ' has a progression without 4 chords'; for (const c of p) if (!G.CHORDS[c]) return k + ' uses an unknown chord ' + c; }
            if (!G.MUSIC_RHYTHMS[m.beats] || !G.MUSIC_ENDINGS[m.beats]) return k + ' has no rhythms for ' + m.beats + ' beats';
            if (!m.titles.length) return k + ' has no titles';
        }
        for (const [b, rs] of Object.entries({ ...G.MUSIC_RHYTHMS })) for (const r of [...rs, ...G.MUSIC_ENDINGS[b]])
            if (r.reduce((a, n) => a + Math.abs(n), 0) !== b * 2) return 'a ' + b + '-beat rhythm does not fill the bar: ' + r;
        for (const [k, p] of Object.entries(G.MUSIC_PLACES)) if (!I[p.inst]) return k + ' ground has an unknown instrument';
        for (const k in G.VILLAGER_KINDS) if (!G.MUSIC_BAND[k]) return 'friend kind ' + k + ' has no part in the band';
        for (const [k, b] of Object.entries(G.MUSIC_BAND)) if (!I[b.inst] || !b.joins) return k + ' band part is incomplete';
        // compose many tunes: always 8 bars, in range, strong notes on chord tones
        const M = G.Music;
        for (const key in G.MUSIC_MOODS) for (let n = 0; n < 20; n++) {
            const mood = G.MUSIC_MOODS[key], prog = G.pick(mood.progs).map(c => G.CHORDS[c]);
            const mel = M.compose(mood, prog);
            if (mel.length !== G.MUSIC.phrase) return 'a tune is not ' + G.MUSIC.phrase + ' bars long';
            for (let b = 0; b < mel.length; b++) for (const note of mel[b]) {
                if (note.d < -3 || note.d > 10) return 'a note is out of range: ' + note.d;
                if (note.p >= mood.beats * 2) return 'a note falls outside its bar';
                if (note.strong && !M.isChordTone(note.d, prog[b % 4])) return 'a strong note is not in its chord (' + key + ')';
            }
            if (!mel[0].length) return 'a tune starts with an empty bar';
        }
        const pad = (M.chord = G.CHORDS.G, M.padChord());
        if (!pad || pad.length !== 3 || pad.some(s => s < -4 || s > 8)) return 'pad chord out of range: ' + pad;
        return 'ok';
    }""")

    # moods follow the clock and the sky; grey land gets its own lonely title
    check("Music moods", """() => {
        const M = G.Music, base = { restore: 1, rain: 0, fog: 0 };
        const want = [[{ day: 1, phase: 0 }, 'day'], [{ day: 0.1, phase: 0.5 }, 'night'], [{ day: 0.5, phase: 0.8 }, 'morning'],
            [{ day: 0.5, phase: 0.2 }, 'dusk'], [{ day: 1, rain: 0.8 }, 'rain'], [{ day: 1, fog: 0.8 }, 'fog']];
        for (const [i, k] of want) if (M.moodFor({ ...base, ...i }) !== k) return 'expected ' + k + ' got ' + M.moodFor({ ...base, ...i });
        const keep = M.info, cap = M.onCaption, seen = [];
        M.onCaption = (t, g) => seen.push([t, g]);
        M.lastCaption = { key: '', at: -1e9 };
        M.info = { ...keep, restore: 0.1, active: false };
        M.newPiece();
        const grey = M.piece.title;
        M.info = keep; M.onCaption = cap;
        if (!G.MUSIC_GREY_TITLES.includes(grey)) return 'grey land got the title ' + grey;
        if (!seen.length || !seen[0][1]) return 'grey title was not announced as grey';
        if (M.piece.total <= M.piece.playBars) return 'a piece has no quiet bars at the end';
        if (!document.getElementById('set-music')) return 'no music slider in the resting menu';
        return 'ok';
    }""")

    # a sunny day by the beacon, with the friends awake around you: the band plays
    check("Music band setup", """() => {
        const s = G.state, F = s.villagers, w = s.world, T = G.TILE;
        // a village by the Heart Stone and a beacon: one friend of every kind
        let B = w.lights.find(L => L.type === 'heart');
        const hx = Math.floor(B.x / T), hy = Math.floor(B.y / T);
        outer: for (let r = 3; r < 9; r++) for (let dx = -r; dx <= r; dx++) if (w.canBuild('beacon', hx + dx, hy - r)) { w.build('beacon', hx + dx, hy - r); break outer; }
        const kinds = Object.keys(G.VILLAGER_KINDS);
        kinds.forEach((k, i) => {
            const v = F.make(w, 'band' + i, B.x - 60 + 30 * i, B.y + 40);
            v.kind = k; v.def = G.VILLAGER_KINDS[k]; v.hue = v.def.hues[0];
            const h = F.homeFor(w, v.x, v.y);
            if (h && h.light) F.settle(v, h.light, s);
        });
        if (F.list.length < 3) return 'too few friends for a band: ' + F.list.length;
        s.weather.set('clear', true);
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + 8; w.time = s.time;
        s.player.x = B.x - 10; s.player.y = B.y + 60; s.cam.x = s.player.x; s.cam.y = s.player.y - 20;
        F.list.forEach((v, i) => { v.state = 'idle'; v.t = 30; v.say = null; v.x = B.x - 70 + 45 * i; v.y = B.y + 30 + (i % 2) * 40; });
        s.stats.music = { heard: 0, joined: 0, band: 0, moods: {}, pieces: 0 };
        for (const k in G.Music.lv) G.Music.lv[k] = 1;   // as if we had been standing here a while
        G.Music.lastCaption = { key: '', at: -1e9 };
        if (G.Music.piece) G.Music.piece.total = 0;       // start a new piece at the next bar
        window.__notes = G.Music.count;
        return 'ok';
    }""")
    page.wait_for_timeout(4500)
    page.screenshot(path=str(shots / "23-band.png"))
    check("Music band", """() => {
        const s = G.state, M = G.Music, m = s.stats.music;
        if (M.count <= window.__notes) return 'no notes were played';
        if (M.piece.key !== 'day') return 'expected a day piece, got ' + M.piece.key;
        if (M.band.size < 3) return 'band too small: ' + M.band.size + ' of ' + s.villagers.list.length;
        if (!(m.joined >= 1) || !(m.band >= 3)) return 'band not counted: ' + JSON.stringify(m);
        if (!M.notes.length) return 'no floating notes';
        if (!(m.heard > 1)) return 'listening time not counted: ' + m.heard;
        if (!m.moods.day) return 'the day song was not counted';
        if (!document.getElementById('music-caption').classList.contains('show')) return 'no music caption';
        if (G.Sound.ctx && !G.Sound.musicBus) return 'no music bus';
        for (const g of G.GOALS) if (g.chapter === 'The song of the world' && typeof g.progress(s) !== 'number') return 'goal ' + g.id + ' has no progress';
        // the resting menu slider
        const before = G.Sound.music, el = document.getElementById('set-music');
        el.value = 35; el.dispatchEvent(new Event('input'));
        if (Math.abs(G.Sound.music - 0.35) > 0.001) return 'music slider did not change the music volume';
        if (document.getElementById('set-music-n').textContent !== '35%') return 'music slider shows no number';
        if (JSON.parse(localStorage.getItem('lumen-sound')).music !== 0.35) return 'music volume not remembered';
        G.Sound.setMusic(before);
        // night falls: the friends go to bed and a lullaby in 3/4 begins
        s.time += G.DAY_LENGTH * 0.5; s.world.time = s.time;
        M.piece.total = 0;
        return 'ok';
    }""")
    page.wait_for_timeout(5000)
    check("Music night", """() => {
        const M = G.Music;
        if (M.piece.key !== 'night') return 'expected a night piece, got ' + M.piece.key;
        if (M.inst !== 'musicbox' || M.piece.mood.beats !== 3) return 'night should be a music box lullaby in 3/4';
        return 'ok';
    }""")
    page.screenshot(path=str(shots / "24-lullaby-night.png"))
