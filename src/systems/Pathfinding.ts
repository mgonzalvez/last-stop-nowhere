/**
 * A* over a tile grid (Milestone 2). Pure — takes a passability predicate
 * (callers use WorldMap.isPassable), so tests can use synthetic grids.
 * 4-directional, deterministic (FIFO tie-break), bounded node budget.
 */
export type PassableFn = (x: number, y: number) => boolean

const DIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

/**
 * Returns waypoints from `from` to `to` (start excluded, goal included),
 * or null when the goal is blocked / unreachable / budget exceeded.
 * maxNodes = how many tiles may be expanded before giving up.
 */
export function findPath(
  passable: PassableFn,
  from: readonly [number, number],
  to: readonly [number, number],
  maxNodes = 512,
): Array<readonly [number, number]> | null {
  if (!passable(to[0], to[1])) return null
  if (from[0] === to[0] && from[1] === to[1]) return []

  // Grid is 48x48; key stride 64 keeps keys unique and compact.
  const key = (x: number, y: number) => y * 64 + x
  const h = (x: number, y: number) =>
    Math.abs(x - to[0]) + Math.abs(y - to[1])

  const gScore = new Map<number, number>()
  const cameFrom = new Map<number, readonly [number, number]>()
  const open: Array<[number, number]> = [[from[0], from[1]]]
  gScore.set(key(from[0], from[1]), 0)

  let expansions = 0
  while (open.length > 0) {
    // Pop the lowest f = g + h. Tie-break: larger g (closer to the goal),
    // which keeps the search narrow across open terrain.
    let bestIdx = 0
    let bestF = Infinity
    let bestG = -1
    for (let i = 0; i < open.length; i++) {
      const [x, y] = open[i]
      const g = gScore.get(key(x, y)) ?? Infinity
      const f = g + h(x, y)
      if (f < bestF || (f === bestF && g > bestG)) {
        bestF = f
        bestG = g
        bestIdx = i
      }
    }
    const [cx, cy] = open.splice(bestIdx, 1)[0]

    if (cx === to[0] && cy === to[1]) {
      // Walk goal -> start; stop before pushing the start itself, so the
      // result excludes the start and includes the goal.
      const path: Array<readonly [number, number]> = [[cx, cy]]
      let k = key(cx, cy)
      while (cameFrom.has(k)) {
        const p = cameFrom.get(k)!
        if (p[0] === from[0] && p[1] === from[1]) break
        path.push(p)
        k = key(p[0], p[1])
      }
      return path.reverse()
    }

    expansions++
    if (expansions > maxNodes) return null

    const cg = gScore.get(key(cx, cy))!
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx
      const ny = cy + dy
      if (!passable(nx, ny)) continue
      const nk = key(nx, ny)
      const ng = cg + 1
      if (ng < (gScore.get(nk) ?? Infinity)) {
        gScore.set(nk, ng)
        cameFrom.set(nk, [cx, cy])
        if (!open.some(([px, py]) => px === nx && py === ny)) {
          open.push([nx, ny])
        }
      }
    }
  }
  return null
}
