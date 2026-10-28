// Pure survival stats (Milestone 3): hunger decay + starvation damage,
// sprint stamina drain/regen with an exhaustion latch, and consumable use.
//
// The scene calls tickSurvival once per frame with the world dt and the
// resolved sprint flag (Shift held AND not sprint-exhausted), and calls
// applyItem when the player uses a consumable. The scene skips the tick
// (passes dt 0) while the world is frozen — pause, death, or casual mode's
// hunger freeze (C32).

import {
  type PlayerState,
  MAX_HEALTH,
  MAX_HUNGER,
  MAX_STAMINA,
} from '../world/Player'
import { getItem } from '../data/items'

export const HUNGER_DECAY_PER_S = 0.25 // ~1 per 4 s; full → starving in ~6.5 min
export const STARVATION_DAMAGE_PER_S = 2 // health loss per s while hunger is 0
export const SPRINT_DRAIN_PER_S = 30 // ~3.3 s of sprinting from full
export const STAMINA_REGEN_PER_S = 20
export const SPRINT_REENABLE_AT = 20 // latch clears once stamina regens here

export interface SurvivalTick {
  player: PlayerState
  starving: boolean
  exhausted: boolean
}

const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, v))

export function tickSurvival(
  player: PlayerState,
  dt: number,
  sprinting: boolean,
): SurvivalTick {
  // Hunger always decays; starvation drains health once it hits 0.
  const hunger = clamp(player.hunger - HUNGER_DECAY_PER_S * dt, 0, MAX_HUNGER)
  const starving = hunger <= 0
  const health = starving
    ? clamp(player.health - STARVATION_DAMAGE_PER_S * dt, 0, MAX_HEALTH)
    : player.health

  // Stamina drains while sprinting, otherwise regens. The exhaustion latch
  // stays set from 0 until stamina regens to SPRINT_REENABLE_AT (hysteresis
  // so the sprint gate never flickers at the boundary).
  const stamina = sprinting
    ? clamp(player.stamina - SPRINT_DRAIN_PER_S * dt, 0, MAX_STAMINA)
    : clamp(player.stamina + STAMINA_REGEN_PER_S * dt, 0, MAX_STAMINA)
  let exhausted = player.sprintExhausted
  if (exhausted) {
    if (stamina >= SPRINT_REENABLE_AT) exhausted = false
  } else if (sprinting && stamina <= 0) {
    exhausted = true
  }

  return {
    player: { ...player, health, hunger, stamina, sprintExhausted: exhausted },
    starving,
    exhausted,
  }
}

export function applyItem(player: PlayerState, itemId: string): PlayerState {
  const item = getItem(itemId)
  if (!item) return player
  return {
    ...player,
    hunger: clamp(player.hunger + item.hungerRestore, 0, MAX_HUNGER),
    health: clamp(player.health + item.healthRestore, 0, MAX_HEALTH),
  }
}
