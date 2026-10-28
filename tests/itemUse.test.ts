import { describe, it, expect } from 'vitest'
import { createInventory, add, countItem } from '../src/world/Inventory'
import { createPlayer, MAX_HEALTH, MAX_HUNGER } from '../src/world/Player'
import { useHotbarSlot } from '../src/systems/ItemUse'

describe('useHotbarSlot', () => {
  it('eating soup restores hunger, consumes the stack, and fires first.eat', () => {
    const inv = createInventory()
    add(inv, 'canned_soup', 3)
    const p = createPlayer(0, 0)
    p.hunger = 60
    const r = useHotbarSlot(inv, p, 0)
    expect(r.consumed).toBe(true)
    expect(r.event).toBe('first.eat')
    expect(r.player.hunger).toBe(100) // 60 + 40
    expect(r.player.health).toBe(MAX_HEALTH)
    expect(countItem(inv, 'canned_soup')).toBe(2)
  })

  it('a bandage restores health, consumes, and fires first.heal', () => {
    const inv = createInventory()
    add(inv, 'bandage', 2)
    const p = createPlayer(0, 0)
    p.health = 50
    const r = useHotbarSlot(inv, p, 0)
    expect(r.consumed).toBe(true)
    expect(r.event).toBe('first.heal')
    expect(r.player.health).toBe(75)
    expect(countItem(inv, 'bandage')).toBe(1)
  })

  it('the last unit of a stack clears the slot', () => {
    const inv = createInventory()
    add(inv, 'water', 1)
    const p = createPlayer(0, 0)
    const r = useHotbarSlot(inv, p, 0)
    expect(r.consumed).toBe(true)
    expect(inv[0]).toBeNull()
    expect(countItem(inv, 'water')).toBe(0)
  })

  it('an empty slot is a no-op', () => {
    const inv = createInventory()
    const p = createPlayer(0, 0)
    const r = useHotbarSlot(inv, p, 5)
    expect(r.consumed).toBe(false)
    expect(r.event).toBeNull()
    expect(r.player).toBe(p) // same reference, untouched
  })

  it('carry-only items (tools) are not consumed', () => {
    const inv = createInventory()
    add(inv, 'kitchen_knife', 1)
    const p = createPlayer(0, 0)
    const r = useHotbarSlot(inv, p, 0)
    expect(r.consumed).toBe(false)
    expect(r.event).toBeNull()
    expect(countItem(inv, 'kitchen_knife')).toBe(1) // still there
    expect(r.player).toBe(p)
  })

  it('resources are carry-only too', () => {
    const inv = createInventory()
    add(inv, 'nails', 5)
    const p = createPlayer(0, 0)
    const r = useHotbarSlot(inv, p, 0)
    expect(r.consumed).toBe(false)
    expect(countItem(inv, 'nails')).toBe(5)
  })

  it('restores clamp at max (no over-heal)', () => {
    const inv = createInventory()
    add(inv, 'painkiller', 1)
    const p = createPlayer(0, 0) // full health
    const r = useHotbarSlot(inv, p, 0)
    expect(r.player.health).toBe(MAX_HEALTH)
    expect(countItem(inv, 'painkiller')).toBe(0) // still consumed
  })

  it('hunger clamps at max', () => {
    const inv = createInventory()
    add(inv, 'canned_soup', 1)
    const p = createPlayer(0, 0) // full hunger
    const r = useHotbarSlot(inv, p, 0)
    expect(r.player.hunger).toBe(MAX_HUNGER)
  })

  it('consumes exactly one per use even from a big stack', () => {
    const inv = createInventory()
    add(inv, 'canned_food', 10)
    const p = createPlayer(0, 0)
    useHotbarSlot(inv, p, 0)
    expect(countItem(inv, 'canned_food')).toBe(9)
  })
})
