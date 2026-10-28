// Player movement: pure, Phaser-free. Authoritative tile-space positions.
import { TILE_W, TILE_H } from '../world/IsoProjection'
import type { PlayerState } from '../world/Player'

export interface InputState {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
}

/**
 * Tile-space velocity (tiles/second) for the given input.
 * Screen-relative 8-direction: W/A/S/D map to screen up/left/down/right,
 * normalized so diagonal screen speed == axis screen speed. The unit screen
 * velocity is converted to tile space via the inverse iso projection.
 */
export function inputVelocity(
  player: PlayerState,
  input: InputState,
): { vx: number; vy: number } {
  const ix = (input.right ? 1 : 0) - (input.left ? 1 : 0)
  const iy = (input.down ? 1 : 0) - (input.up ? 1 : 0)
  if (ix === 0 && iy === 0) return { vx: 0, vy: 0 }

  const sx = ix / Math.hypot(ix, iy)
  const sy = iy / Math.hypot(ix, iy)

  // Inverse iso projection: unit screen velocity -> tile velocity (per px/s).
  // screen: X = (tx - ty) * hw, Y = (tx + ty) * hh
  const hw = TILE_W / 2
  const hh = TILE_H / 2
  return {
    vx: ((sx / hw + sy / hh) / 2) * player.speed,
    vy: ((sy / hh - sx / hw) / 2) * player.speed,
  }
}

/** Pure movement, no collision. Returns the next PlayerState. */
export function movePlayer(
  player: PlayerState,
  input: InputState,
  dt: number,
): PlayerState {
  const { vx, vy } = inputVelocity(player, input)
  return { ...player, x: player.x + vx * dt, y: player.y + vy * dt }
}
