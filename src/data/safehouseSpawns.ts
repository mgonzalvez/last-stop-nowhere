// Safehouse improvement slots (Milestone 5). Fixed hand-authored tiles,
// keyed by door tile (stable map coordinates) — building ids are resolved
// at runtime via BuildingIndex. No free placement (brief §9: no arbitrary
// architectural construction).

export type ImprovementId = 'workbench' | 'barricade' | 'storage' | 'sleeping'

export interface ImprovementDef {
  id: ImprovementId
  name: string
  /** itemId -> qty consumed on build (from the player's inventory). */
  cost: Readonly<Record<string, number>>
  /** Barricades require the workbench to be built first. */
  requiresWorkbench: boolean
}

export const IMPROVEMENTS: Record<ImprovementId, ImprovementDef> = {
  workbench: {
    id: 'workbench',
    name: 'Workbench',
    cost: { planks: 2, nails: 1 },
    requiresWorkbench: false,
  },
  barricade: {
    id: 'barricade',
    name: 'Door barricade',
    cost: { planks: 2, nails: 1 },
    requiresWorkbench: true,
  },
  storage: {
    id: 'storage',
    name: 'Storage container',
    cost: { planks: 1, duct_tape: 1 },
    requiresWorkbench: false,
  },
  sleeping: {
    id: 'sleeping',
    name: 'Sleeping area',
    cost: { planks: 1, duct_tape: 1 },
    requiresWorkbench: false,
  },
}

export interface SafehouseSlots {
  /** The building's door tile — the claim anchor. */
  door: readonly [number, number]
  workbench: readonly [number, number]
  storage: readonly [number, number]
  bed: readonly [number, number]
}

/**
 * The four claimable buildings (house 1/2/3, corner store). House interiors
 * are 4x4 (x0+1..x0+4, rows 15–18); the store interior is 6x6 (x39–44,
 * rows 27–32). Slots sit at interior corners, clear of loot containers.
 */
export const SAFEHOUSE_SLOTS: readonly SafehouseSlots[] = [
  { door: [9, 19], workbench: [7, 15], storage: [7, 18], bed: [10, 15] }, // house 1
  { door: [19, 19], workbench: [17, 15], storage: [17, 18], bed: [20, 15] }, // house 2
  { door: [29, 19], workbench: [27, 15], storage: [27, 18], bed: [30, 15] }, // house 3
  { door: [41, 26], workbench: [39, 27], storage: [44, 27], bed: [39, 32] }, // corner store
]
