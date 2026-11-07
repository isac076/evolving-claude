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
- [x] Seasons that slowly change colours, plants and weather (Night 12 — a year of 4 × 3 days: spring blossom, lush summer with fireflies, autumn gold with falling leaves and mist, winter snow with bare trees, snowfall, footprints, white rabbits and scarves; gardens grow by season)
- [x] Regrowth looks alive: saplings grow into trees over time (Night 8 — plant acorns; chopped trees leave stumps that sprout again, reeds/flowers/pebbles/crystals visibly grow back)

## Chapter 3 — Deeper crafting & building
- [x] Tools: an axe and pick that gather faster / more (Night 4 — the pick also unlocks crystal)
- [x] Workbench: more recipes unlock when standing near it (Night 4)
- [x] New materials: fibre (reeds) and crystal (highlands) (Night 4)
- [x] Seeds (from blooms) and acorns (from trees) (Night 8)
- [ ] More materials: clay (riverbanks)
- [x] Gardens: plant seeds, water them, watch them grow (Night 8 — sprouts, saplings, watering can, rain waters gardens, rare moonflowers)
- [x] Decorations: fences that join up, flower beds, benches (Night 4)
- [ ] More decorations: banners, signposts (with a name you type), stepping stones
- [x] Bigger lanterns / beacons with larger restore radius (Night 4 — Crystal Beacon)
- [ ] Storage chest

## Chapter 4 — The return of the villagers
- [x] Lost spirits found wandering the faded world; lead them home (Night 6 — pale dots on the map, friends hint where others are)
- [x] Villagers settle near lanterns and walk around, with simple daily routines (Night 6 — they visit things they love, sleep by their light, give a daily gift)
- [x] Houses villagers build or you build for them (Night 10 — cottages: a friend near your light moves in, sleeps inside with a glowing window, smoke from the chimney)
- [x] Dialogue and small requests (bring me 5 petals...) with rewards (Night 10 — friends' wishes: bring, build, plant, light, rescue; heart bubbles, a wishes list, friendship hearts, bigger gifts from close friends)
- [ ] Villagers unlock new recipes, music, and abilities (Night 11: friends now also remember where ruins are; Night 9: music done — awake friends nearby join the song; Night 10: the first wish teaches the Cottage via `unlock` on recipes — more recipes/abilities to come)
- [x] A village that visibly grows over time (Night 13 — cottages within 9 steps form a named hamlet; friends build a well (waters gardens), then a market stall (daily swaps), then a ribbon pole; friends meet at the well at dusk; festivals with dancing, bunting and sky lanterns on each season's last evening)

## Chapter 5 — Exploration
- [ ] New biomes: snowy peaks, desert, mushroom forest, crystal caverns, islands
- [ ] Each biome has its own materials, plants, creatures and restoration look
- [x] Ruins and points of interest scattered through the world (Night 11 — stone circles, fallen gates, dry fountains, sleeping keepers, halls of lanterns; each hides a memory stone that lights up the land when woken)
- [x] Discoveries journal / collection book (Night 11 — J: Memories, Places, Creatures, Friends)
- [ ] Lantern network fast travel
- [ ] Boats to cross wide seas

## Chapter 6 — The mystery of the Fading
- [x] Lore fragments found in ruins tell what happened (Night 11 — 12 memories in `G.LORE`, told in order; they set up the Great Sun, the Heart and the Ember Shrines)
- [x] Ember Shrines: big goals spread across the world that each restore a huge area (Night 15 — four shrines further and further out; four ember bowls each want an offering; the hearth kindles and a wave of colour rolls out 26 tiles; sensed after 3 memories, an ember arrow points the way; the first one teaches the Ember lantern)
- [ ] Gentle shadow creatures at night that dim your light — repelled by light, never fought
- [ ] A final goal: rekindle the Great Sun — and a beautiful ending (that lets you keep playing)

## Chapter 7 — Music & presentation
- [x] Generative music that changes with time of day, biome and restoration (Night 9 — a new tune every piece; grey land gets lonely notes, colour adds bass, melody and sparkle; morning/day/dusk/night/rain/fog moods; the ground picks the instrument; a Music slider)
- [ ] Richer lighting: light shafts, reflections in water, soft shadows (Night 14: breathing shore foam along the curved coasts)
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

## Review notes (Night 14)
What a play-through (all 44 screenshots) taught us:
- With every goal done, the tracker drew one pip per goal (52!) — the row ran off the panel and under the toasts.
  It now shows one glowing pip per chapter, and pips wrap if a chapter ever grows long.
- The market panel sat on top of the minimap, which showed through it; the minimap now steps aside while trading.
- A friend talking far off screen had their bubble pinned into the screen corner (half under the minimap); bubbles
  of off-screen speakers are no longer drawn.
- Code tidy: the player's actions (gather, water, talk, build, pick up, clicks) moved from `main.js` (585 → ~410 lines)
  into `src/game/actions.js`; friends' talking moved into `src/world/villager_talk.js`; the weather and villager parts of
  `tools/smoke_test.py` became `smoke_weather.py` and `smoke_villagers.py` (535 → ~340 lines).
- The village spot-finder was read through: a cottage's own tile, the two above and the doorstep below are always kept
  clear, and it only builds on land. It looked right in every screenshot.
- Polish: shores now have a soft, breathing line of foam and a faint wave that rolls in and out, following the curved coast.

## Notes for the next review (Night 21)
- `src/world/creatures.js` (~400) and `src/audio/sound.js` (~380) are the next biggest files — fine for now, watch them.
- Chunk caching for the ground is still the big performance win left (Chapter 8).
- The phone layout has no virtual joystick yet; tap-to-walk works but a joystick would feel much better.

---

## Ideas (anyone can add here)
- Shrines: the Great Sun finale (Chapter 6) can read `stats.shrines.lit` — with all four embers burning, a path of light could lead to the Sun's hearth
- Shrines: friends could make a pilgrimage to a kindled shrine and sit by its bowls; a festival of embers on the night the last one kindles
- Shrines: each kindled shrine could add a "voice" to the music (G.MUSIC_BAND-like layer) or change the ambience near it (warm crackle)
- Shrines: biome shrines once Chapter 5 arrives (an ice shrine in the snowy peaks wanting crystal and snow)
- The ember arrow idea could guide to other things too (a lost spirit you were told about, a pinned map marker)
- Shore foam could sparkle with moonlight at night, and freeze into a pale rim of ice in deep winter
- Village: more stages — a bakery (bread as a gift friends love), a little bridge or a lamp-lit square of paths, a village bell
- Village: festival games (catch falling petals, a lantern-lighting race) and a festival goal per season ("see all four festivals")
- Village: friends trade among themselves at the stall; the stall keeper changes each day and offers their kind's favourite swaps
- Village: a signpost at the edge of each village showing its name (the sign idea from Chapter 3 could reuse it)
- Village: two villages could become "sister villages" and friends walk the road between them (paths you build guide them)
- Seasons: a harvest festival in autumn and a lantern festival on the longest winter night (friends gather at the Heart Stone)
- Seasons: frozen ponds you can walk across in deep winter (only shallow water; fish asleep under the ice), and icicles on cottages
- Seasons: build a snow-spirit (snowman) in winter; collect fallen leaves in autumn for a leaf-pile decoration that rabbits hide in
- Seasons: seasonal crops (pumpkins in autumn, snowdrops that only bloom in winter, cherry trees that are pink all spring)
- Seasons: a season wheel on the Resting menu or journal showing where in the year you are; a "seasons seen" journal page
- Seasons: longer days in summer, shorter in winter (G.daylight would read G.SEASON_NOW) — check every test that relies on night times
- Seasons: the music could pick seasonal moods (a winter waltz, spring birdsong motifs) via G.MUSIC_MOODS
- Ruins: more kinds (a sunken stair, a broken bridge over a stream, an old well, an overgrown greenhouse) — each is a stamp in G.RUIN_SITES
- Ruins: biome-specific ruins once Chapter 5 biomes arrive (an ice temple in the snowy peaks, a buried sun-dial in the desert)
- Ruins: a rare "keeper's chest" in some ruins with an old tool or a recipe (e.g. a lantern design) inside
- Ruins: friends who visit a woken ruin and sit by the stone; a dreamer could "hear" the next memory before you find it
- Memory stones could each hum one phrase of an old song; wake them all and the whole melody plays (ties into Chapter 6 music)
- The journal could get a "Songbook" page (piece titles heard) and a "Garden" page (everything grown, rare moonflowers)
- After all 12 memories, point the way to the first Ember Shrine (Chapter 6) — the story already promises them
- Map: the big map could show a faint "?" where friends said a ruin might be
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
- Snow in the coming snowy peaks biome (winter snowfall is done — G.WeatherFX.drawSnow can be reused there)
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
- Smooth grass lightness between tiles the same way restoration is blended (the faint grid would vanish)
- Reduced-motion option in the Resting menu: calmer rain, no screen-wide leaves, slower water shimmer
- The Resting menu could show a little "this world so far" page: days, lights, friends, creatures met, rainbows seen
- Remember the last chosen music/sound mix per device (prefs are already in localStorage 'lumen-sound')
- More garden crops: berry bushes (berries as gifts friends love), sunflowers that turn to follow the sun, pumpkins for a harvest festival
- Gardeners could water your sprouts for you when they pass by; a friend's request "plant 3 flowers by my home"
- Bees that visit grown flowers and a beehive structure; butterflies prefer garden blooms
- A garden plot / tilled-soil floor structure where plants grow faster, and fences that keep rabbits out (they nibble sprouts — gently)
- Music: a festival night where every friend in the world gathers at the Heart Stone and the whole band plays
- Music: a "music box" decoration you build that plays the current tune's melody when you stand near it, even in grey land
- Music: each new biome (Chapter 5) gets its own entry in G.MUSIC_PLACES (snow = celesta, desert = oud-like pluck)
- Music: the discoveries journal could list every piece title you've heard ("songbook")
- Music: lost spirits hum a tiny broken fragment of the tune; it becomes whole when they come home
- Music: Ember Shrines (Chapter 6) could each restore one "voice" of a great final song
- Wishes: more friend-taught recipes via `unlock` (tinkerer → storage chest, singer → wind chime, gardener → garden arch) at 2–3 hearts
- Wishes: knock on a cottage door at night (click it) and the friend peeks out sleepily; a "visit" counts as talking
- Cottages: let the player pick the roof style or name plate; friends decorate their cottage more as hearts grow (flowers, a lantern by the door)
- Wishes: a friend's wish could point at a far place ("bring me a crystal from the highlands") and mark it on the map
- A village square: once 3 cottages stand near each other, a well appears and friends gather there in the evening
- Friendship hearts could be shown on a friends page in the journal (with favourite things and how many wishes came true)
