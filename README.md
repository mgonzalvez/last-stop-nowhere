# Last Stop, Nowhere

An isometric zombie-survival sandbox. **Milestone 4 — "Bug Control"** is
complete: the neighborhood is no longer quiet, it is no longer stocked, and
it is no longer in charge. Seven procedural zombies roam the streets on a
seeded clock; your stomach works on its own timer; six crates hold whatever
the neighborhood left behind; and now — reluctantly — you can swing back.
Every swing makes noise, wears the tool down, and draws more of them.
Combat is a last resort. S.A.F.E. insists it was always the first option.

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
  (zombies hear you from much further away) and it drains the **stamina** bar.
  Sprinting to empty exhausts you (red bar); you can't sprint again until it
  regens. You can always outrun one zombie, but not forever and not silently.
- **Buildings**: walk up to a door and through it. House 2 (the middle house
  on the north side of the street) has a fence with a gap aligned to its door.
  The roof fades away while you're inside and fades back when you exit.
  Zombies can follow you in through the door.
- **Health**: the red bar top-left. Zombie bites do 12 damage; at 0 you join
  the neighborhood and press **R** to try again.
- **Hunger**: the orange bar. It drains on its own; at 0 you starve (health
  drains until you eat). Eat food to restore it.
- **Scavenge**: stand within a crate and press **E** to search it. Crates hold
  3–5 items (weighted by location — kitchens are food, the store is mixed,
  the yard is nails and planks) and each crate can only be searched **once**;
  the empty ones go dark. If your inventory is full, the excess is lost.
- **Attack**: **left-click** a zombie to swing at it (one zombie per swing,
  short reach, 0.7 s between swings). You hit with the first weapon in your
  inventory — the kitchen knife you started with, or whatever you found. No
  weapon? Bare hands: weak, but they never break.
- **Durability**: every swing wears the tool down (−1). When it hits 0 the
  tool breaks, leaves your inventory, and S.A.F.E. offers its thoughts.
  The next weapon in your slots takes over automatically.
- **Inventory**: **I** opens the 16-slot overlay (the world freezes while it's
  open; **I** or **ESC** closes it). The first eight slots are the hotbar:
  **1–8** uses that slot. Food and medical items are consumed; tools and
  resources are carry-only for now.
- **Casual mode**: **C** toggles threat-free wandering. Zombies keep
  wandering as ambience but never hear, see, or attack you, and your hunger
  freezes. For when you just want to look at the neighborhood.
- **Groovy mode**: **G** toggles weapon damage ×2 — the bad-trip setting,
  named for the only word that ever really worked on a dead thing. Bare
  hands are exempt (they were never weapons). Nothing else changes.
- **Camera**: follows the player, clamped to the map; **mouse wheel** zooms
  (0.5×–2×).
- **Pause**: **ESC** pauses (overlay with Resume/Restart); **ESC** again
  resumes; **R** while paused restarts the run.
- **S.A.F.E.**: **T** toggles the (optional) Survival Advice For Everyone
  advisory messages. S.A.F.E. will let you know, cheerfully, when you are
  being followed.
- **Debug overlay**: **F3** shows FPS, player tile/world coordinates, entity
  count, renderer mode, hunger/stamina, the held weapon (+ durability),
  every zombie's FSM state + position + health, and every crate's location
  + looted status.

## How the zombies work

Zombies are a simple finite-state machine (5 states: IDLE, WANDER,
INVESTIGATE, CHASE, ATTACK) decided at a fixed 8 Hz — pathfinding never runs
per frame. They wander randomly, investigate the last place they heard you,
chase while they can see you (line of sight — walls block), and lose interest
after 5 seconds without a sighting. All decisions run on a seeded RNG, so a
fixed seed reproduces the exact same neighborhood every time.

## How scavenging works

Hunger drains 1 point every 4 seconds; at zero you starve (2 health/s). Food
restores hunger, medical items restore health, and everything else you find is
there for the days ahead (crafting and a safehouse are later milestones).
Loot rolls are weighted per location and run on the same seeded RNG as the
zombies, so a fixed seed reproduces the exact same crates — down to the last
bottle of water.

## How combat works

Zombies have 30–60 health (seeded per spawn — the same seed that reproduces
the neighborhood reproduces the shufflers, down to how many hits each one
takes). A hit staggers them for 0.4 s and knocks them back half a tile; at
zero health they fade out and stop being a problem. A single zombie is
killable. That is the entire design budget.

Swings come from the first weapon in your inventory, in this order of
damage: hammer 20, crowbar 17, baseball bat 14, kitchen knife 9, bare hands
5. Durability is 18, 20, 25, and 40 hits respectively — a hammer is a bad
deal that ends quickly, a knife is a good deal that ends slowly. Every
swing also makes noise (6 tiles), so the moment you start whacking, every
shambler on the block knows where you are. The neighborhood does not reward
murder. It merely bills it.

## What's in Milestones 1 + 2 + 3 + 4

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
- Player: health, hunger, stamina, sprint, death + restart, and a casual
  threat-free mode.
- Survival economy: 16-slot stackable inventory with a 1–8 hotbar, consumable
  use (food/medical), and 6 one-shot loot crates with weighted, seeded, per-
  location tables — all pure and unit-tested.
- Combat: mouse-aimed melee with weapon durability and breakage, seeded
  zombie health, hit stagger + knockback, and a noise model that makes
  fighting a trade-off instead of a reward — all pure and unit-tested.
- S.A.F.E. tutorial: data-only message catalog (`src/data/tutorialMessages.ts`)
  with event-triggered, one-shot delivery and a runtime disable flag.

## Layout

```
src/
├── main.ts                  # entry point
├── game/                    # Phaser: config + scenes (Boot -> Title -> Game)
├── world/                   # authoritative state: map, tiles, projection,
│                            #   player, zombies, inventory, loot containers
├── systems/                 # pure gameplay logic: movement, collision,
│                            #   stats, combat, item use, loot, tutorial
├── rendering/               # procedural textures, depth rules
└── data/                    # content data (tutorial messages, items, loot
                             #   tables, zombie + crate spawns)
tests/                       # vitest unit tests for the pure modules
```

The full development history lives in `PLAN.md` (chunk plan) and
`CHANGELOG.md`.
