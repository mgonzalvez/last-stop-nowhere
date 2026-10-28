// Item catalog (Milestone 3). Flat data — no inheritance, no nesting.
// C25 lands the consumables (food/medical); C27 adds tool/resource items.

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
  { id: 'canned_soup', name: 'Canned soup', category: 'food', maxStack: 10, hungerRestore: 40, healthRestore: 0 },
  { id: 'canned_food', name: 'Canned food', category: 'food', maxStack: 10, hungerRestore: 30, healthRestore: 0 },
  { id: 'water', name: 'Water bottle', category: 'food', maxStack: 10, hungerRestore: 15, healthRestore: 0 },
  { id: 'bandage', name: 'Bandage', category: 'medical', maxStack: 5, hungerRestore: 0, healthRestore: 25 },
  { id: 'painkiller', name: 'Painkillers', category: 'medical', maxStack: 5, hungerRestore: 0, healthRestore: 50 },
]

const BY_ID = new Map(ITEMS.map((item) => [item.id, item]))

export function getItem(id: string): ItemDef | undefined {
  return BY_ID.get(id)
}
