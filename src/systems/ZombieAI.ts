/**
 * Zombie AI (Milestone 2). Pure logic, no Phaser. C18 covers IDLE/WANDER;
 * INVESTIGATE/CHASE/ATTACK land in C19-C21.
 *
 * Decisions run at a fixed 8 Hz (brief: 5-10 Hz); visible movement is
 * smooth per-frame path following. All choices go through the zombie's
 * seeded rng stream, so behavior is reproducible under a fixed seed.
 */
import { findPath, type PassableFn } from './Pathfinding'
import { losClear } from './LineOfSight'
import { tileToScreen, screenToTile } from '../world/IsoProjection'
import type { ZombieState } from '../world/Zombie'

/**
 * What the AI knows about the player this tick. The scene builds it;
 * casual mode is expressed as an absent player (casual = true).
 */
export interface ZombieContext {
  playerX: number
  playerY: number
  /** 0 when still or casual; 5 moving; 9 sprinting (C22). */
  noiseRadius: number
  /** Casual mode: zombies never detect or attack the player. */
  casual: boolean
}

/** AI decision rate (Hz). Pathfinding happens only on these ticks. */
export const DECISION_HZ = 8
const DECISION_STEP = 1 / DECISION_HZ

// Wander / idle tuning (Milestone 2 constants, see PLAN.md).
const WANDER_MIN = 3
const WANDER_MAX = 8
const IDLE_MIN = 1
const IDLE_MAX = 3
const WANDER_ATTEMPTS = 8
/** Investigate dwell once the LKP is reached (seconds). */
const INVESTIGATE_DWELL = 3
/** Sight: tiles within which a visible player is spotted. */
const DETECT_RANGE = 6
/** Seconds without LOS before a chase collapses into an investigation. */
const CHASE_TIMEOUT = 5
/** Melee: tiles within which the player takes hits. */
const ATTACK_RANGE = 0.9
/** Attack rhythm: windup, then damage per second (M2 constants). */
const ATTACK_WINDUP = 0.4
const ATTACK_DAMAGE = 12
const ATTACK_INTERVAL = 1

/**
 * Advance the zombie along its path for dt seconds. Movement is done in
 * screen space so speed (px/s) is exact, then converted back to tile
 * coords (screenToTile is the exact inverse of tileToScreen).
 */
function moveAlongPath(z: ZombieState, dt: number): void {
  let budget = z.speed * dt
  while (budget > 0 && z.path.length > 0) {
    const [tx, ty] = z.path[0]
    const s0 = tileToScreen(z.x, z.y)
    const s1 = tileToScreen(tx, ty)
    const dx = s1.x - s0.x
    const dy = s1.y - s0.y
    const len = Math.hypot(dx, dy)
    if (len < 0.001) {
      z.path.shift() // already on this waypoint
      continue
    }
    const step = Math.min(budget, len)
    const t = step / len
    const tile = screenToTile(s0.x + dx * t, s0.y + dy * t)
    z.x = tile.x
    z.y = tile.y
    budget -= step
    if (step >= len) z.path.shift() // reached the waypoint
  }
}

/** Pick a random reachable wander target 3-8 tiles away (seeded). */
function pickWanderTarget(z: ZombieState, passable: PassableFn): boolean {
  for (let attempt = 0; attempt < WANDER_ATTEMPTS; attempt++) {
    const ang = z.rng() * Math.PI * 2
    const dist = WANDER_MIN + z.rng() * (WANDER_MAX - WANDER_MIN)
    const tx = Math.round(z.x + Math.cos(ang) * dist)
    const ty = Math.round(z.y + Math.sin(ang) * dist)
    if (!passable(tx, ty)) continue
    const path = findPath(
      passable,
      [Math.round(z.x), Math.round(z.y)],
      [tx, ty],
    )
    if (path && path.length > 0) {
      z.path = path
      z.target = [tx, ty]
      return true
    }
  }
  return false
}

/** Path the zombie to a tile; returns false when unreachable. */
function repath(z: ZombieState, passable: PassableFn, tx: number, ty: number): boolean {
  const path = findPath(passable, [Math.round(z.x), Math.round(z.y)], [tx, ty])
  if (!path || path.length === 0) return false
  z.path = path
  z.target = [tx, ty]
  return true
}

/** C19: noise within range -> investigate the player's position. */
function noticeNoise(
  z: ZombieState,
  passable: PassableFn,
  ctx: ZombieContext,
): void {
  if (ctx.casual || ctx.noiseRadius <= 0) return
  if (z.state === 'CHASE' || z.state === 'ATTACK') return // C20/C21 priority
  const dist = Math.hypot(ctx.playerX - z.x, ctx.playerY - z.y)
  if (dist > ctx.noiseRadius) return

  const tx = Math.round(ctx.playerX)
  const ty = Math.round(ctx.playerY)
  if (z.state === 'INVESTIGATE') {
    // fresh noise while investigating: refresh the last known position
    if (!repath(z, passable, tx, ty)) z.stateTimer = INVESTIGATE_DWELL
    return
  }
  z.state = 'INVESTIGATE'
  z.stateTimer = INVESTIGATE_DWELL
  if (!repath(z, passable, tx, ty)) {
    // no path (or already on top of it): start the dwell immediately
    z.stateTimer = INVESTIGATE_DWELL
  }
}

/**
 * C20/C21: sense the player. Melee range -> ATTACK (priority over all);
 * visible in range -> CHASE, re-pathing at the decision rate.
 * Returns true when the player was in melee range or visible.
 */
function noticePlayer(
  z: ZombieState,
  passable: PassableFn,
  ctx: ZombieContext,
): boolean {
  if (ctx.casual) return false
  const dist = Math.hypot(ctx.playerX - z.x, ctx.playerY - z.y)
  const pt: [number, number] = [Math.round(ctx.playerX), Math.round(ctx.playerY)]

  if (dist <= ATTACK_RANGE) {
    // in melee: attack; the windup starts fresh only on entry
    z.lostSightTime = 0
    z.lastKnown = [pt[0], pt[1]]
    if (z.state !== 'ATTACK') {
      z.state = 'ATTACK'
      z.attackTimer = ATTACK_WINDUP
    }
    z.path = [] // stop walking; hold position on the player
    return true
  }
  if (dist > DETECT_RANGE) return false
  const zt: [number, number] = [Math.round(z.x), Math.round(z.y)]
  if (!losClear(passable, zt, pt)) return false

  z.lostSightTime = 0
  z.lastKnown = [pt[0], pt[1]]
  if (z.state !== 'CHASE') z.state = 'CHASE'
  // re-path toward the player at the decision rate (never per frame)
  if (z.x !== pt[0] || z.y !== pt[1]) repath(z, passable, pt[0], pt[1])
  return true
}

function decide(z: ZombieState, passable: PassableFn, ctx: ZombieContext): number {
  let damage = 0
  const visible = noticePlayer(z, passable, ctx)
  noticeNoise(z, passable, ctx)
  switch (z.state) {
    case 'IDLE':
      z.stateTimer -= DECISION_STEP
      if (z.stateTimer <= 0) {
        if (pickWanderTarget(z, passable)) {
          z.state = 'WANDER'
        } else {
          z.stateTimer = IDLE_MIN // no reachable target; retry soon
        }
      }
      break
    case 'WANDER':
      if (z.path.length === 0) {
        z.state = 'IDLE'
        z.target = null
        z.stateTimer = IDLE_MIN + z.rng() * (IDLE_MAX - IDLE_MIN)
      }
      break
    case 'INVESTIGATE':
      if (z.path.length === 0) {
        // arrived (or already there): dwell, then give up
        z.stateTimer -= DECISION_STEP
        if (z.stateTimer <= 0) {
          z.state = 'IDLE'
          z.target = null
          z.stateTimer = IDLE_MIN + z.rng() * (IDLE_MAX - IDLE_MIN)
        }
      }
      break
    case 'CHASE':
      if (!visible) z.lostSightTime += DECISION_STEP
      if (z.lostSightTime >= CHASE_TIMEOUT && z.lastKnown) {
        // player is gone: check the last place they were seen
        z.state = 'INVESTIGATE'
        z.stateTimer = INVESTIGATE_DWELL
        if (!repath(z, passable, z.lastKnown[0], z.lastKnown[1])) {
          z.path = [] // already there: dwell starts now
        }
        z.lastKnown = null
      }
      break
    case 'ATTACK': {
      // (visible + out of range is already handled by noticePlayer -> CHASE)
      const dist = Math.hypot(ctx.playerX - z.x, ctx.playerY - z.y)
      if (dist > ATTACK_RANGE) {
        // player slipped out of reach while invisible: go find them
        z.attackTimer = 0
        z.state = 'INVESTIGATE'
        z.stateTimer = INVESTIGATE_DWELL
        if (z.lastKnown && !repath(z, passable, z.lastKnown[0], z.lastKnown[1])) {
          z.path = []
        }
        z.lastKnown = null
        break
      }
      z.attackTimer -= DECISION_STEP
      if (z.attackTimer <= 0) {
        damage += ATTACK_DAMAGE
        z.attackTimer += ATTACK_INTERVAL
      }
      break
    }
    default:
      break
  }
  return damage
}

/**
 * Update one zombie: smooth per-frame path following plus fixed-rate
 * (8 Hz) decisions. Mutates z in place. Returns damage dealt to the
 * player this call (0 when none — the scene applies it).
 */
export function updateZombie(
  z: ZombieState,
  passable: PassableFn,
  dt: number,
  ctx: ZombieContext,
): number {
  let damage = 0
  moveAlongPath(z, dt)
  z.decisionAccum += dt
  while (z.decisionAccum >= DECISION_STEP) {
    z.decisionAccum -= DECISION_STEP
    damage += decide(z, passable, ctx)
  }
  return damage
}
