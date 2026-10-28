import { describe, expect, it } from 'vitest'
import { WorldMap, MAP_SIZE } from '../src/world/WorldMap'
import { TileType } from '../src/world/TileTypes'

const map = new WorldMap()

describe('map bounds', () => {
  it('is 48x48', () => {
    expect(MAP_SIZE).toEqual({ w: 48, h: 48 })
    expect(map.grid).toHaveLength(48)
    expect(map.grid[0]).toHaveLength(48)
  })

  it('inBounds is true at edges, false just outside', () => {
    expect(map.inBounds(0, 0)).toBe(true)
    expect(map.inBounds(47, 47)).toBe(true)
    expect(map.inBounds(-1, 0)).toBe(false)
    expect(map.inBounds(48, 0)).toBe(false)
    expect(map.inBounds(0, -1)).toBe(false)
    expect(map.inBounds(0, 48)).toBe(false)
  })

  it('out-of-bounds is never passable and reads as a wall', () => {
    expect(map.isPassable(-5, -5)).toBe(false)
    expect(map.isPassable(99, 99)).toBe(false)
    expect(map.getTile(100, 100)).toBe(TileType.WALL_OUT)
  })

  it('every cell holds a valid tile type', () => {
    for (let y = 0; y < 48; y++) {
      for (let x = 0; x < 48; x++) {
        expect(Object.values(TileType)).toContain(map.grid[y][x])
      }
    }
  })
})

describe('collision rules', () => {
  it('street, sidewalks, and grass are passable', () => {
    expect(map.isPassable(24, 22)).toBe(true) // horizontal street
    expect(map.isPassable(34, 10)).toBe(true) // vertical street
    expect(map.isPassable(10, 21)).toBe(true) // north sidewalk
    expect(map.isPassable(10, 24)).toBe(true) // south sidewalk
    expect(map.isPassable(3, 12)).toBe(true) // grass
  })

  it('house 1: walls block, door passes, interior is walkable floor', () => {
    expect(map.getTile(8, 14)).toBe(TileType.WALL_OUT)
    expect(map.isPassable(8, 14)).toBe(false) // north wall
    expect(map.isPassable(6, 16)).toBe(false) // west wall
    expect(map.getTile(9, 19)).toBe(TileType.DOOR)
    expect(map.isPassable(9, 19)).toBe(true)
    expect(map.getTile(8, 16)).toBe(TileType.WOOD_FLOOR)
    expect(map.isPassable(8, 16)).toBe(true)
  })

  it('windows block (houses and store)', () => {
    expect(map.getTile(7, 19)).toBe(TileType.WINDOW)
    expect(map.isPassable(7, 19)).toBe(false)
    expect(map.isPassable(43, 26)).toBe(false) // store window
  })

  it('store: interior floor passable, door at (41,26) passes', () => {
    expect(map.getTile(41, 29)).toBe(TileType.WOOD_FLOOR)
    expect(map.isPassable(41, 29)).toBe(true)
    expect(map.getTile(41, 26)).toBe(TileType.DOOR)
    expect(map.isPassable(41, 26)).toBe(true)
  })

  it('fence blocks but leaves a gap at house 2 door', () => {
    expect(map.getTile(16, 20)).toBe(TileType.FENCE)
    expect(map.isPassable(16, 20)).toBe(false)
    expect(map.isPassable(19, 20)).toBe(true) // gap under the door
  })

  it('trees and cars block', () => {
    expect(map.getTile(3, 5)).toBe(TileType.TREE)
    expect(map.isPassable(3, 5)).toBe(false)
    expect(map.getTile(14, 22)).toBe(TileType.CAR)
    expect(map.isPassable(14, 22)).toBe(false)
    expect(map.isPassable(31, 22)).toBe(false)
  })

  it('every door is reachable from both outside and inside', () => {
    const doors: [number, number, number, number][] = [
      // [x, y, outsideYdir, insideYdir]
      [9, 19, 1, -1],
      [19, 19, 1, -1],
      [29, 19, 1, -1],
      [41, 26, -1, 1],
    ]
    for (const [x, y, outD, inD] of doors) {
      expect(map.isPassable(x, y)).toBe(true)
      expect(map.isPassable(x, y + outD)).toBe(true)
      expect(map.isPassable(x, y + inD)).toBe(true)
    }
  })
})

describe('roof tiles', () => {
  const idx = (x: number, y: number) => y * 48 + x

  it('covers the house interior and frame (rows 14-18)', () => {
    const roofs = map.roofTiles()
    expect(roofs.has(idx(8, 15))).toBe(true) // interior
    expect(roofs.has(idx(6, 15))).toBe(true) // west wall
    expect(roofs.has(idx(6, 14))).toBe(true) // NW corner
    expect(roofs.has(idx(41, 28))).toBe(true) // store interior
  })

  it('never roofs doors or windows (facade openings)', () => {
    const roofs = map.roofTiles()
    expect(roofs.has(idx(9, 19))).toBe(false) // house 1 door
    expect(roofs.has(idx(7, 19))).toBe(false) // house 1 window
    expect(roofs.has(idx(41, 26))).toBe(false) // store door
    expect(roofs.has(idx(39, 26))).toBe(false) // store window
  })

  it('roofs facade walls, including the street-facing rows', () => {
    const roofs = map.roofTiles()
    expect(roofs.has(idx(8, 19))).toBe(true) // house 1 facade wall
    expect(roofs.has(idx(40, 33))).toBe(true) // store south wall
  })
})
