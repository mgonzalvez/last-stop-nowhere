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

---

# Implementation Plan — Milestone 2: Dead Stock

Source brief: `project_plan.md` §7 (Zombie AI — Phase Two), pillars B + E.
Milestone 1 is complete (C1–C14, pushed). Scope: **zombies only** — no hunger/
stamina, no inventory, no crafting, no safehouse, no weapons, no procedural
gen, no zombie swarms/tactics.

Zombies are environmental threats: outrunning and avoiding them should feel
safer than anything else (the player has no combat in M2).

## Design constants (fixed for the milestone)

- **Zombies**: 7 fixed spawn points (data, `zombieSpawns.ts`); speed 55 px/s
  (player is 150 — always outrunnable); all passable tiles incl. doors.
- **Senses**: detect range 6 tiles + line of sight (walls block sight); noise
  radius: player still 0, moving 5, sprinting 9; attack range 0.9 tiles.
- **Timers**: investigate dwell 3 s; chase loses interest after 5 s without
  LOS; attack windup 0.4 s then 12 damage per 1 s tick.
- **Player**: health 100, no regen, no weapons; Shift = sprint (1.5× speed,
  9-tile noise); death → frozen world + overlay + R restart.
- **Casual mode**: **C** key toggles a threat-free wander (opt-in, default
  OFF). Casual = zombies never detect, investigate, or attack the player
  (no damage at all while casual); they keep wandering as ambience. Small
  "CASUAL" indicator top-right while on. Implemented as a flag in the AI
  context: while casual, zombies treat the player as absent.
- **Determinism**: all AI decisions on a seeded RNG (mulberry32); decisions at
  8 Hz (brief: 5–10 Hz), pathfinding only on decision ticks — never per frame.

## New files

- `src/world/Zombie.ts` — zombie state (pos, fsm, timers, path queue, speed).
- `src/data/zombieSpawns.ts` — 7 fixed spawn tiles (streets, yards, store lot).
- `src/systems/Pathfinding.ts` — A* over WorldMap passability (pure).
- `src/systems/LineOfSight.ts` — Bresenham over passability (pure).
- `src/systems/ZombieAI.ts` — FSM: IDLE / WANDER / INVESTIGATE / CHASE / ATTACK
  (pure; seeded; decision-accumulator inside).
- tests: `pathfinding.test.ts`, `lineOfSight.test.ts`, `zombieAI.test.ts`,
  `zombieMovement` cases inside `zombieAI.test.ts`.
- GameScene: zombie sprites + depth, health HUD, death overlay, sprint key.
- `tutorialMessages.ts`: one new message (first time a zombie starts chasing
  you) in the S.A.F.E. voice.

## Chunk 15 — Zombie entity + art + rendering (+ casual mode)

`Zombie.ts` state + `zombieSpawns.ts` (7 spawns, all passable); procedural
zombie texture (pale-green figure, arms forward, distinct from player,
slight per-zombie tint via Image tint); GameScene renders zombies at spawn
with `depthFor`. **Casual mode**: `C` key toggles the scene's `casual` flag
(default off) with a small top-right indicator; the flag is stored for the
AI chunks (C18+) and shown in the debug overlay.
Verify: tsc + build + spawn-validity test (7 passable tiles) + headless shot
shows 7 zombies (pixel check), no errors.

## Chunk 16 — Pathfinding (A*)

`Pathfinding.ts`: `findPath(map, from, to)` → tile list; passability =
WorldMap's; 4-directional; returns null when unreachable; step-capped
(512 nodes). No per-frame use — decision ticks only.
Verify: tests — straight line, path around a house wall, unreachable → null,
start==end → [], path stays on passable tiles on the real map.

## Chunk 17 — Line of sight + noise

`LineOfSight.ts`: `losClear(map, a, b)` (Bresenham over blocking tiles;
adjacent tiles always clear). Noise model: `playerNoiseRadius(input)` →
0 / 5 / 9.
Verify: tests — clear street sight; house wall blocks; window/wall/door
behavior pinned; noise radius by input.

## Chunk 18 — Zombie movement + FSM: IDLE/WANDER

Path-follow movement (constant px/s along the path polyline, arrival handling,
repick on failure) inside `ZombieAI.ts`; IDLE (1–3 s) ↔ WANDER (seeded random
target 3–8 tiles away, path-walk). 8 Hz decision accumulator; seeded RNG.
Verify: tests — wander picks reachable targets, follows path, transitions
fire with seeded determinism (same seed → same sequence); headless shot:
zombie moved from spawn within N ticks.

## Chunk 19 — INVESTIGATE

Noise within radius → INVESTIGATE player's current tile (last known position);
path there, dwell 3 s scanning, then WANDER (lost interest). Multiple zombies
may investigate; no group behavior.
Verify: tests — noise triggers investigate with correct LKP; dwell ends;
no noise → stays wandering; headless: moving player (simulated input) draws a
nearby zombie to their tile.

## Chunk 20 — CHASE

LOS + range 6 → CHASE: path to player at decision ticks; if no LOS for 5 s →
fall back to INVESTIGATE (last known). Chase re-paths at the decision rate
(never per frame).
Verify: tests — visible player flips WANDER→CHASE; hiding behind a wall
(LOS blocked, no noise) drops CHASE→INVESTIGATE after 5 s; headless: zombie
chases a moving player, keeps pathing around a house.

## Chunk 21 — ATTACK + player health + death

ATTACK: within 0.9 tiles → windup 0.4 s, then 12 damage per second until
player leaves range. Player health 100, no regen. Health bar HUD (small,
top-left under the debug line). Death: world freezes (pause-style early
return), dim overlay, dry S.A.F.E.-voiced epitaph, R restarts.
Verify: tests — attack window/timing, damage accumulation, break range;
headless: zombie pinned next to player drains health to 0, overlay renders,
R restarts.

## Chunk 22 — Sprint

Shift = sprint: 1.5× speed while held, noise radius 9. No stamina (later
phase). Verify: movement tests — sprint speed + noise; headless: sprinting
player's chase gets investigated/chased from farther.

## Chunk 23 — S.A.F.E. message + debug overlay

`zombie.chased` event → one-shot message on first chase. Debug overlay:
append per-zombie line `z0 IDLE @(x,y)` … `z6 …` (state + tile).
Verify: tests — message delivers once, only on chase; headless: debug shows
7 zombie states; shot of first-chase banner.

## Chunk 24 — Tests, docs, final verification

Full suite green; README (zombies, sprint, health, death), CHANGELOG (M2
entries C15–C24), AGENTS.md status + zombie system notes; remove all TEMP
verification hooks; final acceptance walk (below).

## M2 acceptance checklist

- [ ] 7 zombies wander the neighborhood, visible, depth-correct
- [ ] Casual mode (C): zombies never react to the player; indicator visible
- [ ] A* paths around buildings; unreachable → no path (no crashes)
- [ ] LOS: walls block detection; open street detects within 6 tiles
- [ ] Noise: moving/sprinting player draws investigation; still = silent
- [ ] CHASE re-paths at 8 Hz max; 5 s without LOS → lose interest
- [ ] Attack within 0.9 tiles; health drains; death overlay; R restart
- [ ] Player always outruns (sprint 225 vs 55 px/s); sprint makes noise
- [ ] Health HUD visible; S.A.F.E. first-chase message; debug shows states
- [ ] All AI deterministic under a fixed seed (unit-proven)
- [ ] tsc strict clean, all tests green, build clean, no console errors

## Out of scope (M2)

Hunger/stamina, inventory, items/weapons, crafting, safehouse, zombie
despawn/regen, player combat, swarm tactics, procedural zombies, save system.
