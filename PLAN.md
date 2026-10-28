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

## M2 acceptance checklist (walked in C24)

- [x] 7 zombies wander the neighborhood, visible, depth-correct
- [x] Casual mode (C): zombies never react to the player; indicator visible
- [x] A* paths around buildings; unreachable → no path (no crashes)
- [x] LOS: walls block detection; open street detects within 6 tiles
- [x] Noise: moving/sprinting player draws investigation; still = silent
- [x] CHASE re-paths at 8 Hz max; 5 s without LOS → lose interest
- [x] Attack within 0.9 tiles; health drains; death overlay; R restart
- [x] Player always outruns (sprint 225 vs 55 px/s); sprint makes noise
- [x] Health HUD visible; S.A.F.E. first-chase message; debug shows states
- [x] All AI deterministic under a fixed seed (unit-proven)
- [x] tsc strict clean, all tests green, build clean, no console errors

## Out of scope (M2)

Hunger/stamina, inventory, items/weapons, crafting, safehouse, zombie
despawn/regen, player combat, swarm tactics, procedural zombies, save system.

---

# Implementation Plan — Milestone 3: Scavenge

Source brief: `project_plan.md` §8 (Survival and Loot Systems), pillar A
(Scavenging is the central reward loop). Milestones 1–2 are complete
(C1–C24, pushed). Scope: **survival economy only** — hunger, stamina,
inventory, loot containers, consumable use. No combat, no weapon use, no
crafting, no safehouse, no procedural generation.

This starts the central loop (pillar A): hunger makes scavenging necessary,
scavenging fills the inventory, and the inventory lets you eat/heal and stay
alive. Tool/resource items are carried but not yet used (combat + crafting are
later phases).

## Design constants (fixed for the milestone)

- **Stats**: health 100 (M2, no regen). Hunger 100, decays 0.25/s (~1 per 4 s);
  at 0, starvation = −2 health/s. Stamina 100; sprint drains 30/s (~3.3 s),
  regens 20/s while not sprinting; at 0, sprint is blocked until it regens to
  20 (hysteresis to avoid flicker).
- **Casual (C)**: still threat-free vs zombies, and **hunger freezes** (no
  starvation) — pure sightseeing mode.
- **Inventory**: 16 slots, stackable per item `maxStack`. Hotbar = slots 1–8
  (keys 1–8 use them). **I** toggles the overlay; the world freezes while open
  (same early-return as pause).
- **Items**: categories food / medical / tool / resource. Food restores hunger,
  medical restores health, tool/resource are carry-only in M3. `maxStack`:
  food 10, medical 5, tool 1, resource 10. Flat data — no inheritance.
- **Starting items** (per brief): kitchen knife, canned soup ×1, bandage ×1,
  flashlight, water ×1.
- **Consumable effects**: canned soup +40 hunger, canned food +30 hunger,
  water +15 hunger, bandage +25 health, painkiller +50 health. All clamp to max.
- **Loot**: 6 fixed, handcrafted containers (passability verified by tests):
  house 1/2/3 kitchen ×1, corner store ×2, outdoor yard ×1. Each is looted
  **once** (E within 1.0 tile); each roll yields 3–5 items from a weighted
  table by location type (kitchen = food-heavy, store = varied, yard =
  resource-heavy). Full-inventory overflow is lost (no crash, no duplication).
  Rolls use the seeded RNG (`mulberry32(LOOT_SEED + containerIndex)`) →
  deterministic.
- **Keys**: **E** = search a container, **I** = inventory overlay, **1–8** = use
  hotbar. (WASD/arrows, SHIFT, C, T, F3, ESC, R unchanged.)
- **S.A.F.E.**: three new one-shot messages — first low-hunger warning, first
  container looted, first heal use.
- **Determinism**: all loot rolls and stat decay are pure + seeded; unit tests
  prove fixed-seed reproducibility.

## New files

- `src/data/items.ts` — item defs (id, name, category, maxStack, hunger/health
  restore); flat array + map, no inheritance.
- `src/data/lootTables.ts` — weighted tables per location type (kitchen/store/yard).
- `src/data/lootContainerSpawns.ts` — 6 fixed containers ([x, y, type]) +
  `LOOT_SEED` (mirrors `zombieSpawns.ts`).
- `src/world/Inventory.ts` — 16-slot state + stack logic (add/useAt/removeAt).
- `src/world/LootContainer.ts` — container state (x, y, type, looted).
- `src/systems/StatsSystem.ts` — `tickSurvival(player, dt, sprinting)` →
  `{ player, starving, exhausted }`; `applyItem(player, itemId)` → player.
  Pure.
- `src/systems/LootSystem.ts` — `rollLoot(table, count, rng)` → (itemId, qty)[]
  (stack-merged). Pure.
- `Player.ts` — add `hunger`, `stamina` to `PlayerState` (createPlayer defaults
  100/100; update existing PlayerState test literals).
- GameScene: stats HUD (hunger + stamina bars), inventory overlay, hotbar,
  container sprites + `[E] Search` prompt, E/I/1–8 keys, sprint gate, casual
  interaction.
- `tutorialMessages.ts`: 3 new one-shot messages (hunger.low, first.loot,
  first.healed).
- tests: `statsSystem.test.ts`, `inventory.test.ts`, `lootSystem.test.ts`
  (+ container spawn-validity cases).

## Chunk 25 — Stats: hunger + stamina (pure + tests)

Add `hunger`/`stamina` to `PlayerState` (createPlayer defaults 100; update
existing PlayerState test literals). `StatsSystem.ts`: `tickSurvival(player,
dt, sprinting)` → `{ player, starving, exhausted }` — hunger decay,
starvation → health decay, sprint drain vs regen, exhaustion gate with
hysteresis; `applyItem(player, itemId)` → player (clamped). No UI yet.
Verify: tests — hunger decay at fixed dt; starvation health drop once hunger
hits 0; sprint drains to exhausted; regen past threshold re-enables; applyItem
restores + clamps; no starvation decay when not starving.

## Chunk 26 — Stats HUD + sprint gate

Hunger + stamina bars top-left (under the health bar), live update; visual
warning when low/starving/exhausted. GameScene: `sprinting = SHIFT && !
exhausted`; call `tickSurvival` each frame after the pause/death early-returns
(stats freeze with the world, matching pause semantics).
Verify: tsc + build; dev render — bars move, sprint blocked while exhausted, no
console errors; headless shot.

## Chunk 27 — Inventory core (pure + tests)

`items.ts` (all items, flat data, categories, maxStack, restore values) +
`Inventory.ts` — 16 slots, `add(inv, itemId, qty)` (fills existing stacks then
empty slots, returns undelivered count), `useAt`, `removeAt`, `slotCount`.
Verify: tests — add fills stacks then new slots; overflow returns dropped
count; useAt decrements / clears at 0; per-item maxStack respected; starting-
item placement helper.

## Chunk 28 — Inventory UI + starting items

**I** toggles a 16-slot overlay; slots show item name + stack count; first 8
labeled 1–8 (hotbar). Starting items (knife, canned soup, bandage, flashlight,
water) placed on create. World freezes while the overlay is open (same
early-return as pause). **ESC** or **I** closes.
Verify: tsc + build; dev — open/close, starting items visible + correct, world
frozen while open, no errors; headless shot with the overlay open.

## Chunk 29 — Item use + hotbar + S.A.F.E.

1–8 uses the hotbar slot: `applyItem` (eat/heal) + `useAt` (consume); empty
slot is a no-op. One-shot messages: first eat, first heal.
Verify: tests — use restores stats + consumes the stack; empty is a no-op; dev
— eat soup (hunger up, stack −1), bandage (health up), messages fire once.

## Chunk 30 — Loot containers: data + state + render + prompt

`lootContainerSpawns.ts` (6 fixed containers — passability verified by tests);
`LootContainer.ts`; procedural crate texture (Graphics primitives only — no
fillPoints); render with `depthFor`; show an `[E] Search` prompt when the
player is within 1.0 tile of an unlooted container.
Verify: tsc + build; spawn-validity test (6 passable tiles, in the right
buildings); dev — crates visible in interiors, no console errors; headless shot.

## Chunk 31 — Loot tables + open (pure + tests)

`lootTables.ts` (weighted per location) + `LootSystem.rollLoot(table, count,
rng)` → (itemId, qty)[] (stack-merged; count 3–5 from the same seeded rng).
E opens the nearest unlooted container: roll with `mulberry32(LOOT_SEED +
index)`, `add` to inventory (overflow lost), mark looted (no re-roll), S.A.F.E.
first-loot message.
Verify: tests — rollLoot deterministic per seed; distribution follows weights
over N rolls; kitchen ≠ store ≠ yard; a container loots exactly once; overflow
lost; dev — opening adds items, container marked looted, no re-loot.

## Chunk 32 — Casual interaction + debug + tutorial

Casual (C) also freezes hunger (no starvation). Debug overlay (F3): add
hunger/stamina values + one line per container (`c0 KITCHEN looted` …).
S.A.F.E. low-hunger one-shot message.
Verify: tests — no starvation while casual; low-hunger message fires once; dev
— debug lines present; headless shot.

## Chunk 33 — Tests, docs, final verification

Full suite green; README (stats, inventory, loot, controls E/I/1–8, casual),
CHANGELOG (M3 entries C25–C33), AGENTS.md status + survival/inventory/loot
system notes; remove all TEMP verification hooks; final acceptance walk (below).

## M3 acceptance checklist

- [ ] Hunger decays; starvation drains health; eating restores it
- [ ] Sprint drains stamina; exhaustion blocks sprint; regen re-enables
- [ ] Inventory 16 slots, stackable, starting items present
- [ ] I toggles the overlay; world freezes while open; hotbar 1–8 uses items
- [ ] Eat/heal consumes + restores; empty hotbar is a no-op
- [ ] 6 containers render in interiors; E within 1.0 tile opens one
- [ ] Loot weighted by location (kitchen/store/yard differ), 3–5 items, once
- [ ] Full-inventory overflow is lost (no crash, no duplication)
- [ ] Loot deterministic under a fixed seed (unit-proven)
- [ ] Casual: no zombie threat + no starvation
- [ ] S.A.F.E. first-hunger / first-loot / first-heal messages; debug shows
  stats + containers
- [ ] tsc strict clean, all tests green, build clean, no console errors

## Out of scope (M3)

Combat / weapon use (tool items are carry-only), crafting, safehouse, item
durability, container re-loot / respawn, thirst as a separate stat, procedural
loot placement, zombie drops, save system.
