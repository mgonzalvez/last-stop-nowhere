// Handcrafted 48x48 neighborhood (deterministic, no randomness).
// grid[y][x]. Layout: horizontal street rows 22-23, vertical street cols 34-35,
// sidewalks adjacent to both, three houses on the north side (rows 14-19),
// corner store south of the street (rows 26-33, cols 38-45), trees and cars.
import { TileType } from './TileTypes'

export const MAP_W = 48
export const MAP_H = 48

export type Grid = TileType[][]

export function buildMap(): Grid {
  const g: Grid = Array.from({ length: MAP_H }, () =>
    Array.from({ length: MAP_W }, () => TileType.GRASS),
  )

  const set = (x: number, y: number, t: TileType) => {
    g[y][x] = t
  }
  const rect = (x0: number, y0: number, x1: number, y1: number, t: TileType) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, t)
  }

  // Streets + sidewalks
  rect(0, 22, 47, 23, TileType.ROAD) // horizontal residential street
  rect(34, 0, 35, 47, TileType.ROAD) // vertical street
  rect(0, 21, 47, 21, TileType.SIDEWALK)
  rect(0, 24, 47, 24, TileType.SIDEWALK)
  rect(33, 0, 33, 47, TileType.SIDEWALK)
  rect(36, 0, 36, 47, TileType.SIDEWALK)

  // Three identical houses (north side, street-facing wall on row 19).
  // 6x6 footprint: wall frame, 4x4 wood-floor interior, door + 2 windows
  // on the street-facing wall (door at x0+3).
  const house = (x0: number) => {
    const x1 = x0 + 5
    rect(x0, 14, x1, 18, TileType.WALL_OUT) // frame (north/east/west walls)
    rect(x0 + 1, 15, x1 - 1, 18, TileType.WOOD_FLOOR) // interior
    rect(x0, 19, x1, 19, TileType.WALL_OUT) // street-facing wall
    set(x0 + 1, 19, TileType.WINDOW)
    set(x0 + 3, 19, TileType.DOOR)
    set(x0 + 4, 19, TileType.WINDOW)
  }
  house(6) // door at (9,19)
  house(16) // door at (19,19)
  house(26) // door at (29,19)

  // Fence in front of house 2, with a gap at its door
  for (let x = 16; x <= 21; x++) if (x !== 19) set(x, 20, TileType.FENCE)

  // Corner store: 8x8, wall frame, 6x6 interior, door + 2 windows on row 26
  rect(38, 26, 45, 33, TileType.WALL_OUT)
  rect(39, 27, 44, 32, TileType.WOOD_FLOOR)
  set(41, 26, TileType.DOOR)
  set(39, 26, TileType.WINDOW)
  set(43, 26, TileType.WINDOW)

  // Trees (static scenery)
  const trees: [number, number][] = [
    [3, 5], [42, 4], [25, 8], [2, 28], [46, 20], [5, 40], [44, 42], [20, 44],
  ]
  for (const [x, y] of trees) set(x, y, TileType.TREE)

  // Parked cars (two tiles each, on the street)
  const cars: [number, number][] = [
    [14, 22], [15, 22], [24, 23], [25, 23], [30, 22], [31, 22],
  ]
  for (const [x, y] of cars) set(x, y, TileType.CAR)

  return g
}
