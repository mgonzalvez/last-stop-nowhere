// Depth rules: higher = drawn in front. Base depth grows with (tileX + tileY),
// which is the viewer's "distance" in isometric space. Small offsets order
// sprites that share a tile (roof floats above the tile it covers).
export function depthFor(tileX: number, tileY: number, offset = 0): number {
  return (tileX + tileY) * 10 + offset
}
