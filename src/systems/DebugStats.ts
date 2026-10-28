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
  return lines.join('\n')
}
