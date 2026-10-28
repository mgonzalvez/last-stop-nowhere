import { describe, it, expect } from 'vitest'
import { createPlayer } from '../src/world/Player'
import { movePlayer, type InputState } from '../src/systems/MovementSystem'
import { tileToScreen } from '../src/world/IsoProjection'

// Screen-space displacement after a 1s move in the given direction.
function screenDelta(input: InputState): { x: number; y: number } {
  const p = createPlayer(10, 10)
  const next = movePlayer(p, input, 1)
  const a = tileToScreen(p.x, p.y)
  const b = tileToScreen(next.x, next.y)
  return { x: b.x - a.x, y: b.y - a.y }
}

const NO_INPUT: InputState = { up: false, down: false, left: false, right: false }

const INPUTS: Record<string, InputState> = {
  up: { up: true, down: false, left: false, right: false },
  down: { up: false, down: true, left: false, right: false },
  left: { up: false, down: false, left: true, right: false },
  right: { up: false, down: false, left: false, right: true },
  upRight: { up: true, down: false, left: false, right: true },
  downRight: { up: false, down: true, left: false, right: true },
  downLeft: { up: false, down: true, left: true, right: false },
  upLeft: { up: true, down: false, left: true, right: false },
}

describe('movePlayer', () => {
  it('does not move with no input', () => {
    const p = createPlayer(10, 10)
    const next = movePlayer(p, NO_INPUT, 1)
    expect(next.x).toBe(10)
    expect(next.y).toBe(10)
  })

  it('moves in the expected screen direction for all 8 inputs', () => {
    // expected screen-space signs [dx, dy]
    const expected: Record<string, [number, number]> = {
      up: [0, -1],
      down: [0, 1],
      left: [-1, 0],
      right: [1, 0],
      upRight: [1, -1],
      downRight: [1, 1],
      downLeft: [-1, 1],
      upLeft: [-1, -1],
    }
    for (const [name, input] of Object.entries(INPUTS)) {
      const d = screenDelta(input)
      expect(Math.hypot(d.x, d.y)).toBeGreaterThan(0)
      if (expected[name][0] === 0) expect(d.x).toBeCloseTo(0, 5)
      else expect(Math.sign(d.x)).toBe(expected[name][0])
      if (expected[name][1] === 0) expect(d.y).toBeCloseTo(0, 5)
      else expect(Math.sign(d.y)).toBe(expected[name][1])
    }
  })

  it('diagonal screen speed equals axis screen speed', () => {
    const axis = Math.hypot(screenDelta(INPUTS.right).x, screenDelta(INPUTS.right).y)
    for (const name of ['upRight', 'downRight', 'downLeft', 'upLeft'] as const) {
      const d = screenDelta(INPUTS[name])
      expect(Math.hypot(d.x, d.y)).toBeCloseTo(axis, 5)
    }
  })

  it('screen speed matches player.speed per second', () => {
    const p = createPlayer(10, 10, 200)
    const next = movePlayer(p, INPUTS.down, 1)
    const a = tileToScreen(p.x, p.y)
    const b = tileToScreen(next.x, next.y)
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeCloseTo(200, 5)
  })

  it('is frame-rate independent (two 0.5s steps == one 1s step)', () => {
    const p = createPlayer(5, 5)
    const once = movePlayer(p, INPUTS.upRight, 1)
    const stepped = movePlayer(movePlayer(p, INPUTS.upRight, 0.5), INPUTS.upRight, 0.5)
    expect(stepped.x).toBeCloseTo(once.x, 10)
    expect(stepped.y).toBeCloseTo(once.y, 10)
  })
})
