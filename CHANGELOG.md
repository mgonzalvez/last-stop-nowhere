# Changelog

All notable changes to Last Stop, Nowhere. Milestone 1 — "Walk the Neighborhood".

## 0.1.0 — Milestone 1 complete

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
