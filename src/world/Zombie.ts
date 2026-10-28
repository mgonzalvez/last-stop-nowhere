/**
 * Zombie state (Milestone 2: Dead Stock). Positions are fractional tile
 * coords, same convention as the player. Pure TS — no Phaser.
 *
 * The FSM fields (path, timers, targets) land with C18+; keep this file
 * minimal until then.
 */
export type ZombieStateName = 'IDLE' | 'WANDER' | 'INVESTIGATE' | 'CHASE' | 'ATTACK'

export interface ZombieState {
  id: number
  x: number
  y: number
  /** Screen px/s — always slower than the player (150). */
  speed: number
  state: ZombieStateName
  /** Per-zombie determinism seed. */
  seed: number
}

/** Zombie walk speed (screen px/s). Player: 150 walk / 225 sprint. */
export const ZOMBIE_SPEED = 55

export function createZombie(
  id: number,
  x: number,
  y: number,
  seed: number,
): ZombieState {
  return { id, x, y, speed: ZOMBIE_SPEED, state: 'IDLE', seed }
}
