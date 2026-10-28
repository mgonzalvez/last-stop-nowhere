import Phaser from 'phaser'
import { createProceduralAssets } from '../../rendering/ProceduralAssets'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  create(): void {
    createProceduralAssets(this)
    this.scene.start('TitleScene')
  }
}
