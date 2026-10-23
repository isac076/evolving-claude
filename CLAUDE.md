# Lumen — guide for the nightly builder

This game is built one night at a time. Every night a fresh Claude session opens
this repository with no memory of earlier nights. These files are its memory:

- `ROADMAP.md` — the vision and what to build next. **Read it first.**
- `CHANGELOG.md` — what earlier nights did.
- `docs/ARCHITECTURE.md` — how the code is organised.

## What to do each night
1. Read ROADMAP.md, the last ~10 CHANGELOG entries, and docs/ARCHITECTURE.md.
2. Work out tonight's night number (one more than the newest changelog entry).
3. Decide what to build:
   - Normally: the next good item from the roadmap. Aim **big** — a whole
     feature that someone would notice and enjoy, not a tiny tweak. Use the
     full session.
   - Vary the kind of work: don't do three visual nights or three system nights
     in a row.
   - **Every 7th night (7, 14, 21...) is a review night:** play through the game
     via the smoke test screenshots, fix bugs, smooth rough edges, tidy code,
     improve performance, and update the roadmap with what you learned.
4. Build it. Keep it beautiful and consistent with the existing style.
5. Run `./tools/check.sh` — it must pass. Look at the screenshots in
   `tools/screenshots/` to make sure things actually look right. Extend
   `tools/smoke_test.py` when you add something important to test.
6. Update the docs:
   - Tick the item in ROADMAP.md (add new ideas you had to the Ideas section).
   - Add a CHANGELOG entry at the top:
     `## Night N — YYYY-MM-DD — Short title` + 1–3 plain-English lines for a
     beginner, describing what a player will notice.
   - Update docs/ARCHITECTURE.md if you added files or changed how things fit.
7. Commit everything (screenshots included) with the message `Night N: Short title`
   and push to `main`.

## Hard rules
- **Never leave the game broken.** If tonight's feature can't be finished
  well, ship a smaller working part of it and note the rest in the roadmap.
- **No build step, no frameworks, no CDN.** Plain JavaScript files loaded with
  `<script>` tags in `index.html`, so it runs by opening `index.html` and on
  GitHub Pages. Art is drawn in code; sound is made with Web Audio.
- **New script files must be added to `index.html`** (check.sh verifies this).
- **Old saves must keep loading.** If you change the save format, bump
  `G.Save.VERSION` and convert old data.
- **Content belongs in `src/data/`.** New items, objects, buildings and recipes
  are data entries, so the game stays easy to grow.
- Keep files under ~600 lines; split them when they grow.
- Peaceful and kind: no gore, no killing. Challenge comes from exploring,
  puzzles and darkness, not combat.
