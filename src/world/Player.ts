// Authoritative player state. Positions are fractional tile coords (logical
// space, separate from screen space — see IsoProjection).
export interface PlayerState {
  x: number // tile space (float)
  y: number // tile space (float)
  speed: number // screen px / second; constant across all 8 directions
  health: number // 0..MAX_HEALTH; no regen, no healing in Milestone 2
}

export const MAX_HEALTH = 100

/** Sprint multiplier (Shift). No stamina in Milestone 2. */
export const SPRINT_MULT = 1.5

export function createPlayer(
  x: number,
  y: number,
  speed = 150,
  health = MAX_HEALTH,
): PlayerState {
  return { x, y, speed, health }
}
