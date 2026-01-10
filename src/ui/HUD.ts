import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

const HUD_HEIGHT = 60;
const WAVE_BANNER_SLIDE_DURATION = 400;
const WAVE_BANNER_HOLD_DURATION = 1200;
const HUD_PADDING = 20;
const HP_BAR_WIDTH = 200;
const HP_BAR_HEIGHT = 20;
const PLAYER_HP_COLOR = 0x4ade80;
const ENEMY_HP_COLOR = 0xef4444;
const HP_BAR_BG_COLOR = 0x333333;

interface HUDConfig {
  scene: Phaser.Scene;
  initialGold: number;
  totalWaves: number;
  playerBaseHp: number;
  enemyBaseHp: number;
}

/**
 * Battle HUD container displaying gold, wave indicator, and base HP bars.
 */
export class HUD extends Phaser.GameObjects.Container {
  private goldText: Phaser.GameObjects.Text;
  private waveText: Phaser.GameObjects.Text;

  private playerHpFill: Phaser.GameObjects.Rectangle;
  private playerHpText: Phaser.GameObjects.Text;
  private playerHpFillStartX: number;

  private enemyHpFill: Phaser.GameObjects.Rectangle;
  private enemyHpText: Phaser.GameObjects.Text;
  private enemyHpFillStartX: number;

  constructor(config: HUDConfig) {
    super(config.scene, 0, 0);

    // HUD background
    const bg = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      HUD_HEIGHT / 2,
      GAME_WIDTH,
      HUD_HEIGHT,
      0x1a1a2e,
      0.9
    );
    this.add(bg);

    // Gold display (left side)
    this.goldText = this.scene.add.text(
      HUD_PADDING,
      HUD_HEIGHT / 2,
      `Gold: ${config.initialGold}`,
      {
        fontSize: '24px',
        color: '#ffd700',
      }
    );
    this.goldText.setOrigin(0, 0.5);
    this.add(this.goldText);

    // Wave display (center)
    this.waveText = this.scene.add.text(
      GAME_WIDTH / 2,
      HUD_HEIGHT / 2,
      `Wave 1/${config.totalWaves}`,
      {
        fontSize: '24px',
        color: '#ffffff',
      }
    );
    this.waveText.setOrigin(0.5, 0.5);
    this.add(this.waveText);

    // Player base HP (left-center)
    const playerHpX = HUD_PADDING + 150;
    const playerBar = this.createHpBar(
      playerHpX,
      HUD_HEIGHT / 2,
      PLAYER_HP_COLOR,
      'Player Base'
    );
    this.playerHpFill = playerBar.fill;
    this.playerHpText = playerBar.text;
    this.playerHpFillStartX = playerBar.fill.x;

    // Enemy base HP (right side)
    const enemyHpX = GAME_WIDTH - HUD_PADDING - HP_BAR_WIDTH;
    const enemyBar = this.createHpBar(
      enemyHpX,
      HUD_HEIGHT / 2,
      ENEMY_HP_COLOR,
      'Enemy Base'
    );
    this.enemyHpFill = enemyBar.fill;
    this.enemyHpText = enemyBar.text;
    this.enemyHpFillStartX = enemyBar.fill.x;

    // Set high depth to stay above game objects
    this.setDepth(1000);
    this.scene.add.existing(this);
  }

  private createHpBar(
    x: number,
    y: number,
    fillColor: number,
    label: string
  ): {
    fill: Phaser.GameObjects.Rectangle;
    text: Phaser.GameObjects.Text;
  } {
    // Label above bar
    const labelText = this.scene.add.text(x + HP_BAR_WIDTH / 2, y - 18, label, {
      fontSize: '12px',
      color: '#aaaaaa',
    });
    labelText.setOrigin(0.5, 0.5);
    this.add(labelText);

    // Background bar
    const bar = this.scene.add.rectangle(
      x + HP_BAR_WIDTH / 2,
      y,
      HP_BAR_WIDTH,
      HP_BAR_HEIGHT,
      HP_BAR_BG_COLOR
    );
    this.add(bar);

    // Fill bar (starts full)
    const fill = this.scene.add.rectangle(
      x + HP_BAR_WIDTH / 2,
      y,
      HP_BAR_WIDTH,
      HP_BAR_HEIGHT,
      fillColor
    );
    this.add(fill);

    // HP text overlay
    const text = this.scene.add.text(x + HP_BAR_WIDTH / 2, y, '100%', {
      fontSize: '14px',
      color: '#ffffff',
    });
    text.setOrigin(0.5, 0.5);
    this.add(text);

    return { fill, text };
  }

  updateGold(amount: number): void {
    this.goldText.setText(`Gold: ${amount}`);
  }

  updateWave(current: number, total: number): void {
    this.waveText.setText(`Wave ${current}/${total}`);
  }

  updatePlayerBaseHp(hp: number, maxHp: number): void {
    this.updateHpBar(this.playerHpFill, this.playerHpText, this.playerHpFillStartX, hp, maxHp);
  }

  updateEnemyBaseHp(hp: number, maxHp: number): void {
    this.updateHpBar(this.enemyHpFill, this.enemyHpText, this.enemyHpFillStartX, hp, maxHp);
  }

  private updateHpBar(
    fill: Phaser.GameObjects.Rectangle,
    text: Phaser.GameObjects.Text,
    startX: number,
    hp: number,
    maxHp: number
  ): void {
    const ratio = Math.max(0, Math.min(1, hp / maxHp));
    const newWidth = HP_BAR_WIDTH * ratio;

    fill.setSize(newWidth, HP_BAR_HEIGHT);
    // Adjust x so bar shrinks from the right
    fill.setX(startX - (HP_BAR_WIDTH - newWidth) / 2);

    const percent = Math.round(ratio * 100);
    text.setText(`${percent}%`);
  }

  /**
   * Display a wave announcement banner that slides in from left,
   * holds, then slides out to the right.
   */
  showWaveAnnouncement(waveNumber: number): void {
    const centerY = GAME_HEIGHT / 2;
    const startX = -300;
    const centerX = GAME_WIDTH / 2;
    const endX = GAME_WIDTH + 300;

    const banner = this.scene.add.text(startX, centerY, `Wave ${waveNumber}`, {
      fontSize: '64px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    banner.setOrigin(0.5);
    banner.setDepth(1001);

    // Slide in
    this.scene.tweens.add({
      targets: banner,
      x: centerX,
      duration: WAVE_BANNER_SLIDE_DURATION,
      ease: 'Quad.easeOut',
      onComplete: () => {
        // Hold, then slide out
        this.scene.time.delayedCall(WAVE_BANNER_HOLD_DURATION, () => {
          this.scene.tweens.add({
            targets: banner,
            x: endX,
            duration: WAVE_BANNER_SLIDE_DURATION,
            ease: 'Quad.easeIn',
            onComplete: () => {
              banner.destroy();
            },
          });
        });
      },
    });
  }
}
