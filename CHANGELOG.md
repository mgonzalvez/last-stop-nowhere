# Changelog

All notable changes to Last Stop, Nowhere.

## 0.3.0 — Milestone 3 complete: Scavenge

The survival economy is live: hunger and stamina, a 16-slot stackable
inventory with a 1–8 hotbar, and six one-shot loot crates with weighted,
seeded, per-location tables. Eat, patch up, and make the neighborhood's
last wooden crate count. All new systems are pure, seeded, and unit-tested.

- **C33 — Tests, docs, final verification.** Removed every temporary
  headless-verification URL hook (autostart/invtest/nearcrate). Updated
  README (survival, inventory, loot, controls), this changelog, and
  AGENTS.md. Final walk: tsc clean, 174/174 tests, build clean, title +
  game render with no console errors.
- **C32 — Casual interaction + debug + tutorial.** Casual (C) now also
  freezes the hunger axis (no decay, no starvation — pure sightseeing).
  Debug overlay adds hunger/stamina values + one line per crate (location
  + looted status). New `hunger.low` S.A.F.E. advisory (one-shot at 25).
- **C31 — Loot tables + opening.** Weighted tables per location (kitchen
  food-heavy, store varied, yard resource-heavy); `LootSystem` rolls 3–5
  items per crate on `mulberry32(LOOT_SEED + id)`; **E** opens the nearest
  unlooted crate, overflow is lost, spent crates dim and never re-roll.
  One-shot `first.loot` S.A.F.E. message.
- **C30 — Loot containers.** Six fixed crates (3 house kitchens, 2 corner
  store, 1 yard) with passability tests; procedural crate texture;
  `[E] Search` prompt over the nearest unlooted crate in range (1.0 tile).
- **C29 — Item use + hotbar.** Keys **1–8** consume consumables from the
  hotbar (eat/heal); carry-only tools and resources are untouched. Pure
  `ItemUse` module. One-shot S.A.F.E. messages on first eat and first heal.
- **C28 — Inventory UI.** **I** toggles a 4×4 overlay (world freezes while
  open; **I**/**ESC** closes); starting items (knife, canned soup, bandage,
  flashlight, water) placed on create; slots 1–8 labeled as the hotbar.
- **C27 — Inventory core.** 16 fixed slots, per-item maxStack (food 10,
  medical 5, tool 1, resource 10), add fills existing stacks then empty
  slots and reports the dropped count; full 14-item flat catalog.
- **C26 — Survival HUD + sprint gate.** Hunger (orange) + stamina (green)
  bars under the health bar with STARVED/EXHAUSTED warnings; sprint is
  blocked while the exhaustion latch is set.
- **C25 — Hunger + stamina stats.** Pure `StatsSystem`: hunger decays 0.25/s
  (starvation = 2 health/s at 0), sprint drains 30/s, regen 20/s, exhaustion
  latch with hysteresis (clears at 20). `applyItem` clamped restores.

## 0.2.0 — Milestone 2 complete: Dead Stock

Seven procedural zombies now roam the neighborhood: they wander, investigate
noises, chase on line of sight, and bite when they catch up. Player health,
death + restart, sprint, and a casual threat-free mode. All AI is pure, seeded,
and unit-tested (8 Hz decisions, A* pathfinding, Bresenham LOS).

- **C24 — Tests, docs, final verification.** Removed every temporary
  headless-verification URL hook (wanderlog/chasetest/deathlog/sprinttest/
  autostart). Updated README (zombies, sprint, health, casual), this changelog,
  and AGENTS.md. Final walk: tsc clean, 111/111 tests, build clean, title +
  game render with no console errors.
- **C23 — S.A.F.E. chase message + debug zombie states.** One-shot
  `zombie.chased` advisory delivered the first time a zombie locks on; debug
  overlay now lists every zombie's FSM state + position (`z3 CHASE @33.2,20.3`).
- **C22 — Sprint.** **SHIFT** = 1.5× speed (225 px/s) with a 9-tile noise
  radius. No stamina (later phase). `inputVelocity`/`movePlayer`/
  `moveWithCollision` take an optional speed override.
- **C21 — ATTACK + health + death.** Melee range 0.9 tiles: 0.4s windup then
  12 damage/s until the player breaks range. Player health 100, no regen; at 0
  the world freezes, a dim overlay + dry S.A.F.E. epitaph appears, **R**
  restarts. Health bar HUD top-left.
- **C20 — CHASE.** Visible within 6 tiles + Bresenham LOS -> CHASE, re-pathing
  at the 8 Hz decision rate (never per frame). 5s without LOS collapses the
  chase into an INVESTIGATE of the last seen tile.
- **C19 — INVESTIGATE.** Noise within range -> path to the player's last known
  position, 3s dwell, then give up. Refreshes the LKP while the player keeps
  making noise. Casual mode = the player is unheard.
- **C18 — Zombie movement + IDLE/WANDER.** Smooth per-frame path following in
  screen space (exact px/s) + 8 Hz decisions. WANDER: seeded random target 3–8
  tiles, A* path, arrive -> IDLE (1–3s). mulberry32 seeded PRNG.
- **C17 — Line of sight + noise.** Bresenham LOS over the passability grid
  (diagonals don't cut corners; walls/windows/fences/trees/cars block, doors
  pass). Player noise: still 0, moving 5, sprinting 9 tiles.
- **C16 — A* pathfinding.** Pure A* over a passability predicate, 4-directional,
  512-node budget, null when unreachable. Tie-break on equal f prefers larger g
  to keep the search narrow across open terrain.
- **C15 — Zombie entity + art + casual mode.** `Zombie` state (fractional tile
  coords, 55 px/s, seed), 7 fixed spawns (validated passable), pale-green
  procedural zombie texture, per-seed tint. **C** toggles casual mode: zombies
  never hear/see/attack, keep wandering as ambience, top-right indicator.

## 0.1.0 — Milestone 1 complete: Walk the Neighborhood

- **C14 — Tests, docs, final verification.** Full unit-test coverage (projection,
  inverse, bounds, collision, movement, buildings, tutorial, debug). Wrote
  README.md, expanded AGENTS.md (architecture), this changelog. Removed every
  temporary headless-verification URL hook. Final acceptance walk: tsc clean,
  58/58 tests, build clean, no console errors across title/game/pause/restart/
  debug flows.
- **C13 — Debug overlay.** F3 toggles an overlay with FPS, player tile coords,
  player world position, entity count, and renderer mode (`DebugStats` pure
  formatter, ~10Hz refresh, view-pinned, works while paused).
- **C12 — S.A.F.E. tutorial foundation.** Data-only catalog
  (`src/data/tutorialMessages.ts`), pure event-triggered one-shot delivery
  (`TutorialSystem`), welcome banner on start with auto-dismiss, runtime
  disable via T. Cheerfully bureaucratic copy per the brief.
- **C11 — Title screen + pause.** TitleScene (SPACE/ENTER/click to start) in
  the scene flow; ESC pause overlay (dim + PAUSED) freezing the world, R
  restarts cleanly.
- **C10 — Camera.** Phaser RESIZE scale (window-resize support), smooth player
  follow (lerp 0.12), bounds clamped to the map diamond, mouse-wheel zoom
  0.5×–2× via the scene `wheel` event.
- **C9 — Depth ordering.** Pinned the isometric depth contract (player vs
  buildings by fractional tileX+tileY, roof float, tall objects by foot tile,
  cars by midpoint) with unit tests + headless occlusion verification.
- **C8 — Buildings & interiors.** `Buildings.ts`: roofed connected components
  with door association; `buildingAt` predicate; per-building roof fade
  (hides on entry, restores on exit). Deterministic enter/exit walk tests.
- **C7 — Collision.** `CollisionSystem`: per-axis resolution against tile
  passability with wall sliding; doors pass, walls/windows/fences/trees/cars
  block; 0.5-tile footprint.
- **C6 — Player movement.** `Player` state + pure `MovementSystem`:
  screen-relative 8-direction input, normalized diagonals, frame-rate
  independent.
- **C5 — Map rendering.** Full 48×48 neighborhood rendered: one-graphics ground
  diamonds, extruded wall/door/window sprites, floating roofs, fences, trees,
  cars, player sprite.
- **C4 — Procedural artwork.** Every texture drawn at boot with Phaser
  Graphics (fillRect/fillTriangle/fillCircle primitives only — `fillPoints`
  renders empty in the headless canvas fallback).
- **C3 — Tile types + map data.** `MapData` (handcrafted layout), `WorldMap`
  (passability, out-of-bounds = wall, roof-tile set).
- **C2 — Iso projection.** `IsoProjection`: 64×32 diamonds, `tileToScreen` /
  `screenToTile` exact inverse, configurable origin.
- **C1 — Bootstrap.** Vite + TypeScript strict + Phaser + vitest scaffold.
