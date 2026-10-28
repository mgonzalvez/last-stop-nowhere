import { describe, it, expect } from 'vitest'
import { losClear } from '../src/systems/LineOfSight'
import { noiseRadius, NOISE_STILL, NOISE_MOVING, NOISE_SPRINT } from '../src/systems/Noise'
import { worldMap } from '../src/world/WorldMap'

const map = (x: number, y: number): boolean => worldMap.isPassable(x, y)

/** Synthetic 5x5 open grid. */
const open5 = (x: number, y: number): boolean => x >= 0 && x < 5 && y >= 0 && y < 5

describe('line of sight', () => {
  it('same tile and adjacent tiles are always clear', () => {
    expect(losClear(open5, [2, 2], [2, 2])).toBe(true)
    expect(losClear(open5, [2, 2], [3, 2])).toBe(true)
    expect(losClear(open5, [2, 2], [2, 3])).toBe(true)
    expect(losClear(open5, [2, 2], [3, 3])).toBe(true)
  })

  it('wall column blocks a straight shot', () => {
    const wall = (x: number, y: number) => open5(x, y) && x !== 2
    expect(losClear(wall, [1, 2], [3, 2])).toBe(false)
    expect(losClear(wall, [1, 2], [1, 2])).toBe(true)
  })

  it('diagonal steps do not cut corners', () => {
    // (1,0) and (0,1) blocked; (1,1) open — the diagonal must be blocked
    const corner = (x: number, y: number) =>
      open5(x, y) && !(x === 1 && y === 0) && !(x === 0 && y === 1)
    expect(losClear(corner, [0, 0], [1, 1])).toBe(false)
    // same diagonal with the corner open
    expect(losClear(open5, [0, 0], [1, 1])).toBe(true)
  })

  it('house 2: the fence gap + door column is visible, the fence line is not', () => {
    // (19,21) sidewalk -> (19,18) interior: through gap (19,20) and door (19,19)
    expect(losClear(map, [19, 21], [19, 18])).toBe(true)
    // (18,21) -> (18,18): crosses the fence at (18,20) and the wall at (18,19)
    expect(losClear(map, [18, 21], [18, 18])).toBe(false)
  })

  it('open street is visible; parked cars block', () => {
    // row 22 west of the cars is open; row 23 east of the cars is open
    expect(losClear(map, [20, 22], [28, 22])).toBe(true)
    expect(losClear(map, [26, 23], [29, 23])).toBe(true)
    // this line clips the car at (24,23) (direct hit + corner rule)
    expect(losClear(map, [22, 22], [26, 24])).toBe(false)
  })

  it('sight through an open store door works', () => {
    // store door at (41,26): from the sidewalk south of the store to inside
    expect(losClear(map, [41, 25], [41, 27])).toBe(true)
  })
})

describe('noise', () => {
  it('still = 0, moving = 5, sprinting = 9', () => {
    expect(noiseRadius(false)).toBe(NOISE_STILL)
    expect(NOISE_STILL).toBe(0)
    expect(noiseRadius(true)).toBe(NOISE_MOVING)
    expect(NOISE_MOVING).toBe(5)
    expect(noiseRadius(true, true)).toBe(NOISE_SPRINT)
    expect(NOISE_SPRINT).toBe(9)
  })
})
