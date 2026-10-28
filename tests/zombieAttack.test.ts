import { describe, it, expect } from 'vitest'
import { createZombie } from '../src/world/Zombie'
import { updateZombie, type ZombieContext } from '../src/systems/ZombieAI'
import type { PassableFn } from '../src/systems/Pathfinding'

const DT = 1 / 60
const wide: PassableFn = (x, y) => x >= 0 && x < 20 && y >= 0 && y < 20

const ctx = (px: number, py: number, casual = false): ZombieContext => ({
  playerX: px,
  playerY: py,
  noiseRadius: casual ? 0 : 5,
  casual,
})

/**
 * Drive the zombie; returns the damage timeline (t -> cumulative damage)
 * plus the sampled states.
 */
function drive(
  z: ReturnType<typeof createZombie>,
  seconds: number,
  ctxAt: (t: number) => ZombieContext,
  sampleEvery = 0.05,
): { total: number; at: (t: number) => number; states: string[]; sampleStates: Array<{ t: number; state: string }> } {
  const events: Array<{ t: number; dmg: number }> = []
  const sampleStates: Array<{ t: number; state: string }> = []
  let total = 0
  let t = 0
  let last = -1
  while (t < seconds) {
    const dmg = updateZombie(z, wide, DT, ctxAt(t))
    t += DT
    if (dmg > 0) {
      total += dmg
      events.push({ t, dmg: total })
    }
    if (t - last >= sampleEvery) {
      last = t
      sampleStates.push({ t, state: z.state })
    }
  }
  const at = (tt: number) => {
    let acc = 0
    for (const e of events) {
      if (e.t > tt) break
      acc = e.dmg
    }
    return acc
  }
  return {
    total,
    at,
    states: sampleStates.map((s) => s.state),
    sampleStates,
  }
}

describe('zombie AI: ATTACK + damage (C21)', () => {
  it('attacks on contact: windup, then 12 damage per second', () => {
    const z = createZombie(0, 10, 10, 1)
    const r = drive(z, 4, () => ctx(10, 10)) // player on top of the zombie
    expect(r.sampleStates.some((s) => s.state === 'ATTACK')).toBe(true)
    expect(r.at(0.4)).toBe(0) // windup not done
    expect(r.at(1.55)).toBe(24) // hits at ~0.5s and ~1.5s
    expect(r.at(2.6)).toBe(36)
    expect(r.at(3.6)).toBe(48)
  })

  it('a visible player 2 tiles away is chased, not attacked immediately', () => {
    const z = createZombie(0, 10, 10, 1)
    const r = drive(z, 4, () => ctx(12, 10))
    expect(r.at(0.5)).toBe(0) // still closing; melee range not reached yet
    expect(r.sampleStates.some((s) => s.state === 'CHASE')).toBe(true)
  })

  it('a player who breaks range stops taking damage', () => {
    const z = createZombie(0, 10, 10, 1)
    const r = drive(z, 3.5, (t) => (t < 2 ? ctx(10, 10) : ctx(14, 10)))
    // two hits (~0.5s, ~1.5s) before the player runs; the zombie chases
    // but is still well out of melee range by 3.5s
    expect(r.at(1.9)).toBe(24)
    expect(r.at(3.4)).toBe(24)
    const states = r.sampleStates.map((s) => s.state)
    const attackAt = states.indexOf('ATTACK')
    const lastAttack = states.lastIndexOf('ATTACK')
    expect(attackAt).toBeGreaterThanOrEqual(0)
    expect(states.slice(lastAttack + 1).includes('CHASE')).toBe(true)
  })

  it('casual mode: the player stands on the zombie unharmed', () => {
    const z = createZombie(0, 10, 10, 1)
    const r = drive(z, 5, () => ctx(10, 10, true))
    expect(r.total).toBe(0)
    expect(r.sampleStates.every((s) => s.state !== 'ATTACK')).toBe(true)
  })

  it('is deterministic under a fixed seed', () => {
    const run = () => {
      const z = createZombie(0, 10, 10, 42)
      return drive(z, 4, () => ctx(10, 10))
    }
    const a = run()
    const b = run()
    expect(a.at(1)).toBe(b.at(1))
    expect(a.at(2)).toBe(b.at(2))
    expect(a.at(3)).toBe(b.at(3))
    expect(a.at(4)).toBe(b.at(4))
  })
})
