import Phaser from 'phaser';

const BAR_WIDTH = 40;
const BAR_HEIGHT = 6;
const BAR_OFFSET_Y = -30;
const BACKGROUND_COLOR = 0x333333;
const FILL_COLOR = 0x4ade80;
const LOW_HEALTH_COLOR = 0xef4444;
const LOW_HEALTH_THRESHOLD = 0.3;

interface HealthBarConfig {
  scene: Phaser.Scene;
  maxHp: number;
}

/**
 * Health bar that follows a unit and displays current HP.
 */
export class HealthBar extends Phaser.GameObjects.Container {
  private maxHp: number;
  private currentHp: number;
  private background: Phaser.GameObjects.Rectangle;
  private fill: Phaser.GameObjects.Rectangle;

  constructor(config: HealthBarConfig) {
    super(config.scene, 0, BAR_OFFSET_Y);
    this.maxHp = config.maxHp;
    this.currentHp = config.maxHp;

    this.background = this.scene.add.rectangle(0, 0, BAR_WIDTH, BAR_HEIGHT, BACKGROUND_COLOR);
    this.fill = this.scene.add.rectangle(0, 0, BAR_WIDTH, BAR_HEIGHT, FILL_COLOR);

    this.add(this.background);
    this.add(this.fill);
  }

  setHp(hp: number): void {
    this.currentHp = Phaser.Math.Clamp(hp, 0, this.maxHp);
    const ratio = this.currentHp / this.maxHp;

    const newWidth = BAR_WIDTH * ratio;
    this.fill.setSize(newWidth, BAR_HEIGHT);
    this.fill.setX((newWidth - BAR_WIDTH) / 2);

    const color = ratio <= LOW_HEALTH_THRESHOLD ? LOW_HEALTH_COLOR : FILL_COLOR;
    this.fill.setFillStyle(color);
  }

  getHp(): number {
    return this.currentHp;
  }
}
