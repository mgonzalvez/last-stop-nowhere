// Pure combat logic (Milestone 4). No Phaser. GameScene wires the click
// input, FX, and noise; this module answers "what hits, with what, for how
// much." All functions are deterministic and unit-tested.

import { getItem, isWeapon } from '../data/items'
import type { Inventory } from '../world/Inventory'

export const UNARMED_DAMAGE = 5 // bare hands: weak, but they never break
/** Groovy mode (G): weapon damage ×2. Bare hands stay exactly as they were. */
export const GROOVY_DAMAGE_MULT = 2

export interface HeldWeapon {
  itemId: string
  slot: number
  damage: number // base damage, before any groovy multiplier
}

/**
 * The held weapon is the first weapon found in slot order — deterministic,
 * zero UI. null when the inventory holds no weapon.
 */
export function heldWeapon(inv: Inventory): HeldWeapon | null {
  for (let i = 0; i < inv.length; i++) {
    const slot = inv[i]
    if (!slot) continue
    const item = getItem(slot.itemId)
    if (item && isWeapon(item)) {
      return { itemId: item.id, slot: i, damage: item.damage }
    }
  }
  return null
}

export interface SwingResult {
  damage: number
  itemId: string | null // null = bare hands
  slot: number | null
}

/**
 * The damage of the next swing: held weapon (× GROOVY_DAMAGE_MULT in groovy
 * mode) or bare hands. Groovy never touches unarmed damage.
 */
export function swingDamage(inv: Inventory, groovy = false): SwingResult {
  const w = heldWeapon(inv)
  if (!w) return { damage: UNARMED_DAMAGE, itemId: null, slot: null }
  return {
    damage: w.damage * (groovy ? GROOVY_DAMAGE_MULT : 1),
    itemId: w.itemId,
    slot: w.slot,
  }
}
