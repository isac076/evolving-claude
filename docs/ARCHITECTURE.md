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
src/data/content.js   ALL content: tiles, items, objects, structures, recipes
src/data/goals.js     G.GOALS — the first-steps tutorial goals (text, target, progress, reward)
src/data/creatures.js G.CREATURES — wildlife kinds: where/when they appear, how shy, behaviour type
src/data/weather.js   G.WEATHER — kinds of weather: how rainy/windy/foggy/cloudy, how long, what may follow
src/data/villagers.js G.SPIRITS settings, G.VILLAGER_NAMES, G.VILLAGER_KINDS (likes, hat, gift, lines), G.VILLAGER_SAYS
src/world/world.js    G.World — terrain generation, what's where, gathering, building, restoration
src/world/explore.js  G.Explored — which tiles the player has seen (per-chunk masks, saved as base64)
src/world/creatures.js G.Creatures — spawns/updates/draws wildlife around the screen + water ripples
src/world/weather.js  G.Weather — the current weather, smooth blending between kinds, wind gusts, rainbows, rain regrowth
src/world/villagers.js G.Villagers — lost spirits (seeded spots), followers, settled friends' days, talking, gifts, save/load
src/game/player.js    G.Player — movement and collision
src/game/save.js      G.Save — localStorage save/load
src/game/crafting.js  G.Crafting — workbench reach, tools (bonus drops, needs), recipe blockers, picking buildings up
src/render/sprites.js how each tile / object / structure / the player is drawn
src/render/workshop_sprites.js reeds, crystal, workbench, beacon, fence, flower bed, bench (adds to the tables above)
src/render/creature_sprites.js G.CREATURE_SPRITES — how each creature is drawn
src/render/weather_fx.js G.WeatherFX — draws cloud shadows, grey skies, rain + splashes, wind-blown leaves, fog, rainbow
src/render/villager_sprites.js G.drawVillager, G.VILLAGER_HATS, G.drawSpeech (bubbles), G.drawFollowThreads
src/render/renderer.js G.Renderer — draws a frame: ground, objects, particles, lighting
src/ui/ui.js          G.UI — inventory bar, crafting panel, messages, clock
src/ui/minimap.js     G.Minimap — corner minimap + big map (M); cached 1px-per-tile chunk images
src/ui/goals.js       G.Goals — the goal tracker panel: shows progress, celebrates, gives rewards
src/main.js           game state, main loop, player actions, title screen
tools/check.sh        syntax check + headless play test (run before committing)
tools/smoke_test.py   plays the game in a headless browser, saves screenshots
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
- **Drawing order**: ground → fish + ripples → floor structures → objects/standing
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
