// Pure loot rolls (Milestone 3). Every roll runs through a seeded RNG
// (mulberry32), so a fixed seed reproduces the exact same neighborhood
// haul — unit-proven in tests.

import { mulberry32 } from './Rng'
import {
  LOOT_SEED,
  type ContainerLocation,
} from '../data/lootContainerSpawns'
import { LOOT_TABLES, type LootEntry } from '../data/lootTables'
import { type LootContainerState } from '../world/LootContainer'
import { type Inventory, add } from '../world/Inventory'

export const LOOT_MIN_ITEMS = 3
export const LOOT_MAX_ITEMS = 5

export interface LootDrop {
  itemId: string
  qty: number
}

/** Weighted pick from a table (all weights > 0). */
export function weightedPick(
  entries: readonly LootEntry[],
  rng: () => number,
): string {
  const total = entries.reduce((n, e) => n + e.weight, 0)
  let roll = rng() * total
  for (const e of entries) {
    roll -= e.weight
    if (roll < 0) return e.id
  }
  return entries[entries.length - 1].id
}

/** Roll `count` weighted picks, merged into stack entries. */
export function rollLoot(
  table: readonly LootEntry[],
  count: number,
  rng: () => number,
): LootDrop[] {
  const merged = new Map<string, number>()
  for (let i = 0; i < count; i++) {
    const id = weightedPick(table, rng)
    merged.set(id, (merged.get(id) ?? 0) + 1)
  }
  return [...merged.entries()].map(([itemId, qty]) => ({ itemId, qty }))
}

/**
 * Full deterministic roll for a container: 3–5 items from its location's
 * table, seeded by (LOOT_SEED + containerId).
 */
export function rollContainerLoot(
  location: ContainerLocation,
  containerId: number,
): LootDrop[] {
  const rng = mulberry32(LOOT_SEED + containerId)
  const count =
    LOOT_MIN_ITEMS + Math.floor(rng() * (LOOT_MAX_ITEMS - LOOT_MIN_ITEMS + 1))
  return rollLoot(LOOT_TABLES[location], count, rng)
}

export interface OpenResult {
  drops: LootDrop[]
  /** Total qty lost to a full inventory. */
  lost: number
}

/**
 * Open a container: roll its (deterministic) loot, add it to the inventory
 * (overflow is lost), and mark it looted. A looted container returns empty —
 * no re-roll, ever.
 */
export function openContainerLoot(
  container: LootContainerState,
  inv: Inventory,
): OpenResult {
  if (container.looted) return { drops: [], lost: 0 }
  const drops = rollContainerLoot(container.location, container.id)
  let lost = 0
  for (const d of drops) lost += add(inv, d.itemId, d.qty)
  container.looted = true
  return { drops, lost }
}
