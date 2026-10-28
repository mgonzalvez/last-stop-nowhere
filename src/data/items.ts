// Item catalog (Milestone 3). Flat data — no inheritance, no nesting.
// Tool/resource items are carry-only in M3 (no use); combat and crafting
// are later phases. C25 landed the consumables; C27 completes the catalog.

export type ItemCategory = 'food' | 'medical' | 'tool' | 'resource'

export interface ItemDef {
  id: string
  name: string
  category: ItemCategory
  maxStack: number
  hungerRestore: number // 0 if the item does not restore hunger
  healthRestore: number // 0 if the item does not restore health
}

export const ITEMS: readonly ItemDef[] = [
  // Food (maxStack 10)
  { id: 'canned_soup', name: 'Canned soup', category: 'food', maxStack: 10, hungerRestore: 40, healthRestore: 0 },
  { id: 'canned_food', name: 'Canned food', category: 'food', maxStack: 10, hungerRestore: 30, healthRestore: 0 },
  { id: 'water', name: 'Water bottle', category: 'food', maxStack: 10, hungerRestore: 15, healthRestore: 0 },
  // Medical (maxStack 5)
  { id: 'bandage', name: 'Bandage', category: 'medical', maxStack: 5, hungerRestore: 0, healthRestore: 25 },
  { id: 'painkiller', name: 'Painkillers', category: 'medical', maxStack: 5, hungerRestore: 0, healthRestore: 50 },
  // Tools (maxStack 1, carry-only in M3)
  { id: 'kitchen_knife', name: 'Kitchen knife', category: 'tool', maxStack: 1, hungerRestore: 0, healthRestore: 0 },
  { id: 'flashlight', name: 'Flashlight', category: 'tool', maxStack: 1, hungerRestore: 0, healthRestore: 0 },
  { id: 'crowbar', name: 'Crowbar', category: 'tool', maxStack: 1, hungerRestore: 0, healthRestore: 0 },
  { id: 'hammer', name: 'Hammer', category: 'tool', maxStack: 1, hungerRestore: 0, healthRestore: 0 },
  { id: 'baseball_bat', name: 'Baseball bat', category: 'tool', maxStack: 1, hungerRestore: 0, healthRestore: 0 },
  // Resources (maxStack 10, carry-only in M3)
  { id: 'nails', name: 'Nails', category: 'resource', maxStack: 10, hungerRestore: 0, healthRestore: 0 },
  { id: 'planks', name: 'Wooden planks', category: 'resource', maxStack: 10, hungerRestore: 0, healthRestore: 0 },
  { id: 'duct_tape', name: 'Duct tape', category: 'resource', maxStack: 10, hungerRestore: 0, healthRestore: 0 },
  { id: 'batteries', name: 'Batteries', category: 'resource', maxStack: 10, hungerRestore: 0, healthRestore: 0 },
]

const BY_ID = new Map(ITEMS.map((item) => [item.id, item]))

export function getItem(id: string): ItemDef | undefined {
  return BY_ID.get(id)
}

/** Starting inventory (per brief §8): one of each. */
export const STARTING_ITEMS: ReadonlyArray<readonly [string, number]> = [
  ['kitchen_knife', 1],
  ['canned_soup', 1],
  ['bandage', 1],
  ['flashlight', 1],
  ['water', 1],
]
