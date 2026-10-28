// Pure combat logic (Milestone 4). No Phaser. GameScene wires the click
// input, FX, and noise; this module answers "what hits, with what, for how
// much." All functions are deterministic and unit-tested.

import { getItem, isWeapon } from '../data/items'
import { ZOMBIE_SEED } from '../data/zombieSpawns'
import { mulberry32 } from './Rng'
import type { PassableFn } from './Pathfinding'
import type { PlayerState } from '../world/Player'
import type { ZombieState } from '../world/Zombie'
import type { Inventory } from '../world/Inventory'

export const UNARMED_DAMAGE = 5 // bare hands: weak, but they never break
/** Groovy mode (G): weapon damage ×2. Bare hands stay exactly as they were. */
export const GROOVY_DAMAGE_MULT = 2

// Hit reaction (M4 C35).
export const HIT_STAGGER_S = 0.4 // frozen: no decisions, movement, attacks
export const HIT_KNOCKBACK_TILES = 0.5
export const ATTACK_AIM_RADIUS = 1.0 // zombie center within this of the click
export const ATTACK_REACH = 1.5 // zombie within this of the player
export const ATTACK_COOLDOWN_S = 0.7 // between swings (no full-auto)
export const ZOMBIE_HEALTH_MIN = 30
export const ZOMBIE_HEALTH_SPREAD = 31 // → 30..60

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

/**
 * Seeded zombie health: 30–60, reproducible per spawn id (determinism per
 * PLAN M4: a fixed seed reproduces the exact same neighborhood).
 */
export function zombieHealth(id: number): number {
  return ZOMBIE_HEALTH_MIN + Math.floor(mulberry32(ZOMBIE_SEED + 1000 + id)() * ZOMBIE_HEALTH_SPREAD)
}

/**
 * Click targeting: the zombie whose center is within ATTACK_AIM_RADIUS of
 * the click AND within ATTACK_REACH of the player; closest to the click
 * wins. null when nothing qualifies.
 */
export function pickAttackTarget(
  player: PlayerState,
  zombies: readonly ZombieState[],
  clickX: number,
  clickY: number,
): ZombieState | null {
  let best: ZombieState | null = null
  let bestDist = Infinity
  for (const z of zombies) {
    const dClick = Math.hypot(z.x - clickX, z.y - clickY)
    if (dClick > ATTACK_AIM_RADIUS) continue
    const dPlayer = Math.hypot(z.x - player.x, z.y - player.y)
    if (dPlayer > ATTACK_REACH) continue
    if (dClick < bestDist) {
      best = z
      bestDist = dClick
    }
  }
  return best
}

export interface HitResult {
  health: number
  dead: boolean
  knocked: boolean // false when the knockback tile was impassable
}

export interface SwingCostResult {
  broken: boolean
  itemId: string | null // the broken weapon's id (null otherwise)
}

/**
 * Durability cost of a swing: −1 per swing. At 0 the weapon is removed from
 * its slot (it breaks) and reported; the next swing re-resolves the held
 * weapon (heldWeapon scans slot order), so the fallback is automatic.
 */
export function applySwingCost(inv: Inventory, slot: number): SwingCostResult {
  const s = inv[slot]
  if (!s || s.durability === undefined) {
    return { broken: false, itemId: null }
  }
  s.durability -= 1
  if (s.durability <= 0) {
    inv[slot] = null
    return { broken: true, itemId: s.itemId }
  }
  return { broken: false, itemId: null }
}

/**
 * Apply a hit: damage + stagger + knockback 0.5 tiles away from the
 * attacker (skipped when the target tile is impassable). Mutates z.
 */
export function applyHit(
  z: ZombieState,
  damage: number,
  fromX: number,
  fromY: number,
  passable?: PassableFn,
): HitResult {
  z.health -= damage
  z.staggerS = HIT_STAGGER_S
  let knocked = false
  const dx = z.x - fromX
  const dy = z.y - fromY
  const len = Math.hypot(dx, dy)
  if (len > 0.001) {
    const nx = z.x + (dx / len) * HIT_KNOCKBACK_TILES
    const ny = z.y + (dy / len) * HIT_KNOCKBACK_TILES
    if (!passable || passable(Math.round(nx), Math.round(ny))) {
      z.x = nx
      z.y = ny
      knocked = true
    }
  }
  return { health: z.health, dead: z.health <= 0, knocked }
}
