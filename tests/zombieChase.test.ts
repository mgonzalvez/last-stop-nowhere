import { describe, it, expect } from 'vitest'
import { createZombie } from '../src/world/Zombie'
import { updateZombie, type ZombieContext } from '../src/systems/ZombieAI'
import type { PassableFn } from '../src/systems/Pathfinding'
import { worldMap } from '../src/world/WorldMap'
import { ZOMBIE_SPAWNS, ZOMBIE_SEED } from '../src/data/zombieSpawns'

const DT = 1 / 60

/**
 * Synthetic grids so the scenarios are exact:
 * - wallGrid: 10x10 with a wall stub at (5,4)-(5,6). The player at (7,5)
 *   is NOT visible from (3,5) (straight shot hits the wall) but IS
 *   reachable (walk around via row 3 or 7) and within noise range.
 * - wideGrid: 20x20 fully open, for range tests.
 */
const wallGrid: PassableFn = (x, y) =>
  x >= 0 && x < 14 && y >= 0 && y < 14 && !(x === 5 && y >= 4 && y <= 6)
const wideGrid: PassableFn = (x, y) => x >= 0 && x < 20 && y >= 0 && y < 20

const ctx = (px: number, py: number, noise = 0, casual = false): ZombieContext => ({
  playerX: px,
  playerY: py,
  noiseRadius: casual ? 0 : noise,
  casual,
})

function drive(
  z: ReturnType<typeof createZombie>,
  seconds: number,
  passable: PassableFn,
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

/** A zombie that cannot wander during the test window. */
const pinned = (id: number, x: number, y: number, seed: number) => {
  const z = createZombie(id, x, y, seed)
  z.stateTimer = 100
  return z
}

describe('zombie AI: INVESTIGATE (C19)', () => {
  it('hearing an unseen moving player flips the zombie to INVESTIGATE', () => {
    const z = pinned(4, 3, 5, 1) // player (7,5): in noise range, behind the wall
    const samples = drive(z, 2, wallGrid, (t) => ctx(7, 5, t < 1 ? 5 : 0))
    const firstInvest = samples.findIndex((s) => s.state === 'INVESTIGATE')
    expect(firstInvest).toBeGreaterThanOrEqual(0)
    expect(samples[firstInvest].t).toBeLessThan(0.5)
  })

  it('walks to the last known position and dwells', () => {
    const z = pinned(4, 3, 5, 1)
    // player makes noise, then slips away out of sight (12,12: 8.6 tiles)
    const samples = drive(z, 16, wallGrid, (t) =>
      t < 1 ? ctx(7, 5, 5) : ctx(12, 12, 0),
    )
    const reached = samples.some((s) => Math.hypot(s.x - 7, s.y - 5) < 0.6)
    expect(reached).toBe(true)
    // after the ~3s dwell the zombie gives up
    const states = samples.map((s) => s.state)
    const lastInvest = states.lastIndexOf('INVESTIGATE')
    expect(lastInvest).toBeLessThan(states.length - 1)
    expect(states.slice(lastInvest + 1).some((s) => s === 'IDLE')).toBe(true)
  })

  it('a still player makes no noise: no investigation', () => {
    const z = pinned(4, 3, 5, 1)
    const samples = drive(z, 4, wallGrid, () => ctx(7, 5, 0))
    expect(samples.every((s) => s.state !== 'INVESTIGATE')).toBe(true)
  })

  it('a moving player beyond the noise radius is not heard', () => {
    const z = pinned(4, 3, 5, 1)
    // (9,5) is 6 tiles away: outside the moving radius (5)
    const samples = drive(z, 4, wallGrid, () => ctx(9, 5, 5))
    expect(samples.every((s) => s.state !== 'INVESTIGATE')).toBe(true)
  })

  it('casual mode: the player is unheard even right next to a zombie', () => {
    const z = pinned(4, 3, 5, 1)
    const samples = drive(z, 4, wallGrid, () => ctx(4, 5, 5, true))
    expect(samples.every((s) => s.state !== 'INVESTIGATE')).toBe(true)
    expect(samples.every((s) => s.state !== 'CHASE')).toBe(true)
  })

  it('refreshes the LKP when the player keeps moving', () => {
    const z = pinned(4, 3, 5, 1)
    // player shuffles south along the far side of the wall
    const samples = drive(z, 8, wallGrid, (t) => ctx(7, Math.min(8, 5 + t), 5))
    void samples
    expect(z.target).not.toBeNull()
    expect(z.target![1]).toBeGreaterThan(5)
  })

  it('is deterministic under a fixed seed', () => {
    const run = () => {
      const z = createZombie(4, 3, 5, 777)
      return drive(z, 6, wallGrid, (t) => ctx(7, 5, t < 1 ? 5 : 0))
    }
    expect(run()).toEqual(run())
  })
})

describe('zombie AI on the real map (integration)', () => {
  const real: PassableFn = (x, y) => worldMap.isPassable(x, y)

  it('a wandering zombie chases a player spotted on the street', () => {
    // zombie 4 spawns at (36,20); player at (33,21): ~3.2 tiles, clear sight
    const z = createZombie(4, ...ZOMBIE_SPAWNS[4], ZOMBIE_SEED + 4)
    const samples = drive(z, 12, real, () => ctx(33, 21))
    const states = samples.map((s) => s.state)
    expect(states.includes('CHASE')).toBe(true)
    const reached = samples.some((s) => Math.hypot(s.x - 33, s.y - 21) < 0.6)
    expect(reached).toBe(true)
  })

  it('investigates noise from inside a house, entering through the door', () => {
    // zombie 1 spawns at (12,18); player moves in house 1 at (8,17).
    // Sight is blocked by the house; the only path is around + through
    // the door at (9,19).
    const z = createZombie(1, ...ZOMBIE_SPAWNS[1], ZOMBIE_SEED + 1)
    const samples = drive(z, 25, real, (t) => ctx(8, 17, t < 2 ? 5 : 0))
    const states = samples.map((s) => s.state)
    expect(states.includes('INVESTIGATE')).toBe(true)
    const reached = samples.some((s) => Math.hypot(s.x - 8, s.y - 17) < 0.6)
    expect(reached).toBe(true)
    expect(states.lastIndexOf('INVESTIGATE')).toBeLessThan(states.length - 1)
  })
})

describe('zombie AI: CHASE (C20)', () => {
  it('a visible in-range player flips the zombie to CHASE', () => {
    const z = pinned(4, 2, 10, 2)
    const samples = drive(z, 1, wideGrid, () => ctx(5, 10)) // 3 tiles, open
    const firstChase = samples.findIndex((s) => s.state === 'CHASE')
    expect(firstChase).toBeGreaterThanOrEqual(0)
    expect(samples[firstChase].t).toBeLessThan(0.5)
  })

  it('a chase converges on a standing player', () => {
    const z = pinned(4, 2, 10, 2)
    const samples = drive(z, 15, wideGrid, () => ctx(5, 10))
    const reached = samples.some((s) => Math.hypot(s.x - 5, s.y - 10) < 0.6)
    expect(reached).toBe(true)
  })

  it('no line of sight: a hidden player is never chased', () => {
    const z = pinned(0, 3, 5, 99) // wall stub blocks the straight shot
    const samples = drive(z, 6, wallGrid, () => ctx(7, 5, 0))
    expect(samples.every((s) => s.state !== 'CHASE')).toBe(true)
  })

  it('a visible player beyond 6 tiles is not spotted', () => {
    const z = pinned(4, 1, 10, 3) // player 18 tiles east; pinned so no wander-in
    const samples = drive(z, 6, wideGrid, () => ctx(19, 10, 0))
    expect(samples.every((s) => s.state !== 'CHASE')).toBe(true)
  })

  it('losing sight for 5s collapses a chase into an investigation', () => {
    const z = pinned(4, 2, 10, 2)
    const samples = drive(
      z,
      9,
      wideGrid,
      (t) => (t < 1.5 ? ctx(5, 10) : ctx(19, 10, 0)), // player vanishes
    )
    const states = samples.map((s) => s.state)
    const chaseAt = states.indexOf('CHASE')
    const investigateAt = states.lastIndexOf('INVESTIGATE')
    expect(chaseAt).toBeGreaterThanOrEqual(0)
    expect(investigateAt).toBeGreaterThan(chaseAt)
    // it checks the last place the player was seen
    expect(z.target).toEqual([5, 10])
  })

  it('casual mode: even a visible player is not chased', () => {
    const z = pinned(4, 2, 10, 2)
    const samples = drive(z, 6, wideGrid, () => ctx(5, 10, 0, true))
    expect(samples.every((s) => s.state !== 'CHASE')).toBe(true)
  })

  it('is deterministic under a fixed seed', () => {
    const run = () => {
      const z = createZombie(4, 2, 10, 555)
      return drive(z, 6, wideGrid, (t) => (t < 3 ? ctx(5, 10) : ctx(19, 10, 0)))
    }
    expect(run()).toEqual(run())
  })
})
