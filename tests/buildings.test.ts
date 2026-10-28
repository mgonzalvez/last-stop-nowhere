import { describe, it, expect } from 'vitest'
import { worldMap } from '../src/world/WorldMap'
import {
  computeBuildingIndex,
  buildingAt,
  tileKey,
} from '../src/world/Buildings'
import { createPlayer } from '../src/world/Player'
import { moveWithCollision } from '../src/systems/CollisionSystem'
import type { InputState } from '../src/systems/MovementSystem'

const index = computeBuildingIndex(worldMap)
const UP_RIGHT: InputState = { up: true, down: false, left: false, right: true }

/** House 2 = x 16-21, y 14-19, door (19,19). */
function house2(): (typeof index.buildings)[number] {
  const b = index.buildings.find(
    (x) => x.minX === 16 && x.maxX === 21 && x.minY === 14 && x.maxY === 19,
  )
  expect(b).toBeDefined()
  return b!
}

describe('computeBuildingIndex', () => {
  it('finds 4 buildings: three houses + corner store', () => {
    expect(index.buildings).toHaveLength(4)
    const bboxes = index.buildings
      .map((b) => [b.minX, b.maxX, b.minY, b.maxY])
      .sort((a, b) => a[0] - b[0])
    expect(bboxes).toEqual([
      [6, 11, 14, 19],
      [16, 21, 14, 19],
      [26, 31, 14, 19],
      [38, 45, 26, 33],
    ])
  })

  it('associates each door tile with its building', () => {
    expect(house2().doors).toContain(tileKey(19, 19))
    const store = index.buildings.find(
      (b) => b.minX === 38 && b.maxY === 33,
    )!
    expect(store.doors).toContain(tileKey(41, 26))
    expect(store.doors).toHaveLength(1)
  })

  it('door tiles are passable and interior tiles are roofed+passable', () => {
    expect(worldMap.isPassable(19, 19)).toBe(true) // door
    expect(worldMap.isPassable(19, 18)).toBe(true) // interior wood floor
    expect(worldMap.roofTiles().has(18 * 48 + 19)).toBe(true) // interior is roofed
  })
})

describe('buildingAt (roof-hide predicate)', () => {
  it('is -1 outside: street, sidewalk, fence-gap row', () => {
    expect(buildingAt(index, 19, 23)).toBe(-1) // road
    expect(buildingAt(index, 19, 24)).toBe(-1) // sidewalk
    expect(buildingAt(index, 19, 20)).toBe(-1) // fence gap (grass)
    expect(buildingAt(index, 20, 20)).toBe(-1) // fence tile itself
  })

  it('is the house on its door tile and interior tiles', () => {
    const h2 = house2().id
    expect(buildingAt(index, 19, 19)).toBe(h2) // door
    expect(buildingAt(index, 19, 18)).toBe(h2) // interior
    expect(buildingAt(index, 17.5, 15.5)).toBe(h2) // fractional interior
  })

  it('flips exactly at the door (outside -> inside across one row)', () => {
    const h2 = house2().id
    expect(buildingAt(index, 19, 20)).toBe(-1) // just south of door
    expect(buildingAt(index, 19, 19)).toBe(h2) // door tile
    expect(buildingAt(index, 19, 18)).toBe(h2) // just north of door
  })
})

describe('enter/exit walk (deterministic fixed-dt steps)', () => {
  const DT = 1 / 60

  function run(player: ReturnType<typeof createPlayer>, input: InputState, frames: number) {
    for (let i = 0; i < frames; i++) {
      player = moveWithCollision(player, input, worldMap, DT)
    }
    return player
  }

  it('walks from the fence gap into the interior', () => {
    // Start centered in the fence-gap row (grass at (19,20)), outside.
    let p = createPlayer(19.5, 20.5, 150)
    expect(buildingAt(index, p.x, p.y)).toBe(-1)

    // UP+RIGHT is near-straight north (drifts slightly west): crosses the
    // fence gap, enters through the door tile, and continues into the room.
    p = run(p, UP_RIGHT, 60) // 1s
    expect(p.y).toBeLessThan(19) // past the door row, into the interior rows
    expect(p.y).toBeGreaterThan(14) // stopped short of the north wall
    expect(buildingAt(index, p.x, p.y)).toBe(house2().id)
  })

  it('walks back out of the interior through the door to the fence gap', () => {
    // Start just inside the door (wood floor at (19,18)), aligned so the
    // DOWN+LEFT east-drift keeps the footprint over the door tile (19,19).
    let p = createPlayer(19.4, 18.5, 150)
    expect(buildingAt(index, p.x, p.y)).toBe(house2().id)

    // DOWN+LEFT is near-straight south (drifts slightly east): exits through
    // the door tile and stops in front of the fence on the outside.
    const DOWN_LEFT: InputState = { up: false, down: true, left: true, right: false }
    p = run(p, DOWN_LEFT, 60) // 1s
    expect(p.y).toBeGreaterThan(19) // back outside, past the door row
    expect(buildingAt(index, p.x, p.y)).toBe(-1)
  })
})
