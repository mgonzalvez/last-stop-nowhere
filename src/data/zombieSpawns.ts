/**
 * Fixed zombie spawn points (Milestone 2). Integer tile coords; the spawn
 * tile must be passable (verified by tests). Handcrafted — no procedural
 * placement in M2.
 */
export const ZOMBIE_SPAWNS: ReadonlyArray<readonly [number, number]> = [
  [8, 25], // west, south of the street
  [12, 18], // between houses 1 and 2
  [23, 15], // between houses 2 and 3
  [38, 16], // northeast meadow
  [36, 20], // corner by the intersection
  [40, 35], // south of the store
  [8, 38], // southwest
]

/** World seed for zombie AI determinism (M2). */
export const ZOMBIE_SEED = 1337
