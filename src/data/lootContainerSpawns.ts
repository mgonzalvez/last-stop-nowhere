/**
 * Fixed loot containers (Milestone 3). Integer tile coords; container tiles
 * must be passable (verified by tests). Handcrafted — no procedural placement
 * in M3.
 *
 * Location types drive the weighted loot tables (lootTables.ts, C31):
 * kitchen = house interior, store = corner store interior, yard = outdoor.
 */
export type ContainerLocation = 'kitchen' | 'store' | 'yard'

export interface ContainerSpawn {
  x: number
  y: number
  location: ContainerLocation
}

export const LOOT_CONTAINERS: readonly ContainerSpawn[] = [
  { x: 8, y: 16, location: 'kitchen' }, // house 1 interior
  { x: 18, y: 16, location: 'kitchen' }, // house 2 interior
  { x: 28, y: 16, location: 'kitchen' }, // house 3 interior
  { x: 40, y: 30, location: 'store' }, // corner store interior
  { x: 43, y: 30, location: 'store' }, // corner store interior
  { x: 36, y: 24, location: 'yard' }, // outdoor, west of the store
]

/** World seed for loot-roll determinism (M3). */
export const LOOT_SEED = 2026
