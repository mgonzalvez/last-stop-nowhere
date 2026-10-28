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
  /** Per-zombie FSM state + tile position (Milestone 2). */
  zombies?: Array<{ id: number; state: string; x: number; y: number }>
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
  if (s.zombies) {
    for (const z of s.zombies) {
      lines.push('z' + z.id + ' ' + z.state + ' @' + z.x.toFixed(1) + ',' + z.y.toFixed(1))
    }
  }
  return lines.join('\n')
}
