// Collision: tile-passability checks + per-axis movement resolution.
// Pure, Phaser-free. Positions are tile-space (see MovementSystem).
import type { WorldMap } from '../world/WorldMap'
import type { PlayerState } from '../world/Player'
import { inputVelocity, type InputState } from './MovementSystem'

/**
 * Player footprint radius in tile units (foot-centered).
 * 0.25 keeps 1-tile door gaps passable: the footprint fits inside a single
 * tile when the player aims at its center.
 */
export const PLAYER_RADIUS = 0.25

/** True if the player's footprint at (tx, ty) overlaps only passable tiles. */
export function isClear(map: WorldMap, tx: number, ty: number, r = PLAYER_RADIUS): boolean {
  const minX = Math.floor(tx - r)
  const maxX = Math.floor(tx + r)
  const minY = Math.floor(ty - r)
  const maxY = Math.floor(ty + r)
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (!map.isPassable(x, y)) return false
    }
  }
  return true
}

/**
 * Per-axis resolution of a proposed step: try the full tile-x move, then the
 * full tile-y move (using the accepted x). A blocked axis is dropped, which
 * produces sliding along walls.
 */
export function resolveStep(
  map: WorldMap,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  r = PLAYER_RADIUS,
): { x: number; y: number } {
  let nx = fromX
  let ny = fromY
  if (isClear(map, toX, fromY, r)) nx = toX
  if (isClear(map, nx, toY, r)) ny = toY
  return { x: nx, y: ny }
}

/** Full input step with collision. Returns the next PlayerState. */
export function moveWithCollision(
  player: PlayerState,
  input: InputState,
  map: WorldMap,
  dt: number,
  speed = player.speed,
): PlayerState {
  const { vx, vy } = inputVelocity(player, input, speed)
  const res = resolveStep(map, player.x, player.y, player.x + vx * dt, player.y + vy * dt)
  return { ...player, x: res.x, y: res.y }
}
