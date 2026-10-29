// Safehouse state (Milestone 5). Pure TS — no Phaser. GameScene renders
// prompts/sprites from this state; claim/build logic is pure and
// unit-tested.

import {
  SAFEHOUSE_SLOTS,
  IMPROVEMENTS,
  type ImprovementId,
  type SafehouseSlots,
} from '../data/safehouseSpawns'
import { countItem, removeItem, type Inventory } from './Inventory'

export interface SafehouseState {
  /** Claimed building's door tile as "x,y"; null = unclaimed. One per run. */
  claimedDoor: string | null
  /** Improvements built in the claimed building. */
  built: Set<ImprovementId>
}

export function createSafehouse(): SafehouseState {
  return { claimedDoor: null, built: new Set() }
}

/** Fixed slot entry for a door tile, or null when it isn't a building door. */
export function safehouseSlotAt(
  door: readonly [number, number],
): SafehouseSlots | null {
  return (
    SAFEHOUSE_SLOTS.find(
      (s) => s.door[0] === door[0] && s.door[1] === door[1],
    ) ?? null
  )
}

/**
 * Claim a building by its door tile. One claim per run; a second claim is a
 * no-op and a non-building door fails. Returns true when the claim landed.
 */
export function claim(
  safehouse: SafehouseState,
  door: readonly [number, number],
): boolean {
  if (safehouse.claimedDoor !== null) return false
  if (!safehouseSlotAt(door)) return false
  safehouse.claimedDoor = door[0] + ',' + door[1]
  return true
}

/** The claimed building's slots, or null when unclaimed. */
export function safehouseSlots(
  safehouse: SafehouseState,
): SafehouseSlots | null {
  if (!safehouse.claimedDoor) return null
  const [x, y] = safehouse.claimedDoor.split(',').map(Number)
  return safehouseSlotAt([x, y])
}

/** The tile an improvement is built on (the barricade is built at the door). */
export function slotTile(
  slots: SafehouseSlots,
  id: ImprovementId,
): readonly [number, number] {
  switch (id) {
    case 'workbench':
      return slots.workbench
    case 'storage':
      return slots.storage
    case 'sleeping':
      return slots.bed
    case 'barricade':
      return slots.door
  }
}

/** The claimed building's barricaded door tile, or null when unbuilt. */
export function barricadedDoor(
  state: SafehouseState,
): readonly [number, number] | null {
  if (!state.claimedDoor || !state.built.has('barricade')) return null
  const [x, y] = state.claimedDoor.split(',').map(Number)
  return [x, y]
}

export type BuildReason =
  | 'ok'
  | 'unclaimed'
  | 'already-built'
  | 'needs-workbench'
  | 'missing-resources'

/** Why (not) an improvement can be built right now (C41). */
export function canBuild(
  safehouse: SafehouseState,
  inv: Inventory,
  id: ImprovementId,
): BuildReason {
  if (!safehouse.claimedDoor) return 'unclaimed'
  if (safehouse.built.has(id)) return 'already-built'
  const def = IMPROVEMENTS[id]
  if (def.requiresWorkbench && !safehouse.built.has('workbench')) {
    return 'needs-workbench'
  }
  for (const [itemId, qty] of Object.entries(def.cost)) {
    if (countItem(inv, itemId) < qty) return 'missing-resources'
  }
  return 'ok'
}

/**
 * Build an improvement: pay its recipe from the inventory and set the flag.
 * Refuses (and pays nothing) when canBuild !== 'ok'.
 */
export function build(
  safehouse: SafehouseState,
  inv: Inventory,
  id: ImprovementId,
): boolean {
  if (canBuild(safehouse, inv, id) !== 'ok') return false
  for (const [itemId, qty] of Object.entries(IMPROVEMENTS[id].cost)) {
    removeItem(inv, itemId, qty)
  }
  safehouse.built.add(id)
  return true
}
