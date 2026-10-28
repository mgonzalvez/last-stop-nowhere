# CODING AGENT PROJECT BRIEF
## Last Stop, Nowhere — Isometric Zombie Survival Sandbox

### ROLE AND WORKING STYLE

You are a senior TypeScript game developer, systems architect, and technical game designer.

You are developing an original, browser-based, single-player survival sandbox called **Last Stop, Nowhere**, using Phaser 3, TypeScript, and Vite.

You are operating within a local coding-agent harness with filesystem and terminal access.

Your responsibilities:

1. Architect a clean, lightweight, maintainable codebase.
2. Implement features incrementally, starting with a working game.
3. Use appropriate terminal tools to inspect, build, test, and verify changes.
4. Keep individual code modules small and focused.
5. Document architectural decisions and limitations.
6. Avoid unnecessary complexity, dependencies, and speculative features.
7. Never claim that something works unless you have verified it with available tools.
8. Never invent test results or claim visual verification without actually viewing the game.

Prefer working, playable code over elaborate plans.

Do not attempt to implement the entire design document in one pass.

---

# 1. GAME OVERVIEW

**Title:** Last Stop, Nowhere

**Genre:** Isometric zombie survival sandbox

**Platform:** Modern desktop browsers running on Linux, macOS, and Windows

**Mode:** Single-player, offline-capable after assets are available

**Visual style:** Chunky, colorful, 16-bit-inspired isometric pixel art

**Tone:** Darkly humorous, dry, deadpan, occasionally absurd

**Core inspiration:** The exploration, looting, survival tension, and safehouse gameplay of Project Zomboid.

This must be an original game. Do not reproduce Project Zomboid's assets, maps, source code, characters, specific UI artwork, or other protected creative material.

## Vision

Create a streamlined survival sandbox in which players explore a small, zombie-infested suburban town, scavenge supplies, manage basic survival needs, fight or evade zombies, and eventually establish a defensible safehouse.

The game should provide compelling emergent stories without the complexity and micromanagement of a deep survival simulator.

Guiding principle:

**Easy to understand, interesting to master, dangerous enough to matter, funny enough to remember.**

---

# 2. DESIGN PILLARS

### A. Scavenging is the central reward loop

Exploration should reveal useful supplies, improvised tools, environmental discoveries, and unexpected dangers.

Players should regularly choose between staying longer for additional resources and escaping while they still can.

### B. Zombies are environmental threats

Avoidance, positioning, stealth, and escape should usually be safer than direct combat.

A single zombie should be manageable. Several zombies should be dangerous.

### C. Streamlined survival

Track health, hunger, and stamina.

Avoid excessive status effects and complicated metabolism simulations.

Inventory management should require meaningful choices without becoming tedious.

### D. Building a safe place matters

Players should feel attached to their chosen safehouse.

Surviving another day should create an opportunity to improve their circumstances.

### E. Dry, dark humor

Humor should emerge through item descriptions, occasional system messages, ironic environmental details, and optional tutorial guidance.

Avoid constant jokes during combat.

The world is dangerous, but the game should not take itself too seriously.

---

# 3. TECHNICAL STACK

Use:

- Phaser 3, latest compatible stable version in the 3.x line
- TypeScript with strict type checking
- Vite for development and production builds
- npm
- HTML/CSS for menus and appropriate interface components
- Vitest for deterministic game logic tests

Avoid React, backend services, databases, networking, heavy 3D libraries, and unnecessary dependencies.

The game must run through a local Vite development server.

## Rendering

Use Phaser's built-in rendering.

Use Phaser.AUTO to permit WebGL rendering with Canvas fallback where supported.

Create an isometric appearance using 2D sprites and tile projection.

Do not implement a 3D engine.

Do not assume standard orthogonal Phaser tilemap rendering automatically provides isometric coordinates. Implement a small, explicit isometric projection layer.

Maintain logical tile coordinates separately from screen coordinates.

Use these projection formulas:

screenX = originX + (tileX - tileY) * tileWidth / 2

screenY = originY + (tileX + tileY) * tileHeight / 2

Implement inverse screen-to-tile conversion for mouse picking.

Use initial diamond dimensions of 64×32 pixels.

Use sprite depth ordering based on logical ground position, with explicit handling of tall scenery and characters.

---

# 4. HARDWARE REQUIREMENTS

The primary compatibility target is:

- Apple iMac 27-inch, Late 2012
- Intel Core i7-3770
- 32 GB DDR3 RAM
- NVIDIA GTX 680MX
- 2 GB VRAM
- Linux Mint
- Nouveau open-source GPU driver
- Mesa 25.2.8
- Hardware-accelerated OpenGL 4.3

This is a hard design constraint.

## Performance goals

- Target 30 FPS on the 2012 iMac at 1280×720.
- Target 60 FPS on modern hardware.
- Support 1280×720 and responsive window resizing.
- Allow integer scaling or nearest-neighbor texture filtering.
- Provide a low-detail mode.
- Avoid 3D graphics, expensive shader effects, dynamic shadows, and excessive transparency.
- Use lightweight sprite atlases and procedural placeholder textures.
- Avoid simulating distant entities every frame.
- Minimize per-frame memory allocations.
- Use a fixed-step simulation where practical.
- Cap delta time to prevent instability after tab suspension.
- Expose FPS, entity count, update time, and renderer mode through a debug overlay.

The performance goals are targets requiring measurement, not guarantees.

Do not claim that the game meets them until tested on the actual target iMac.

---

# 5. WORLD REPRESENTATION

Use a two-dimensional logical tile grid.

Every tile contains appropriate terrain and collision information.

Initial terrain types:

- Grass
- Pavement
- Road
- Sidewalk
- Wooden floor
- Interior wall
- Exterior wall
- Door
- Window
- Fence

Initial world size: 48×48 logical tiles.

The world should contain:

- One residential street
- Three small houses
- One corner convenience store
- A handful of trees
- A few abandoned vehicles as static obstacles
- Scattered environmental decorations

Use a fixed, handcrafted map for the first milestone.

Later, replace or extend this with seeded neighborhood assembly using predefined building templates.

Do not implement unrestricted procedural generation yet.

Implement camera scrolling, world bounds, and zoom.

Store passability and collision independently from artwork.

---

# 6. PLAYER CONTROLS

Movement:

- WASD or arrow keys
- Eight-direction movement
- Normalize diagonal movement speed
- Smooth real-time movement
- Collision with impassable tiles

Additional controls:

- Mouse: Select or interact with nearby objects
- E: Interact
- Shift: Sprint (future-ready; optional in first milestone)
- Escape: Pause
- F3: Toggle debug overlay
- Mouse wheel: Camera zoom

Movement must follow logical world coordinates while rendering through the isometric projection.

Do not implement movement purely in screen coordinates.

Provide a small visual indicator for the currently targeted interaction.

---

# 7. ZOMBIE AI — PHASE TWO

The eventual zombie system should support:

- Idle wandering
- Hearing nearby sounds
- Investigating noises
- Detecting the player within range and line of sight
- Pursuing the player
- Attacking at melee distance
- Losing interest when the player escapes
- Returning to wandering

Use a simple finite-state machine.

AI states:

IDLE
WANDER
INVESTIGATE
CHASE
ATTACK

Use efficient grid-based pathfinding where necessary.

Avoid recalculating paths every render frame.

Update zombie decision-making at approximately 5–10 Hz while keeping visible movement smooth.

No complex group tactics or advanced swarm simulations initially.

---

# 8. SURVIVAL AND LOOT SYSTEMS — LATER PHASES

Player stats:

- Health
- Hunger
- Stamina

Inventory:

- 16 slots initially
- Stackable items
- Simple item categories
- Item durability for weapons
- Quick-access hotbar

Starting items:

- Kitchen knife
- Canned soup
- Bandage
- Flashlight
- Water bottle

Example loot:

- Baseball bat
- Hammer
- Nails
- Wooden planks
- Canned food
- Painkillers
- Batteries
- Crowbar
- Duct tape

Loot should have weighted probabilities by location.

A kitchen should generate different supplies from a garage or pharmacy.

Use data-driven JSON or TypeScript definitions.

Avoid deeply nested inheritance hierarchies for inventory items.

---

# 9. SAFEHOUSE SYSTEM — LATER PHASE

Players can claim an existing building.

Basic improvements:

- Barricade door
- Barricade window
- Place storage container
- Establish sleeping area
- Build simple workbench

Do not allow arbitrary architectural construction in the initial version.

Focus on improving existing structures.

---

# 10. HUMOR AND TUTORIAL SYSTEM

Create an optional fictional municipal advisory system called:

**S.A.F.E. — Survival Advice For Everyone**

Its personality is cheerfully bureaucratic, overconfident, and spectacularly unhelpful.

Example tutorial messages:

"Welcome to Nowhere. Please remain calm. Our records indicate panic has a disappointing success rate."

"You have located a kitchen. These traditionally contain food, knives, and unresolved domestic disagreements."

"Remember: a closed door is a valuable survival tool. Unless something is already behind it."

"Congratulations on surviving the night. Your achievement has been forwarded to the appropriate department. Unfortunately, the department no longer exists."

Implement tutorial messages as data, separate from gameplay code.

Use event-triggered delivery.

Allow tutorials to be disabled.

Avoid excessive on-screen interruptions.

---

# 11. ARCHITECTURE

Separate the project into:

- Rendering and scene management
- World data
- Isometric coordinate conversion
- Player movement
- Collision
- Entity state
- AI
- Interaction systems
- Inventory and item data
- UI
- Save/load
- Debug instrumentation

Suggested directory structure:

```text
last-stop-nowhere/
  public/
    assets/
  src/
    main.ts
    game/
      config.ts
      scenes/
        BootScene.ts
        GameScene.ts
        UIScene.ts
      world/
        IsoProjection.ts
        WorldMap.ts
        MapData.ts
        TileTypes.ts
      entities/
        Player.ts
        Zombie.ts
      systems/
        MovementSystem.ts
        CollisionSystem.ts
        InteractionSystem.ts
      rendering/
        ProceduralAssets.ts
        DepthSorting.ts
      ui/
        DebugOverlay.ts
      data/
        tutorialMessages.ts
    styles/
      main.css
  tests/
  README.md
  DESIGN.md
  CHANGELOG.md
  AGENTS.md
```

This is a proposed organization, not a requirement to create every file immediately.

Only create modules needed for the current milestone.

Keep authoritative game state independent of Phaser rendering objects wherever practical.

---

# 12. FIRST MILESTONE: WALK THE NEIGHBORHOOD

**This is the only milestone you should implement right now.**

The goal is to produce a working, visually readable isometric neighborhood that the player can explore.

## Required features

1. Initialize a working Vite + Phaser 3 + TypeScript project.

2. Display a 48×48 isometric tile map.

3. Generate simple, original placeholder artwork programmatically using canvas drawing APIs or Phaser graphics.

4. Render roads, grass, sidewalks, buildings, fences, and trees.

5. Create at least three recognizable buildings, including one house with an accessible interior.

6. Implement eight-direction movement.

7. Implement world-grid-based collision.

8. Implement correct isometric drawing order for the player and nearby obstacles.

9. Implement camera following, zoom, and map boundaries.

10. Support 1280×720 and browser window resizing.

11. Add a basic title screen with Start Game.

12. Add a debug overlay showing:
    - FPS
    - Player tile coordinates
    - Player world position
    - Current entity count
    - Active renderer

13. Create a foundation for the S.A.F.E. tutorial system and display a single welcome message.

14. Add a pause menu with Resume and Restart.

15. Add unit tests for projection coordinates, inverse projection, map bounds, and collision rules.

16. Document controls and launch instructions in README.md.

## Visual requirements

Even with placeholder artwork, the game must look recognizable as a small isometric suburban environment.

Do not use nothing but colored rectangles and call it complete.

Use simple diamond tiles, roof shapes, wall sprites, doors, sidewalks, tree silhouettes, and player sprites.

Simple procedural pixel artwork is acceptable.

Favor consistent scale and readable silhouettes over elaborate decoration.

Buildings must clearly distinguish interior and exterior tiles.

Use an initial roof-hide approach for the accessible house: hide or fade its roof when the player enters its footprint.

---

# 13. ACCEPTANCE CRITERIA

Milestone 1 is complete only when:

- `npm install` succeeds.
- `npm run dev` starts a playable browser game.
- `npm run build` succeeds.
- TypeScript checks pass.
- Relevant unit tests pass.
- The player can move smoothly in eight directions.
- The player cannot walk through walls or blocked map tiles.
- The player can enter and exit one building through a doorway.
- Isometric layering is visually correct for the supported map objects.
- The camera follows the player.
- The game can be paused.
- The title screen works.
- The debug overlay works.
- The initial S.A.F.E. message appears.
- There are no known fatal JavaScript errors.
- README.md explains how to run and play.

If browser automation or screenshots are unavailable, explicitly identify visual behavior as unverified and provide manual test steps.

Do not fabricate visual verification or FPS measurements.

---

# 14. CODING AGENT PROCEDURE

Follow this process:

### Step A — Inspect

Check the current working directory and existing files.

If the directory is empty, scaffold the project.

If a project exists, inspect it before changing anything.

### Step B — Plan

Write a short implementation plan.

Identify the files and modules needed.

Do not produce an excessively detailed speculative architecture.

### Step C — Implement

Work in small, coherent increments.

Suggested sequence:

1. Project bootstrap
2. Phaser game initialization
3. Isometric projection
4. Procedural tile artwork
5. Map data and rendering
6. Player movement
7. Collision
8. Buildings and interiors
9. Depth ordering
10. Camera controls
11. UI and tutorial message
12. Debugging and tests

### Step D — Verify

After each meaningful implementation increment, run appropriate checks.

Fix errors before proceeding.

Use actual terminal and browser tools when available.

### Step E — Document

Keep README.md updated.

Record completed tasks and remaining limitations.

Maintain a short AGENTS.md file documenting architecture, conventions, commands, and constraints for future coding sessions.

### Step F — Stop

Once Milestone 1 acceptance criteria are met, stop implementing features.

Do not begin zombies, combat, crafting, inventory, or advanced procedural generation.

Report:

- What was implemented
- Which tests passed
- Which behaviors remain unverified
- Known limitations
- How to launch the game
- Recommended next milestone

---

# 15. SCOPE CONTROL RULES

These rules are mandatory:

1. Do not build systems before they are needed.
2. Do not add dependencies merely for convenience.
3. Do not redesign working architecture without a concrete reason.
4. Do not introduce multiplayer or server components.
5. Do not add vehicles, farming, or detailed survival simulation.
6. Do not generate enormous files containing unrelated systems.
7. Do not implement speculative abstractions.
8. Prefer simple and debuggable solutions.
9. Maintain backward compatibility with the target Linux machine.
10. Prioritize actual gameplay over documentation volume.

If an approach creates excessive complexity, choose a simpler solution and explain the tradeoff.

---

# 16. WHAT MAKES THE GAME FUN

Keep the following design principle in mind throughout development:

The game is not primarily about defeating zombies.

It is about making decisions under uncertainty.

Should I enter that house?

Is there anything useful in the garage?

Can I outrun the zombie near the store?

Should I use my last bandage now?

Is this building worth defending?

Every system should eventually support these decisions.

---

# YOUR IMMEDIATE TASK

Begin implementation of Milestone 1: Walk the Neighborhood.

First inspect the workspace, then establish the project structure and implement a minimal playable isometric world.

Execute available build and test commands.

Continue incrementally until the milestone is functional or an actual blocker prevents further progress.

Do not stop after writing only a plan, scaffolding, or a partial mockup.

Do not implement Milestone 2 yet.

At completion, provide a concise summary with commands for running the game and testing it in a browser.

