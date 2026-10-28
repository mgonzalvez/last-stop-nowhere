# Implementation Plan — Milestone 1: Walk the Neighborhood

Source brief: `project_plan.md`. Scope is Milestone 1 only — no zombies, combat, inventory, or advanced procedural generation.

Each chunk ends with a verify step. Fix errors before moving to the next chunk.

## Chunk 1 — Bootstrap

Scaffold Vite (vanilla-ts template) in `last-stop-nowhere/`; add `phaser`, `vitest`.
Verify: `npm install`, `npm run build`, `npm run dev` all succeed.

## Chunk 2 — Iso projection + tests

`src/world/IsoProjection.ts`: 64×32 diamonds, `tileToScreen`, `screenToTile`, map bounds.
Verify: `npm test` (round-trip, bounds).

## Chunk 3 — Tile types + map data

`TileTypes.ts`, `MapData.ts` (48×48 handcrafted: 1 residential street, road, sidewalks, 3 houses, corner store, trees, cars, fences), `WorldMap.ts` (passability/collision lookup, independent of art).
Verify: tests for map bounds + collision rules (walls block, doors pass).

## Chunk 4 — Procedural artwork

`ProceduralAssets.ts`: draw diamond tiles per terrain type, walls/roofs, doors, trees, car silhouettes, player sprite — all via Phaser graphics → textures.
Verify: dev server renders (manual look; noted as unverified if no browser access).

## Chunk 5 — Map rendering

`BootScene` → `GameScene`; render full 48×48 ground layer + object layer (buildings, trees, cars) with depth.
Verify: dev — readable suburban neighborhood, no console errors.

## Chunk 6 — Player movement

`Player.ts` (authoritative state, logical world coords) + `MovementSystem`: 8-dir, normalized diagonals, WASD/arrows.
Verify: smooth 8-dir movement; diagonal speed = axis speed.

## Chunk 7 — Collision

`CollisionSystem`: per-axis movement against tile passability (slide along walls).
Verify: can't pass walls/trees/cars; door tiles pass.

## Chunk 8 — Buildings & interiors

Accessible house with wood-floor interior; roof-hide/fade when player enters footprint.
Verify: enter/exit via doorway; roof hides correctly.

## Chunk 9 — Depth ordering

`DepthSorting.ts`: player vs objects by `(tileX + tileY)` with tall-object handling.
Verify: player correctly in front of/behind buildings, trees.

## Chunk 10 — Camera

Follow player, clamp to map bounds, mouse-wheel zoom, 1280×720 + window resize.
Verify: follow/clamp/zoom/resize all work.

## Chunk 11 — Title screen + pause

Title scene with Start; Escape pause overlay (Resume / Restart).
Verify: both work, game resumes/restarts cleanly.

## Chunk 12 — S.A.F.E. tutorial foundation

`data/tutorialMessages.ts` (data-only, event-triggered, disable flag); one welcome message on start.
Verify: message appears once, no spam, toggleable.

## Chunk 13 — Debug overlay

F3 toggle: FPS, player tile coords, player world pos, entity count, renderer mode.
Verify: values update live.

## Chunk 14 — Tests, docs, final verification

Complete unit tests (projection, inverse, bounds, collision); write `README.md` (controls + launch), `AGENTS.md` (architecture/conventions/commands), `CHANGELOG.md`.
Verify: `tsc` clean, `npm test` green, `npm run build` clean, acceptance checklist from §13 of the brief walked. Then stop — no zombies/inventory.
