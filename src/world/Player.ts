// Authoritative player state. Positions are fractional tile coords (logical
// space, separate from screen space — see IsoProjection).
export interface PlayerState {
  x: number // tile space (float)
  y: number // tile space (float)
  speed: number // screen px / second; constant across all 8 directions
}

export function createPlayer(x: number, y: number, speed = 150): PlayerState {
  return { x, y, speed }
}
