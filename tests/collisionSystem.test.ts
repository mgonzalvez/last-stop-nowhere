import { describe, it, expect } from 'vitest'
import { worldMap } from '../src/world/WorldMap'
import { createPlayer } from '../src/world/Player'
import {
  isClear,
  resolveStep,
  moveWithCollision,
  PLAYER_RADIUS,
} from '../src/systems/CollisionSystem'
import type { InputState } from '../src/systems/MovementSystem'

describe('isClear', () => {
  it('clear on an open sidewalk tile (spawn point)', () => {
    expect(isClear(worldMap, 20, 24)).toBe(true)
  })

  it('blocked on walls, trees, and cars', () => {
    expect(isClear(worldMap, 18, 19)).toBe(false) // house 1 street wall
    expect(isClear(worldMap, 25, 8)).toBe(false) // tree
    expect(isClear(worldMap, 24, 23)).toBe(false) // parked car
  })

  it('blocked at the map edge', () => {
    expect(isClear(worldMap, -0.5, 24)).toBe(false)
    expect(isClear(worldMap, 47.8, 24)).toBe(false)
  })
})

describe('resolveStep', () => {
  it('moves on open ground', () => {
    const res = resolveStep(worldMap, 8, 25, 8, 21.5)
    expect(res).toEqual({ x: 8, y: 21.5 })
  })

  it('cannot cross a house wall', () => {
    // house 1 (rows 14-19, x 6-11): approach from the south, stop at the wall
    const near = resolveStep(worldMap, 8, 25, 8, 21.3) // close is fine
    expect(near.y).toBe(21.3)
    const intoWall = resolveStep(worldMap, 8, 21.3, 8, 20.0) // hits wall row 19
    expect(intoWall.y).toBe(21.3) // stopped, did not cross
    expect(isClear(worldMap, intoWall.x, intoWall.y)).toBe(true)
  })

  it('cannot cross a tree', () => {
    const res = resolveStep(worldMap, 25, 10, 25, 8.4) // tree at (25,8)
    expect(res.y).toBe(10)
  })

  it('cannot cross a parked car', () => {
    // cars at (24,23) & (25,23); approach from the east side of the pair
    const res = resolveStep(worldMap, 27, 23.5, 25.5, 23.5)
    expect(res.x).toBe(27)
  })

  it('slides along a wall: blocked axis drops, free axis keeps moving', () => {
    // in front of house 2's fence, target is into the fence row:
    // the -y move is blocked, the -x move still applies.
    const res = resolveStep(worldMap, 19.5, 21.3, 19.03, 20.83)
    expect(res.x).toBeLessThan(19.5) // slid west
    expect(res.y).toBe(21.3) // did not pass the fence
  })

  it('door tiles pass: walk through the corner store door', () => {
    // store door at (41,26); aim at the door tile center (x=41.5)
    const a = resolveStep(worldMap, 41.5, 25.5, 41.5, 26.4) // through door
    expect(a.y).toBe(26.4)
    const b = resolveStep(worldMap, 41.5, 26.4, 41.5, 27.5) // into interior
    expect(b.y).toBe(27.5)
    expect(worldMap.isPassable(41, 27)).toBe(true) // interior is wood floor
  })

  it('walls beside the door still block', () => {
    const res = resolveStep(worldMap, 40.5, 25.5, 40.5, 26.4) // x=40 is a wall
    expect(res.y).toBe(25.5)
  })
})

describe('moveWithCollision', () => {
  it('stops in front of the fence over per-frame steps', () => {
    // screen upRight = tile (0,-1) direction; start in front of house 2's fence
    const input: InputState = { up: true, down: false, left: false, right: true }
    let p = createPlayer(17.5, 24)
    for (let i = 0; i < 60; i++) {
      p = moveWithCollision(p, input, worldMap, 1 / 60)
      expect(isClear(worldMap, p.x, p.y, PLAYER_RADIUS)).toBe(true)
    }
    expect(p.y).toBeLessThan(24) // made progress
    expect(p.y).toBeGreaterThan(21) // stopped before fence row 20
    expect(p.x).toBeLessThan(17.5) // slid west along the fence
  })

  it('keeps the footprint clear over many frames in every direction', () => {
    const inputs: InputState[] = [
      { up: true, down: false, left: false, right: false },
      { up: false, down: true, left: false, right: false },
      { up: false, down: false, left: true, right: false },
      { up: false, down: false, left: false, right: true },
      { up: true, down: false, left: true, right: true },
      { up: true, down: true, left: false, right: true },
      { up: false, down: true, left: true, right: false },
      { up: true, down: true, left: false, right: false }, // opposite keys: no move
    ]
    let p = createPlayer(20, 24)
    for (let i = 0; i < 60; i++) {
      p = moveWithCollision(p, inputs[i % inputs.length], worldMap, 1 / 60)
      expect(isClear(worldMap, p.x, p.y, PLAYER_RADIUS)).toBe(true)
    }
  })

  it('does not move with no input', () => {
    const p = createPlayer(20, 24)
    const next = moveWithCollision(
      p,
      { up: false, down: false, left: false, right: false },
      worldMap,
      1 / 60,
    )
    expect(next.x).toBe(20)
    expect(next.y).toBe(24)
  })
})
