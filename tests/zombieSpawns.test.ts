import { describe, it, expect } from 'vitest'
import { worldMap, MAP_SIZE } from '../src/world/WorldMap'
import { ZOMBIE_SPAWNS, ZOMBIE_SEED } from '../src/data/zombieSpawns'
import { createZombie } from '../src/world/Zombie'

describe('zombie spawns', () => {
  it('has 7 unique spawn tiles', () => {
    expect(ZOMBIE_SPAWNS).toHaveLength(7)
    const keys = new Set(ZOMBIE_SPAWNS.map(([x, y]) => x + ',' + y))
    expect(keys.size).toBe(7)
  })

  it('all spawn tiles are in bounds and passable', () => {
    for (const [x, y] of ZOMBIE_SPAWNS) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(MAP_SIZE.w)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThan(MAP_SIZE.h)
      expect(worldMap.isPassable(x, y)).toBe(true)
    }
  })

  it('creates idle zombies at the spawn points', () => {
    const z = createZombie(0, ...ZOMBIE_SPAWNS[0], ZOMBIE_SEED)
    expect(z.x).toBe(ZOMBIE_SPAWNS[0][0])
    expect(z.y).toBe(ZOMBIE_SPAWNS[0][1])
    expect(z.state).toBe('IDLE')
    expect(z.speed).toBe(55)
  })
})
