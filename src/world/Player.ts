// Authoritative player state. Positions are fractional tile coords (logical
// space, separate from screen space — see IsoProjection).
export interface PlayerState {
  x: number // tile space (float)
  y: number // tile space (float)
  speed: number // screen px / second; constant across all 8 directions
  health: number // 0..MAX_HEALTH; no regen (M3: medical items restore)
  hunger: number // 0..MAX_HUNGER (M3)
  stamina: number // 0..MAX_STAMINA (M3)
  sprintExhausted: boolean // latch: set at 0 stamina, clears at SPRINT_REENABLE_AT
}

export const MAX_HEALTH = 100
export const MAX_HUNGER = 100
export const MAX_STAMINA = 100

/** Sprint multiplier (Shift). */
export const SPRINT_MULT = 1.5

export function createPlayer(
  x: number,
  y: number,
  speed = 150,
  health = MAX_HEALTH,
  hunger = MAX_HUNGER,
  stamina = MAX_STAMINA,
): PlayerState {
  return { x, y, speed, health, hunger, stamina, sprintExhausted: false }
}
