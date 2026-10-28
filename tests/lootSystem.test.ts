import { describe, it, expect } from 'vitest'
import { mulberry32 } from '../src/systems/Rng'
import {
  weightedPick,
  rollLoot,
  rollContainerLoot,
  openContainerLoot,
  LOOT_MIN_ITEMS,
  LOOT_MAX_ITEMS,
} from '../src/systems/LootSystem'
import { LOOT_TABLES } from '../src/data/lootTables'
import { LOOT_CONTAINERS } from '../src/data/lootContainerSpawns'
import { createLootContainers } from '../src/world/LootContainer'
import { createInventory, add, countItem, slotCount } from '../src/world/Inventory'
import { getItem } from '../src/data/items'

describe('rollLoot / weightedPick', () => {
  it('is deterministic for a fixed seed', () => {
    const a = rollLoot(LOOT_TABLES.kitchen, 5, mulberry32(42))
    const b = rollLoot(LOOT_TABLES.kitchen, 5, mulberry32(42))
    expect(a).toEqual(b)
    const c = rollLoot(LOOT_TABLES.kitchen, 5, mulberry32(43))
    expect(c).not.toEqual(a) // different seed, different haul
  })

  it('yields the requested number of items', () => {
    const drops = rollLoot(LOOT_TABLES.store, 4, mulberry32(7))
    const total = drops.reduce((n, d) => n + d.qty, 0)
    expect(total).toBe(4)
  })

  it('follows the weights over many picks (kitchen: soup 30%)', () => {
    const rng = mulberry32(1234)
    const N = 20000
    let soup = 0
    for (let i = 0; i < N; i++) {
      if (weightedPick(LOOT_TABLES.kitchen, rng) === 'canned_soup') soup++
    }
    const share = soup / N
    expect(share).toBeGreaterThan(0.27)
    expect(share).toBeLessThan(0.33)
  })

  it('tables differ by location (no cross-contamination)', () => {
    const picks = (loc: keyof typeof LOOT_TABLES) => {
      const rng = mulberry32(99)
      const seen = new Set<string>()
      for (let i = 0; i < 400; i++) seen.add(weightedPick(LOOT_TABLES[loc], rng))
      return seen
    }
    const kitchen = picks('kitchen')
    const yard = picks('yard')
    const store = picks('store')
    expect(kitchen.has('crowbar')).toBe(false) // kitchen never yields crowbar
    expect(kitchen.has('nails')).toBe(false)
    expect(yard.has('bandage')).toBe(false) // yard never yields medical
    expect(yard.has('painkiller')).toBe(false)
    expect(store.has('crowbar')).toBe(true) // store does
  })

  it('only yields items that exist in the catalog', () => {
    const rng = mulberry32(5)
    for (const loc of ['kitchen', 'store', 'yard'] as const) {
      for (const d of rollLoot(LOOT_TABLES[loc], 50, rng)) {
        expect(getItem(d.itemId)).toBeDefined()
      }
    }
  })
})

describe('rollContainerLoot', () => {
  it('yields 3-5 items, deterministic per container', () => {
    const a = rollContainerLoot('kitchen', 0)
    const b = rollContainerLoot('kitchen', 0)
    expect(a).toEqual(b)
    const total = a.reduce((n, d) => n + d.qty, 0)
    expect(total).toBeGreaterThanOrEqual(LOOT_MIN_ITEMS)
    expect(total).toBeLessThanOrEqual(LOOT_MAX_ITEMS)
  })

  it('differs across containers (seeded by index)', () => {
    const distinct = new Set(
      LOOT_CONTAINERS.map((c, i) =>
        JSON.stringify(rollContainerLoot(c.location, i)),
      ),
    )
    expect(distinct.size).toBeGreaterThan(1)
  })
})

describe('openContainerLoot', () => {
  it('adds loot to the inventory and marks the container looted', () => {
    const container = createLootContainers()[0]
    const inv = createInventory()
    const before = slotCount(inv)
    const { drops } = openContainerLoot(container, inv)
    expect(container.looted).toBe(true)
    expect(drops.length).toBeGreaterThanOrEqual(1)
    expect(slotCount(inv)).toBeGreaterThan(before)
  })

  it('a looted container never re-rolls', () => {
    const container = createLootContainers()[3]
    const inv = createInventory()
    openContainerLoot(container, inv)
    const again = openContainerLoot(container, inv)
    expect(again.drops).toEqual([])
    expect(again.lost).toBe(0)
  })

  it('overflow is lost when the inventory is full (no crash, no dup)', () => {
    const container = createLootContainers()[0]
    const inv = createInventory()
    add(inv, 'water', 160) // every slot full
    const waterBefore = countItem(inv, 'water')
    const { drops, lost } = openContainerLoot(container, inv)
    const total = drops.reduce((n, d) => n + d.qty, 0)
    expect(lost).toBe(total)
    expect(countItem(inv, 'water')).toBe(waterBefore) // nothing changed
    expect(slotCount(inv)).toBe(16)
  })
})
