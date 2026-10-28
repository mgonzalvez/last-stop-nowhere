// Procedural placeholder artwork: every texture is drawn with Phaser Graphics
// at boot and cached as a texture. No external image files.
//
// NOTE: only fillRect / fillRoundedRect / fillCircle / fillTriangle primitives
// are used. Polygon fills via fillPoints() come out empty in the headless
// canvas renderer used for automated verification (and we keep the code path
// identical for the WebGL target).
import Phaser from 'phaser'

export const TEX = {
  tileGrass: 'tile.grass',
  tileRoad: 'tile.road',
  tileSidewalk: 'tile.sidewalk',
  tileWood: 'tile.wood',
  wallPlain: 'wall.plain',
  wallDoor: 'wall.door',
  wallWindow: 'wall.window',
  roof: 'roof.tile',
  fence: 'fence',
  tree: 'tree',
  car: 'car',
  crate: 'crate',
  player: 'player',
  zombie: 'zombie',
} as const

type G = Phaser.GameObjects.Graphics

/** Filled diamond (center cx,cy, size w x h) as two triangles. */
function diamond(g: G, cx: number, cy: number, w: number, h: number, color: number): void {
  g.fillStyle(color)
  g.fillTriangle(cx, cy - h / 2, cx + w / 2, cy, cx, cy + h / 2)
  g.fillTriangle(cx, cy - h / 2, cx, cy + h / 2, cx - w / 2, cy)
}

/** Ground tile (64x32): dark rim + inner fill. */
function groundTile(g: G, rim: number, fill: number): void {
  diamond(g, 32, 16, 64, 32, rim)
  diamond(g, 32, 16, 56, 26, fill)
}

/**
 * Parallelogram quad on the right (SE) wall face, as two triangles.
 * Face bottom edge: y = 64 - 0.5*(x-32).
 */
function faceQuad(g: G, x0: number, x1: number, bottomOffset: number, height: number, color: number): void {
  const by0 = 64 - 0.5 * (x0 - 32) - bottomOffset
  const by1 = 64 - 0.5 * (x1 - 32) - bottomOffset
  g.fillStyle(color)
  g.fillTriangle(x0, by0, x1, by1, x1, by1 - height)
  g.fillTriangle(x0, by0, x1, by1 - height, x0, by0 - height)
}

/** Extruded wall tile (64x64): top diamond + left/right faces (triangles). */
function wallBase(g: G, top: number, left: number, right: number): void {
  g.fillStyle(left)
  g.fillTriangle(0, 16, 32, 32, 32, 64)
  g.fillTriangle(0, 16, 32, 64, 0, 48)
  g.fillStyle(right)
  g.fillTriangle(32, 32, 64, 16, 64, 48)
  g.fillTriangle(32, 32, 64, 48, 32, 64)
  diamond(g, 32, 16, 64, 32, top)
}

export function createProceduralAssets(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEX.player)) return // idempotent

  const g = scene.add.graphics()
  try {
    // --- ground tiles -------------------------------------------------
    g.clear()
    groundTile(g, 0x3a6d36, 0x4c8a46) // grass
    g.fillStyle(0x3a6d36)
    g.fillRect(16, 12, 3, 3); g.fillRect(30, 8, 3, 3); g.fillRect(44, 16, 3, 3)
    g.fillRect(24, 20, 3, 3); g.fillRect(50, 12, 3, 3)
    g.generateTexture(TEX.tileGrass, 64, 32)

    g.clear()
    groundTile(g, 0x3d3d44, 0x4c4c55) // road
    g.lineStyle(2, 0xd8d8c8)
    g.lineBetween(16, 9, 28, 15); g.lineBetween(36, 19, 48, 25)
    g.generateTexture(TEX.tileRoad, 64, 32)

    g.clear()
    groundTile(g, 0x7a7a74, 0x9a9a92) // sidewalk
    g.lineStyle(1, 0x7a7a74)
    g.lineBetween(32, 4, 12, 16); g.lineBetween(32, 4, 52, 16)
    g.generateTexture(TEX.tileSidewalk, 64, 32)

    g.clear()
    groundTile(g, 0x5e4026, 0x7d5a33) // wood floor
    g.lineStyle(1, 0x5e4026)
    g.lineBetween(18, 8, 50, 24); g.lineBetween(24, 6, 56, 22)
    g.generateTexture(TEX.tileWood, 64, 32)

    // --- walls (extruded, 64x64) --------------------------------------
    g.clear()
    wallBase(g, 0xc9b189, 0x8a6f52, 0xa58963) // plain
    g.generateTexture(TEX.wallPlain, 64, 64)

    g.clear()
    wallBase(g, 0xc9b189, 0x8a6f52, 0xa58963)
    faceQuad(g, 40, 56, 0, 28, 0x5a3d28) // door
    faceQuad(g, 47, 49, 10, 3, 0xd8c9a0) // knob
    g.generateTexture(TEX.wallDoor, 64, 64)

    g.clear()
    wallBase(g, 0xc9b189, 0x8a6f52, 0xa58963)
    faceQuad(g, 41, 55, 8, 14, 0x2f3a44) // window frame
    faceQuad(g, 43, 53, 10, 10, 0xbcd0da) // glass
    g.generateTexture(TEX.wallWindow, 64, 64)

    // --- roof tile -----------------------------------------------------
    g.clear()
    diamond(g, 32, 16, 64, 32, 0x6e2822)
    diamond(g, 32, 16, 58, 28, 0x9c3830)
    diamond(g, 32, 16, 40, 20, 0xb0453a)
    g.generateTexture(TEX.roof, 64, 32)

    // --- fence (64x40, transparent bg; anchor bottom-center at tile) ---
    g.clear()
    g.fillStyle(0x5a3d28)
    g.fillRect(6, 8, 6, 32); g.fillRect(52, 8, 6, 32)
    g.fillStyle(0x7a5a3a)
    g.fillRect(2, 14, 60, 5); g.fillRect(2, 24, 60, 5)
    g.generateTexture(TEX.fence, 64, 40)

    // --- tree (64x80; anchor bottom-center) ----------------------------
    g.clear()
    g.fillStyle(0x5a3d28)
    g.fillRect(28, 52, 8, 26)
    g.fillStyle(0x2f6b33)
    g.fillCircle(32, 26, 20)
    g.fillStyle(0x357a38)
    g.fillCircle(20, 40, 14); g.fillCircle(44, 40, 14)
    g.fillStyle(0x468c48)
    g.fillCircle(26, 22, 8)
    g.generateTexture(TEX.tree, 64, 80)

    // --- car (96x64; spans two adjacent tiles, anchor bottom-center) ---
    g.clear()
    g.fillStyle(0x6b7078)
    g.fillRoundedRect(8, 24, 80, 20, 6)
    g.fillStyle(0x4a4f57)
    g.fillRoundedRect(28, 10, 44, 16, 4)
    g.fillStyle(0xbcd0da)
    g.fillRect(34, 14, 14, 8); g.fillRect(54, 14, 14, 8)
    g.fillStyle(0x222222)
    g.fillCircle(26, 46, 7); g.fillCircle(70, 46, 7)
    g.fillStyle(0x555555)
    g.fillCircle(26, 46, 3); g.fillCircle(70, 46, 3)
    g.generateTexture(TEX.car, 96, 64)

    // --- crate (48x48; anchor bottom-center) ----------------------------
    g.clear()
    g.fillStyle(0x000000, 0.3)
    g.fillEllipse(24, 45, 30, 10) // shadow
    g.fillStyle(0x6b4a2a) // front-left face
    g.fillTriangle(6, 18, 24, 27, 24, 45)
    g.fillTriangle(6, 18, 24, 45, 6, 36)
    g.fillStyle(0x5a3d22) // front-right face (darker)
    g.fillTriangle(42, 18, 24, 27, 24, 45)
    g.fillTriangle(42, 18, 24, 45, 42, 36)
    g.fillStyle(0x4a3018)
    g.fillRect(22, 27, 4, 18) // front edge
    diamond(g, 24, 18, 36, 18, 0x8a6a3f) // top
    g.generateTexture(TEX.crate, 48, 48)

    // --- player (32x48; anchor bottom-center) ---------------------------
    g.clear()
    g.fillStyle(0x000000, 0.3)
    g.fillEllipse(16, 44, 20, 8) // shadow
    g.fillStyle(0x4a3320)
    g.fillRect(10, 2, 12, 4) // hair
    g.fillStyle(0xd9a066)
    g.fillRect(10, 6, 12, 10) // head
    g.fillStyle(0x3f6b8a)
    g.fillRect(8, 16, 16, 16) // jacket
    g.fillStyle(0x2c3e50)
    g.fillRect(9, 32, 6, 14); g.fillRect(17, 32, 6, 14) // legs
    g.generateTexture(TEX.player, 32, 48)

    // --- zombie (32x48; anchor bottom-center) ---------------------------
    g.clear()
    g.fillStyle(0x000000, 0.3)
    g.fillEllipse(16, 44, 20, 8) // shadow
    g.fillStyle(0x3a4030)
    g.fillRect(9, 32, 6, 14); g.fillRect(17, 32, 6, 14) // legs
    g.fillStyle(0x55603c)
    g.fillRect(8, 16, 16, 16) // tattered jacket
    g.fillStyle(0x48532f)
    g.fillRect(18, 26, 6, 6) // tear
    g.fillStyle(0x9fb88a)
    g.fillRect(0, 19, 8, 5); g.fillRect(24, 19, 8, 5) // arms forward
    g.fillRect(10, 6, 12, 10) // head (pale green)
    g.fillStyle(0x2f3a2f)
    g.fillRect(13, 9, 3, 3) // eye
    g.fillRect(12, 13, 5, 2) // mouth
    g.generateTexture(TEX.zombie, 32, 48)
  } finally {
    g.destroy()
  }
}
