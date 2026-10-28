import { describe, it, expect } from 'vitest'
import { heldWeapon, swingDamage, UNARMED_DAMAGE, GROOVY_DAMAGE_MULT } from '../src/systems/CombatSystem'
import { createInventory, add } from '../src/world/Inventory'

describe('heldWeapon', () => {
  it('is null for an empty inventory', () => {
    expect(heldWeapon(createInventory())).toBeNull()
  })

  it('finds the kitchen knife in the starting inventory (slot order)', () => {
    const inv = createInventory([
      ['kitchen_knife', 1],
      ['canned_soup', 1],
    ])
    const w = heldWeapon(inv)
    expect(w?.itemId).toBe('kitchen_knife')
    expect(w?.slot).toBe(0)
    expect(w?.damage).toBe(9)
  })

  it('skips non-weapons (flashlight, food) and finds the later weapon', () => {
    const inv = createInventory([
      ['flashlight', 1],
      ['water', 3],
      ['baseball_bat', 1],
    ])
    const w = heldWeapon(inv)
    expect(w?.itemId).toBe('baseball_bat')
    expect(w?.slot).toBe(2)
  })

  it('prefers the earlier slot when several weapons are held', () => {
    const inv = createInventory([
      ['kitchen_knife', 1],
      ['hammer', 1],
      ['crowbar', 1],
    ])
    expect(heldWeapon(inv)?.itemId).toBe('kitchen_knife')
  })

  it('re-resolves to the next weapon in slot order after one is gone', () => {
    const inv = createInventory([
      ['kitchen_knife', 1],
      ['crowbar', 1],
    ])
    expect(heldWeapon(inv)?.itemId).toBe('kitchen_knife')
    inv[0] = null // knife breaks
    expect(heldWeapon(inv)?.itemId).toBe('crowbar')
    expect(heldWeapon(inv)?.slot).toBe(1)
  })
})

describe('swingDamage', () => {
  it('bare hands deal UNARMED_DAMAGE with no item', () => {
    const s = swingDamage(createInventory())
    expect(s).toEqual({ damage: UNARMED_DAMAGE, itemId: null, slot: null })
  })

  it('matches each weapon base damage', () => {
    const cases: Array<[string, number]> = [
      ['kitchen_knife', 9],
      ['baseball_bat', 14],
      ['crowbar', 17],
      ['hammer', 20],
    ]
    for (const [id, dmg] of cases) {
      const s = swingDamage(createInventory([[id, 1]]))
      expect(s.damage).toBe(dmg)
      expect(s.itemId).toBe(id)
      expect(s.slot).toBe(0)
    }
  })

  it('groovy mode doubles weapon damage (x' + GROOVY_DAMAGE_MULT + ')', () => {
    const cases: Array<[string, number]> = [
      ['kitchen_knife', 18],
      ['baseball_bat', 28],
      ['crowbar', 34],
      ['hammer', 40],
    ]
    for (const [id, dmg] of cases) {
      const s = swingDamage(createInventory([[id, 1]]), true)
      expect(s.damage).toBe(dmg)
    }
  })

  it('groovy mode never changes bare hands', () => {
    expect(swingDamage(createInventory(), true).damage).toBe(UNARMED_DAMAGE)
  })
})

describe('weapon durability slots (Inventory, M4)', () => {
  it('initializes weapon durability from the item def on add', () => {
    const inv = createInventory([['hammer', 1]])
    expect(inv[0]?.durability).toBe(18)
    expect(inv[0]?.qty).toBe(1)
  })

  it('leaves non-weapons without durability', () => {
    const inv = createInventory([
      ['flashlight', 1],
      ['canned_soup', 1],
    ])
    expect(inv[0]?.durability).toBeUndefined()
    expect(inv[1]?.durability).toBeUndefined()
  })

  it('stacking behavior is unchanged for stackable items', () => {
    const inv = createInventory()
    const dropped = add(inv, 'canned_soup', 10)
    expect(dropped).toBe(0)
    expect(inv[0]).toEqual({ itemId: 'canned_soup', qty: 10 })
    expect(inv[0]?.durability).toBeUndefined()
  })
})
