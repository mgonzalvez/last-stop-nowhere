/**
 * Player noise model (Milestone 2). Radius in tiles; zombies within it
 * that are not already chasing will investigate the noise.
 */
export const NOISE_STILL = 0
export const NOISE_MOVING = 5
export const NOISE_SPRINT = 9
/** M4: every weapon swing makes this much noise (fighting draws them). */
export const NOISE_SWING = 6

export function noiseRadius(moving: boolean, sprinting = false): number {
  if (!moving) return NOISE_STILL
  return sprinting ? NOISE_SPRINT : NOISE_MOVING
}
