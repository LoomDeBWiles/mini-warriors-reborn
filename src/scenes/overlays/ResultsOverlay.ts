import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../constants';

const STAR_FILL_DURATION = 400;
const STAR_FILL_DELAY = 300;
const GOLD_COUNT_DURATION = 1500;
const STAR_SIZE = 64;
const STAR_SPACING = 80;

interface ResultsData {
  victory: boolean;
  stars: number;
  goldReward: number;
}

/**
 * Results overlay shown after battle ends.
 * Displays victory/defeat banner, animated stars, gold counting up, and continue button.
 */
export class ResultsOverlay extends Phaser.Scene {
  private victory = false;
  private stars = 0;
  private goldReward = 0;

  constructor() {
    super({ key: 'results' });
  }

  init(data: ResultsData): void {
    this.victory = data.victory ?? false;
    this.stars = Math.min(3, Math.max(0, data.stars ?? 0));
    this.goldReward = data.goldReward ?? 0;
  }

  create(): void {
    // Semi-transparent dark overlay
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.8
    );
    overlay.setInteractive();

    // Victory/Defeat banner
    const bannerText = this.victory ? 'VICTORY' : 'DEFEAT';
    const bannerColor = this.victory ? '#ffd700' : '#ef4444';
    const banner = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 4, bannerText, {
      fontSize: '72px',
      color: bannerColor,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    banner.setOrigin(0.5);

    // Stars container
    const starsY = GAME_HEIGHT / 2 - 30;
    const starContainers = this.createStars(starsY);

    // Gold reward display
    const goldY = starsY + 80;
    const goldText = this.add.text(GAME_WIDTH / 2, goldY, 'Gold: 0', {
      fontSize: '36px',
      color: '#ffd700',
    });
    goldText.setOrigin(0.5);

    // Continue button
    const buttonY = GAME_HEIGHT - 120;
    const continueButton = this.add.text(GAME_WIDTH / 2, buttonY, 'Continue', {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#4a4a4a',
      padding: { x: 40, y: 15 },
    });
    continueButton.setOrigin(0.5);
    continueButton.setInteractive({ useHandCursor: true });
    continueButton.on('pointerover', () => {
      continueButton.setStyle({ backgroundColor: '#6a6a6a' });
    });
    continueButton.on('pointerout', () => {
      continueButton.setStyle({ backgroundColor: '#4a4a4a' });
    });
    continueButton.on('pointerdown', () => this.returnToMenu());

    // Animate stars filling if victory
    if (this.victory) {
      this.animateStars(starContainers);
    }

    // Animate gold counting up
    this.animateGoldCount(goldText);
  }

  private createStars(y: number): Phaser.GameObjects.Text[] {
    const stars: Phaser.GameObjects.Text[] = [];
    const startX = GAME_WIDTH / 2 - STAR_SPACING;

    for (let i = 0; i < 3; i++) {
      const star = this.add.text(startX + i * STAR_SPACING, y, '\u2605', {
        fontSize: `${STAR_SIZE}px`,
        color: '#333333',
      });
      star.setOrigin(0.5);
      stars.push(star);
    }

    return stars;
  }

  private animateStars(starTexts: Phaser.GameObjects.Text[]): void {
    for (let i = 0; i < this.stars; i++) {
      const star = starTexts[i];
      const delay = i * STAR_FILL_DELAY;

      this.time.delayedCall(delay, () => {
        star.setStyle({ color: '#ffd700' });
        star.setScale(0);

        this.tweens.add({
          targets: star,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: STAR_FILL_DURATION / 2,
          ease: 'Back.easeOut',
          onComplete: () => {
            this.tweens.add({
              targets: star,
              scaleX: 1,
              scaleY: 1,
              duration: STAR_FILL_DURATION / 2,
              ease: 'Quad.easeOut',
            });
          },
        });
      });
    }
  }

  private animateGoldCount(goldText: Phaser.GameObjects.Text): void {
    const counter = { value: 0 };

    this.tweens.add({
      targets: counter,
      value: this.goldReward,
      duration: GOLD_COUNT_DURATION,
      ease: 'Quad.easeOut',
      onUpdate: () => {
        goldText.setText(`Gold: ${Math.floor(counter.value)}`);
      },
    });
  }

  private returnToMenu(): void {
    this.scene.stop('battle');
    this.scene.stop();
    this.scene.start('menu');
  }
}
