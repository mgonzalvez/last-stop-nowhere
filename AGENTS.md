# Last Stop, Nowhere — AGENTS.md

Isometric zombie survival sandbox. Phaser 3 + TypeScript + Vite, zero other deps.
Authoritative brief: `project_plan.md`. Step sequence: `PLAN.md`
(Milestone 1 = Chunks 1–14, Milestone 2 = Chunks 15–24 — both complete;
Milestone 3 = Chunks 25–33, planned, not started).

## Guardrails (follow every session)

1. **Token efficiency.** Read only files you need. Use targeted greps/reads, never
   dump whole files or `npm install` logs into context. Keep commands short.
2. **Don't overthink.** Implement the smallest change that satisfies the current
   chunk. No speculative abstractions, no refactoring working code, no adding
   dependencies for convenience.
3. **No rabbit holes.** If one problem still fails after 2 fix attempts, stop:
   note the limitation, choose a simpler approach, and move on. Never chase edge
   cases outside the acceptance criteria (§13 of the brief).
4. **Recognize drift.** If an action doesn't map to the next unfinished chunk in
   PLAN.md, you are off-path. Next up is Milestone 3 — "Scavenge" (C25–C33).
   Stay inside M3 scope: no combat/weapon use, crafting, safehouse, durability,
   re-loot, procedural loot, or save system until a later plan exists.
5. **Steer back.** Start each working step by naming the current chunk. Finish its
   verify step before starting the next. After any detour, re-read PLAN.md and
   return to the first unfinished chunk.

## Status

- **Milestone 1 — "Walk the Neighborhood" — COMPLETE** (Chunks 1–14).
  Scaffold; IsoProjection; world data (48×48 map, passability, roofs);
  ProceduralAssets (all textures); scene flow Boot→Title→Game (TitleScene:
  SPACE/ENTER/click to start); player movement (8-dir screen-relative,
  WASD/arrows); collision (per-axis, wall slide, doors pass); buildings &
  interiors (roofed connected components + door association; per-building
  roof fade on entry); depth ordering pinned; camera (RESIZE scale, follow
  lerp 0.12, bounds clamp, wheel zoom 0.5–2.0 via scene 'wheel' event);
  pause (ESC overlay, R restarts); S.A.F.E. tutorial foundation (data-only
  catalog, event-triggered one-shot delivery, T toggles); debug overlay
  (F3: FPS/tile/world/objs/renderer).
- **Milestone 2 — "Dead Stock" — COMPLETE** (Chunks 15–24).
  7 fixed zombies (55 px/s — always outrunnable); A* pathfinding (4-dir,
  512-node cap, null when unreachable); Bresenham LOS (walls block, doors
  pass); noise model (still 0 / moving 5 / sprinting 9 tiles); 5-state FSM
  IDLE/WANDER/INVESTIGATE/CHASE/ATTACK with 8 Hz decisions on seeded
  mulberry32 (pure + deterministic, `Rng.ts`); attack = 0.4 s windup +
  12 damage/s within 0.9 tiles; player health 100, no regen, death overlay
  + R restart; sprint (SHIFT, 1.5× = 225 px/s, noise 9); casual mode (C:
  player is invisible to zombies — no detect/investigate/attack, indicator
  top-right); S.A.F.E. first-chase one-shot message; debug overlay lists
  per-zombie state + position. 111/111 tests green, tsc + build clean.
- All temporary headless-verification URL hooks (`?autostart`, `?wanderlog`,
  `?chasetest`, `?deathlog`, `?sprinttest`) were removed in Chunk 24.
  If you need them again for verification, the patterns that worked (see
  Environment note): sync scene.start in create() for transitions,
  update-tick-based hooks (≤ ~150 ticks) for in-scene checks.
- Docs: README.md (run + controls), CHANGELOG.md (per-chunk history),
  PLAN.md (chunk plan, M1 + M2 with acceptance checklist).
- Pushed to github.com/mgonzalvez/last-stop-nowhere (main).
- **Milestone 3 — "Scavenge" — PLANNED, not started** (Chunks 25–33, see
  PLAN.md). Survival economy: hunger + stamina stats, 16-slot stackable
  inventory with 1–8 hotbar, 6 one-shot loot containers (weighted tables by
  location: kitchen/store/yard), consumable use, casual also freezes hunger.
  Next chunk: **C25 — Stats: hunger + stamina** (pure `StatsSystem.ts` + tests).

## Environment note (read before touching rendering)

- Headless Chromium on this box runs Phaser in the **Canvas** fallback (no WebGL).
- **`Graphics.fillPoints()` renders NOTHING in that canvas fallback** (verified).
  Use `fillTriangle` / `fillRect` / `fillCircle` / `fillRoundedRect` for all
  procedural drawing (both live Graphics and `generateTexture`). This is why
  diamonds are drawn as two triangles. Don't "simplify" back to fillPoints.
- Verify visuals with a headless screenshot + pixel stats, e.g.:
  `chromium --headless=new --no-sandbox --disable-gpu --window-size=1280,720
   --virtual-time-budget=8000 --screenshot=/tmp/shot.png http://localhost:<port>/`
  then count non-background pixels / colors with PIL. Don't claim "looks right"
  without this.
- **Game-time caveat:** the headless clock DIES after ~150–170 update ticks
  (~2–3s of game time) no matter the --virtual-time-budget. Consequences:
  - Scene transitions must be `scene.start()` called synchronously in
    create() (same proven path as Boot→Title); delayedCall transitions never
    process in time.
  - Verification hooks in scenes should fire on update-tick counts (≤ ~150),
    not on ms-based delayedCalls.
  - Viewport height < window height in headless (e.g. 633 for a 720 window),
    and varies between runs — don't assert exact screen centers from a
    fixed window size; measure relative to the player sprite.
  Verify movement/collision with deterministic unit tests (fixed dt steps);
  headless screenshots are rendering/flow smoke checks.

## Commands

```bash
npm install
npm run dev      # local dev server
npm run build    # production build
npm test         # vitest
```

## Conventions

- Authoritative game state (positions, map, stats) lives in plain TS modules under
  `src/world/` and `src/systems/` — never derived from Phaser objects.
- Iso projection: `src/world/IsoProjection.ts`, 64×32 diamonds, logical tile
  coords separate from screen coords.
- Small focused modules; only create files the current chunk needs.
- Verify before claiming: no "works" without a passing command or explicit
  "unverified (no browser access)" note.

## Architecture

Layering rule: **authoritative state never derives from Phaser objects.**

- `src/world/` — plain TS authoritative state: `MapData` (layout), `WorldMap`
  (passability, roofs; out-of-bounds reads as WALL_OUT), `IsoProjection`
  (64×32 diamonds, tileToScreen/screenToTile), `Player` (fractional tile
  coords, health), `Zombie` (fractional tile coords, FSM state, path queue,
  seed, 55 px/s), `Buildings` (roofed connected components + door tiles).
- `src/systems/` — pure, deterministic, unit-tested logic: `MovementSystem`
  (screen-relative 8-dir, normalized), `CollisionSystem` (per-axis vs
  passability, 0.25-tile footprint radius), `Pathfinding` (A*, 4-dir,
  512-node budget, null when unreachable), `LineOfSight` (Bresenham over
  passability; adjacent tiles always clear), `Noise` (player noise radius
  0/5/9 by input), `Rng` (mulberry32 seeded PRNG), `ZombieAI` (5-state FSM,
  8 Hz decision accumulator, path-follow at exact px/s; decisions only on
  decision ticks — never per-frame pathfinding), `TutorialSystem` (S.A.F.E.
  one-shot event delivery), `DebugStats` (overlay formatting).
- `src/data/` — content only (tutorial message catalog, 7 zombie spawn tiles).
- `src/rendering/` — `ProceduralAssets` (all textures, Graphics primitives
  only), `DepthSorting` (depth = (tileX+tileY)·10 + offset).
- `src/game/` — the only Phaser layer: `config` (RESIZE scale), scenes
  Boot→Title→Game. GameScene owns sprites, camera, pause overlay, debug
  overlay, S.A.F.E. banner; it calls the pure modules each frame.

Scene notes: GameScene.update() order = debug (F3) → casual toggle (C) →
death check (terminal: only R) → pause (ESC/T, early return) → input +
sprint → moveWithCollision → player sprite/depth sync → updateZombies
(AI tick, sprite/depth sync, damage → death) → health HUD → roof fade →
(S.A.F.E. banner is event-driven, not per-frame). Pause and death both
freeze the world via early return; camera and debug overlay keep working
while paused or dead.

## Verification patterns that worked (headless)

- Headless Chromium screenshots + PIL pixel analysis (see Environment note).
- Player signature: skin (217,160,102); roof red (176,69,58); grass
  (76,138,70); wood (125,90,51); wall top (201,177,137); page bg (21,23,30).
- Zombie signature: pale green head/arms (159,184,138), darkened by the
  per-seed Image tint — distinct from the player's blue jacket (63,107,138).
- Key facts: headless game clock dies after ~150–170 ticks; viewport height
  < window height and varies; scene transitions must be sync in create();
  tick-based hooks fire reliably.
