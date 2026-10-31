"""Gardens (Night 8): planting, watering, growing, things growing back.
Called from smoke_test.py with an open page that is already playing."""


def run(page, shots, errors):
    def check(name, js):
        result = page.evaluate(js)
        if result != "ok":
            errors.append(name + " failed: " + str(result))

    # a little garden beside the Heart Stone, in every stage of growing
    check("Garden planting", """() => {
        const s = G.state, w = s.world, T = G.TILE, H = w.lights.find(L => L.type === 'heart');
        const hx = Math.floor(H.x / T), hy = Math.floor(H.y / T);
        s.weather.set('clear', true);
        s.time = Math.ceil(s.time / G.DAY_LENGTH) * G.DAY_LENGTH + 20; w.time = s.time;
        s.inv = { ...s.inv, seed: 6, acorn: 3, can: 1, wood: 10, stone: 10 };
        if (G.Crafting.dropsFor(s, 'bloom', () => 0).seed !== 1) return 'blooms never drop seeds';
        if (G.Crafting.dropsFor(s, 'bloom', () => 0.99).seed) return 'blooms always drop seeds';
        const spots = [];
        for (let r = 2; r < 8 && spots.length < 7; r++) for (let dx = -r; dx <= r && spots.length < 7; dx++) {
            const tx = hx + dx, ty = hy + r - 1;
            if (w.canBuild('sprout', tx, ty) && !w.structureAt(tx, ty - 1)) spots.push([tx, ty]);
        }
        if (spots.length < 7) return 'no room for a garden: ' + spots.length;
        const stages = [0.05, 0.3, 0.65, 0.9, 0.2, 0.6, 0.95];
        spots.forEach(([tx, ty], i) => {
            w.build(i < 4 ? 'sprout' : 'sapling', tx, ty);
            const st = w.structureAt(tx, ty); st.g = stages[i]; st.wet = i % 2 ? 30 : 0;
        });
        s.gardenSpots = spots;
        // somewhere it can't grow: water and sand
        for (let r = 0; r < 200; r++) {
            const tx = hx + r, ty = hy;
            if (w.isWater(tx, ty) && w.canBuild('sprout', tx, ty)) return 'a sprout could be planted in water';
        }
        const [sx, sy] = spots[0];
        s.player.x = (sx + 1) * T; s.player.y = (sy - 0.3) * T; s.cam.x = s.player.x; s.cam.y = s.player.y;
        // a tree nearby, chopped and half grown back
        for (let r = 1; r < 30; r++) for (let dx = -r; dx <= r; dx++) {
            const tx = sx + dx, ty = sy + r - 3;
            if (w.objectAt(tx, ty) === 'tree' && Math.abs(dx) < 12 && r < 8) {
                w.harvest(tx, ty); w.harvested.set(G.key(tx, ty), s.time + G.OBJECTS.tree.regrow * 0.4);
                if (!w.regrowAt(tx, ty) || Math.abs(w.regrowAt(tx, ty).p - 0.6) > 0.05) return 'regrow progress is wrong';
                return 'ok';
            }
        }
        return 'ok';
    }""")
    page.wait_for_timeout(900)
    page.screenshot(path=str(shots / "21-garden.png"))

    # water with E, grow everything, check it became real plants that save and load
    page.keyboard.press("e"); page.wait_for_timeout(200)
    check("Garden growing", """() => {
        const s = G.state, w = s.world, garden = s.garden;
        if (!(s.stats.watered >= 1)) return 'pressing E beside a dry sprout did not water it';
        for (const st of garden.plants(w)) st.wet = 60;
        const before = [...garden.plants(w)].length;
        garden.update(400, s);
        if ([...garden.plants(w)].length) return 'plants did not finish growing';
        let flowers = 0, trees = 0;
        for (const [tx, ty] of s.gardenSpots) {
            const o = w.objectAt(tx, ty);
            if (o === 'bloom' || o === 'moonflower') flowers++;
            if (o === 'tree') trees++;
        }
        if (flowers !== 4 || trees !== 3) return 'grew ' + flowers + ' flowers and ' + trees + ' trees (of ' + before + ')';
        if (!(s.stats.grown.tree >= 3)) return 'stats.grown not counted';
        // a grown bloom can be gathered and grows back like a wild one
        const [bx, by] = s.gardenSpots[0];
        if (!w.harvest(bx, by) || w.objectAt(bx, by)) return 'a grown bloom could not be gathered';
        if (!w.regrowAt(bx, by)) return 'a gathered garden bloom does not grow back';
        // save + load keep what grew and the growth of new plantings
        const [px, py] = s.gardenSpots[1];
        w.harvested.delete(G.key(px, py)); w.grown.delete(G.key(px, py));
        w.build('sprout', px, py); w.structureAt(px, py).g = 0.42;
        G.Save.write(s);
        const d = G.Save.read(), w2 = new G.World(d.seed);
        w2.loadStructures(d.structures); for (const [k, o] of d.grown) w2.grown.set(k, o);
        if (w2.grown.size !== w.grown.size) return 'grown plants were not saved';
        const st = w2.structureAt(px, py);
        if (!st || Math.abs(st.g - 0.42) > 0.01) return 'growth was not saved';
        // a moonflower to look at by night
        w.remove(px, py); w.grown.set(G.key(px, py), 'moonflower');
        const [qx, qy] = s.gardenSpots[2]; w.grown.set(G.key(qx, qy), 'moonflower');
        s.time += G.DAY_LENGTH * 0.5; w.time = s.time;
        return 'ok';
    }""")
    page.wait_for_timeout(1500)
    page.screenshot(path=str(shots / "22-moonflowers-night.png"))
