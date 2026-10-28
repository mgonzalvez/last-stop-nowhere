import Phaser from 'phaser'
import { worldMap, MAP_SIZE } from '../../world/WorldMap'
import { TileType } from '../../world/TileTypes'
import { setOrigin, tileToScreen, screenToTile, TILE_W, TILE_H } from '../../world/IsoProjection'
import { createPlayer, SPRINT_MULT, type PlayerState } from '../../world/Player'
import { createZombie, type ZombieState } from '../../world/Zombie'
import {
  createLootContainers,
  CONTAINER_INTERACT_RANGE,
  type LootContainerState,
} from '../../world/LootContainer'
import { ZOMBIE_SPAWNS, ZOMBIE_SEED } from '../../data/zombieSpawns'
import { type InputState } from '../../systems/MovementSystem'
import { moveWithCollision } from '../../systems/CollisionSystem'
import { updateZombie, type ZombieContext } from '../../systems/ZombieAI'
import { noiseRadius, NOISE_STILL, NOISE_SWING } from '../../systems/Noise'
import {
  pickAttackTarget,
  applyHit,
  swingDamage,
  applySwingCost,
  heldWeapon,
  ATTACK_COOLDOWN_S,
} from '../../systems/CombatSystem'
import { tickSurvival, HUNGER_LOW_AT } from '../../systems/StatsSystem'
import { useHotbarSlot } from '../../systems/ItemUse'
import { openContainerLoot } from '../../systems/LootSystem'
import { createInventory, type Inventory } from '../../world/Inventory'
import { STARTING_ITEMS, getItem } from '../../data/items'
import {
  createTutorialState,
  deliver,
  setEnabled,
  type TutorialState,
} from '../../systems/TutorialSystem'
import type { TutorialMessage } from '../../data/tutorialMessages'
import { formatDebugStats } from '../../systems/DebugStats'
import { computeBuildingIndex, buildingAt, tileKey, type BuildingIndex } from '../../world/Buildings'
import { TEX } from '../../rendering/ProceduralAssets'
import { depthFor } from '../../rendering/DepthSorting'

// Ground colors by tile type (rim + fill), matching ProceduralAssets palette.
const GROUND_COLORS: Partial<Record<TileType, [number, number]>> = {
  [TileType.ROAD]: [0x3d3d44, 0x4c4c55],
  [TileType.SIDEWALK]: [0x7a7a74, 0x9a9a92],
  [TileType.WOOD_FLOOR]: [0x5e4026, 0x7d5a33],
}
const GRASS: [number, number] = [0x3a6d36, 0x4c8a46]

/** Passability predicate for pure systems (A*, zombie AI). */
const passableTile = (x: number, y: number) => worldMap.isPassable(x, y)

// Roof fade speed (alpha units per second) -> ~0.25s full fade.
const ROOF_FADE_PER_SEC = 4

export class GameScene extends Phaser.Scene {
  private player!: PlayerState
  private playerSprite!: Phaser.GameObjects.Image
  /** Milestone 2: zombie entities + sprites (M4: per-seed tint + hit-flash countdown). */
  private zombies: {
    z: ZombieState
    sprite: Phaser.GameObjects.Image
    tint: number
    flashS?: number
  }[] = []
  /** Milestone 3: loot containers (C30) + [E] prompt. */
  private containers: { c: LootContainerState; sprite: Phaser.GameObjects.Image }[] = []
  private containerPrompt!: Phaser.GameObjects.Text
  /** Casual mode: zombies never detect or attack (C toggles). */
  private casual = false
  private casualText!: Phaser.GameObjects.Text
  /** Milestone 4: groovy mode (G): weapon damage x2 (?groovy pre-sets). */
  private groovy = false
  private groovyText!: Phaser.GameObjects.Text
  /** Milestone 4: attack cooldown, swing FX, kill count, swing noise pulse. */
  private attackCooldownS = 0
  private swingFx!: Phaser.GameObjects.Graphics
  private swingFxS = 0
  private kills = 0
  private swingNoiseS = 0
  /** TEMP ?combat hook state (remove in C39). */
  private _combatHook: number | null = null
  private _hookTick = 0
  /** Milestone 2: player health HUD + death state. */
  private dead = false
  private healthBar!: Phaser.GameObjects.Container
  private healthFill!: Phaser.GameObjects.Rectangle
  private healthText!: Phaser.GameObjects.Text
  /** Milestone 3: survival HUD (hunger + stamina bars under health). */
  private hungerBar!: Phaser.GameObjects.Container
  private hungerFill!: Phaser.GameObjects.Rectangle
  private hungerText!: Phaser.GameObjects.Text
  private staminaBar!: Phaser.GameObjects.Container
  private staminaFill!: Phaser.GameObjects.Rectangle
  private staminaText!: Phaser.GameObjects.Text
  /** Milestone 3: inventory (16 slots) + overlay UI. */
  private inventory!: Inventory
  private inventoryOpen = false
  private inventoryOverlay!: Phaser.GameObjects.Container
  private inventorySlotTexts: Phaser.GameObjects.Text[] = []
  /** Milestone 3: hotbar keys 1-8. */
  private hotbarKeys: Phaser.Input.Keyboard.Key[] = []
  private deathOverlay!: Phaser.GameObjects.Container
  private roofIndex!: BuildingIndex
  private roofByBuilding = new Map<number, Phaser.GameObjects.Image[]>()
  /** Current roof alpha per building (0 hidden, 1 shown). */
  private roofAlpha = new Map<number, number>()
  private paused = false
  private tutorial!: TutorialState
  private debugText!: Phaser.GameObjects.Text
  private debugVisible = false
  private _dbgTick = 0
  private pauseOverlay!: Phaser.GameObjects.Container
  private keys!: {
    W: Phaser.Input.Keyboard.Key
    A: Phaser.Input.Keyboard.Key
    S: Phaser.Input.Keyboard.Key
    D: Phaser.Input.Keyboard.Key
    R: Phaser.Input.Keyboard.Key
    T: Phaser.Input.Keyboard.Key
    C: Phaser.Input.Keyboard.Key
    G: Phaser.Input.Keyboard.Key
    E: Phaser.Input.Keyboard.Key
    F3: Phaser.Input.Keyboard.Key
    ESC: Phaser.Input.Keyboard.Key
    UP: Phaser.Input.Keyboard.Key
    DOWN: Phaser.Input.Keyboard.Key
    LEFT: Phaser.Input.Keyboard.Key
    RIGHT: Phaser.Input.Keyboard.Key
    SHIFT: Phaser.Input.Keyboard.Key
    I: Phaser.Input.Keyboard.Key
  }

  constructor() {
    super('GameScene')
  }

  create(): void {
    setOrigin(0, 0) // tile (0,0) top corner at world (0,0)

    this.roofIndex = computeBuildingIndex(worldMap)
    this.drawGround()
    this.drawObjects()
    this.drawRoofs()

    this.spawnPlayer()
    this.createZombies()
    this.createContainers()
    this.setupCamera()
    this.buildPauseOverlay()
    this.keys = this.input.keyboard!.addKeys(
      'W,A,S,D,R,T,C,G,E,F3,ESC,UP,DOWN,LEFT,RIGHT,SHIFT,I',
    ) as unknown as GameScene['keys']
    this.hotbarKeys = [
      Phaser.Input.Keyboard.KeyCodes.ONE,
      Phaser.Input.Keyboard.KeyCodes.TWO,
      Phaser.Input.Keyboard.KeyCodes.THREE,
      Phaser.Input.Keyboard.KeyCodes.FOUR,
      Phaser.Input.Keyboard.KeyCodes.FIVE,
      Phaser.Input.Keyboard.KeyCodes.SIX,
      Phaser.Input.Keyboard.KeyCodes.SEVEN,
      Phaser.Input.Keyboard.KeyCodes.EIGHT,
    ].map((code) => this.input.keyboard!.addKey(code))

    // Debug overlay (F3): FPS, tile coords, world pos, entity count, renderer.
    this.debugText = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#9ad0a0',
        backgroundColor: '#15171e',
        padding: { x: 8, y: 6 },
        lineSpacing: 2,
      })
      .setDepth(4000)
      .setVisible(false)

    this.tutorial = createTutorialState()
    // 'welcome' event fires once, on game start.
    this.showTutorial(deliver(this.tutorial, 'welcome'))

    this.buildCasualIndicator()
    // Milestone 4: groovy mode (?groovy pre-sets the G toggle).
    this.groovy = new URLSearchParams(window.location.search).has('groovy')
    this.buildGroovyIndicator()
    // Milestone 4: swing FX layer (tick-cleared; line primitives only —
    // canvas-fallback safe).
    this.swingFx = this.add.graphics().setDepth(3000)
    // Left-click aims a swing at the clicked tile (M4).
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.leftButtonDown()) this.onAttackClick()
    })
    this.buildHealthBar()
    this.buildSurvivalBars()
    this.inventory = createInventory(STARTING_ITEMS)
    this.buildInventoryOverlay()

    // TEMP verification hook (remove in C39): ?combat — stand the player 1.0
    // tile from the nearest zombie so a headless run can screenshot the
    // combat pipeline (the swings themselves fire at ticks 25/67 in update()).
    if (new URLSearchParams(window.location.search).has('combat')) {
      const near = this.nearestZombieTo(this.player.x, this.player.y)
      if (near) {
        this.tempPlaceBeside(near.z)
        this._combatHook = near.z.id
      }
    }
    // TEMP verification hook (remove in C39): ?brittle — set the held
    // weapon's durability to 1 so the ?combat swings break it and prove
    // the weapon.broke message + bare-hand fallback.
    if (new URLSearchParams(window.location.search).has('brittle')) {
      const w = heldWeapon(this.inventory)
      const slot = w !== null ? this.inventory[w.slot] : null
      if (slot) slot.durability = 1
    }
  }

  /** Milestone 2: spawn the fixed zombie set (wander from C18+). */
  private createZombies(): void {
    const tints = [0xe8f0e0, 0xf0ece0, 0xe0e8f0] // subtle per-zombie variance
    ZOMBIE_SPAWNS.forEach(([x, y], i) => {
      const z = createZombie(i, x, y, ZOMBIE_SEED + i)
      const s = tileToScreen(z.x, z.y)
      const tint = tints[z.seed % tints.length]
      const sprite = this.add
        .image(s.x, s.y + TILE_H / 2, TEX.zombie)
        .setOrigin(0.5, 1)
        .setDepth(depthFor(z.x, z.y))
        .setTint(tint)
      this.zombies.push({ z, sprite, tint })
    })
  }

  /** "CASUAL" indicator, pinned to the view top-right while casual mode is on. */
  private buildCasualIndicator(): void {
    this.casualText = this.add
      .text(0, 0, 'CASUAL', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#d8c9a0',
        backgroundColor: '#15171e',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(1, 0)
      .setDepth(4000)
      .setVisible(false)
  }

  /** C toggles casual mode: zombies never detect or attack the player. */
  private toggleCasual(): void {
    this.casual = !this.casual
    this.casualText.setVisible(this.casual)
  }

  /** M4: "GROOVY" indicator, pinned under the casual one (top-right). */
  private buildGroovyIndicator(): void {
    this.groovyText = this.add
      .text(0, 0, 'GROOVY', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#c9a0d8',
        backgroundColor: '#15171e',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(1, 0)
      .setDepth(4000)
      .setVisible(this.groovy)
  }

  /** G toggles groovy mode: weapon damage x2 (Ash-approved). */
  private toggleGroovy(): void {
    this.groovy = !this.groovy
    this.groovyText.setVisible(this.groovy)
  }

  /** Pause overlay: dim + PAUSED text, frozen at the view center. */
  private buildPauseOverlay(): void {
    const mid = this.cameras.main.midPoint
    const dim = this.add.rectangle(mid.x, mid.y, 8192, 8192, 0x000000, 0.55)
    const title = this.add
      .text(mid.x, mid.y - 50, 'PAUSED', {
        fontFamily: 'monospace',
        fontSize: '48px',
        fontStyle: 'bold',
        color: '#c9b189',
      })
      .setOrigin(0.5)
    const hint = this.add
      .text(mid.x, mid.y + 20, 'ESC resume   ·   R restart', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#9a9a92',
      })
      .setOrigin(0.5)
    this.pauseOverlay = this.add
      .container(0, 0, [dim, title, hint])
      .setDepth(2000)
      .setVisible(false)
  }

  private togglePause(): void {
    this.paused = !this.paused
    this.pauseOverlay.setVisible(this.paused)
  }

  /** Camera: clamped to the map diamond, smooth follow, mouse-wheel zoom. */
  private setupCamera(): void {
    const cam = this.cameras.main
    const halfW = TILE_W / 2
    const halfH = TILE_H / 2
    const left = -((MAP_SIZE.h - 1) * halfW) - halfW
    const width = (MAP_SIZE.w - 1) * TILE_W + TILE_W
    const height = (MAP_SIZE.w + MAP_SIZE.h - 2) * halfH + TILE_H
    cam.setBounds(left, 0, width, height)

    // Start on the player (no opening pan), then follow smoothly.
    const s = tileToScreen(this.player.x, this.player.y)
    cam.centerOn(s.x, s.y + TILE_H / 2)
    cam.startFollow(this.playerSprite, false, 0.12)

    // Mouse wheel: zoom in (up) / out (down), clamped to 0.5-2.0.
    this.input.on(
      'wheel',
      (_p: unknown, _over: unknown, _dx: number, dy: number) => {
        cam.setZoom(Phaser.Math.Clamp(cam.zoom - Math.sign(dy) * 0.1, 0.5, 2))
      },
    )

  }

  private spawnPlayer(): void {
    this.player = createPlayer(20, 24) // sidewalk at the street's south edge
    const s = tileToScreen(this.player.x, this.player.y)
    this.playerSprite = this.add
      .image(s.x, s.y + TILE_H / 2, TEX.player)
      .setOrigin(0.5, 1)
      .setDepth(depthFor(this.player.x, this.player.y))
  }

  update(_time: number, delta: number): void {
    let input: InputState = {
      up: this.keys.W.isDown || this.keys.UP.isDown,
      down: this.keys.S.isDown || this.keys.DOWN.isDown,
      left: this.keys.A.isDown || this.keys.LEFT.isDown,
      right: this.keys.D.isDown || this.keys.RIGHT.isDown,
    }
    // Debug overlay (F3) — works even while paused.
    if (Phaser.Input.Keyboard.JustDown(this.keys.F3)) {
      this.debugVisible = !this.debugVisible
      this.debugText.setVisible(this.debugVisible)
      this.updateDebug()
    }
    // Casual mode (C) — works even while paused.
    if (Phaser.Input.Keyboard.JustDown(this.keys.C)) this.toggleCasual()
    if (this.casual) {
      const cam = this.cameras.main
      this.casualText.setPosition(
        cam.scrollX + this.scale.width - 10,
        cam.scrollY + 10,
      )
    }
    // Groovy mode (G) — works even while paused (M4).
    if (Phaser.Input.Keyboard.JustDown(this.keys.G)) this.toggleGroovy()
    if (this.groovy) {
      const cam = this.cameras.main
      this.groovyText.setPosition(
        cam.scrollX + this.scale.width - 10,
        cam.scrollY + 34,
      )
    }
    if (this.debugVisible) {
      this._dbgTick++
      if (this._dbgTick % 6 === 0) this.updateDebug() // ~10Hz text refresh
    }
    // Death is terminal: only R works.
    if (this.dead) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.scene.restart()
      return
    }
    // Milestone 3: inventory overlay (I opens; I or ESC closes). The world
    // freezes while it is open (same early-return as pause).
    if (this.inventoryOpen) {
      if (
        Phaser.Input.Keyboard.JustDown(this.keys.I) ||
        Phaser.Input.Keyboard.JustDown(this.keys.ESC)
      ) {
        this.toggleInventory(false)
      }
      return
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.I)) this.toggleInventory(true)
    // Pause controls work in both states; the world freezes while paused.
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) this.togglePause()
    if (Phaser.Input.Keyboard.JustDown(this.keys.T)) this.toggleTutorial()
    if (this.paused) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.scene.restart()
      return
    }
    // Milestone 4: attack cooldown + swing FX countdown (tick-based).
    this.attackCooldownS = Math.max(0, this.attackCooldownS - delta / 1000)
    if (this.swingFxS > 0) {
      this.swingFxS -= delta / 1000
      if (this.swingFxS <= 0) this.swingFx.clear()
    }
    // TEMP verification hook (remove in C39): ?combat re-stands the player
    // and swings at the flagged zombie at ticks 25 and 67 (0.7 s cooldown
    // aligns), so a headless run can capture the hit + break pipeline
    // (pair with ?brittle to prove durability break + fallback).
    if (this._combatHook !== null) {
      this._hookTick += 1
      if (this._hookTick === 25 || this._hookTick === 67) {
        const e = this.zombies.find((x) => x.z.id === this._combatHook)
        if (e) {
          this.tempPlaceBeside(e.z)
          this.doAttack(e.z.x, e.z.y)
        }
      }
    }
    // Milestone 3: hotbar 1-8 uses a consumable (carry-only items stay put).
    for (let i = 0; i < this.hotbarKeys.length; i++) {
      if (Phaser.Input.Keyboard.JustDown(this.hotbarKeys[i])) {
        this.useHotbar(i)
        break
      }
    }
    this.updateContainerPrompt()
    // Milestone 3: E opens the nearest unlooted container (C31).
    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
      const nearest = this.nearestUnlootedContainer()
      if (nearest) this.openContainer(nearest)
    }
    const sprinting = this.keys.SHIFT.isDown && !this.player.sprintExhausted
    const speed = this.player.speed * (sprinting ? SPRINT_MULT : 1)
    this.player = moveWithCollision(this.player, input, worldMap, delta / 1000, speed)
    const s = tileToScreen(this.player.x, this.player.y)
    this.playerSprite.setPosition(s.x, s.y + TILE_H / 2)
    this.playerSprite.setDepth(depthFor(this.player.x, this.player.y))
    this.updateZombies(delta / 1000, input, sprinting)
    // Milestone 3: survival tick (hunger/stamina/starvation). Starvation can
    // finish the player off the same way zombie damage does. Casual mode
    // freezes the hunger axis entirely.
    const survival = tickSurvival(
      this.player,
      delta / 1000,
      sprinting,
      this.casual,
    )
    this.player = survival.player
    if (this.player.health <= 0 && !this.dead) this.die()
    this.updateHealthBar()
    this.updateSurvivalBars(survival.starving, survival.exhausted)
    if (this.player.hunger < HUNGER_LOW_AT) {
      this.showTutorial(deliver(this.tutorial, 'hunger.low'))
    }
    this.updateRoofs(delta)
  }

  /** Milestone 3: fixed loot containers (C30); opening lands in C31. */
  private createContainers(): void {
    this.containers = createLootContainers().map((c) => {
      const s = tileToScreen(c.x, c.y)
      const sprite = this.add
        .image(s.x + TILE_W / 2, s.y + TILE_H / 2, TEX.crate)
        .setOrigin(0.5, 1)
        .setDepth(depthFor(c.x, c.y))
      return { c, sprite }
    })
    this.containerPrompt = this.add
      .text(0, 0, '[E] Search', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#d8c9a0',
        backgroundColor: '#15171e',
        padding: { x: 6, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(4500)
      .setVisible(false)
  }

  /** Nearest unlooted container within search range, or null. */
  private nearestUnlootedContainer():
    | { c: LootContainerState; sprite: Phaser.GameObjects.Image }
    | null {
    let nearest: { c: LootContainerState; sprite: Phaser.GameObjects.Image } | null = null
    let best = CONTAINER_INTERACT_RANGE
    for (const entry of this.containers) {
      if (entry.c.looted) continue
      const d = Math.hypot(entry.c.x - this.player.x, entry.c.y - this.player.y)
      if (d <= best) {
        best = d
        nearest = entry
      }
    }
    return nearest
  }

  /** Show [E] Search over the nearest unlooted container in range. */
  private updateContainerPrompt(): void {
    const nearest = this.nearestUnlootedContainer()
    if (!nearest) {
      this.containerPrompt.setVisible(false)
      return
    }
    const s = tileToScreen(nearest.c.x, nearest.c.y)
    // The crate texture rises ~48px from the tile center; float the prompt
    // above the crate, not on top of it.
    this.containerPrompt.setPosition(s.x + TILE_W / 2, s.y - 36)
    this.containerPrompt.setVisible(true)
  }

  /** Open a container: deterministic loot, overflow lost, dimmed crate. */
  private openContainer(
    entry: { c: LootContainerState; sprite: Phaser.GameObjects.Image },
  ): void {
    openContainerLoot(entry.c, this.inventory)
    entry.sprite.setTint(0x555555) // spent crate: dimmed, never re-rolls
    this.showTutorial(deliver(this.tutorial, 'first.loot'))
    this.refreshInventoryOverlay()
  }

  /** Milestone 2: zombies wander (C18), investigate noise (C19). */
  private updateZombies(dt: number, input: InputState, sprinting: boolean): void {
    const moving = input.up || input.down || input.left || input.right
    // M4: a recent swing adds a one-shot noise pulse (zombies investigate).
    let noise = this.casual ? NOISE_STILL : noiseRadius(moving, sprinting)
    if (this.swingNoiseS > 0) {
      this.swingNoiseS = Math.max(0, this.swingNoiseS - dt)
      if (!this.casual) noise = Math.max(noise, NOISE_SWING)
    }
    const ctx: ZombieContext = {
      playerX: this.player.x,
      playerY: this.player.y,
      noiseRadius: noise,
      casual: this.casual,
    }
    let damage = 0
    for (const e of this.zombies) {
      const { z, sprite, tint } = e
      damage += updateZombie(z, passableTile, dt, ctx)
      const s = tileToScreen(z.x, z.y)
      sprite.setPosition(s.x, s.y + TILE_H / 2)
      sprite.setDepth(depthFor(z.x, z.y))
      // M4: hit-flash countdown (tick-based, headless-safe)
      if (e.flashS !== undefined) {
        e.flashS -= dt
        if (e.flashS <= 0) {
          e.flashS = undefined
          sprite.setTint(tint)
        }
      }
    }
    if (damage > 0) {
      this.player.health = Math.max(0, this.player.health - damage)
      if (this.player.health <= 0) this.die()
    }
    this.updateHealthBar()
    // S.A.F.E. advisory on first contact: deliver() is one-shot per session.
    const threatened = this.zombies.some(
      ({ z }) => z.state === 'CHASE' || z.state === 'ATTACK',
    )
    if (threatened) this.showTutorial(deliver(this.tutorial, 'zombie.chased'))
  }

  /** M4: left-click → tile → swing at the targeted zombie. */
  private onAttackClick(): void {
    if (this.dead || this.paused || this.inventoryOpen || this.casual) return
    if (this.attackCooldownS > 0) return
    const cam = this.cameras.main
    const p = this.input.activePointer
    // camera-space pointer → world px → logical tile (screenToTile is the
    // exact inverse of tileToScreen)
    const t = screenToTile(
      cam.scrollX + p.x / cam.zoom,
      cam.scrollY + p.y / cam.zoom,
    )
    this.doAttack(t.x, t.y)
  }

  /** M4: swing at the zombie nearest the click (whiff = no swing, no noise). */
  private doAttack(clickX: number, clickY: number): void {
    const zombies = this.zombies.map((e) => e.z)
    const target = pickAttackTarget(this.player, zombies, clickX, clickY)
    if (!target) return
    this.attackCooldownS = ATTACK_COOLDOWN_S
    this.swingNoiseS = 0.25 // one-shot noise pulse (updateZombies applies it)
    const swing = swingDamage(this.inventory, this.groovy)
    const r = applyHit(
      target,
      swing.damage,
      this.player.x,
      this.player.y,
      passableTile,
    )
    // M4 C37: durability cost; on break → S.A.F.E. one-shot + automatic
    // fallback (the next swingDamage re-resolves the held weapon).
    const cost =
      swing.slot !== null ? applySwingCost(this.inventory, swing.slot) : null
    if (cost?.broken) {
      this.showTutorial(deliver(this.tutorial, 'weapon.broke'))
    }
    this.playSwingFx(clickX, clickY)
    const entry = this.zombies.find((e) => e.z === target)
    if (entry) entry.flashS = 0.12 // hit flash (restored in updateZombies)
    if (r.dead) {
      this.kills += 1
      // M4 C38: S.A.F.E. first-kill advisory (one-shot per session).
      this.showTutorial(deliver(this.tutorial, 'first.kill'))
      this.fadeOutZombie(target)
    }
    // TEMP verification hook (remove in C39): deterministic pipeline evidence.
    const slotAfter = swing.slot !== null ? this.inventory[swing.slot] : null
    console.log(
      'C36HOOK swing -> z' + target.id + ' dmg=' + swing.damage +
        ' dead=' + r.dead + ' groovy=' + this.groovy +
        (cost?.broken
          ? ' BROKEN'
          : ' dur=' + (slotAfter?.durability ?? 'unarmed')),
    )
  }

  /** M4: short arc of line segments from the player toward the click. */
  private playSwingFx(clickX: number, clickY: number): void {
    const g = this.swingFx
    g.clear()
    const from = tileToScreen(this.player.x, this.player.y)
    const to = tileToScreen(clickX, clickY)
    const fx = from.x
    const fy = from.y + TILE_H / 2
    const ang = Math.atan2(to.y + TILE_H / 2 - fy, to.x - fx)
    g.lineStyle(3, 0xd8c9a0, 0.9)
    for (let i = 0; i < 4; i++) {
      const a = ang - 0.45 + (i / 3) * 0.9 // ~51-degree fan
      g.lineBetween(
        fx + Math.cos(a) * 14,
        fy + Math.sin(a) * 14,
        fx + Math.cos(a) * 34,
        fy + Math.sin(a) * 34,
      )
    }
    this.swingFxS = 0.1
  }

  /** M4: dead zombie leaves the authoritative state immediately; the
   *  sprite is scene-only FX that fades out and is destroyed. */
  private fadeOutZombie(z: ZombieState): void {
    const idx = this.zombies.findIndex((e) => e.z === z)
    if (idx === -1) return
    const sprite = this.zombies[idx].sprite
    this.zombies.splice(idx, 1)
    this.tweens.add({
      targets: sprite,
      alpha: 0,
      duration: 500,
      onComplete: () => sprite.destroy(),
    })
  }

  /** TEMP (remove in C39): stand the player 1 tile from a zombie on
   *  passable ground. */
  private tempPlaceBeside(z: ZombieState): void {
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ] as const) {
      const px = Math.round(z.x + dx)
      const py = Math.round(z.y + dy)
      if (worldMap.isPassable(px, py)) {
        this.player.x = px
        this.player.y = py
        const s = tileToScreen(px, py)
        this.playerSprite.setPosition(s.x, s.y + TILE_H / 2)
        this.playerSprite.setDepth(depthFor(px, py))
        return
      }
    }
  }

  /** M4: nearest zombie to a tile point (used by the ?combat TEMP hook). */
  private nearestZombieTo(
    x: number,
    y: number,
  ): {
      z: ZombieState
      sprite: Phaser.GameObjects.Image
      tint: number
      flashS?: number
    } | null {
    let best: {
      z: ZombieState
      sprite: Phaser.GameObjects.Image
      tint: number
      flashS?: number
    } | null = null
    let dist = Infinity
    for (const e of this.zombies) {
      const d = Math.hypot(e.z.x - x, e.z.y - y)
      if (d < dist) {
        best = e
        dist = d
      }
    }
    return best
  }

  /** Small health bar pinned to the view top-left. */
  private buildHealthBar(): void {
    this.healthFill = this.add.rectangle(0, 0, 130, 10, 0xc0392b)
    this.healthFill.setOrigin(0, 0.5)
    this.healthText = this.add
      .text(138, 0, '', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#d8c9a0',
      })
      .setOrigin(0, 0.5)
    const bg = this.add.rectangle(0, 0, 134, 18, 0x15171e, 0.9)
      .setOrigin(0, 0)
      .setX(-4)
      .setY(-9)
    const pad = this.add.rectangle(0, 0, 132, 12, 0x3a1f1a)
      .setOrigin(0, 0)
      .setX(-2)
      .setY(-6)
    this.healthBar = this.add
      .container(0, 0, [bg, pad, this.healthFill, this.healthText])
      .setDepth(4000)
  }

  private updateHealthBar(): void {
    const cam = this.cameras.main
    this.healthBar.setPosition(cam.scrollX + 14, cam.scrollY + 14)
    this.healthFill.setScale(Math.max(0.01, this.player.health / 100), 1)
    this.healthText.setText(`${Math.ceil(this.player.health)} / 100`)
  }

  /** Milestone 3: hunger + stamina bars stacked under the health bar. */
  private buildSurvivalBars(): void {
    const hunger = this.makeStatBar(0xd08a3e, 0x3a2f1a)
    this.hungerBar = hunger.bar
    this.hungerFill = hunger.fill
    this.hungerText = hunger.text
    const stamina = this.makeStatBar(0x5c9a50, 0x22331f)
    this.staminaBar = stamina.bar
    this.staminaFill = stamina.fill
    this.staminaText = stamina.text
  }

  /** One stat bar (bg + pad + fill + value text), pinned to the view. */
  private makeStatBar(
    fillColor: number,
    padColor: number,
  ): { bar: Phaser.GameObjects.Container; fill: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text } {
    const fill = this.add.rectangle(0, 0, 130, 10, fillColor).setOrigin(0, 0.5)
    const text = this.add
      .text(138, 0, '', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#d8c9a0',
      })
      .setOrigin(0, 0.5)
    const bg = this.add.rectangle(0, 0, 134, 18, 0x15171e, 0.9)
      .setOrigin(0, 0)
      .setX(-4)
      .setY(-9)
    const pad = this.add.rectangle(0, 0, 132, 12, padColor)
      .setOrigin(0, 0)
      .setX(-2)
      .setY(-6)
    const bar = this.add.container(0, 0, [bg, pad, fill, text]).setDepth(4000)
    return { bar, fill, text }
  }

  private updateSurvivalBars(starving: boolean, exhausted: boolean): void {
    const cam = this.cameras.main
    this.hungerBar.setPosition(cam.scrollX + 14, cam.scrollY + 42)
    this.staminaBar.setPosition(cam.scrollX + 14, cam.scrollY + 70)
    this.hungerFill.setScale(Math.max(0.01, this.player.hunger / 100), 1)
    this.hungerFill.setFillStyle(starving ? 0xc0392b : 0xd08a3e)
    this.hungerText.setText(
      starving ? 'STARVED' : `${Math.ceil(this.player.hunger)} / 100`,
    )
    this.staminaFill.setScale(Math.max(0.01, this.player.stamina / 100), 1)
    this.staminaFill.setFillStyle(exhausted ? 0xc0392b : 0x5c9a50)
    this.staminaText.setText(
      exhausted ? 'EXHAUSTED' : `${Math.ceil(this.player.stamina)} / 100`,
    )
  }

  /** Milestone 3: 4x4 grid overlay; slots 1-8 are the hotbar. */
  private buildInventoryOverlay(): void {
    const mid = this.cameras.main.midPoint
    const SLOT = 56
    const GAP = 8
    const gridW = 4 * SLOT + 3 * GAP
    const left = mid.x - gridW / 2
    const top = mid.y - 120
    const dim = this.add.rectangle(mid.x, mid.y, 8192, 8192, 0x000000, 0.55)
    const title = this.add
      .text(mid.x, mid.y - 152, 'INVENTORY', {
        fontFamily: 'monospace',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#c9b189',
      })
      .setOrigin(0.5)
    const hint = this.add
      .text(mid.x, mid.y + 168, '1-8 use item   ·   I / ESC close', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#9a9a92',
      })
      .setOrigin(0.5)
    const kids: Phaser.GameObjects.GameObject[] = [dim, title, hint]
    for (let i = 0; i < 16; i++) {
      const cx = left + SLOT / 2 + (i % 4) * (SLOT + GAP)
      const cy = top + SLOT / 2 + Math.floor(i / 4) * (SLOT + GAP)
      kids.push(
        this.add.rectangle(cx, cy, SLOT + 4, SLOT + 4, 0x3a4030).setOrigin(0.5),
        this.add.rectangle(cx, cy, SLOT, SLOT, 0x1c1f26).setOrigin(0.5),
      )
      if (i < 8) {
        kids.push(
          this.add
            .text(cx - SLOT / 2 + 8, cy - SLOT / 2 + 8, String(i + 1), {
              fontFamily: 'monospace',
              fontSize: '11px',
              color: '#9ad0a0',
            })
            .setOrigin(0),
        )
      }
      const label = this.add
        .text(cx, cy, '', {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#d8c9a0',
          align: 'center',
          wordWrap: { width: SLOT - 8 },
        })
        .setOrigin(0.5)
      this.inventorySlotTexts.push(label)
      kids.push(label)
    }
    this.inventoryOverlay = this.add
      .container(0, 0, kids)
      .setDepth(2500)
      .setVisible(false)
  }

  /** Hotbar slot 1-8: consume one consumable, apply restores, S.A.F.E. note. */
  private useHotbar(index: number): void {
    const result = useHotbarSlot(this.inventory, this.player, index)
    if (!result.consumed) return
    this.player = result.player
    this.updateHealthBar()
    this.updateSurvivalBars(
      this.player.hunger <= 0,
      this.player.sprintExhausted,
    )
    if (result.event) this.showTutorial(deliver(this.tutorial, result.event))
  }

  private toggleInventory(open: boolean): void {
    this.inventoryOpen = open
    this.inventoryOverlay.setVisible(open)
    if (open) this.refreshInventoryOverlay()
  }

  private refreshInventoryOverlay(): void {
    this.inventorySlotTexts.forEach((t, i) => {
      const slot = this.inventory[i]
      if (!slot) {
        t.setText('')
        return
      }
      const item = getItem(slot.itemId)
      t.setText(`${item ? item.name : slot.itemId}\n\u00d7 ${slot.qty}`)
    })
  }

  /** Death: the world freezes; R restarts the run. */
  private die(): void {
    if (this.dead) return
    this.dead = true
    const mid = this.cameras.main.midPoint
    const dim = this.add.rectangle(mid.x, mid.y, 8192, 8192, 0x000000, 0.6)
    const title = this.add
      .text(mid.x, mid.y - 40, 'YOU HAVE JOINED THE NEIGHBORHOOD', {
        fontFamily: 'monospace',
        fontSize: '34px',
        fontStyle: 'bold',
        color: '#c9b189',
        align: 'center',
      })
      .setOrigin(0.5)
    const body = this.add
      .text(
        mid.x,
        mid.y + 12,
        'S.A.F.E. Advisory: You are now a resident of Nowhere.\nPlease keep your moaning to a minimum — the others are still adjusting.',
        {
          fontFamily: 'monospace',
          fontSize: '15px',
          color: '#9a9a92',
          align: 'center',
        },
      )
      .setOrigin(0.5)
    // M4 C38: kill count on the death overlay.
    const kills = this.add
      .text(
        mid.x,
        mid.y + 44,
        this.kills > 0
          ? 'You accounted for ' + this.kills + ' of the neighborhood\'s '
            + ZOMBIE_SPAWNS.length + '. They have since moved on.'
          : 'You accounted for none of the neighborhood. They have since noticed.',
        {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#c9a0d8',
          align: 'center',
        },
      )
      .setOrigin(0.5)
    const retry = this.add
      .text(mid.x, mid.y + 70, 'R — TRY AGAIN', {
        fontFamily: 'monospace',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#4c8a46',
      })
      .setOrigin(0.5)
    this.tweens.add({
      targets: retry,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    })
    this.deathOverlay = this.add.container(0, 0, [dim, title, body, kills, retry]).setDepth(3000)
  }

  /** S.A.F.E. banner: one message at a time, auto-dismisses (no spam). */
  private showTutorial(msg: TutorialMessage | null): void {
    if (!msg) return
    const mid = this.cameras.main.midPoint
    const t = this.add
      .text(mid.x, mid.y - 190, 'S.A.F.E. \u2014 ' + msg.text, {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#d8c9a0',
        backgroundColor: '#15171e',
        padding: { x: 14, y: 10 },
        align: 'center',
        wordWrap: { width: 520 },
      })
      .setOrigin(0.5)
      .setDepth(3000)
      .setAlpha(0)
    this.tweens.add({ targets: t, alpha: 1, duration: 250 })
    this.time.delayedCall(6000, () => {
      this.tweens.add({
        targets: t,
        alpha: 0,
        duration: 500,
        onComplete: () => t.destroy(),
      })
    })
  }

  /** T toggles the S.A.F.E. system at runtime. */
  private toggleTutorial(): void {
    setEnabled(this.tutorial, !this.tutorial.enabled)
  }

  /** Refresh the debug overlay: position pinned to the view, values live. */
  private updateDebug(): void {
    const cam = this.cameras.main
    const s = tileToScreen(this.player.x, this.player.y)
    this.debugText
      .setPosition(cam.scrollX + 10, cam.scrollY + 42) // below the health bar
      .setText(
        formatDebugStats({
          fps: this.game.loop.actualFps,
          tileX: this.player.x,
          tileY: this.player.y,
          worldX: s.x,
          worldY: s.y + TILE_H / 2,
          entityCount: this.children.list.length,
          renderer:
            this.game.renderer.type === Phaser.WEBGL ? 'webgl' : 'canvas',
          casual: this.casual,
          heldWeapon: this.heldWeaponLabel(),
          hunger: this.player.hunger,
          stamina: this.player.stamina,
          zombies: this.zombies.map(({ z }) => ({
            id: z.id,
            state: z.state,
            x: z.x,
            y: z.y,
            health: z.health,
          })),
          containers: this.containers.map(({ c }) => ({
            id: c.id,
            location: c.location,
            looted: c.looted,
          })),
        }),
      )
  }

  /** M4 C38: debug label for the held weapon (name + durability). */
  private heldWeaponLabel(): string {
    const w = heldWeapon(this.inventory)
    if (!w) return 'bare hands'
    const slot = this.inventory[w.slot]
    const item = getItem(w.itemId)
    const dur = slot?.durability
    return (item?.name ?? w.itemId) + (dur !== undefined ? ' (' + dur + ')' : '')
  }

  /** Hide the roof of the building the player is inside; fade the rest back. */
  private updateRoofs(delta: number): void {
    const inside = buildingAt(this.roofIndex, this.player.x, this.player.y)
    const step = ROOF_FADE_PER_SEC * (delta / 1000)
    for (const b of this.roofIndex.buildings) {
      const target = inside === b.id ? 0 : 1
      const cur = this.roofAlpha.get(b.id) ?? 1
      if (cur === target) continue
      const next = target < cur ? Math.max(target, cur - step) : Math.min(target, cur + step)
      this.roofAlpha.set(b.id, next)
      for (const spr of this.roofByBuilding.get(b.id) ?? []) spr.setAlpha(next)
    }
  }

  /** All 2304 ground diamonds baked into ONE Graphics object (single draw call). */
  private drawGround(): void {
    const g = this.add.graphics()
    g.setDepth(0)

    for (let y = 0; y < MAP_SIZE.h; y++) {
      for (let x = 0; x < MAP_SIZE.w; x++) {
        const [rim, fill] = GROUND_COLORS[worldMap.grid[y][x]] ?? GRASS
        const s = tileToScreen(x, y)
        this.drawDiamond(g, s.x, s.y, rim, fill)
      }
    }
  }

  /**
   * 64x32 diamond with top corner at (sx, sy): dark rim + inner fill.
   * Drawn as two triangles per layer — fillPoints is unreliable in the
   * headless canvas fallback used for automated verification.
   */
  private drawDiamond(
    g: Phaser.GameObjects.Graphics,
    sx: number,
    sy: number,
    rim: number,
    fill: number,
  ): void {
    const hw = TILE_W / 2 // 32
    const hh = TILE_H / 2 // 16
    // rim (full diamond)
    g.fillStyle(rim)
    g.fillTriangle(sx, sy, sx + hw, sy + hh, sx, sy + TILE_H)
    g.fillTriangle(sx, sy, sx, sy + TILE_H, sx - hw, sy + hh)
    // inner fill (slightly inset)
    const iw = hw - 4
    const iy = 3
    g.fillStyle(fill)
    g.fillTriangle(sx, sy + iy, sx + iw, sy + hh, sx, sy + TILE_H - iy)
    g.fillTriangle(sx, sy + iy, sx, sy + TILE_H - iy, sx - iw, sy + hh)
  }

  private drawObjects(): void {
    const W = MAP_SIZE.w
    const H = MAP_SIZE.h
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const t = worldMap.grid[y][x]
        const s = tileToScreen(x, y)
        const cx = s.x + TILE_W / 2
        const cy = s.y + TILE_H / 2
        switch (t) {
          case TileType.WALL_OUT:
          case TileType.WALL_IN:
            this.add.image(cx, cy, TEX.wallPlain).setDepth(depthFor(x, y))
            break
          case TileType.DOOR:
            this.add.image(cx, cy, TEX.wallDoor).setDepth(depthFor(x, y))
            break
          case TileType.WINDOW:
            this.add.image(cx, cy, TEX.wallWindow).setDepth(depthFor(x, y))
            break
          case TileType.FENCE:
            this.add.image(cx, cy, TEX.fence).setOrigin(0.5, 1).setDepth(depthFor(x, y))
            break
          case TileType.TREE:
            this.add.image(cx, cy, TEX.tree).setOrigin(0.5, 1).setDepth(depthFor(x, y))
            break
          case TileType.CAR:
            // one sprite per parked car, anchored on its leftmost tile
            if (worldMap.getTile(x - 1, y) !== TileType.CAR) {
              this.add
                .image(cx + TILE_W / 4, cy + 6, TEX.car)
                .setOrigin(0.5, 0.9)
                .setDepth(depthFor(x + 0.5, y))
            }
            break
        }
      }
    }
  }

  private drawRoofs(): void {
    for (const idx of worldMap.roofTiles()) {
      const x = idx % MAP_SIZE.w
      const y = Math.floor(idx / MAP_SIZE.w)
      const s = tileToScreen(x, y)
      const sprite = this.add
        .image(s.x + TILE_W / 2, s.y - TILE_H / 2, TEX.roof) // float 32px (wall height)
        .setDepth(depthFor(x, y, 5))
      const b = this.roofIndex.tileToBuilding.get(tileKey(x, y))
      if (b !== undefined) {
        const arr = this.roofByBuilding.get(b) ?? []
        arr.push(sprite)
        this.roofByBuilding.set(b, arr)
      }
    }
  }
}
