import { describe, it, expect } from 'vitest'
import {
  createPlayer,
  MAX_HEALTH,
  MAX_HUNGER,
  MAX_STAMINA,
} from '../src/world/Player'
import {
  tickSurvival,
  applyItem,
  HUNGER_DECAY_PER_S,
  STARVATION_DAMAGE_PER_S,
  SPRINT_DRAIN_PER_S,
  STAMINA_REGEN_PER_S,
  SPRINT_REENABLE_AT,
} from '../src/systems/StatsSystem'

describe('createPlayer (M3 defaults)', () => {
  it('starts at full hunger and stamina, not exhausted', () => {
    const p = createPlayer(10, 10)
    expect(p.hunger).toBe(MAX_HUNGER)
    expect(p.stamina).toBe(MAX_STAMINA)
    expect(p.sprintExhausted).toBe(false)
  })
})

describe('tickSurvival — hunger', () => {
  it('decays hunger at the fixed rate', () => {
    const t = tickSurvival(createPlayer(0, 0), 10, false)
    expect(t.player.hunger).toBeCloseTo(MAX_HUNGER - HUNGER_DECAY_PER_S * 10)
    expect(t.starving).toBe(false)
  })

  it('does not damage health while the player has food', () => {
    const t = tickSurvival(createPlayer(0, 0), 100, false) // 100 → 75 hunger
    expect(t.player.hunger).toBeCloseTo(75)
    expect(t.player.health).toBe(MAX_HEALTH)
  })

  it('starves: hunger clamps at 0, then health drains at the fixed rate', () => {
    const p = createPlayer(0, 0)
    p.hunger = 2
    const t = tickSurvival(p, 10, false) // 2 - 2.5 → 0, starving this tick
    expect(t.player.hunger).toBe(0)
    expect(t.starving).toBe(true)
    expect(t.player.health).toBeCloseTo(
      MAX_HEALTH - STARVATION_DAMAGE_PER_S * 10,
    )
  })

  it('starvation health floors at 0', () => {
    const p = createPlayer(0, 0)
    p.hunger = 0
    p.health = 5
    const t = tickSurvival(p, 10, false)
    expect(t.player.health).toBe(0)
  })
})

describe('tickSurvival — stamina', () => {
  it('drains at the fixed rate while sprinting', () => {
    const t = tickSurvival(createPlayer(0, 0), 1, true)
    expect(t.player.stamina).toBeCloseTo(MAX_STAMINA - SPRINT_DRAIN_PER_S)
    expect(t.exhausted).toBe(false)
  })

  it('regens when not sprinting and clamps at max', () => {
    const p = createPlayer(0, 0)
    p.stamina = 90
    const t = tickSurvival(p, 5, false) // 90 + 100 → clamped
    expect(t.player.stamina).toBe(MAX_STAMINA)
    expect(t.exhausted).toBe(false)
  })

  it('sprinting to zero stamina sets the exhaustion latch', () => {
    const p = createPlayer(0, 0)
    p.stamina = 30 // exactly 1 s of sprinting left
    const t = tickSurvival(p, 1, true)
    expect(t.player.stamina).toBe(0)
    expect(t.exhausted).toBe(true)
    expect(t.player.sprintExhausted).toBe(true)
  })

  it('latch holds while regenerating below the re-enable threshold', () => {
    const p = createPlayer(0, 0)
    p.stamina = 0
    p.sprintExhausted = true
    const t = tickSurvival(p, 0.75, false) // 0 → 15 < 20
    expect(t.player.stamina).toBeCloseTo(STAMINA_REGEN_PER_S * 0.75)
    expect(t.exhausted).toBe(true)
    expect(t.player.sprintExhausted).toBe(true)
  })

  it('latch clears exactly at the re-enable threshold', () => {
    const p = createPlayer(0, 0)
    p.stamina = 0
    p.sprintExhausted = true
    const t = tickSurvival(p, SPRINT_REENABLE_AT / STAMINA_REGEN_PER_S, false)
    expect(t.player.stamina).toBeCloseTo(SPRINT_REENABLE_AT)
    expect(t.exhausted).toBe(false)
  })

  it('latch clears above the threshold', () => {
    const p = createPlayer(0, 0)
    p.stamina = 0
    p.sprintExhausted = true
    const t = tickSurvival(p, 2, false) // 0 → 40 > 20
    expect(t.exhausted).toBe(false)
  })
})

describe('tickSurvival — purity', () => {
  it('does not mutate its input', () => {
    const p = createPlayer(3, 4)
    p.stamina = 30
    const before = { ...p }
    tickSurvival(p, 1, true)
    expect(p).toEqual(before)
  })
})

describe('applyItem', () => {
  it('food restores hunger (canned soup +40)', () => {
    const p = createPlayer(0, 0)
    p.hunger = 50
    const t = applyItem(p, 'canned_soup')
    expect(t.hunger).toBe(90)
    expect(t.health).toBe(MAX_HEALTH)
  })

  it('canned food +30 and water +15', () => {
    const food = createPlayer(0, 0)
    food.hunger = 40
    expect(applyItem(food, 'canned_food').hunger).toBe(70)
    const water = createPlayer(0, 0)
    water.hunger = 40
    expect(applyItem(water, 'water').hunger).toBe(55)
  })

  it('medical restores health: bandage +25, painkiller +50, clamped at max', () => {
    const p = createPlayer(0, 0)
    p.health = 60
    expect(applyItem(p, 'bandage').health).toBe(85)
    expect(applyItem(p, 'painkiller').health).toBe(MAX_HEALTH) // 60 + 50 clamps
    const full = createPlayer(0, 0)
    full.health = 90
    expect(applyItem(full, 'bandage').health).toBe(MAX_HEALTH)
  })

  it('hunger clamps at max', () => {
    const p = createPlayer(0, 0)
    p.hunger = 90
    expect(applyItem(p, 'canned_soup').hunger).toBe(MAX_HUNGER)
  })

  it('unknown item id is a no-op', () => {
    const p = createPlayer(0, 0)
    const t = applyItem(p, 'unobtainium')
    expect(t).toBe(p) // same reference, untouched
  })

  it('does not mutate its input', () => {
    const p = createPlayer(0, 0)
    p.hunger = 10
    const before = { ...p }
    applyItem(p, 'canned_soup')
    expect(p).toEqual(before)
  })
})
