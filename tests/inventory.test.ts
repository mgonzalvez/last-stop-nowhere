import { describe, it, expect } from 'vitest'
import {
  createInventory,
  add,
  useAt,
  removeAt,
  slotCount,
  countItem,
  INVENTORY_SIZE,
} from '../src/world/Inventory'
import { STARTING_ITEMS, ITEMS, getItem } from '../src/data/items'

describe('items catalog', () => {
  it('has a def for every catalog id, with the planned maxStacks', () => {
    expect(ITEMS.length).toBe(14)
    for (const item of ITEMS) {
      expect(getItem(item.id)).toBe(item)
      expect(['food', 'medical', 'tool', 'resource']).toContain(item.category)
    }
    expect(getItem('canned_soup')!.maxStack).toBe(10)
    expect(getItem('bandage')!.maxStack).toBe(5)
    expect(getItem('kitchen_knife')!.maxStack).toBe(1)
    expect(getItem('nails')!.maxStack).toBe(10)
  })

  it('starting items all exist', () => {
    for (const [id] of STARTING_ITEMS) expect(getItem(id)).toBeDefined()
  })
})

describe('createInventory', () => {
  it('starts empty with 16 slots', () => {
    const inv = createInventory()
    expect(inv).toHaveLength(INVENTORY_SIZE)
    expect(slotCount(inv)).toBe(0)
  })

  it('places the starting items (5 distinct items, 1 each)', () => {
    const inv = createInventory(STARTING_ITEMS)
    expect(slotCount(inv)).toBe(5)
    expect(countItem(inv, 'kitchen_knife')).toBe(1)
    expect(countItem(inv, 'flashlight')).toBe(1)
    expect(countItem(inv, 'canned_soup')).toBe(1)
    expect(countItem(inv, 'bandage')).toBe(1)
    expect(countItem(inv, 'water')).toBe(1)
  })
})

describe('add', () => {
  it('fills an existing stack before opening a new slot', () => {
    const inv = createInventory()
    add(inv, 'water', 10) // one full food stack
    add(inv, 'water', 5) // must open a second slot
    expect(slotCount(inv)).toBe(2)
    expect(inv[0]).toEqual({ itemId: 'water', qty: 10 })
    expect(inv[1]).toEqual({ itemId: 'water', qty: 5 })
  })

  it('topps up a partial stack first', () => {
    const inv = createInventory()
    add(inv, 'water', 4)
    add(inv, 'bandage', 2)
    add(inv, 'water', 6) // fills slot 0 to 10, no new slot
    expect(slotCount(inv)).toBe(2)
    expect(inv[0]).toEqual({ itemId: 'water', qty: 10 })
  })

  it('never stacks past the per-item maxStack (tools cap at 1 per slot)', () => {
    const inv = createInventory()
    add(inv, 'crowbar', 3) // three separate slots, one each
    expect(countItem(inv, 'crowbar')).toBe(3)
    for (const s of inv) {
      if (s && s.itemId === 'crowbar') expect(s.qty).toBe(1)
    }
  })

  it('drops a maxStack-1 item when every slot is occupied', () => {
    const inv = createInventory()
    add(inv, 'water', 160) // all 16 slots occupied
    expect(add(inv, 'crowbar', 2)).toBe(2) // nowhere to put them
    expect(countItem(inv, 'crowbar')).toBe(0)
  })

  it('returns the dropped count when the inventory is full', () => {
    const inv = createInventory()
    // 16 food slots x 10 = 160 capacity
    expect(add(inv, 'water', 160)).toBe(0)
    expect(slotCount(inv)).toBe(16)
    expect(add(inv, 'water', 5)).toBe(5) // all dropped
    expect(countItem(inv, 'water')).toBe(160)
  })

  it('unknown item id drops everything and changes nothing', () => {
    const inv = createInventory()
    expect(add(inv, 'unobtainium', 3)).toBe(3)
    expect(slotCount(inv)).toBe(0)
  })
})

describe('useAt', () => {
  it('decrements the stack and returns the item id', () => {
    const inv = createInventory()
    add(inv, 'canned_soup', 3)
    expect(useAt(inv, 0)).toBe('canned_soup')
    expect(inv[0]).toEqual({ itemId: 'canned_soup', qty: 2 })
  })

  it('clears the slot at zero', () => {
    const inv = createInventory()
    add(inv, 'bandage', 1)
    expect(useAt(inv, 0)).toBe('bandage')
    expect(inv[0]).toBeNull()
    expect(slotCount(inv)).toBe(0)
  })

  it('empty slot is a no-op (null)', () => {
    const inv = createInventory()
    expect(useAt(inv, 3)).toBeNull()
  })
})

describe('removeAt', () => {
  it('removes partially and fully', () => {
    const inv = createInventory()
    add(inv, 'planks', 5)
    expect(removeAt(inv, 0, 2)).toBe(2)
    expect(inv[0]).toEqual({ itemId: 'planks', qty: 3 })
    expect(removeAt(inv, 0, 99)).toBe(3)
    expect(inv[0]).toBeNull()
  })

  it('empty slot removes nothing', () => {
    const inv = createInventory()
    expect(removeAt(inv, 0, 2)).toBe(0)
  })
})
