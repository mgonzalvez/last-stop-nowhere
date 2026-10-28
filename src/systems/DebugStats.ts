// Debug overlay text: pure formatting, no Phaser. Values are gathered by
// GameScene (fps, player tile/world coords, entity count, renderer mode).
export interface DebugStatsInput {
  fps: number
  tileX: number
  tileY: number
  worldX: number
  worldY: number
  entityCount: number
  renderer: string
  casual?: boolean
  /** Per-zombie FSM state + tile position (Milestone 2); M4 adds health. */
  zombies?: Array<{
    id: number
    state: string
    x: number
    y: number
    health?: number
  }>
  /** Survival stats + loot containers (Milestone 3). */
  hunger?: number
  stamina?: number
  containers?: Array<{ id: number; location: string; looted: boolean }>
  /** Held weapon name + durability (Milestone 4); 'bare hands' when none. */
  heldWeapon?: string
}

export function formatDebugStats(s: DebugStatsInput): string {
  const lines = [
    'FPS ' + s.fps.toFixed(0),
    'tile ' + s.tileX.toFixed(2) + ',' + s.tileY.toFixed(2),
    'world ' + s.worldX.toFixed(1) + ',' + s.worldY.toFixed(1),
    s.entityCount + ' objs',
    s.renderer,
  ]
  if (s.casual) lines.push('CASUAL')
  if (s.heldWeapon) lines.push('weapon ' + s.heldWeapon)
  if (s.hunger !== undefined && s.stamina !== undefined) {
    lines.push(
      'hunger ' + Math.ceil(s.hunger) + '  stamina ' + Math.ceil(s.stamina),
    )
  }
  if (s.zombies) {
    for (const z of s.zombies) {
      lines.push(
        'z' + z.id + ' ' + z.state + ' @' + z.x.toFixed(1) + ',' + z.y.toFixed(1) +
          (z.health !== undefined ? ' hp' + Math.ceil(z.health) : ''),
      )
    }
  }
  if (s.containers) {
    for (const c of s.containers) {
      lines.push(
        'c' + c.id + ' ' + c.location.toUpperCase() + (c.looted ? ' looted' : ''),
      )
    }
  }
  return lines.join('\n')
}
