import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../constants';
import { Button } from '../../ui/Button';
import { THEME } from '../../ui/theme';
import { AudioManager } from '../../managers/AudioManager';

const STAR_FILL_DURATION = 400;
const STAR_FILL_DELAY = 400;
const GOLD_COUNT_DURATION = 1500;
const STAR_SIZE = 48;
const STAR_SPACING = 80;
const CONFETTI_COUNT = 60;

interface ResultsData {
  victory: boolean;
  stars: number;
  goldReward: number;
}

/**
 * Results overlay shown after battle ends.
 * Displays victory/defeat banner with dramatic animations,
 * animated stars, gold counting up, and continue button.
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
    // Semi-transparent dark overlay with vignette
    this.createOverlay();

    // Create appropriate presentation based on outcome
    if (this.victory) {
      this.createVictoryPresentation();
    } else {
      this.createDefeatPresentation();
    }
  }

  private createOverlay(): void {
    // Base dark overlay
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      this.victory ? 0.7 : 0.85
    );
    overlay.setInteractive();

    // Victory: radial gradient effect (simulated with circles)
    // Defeat: red vignette effect
    if (!this.victory) {
      // Red vignette for defeat
      const vignette = this.add.graphics();
      vignette.fillGradientStyle(0x000000, 0x000000, 0x330000, 0x330000, 0.3);
      vignette.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
  }

  private createVictoryPresentation(): void {
    // Confetti particles
    this.createConfetti();

    // Radial light rays behind stars
    this.createLightRays();

    // Banner drops from top
    const banner = this.createBanner('VICTORY', THEME.colors.accent.gold);
    banner.setY(-100);
    this.tweens.add({
      targets: banner,
      y: GAME_HEIGHT / 4,
      duration: 600,
      ease: 'Bounce.easeOut',
    });

    // Stars container
    const starsY = GAME_HEIGHT / 2 - 20;
    const starGraphics = this.createStarGraphics(starsY);

    // Gold reward display
    const goldY = starsY + 100;
    const goldText = this.add.text(GAME_WIDTH / 2, goldY, 'Gold: 0', {
      fontSize: '36px',
      color: THEME.colors.accent.gold,
      fontStyle: 'bold',
    });
    goldText.setOrigin(0.5);

    // Continue button
    this.time.delayedCall(800, () => {
      new Button({
        scene: this,
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT - 100,
        label: 'Continue',
        tier: 'primary',
        width: 160,
        height: 52,
        fontSize: '28px',
        onClick: () => this.returnToMenu(),
      });
    });

    // Animate stars filling
    this.animateStarGraphics(starGraphics);

    // Animate gold counting up with coin particles
    this.animateGoldCount(goldText, true);

    // Play victory sound
    const audio = AudioManager.getInstance(this);
    audio?.playSfx('sfx_victory');
  }

  private createDefeatPresentation(): void {
    // Banner slides up slowly
    const banner = this.createBanner('DEFEAT', '#ef4444');
    banner.setY(GAME_HEIGHT + 100);
    this.tweens.add({
      targets: banner,
      y: GAME_HEIGHT / 4,
      duration: 1000,
      ease: 'Quad.easeOut',
    });

    // Stars start gold, fade to gray
    const starsY = GAME_HEIGHT / 2 - 20;
    const starGraphics = this.createStarGraphics(starsY, true);

    // Crumble/fade animation for defeat stars
    this.time.delayedCall(500, () => {
      this.animateDefeatStars(starGraphics);
    });

    // Encouraging message
    const message = this.add.text(
      GAME_WIDTH / 2,
      starsY + 80,
      "You'll get them next time!",
      {
        fontSize: '24px',
        color: THEME.colors.text.secondary,
        fontStyle: 'italic',
      }
    );
    message.setOrigin(0.5);
    message.setAlpha(0);

    this.time.delayedCall(1200, () => {
      this.tweens.add({
        targets: message,
        alpha: 1,
        duration: 500,
        ease: 'Quad.easeOut',
      });
    });

    // Gold reward (usually 0 for defeat, but show anyway)
    const goldY = starsY + 120;
    const goldText = this.add.text(GAME_WIDTH / 2, goldY, `Gold: ${this.goldReward}`, {
      fontSize: '28px',
      color: THEME.colors.text.secondary,
    });
    goldText.setOrigin(0.5);

    // Continue button (appears later for defeat)
    this.time.delayedCall(1500, () => {
      new Button({
        scene: this,
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT - 100,
        label: 'Try Again',
        tier: 'secondary',
        width: 160,
        height: 52,
        fontSize: '28px',
        onClick: () => this.returnToMenu(),
      });
    });

    // Play defeat sound
    const audio = AudioManager.getInstance(this);
    audio?.playSfx('sfx_defeat');
  }

  private createBanner(text: string, color: string): Phaser.GameObjects.Container {
    const container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 4);

    // Shadow layer
    const shadow = this.add.text(3, 3, text, {
      fontSize: '72px',
      color: '#000000',
      fontStyle: 'bold',
    });
    shadow.setOrigin(0.5);
    shadow.setAlpha(0.5);

    // Main text
    const main = this.add.text(0, 0, text, {
      fontSize: '72px',
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    main.setOrigin(0.5);

    container.add([shadow, main]);
    return container;
  }

  private createConfetti(): void {
    const colors = [0xffd700, 0xffffff, 0xff6b6b, 0x4ecdc4, 0x45b7d1];

    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const color = Phaser.Math.RND.pick(colors);
      const size = Phaser.Math.Between(4, 8);
      const isRect = Math.random() > 0.5;

      let particle: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Arc;
      if (isRect) {
        particle = this.add.rectangle(x, -20, size, size * 2, color);
      } else {
        particle = this.add.circle(x, -20, size / 2, color);
      }

      const delay = Phaser.Math.Between(0, 500);
      const duration = Phaser.Math.Between(2000, 4000);
      const rotationSpeed = Phaser.Math.FloatBetween(-5, 5);

      this.tweens.add({
        targets: particle,
        y: GAME_HEIGHT + 50,
        x: x + Phaser.Math.Between(-100, 100),
        rotation: rotationSpeed * 10,
        duration: duration,
        delay: delay,
        ease: 'Quad.easeIn',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private createLightRays(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2 - 20;
    const rayCount = 12;
    const graphics = this.add.graphics();

    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const length = 200;

      graphics.lineStyle(20, 0xffd700, 0.1);
      graphics.lineBetween(
        centerX,
        centerY,
        centerX + Math.cos(angle) * length,
        centerY + Math.sin(angle) * length
      );
    }

    // Rotate rays slowly
    this.tweens.add({
      targets: graphics,
      angle: 360,
      duration: 20000,
      repeat: -1,
      ease: 'Linear',
    });
  }

  private createStarGraphics(
    y: number,
    startFilled: boolean = false
  ): Phaser.GameObjects.Container[] {
    const stars: Phaser.GameObjects.Container[] = [];
    const startX = GAME_WIDTH / 2 - STAR_SPACING;

    for (let i = 0; i < 3; i++) {
      const x = startX + i * STAR_SPACING;
      const container = this.add.container(x, y);

      // Draw star shape using graphics
      const graphics = this.add.graphics();
      const color = startFilled ? 0xffd700 : 0x333333;

      this.drawStar(graphics, 0, 0, STAR_SIZE / 2, STAR_SIZE / 4, 5, color);

      container.add(graphics);
      container.setData('graphics', graphics);
      container.setData('filled', startFilled);

      stars.push(container);
    }

    return stars;
  }

  private drawStar(
    graphics: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    outerRadius: number,
    innerRadius: number,
    points: number,
    color: number
  ): void {
    graphics.clear();
    graphics.fillStyle(color, 1);
    graphics.beginPath();

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;

      if (i === 0) {
        graphics.moveTo(x, y);
      } else {
        graphics.lineTo(x, y);
      }
    }

    graphics.closePath();
    graphics.fillPath();
  }

  private animateStarGraphics(starContainers: Phaser.GameObjects.Container[]): void {
    for (let i = 0; i < this.stars; i++) {
      const container = starContainers[i];
      const graphics = container.getData('graphics') as Phaser.GameObjects.Graphics;
      const delay = i * STAR_FILL_DELAY + 400; // Start after banner lands

      this.time.delayedCall(delay, () => {
        // Fill the star with gold
        this.drawStar(graphics, 0, 0, STAR_SIZE / 2, STAR_SIZE / 4, 5, 0xffd700);

        // Pop animation
        container.setScale(0);
        this.tweens.add({
          targets: container,
          scaleX: 1.3,
          scaleY: 1.3,
          duration: STAR_FILL_DURATION / 2,
          ease: 'Back.easeOut',
          onComplete: () => {
            this.tweens.add({
              targets: container,
              scaleX: 1,
              scaleY: 1,
              duration: STAR_FILL_DURATION / 2,
              ease: 'Quad.easeOut',
            });
          },
        });

        // Sparkle effect
        this.createSparkle(container.x, container.y);

        // Play star earned sound
        const audio = AudioManager.getInstance(this);
        audio?.playSfx('sfx_star_earned');
      });
    }
  }

  private createSparkle(x: number, y: number): void {
    const sparkleCount = 8;
    for (let i = 0; i < sparkleCount; i++) {
      const angle = (i / sparkleCount) * Math.PI * 2;
      const sparkle = this.add.circle(x, y, 3, 0xffffff);

      this.tweens.add({
        targets: sparkle,
        x: x + Math.cos(angle) * 40,
        y: y + Math.sin(angle) * 40,
        alpha: 0,
        scale: 0,
        duration: 400,
        ease: 'Quad.easeOut',
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  private animateDefeatStars(starContainers: Phaser.GameObjects.Container[]): void {
    starContainers.forEach((container, i) => {
      const graphics = container.getData('graphics') as Phaser.GameObjects.Graphics;
      const delay = i * 200;

      this.time.delayedCall(delay, () => {
        // Fade to gray
        this.tweens.add({
          targets: container,
          alpha: 0.5,
          scaleX: 0.8,
          scaleY: 0.8,
          duration: 400,
          ease: 'Quad.easeIn',
          onComplete: () => {
            this.drawStar(graphics, 0, 0, STAR_SIZE / 2, STAR_SIZE / 4, 5, 0x444444);
            container.setAlpha(1);
          },
        });
      });
    });
  }

  private animateGoldCount(goldText: Phaser.GameObjects.Text, withParticles: boolean): void {
    const counter = { value: 0 };

    this.tweens.add({
      targets: counter,
      value: this.goldReward,
      duration: GOLD_COUNT_DURATION,
      ease: 'Quad.easeOut',
      onUpdate: () => {
        goldText.setText(`Gold: ${Math.floor(counter.value)}`);
      },
      onComplete: () => {
        if (withParticles && this.goldReward > 0) {
          this.createCoinBurst(goldText.x, goldText.y);
        }
      },
    });
  }

  private createCoinBurst(x: number, y: number): void {
    const coinCount = Math.min(10, Math.floor(this.goldReward / 10) + 3);

    for (let i = 0; i < coinCount; i++) {
      const coin = this.add.circle(x, y, 6, 0xffd700);
      const angle = Phaser.Math.FloatBetween(-Math.PI, 0);
      const distance = Phaser.Math.Between(30, 80);

      this.tweens.add({
        targets: coin,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance - 20,
        alpha: 0,
        duration: 600,
        delay: i * 50,
        ease: 'Quad.easeOut',
        onComplete: () => coin.destroy(),
      });
    }
  }

  private returnToMenu(): void {
    // Disable input to prevent double-clicks
    this.input.enabled = false;

    // Fade out using this scene's camera (scene must be running for fade to work)
    this.cameras.main.fadeOut(400, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Stop scenes and start level select after fade completes
      this.scene.stop('battle');
      this.scene.stop();
      this.scene.start('levelSelect');
    });
  }
}
