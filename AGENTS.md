# Last Stop, Nowhere — AGENTS.md

Isometric zombie survival sandbox. Phaser 3 + TypeScript + Vite, zero other deps.
Authoritative brief: `project_plan.md`. Step sequence: `PLAN.md`
(Milestone 1 = Chunks 1–14, Milestone 2 = Chunks 15–24, Milestone 3 =
Chunks 25–33, Milestone 4 = Chunks 34–39 — all complete).

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
   PLAN.md, you are off-path. Milestones 1–4 are complete; the brief's later
   phases (safehouse per §9, crafting) are out of scope until a new M5 plan
   exists.
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
- TEMP verification hooks: all removed in Chunk 39 (M4 used TitleScene
  `?autostart`, GameScene `?combat` + `?brittle`, and a `C36HOOK` console
  line in doAttack). If you need them again, the patterns that worked (see
  Environment note): sync scene.start in create() for transitions,
  update-tick-based hooks (≤ ~150 ticks) for in-scene checks, console.log
  + `--enable-logging=stderr` for transient-FX evidence, and document each
  hook here as it lands.
- Docs: README.md (run + controls), CHANGELOG.md (per-chunk history),
  PLAN.md (chunk plan, M1 + M2 + M3 + M4 with acceptance checklists).
- Pushed to github.com/mgonzalvez/last-stop-nowhere (main).
- **Milestone 3 — "Scavenge" — COMPLETE** (Chunks 25–33).
  Hunger 100 (0.25/s decay; starvation 2 hp/s at 0) + stamina 100 (sprint
  drains 30/s, regen 20/s, exhaustion latch with hysteresis — clears at 20);
  16-slot stackable inventory (food 10 / medical 5 / tool 1 / resource 10)
  with 1–8 hotbar + I overlay (world freezes); 6 one-shot loot crates
  (3 kitchen / 2 store / 1 yard) with weighted seeded tables
  (`mulberry32(LOOT_SEED + id)`, overflow lost, spent crates dim);
  consumable use (soup +40 / food +30 / water +15 hunger; bandage +25 /
  painkiller +50 health); casual (C) also freezes hunger; S.A.F.E. one-shots
  (first.eat / first.heal / first.loot / hunger.low at 25); debug overlay
  adds hunger/stamina + per-crate lines. 174/174 tests green, tsc + build
  clean.
- **Milestone 4 — "Bug Control" — COMPLETE** (Chunks 34–39).
  Combat as a desperate last resort (pillar B): left-click swings at the
  clicked tile (1 zombie per swing, 1.0-tile aim, 1.5-tile reach,
  closest-to-click, 0.7 s cooldown, whiff costs nothing); held weapon =
  first weapon in slot order (knife 9/40, bat 14/25, hammer 20/18, crowbar
  17/20 damage/durability; bare hands 5, unbreakable); −1 durability per
  swing, break removes the tool + `weapon.broke` S.A.F.E. one-shot +
  automatic fallback; zombie health 30–60 seeded per spawn id
  (`mulberry32(ZOMBIE_SEED + 1000 + id)`), hit → 0.4 s stagger (frozen) +
  0.5-tile knockback (wall-blocked) + fade-out death + kill counter;
  every swing makes noise (NOISE_SWING 6, 0.25 s pulse) so fighting draws
  zombies; casual = threat-free both ways; groovy mode (G, `?groovy`) =
  weapon damage ×2 only (bare hands + durability unaffected); S.A.F.E.
  one-shots (first.kill, weapon.broke); debug adds held weapon + durability
  + per-zombie health; death overlay shows kills. 210/210 tests green,
  tsc + build clean.
- **Milestone 5 is not defined.** Next candidate phases per brief §8–9:
  safehouse (claim a building: barricade door/window, storage, sleeping
  area, workbench) and crafting. None planned yet.

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
  coords, health/hunger/stamina + exhaustion latch), `Zombie` (fractional
  tile coords, FSM state, path queue, seed, 55 px/s, seeded health 30–60,
  staggerS), `Inventory` (16 mutable slots, stack logic; weapon slots carry
  durability), `LootContainer` (fixed crate state, looted flag),
  `Buildings` (roofed connected components + door tiles).
- `src/systems/` — pure, deterministic, unit-tested logic: `MovementSystem`
  (screen-relative 8-dir, normalized), `CollisionSystem` (per-axis vs
  passability, 0.25-tile footprint radius), `Pathfinding` (A*, 4-dir,
  512-node budget, null when unreachable), `LineOfSight` (Bresenham over
  passability; adjacent tiles always clear), `Noise` (player noise radius
  0/5/9 by input; NOISE_SWING 6 for swings), `Rng` (mulberry32 seeded PRNG),
  `ZombieAI` (5-state FSM, 8 Hz decision accumulator, path-follow at exact
  px/s; decisions only on decision ticks — never per-frame pathfinding;
  staggered zombies are frozen: no decisions/movement/attacks),
  `StatsSystem` (hunger decay/starvation, stamina drain/regen + latch,
  `applyItem`; `hungerFrozen` = casual), `CombatSystem` (heldWeapon = first
  weapon in slot order, `swingDamage(inv, groovy)` — groovy ×2 weapons only,
  `pickAttackTarget` click 1.0 + reach 1.5, `applyHit` stagger/knockback,
  `applySwingCost` durability −1 + break, `zombieHealth(id)` seeded 30–60),
  `ItemUse` (hotbar consume: consumables only, carry-only items untouched),
  `LootSystem` (weighted seeded rolls, `openContainerLoot` — one-shot per
  crate, overflow lost), `TutorialSystem` (S.A.F.E. one-shot event
  delivery), `DebugStats` (overlay formatting).
- `src/data/` — content only: tutorial message catalog (welcome, chased,
  eat/heal/loot, hunger.low, weapon.broke, first.kill), `items.ts` (14-item
  flat catalog; weapons carry damage + maxDurability; `isWeapon` type
  predicate), `lootTables.ts` (weighted kitchen/store/yard),
  `zombieSpawns.ts` (7 spawns + ZOMBIE_SEED), `lootContainerSpawns.ts`
  (6 crates + LOOT_SEED).
- `src/rendering/` — `ProceduralAssets` (all textures, Graphics primitives
  only), `DepthSorting` (depth = (tileX+tileY)·10 + offset).
- `src/game/` — the only Phaser layer: `config` (RESIZE scale), scenes
  Boot→Title→Game. GameScene owns sprites, camera, pause overlay, debug
  overlay, S.A.F.E. banner; it calls the pure modules each frame.

Scene notes: GameScene.update() order = debug (F3) → casual toggle (C) +
groovy toggle (G) → death check (terminal: only R) → inventory overlay
(I/ESC, early return — world frozen) → I open → pause (ESC/T, early return)
→ attack cooldown + swing FX countdown → hotbar 1–8 → container prompt +
E open → input + sprint (gated by exhaustion latch) → moveWithCollision →
player sprite/depth sync → updateZombies (swing noise pulse, AI tick,
zombie-bite damage → death, hit-flash countdown) → tickSurvival (starvation
can kill) → HUDs (health + survival bars) → hunger.low advisory → roof
fade. Left-click (pointerdown) is event-driven, not per-frame: onAttackClick
(state gates: dead/paused/inv-open/casual/cooldown) → doAttack (pick target,
applyHit, swing cost + break, FX, death → fade FX + kill counter +
first.kill S.A.F.E.). (S.A.F.E. banner is event-driven, not per-frame.)
Pause, death, and the inventory overlay all freeze the world via early
return; camera and debug overlay keep working.

## Verification patterns that worked (headless)

- Headless Chromium screenshots + PIL pixel analysis (see Environment note).
- Player signature: skin (217,160,102); roof red (176,69,58); grass
  (76,138,70); wood (125,90,51); wall top (201,177,137); page bg (21,23,30).
- Zombie signature: pale green head/arms (159,184,138), darkened by the
  per-seed Image tint — distinct from the player's blue jacket (63,107,138).
- Crate signature: top diamond (138,106,63), left face (107,74,42), right
  face (90,61,34); spent crates dim via setTint(0x555555).
- M4: swing FX line + [E] prompt + HUD labels are #d8c9a0 (216,201,160);
  groovy indicator text #c9a0d8; hit flash = zombie sprite tinted 0xffffff
  for 0.12 s. Screenshot timing for the FX window: hook swing fires ~0.42 s
  in, FX live ~0.1-0.12 s — for deterministic evidence use the console.log
  TEMP hook + `--enable-logging=stderr` instead of chasing the pixel window.
- HUD bars: health red (192,57,43), hunger orange (208,138,62), stamina
  green (92,154,80); both survival bars turn red (192,57,43) when
  STARVED/EXHAUSTED.
- Key facts: headless game clock dies after ~150–170 ticks; viewport height
  < window height and varies; scene transitions must be sync in create();
  tick-based hooks fire reliably.
