import Phaser from 'phaser';

export const MINE_COST = 25;
export const MAX_MINES = 10;

const REWARDS = [
  { gold: 2, weight: 76 },
  { gold: 1, weight: 10 },
  { gold: 5, weight: 9 },
  { gold: 50, weight: 5 },
];

interface GoldMineConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  index: number;
  onTap: (gold: number) => void;
}

export class GoldMine extends Phaser.GameObjects.Container {
  constructor(config: GoldMineConfig) {
    super(config.scene, config.x, config.y);

    const sprite = this.scene.add.graphics();
    // Draw a gold pile/nugget shape
    sprite.fillStyle(0x8b6914, 1);
    sprite.fillEllipse(0, 4, 28, 10); // shadow/base
    sprite.fillStyle(0xd4a017, 1);
    sprite.fillEllipse(0, 0, 24, 14); // main pile
    sprite.fillStyle(0xffd700, 1);
    sprite.fillCircle(-4, -2, 5); // highlight nugget
    sprite.fillCircle(4, -1, 4);
    sprite.fillCircle(0, 2, 4);
    this.add(sprite);

    this.setSize(36, 36);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerdown', () => {
      const reward = this.rollReward();
      config.onTap(reward);
      this.playTapFeedback(reward);
    });

    this.scene.add.existing(this);
  }

  private rollReward(): number {
    const roll = Phaser.Math.Between(1, 100);
    let cumulative = 0;
    for (const reward of REWARDS) {
      cumulative += reward.weight;
      if (roll <= cumulative) {
        return reward.gold;
      }
    }
    return REWARDS[0].gold;
  }

  private playTapFeedback(gold: number): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.2,
      scaleY: 0.8,
      duration: 80,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    const isJackpot = gold >= 50;
    const text = this.scene.add.text(this.x, this.y - 25, `+${gold}`, {
      fontSize: isJackpot ? '24px' : '16px',
      color: isJackpot ? '#ffff00' : '#ffd700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    });
    text.setOrigin(0.5);
    text.setDepth(2000);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 30,
      alpha: 0,
      duration: 700,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy(),
    });
  }
}
