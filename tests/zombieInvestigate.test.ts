import { describe, it, expect } from 'vitest'
import { createZombie } from '../src/world/Zombie'
import { updateZombie, type ZombieContext } from '../src/systems/ZombieAI'
import { worldMap } from '../src/world/WorldMap'
import { ZOMBIE_SPAWNS, ZOMBIE_SEED } from '../src/data/zombieSpawns'

const passable = (x: number, y: number) => worldMap.isPassable(x, y)
const DT = 1 / 60

/**
 * Drive a zombie for `seconds` with a ctx that varies over time.
 * Returns sampled state/position.
 */
function drive(
  z: ReturnType<typeof createZombie>,
  seconds: number,
  ctxAt: (t: number) => ZombieContext,
  sampleEvery = 0.1,
): Array<{ t: number; x: number; y: number; state: string }> {
  const out: Array<{ t: number; x: number; y: number; state: string }> = []
  let t = 0
  let last = -1
  while (t < seconds) {
    updateZombie(z, passable, DT, ctxAt(t))
    t += DT
    if (t - last >= sampleEvery) {
      last = t
      out.push({ t, x: z.x, y: z.y, state: z.state })
    }
  }
  return out
}

const ctx = (px: number, py: number, noise: number, casual = false): ZombieContext => ({
  playerX: px,
  playerY: py,
  noiseRadius: casual ? 0 : noise,
  casual,
})

// Zombie at spawn 4 (36,20); player two tiles east at (38,20).
const SPAWN = ZOMBIE_SPAWNS[4]

describe('zombie AI: INVESTIGATE (C19)', () => {
  it('hearing a moving player flips IDLE/WANDER to INVESTIGATE', () => {
    const z = createZombie(4, ...SPAWN, ZOMBIE_SEED + 4)
    const samples = drive(z, 2, (t) => ctx(38, 20, t < 1 ? 5 : 0))
    const firstInvest = samples.findIndex((s) => s.state === 'INVESTIGATE')
    expect(firstInvest).toBeGreaterThanOrEqual(0)
    expect(samples[firstInvest].t).toBeLessThan(0.5)
  })

  it('walks to the last known position and dwells', () => {
    const z = createZombie(4, ...SPAWN, ZOMBIE_SEED + 4)
    const samples = drive(z, 8, (t) => ctx(38, 20, t < 1 ? 5 : 0))
    const reached = samples.some(
      (s) => Math.hypot(s.x - 38, s.y - 20) < 0.6,
    )
    expect(reached).toBe(true)
    // after the ~3s dwell the zombie gives up (IDLE or wandering again)
    const lastInvest = samples.map((s) => s.state).lastIndexOf('INVESTIGATE')
    expect(samples.slice(lastInvest + 1).length).toBeGreaterThan(0)
  })

  it('a still player makes no noise: no investigation', () => {
    const z = createZombie(4, ...SPAWN, ZOMBIE_SEED + 4)
    const samples = drive(z, 6, () => ctx(38, 20, 0))
    expect(samples.every((s) => s.state !== 'INVESTIGATE')).toBe(true)
  })

  it('a moving player beyond the noise radius is not heard', () => {
    const z = createZombie(4, ...SPAWN, ZOMBIE_SEED + 4)
    const samples = drive(z, 6, () => ctx(46, 20, 5)) // 10 tiles east
    expect(samples.every((s) => s.state !== 'INVESTIGATE')).toBe(true)
  })

  it('casual mode: the player is unheard even right next to a zombie', () => {
    const z = createZombie(4, ...SPAWN, ZOMBIE_SEED + 4)
    const samples = drive(z, 6, () => ctx(38, 20, 5, true))
    expect(samples.every((s) => s.state !== 'INVESTIGATE')).toBe(true)
  })

  it('refreshes the LKP when the player keeps moving', () => {
    const z = createZombie(4, ...SPAWN, ZOMBIE_SEED + 4)
    // player moves east continuously; zombie should track the new position
    const samples = drive(z, 6, (t) => ctx(38 + t * 2, 20, 5))
    expect(z.target).not.toBeNull()
    // the target must have moved with the player (east of the first LKP)
    expect(z.target![0]).toBeGreaterThan(38)
  })

  it('is deterministic under a fixed seed', () => {
    const run = () => {
      const z = createZombie(4, ...SPAWN, 777)
      return drive(z, 6, (t) => ctx(38, 20, t < 1 ? 5 : 0))
    }
    expect(run()).toEqual(run())
  })
})
