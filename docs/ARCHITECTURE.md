# How the code is organised

Plain JavaScript, no build step. Every file adds to one global object `G`.
`index.html` loads the files in order; `src/main.js` runs last and starts the game.

```
index.html            page + HUD markup, loads all scripts
style.css             look of the HUD, menus, title screen
src/core/rng.js       seeded randomness (G.hash2, G.rng) + small math helpers
src/core/noise.js     smooth noise for terrain (G.valueNoise, G.fbm)
src/core/input.js     keyboard / mouse / touch (G.Input)
src/data/content.js   ALL content: tiles, items, objects, structures, recipes
src/world/world.js    G.World — terrain generation, what's where, gathering, building, restoration
src/game/player.js    G.Player — movement and collision
src/game/save.js      G.Save — localStorage save/load
src/render/sprites.js how each tile / object / structure / the player is drawn
src/render/renderer.js G.Renderer — draws a frame: ground, objects, particles, lighting
src/ui/ui.js          G.UI — inventory bar, crafting panel, messages, clock
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
- **Drawing order**: ground → floor structures → objects/standing structures and
  the player row by row (so things lower on screen are in front) → particles →
  lighting → vignette.
- **Debugging**: `G.state` in the browser console is the whole game state.
  Opening `index.html?autostart` skips the title screen with a fixed seed.

## Adding a thing (example: a new building)
1. Add it to `G.STRUCTURES` and a recipe to `G.RECIPES` in `src/data/content.js`.
2. Add a draw function with the same name to `G.STRUCTURE_SPRITES` in `src/render/sprites.js`.
That's it — the crafting menu, placing, saving and lighting all pick it up.
