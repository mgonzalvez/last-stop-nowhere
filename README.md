# Last Stop, Nowhere

An isometric zombie-survival sandbox. **Milestone 2 — "Dead Stock"** is
complete: the neighborhood is no longer quiet. Seven procedural zombies wander
the streets, investigate noises, chase you when they spot you, and bite when
they catch up. Outrun them, hide from them, or make peace with the fact that
you are now a resident.

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
- **Sprint**: hold **SHIFT** — 1.5× speed, but you make far more noise
  (zombies hear you from much further away). No stamina: you can always
  outrun one zombie, but not silently.
- **Buildings**: walk up to a door and through it. House 2 (the middle house
  on the north side of the street) has a fence with a gap aligned to its door.
  The roof fades away while you're inside and fades back when you exit.
  Zombies can follow you in through the door.
- **Health**: the bar top-left. Zombie bites do 12 damage; at 0 you join the
  neighborhood and press **R** to try again.
- **Casual mode**: **C** toggles threat-free wandering. Zombies keep
  wandering as ambience but never hear, see, or attack you. For when you
  just want to look at the neighborhood.
- **Camera**: follows the player, clamped to the map; **mouse wheel** zooms
  (0.5×–2×).
- **Pause**: **ESC** pauses (overlay with Resume/Restart); **ESC** again
  resumes; **R** while paused restarts the run.
- **S.A.F.E.**: **T** toggles the (optional) Survival Advice For Everyone
  advisory messages. S.A.F.E. will let you know, cheerfully, when you are
  being followed.
- **Debug overlay**: **F3** shows FPS, player tile/world coordinates, entity
  count, renderer mode, and every zombie's FSM state + position.

## How the zombies work

Zombies are a simple finite-state machine (5 states: IDLE, WANDER,
INVESTIGATE, CHASE, ATTACK) decided at a fixed 8 Hz — pathfinding never runs
per frame. They wander randomly, investigate the last place they heard you,
chase while they can see you (line of sight — walls block), and lose interest
after 5 seconds without a sighting. All decisions run on a seeded RNG, so a
fixed seed reproduces the exact same neighborhood every time.

## What's in Milestones 1 + 2

- 48×48 isometric map: streets, sidewalks, three houses, a corner store,
  fences, trees, parked cars — all procedurally drawn.
- Authoritative world state in plain TypeScript (`src/world/`), fully
  decoupled from Phaser objects (`src/rendering/` + `src/game/scenes/`).
- Collision: per-axis movement against tile passability with wall sliding;
  1-tile doors pass, walls/windows/fences/trees/cars block.
- Buildings as roofed connected components; roof hide/fade per building on
  entry.
- Zombie AI: A* pathfinding, Bresenham line of sight, noise model, and the
  5-state FSM above — all pure, seeded, and unit-tested.
- Player: health, sprint, death + restart, and a casual threat-free mode.
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
