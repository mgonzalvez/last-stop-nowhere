import { describe, it, expect } from 'vitest'
import { worldMap } from '../src/world/WorldMap'
import { TileType } from '../src/world/TileTypes'
import { computeBuildingIndex, buildingAt } from '../src/world/Buildings'
import { LOOT_CONTAINERS } from '../src/data/lootContainerSpawns'
import { createLootContainers } from '../src/world/LootContainer'

const roofIndex = computeBuildingIndex(worldMap)

describe('loot container spawns', () => {
  it('has 6 containers: 3 kitchen, 2 store, 1 yard', () => {
    expect(LOOT_CONTAINERS).toHaveLength(6)
    const counts: Record<string, number> = {}
    for (const c of LOOT_CONTAINERS) {
      counts[c.location] = (counts[c.location] ?? 0) + 1
    }
    expect(counts).toEqual({ kitchen: 3, store: 2, yard: 1 })
  })

  it('every container tile is passable', () => {
    for (const c of LOOT_CONTAINERS) {
      expect(worldMap.isPassable(c.x, c.y), `tile ${c.x},${c.y}`).toBe(true)
    }
  })

  it('kitchen/store containers sit on wood floors inside a building', () => {
    for (const c of LOOT_CONTAINERS) {
      if (c.location === 'yard') continue
      expect(worldMap.grid[c.y][c.x], `tile ${c.x},${c.y}`).toBe(TileType.WOOD_FLOOR)
      expect(buildingAt(roofIndex, c.x, c.y)).toBeGreaterThanOrEqual(0)
    }
  })

  it('yard container is outdoors (not inside a building)', () => {
    const yard = LOOT_CONTAINERS.find((c) => c.location === 'yard')!
    expect(yard).toBeDefined()
    expect(buildingAt(roofIndex, yard.x, yard.y)).toBe(-1)
  })
})

describe('createLootContainers', () => {
  it('creates one state per spawn, all unlooted, in order', () => {
    const containers = createLootContainers()
    expect(containers).toHaveLength(LOOT_CONTAINERS.length)
    for (let i = 0; i < containers.length; i++) {
      expect(containers[i].id).toBe(i)
      expect(containers[i].x).toBe(LOOT_CONTAINERS[i].x)
      expect(containers[i].y).toBe(LOOT_CONTAINERS[i].y)
      expect(containers[i].location).toBe(LOOT_CONTAINERS[i].location)
      expect(containers[i].looted).toBe(false)
    }
  })
})
