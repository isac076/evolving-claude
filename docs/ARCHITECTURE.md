# How the code is organised

Plain JavaScript, no build step. Every file adds to one global object `G`.
`index.html` loads the files in order; `src/main.js` runs last and starts the game.

```
index.html            page + HUD markup, loads all scripts
style.css             look of the HUD, menus, title screen
src/core/rng.js       seeded randomness (G.hash2, G.rng) + small math helpers
src/core/noise.js     smooth noise for terrain (G.valueNoise, G.fbm)
src/core/input.js     keyboard / mouse / touch (G.Input)
src/audio/sound.js    G.Sound — Web Audio engine (buses, reverb, tone/bell/noise), G.SFX effects, G.STEP_SOUNDS footsteps
src/audio/ambience.js G.Ambience — wind, water, birds, crickets, owls and a warm chord that follow day/night + restoration
src/audio/instruments.js G.INSTRUMENTS — the music's instruments (flute, marimba, kalimba, glass, harp, music box, bass, voice, pipe…), G.musicVoice
src/audio/music.js    G.Music — the composer: writes tunes, picks mood/instrument, layers by restoration, the friends' band, floating notes
src/data/content.js   ALL content: tiles, items, objects, structures, recipes
src/data/goals.js     G.GOALS — the first-steps tutorial goals (text, target, progress, reward)
src/data/creatures.js G.CREATURES — wildlife kinds: where/when they appear, how shy, behaviour type
src/data/weather.js   G.WEATHER — kinds of weather: how rainy/windy/foggy/cloudy, how long, what may follow (+ snowy words)
src/data/seasons.js   G.SEASON timing, G.SEASONS (ground colours, snow, leaves, blossom, drift, tint, liveliness, weather), G.AUTUMN_HUES, G.SNOW
src/data/garden.js    G.GARDEN growth settings, G.GROW_KINDS (what sprouts/saplings become and how fast)
src/data/villagers.js G.SPIRITS settings, G.VILLAGER_NAMES, G.VILLAGER_KINDS (likes, hat, gift, lines), G.VILLAGER_SAYS
src/data/wishes.js    G.WISH settings, G.WISHES (what friends wish for: bring / build / stat / house, words, rewards), G.WISH_SAYS
src/data/ruins.js     G.RUIN settings, G.RUIN_SITES (ruin kinds as little stamps), G.RUIN_PIECES, G.LORE (the 12 memories), G.RUIN_ECHOES
src/data/village.js   G.VILLAGE settings, G.VILLAGE_STAGES (well → stall → ribbon pole), G.VILLAGE_NAMES, G.MARKET(_TRADES), G.FESTIVALS, G.VILLAGE_SAYS
src/data/shrines.js   G.SHRINE settings, G.SHRINES (four shrines: hue, bowl offerings, gift, words), G.SHRINE_STAMP, shrine objects/structures, the Ember lantern recipe, G.SHRINE_SAYS
src/data/travel.js    G.TRAVEL settings (reach, flight time, height, landing spots), G.TRAVEL_STOPS (which structures are stops + map names; sets `travel: true` on them), G.TRAVEL_PLACES, G.TRAVEL_SAYS
src/data/hollow.js    the Glowcap Hollows (Night 17): G.HOLLOW settings, the `mushwood` ground, spore item, giant mushroom + glowcap objects, Mushroom lamp + Spore patch, the glow snail, music place, road stop, G.HOLLOW_NAMES, G.HOLLOW_SAYS (adds to the other data tables)
src/data/riverbank.js riverbanks & waymarks (Night 18): G.RIVER settings, clay item + `claybank` object, stepping stones / signpost / banner / clay planter + recipes, G.BANNER_HUES, G.SIGN_WORDS (suggested names), G.RIVER_SAYS
src/data/music.js     G.MUSIC settings, G.CHORDS, G.MUSIC_MOODS, G.MUSIC_PLACES (ground → instrument), rhythms, G.MUSIC_BAND (friend kind → part)
src/world/world.js    G.World — terrain generation, what's where, gathering, building, restoration
src/world/ruins.js    G.Ruins — where ruins stand (one per G.RUIN.cell, from the seed), pieceAt() for tileAt, isRead(), direction()
src/world/shrines.js  G.Shrines — where the four shrines stand (from the seed, ground-only), pieceAt() for tileAt, bowls lit / kindled, known(), nextToKindle()
src/world/hollow.js   G.Hollow — where hollows are: at() (noise over damp land, none near the start), first() (the one a walk from the start), placeOf() (each hollow's id + name)
src/world/explore.js  G.Explored — which tiles the player has seen (per-chunk masks, saved as base64)
src/world/creatures.js G.Creatures — spawns/updates/draws wildlife around the screen + water ripples
src/world/weather.js  G.Weather — the current weather, smooth blending between kinds, wind gusts, rainbows, rain regrowth
src/world/seasons.js  G.Seasons — which season the clock says, blends two seasons into G.SEASON_NOW, season-change hook, footprints in snow
src/world/villagers.js G.Villagers — lost spirits (seeded spots), followers, settled friends' days, save/load
src/world/villager_talk.js hello() and talk() added to G.Villagers.prototype — wishes first, the daily gift, hints, lines for weather/season/time
src/world/garden.js   G.Garden — grows planted structures, watering, turns them into natural objects (world.grown)
src/world/wishes.js   G.Wishes — friends' wishes (choose, progress, grant, hearts, unlocks) and who lives in which cottage
src/world/village.js  G.Village — groups cottages into villages, raises their buildings, dusk at the well, festivals, sky lanterns, market swaps
src/game/player.js    G.Player — movement and collision
src/game/save.js      G.Save — localStorage save/load
src/game/ruin_play.js G.RuinPlay — finding ruins, looking at old stones, waking memory stones (rewards, memory card)
src/game/shrine_play.js G.ShrinePlay (`state.shrines`) — sensing, finding, offerings at bowls, the kindling wave, rewards and the card
src/game/travel.js    G.Travel (`state.travel`) — the lantern roads: stops(), here(), nameOf(), go() a flight, update() moves the mote + camera, arrive()
src/game/hollow_play.js G.HollowPlay — notices when you walk into a hollow (name caption, music box), stats.hollow; static hint() for the goal tracker and places() for the journal
src/game/signs.js     G.Signs (`state.signs`) — signpost names (stats.signs), the naming panel, read(), banner recolour (stats.banners), near() for road names, drawMap(), journal places(), static clayHint()
src/game/soundscape.js G.Soundscape — feeds G.Music and G.Ambience each frame (moved out of main.js on Night 13)
src/game/actions.js  G.Actions — the player's hands: gatherNearest (E), gatherAt, click(), updateBuild, updateRemove, craftItem, water/tend plants, useVillage
src/game/crafting.js  G.Crafting — workbench reach, tools (bonus drops, needs), recipe blockers, picking buildings up
src/render/sprites.js how each tile / object / structure / the player is drawn
src/render/workshop_sprites.js reeds, crystal, workbench, beacon, fence, flower bed, bench (adds to the tables above)
src/render/garden_sprites.js sprout + sapling stages, moonflower, G.REGROW_SPRITES (stumps, things growing back)
src/render/creature_sprites.js G.CREATURE_SPRITES — how each creature is drawn
src/render/weather_fx.js G.WeatherFX — draws cloud shadows, grey skies, rain + splashes, wind-blown leaves, fog, rainbow
src/render/villager_sprites.js G.drawVillager, G.VILLAGER_HATS, G.drawSpeech (bubbles), G.drawFollowThreads
src/render/music_fx.js G.MusicFX — the little glowing ♪ that float up from friends playing (drawn after lighting)
src/render/home_sprites.js the cottage, G.heartPath, G.drawWishMark (heart bubbles), G.drawHeartFx (rising hearts)
src/render/ruin_sprites.js pillars, stumps, walls, the arch (spans 3 tiles), keeper statue, fountain, rubble, memory stones, G.drawPave
src/render/shrine_sprites.js ember posts, bowls, the great hearth, the Ember lantern, G.drawShrinePave, G.ShrineFX (floor rings, sky beam, kindling wave, leaping embers, guide arrow)
src/render/village_sprites.js the well, market stall, ribbon pole (+ half-built scaffold), G.drawVillageDecor (bunting), G.drawSkyLanterns
src/render/travel_fx.js G.TravelFX — a flight: road of light ahead, the mote and its tail, shadow, beam over the destination, warm veil, landing ring
src/render/shore_fx.js G.ShoreFX — breathing foam + a rolling wave line along shores; follows roundCorners' curves (radius 11)
src/render/hollow_sprites.js G.drawHollowGround (moss, tiny toadstools), giant mushroom, glowcaps, Mushroom lamp, Spore patch, their regrow sprites, the glow snail
src/render/spore_fx.js G.SporeFX — glowing spores drifting up over hollows and from Mushroom lamps, snail halos; drawn after the night layer
src/render/riverbank_sprites.js clay bank (+ regrow), stepping stones, signpost, banner (streams with G.windNow), clay planter, G.drawSignTags (name tags over nearby signposts)
src/render/renderer.js G.Renderer — draws a frame: ground, objects, particles, lighting
src/ui/ui.js          G.UI — inventory bar, crafting panel, messages, clock
src/ui/minimap.js     G.Minimap — corner minimap + big map (M); cached 1px-per-tile chunk images
src/ui/goals.js       G.Goals — the goal tracker panel: shows progress, celebrates, gives rewards
src/ui/settings.js    G.Settings — the "Resting" menu (Esc): pause, volume, comfort options, title / new world
src/ui/wishes_panel.js G.WishPanel — the friends' wishes list under the goal tracker (above it on phones)
src/ui/journal.js     G.Journal — the journal (J): Memories / Places / Creatures / Friends pages, and the memory card; pauses the world
src/ui/market.js      G.Market — the market stall's swap panel
src/main.js           game state, wiring the systems' hooks (toasts, floaters), main loop, title screen
tools/check.sh        syntax check + headless play test (run before committing)
tools/smoke_riverbank.py  Night 18 chapter test (clay, stepping stones, naming a sign by typing, banner click, road names)
tools/smoke_test.py   plays the game in a headless browser, saves screenshots
tools/smoke_weather.py, tools/smoke_villagers.py, tools/smoke_garden.py, tools/smoke_music.py, tools/smoke_wishes.py, tools/smoke_ruins.py, tools/smoke_seasons.py, tools/smoke_village.py, tools/smoke_review.py, tools/smoke_shrines.py, tools/smoke_travel.py, tools/smoke_hollow.py  chapter tests, called at the end of smoke_test.py
```

## Key ideas
- **Tiles** are 32px (`G.TILE`). The world is endless: `world.tileAt(tx, ty)`
  generates any tile from the seed on demand (and caches it).
- **Changes** to the world are stored separately: `world.harvested` (things
  gathered, with regrow time) and `world.structures` (things built). Only these
  are saved, plus the seed.
- **Restoration**: structures with `restore` bring colour back within that many
  tiles. `world.restoreAt(x, y)` returns 0 (grey) … 1 (full colour), and every
  sprite takes this as `f` and uses `G.shade(h, s, l, f)` for its colours.
- **Lighting**: `G.daylight(time)` gives 0 (night) … 1 (day). At night the
  renderer darkens the screen and cuts holes for light sources (`light` in data).
- **Drawing order**: ground → shore foam (G.ShoreFX, water tiles with land beside them) → fish + ripples → floor structures → objects/standing
  structures, ground creatures and the player row by row (so things lower on screen
  are in front) → flying creatures → weather (G.WeatherFX) → particles → lighting → vignette.
- **Soft colour edges**: the renderer also computes restoration at every tile
  corner; `G.drawGround` fills a tile as 4×4 blended squares when its corners differ.
- **Sound**: nothing plays until the first click/key (browser rule) — then
  `G.Sound.unlock()` creates the AudioContext. Play effects with
  `G.Sound.play('name', { pan })`; it silently does nothing when muted.
  Data entries choose their sounds: `sound` on objects/structures, `step` on
  tiles/floor structures. main.js feeds `G.Ambience.update()` each frame with
  how restored the spot is, the daylight and nearby water. Mute (N) is stored
  separately in localStorage `lumen-sound`, not in the save.
- **Map**: `state.explored` (G.Explored) remembers seen tiles in 16×16 chunks
  (`G.CHUNK`). The minimap reveals a circle around the player whenever they step
  onto a new tile. Each explored chunk is drawn once into a tiny canvas (one pixel
  per tile, coloured by restoration) and redrawn a few per frame when it is
  "dirty" (new tiles seen, something built there via `map.touch`) or when
  `world.lightsVersion` changes. Structures can set `map: [h, s, l]`.
- **Goals**: `G.GOALS` in data, done in order; finished ids go in
  `state.goalsDone` (saved). Progress functions read `state.stats.got[item]`
  (items ever gathered), `world.count(type)`, `stats.mapOpened`, `explored.count`.
- **Creatures** (`state.creatures`, not saved): every 0.2s `trySpawn` samples a
  random point on screen per kind; if it suits (tile type, restoration, time of day)
  and the kind is under its cap (scaled by how much of the view suits it), a group
  spawns. Each kind's `move` names a behaviour method on G.Creatures ('flutter',
  'moth', 'bird', 'hop', 'swim'). They fade out when the time or land stops suiting
  them, and vanish when far off screen. Meeting a kind up close sets
  `state.stats.met[kind]` (saved inside stats; feeds the 'wildlife' goal).
- **Crafting**: a recipe either `builds` a structure (you then place it) or `makes` an
  item (a tool, straight into `inv`). `at: 'workbench'` recipes need a structure with
  `workbench: true` within `G.WORKBENCH_REACH` tiles. Tools are items with `tool: true`;
  objects can say `tool` + `bonus` (extra drops when you own it) and `needs` (can't gather
  without it). `G.Crafting.blocker(state, r)` says why a recipe can't be used ('owned',
  'far', 'cost'). Pick-up mode (X, `state.removing`) refunds the building's recipe cost;
  structures with `fixed` (the Heart Stone) can't be picked up. `world.remove()` does it.
- **Lights** carry their structure `type`; `world.litCount()` counts restoring lights
  except the Heart Stone (the HUD and big map use it). Beacons glow cyan.
- **Goal chapters**: goals can set `chapter` ('The workshop'); the tracker shows that
  heading and one row of pips per chapter. If new goals appear after a player finished
  everything, the hidden tracker comes back by itself.
- **Weather** (`state.weather`, G.Weather): one kind from `G.WEATHER` at a time; when its time runs
  out the next is picked by weight (or by its `after` weights). `weather.v` holds the blended values
  `rain wind fog cloud shadows` (0..1) that ease toward the current kind, so everything fades in and out.
  Readers: the renderer (`G.WeatherFX.draw` runs after flying creatures, before lighting; fog widens the
  night glows), `G.Ambience` (rain hiss/patter, drips, frog croaks, stronger wind; birds hush in rain/fog),
  G.Creatures (`shelter` kinds hide in rain, `rainy` kinds such as the frog only come out in it),
  plant sprites (`G.sway(t, seed, amp)` bends them with `G.windNow` / `G.windDir`). Rain also pulls
  `world.harvested` regrow times closer (plants, not rocks/crystal). A rainbow appears when a rainy kind
  ends on a bright day (`weather.rainbow` seconds, `rainbowA` visibility). Stats: `stats.rainTime`,
  `stats.rainbows`, `stats.weatherSeen`. The save stores `weather: {kind, left, rainbow}` — optional,
  older saves simply start clear (no version bump). Tests can call `state.weather.set(kind, true)`.
- **Villagers** (`state.villagers`, G.Villagers): lost spirits live at seeded spots — `spotOf(world, cx, cy)` gives
  0 or 1 per 16×16 chunk (`G.SPIRITS.chance`), plus `firstSpot()` a short walk from the Heart Stone; who they are
  (name, kind, hue) comes from their spot id, so it never changes. Lost ones near the camera are kept in `lost`; touching
  one moves it to `followers` (they float after you in a chain, joined by a thread of light). A follower standing in
  land restored above `G.SPIRITS.settle` settles by the nearest light with room (`homes` on the structure: heart 3,
  lantern 2, beacon 4) and joins `list`. A friend's day (`stepHome`): idle → walk (around home) or go → busy at a
  structure it `likes`; at night tobed → sleep beside its light; it stops and greets you when you're near. If its
  light is picked up it moves to another. `talk()` gives a once-a-day gift, a hint toward the nearest lost spot,
  a `wish`, or a line chosen by weather/time. Drawn row by row with the player (`rows()`), glows added to the
  night lighting (`glows()`), bubbles + threads drawn by main after lighting. Clicks/E near a friend talk.
  Stats: `spiritsFound`, `talks`, `visits`, `gifts`. Saved as `villagers: {rescued, list, follow}` — optional,
  older saves load with nobody (no version bump).
- **Rounded ground edges**: each tile type has a `rank` (deep 0 … highland 5). The renderer builds a
  grid of the visible tiles plus a border and passes each tile's neighbours `[up, right, down, left]` to
  `G.drawGround`; a corner between two lower neighbours is rounded off, a corner between two higher ones
  gets a small fillet of the higher ground (`roundCorners` in sprites.js). Only the drawing changes —
  the tile grid, collisions and the map are untouched.
- **Drawing speed**: `G.shade` remembers solid colour strings (a Map keyed by rounded h/s/l), and the
  night layer (`renderer.light`) is drawn at half resolution (`renderer.ls`) and stretched — it is all soft
  gradients. Headless frame time went from ~24ms to ~12ms.
- **Resting / pause** (G.Settings): `settings.isOpen` pauses the game — main's `frame()` uses dt = 0, skips
  `update()`, tells the ambience it is inactive and `G.Sound.duck(true)` softens everything. Esc closes the
  nearest thing first (big map → building → pick-up → craft panel) and only then opens the menu.
  "Back to title" saves and reloads the page; "New world" clears the save, sets sessionStorage `lumen-new`
  and reloads, and main starts a fresh world when it sees that flag. Sound prefs (`muted`, `volume`, `world`)
  live in localStorage `lumen-sound`; comfort prefs (`bigText`, `hints`) in `lumen-prefs` — neither is in the
  save. Larger text is CSS `zoom` on the HUD and panels (body class `big-text`).
- **Gardens** (`state.garden`, G.Garden): a structure with `grow: '<kind>'` (sprout, sapling) is a planting. It
  carries `g` (growth 0..1) and `wet` (seconds of damp soil). Every 0.25s `update` grows each one by
  `rate()` = colour factor (`G.GARDEN.greySpeed` in the grey → 1 at `colourNeeded`) × `wetSpeed` if damp ÷ the kind's
  `time`; rain keeps every planting damp. At 1 it is removed and its spot goes in `world.grown` (key → object type);
  `objectAt` treats grown objects exactly like generated ones (gathering, regrowing). The rare outcome (moonflower) is
  chosen by a hash of the spot, so the bud already shows it. Structures with `soil` can only go on those tile types
  and not where a natural object lives. Objects can drop lucky extras: `chance: { seed: 0.55 }` (`G.Crafting.dropsFor`).
  E waters the nearest dry planting if you own the can (before gathering); clicking one waters it or describes it.
  Stats: `planted`, `watered`, `grown{type}`. Save: plantings are `[type, tx, ty, g, wet]` and `grown` is a list of
  `[key, type]` — both optional, older saves load unchanged (no version bump). `world.loadStructures()` reads them.
- **Growing back**: `world.regrowAt(tx, ty)` gives `{obj, p}` for a gathered object that is regrowing; the renderer
  draws `G.REGROW_SPRITES[obj]` there (stump + young tree, short reeds, pebbles, tiny shards).
- **Music** (G.Music, data in src/data/music.js): a composer that runs on its own clock (the AudioContext's time
  when sound is live, otherwise frame time — so goals and floating notes work while muted). main.js calls
  `G.Music.update(realDt, info)` every frame, even while paused (music keeps playing, ducked). It schedules one
  eighth note at a time ~0.15s ahead (`step`). A **piece** = a mood (`moodFor`: rain/fog/night/day/morning/dusk from
  `G.daylight` and the time-of-day phase) + a 4-chord progression + a tune from `compose()` (8 bars, A A' B B' A A' B end,
  pentatonic steps, strong beats snapped to chord tones), played `G.MUSIC.repeats` times then 1–2 quiet bars. A mood change
  ends the piece at the next phrase boundary. **Layers** (`lv.lonely/bass/melody/sparkle`) fade toward targets from how
  restored the camera spot is (`G.MUSIC.layers`). The tune's instrument comes from the mood (`inst`) or the ground
  (`G.MUSIC_PLACES`, bridges count as water). **Band**: once a bar, the nearest awake friend of each kind within
  `G.MUSIC.band.range` tiles plays its `G.MUSIC_BAND` part (`bandPart`) and emits floating notes (`G.Music.notes`,
  drawn by G.MusicFX). The ambience pad follows `G.Music.padChord()`. Hooks: `onCaption(title, grey)` (the HUD
  `#music-caption`), `onJoin(v, def)`. Stats in `stats.music = {heard, joined, band, moods, pieces}` (saved inside stats,
  no version bump). Music volume is `G.Sound.music` (own `musicBus`), stored in localStorage `lumen-sound`.
  To add an instrument: a function in `G.INSTRUMENTS`; to add a mood or place: a data entry.
- **Wishes & cottages** (`state.wishes`, G.Wishes; data in src/data/wishes.js): `folk.wishes` points at it, and G.Villagers
  calls into it from `talk()` (wishes first), `bedFor()` (a house's doorstep), `serialize()/load()`. Each friend has `wishT`
  (seconds until the next wish), `wish = {id, base, known, ready}`, `hearts`, `wishes` (granted count), `house = {tx, ty}`.
  `base` is the counter when they asked (structures of that type within `G.WISH.near` tiles of home, or a stat), so build/stat
  wishes need *more*. Bring wishes are grantable while you carry the items; others set `ready` once true (toast). `grant()`
  takes items, gives `reward`, +1 heart, `stats.wishes`, and the first one pushes `G.WISH.unlockFirst` into `stats.unlocked`.
  Recipes with `unlock` stay hidden ('locked' blocker, CSS `.locked`) until known (`G.Crafting.known`); recipes with `home` go in
  the "Homes for friends" craft group. Structures with `house` (cottage) are claimed by the nearest friend without one within
  `near` tiles of their light (`houses()` every 0.5s, also sets `st.owner` for the sprite: owner's colour on the door/roof). At
  night that friend walks to the door and is `indoors()` while asleep: not drawn, not clickable, a warm window glow instead.
  Picking a cottage up frees its owner. Main draws heart bubbles (`G.drawWishMark`) after the lighting. Stats: `wishesHeard`,
  `wishes`, `housed`, `unlocked`. Save: optional fields in each saved villager — older saves load with no wishes (no version bump).
- **Ruins & memories** (Night 11; data in src/data/ruins.js): the world is cut into `G.RUIN.cell`-tile cells and each
  may hold one site (`G.Ruins.siteOf`, memoised in `world.ruinCells`), chosen from the seed using only `world.groundType()`
  (the raw ground, no cache) so it never recurses into `tileAt`. A site never sits on water and keeps `awayFromStart` tiles
  from `world.spawnSpot()` (also ground-only; `findSpawn()` returns a copy). `tileAt` asks `G.Ruins.pieceAt` and the stamp
  letter replaces the natural object (`tile.obj` = a piece from `G.RUIN_PIECES`, `tile.ruin` = the site, `tile.pave` = old
  flagstones drawn with the floors). Pieces are `G.OBJECTS` with `ruin: true`: no `drops` = can't be gathered (E/click
  describes them; rubble can be gathered), `read: true` = the memory stone. Waking it (G.RuinPlay.wake) builds a
  `memorystone` structure on top (fixed, restore 4, light, homes 1) — so "read" is saved as a structure, no version bump.
  `stats.memories` lists woken sites in order; memory *n* tells `G.LORE[n]`, after that `G.RUIN_ECHOES`. `stats.ruins.found`
  and `stats.ruinsFound` track found sites (within `G.RUIN.findAt` tiles). Objects with `awakeLight` (keeper, fountain) glow
  at night once their site is awake (the sprite caches `site.awake` per lights version). The minimap marks found ruins.
  Friends' talk can point toward the nearest unfound ruin (`G.VILLAGER_SAYS.ruins`).
- **Seasons** (Night 12; data in src/data/seasons.js): the season comes from `state.time` alone — `G.SEASON.days` days each,
  blending over `G.SEASON.turn` days centred on the boundary (`G.Seasons.phase(time)` → `{i, from, k, day}`; `k` moves in
  `G.SEASON.steps` small steps so the colour caches stay small). Nothing is saved; old saves simply land in whatever season their
  clock says. Each frame main calls `G.Seasons.update(state)`, which rebuilds `G.SEASON_NOW` when the step changes: blended numbers
  (`snow autumn bare blossom leafL tufts grow birds crickets fireflies tint`), `drift` (falling leaves/petals), `weather` multipliers,
  and `tiles[type] = {h, s, l, snow, base}` — the ground colour this season with snow mixed in. **Readers:** `G.drawGround` (uses
  `tiles`; `groundFill` lays thinner snow on faded land so restoration stays visible; `drawSnowCover` drifts), the tree sprite
  (a third are evergreens by `tile.v`; leafy ones blossom, turn `G.AUTUMN_HUES`, go bare with snow on branches), rocks and cottage
  roofs (snow caps), G.WeatherFX (season tint, `drawSnow` instead of rain when `G.Seasons.snowing()`, drifting leaves/petals),
  G.Weather (`weatherMul` in `pickNext`, `words`/`name()` give the `snow` names, no rainbow from snow), G.Garden (`grow`),
  G.Creatures (`seasons: [...]` on a kind limits it; `winterCoat` → `c.coat`), the renderer's fireflies, G.Ambience (`birds`,
  `crickets`, snow hushes), the music (snowy land plays as `G.MUSIC_PLACES.snow`), villagers (scarves when snow lies; season lines
  in `G.VILLAGER_SAYS[id]`), the minimap (season colours; its image key includes `G.Seasons.version`), the HUD `#season` and the
  Resting summary. `onChange(def, firstTime)` → toast + `season` sound; `stats.seasons = {seen, turns}`. Footprints:
  `G.Seasons.step()` from main's footsteps, drawn right after the ground. Tests jump seasons by setting `state.time`.
- **Villages** (Night 13; data in src/data/village.js, logic in G.Village = `state.village`, `folk.village`): every second
  `find()` groups cottages that have an `owner` (set by G.Wishes.houses) — single-link within `G.VILLAGE.link` tiles; 2+ make a
  village `{cottages, homes, cx, cy, folk, has: {well, stall, maypole}, key, name, title}`. Structures with `village: true` (fixed,
  never in a recipe) belong to the nearest village centre within `reach`. `grow()` builds the next `G.VILLAGE_STAGES` entry at
  `spotFor()` (a free tile near the middle with `room` clear around it, never in front of/behind a cottage); the structure gets
  `st.rise` 0→1 (not saved: loaded ones are whole) and the sprite draws it rising from a scaffold, while awake village friends
  'go' to help. The name comes from the well's tile (`nameAt`), so it is stable without saving. villagers.js asks
  `village.evening(v, state)` from the idle branch (dusk, `G.VILLAGE.gather` day phase) → friends stand around their well.
  **Festivals**: `festivalOn()` = ribbon pole risen + day phase in `G.VILLAGE.festival` + (last day of the season, or the pole key in
  `stats.village.firstFest`). Friends of the village (and friends whose light is near) get `v.festival = key`, `state = 'dance'`
  (villagers.js skips bedtime while `v.festival`), and `dance()` moves them round the pole; `pole.fest` = the festival hues (sprites
  read it). Sky lanterns live in `village.lanterns` (drawn after the lighting by main). Joining (within 10 tiles) gives
  `G.FESTIVALS[season].gift` once (`stats.festSeen`, `stats.festivals`). The music picks the `festival` mood when
  `info.festival` (the village name) is set by G.Soundscape. **Using**: E (`village.nearest`, 1.8 tiles) or a click — the well
  waters plantings within `wellWater` (`stats.wellUses`), the stall opens G.Market (`trades()` picks `G.MARKET.offers` swaps per
  day per village by hash; uses in `stats.market = {day, used}`; `stats.trades`), the pole tells when the next festival is.
  The big map prints village names, the journal's Places page lists villages first, arriving shows `ui.placeCaption()`.
  Save: nothing new (structures + stats), no version bump; old saves with clustered cottages simply grow a village.
- **Player actions** (Night 14): main.js builds `act = new G.Actions({state, input, renderer, ui, map, ruins, garden, village,
  market, folk, floater, panAt})`. `update()` calls `act.gatherNearest()` for E, `act.updateBuild()` / `act.updateRemove()` while
  placing / picking up, and `act.click()` otherwise. Special build messages live in `G.Actions.BUILT_SAYS`.
- **Ember Shrines** (Night 15; data in src/data/shrines.js): `G.Shrines.list(world)` places `G.SHRINES.length` shrines once per
  world (memoised in `world.shrineList`): shrine *i* at `G.SHRINE.dist[i]` tiles from `spawnSpot()`, a quarter turn apart, nudged
  until the whole `G.SHRINE_STAMP` (11×11) is on land — using only `groundType`, so `tileAt` can ask `G.Shrines.pieceAt` (after the
  ruins) without recursion. Shrine tiles get `tile.shrine` (and `pave`, drawn by `G.drawShrinePave`); ruins skip cells whose spot is
  within `keepRuinsAway` tiles of a shrine. Pieces are objects with `shrine: true` (`bowl`, `hearth`) — E / clicks go to
  `G.ShrinePlay.use()`. A lit bowl is an `emberflame` structure, the kindled hearth a `shrineflame` (fixed, `ember: true` → its light
  entry carries `hue` = the shrine's colour, used by the night glow). So nothing new is saved except `stats.shrines = {sensed, found,
  lit, bowls}`, `stats.shrinesFound`, `stats.shrinesLit` — no version bump. **Kindling**: when the 4th bowl burns, `kindle()` builds the
  hearth and sets its light's `restore` small; `update()` grows it to `G.SHRINE.restore` over `kindleTime` (bumping `lightsVersion` 4×/s
  so the map recolours), then `finish()` reveals the map around it, gives the gift, teaches `emberlamp` (via `stats.unlocked`) and opens
  `journal.showCard()`. The renderer keeps lights whose restore radius reaches the screen (not just those within 16 tiles).
  **Drawing**: `G.ShrineFX.floor` (carved rings, lines to lit bowls) after the floors; `G.ShrineFX.sky` after the lighting (beam over a
  kindled hearth, the wave ring, embers leaping bowl → hearth, and the guide arrow that circles the spirit pointing to
  `G.Shrines.nextToKindle`). Sensing: after `G.SHRINE.senseMemories` woken stones every shrine is `known()` — map + journal Places page.
  `world.litCount()` (the HUD's "lanterns lit") does not count ember bowls.
- **Lantern roads** (Night 16; data in src/data/travel.js, logic in G.Travel = `state.travel`, also `map.travel`): stops are
  `world.lights` whose structure has `travel` (set from `G.TRAVEL_STOPS`). `here()` is the stop within `G.TRAVEL.reach` tiles of the
  player (null while flying). The big map (`Minimap.drawRoads`, after the vignette) draws curved dashed threads from `here()` to every
  stop, rings, and the hovered stop's name (`nameOf`: `{place}` = the nearest village or the ground, `{shrine}` = the shrine's name);
  a press that hardly moved is a click → `pick()` → `travel.go(L)`. E with nothing else to do, or clicking a stop structure close by,
  opens the map when `canTravel()`. **A flight** (`trip = {x0,y0,x1,y1,cx,cy,h,t,dur,from,to,z}`): a quadratic curve from the player to
  `landing(L)` (first non-solid tile of `G.TRAVEL.land` around the light), bent sideways by `bend`, eased in/out, with height
  `sin(πu)·h`. While `trip` is set main's `update()` calls `flying()` instead of `walking()` (only N and Esc work), travel moves
  `player.x/y` (`player.flying`, `player.z` for the night light) and sets the camera; the renderer skips the spirit sprite, the
  minimap doesn't reveal tiles, the shrine guide arrow hides, autosave waits (unload/title land the trip first). `arrive()` sets the
  spirit down, brings followers, `stats.travel = {trips, seen{tileKey}, hinted, far}` (inside stats — no version bump), toast + floater.
  G.TravelFX draws after G.ShrineFX.sky. Goals 'travel' / 'travel3' (chapter "The lantern roads", after the workshop).
- **Pausing overlays**: the Resting menu (`settings.isOpen`) and the journal / memory card (`journal.paused`) both stop
  `update()`; main's frame hands keys to whichever is open.
- **Smoke tests** are being split by chapter: `tools/smoke_garden.py` has a `run(page, shots, errors)` that
  smoke_test.py calls at the end. New features should add their own file the same way.
- **Save versions**: v2 (Night 2) added `explored`, `goalsDone`, `goalsHidden`.
  `G.Save.upgrade()` converts older saves when they are read.
- **Debugging**: `G.state` in the browser console is the whole game state.
  Opening `index.html?autostart` skips the title screen with a fixed seed.

## Adding a thing (example: a new building)
1. Add it to `G.STRUCTURES` and a recipe to `G.RECIPES` in `src/data/content.js`
   (add `at: 'workbench'` if it should need a workbench).
2. Add a draw function with the same name to `G.STRUCTURE_SPRITES` in `src/render/sprites.js`.
3. Optionally give it a `sound` (an effect in `G.SFX`) for when it's built.
That's it — the crafting menu, placing, saving and lighting all pick it up.
- **Biomes / the Glowcap Hollows** (Night 17, data in src/data/hollow.js): `world.groundType(tx, ty)` first finds the old
  ground; damp grass/forest (moisture > 0.2) then asks `G.Hollow.at()` whether a wide, slow noise is above `G.HOLLOW.at` (and
  moisture above `wet`) — then the tile is `mushwood`. `groundType(tx, ty, true)` skips the overlay: the start (`spawnSpot`),
  ruins, shrines and the hollows' own placement use it, so adding a biome never moves the old world. No hollow within ~34 tiles of
  the start (it fades in), and `G.Hollow.first()` boosts the noise around one spot ~62 tiles out in the most wooded direction, so
  every world has one to find (`G.HollowPlay.hint` points the goal tracker at it). Objects for a ground type are picked in
  `tileAt`. Goals may give `hint` as a function of the state (the tracker re-renders when it changes). Structures may set
  `lightHue`: their light carries that hue (renderer glow, minimap). Glowcaps draw with `Math.max(f, 0.6)` — they kept their colour
  through the Fading. Stats: `stats.hollow = { found, at: { placeId: [tx, ty, name] } }` (optional, no version bump).
  To add a biome: a ground in `G.TILES` (+ season `ground` shifts, `G.SNOW.cover`, `G.MUSIC_PLACES`, `G.TRAVEL_PLACES`),
  an overlay rule in `groundType`, objects in `tileAt`, sprites, and its creatures.
- **Riverbanks & waymarks** (Night 18; data in src/data/riverbank.js, logic in G.Signs = `state.signs`): in `tileAt`, a sand or
  grass tile whose object roll falls in `G.RIVER.clayOn[type]` becomes a `claybank` if `world.besideShallows()` (a 'water' — not
  'deep' — neighbour, ground only). Structures may use `on: 'shallow'` (only 'water' tiles; `canBuild`) — stepping stones are
  `bridge: true` floors, so you walk on them and the music/soundscape treat them as water. `sign: true` structures carry a name in
  `stats.signs["tx,ty"]` (no version bump); building one (Actions.updateBuild) calls `signs.placed()` which stores a suggested name
  (`suggest()` from `G.SIGN_WORDS` by ground + hash) and opens the naming panel (`#signpanel`). While it is open the frame is paused
  and `G.Input` ignores keys typed into text inputs (`G.Input.typing`). Clicking a signpost reopens it; E beside one reads it.
  `signs.list()` (refreshed every 0.5s) feeds `G.drawSignTags` (after drawFolk, above the night), the big map labels
  (`drawMap`, called from Minimap after villages) and the journal Places page. `Travel.nameOf` uses `signs.near()` (within
  `G.RIVER.signNear` tiles) before the village name. `banner: true` structures: a click cycles `stats.banners[key]` through
  `G.BANNER_HUES`. First-time words: `G.Actions.FIRST_GATHER` (by object) and `G.Actions.FIRST_BUILT` (by structure, when the
  world holds exactly one). Goal chapter 'Riverbanks & waymarks' (after the hollows).
