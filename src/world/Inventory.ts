// Authoritative inventory state (Milestone 3). 16 fixed slots; each slot
// holds one item type with a qty, capped by the item's maxStack. null =
// empty slot. Mutated in place (world state, like Zombie); the scene reads
// it for the overlay and hotbar.

import { getItem, isWeapon } from '../data/items'

export const INVENTORY_SIZE = 16

export interface InventorySlot {
  itemId: string
  qty: number
  durability?: number // weapons only (M4): hits left; undefined = unbreakable
}

export type Inventory = (InventorySlot | null)[]

/** Create an empty (or pre-filled) 16-slot inventory. */
export function createInventory(
  entries: ReadonlyArray<readonly [string, number]> = [],
): Inventory {
  const inv: Inventory = new Array(INVENTORY_SIZE).fill(null)
  for (const [itemId, qty] of entries) add(inv, itemId, qty)
  return inv
}

/**
 * Add qty of an item: first fill existing stacks of that item with room,
 * then new empty slots. Returns the undelivered (dropped) count.
 */
export function add(inv: Inventory, itemId: string, qty: number): number {
  const item = getItem(itemId)
  if (!item || qty <= 0) return qty
  let remaining = qty
  for (const slot of inv) {
    if (remaining <= 0) break
    if (slot && slot.itemId === itemId && slot.qty < item.maxStack) {
      const take = Math.min(item.maxStack - slot.qty, remaining)
      slot.qty += take
      remaining -= take
    }
  }
  for (let i = 0; i < inv.length && remaining > 0; i++) {
    if (inv[i] === null) {
      const take = Math.min(item.maxStack, remaining)
      inv[i] = isWeapon(item)
        ? { itemId, qty: take, durability: item.maxDurability }
        : { itemId, qty: take }
      remaining -= take
    }
  }
  return remaining
}

/** Consume one from the slot; returns the itemId, or null if empty. */
export function useAt(inv: Inventory, index: number): string | null {
  const slot = inv[index]
  if (!slot) return null
  slot.qty -= 1
  if (slot.qty <= 0) inv[index] = null
  return slot.itemId
}

/** Remove up to qty from the slot; returns how many were removed. */
export function removeAt(inv: Inventory, index: number, qty = 1): number {
  const slot = inv[index]
  if (!slot) return 0
  const take = Math.min(qty, slot.qty)
  slot.qty -= take
  if (slot.qty <= 0) inv[index] = null
  return take
}

/** Number of occupied slots. */
export function slotCount(inv: Inventory): number {
  return inv.reduce((n, s) => n + (s ? 1 : 0), 0)
}

/** Total quantity of one item across all slots. */
export function countItem(inv: Inventory, itemId: string): number {
  return inv.reduce((n, s) => n + (s && s.itemId === itemId ? s.qty : 0), 0)
}

/** Remove up to qty of an item across slots; returns how many removed. */
export function removeItem(inv: Inventory, itemId: string, qty: number): number {
  let removed = 0
  for (let i = 0; i < inv.length && removed < qty; i++) {
    const slot = inv[i]
    if (slot && slot.itemId === itemId) {
      const take = Math.min(slot.qty, qty - removed)
      slot.qty -= take
      removed += take
      if (slot.qty <= 0) inv[i] = null
    }
  }
  return removed
}
