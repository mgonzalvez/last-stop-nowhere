// Weighted loot tables by container location (Milestone 3). Kitchen is
// food-heavy, the corner store is varied, the yard is resource-heavy.
// Weights are relative (not percentages); each table totals 100.

import type { ContainerLocation } from './lootContainerSpawns'

export interface LootEntry {
  id: string
  weight: number
}

export const LOOT_TABLES: Record<ContainerLocation, readonly LootEntry[]> = {
  kitchen: [
    { id: 'canned_soup', weight: 30 },
    { id: 'canned_food', weight: 30 },
    { id: 'water', weight: 20 },
    { id: 'bandage', weight: 10 },
    { id: 'painkiller', weight: 5 },
    { id: 'planks', weight: 5 },
  ],
  store: [
    { id: 'canned_soup', weight: 12 },
    { id: 'canned_food', weight: 10 },
    { id: 'water', weight: 12 },
    { id: 'bandage', weight: 12 },
    { id: 'painkiller', weight: 7 },
    { id: 'crowbar', weight: 7 },
    { id: 'batteries', weight: 4 },
    { id: 'planks', weight: 14 }, // hardware corner (M5)
    { id: 'duct_tape', weight: 12 }, // hardware corner (M5)
    { id: 'nails', weight: 10 }, // hardware corner (M5)
  ],
  yard: [
    { id: 'nails', weight: 25 },
    { id: 'planks', weight: 25 },
    { id: 'duct_tape', weight: 20 },
    { id: 'crowbar', weight: 15 },
    { id: 'canned_food', weight: 10 },
    { id: 'batteries', weight: 5 },
  ],
}
