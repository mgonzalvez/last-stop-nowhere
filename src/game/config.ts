import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { TitleScene } from './scenes/TitleScene'
import { GameScene } from './scenes/GameScene'

export const GAME_W = 1280
export const GAME_H = 720

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // WebGL with Canvas fallback
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  pixelArt: true, // nearest-neighbor, chunky 16-bit look
  backgroundColor: '#15171e',
  scale: {
    // Canvas tracks the window size (1280x720 default); the game view adapts.
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, TitleScene, GameScene],
}
