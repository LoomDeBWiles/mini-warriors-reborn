import Phaser from 'phaser';

const FLOAT_DISTANCE = 40;
const FLOAT_DURATION = 800;
const FONT_SIZE = '18px';
const DAMAGE_COLOR = '#ff4444';

/**
 * Shows a floating damage number that rises and fades out.
 */
export function showDamageNumber(scene: Phaser.Scene, x: number, y: number, amount: number): void {
  const text = scene.add.text(x, y, `-${amount}`, {
    fontSize: FONT_SIZE,
    color: DAMAGE_COLOR,
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 2,
  });
  text.setOrigin(0.5);
  text.setDepth(1000);

  scene.tweens.add({
    targets: text,
    y: y - FLOAT_DISTANCE,
    alpha: 0,
    duration: FLOAT_DURATION,
    ease: 'Quad.easeOut',
    onComplete: () => {
      text.destroy();
    },
  });
}
