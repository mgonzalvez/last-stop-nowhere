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
