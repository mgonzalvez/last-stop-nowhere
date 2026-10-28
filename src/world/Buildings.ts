// Buildings: connected components of roofed tiles (4-connectivity), plus each
// building's door tiles. Pure, Phaser-free — authoritative world data.
import { TileType } from './TileTypes'
import { MAP_SIZE, type WorldMap } from './WorldMap'

export interface Building {
  id: number
  /** Roofed tiles "x,y". */
  tiles: Set<string>
  /** DOOR tiles adjacent to this building's roofed tiles. */
  doors: Set<string>
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface BuildingIndex {
  buildings: Building[]
  /** Roofed tile and its door tile -> building id. */
  tileToBuilding: Map<string, number>
}

export const tileKey = (x: number, y: number): string => x + ',' + y

const DIRS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]]

export function computeBuildingIndex(map: WorldMap): BuildingIndex {
  const roofSet = new Set<string>()
  const roofs = map.roofTiles()
  for (const idx of roofs) {
    roofSet.add(tileKey(idx % MAP_SIZE.w, Math.floor(idx / MAP_SIZE.w)))
  }

  const buildings: Building[] = []
  const tileToBuilding = new Map<string, number>()
  const visited = new Set<string>()

  for (const start of roofSet) {
    if (visited.has(start)) continue
    const id = buildings.length
    const b: Building = {
      id,
      tiles: new Set(),
      doors: new Set(),
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity,
    }
    const stack = [start]
    visited.add(start)
    while (stack.length > 0) {
      const cur = stack.pop()!
      b.tiles.add(cur)
      tileToBuilding.set(cur, id)
      const [cx, cy] = cur.split(',').map(Number)
      b.minX = Math.min(b.minX, cx)
      b.maxX = Math.max(b.maxX, cx)
      b.minY = Math.min(b.minY, cy)
      b.maxY = Math.max(b.maxY, cy)
      for (const [dx, dy] of DIRS) {
        const nk = tileKey(cx + dx, cy + dy)
        if (roofSet.has(nk) && !visited.has(nk)) {
          visited.add(nk)
          stack.push(nk)
        }
      }
    }
    buildings.push(b)
  }

  // Door tiles adjacent to each building's roofed tiles.
  for (const b of buildings) {
    for (const t of b.tiles) {
      const [cx, cy] = t.split(',').map(Number)
      for (const [dx, dy] of DIRS) {
        if (map.getTile(cx + dx, cy + dy) === TileType.DOOR) {
          b.doors.add(tileKey(cx + dx, cy + dy))
        }
      }
    }
    for (const d of b.doors) tileToBuilding.set(d, b.id)
  }

  return { buildings, tileToBuilding }
}

/**
 * Building the given tile position belongs to (interior/roofed tile or the
 * building's door tile), or -1 when outside.
 */
export function buildingAt(index: BuildingIndex, tx: number, ty: number): number {
  return index.tileToBuilding.get(tileKey(Math.floor(tx), Math.floor(ty))) ?? -1
}
