import { describe, expect, it, beforeEach } from 'vitest'
import { setOrigin, tileToScreen, screenToTile, TILE_W, TILE_H } from '../src/world/IsoProjection'

beforeEach(() => setOrigin(100, 50))

describe('tileToScreen', () => {
  it('maps tile (0,0) to the origin', () => {
    expect(tileToScreen(0, 0)).toEqual({ x: 100, y: 50 })
  })

  it('uses the 64x32 diamond formulas', () => {
    expect(tileToScreen(1, 0)).toEqual({ x: 100 + TILE_W / 2, y: 50 + TILE_H / 2 })
    expect(tileToScreen(0, 1)).toEqual({ x: 100 - TILE_W / 2, y: 50 + TILE_H / 2 })
    expect(tileToScreen(2, 2)).toEqual({ x: 100, y: 50 + 2 * TILE_H })
  })
})

describe('screenToTile', () => {
  it('is the exact inverse of tileToScreen', () => {
    for (const [tx, ty] of [[0, 0], [1, 0], [0, 1], [5, 9], [47, 47]] as const) {
      const s = tileToScreen(tx, ty)
      expect(screenToTile(s.x, s.y)).toEqual({ x: tx, y: ty })
    }
  })

  it('handles fractional tile positions (for entity movement)', () => {
    const s = tileToScreen(3.5, 2.25)
    expect(screenToTile(s.x, s.y)).toEqual({ x: 3.5, y: 2.25 })
  })

  it('round-trips arbitrary screen points', () => {
    const t = screenToTile(123.4, 77.7)
    const s = tileToScreen(t.x, t.y)
    expect(s.x).toBeCloseTo(123.4, 10)
    expect(s.y).toBeCloseTo(77.7, 10)
  })
})
