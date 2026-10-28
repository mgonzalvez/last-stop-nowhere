import { describe, it, expect } from 'vitest'
import { createZombie } from '../src/world/Zombie'
import { updateZombie, DECISION_HZ, type ZombieContext } from '../src/systems/ZombieAI'
import { worldMap, MAP_SIZE } from '../src/world/WorldMap'
import { ZOMBIE_SPAWNS, ZOMBIE_SEED } from '../src/data/zombieSpawns'
import { TileType } from '../src/world/TileTypes'

const passable = (x: number, y: number) => worldMap.isPassable(x, y)
const DT = 1 / 60

/** Neutral context for wander tests: casual mode ignores the player. */
const quiet: ZombieContext = {
  playerX: 0,
  playerY: 0,
  noiseRadius: 0,
  casual: true,
}

/** Simulate seconds of AI, returning the sampled position path. */
function simulate(
  z: ReturnType<typeof createZombie>,
  seconds: number,
  sampleEvery = 0.25,
  ctx: ZombieContext = quiet,
): Array<{ x: number; y: number; state: string }> {
  const out: Array<{ x: number; y: number; state: string }> = []
  let t = 0
  let last = 0
  while (t < seconds) {
    updateZombie(z, passable, DT, ctx)
    t += DT
    if (t - last >= sampleEvery) {
      last = t
      out.push({ x: z.x, y: z.y, state: z.state })
    }
  }
  return out
}

describe('zombie AI: IDLE/WANDER (C18)', () => {
  it('decisions run at 8 Hz', () => {
    expect(DECISION_HZ).toBe(8)
  })

  it('a fresh zombie holds still during its idle window', () => {
    const z = createZombie(0, ...ZOMBIE_SPAWNS[0], ZOMBIE_SEED)
    simulate(z, 0.5)
    expect(z.x).toBe(ZOMBIE_SPAWNS[0][0])
    expect(z.y).toBe(ZOMBIE_SPAWNS[0][1])
    expect(z.state).toBe('IDLE')
  })

  it('starts wandering within the idle window (<= 3s + walk)', () => {
    const z = createZombie(0, ...ZOMBIE_SPAWNS[0], ZOMBIE_SEED)
    const samples = simulate(z, 6)
    const moved = samples.some(
      (s) => Math.hypot(s.x - ZOMBIE_SPAWNS[0][0], s.y - ZOMBIE_SPAWNS[0][1]) > 0.5,
    )
    expect(moved).toBe(true)
    expect(samples.some((s) => s.state === 'WANDER')).toBe(true)
  })

  it('returns to IDLE after reaching a wander target', () => {
    const z = createZombie(1, ...ZOMBIE_SPAWNS[1], ZOMBIE_SEED + 1)
    const samples = simulate(z, 45)
    const states = samples.map((s) => s.state)
    const firstWander = states.indexOf('WANDER')
    const idleAfterWander = states.slice(firstWander + 1).includes('IDLE')
    expect(firstWander).toBeGreaterThanOrEqual(0)
    expect(idleAfterWander).toBe(true)
  })

  it('is deterministic under a fixed seed', () => {
    const a = createZombie(0, ...ZOMBIE_SPAWNS[0], 42)
    const b = createZombie(0, ...ZOMBIE_SPAWNS[0], 42)
    const ra = simulate(a, 12)
    const rb = simulate(b, 12)
    expect(ra).toEqual(rb)
  })

  it('stays in bounds and on passable ground for 60s', () => {
    const z = createZombie(2, ...ZOMBIE_SPAWNS[2], ZOMBIE_SEED + 2)
    const samples = simulate(z, 60)
    for (const s of samples) {
      expect(s.x).toBeGreaterThanOrEqual(0)
      expect(s.x).toBeLessThan(MAP_SIZE.w)
      expect(s.y).toBeGreaterThanOrEqual(0)
      expect(s.y).toBeLessThan(MAP_SIZE.h)
      const tx = Math.round(s.x)
      const ty = Math.round(s.y)
      expect(passable(tx, ty)).toBe(true)
    }
  })

  it('wanderers can drift into a house interior', () => {
    // zombie 1 spawns at (12,18), a few tiles from house 1's door (9,19)
    const z = createZombie(1, ...ZOMBIE_SPAWNS[1], ZOMBIE_SEED + 1)
    const samples = simulate(z, 150)
    const visitedWood = samples.some(
      (s) => worldMap.getTile(Math.round(s.x), Math.round(s.y)) === TileType.WOOD_FLOOR,
    )
    expect(visitedWood).toBe(true)
  })
})

describe('zombie AI: hit-stagger (C35)', () => {
  it('is frozen while staggering: no movement, no damage, even in melee', () => {
    const z = createZombie(0, ...ZOMBIE_SPAWNS[0], ZOMBIE_SEED)
    const x0 = z.x
    const y0 = z.y
    z.staggerS = 0.4
    const ctx: ZombieContext = {
      playerX: z.x + 0.5, // within melee range (0.9)
      playerY: z.y,
      noiseRadius: 0,
      casual: false,
    }
    let damage = 0
    const frames = Math.ceil(0.4 / DT) + 1
    for (let i = 0; i < frames; i++) damage += updateZombie(z, passable, DT, ctx)
    expect(damage).toBe(0)
    expect(z.staggerS).toBe(0)
    expect(z.x).toBe(x0)
    expect(z.y).toBe(y0)
  })

  it('resumes after the stagger ends and attacks from melee', () => {
    const z = createZombie(0, ...ZOMBIE_SPAWNS[0], ZOMBIE_SEED)
    z.staggerS = 0.4
    const ctx: ZombieContext = {
      playerX: z.x + 0.5,
      playerY: z.y,
      noiseRadius: 0,
      casual: false,
    }
    let damage = 0
    const frames = Math.ceil((0.4 + 2) / DT)
    for (let i = 0; i < frames; i++) damage += updateZombie(z, passable, DT, ctx)
    expect(z.state).toBe('ATTACK')
    expect(damage).toBeGreaterThan(0)
  })
})
