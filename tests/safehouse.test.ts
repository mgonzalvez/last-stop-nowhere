import { describe, it, expect } from 'vitest'
import { SAFEHOUSE_SLOTS, IMPROVEMENTS } from '../src/data/safehouseSpawns'
import {
  createSafehouse,
  claim,
  safehouseSlots,
  safehouseSlotAt,
  slotTile,
  barricadedDoor,
} from '../src/world/Safehouse'
import { worldMap } from '../src/world/WorldMap'
import { TileType } from '../src/world/TileTypes'
import { LOOT_CONTAINERS } from '../src/data/lootContainerSpawns'

describe('safehouse slot data (C40)', () => {
  const allSlots = (s: (typeof SAFEHOUSE_SLOTS)[number]) => [
    s.door,
    s.workbench,
    s.storage,
    s.bed,
  ]

  it('covers all four claimable buildings', () => {
    expect(SAFEHOUSE_SLOTS).toHaveLength(4)
    const doors = SAFEHOUSE_SLOTS.map((s) => s.door.join(','))
    expect(new Set(doors).size).toBe(4) // no duplicate doors
  })

  for (const [i, s] of SAFEHOUSE_SLOTS.entries()) {
    it(`building ${i}: door is a DOOR tile, slots are passable interior floor`, () => {
      expect(worldMap.getTile(s.door[0], s.door[1])).toBe(TileType.DOOR)
      for (const [x, y] of [s.workbench, s.storage, s.bed]) {
        expect(worldMap.isPassable(x, y), `${x},${y} passable`).toBe(true)
        expect(worldMap.getTile(x, y), `${x},${y} floor`).toBe(TileType.WOOD_FLOOR)
      }
    })

    it(`building ${i}: slots are distinct and clear of loot containers`, () => {
      const keys = allSlots(s).map(([x, y]) => x + ',' + y)
      expect(new Set(keys).size).toBe(keys.length)
      for (const c of LOOT_CONTAINERS) {
        expect(keys.includes(c.x + ',' + c.y), 'container overlap').toBe(false)
      }
    })
  }

  it('slotTile resolves each improvement (barricade at the door)', () => {
    const s = SAFEHOUSE_SLOTS[0]
    expect(slotTile(s, 'workbench')).toEqual(s.workbench)
    expect(slotTile(s, 'storage')).toEqual(s.storage)
    expect(slotTile(s, 'sleeping')).toEqual(s.bed)
    expect(slotTile(s, 'barricade')).toEqual(s.door)
  })

  it('every recipe costs only resource items (planks/nails/duct_tape)', () => {
    for (const def of Object.values(IMPROVEMENTS)) {
      const keys = Object.keys(def.cost)
      expect(keys.length, def.id).toBeGreaterThan(0)
      for (const id of keys) {
        expect(['planks', 'nails', 'duct_tape'], def.id).toContain(id)
      }
    }
  })

  it('the barricade is the only workbench-gated improvement', () => {
    const gated = Object.values(IMPROVEMENTS)
      .filter((d) => d.requiresWorkbench)
      .map((d) => d.id)
    expect(gated).toEqual(['barricade'])
  })
})

describe('claim (C40)', () => {
  it('claims the first building and refuses the second', () => {
    const sh = createSafehouse()
    expect(claim(sh, [9, 19])).toBe(true)
    expect(sh.claimedDoor).toBe('9,19')
    expect(claim(sh, [19, 19])).toBe(false) // one per run, no undo
    expect(sh.claimedDoor).toBe('9,19') // unchanged
  })

  it('rejects doors that are not one of the four buildings', () => {
    const sh = createSafehouse()
    expect(claim(sh, [1, 1])).toBe(false)
    expect(claim(sh, [9, 20])).toBe(false) // near a door, but not one
    expect(sh.claimedDoor).toBeNull()
  })

  it('safehouseSlots resolves each of the four claimed doors', () => {
    for (const s of SAFEHOUSE_SLOTS) {
      const sh = createSafehouse()
      expect(safehouseSlots(sh)).toBeNull() // unclaimed
      claim(sh, s.door)
      expect(safehouseSlots(sh)).toEqual(s)
      expect(safehouseSlotAt(s.door)).toBe(s)
    }
  })
})

describe('barricadedDoor (C40)', () => {
  it('is null until the barricade is built', () => {
    const sh = createSafehouse()
    claim(sh, [9, 19])
    expect(barricadedDoor(sh)).toBeNull()
    sh.built.add('barricade')
    expect(barricadedDoor(sh)).toEqual([9, 19])
  })

  it('stays null when unclaimed', () => {
    const sh = createSafehouse()
    sh.built.add('barricade')
    expect(barricadedDoor(sh)).toBeNull()
  })
})
