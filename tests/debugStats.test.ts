import { describe, it, expect } from 'vitest'
import { formatDebugStats } from '../src/systems/DebugStats'
import { TUTORIAL_MESSAGES, type TutorialEvent } from '../src/data/tutorialMessages'
import { createTutorialState, deliver } from '../src/systems/TutorialSystem'

describe('formatDebugStats', () => {
  it('renders all five fields on separate lines', () => {
    const out = formatDebugStats({
      fps: 59.4,
      tileX: 19.5,
      tileY: 20.25,
      worldX: -128.5,
      worldY: 720.2,
      entityCount: 231,
      renderer: 'canvas',
    })
    const lines = out.split('\n')
    expect(lines).toHaveLength(5)
    expect(lines[0]).toBe('FPS 59')
    expect(lines[1]).toBe('tile 19.50,20.25')
    expect(lines[2]).toBe('world -128.5,720.2')
    expect(lines[3]).toBe('231 objs')
    expect(lines[4]).toBe('canvas')
  })
})

describe('debug overlay zombie lines (C23)', () => {
  it('lists every zombie with state and tile', () => {
    const out = formatDebugStats({
      fps: 60,
      tileX: 20,
      tileY: 24,
      worldX: -128,
      worldY: 720,
      entityCount: 10,
      renderer: 'canvas',
      zombies: [
        { id: 0, state: 'CHASE', x: 33.2, y: 20.3 },
        { id: 1, state: 'WANDER', x: 12, y: 18 },
      ],
    })
    const lines = out.split('\n')
    expect(lines[lines.length - 2]).toBe('z0 CHASE @33.2,20.3')
    expect(lines[lines.length - 1]).toBe('z1 WANDER @12.0,18.0')
  })

  it('omits zombie lines when none are provided', () => {
    const out = formatDebugStats({
      fps: 60,
      tileX: 20,
      tileY: 24,
      worldX: -128,
      worldY: 720,
      entityCount: 10,
      renderer: 'canvas',
    })
    expect(out.split('\n')).toHaveLength(5)
  })
})

describe('debug overlay survival + container lines (C32)', () => {
  it('shows hunger/stamina and one line per container', () => {
    const out = formatDebugStats({
      fps: 60,
      tileX: 20,
      tileY: 24,
      worldX: -128,
      worldY: 720,
      entityCount: 10,
      renderer: 'canvas',
      hunger: 82.4,
      stamina: 55.9,
      containers: [
        { id: 0, location: 'kitchen', looted: false },
        { id: 3, location: 'store', looted: true },
      ],
    })
    const lines = out.split('\n')
    expect(lines).toContain('hunger 83  stamina 56')
    expect(lines).toContain('c0 KITCHEN')
    expect(lines).toContain('c3 STORE looted')
  })

  it('omits the new lines when not provided (M2 callers unaffected)', () => {
    const out = formatDebugStats({
      fps: 60,
      tileX: 20,
      tileY: 24,
      worldX: -128,
      worldY: 720,
      entityCount: 10,
      renderer: 'canvas',
    })
    expect(out).not.toContain('hunger')
    expect(out).not.toContain('c0')
  })
})

describe('debug overlay weapon + zombie health lines (C38)', () => {
  it('shows the held weapon with durability and per-zombie hp', () => {
    const out = formatDebugStats({
      fps: 60,
      tileX: 20,
      tileY: 24,
      worldX: -128,
      worldY: 720,
      entityCount: 10,
      renderer: 'canvas',
      heldWeapon: 'Kitchen knife (37)',
      zombies: [{ id: 0, state: 'CHASE', x: 33.2, y: 20.3, health: 45 }],
    })
    const lines = out.split('\n')
    expect(lines).toContain('weapon Kitchen knife (37)')
    expect(lines).toContain('z0 CHASE @33.2,20.3 hp45')
  })

  it('supports bare hands and omits hp for M2-shaped callers', () => {
    const out = formatDebugStats({
      fps: 60,
      tileX: 20,
      tileY: 24,
      worldX: -128,
      worldY: 720,
      entityCount: 10,
      renderer: 'canvas',
      heldWeapon: 'bare hands',
      zombies: [{ id: 1, state: 'WANDER', x: 12, y: 18 }],
    })
    const lines = out.split('\n')
    expect(lines).toContain('weapon bare hands')
    expect(lines).toContain('z1 WANDER @12.0,18.0')
  })

  it('omits the weapon line when not provided (older callers unaffected)', () => {
    const out = formatDebugStats({
      fps: 60,
      tileX: 20,
      tileY: 24,
      worldX: -128,
      worldY: 720,
      entityCount: 10,
      renderer: 'canvas',
    })
    expect(out).not.toContain('weapon')
  })
})

describe('S.A.F.E. catalog (M3 + M4 events)', () => {
  const events: TutorialEvent[] = [
    'first.eat',
    'first.heal',
    'first.loot',
    'hunger.low',
    'weapon.broke',
    'first.kill',
  ]

  it('has exactly one message per event with non-empty text', () => {
    for (const event of events) {
      const msgs = TUTORIAL_MESSAGES.filter((m) => m.event === event)
      expect(msgs, event).toHaveLength(1)
      expect(msgs[0].text.length).toBeGreaterThan(20)
    }
  })

  it('delivers each event once (one-shot)', () => {
    for (const event of events) {
      const t = createTutorialState()
      expect(deliver(t, event)).not.toBeNull()
      expect(deliver(t, event)).toBeNull()
    }
  })
})
