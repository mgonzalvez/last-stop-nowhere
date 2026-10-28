import Phaser from 'phaser'
import { worldMap, MAP_SIZE } from '../../world/WorldMap'
import { TileType } from '../../world/TileTypes'
import { setOrigin, tileToScreen, TILE_W, TILE_H } from '../../world/IsoProjection'
import { createPlayer, type PlayerState } from '../../world/Player'
import { type InputState } from '../../systems/MovementSystem'
import { moveWithCollision } from '../../systems/CollisionSystem'
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

// Roof fade speed (alpha units per second) -> ~0.25s full fade.
const ROOF_FADE_PER_SEC = 4

export class GameScene extends Phaser.Scene {
  private player!: PlayerState
  private playerSprite!: Phaser.GameObjects.Image
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
    F3: Phaser.Input.Keyboard.Key
    ESC: Phaser.Input.Keyboard.Key
    UP: Phaser.Input.Keyboard.Key
    DOWN: Phaser.Input.Keyboard.Key
    LEFT: Phaser.Input.Keyboard.Key
    RIGHT: Phaser.Input.Keyboard.Key
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
    this.setupCamera()
    this.buildPauseOverlay()
    this.keys = this.input.keyboard!.addKeys(
      'W,A,S,D,R,T,F3,ESC,UP,DOWN,LEFT,RIGHT',
    ) as unknown as GameScene['keys']

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
    if (this.debugVisible) {
      this._dbgTick++
      if (this._dbgTick % 6 === 0) this.updateDebug() // ~10Hz text refresh
    }
    // Pause controls work in both states; the world freezes while paused.
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) this.togglePause()
    if (Phaser.Input.Keyboard.JustDown(this.keys.T)) this.toggleTutorial()
    if (this.paused) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.scene.restart()
      return
    }
    this.player = moveWithCollision(this.player, input, worldMap, delta / 1000)
    const s = tileToScreen(this.player.x, this.player.y)
    this.playerSprite.setPosition(s.x, s.y + TILE_H / 2)
    this.playerSprite.setDepth(depthFor(this.player.x, this.player.y))
    this.updateRoofs(delta)
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
      .setPosition(cam.scrollX + 10, cam.scrollY + 10)
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
        }),
      )
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
