// Pure hotbar item use (Milestone 3). Combines Inventory + StatsSystem:
// consume one consumable from a slot and apply its restores. Carry-only
// items (tools, resources) are not consumed — M3 has no combat or crafting.

import { type Inventory, useAt } from '../world/Inventory'
import { type PlayerState } from '../world/Player'
import { applyItem } from './StatsSystem'
import { getItem } from '../data/items'

export type ItemUseEvent = 'first.eat' | 'first.heal'

export interface HotbarUse {
  player: PlayerState
  consumed: boolean
  event: ItemUseEvent | null
}

export function useHotbarSlot(
  inv: Inventory,
  player: PlayerState,
  index: number,
): HotbarUse {
  const slot = inv[index]
  if (!slot) return { player, consumed: false, event: null }
  const item = getItem(slot.itemId)
  if (!item || (item.hungerRestore <= 0 && item.healthRestore <= 0)) {
    return { player, consumed: false, event: null } // carry-only: untouched
  }
  useAt(inv, index)
  const event: ItemUseEvent =
    item.hungerRestore > 0 ? 'first.eat' : 'first.heal'
  return { player: applyItem(player, item.id), consumed: true, event }
}
