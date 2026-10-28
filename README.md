# Last Stop, Nowhere

An isometric zombie-survival sandbox. **Milestone 1 — "Walk the Neighborhood"** is
complete: a handcrafted 48×48 isometric neighborhood with a walkable character,
collisions, enterable buildings, a following camera, title/pause screens, a debug
overlay, and the S.A.F.E. tutorial foundation. No zombies yet — the neighborhood
is quiet. For now.

Built with Phaser 3 + TypeScript + Vite. No other dependencies. All artwork is
procedural (drawn at boot with Phaser Graphics — no image files).

## Run it

```bash
npm install
npm run dev      # local dev server (follow the printed URL)
```

```bash
npm test         # vitest unit tests
npm run build    # production build to dist/
```

## How to play

- **Start**: press **SPACE** (or **ENTER**, or click) on the title screen.
- **Move**: **WASD** or **arrow keys** — 8 directions, screen-relative
  (W = up-screen, D = right-screen, diagonals included).
- **Buildings**: walk up to a door and through it. House 2 (the middle house on
  the north side of the street) has a fence with a gap aligned to its door.
  The roof fades away while you're inside and fades back when you exit.
- **Camera**: follows the player, clamped to the map; **mouse wheel** zooms
  (0.5×–2×).
- **Pause**: **ESC** pauses (overlay with Resume/Restart); **ESC** again
  resumes; **R** while paused restarts the run.
- **S.A.F.E.**: **T** toggles the (optional) Survival Advice For Everyone
  advisory messages.
- **Debug overlay**: **F3** shows FPS, player tile/world coordinates, entity
  count, and renderer mode.

## What's in Milestone 1

- 48×48 isometric map: streets, sidewalks, three houses, a corner store,
  fences, trees, parked cars — all procedurally drawn.
- Authoritative world state in plain TypeScript (`src/world/`), fully
  decoupled from Phaser objects (`src/rendering/` + `src/game/scenes/`).
- Collision: per-axis movement against tile passability with wall sliding;
  1-tile doors pass, walls/windows/fences/trees/cars block.
- Buildings as roofed connected components; roof hide/fade per building on
  entry.
- S.A.F.E. tutorial: data-only message catalog (`src/data/tutorialMessages.ts`)
  with event-triggered, one-shot delivery and a runtime disable flag.

## Layout

```
src/
├── main.ts                  # entry point
├── game/                    # Phaser: config + scenes (Boot -> Title -> Game)
├── world/                   # authoritative state: map, tiles, projection,
│                            #   player, buildings (Phaser-free)
├── systems/                 # pure gameplay logic: movement, collision,
│                            #   tutorial, debug stats (Phaser-free)
├── rendering/               # procedural textures, depth rules
└── data/                    # content data (tutorial messages)
tests/                       # vitest unit tests for the pure modules
```

The full development history lives in `PLAN.md` (chunk plan) and
`CHANGELOG.md`.
