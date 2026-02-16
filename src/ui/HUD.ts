import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';
import { THEME } from './theme';

const HUD_HEIGHT = 60;
const WAVE_BANNER_SLIDE_DURATION = 400;
const WAVE_BANNER_HOLD_DURATION = 1200;
const HUD_PADDING = 20;
const GOLD_FLASH_DURATION = 300;
const GOLD_FEEDBACK_FLOAT_DISTANCE = 20;
const GOLD_FEEDBACK_DURATION = 800;
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
  private currentGold: number;
  private waveText: Phaser.GameObjects.Text;

  private playerHpFill: Phaser.GameObjects.Rectangle;
  private playerHpText: Phaser.GameObjects.Text;
  private playerHpFillStartX: number;

  private enemyHpFill: Phaser.GameObjects.Rectangle;
  private enemyHpText: Phaser.GameObjects.Text;
  private enemyHpFillStartX: number;

  constructor(config: HUDConfig) {
    super(config.scene, 0, 0);
    this.currentGold = config.initialGold;

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
    const goldPanel = this.scene.add.graphics();
    goldPanel.fillStyle(0x222222, 0.6);
    goldPanel.fillRoundedRect(HUD_PADDING - 8, HUD_HEIGHT / 2 - 16, 130, 32, 6);
    this.add(goldPanel);

    const coinIcon = this.scene.add.graphics();
    coinIcon.fillStyle(0xffd700, 1);
    coinIcon.fillCircle(HUD_PADDING + 8, HUD_HEIGHT / 2, 7);
    this.add(coinIcon);

    this.goldText = this.scene.add.text(
      HUD_PADDING + 20,
      HUD_HEIGHT / 2,
      `${config.initialGold}`,
      {
        fontSize: '24px',
        color: '#ffd700',
      }
    );
    this.goldText.setOrigin(0, 0.5);
    this.add(this.goldText);

    // Wave display (center)
    const wavePanel = this.scene.add.graphics();
    wavePanel.fillStyle(0x222222, 0.6);
    wavePanel.fillRoundedRect(GAME_WIDTH / 2 - 80, HUD_HEIGHT / 2 - 16, 160, 32, 6);
    this.add(wavePanel);

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
    const labelColor = fillColor === PLAYER_HP_COLOR ? '#4ade80' : '#ef4444';
    const labelText = this.scene.add.text(x + HP_BAR_WIDTH / 2, y - 18, label, {
      fontSize: THEME.typography.tiny.size,
      color: labelColor,
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

    // Rounded appearance: darker overlay at top edge
    const innerShadow = this.scene.add.rectangle(
      x + HP_BAR_WIDTH / 2,
      y - HP_BAR_HEIGHT / 2 + 1,
      HP_BAR_WIDTH,
      2,
      0x000000
    );
    innerShadow.setAlpha(0.3);
    this.add(innerShadow);

    // HP text overlay
    const text = this.scene.add.text(x + HP_BAR_WIDTH / 2, y, '100%', {
      fontSize: '14px',
      color: '#ffffff',
    });
    text.setOrigin(0.5, 0.5);
    this.add(text);

    return { fill, text };
  }

  updateGold(newAmount: number): void {
    const delta = newAmount - this.currentGold;
    this.currentGold = newAmount;
    this.goldText.setText(`${newAmount}`);

    if (delta === 0) {
      return;
    }

    // Flash the gold text
    this.scene.tweens.add({
      targets: this.goldText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: GOLD_FLASH_DURATION / 2,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    // Show floating +/- feedback
    const sign = delta > 0 ? '+' : '';
    const color = delta > 0 ? '#4ade80' : '#ef4444';
    const feedbackText = this.scene.add.text(
      this.goldText.x + this.goldText.width + 10,
      this.goldText.y,
      `${sign}${delta}`,
      {
        fontSize: '18px',
        color,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2,
      }
    );
    feedbackText.setOrigin(0, 0.5);
    feedbackText.setDepth(1001);

    this.scene.tweens.add({
      targets: feedbackText,
      y: feedbackText.y - GOLD_FEEDBACK_FLOAT_DISTANCE,
      alpha: 0,
      duration: GOLD_FEEDBACK_DURATION,
      ease: 'Quad.easeOut',
      onComplete: () => {
        feedbackText.destroy();
      },
    });
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

    // Low HP pulse effect
    const existingPulseTween = (fill as any).__pulseTween;
    if (ratio < 0.3 && ratio > 0) {
      if (!existingPulseTween || !existingPulseTween.isPlaying()) {
        const pulseTween = this.scene.tweens.add({
          targets: fill,
          alpha: { from: 1, to: 0.5 },
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        (fill as any).__pulseTween = pulseTween;
      }
    } else if (existingPulseTween) {
      existingPulseTween.stop();
      fill.setAlpha(1);
      (fill as any).__pulseTween = null;
    }
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

    // Dark semi-transparent banner background
    const bannerBg = this.scene.add.rectangle(
      startX, centerY, GAME_WIDTH, 80, 0x1a1a2e
    );
    bannerBg.setAlpha(0.8);
    bannerBg.setDepth(1001);

    const banner = this.scene.add.text(startX, centerY, `Wave ${waveNumber}`, {
      fontSize: '64px',
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    banner.setOrigin(0.5);
    banner.setDepth(1001);
    banner.setScale(0.8);

    // Slide in with scale-up
    this.scene.tweens.add({
      targets: [banner, bannerBg],
      x: centerX,
      scaleX: 1,
      scaleY: 1,
      duration: WAVE_BANNER_SLIDE_DURATION,
      ease: 'Quad.easeOut',
      onComplete: () => {
        // Hold, then slide out
        this.scene.time.delayedCall(WAVE_BANNER_HOLD_DURATION, () => {
          this.scene.tweens.add({
            targets: [banner, bannerBg],
            x: endX,
            duration: WAVE_BANNER_SLIDE_DURATION,
            ease: 'Quad.easeIn',
            onComplete: () => {
              banner.destroy();
              bannerBg.destroy();
            },
          });
        });
      },
    });
  }
}
