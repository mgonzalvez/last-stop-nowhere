/**
 * Zombie state (Milestone 2: Dead Stock). Positions are fractional tile
 * coords, same convention as the player. Pure TS — no Phaser.
 *
 * AI mutates the zombie in place via ZombieAI.updateZombie (per-entity
 * ECS style); the seeded rng stream makes behavior reproducible.
 */
import { mulberry32 } from '../systems/Rng'

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
  /** Seeded PRNG stream for all AI decisions. */
  rng: () => number
  /** Remaining waypoints (tile coords, goal included). */
  path: Array<readonly [number, number]>
  /** Current wander/investigate target, if any. */
  target: [number, number] | null
  /** Last tile the player was seen on (chase fallback). */
  lastKnown: [number, number] | null
  /** Seconds since the player was last visible (chase timeout). */
  lostSightTime: number
  /** Seconds until the next state change (idle window, etc.). */
  stateTimer: number
  /** Seconds accumulated toward the next 8 Hz decision tick. */
  decisionAccum: number
}

/** Zombie walk speed (screen px/s). Player: 150 walk / 225 sprint. */
export const ZOMBIE_SPEED = 55

export function createZombie(
  id: number,
  x: number,
  y: number,
  seed: number,
): ZombieState {
  const rng = mulberry32(seed)
  return {
    id,
    x,
    y,
    speed: ZOMBIE_SPEED,
    state: 'IDLE',
    seed,
    rng,
    path: [],
    target: null,
    lastKnown: null,
    lostSightTime: 0,
    // stagger the first move so zombies don't shuffle in unison
    stateTimer: 0.5 + rng() * 2,
    decisionAccum: 0,
  }
}
