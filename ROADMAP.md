# Lumen — Vision & Roadmap

## The vision
The world has faded to grey. You are a small lantern spirit — its last light.
By gathering, crafting and building lanterns you bring colour, life and people
back to an endless, hand-crafted-feeling world. Over time the game grows from a
quiet sandbox into a full adventure: living creatures, weather and seasons,
villagers who return and build lives in the places you restore, distant biomes
to explore, a gentle mystery about why the world faded, and music that blooms
as the world does.

**Feeling:** cozy, beautiful, wondrous. Never violent. Progress should be
*visible* — the world itself is the reward.

## How to use this roadmap
- Work roughly top to bottom, but you may pick any unchecked item that fits well.
- Tick items (`[x]`) when done, and note the night: `[x] Minimap (Night 4)`.
- Big items can be split across nights — break them into sub-items here first.
- **Add new ideas** to the Ideas section at the bottom whenever you have them.
- You may reorder, rewrite or add chapters as the game teaches you what it wants
  to be — but keep the vision.

---

## Chapter 1 — A solid, lovely foundation
- [x] Endless seeded world with biomes, gathering, crafting, building, saving, day/night (Night 0)
- [x] Smooth restoration edges (colour should fade softly, not tile by tile) (Night 3)
- [x] Gentle sound effects with Web Audio (gather, build, footsteps, UI) (Night 1)
- [x] Ambient soundscape that changes with day/night and restoration (Night 1)
- [x] Minimap (toggle with M) showing explored land and lanterns (Night 2)
- [x] First-time tutorial goals ("gather 3 wood", "craft a lantern"...) with a small goal tracker (Night 2)
- [x] Settings menu (volume, controls help, new world) with Esc (Night 7 — the "Resting" menu pauses the world; also world-sound volume, larger text, key hints)
- [x] Remove/pick up placed buildings (refund materials) (Night 4 — press X)

## Chapter 2 — A living world
- [x] Butterflies and birds that only appear in restored land (Night 3, plus moths at lanterns by night)
- [x] Fish visible in restored water; ripples when walking near water (Night 3 — fish leap too)
- [x] Wildlife that reacts to the player (rabbits, deer that flee and return) (Night 3: rabbits, startled birds — deer still to come)
- [x] Weather: rain, wind, fog — with visuals and sound (Night 5 — plus overcast skies, drifting cloud shadows, rainbows, and frogs that only come out in the rain)
- [ ] Seasons that slowly change colours, plants and weather
- [ ] Regrowth looks alive: saplings grow into trees over time

## Chapter 3 — Deeper crafting & building
- [x] Tools: an axe and pick that gather faster / more (Night 4 — the pick also unlocks crystal)
- [x] Workbench: more recipes unlock when standing near it (Night 4)
- [x] New materials: fibre (reeds) and crystal (highlands) (Night 4)
- [ ] More materials: clay (riverbanks), seeds (from grown plants)
- [ ] Gardens: plant seeds, water them, watch them grow
- [x] Decorations: fences that join up, flower beds, benches (Night 4)
- [ ] More decorations: banners, signposts (with a name you type), stepping stones
- [x] Bigger lanterns / beacons with larger restore radius (Night 4 — Crystal Beacon)
- [ ] Storage chest

## Chapter 4 — The return of the villagers
- [x] Lost spirits found wandering the faded world; lead them home (Night 6 — pale dots on the map, friends hint where others are)
- [x] Villagers settle near lanterns and walk around, with simple daily routines (Night 6 — they visit things they love, sleep by their light, give a daily gift)
- [ ] Houses villagers build or you build for them
- [ ] Dialogue and small requests (bring me 5 petals...) with rewards (Night 6 added talking + daily gifts; requests still to come)
- [ ] Villagers unlock new recipes, music, and abilities
- [ ] A village that visibly grows over time (market, well, festival)

## Chapter 5 — Exploration
- [ ] New biomes: snowy peaks, desert, mushroom forest, crystal caverns, islands
- [ ] Each biome has its own materials, plants, creatures and restoration look
- [ ] Ruins and points of interest scattered through the world
- [ ] Discoveries journal / collection book
- [ ] Lantern network fast travel
- [ ] Boats to cross wide seas

## Chapter 6 — The mystery of the Fading
- [ ] Lore fragments found in ruins tell what happened
- [ ] Ember Shrines: big goals spread across the world that each restore a huge area
- [ ] Gentle shadow creatures at night that dim your light — repelled by light, never fought
- [ ] A final goal: rekindle the Great Sun — and a beautiful ending (that lets you keep playing)

## Chapter 7 — Music & presentation
- [ ] Generative music that changes with time of day, biome and restoration
- [ ] Richer lighting: light shafts, reflections in water, soft shadows
- [ ] Animated title screen; smooth transitions
- [ ] Photo mode (hide UI, slow time)

## Chapter 8 — Polish & reach
- [ ] Performance: cache rendered chunks; keep 60fps on phones (Night 7: night layer drawn at half size + ground colours cached — frame time halved; chunk caching still to do)
- [ ] Great touch controls (virtual joystick)
- [ ] Accessibility: colour-blind friendly cues, text size, reduced motion (Night 7: larger-text option)
- [ ] Save migration so old saves always keep working
- [ ] Achievements / milestones

## Review notes (Night 7)
What a play-through taught us:
- Shores and biome edges looked like staircases. Ground types now have a `rank` and round their
  corners over lower ground — curving coasts for free. A soft foam line along shores would be next.
- On phones the status bar ran under the minimap and the keyboard hints made no sense; fixed with a
  small-screen layout and touch-only "how to play". A virtual joystick is still the big missing piece.
- A held key could stick when the window lost focus (the spirit walked on its own) — fixed.
- The night layer was the single most expensive thing to draw; it is now half-resolution.
- `tools/smoke_test.py` is near 600 lines: split it into a few files (by chapter) on the next review.
- Next nights should lean on Chapter 3–5 content (gardens, houses, new biomes) — the systems are solid.

---

## Ideas (anyone can add here)
- Fireflies can be caught in jars and used as small lights
- Constellations in the night sky that light up as you restore the world
- A cat that follows you around after you find it
- Volume slider in the settings menu (G.Sound.volume already exists and is saved)
- Each lantern gets its own soft hum / wind-chime you hear only when standing near it
- Rain on restored land could make the soundscape patter; puddles plink
- The ambient chord could follow the biome (highlands lower and airier, sand brighter)
- Map pins: click the big map to drop a named marker ("big lake", "go here later")
- After the first-steps goals, a gentle second chapter of goals (Chapter 2/3 features) using the same G.GOALS tracker
- The minimap could show villagers / lost spirits as soft dots once Chapter 4 arrives
- Lantern fast travel (Chapter 5) could live right on the big map: click a lantern to travel
- Deer, frogs on lily pads, ducks on lakes, owls at night — each is a G.CREATURES entry + sprite (+ move type if new)
- A "creature book" page in the discoveries journal listing every kind you've met (stats.met already tracks it)
- Stand still near a butterfly long enough and it lands on the spirit
- Creatures could have their own little sounds (rabbit thump, bird chirp near you) and seasons could change which ones appear
- Performance: the renderer now computes restoration at tile corners too — cache per chunk when lights don't change
- Sit on a bench (walk into it and wait): the camera eases out and time speeds up a little — a cozy "rest" moment
- Fences could keep rabbits in a garden; flower beds could attract more butterflies (creature `where` could check nearby structures)
- Tool upgrades: a crystal axe / crystal pick; a watering can for gardens
- A second workbench tier (a "crystal workbench") for Chapter 4/5 recipes
- Pick-up mode could also work on touch screens with a long-press
- Crystals could hum softly when you're near them at night (Ambience reading nearby crystal objects)
- Puddles that form on paths in heavy rain and slowly dry up afterwards (reflecting lantern light at night)
- A gentle thunderstorm far away: distant rumbles and a soft flash on the horizon (never scary)
- Snow in the coming snowy peaks biome / in winter, using the same G.WeatherFX drop system with slow, swaying flakes
- Seasons could change the weather weights (more rain in spring, fog in autumn) — G.WEATHER weights are plain data
- A rain barrel or watering can that fills up in the rain, for gardens
- Sitting on a bench in the rain under a little roof: a "shelter" structure (pergola) that keeps creatures near you in the rain
- A weather vane decoration that points with G.windDir and spins faster with G.windNow
- Villager requests: a friend's `wish` could become a real request ("build me a bench") tracked in the goal tracker, with a heart-shaped reward
- Little houses: when a light has all its friends, a tiny cottage could appear beside it (Chapter 4 "houses")
- Friends could wave at each other and chat (two bubbles) when they pass; singers could hum together at night
- A friends page in the journal: name, kind, home, favourite thing, days since they came home
- Lost spirits could appear in the big map legend; a far-off lost spirit's sigh could be heard in the ambience when it's near
- Friends in the rain could open tiny leaf umbrellas
- Villager kinds tied to new biomes (a snowy-peaks kind, a desert kind) once Chapter 5 arrives
- Shore foam: a soft, slowly breathing light line where water meets land (follow the rounded corners)
- Smooth grass lightness between tiles the same way restoration is blended (the faint grid would vanish)
- Reduced-motion option in the Resting menu: calmer rain, no screen-wide leaves, slower water shimmer
- The Resting menu could show a little "this world so far" page: days, lights, friends, creatures met, rainbows seen
- Remember the last chosen music/sound mix per device (prefs are already in localStorage 'lumen-sound')
