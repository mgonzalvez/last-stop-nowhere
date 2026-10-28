// Authoritative loot-container state (Milestone 3). Fixed positions from
// data; each container is looted exactly once (C31).

import {
  LOOT_CONTAINERS,
  type ContainerLocation,
} from '../data/lootContainerSpawns'

/** Search distance in tiles. */
export const CONTAINER_INTERACT_RANGE = 1.0

export interface LootContainerState {
  id: number
  x: number // tile space (int)
  y: number // tile space (int)
  location: ContainerLocation
  looted: boolean
}

export function createLootContainers(): LootContainerState[] {
  return LOOT_CONTAINERS.map((c, i) => ({
    id: i,
    x: c.x,
    y: c.y,
    location: c.location,
    looted: false,
  }))
}
