/**
 * Line of sight over the tile grid (Milestone 2). Pure — takes a
 * passability predicate. A tile blocks sight when it is not passable
 * (walls, windows, fences, trees, cars). Doors are passable -> sight
 * through an open door.
 *
 * Diagonal steps never "cut corners": when both x and y change, the two
 * edge tiles of the step are blocked as well.
 */
export function losClear(
  passable: (x: number, y: number) => boolean,
  from: readonly [number, number],
  to: readonly [number, number],
): boolean {
  if (from[0] === to[0] && from[1] === to[1]) return true

  let x0 = from[0]
  let y0 = from[1]
  const x1 = to[0]
  const y1 = to[1]
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x1 > x0 ? 1 : -1
  const sy = y1 > y0 ? 1 : -1
  let err = dx - dy

  while (!(x0 === x1 && y0 === y1)) {
    const ox = x0
    const oy = y0
    const e2 = 2 * err
    if (e2 > -dy) {
      x0 += sx
      err -= dy
    }
    if (e2 < dx) {
      y0 += sy
      err += dx
    }
    if (!passable(x0, y0)) return false
    if (x0 !== ox && y0 !== oy) {
      // diagonal step: block the two corner tiles too
      if (!passable(x0, oy) || !passable(ox, y0)) return false
    }
  }
  return true
}
