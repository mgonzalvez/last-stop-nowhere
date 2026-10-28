import { describe, it, expect } from 'vitest'
import { depthFor } from '../src/rendering/DepthSorting'

// Pins the isometric depth contract (higher = drawn in front) against the
// real map layout, so a future change to the formula or offsets can't
// silently break player/object ordering.
describe('depth ordering rules', () => {
  it('player south of house 2 is in front of its street wall; inside is behind it', () => {
    const wall = depthFor(19, 19) // house 2 street-facing (door) row
    expect(depthFor(19, 20.5)).toBeGreaterThan(wall) // outside (fence gap row)
    expect(depthFor(19, 18.5)).toBeLessThan(wall) // inside (interior row)
  })

  it('depth is continuous for fractional player positions', () => {
    const a = depthFor(19, 20.5)
    const b = depthFor(19, 19.75)
    const c = depthFor(19, 18.5)
    expect(a).toBeGreaterThan(b)
    expect(b).toBeGreaterThan(c)
  })

  it('roof floats above its own tile but below the next (camera-side) row', () => {
    const roof = depthFor(19, 19, 5) // offset used by GameScene.drawRoofs
    const own = depthFor(19, 19)
    const nextSouth = depthFor(19, 20)
    const nextEast = depthFor(20, 19)
    expect(roof).toBeGreaterThan(own)
    expect(roof).toBeLessThan(nextSouth)
    expect(roof).toBeLessThan(nextEast)
  })

  it('tall objects use their foot tile: player across the foot is behind, adjacent south is in front', () => {
    const tree = depthFor(25, 8) // tree foot at (25,8)
    expect(depthFor(25, 7)).toBeLessThan(tree) // north of the tree: behind
    expect(depthFor(25, 9)).toBeGreaterThan(tree) // south of the tree: in front
    expect(depthFor(24, 8)).toBeLessThan(tree) // west neighbor: behind
    expect(depthFor(26, 8)).toBeGreaterThan(tree) // east neighbor: in front
  })

  it('car (two-tile object) is ordered by its midpoint tile', () => {
    const car = depthFor(24 + 0.5, 23) // parked car spanning (24,23)-(25,23)
    expect(depthFor(24.5, 23.5)).toBeGreaterThan(car) // south of the car: in front
    expect(depthFor(24.5, 22.5)).toBeLessThan(car) // north of the car: behind
  })
})
