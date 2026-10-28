// World state: tile grid + passability. Authoritative, Phaser-free.
import { TileType } from './TileTypes'
import { buildMap, MAP_W, MAP_H, type Grid } from './MapData'

export const MAP_SIZE = { w: MAP_W, h: MAP_H }

const PASSABLE: Record<TileType, boolean> = {
  [TileType.GRASS]: true,
  [TileType.ROAD]: true,
  [TileType.SIDEWALK]: true,
  [TileType.WOOD_FLOOR]: true,
  [TileType.DOOR]: true,
  [TileType.WALL_IN]: false,
  [TileType.WALL_OUT]: false,
  [TileType.WINDOW]: false,
  [TileType.FENCE]: false,
  [TileType.TREE]: false,
  [TileType.CAR]: false,
}

export class WorldMap {
  readonly grid: Grid

  constructor() {
    this.grid = buildMap()
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < MAP_W && y < MAP_H
  }

  /** Out-of-bounds reads as a solid wall so callers never special-case it. */
  getTile(x: number, y: number): TileType {
    return this.inBounds(x, y) ? this.grid[y][x] : TileType.WALL_OUT
  }

  isPassable(x: number, y: number): boolean {
    return this.inBounds(x, y) && PASSABLE[this.grid[y][x]]
  }

  /**
   * Roof tiles: every building tile (walls, floors) gets a roof; door and
   * window tiles are facade openings and never roofed. Orientation-free.
   * Returns y*MAP_W + x indices.
   */
  roofTiles(): Set<number> {
    if (!this._roofs) {
      const isRoofed = (t: TileType) =>
        t === TileType.WALL_OUT || t === TileType.WALL_IN || t === TileType.WOOD_FLOOR
      this._roofs = new Set<number>()
      for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
          if (isRoofed(this.grid[y][x])) {
            this._roofs.add(y * MAP_W + x)
          }
        }
      }
    }
    return this._roofs
  }

  private _roofs?: Set<number>
}

/** Shared authoritative map instance for the running game. */
export const worldMap = new WorldMap()
