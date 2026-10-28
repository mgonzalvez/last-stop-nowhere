// Isometric projection: logical tile coords <-> screen coords.
// Diamond tiles: 64 wide, 32 tall. tileToScreen returns the TOP corner of the
// diamond; the diamond extends down by TILE_H. Pure math — no Phaser objects.

export const TILE_W = 64
export const TILE_H = 32

let originX = 0
let originY = 0

/** Set the screen-space anchor where tile (0,0) is drawn. */
export function setOrigin(x: number, y: number): void {
  originX = x
  originY = y
}

export function getOrigin(): { x: number; y: number } {
  return { x: originX, y: originY }
}

/** Tile (top corner) -> screen position. Accepts fractional tile coords. */
export function tileToScreen(tileX: number, tileY: number): { x: number; y: number } {
  return {
    x: originX + (tileX - tileY) * (TILE_W / 2),
    y: originY + (tileX + tileY) * (TILE_H / 2),
  }
}

/** Screen position -> fractional tile coords (inverse of tileToScreen). */
export function screenToTile(screenX: number, screenY: number): { x: number; y: number } {
  const dx = (screenX - originX) / (TILE_W / 2)
  const dy = (screenY - originY) / (TILE_H / 2)
  return { x: (dy + dx) / 2, y: (dy - dx) / 2 }
}
