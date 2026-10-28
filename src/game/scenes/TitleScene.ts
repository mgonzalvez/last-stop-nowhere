import Phaser from 'phaser'

// Title screen: entry point of the game. SPACE / ENTER / click starts the game.
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene')
  }

  create(): void {
    const cam = this.cameras.main
    cam.setBackgroundColor('#15171e')
    const cx = cam.width / 2
    const cy = cam.height / 2

    this.add
      .text(
        cx,
        cy - 90,
        'LAST STOP,\nNOWHERE',
        {
          fontFamily: 'monospace',
          fontSize: '64px',
          fontStyle: 'bold',
          color: '#c9b189',
          align: 'center',
        },
      )
      .setOrigin(0.5)

    this.add
      .text(cx, cy + 10, 'the neighborhood is quiet for now', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#9a9a92',
      })
      .setOrigin(0.5)

    const prompt = this.add
      .text(cx, cy + 90, 'PRESS SPACE TO START', {
        fontFamily: 'monospace',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#4c8a46',
      })
      .setOrigin(0.5)
    this.tweens.add({
      targets: prompt,
      alpha: 0.25,
      duration: 600,
      yoyo: true,
      repeat: -1,
    })

    const start = () => this.scene.start('GameScene')
    this.input.keyboard!.on('keydown-SPACE', start)
    this.input.keyboard!.on('keydown-ENTER', start)
    this.input.on('pointerup', start)

    // TEMP verification hook (remove in C39): ?autostart skips the title so
    // headless runs reach GameScene (sync start, proven pattern).
    if (new URLSearchParams(window.location.search).has('autostart')) start()
  }
}
