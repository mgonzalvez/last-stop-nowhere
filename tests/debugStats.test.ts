import { describe, it, expect } from 'vitest'
import { formatDebugStats } from '../src/systems/DebugStats'

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
