// Safehouse state (Milestone 5). Pure TS — no Phaser. GameScene renders
// prompts/sprites from this state; claim/build logic is pure and
// unit-tested.

import {
  SAFEHOUSE_SLOTS,
  type ImprovementId,
  type SafehouseSlots,
} from '../data/safehouseSpawns'

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
