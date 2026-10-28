import { describe, it, expect } from 'vitest'
import {
  heldWeapon,
  swingDamage,
  UNARMED_DAMAGE,
  GROOVY_DAMAGE_MULT,
  zombieHealth,
  pickAttackTarget,
  applyHit,
  applySwingCost,
  HIT_STAGGER_S,
  HIT_KNOCKBACK_TILES,
  ATTACK_AIM_RADIUS,
  ATTACK_REACH,
  ZOMBIE_HEALTH_MIN,
} from '../src/systems/CombatSystem'
import { createZombie, type ZombieState } from '../src/world/Zombie'
import { createPlayer } from '../src/world/Player'
import { createInventory, add } from '../src/world/Inventory'
import { ZOMBIE_SPAWNS } from '../src/data/zombieSpawns'

/** A zombie at a fixed tile (deterministic seed). */
function zombieAt(x: number, y: number, id = 0): ZombieState {
  return createZombie(id, x, y, 42 + id)
}

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

describe('zombieHealth (C35)', () => {
  it('is deterministic per spawn id', () => {
    for (let id = 0; id < 7; id++) {
      expect(zombieHealth(id)).toBe(zombieHealth(id))
    }
  })

  it('stays within 30-60 for every fixed spawn', () => {
    for (let id = 0; id < ZOMBIE_SPAWNS.length; id++) {
      const h = zombieHealth(id)
      expect(h).toBeGreaterThanOrEqual(ZOMBIE_HEALTH_MIN)
      expect(h).toBeLessThanOrEqual(60)
    }
  })

  it('is seeded into createZombie with zero stagger', () => {
    const z = createZombie(3, 10, 12, 999)
    expect(z.health).toBe(zombieHealth(3))
    expect(z.staggerS).toBe(0)
  })
})

describe('pickAttackTarget (C35)', () => {
  const player = createPlayer(10, 10)

  it('is null with no zombies', () => {
    expect(pickAttackTarget(player, [], 10, 10)).toBeNull()
  })

  it('rejects a zombie beyond the 1.5-tile reach even if clicked', () => {
    const z = zombieAt(10, 10 + ATTACK_REACH + 0.5) // 2.0 tiles away
    expect(pickAttackTarget(player, [z], z.x, z.y)).toBeNull()
  })

  it('rejects a zombie in reach but far from the click', () => {
    const z = zombieAt(10 + ATTACK_REACH - 0.2, 10) // in reach, 1.3 from click
    expect(pickAttackTarget(player, [z], 10, 10)).toBeNull()
  })

  it('hits a zombie inside both radii', () => {
    const z = zombieAt(11, 10.5)
    expect(pickAttackTarget(player, [z], 11, 10.5)).toBe(z)
  })

  it('gives the swing to the zombie closest to the click', () => {
    const farFromClick = zombieAt(11, 10, 1) // 1.0 from click
    const nearClick = zombieAt(10.6, 10, 2) // 0.6 from click, same reach
    const t = pickAttackTarget(player, [farFromClick, nearClick], 10, 10)
    expect(t?.id).toBe(2)
  })
})

describe('applyHit (C35)', () => {
  it('applies damage and a 0.4 s stagger', () => {
    const z = zombieAt(11, 10)
    const r = applyHit(z, 9, 10, 10)
    expect(z.health).toBe(zombieHealth(0) - 9)
    expect(z.staggerS).toBe(HIT_STAGGER_S)
    expect(r.dead).toBe(false)
    expect(r.health).toBe(z.health)
  })

  it('knocks back 0.5 tiles away from the attacker', () => {
    const z = zombieAt(11, 10)
    const r = applyHit(z, 9, 10, 10, () => true)
    expect(z.x).toBeCloseTo(11 + HIT_KNOCKBACK_TILES)
    expect(z.y).toBeCloseTo(10)
    expect(r.knocked).toBe(true)
  })

  it('skips knockback when the target tile is impassable', () => {
    const z = zombieAt(11, 10)
    // knockback lands on tile (12, 10) — block exactly that
    const r = applyHit(z, 9, 10, 10, (tx, ty) => !(tx === 12 && ty === 10))
    expect(r.knocked).toBe(false)
    expect(z.x).toBe(11)
    expect(z.y).toBe(10)
    expect(z.staggerS).toBe(HIT_STAGGER_S) // stagger still applies
  })

  it('kills at health <= 0', () => {
    const z = zombieAt(11, 10)
    const r = applyHit(z, 999, 10, 10)
    expect(r.dead).toBe(true)
    expect(r.health).toBeLessThanOrEqual(0)
  })

  it('handles an attacker standing on the zombie (no direction)', () => {
    const z = zombieAt(11, 10)
    const r = applyHit(z, 5, 11, 10)
    expect(r.knocked).toBe(false)
    expect(z.x).toBe(11)
    expect(z.staggerS).toBe(HIT_STAGGER_S)
  })
})

describe('applySwingCost (C37)', () => {
  it('decrements durability per swing without breaking', () => {
    const inv = createInventory([['kitchen_knife', 1]])
    const r = applySwingCost(inv, 0)
    expect(r.broken).toBe(false)
    expect(r.itemId).toBeNull()
    expect(inv[0]?.durability).toBe(39)
  })

  it('breaks the weapon at 0: removes the slot and reports its id', () => {
    const inv = createInventory([['kitchen_knife', 1]])
    inv[0]!.durability = 1
    const r = applySwingCost(inv, 0)
    expect(r.broken).toBe(true)
    expect(r.itemId).toBe('kitchen_knife')
    expect(inv[0]).toBeNull()
  })

  it('non-weapon slots (no durability) are never broken', () => {
    const inv = createInventory([['flashlight', 1]])
    const r = applySwingCost(inv, 0)
    expect(r.broken).toBe(false)
    expect(inv[0]).not.toBeNull()
  })

  it('empty slots are a no-op', () => {
    const inv = createInventory()
    const r = applySwingCost(inv, 3)
    expect(r.broken).toBe(false)
    expect(inv[3]).toBeNull()
  })

  it('held weapon re-resolves to the next weapon after a break', () => {
    const inv = createInventory([
      ['kitchen_knife', 1],
      ['crowbar', 1],
    ])
    inv[0]!.durability = 1
    applySwingCost(inv, 0)
    const w = heldWeapon(inv)
    expect(w?.itemId).toBe('crowbar')
    expect(w?.slot).toBe(1)
    expect(swingDamage(inv).damage).toBe(17) // crowbar base damage
  })

  it('a groovy swing still costs exactly one durability', () => {
    const inv = createInventory([['hammer', 1]])
    applySwingCost(inv, 0)
    expect(inv[0]?.durability).toBe(17) // 18 - 1, damage irrelevant to cost
  })
})
