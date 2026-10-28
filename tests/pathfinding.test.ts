import { describe, it, expect } from 'vitest'
import { findPath, type PassableFn } from '../src/systems/Pathfinding'
import { worldMap, MAP_SIZE } from '../src/world/WorldMap'

const map = (x: number, y: number): boolean => worldMap.isPassable(x, y)

/** Synthetic open 10x10 grid. */
const open10: PassableFn = (x, y) => x >= 0 && x < 10 && y >= 0 && y < 10

describe('pathfinding (A*)', () => {
  it('straight line along the street', () => {
    const path = findPath(map, [20, 22], [28, 22])
    expect(path).not.toBeNull()
    expect(path!.length).toBe(8)
    expect(path![path!.length - 1]).toEqual([28, 22])
  })

  it('path through house 2 gap + door into the interior', () => {
    const path = findPath(map, [19, 21], [19, 18])
    expect(path).not.toBeNull()
    expect(path!.length).toBe(3) // (19,20) fence gap, (19,19) door, (19,18) wood
    expect(path!).toContainEqual([19, 19])
  })

  it('meadow-to-meadow path stays on passable, adjacent tiles', () => {
    const path = findPath(map, [12, 18], [23, 15])
    expect(path).not.toBeNull()
    expect(path![0]).not.toEqual([12, 18]) // start excluded
    expect(path![path!.length - 1]).toEqual([23, 15]) // goal included
    let prev: readonly [number, number] = [12, 18]
    for (const [x, y] of path!) {
      expect(map(x, y)).toBe(true)
      const step = Math.abs(x - prev[0]) + Math.abs(y - prev[1])
      expect(step).toBe(1)
      prev = [x, y]
    }
  })

  it('start == end is an empty path', () => {
    expect(findPath(map, [20, 24], [20, 24])).toEqual([])
  })

  it('blocked goal returns null', () => {
    const wall = (x: number, y: number) =>
      open10(x, y) && !(x === 5 && y === 5)
    expect(findPath(wall, [1, 1], [5, 5])).toBeNull()
  })

  it('walled-in goal returns null', () => {
    // goal (5,5) is passable but its 4 neighbors are blocked
    const inside = (x: number, y: number) =>
      open10(x, y) &&
      !(x === 4 && y === 5) &&
      !(x === 6 && y === 5) &&
      !(x === 5 && y === 4) &&
      !(x === 5 && y === 6)
    expect(inside(5, 5)).toBe(true)
    expect(findPath(inside, [1, 1], [5, 5])).toBeNull()
  })

  it('exceeding the node budget returns null', () => {
    expect(findPath(open10, [0, 0], [2, 0], 1)).toBeNull()
  })

  it('all real-map spawn pairs are reachable', () => {
    const spawns: Array<[number, number]> = [
      [8, 25], [12, 18], [23, 15], [38, 16], [36, 20], [40, 35], [8, 38],
    ]
    for (let i = 0; i < spawns.length; i++) {
      for (let j = 0; j < spawns.length; j++) {
        if (i === j) continue
        const a = spawns[i]
        const b = spawns[j]
        expect(a[0]).toBeGreaterThanOrEqual(0)
        expect(a[1]).toBeLessThan(MAP_SIZE.h)
        expect(findPath(map, a, b)).not.toBeNull()
      }
    }
  })
})
