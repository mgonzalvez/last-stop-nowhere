// Logical tile types. Artwork is decided elsewhere; passability lives in WorldMap.
export enum TileType {
  GRASS = 0,
  ROAD,
  SIDEWALK,
  WOOD_FLOOR,
  WALL_IN, // interior partition (reserved for later map variations)
  WALL_OUT,
  DOOR, // wall tile that is passable
  WINDOW, // wall tile that blocks
  FENCE,
  TREE, // static scenery, blocks
  CAR, // static abandoned vehicle, blocks
}
