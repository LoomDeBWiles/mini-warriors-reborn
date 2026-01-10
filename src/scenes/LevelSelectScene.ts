import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';
import { AudioManager } from '../managers/AudioManager';
import { MUSIC_KEYS } from '../data/audio';
import { getStage, StageDefinition } from '../data/stages';

const TOTAL_STAGES = 20;
const GRID_COLS = 5;
const GRID_ROWS = 4;
const BUTTON_SIZE = 80;
const BUTTON_SPACING = 30;

interface GameState {
  highestStage: number;
  stageStars: Record<number, number>;
}

/**
 * Level selection scene with a grid of stages.
 * Stages 1 to highestStage+1 are clickable, rest are locked.
 */
export class LevelSelectScene extends Phaser.Scene {
  private tooltip: Phaser.GameObjects.Container | null = null;
  private tooltipBg: Phaser.GameObjects.Rectangle | null = null;
  private tooltipText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'levelSelect' });
  }

  create(): void {
    const audio = AudioManager.getInstance(this);
    audio?.switchMusic(MUSIC_KEYS.menu);

    // Title
    const title = this.add.text(GAME_WIDTH / 2, 40, 'Select Stage', {
      fontSize: '42px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Get game state from registry (default if not set)
    const gameState = this.registry.get('gameState') as GameState | undefined;
    const highestStage = gameState?.highestStage ?? 1;
    const stageStars = gameState?.stageStars ?? {};

    // Calculate grid layout
    const gridWidth = GRID_COLS * (BUTTON_SIZE + BUTTON_SPACING) - BUTTON_SPACING;
    const gridHeight = GRID_ROWS * (BUTTON_SIZE + BUTTON_SPACING) - BUTTON_SPACING;
    const startX = (GAME_WIDTH - gridWidth) / 2 + BUTTON_SIZE / 2;
    const startY = (GAME_HEIGHT - gridHeight) / 2 + BUTTON_SIZE / 2 + 20;

    // Create stage buttons
    for (let i = 0; i < TOTAL_STAGES; i++) {
      const stageId = i + 1;
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      const x = startX + col * (BUTTON_SIZE + BUTTON_SPACING);
      const y = startY + row * (BUTTON_SIZE + BUTTON_SPACING);

      const isUnlocked = stageId <= highestStage + 1;
      const stars = stageStars[stageId] ?? 0;

      this.createStageButton(x, y, stageId, isUnlocked, stars);
    }

    // Back button
    const backButton = this.add.text(50, GAME_HEIGHT - 50, 'Back', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#4a4a4a',
      padding: { x: 20, y: 10 },
    });
    backButton.setOrigin(0, 0.5);
    backButton.setInteractive({ useHandCursor: true });

    backButton.on('pointerover', () => {
      backButton.setStyle({ backgroundColor: '#6a6a6a' });
    });
    backButton.on('pointerout', () => {
      backButton.setStyle({ backgroundColor: '#4a4a4a' });
    });
    backButton.on('pointerdown', () => {
      this.scene.start('menu');
    });

    // Create tooltip container (hidden by default)
    this.createTooltip();
  }

  private createTooltip(): void {
    this.tooltipText = this.add.text(0, 0, '', {
      fontSize: '14px',
      color: '#ffffff',
      align: 'left',
      lineSpacing: 4,
    });

    this.tooltipBg = this.add.rectangle(0, 0, 10, 10, 0x222222, 0.95);
    this.tooltipBg.setStrokeStyle(1, 0x666666);

    this.tooltip = this.add.container(0, 0, [this.tooltipBg, this.tooltipText]);
    this.tooltip.setVisible(false);
    this.tooltip.setDepth(100);
  }

  private showTooltip(stageId: number, x: number, y: number): void {
    let stage: StageDefinition;
    try {
      stage = getStage(stageId);
    } catch {
      return;
    }
    if (!this.tooltip || !this.tooltipBg || !this.tooltipText) return;

    const waveCount = stage.waves.length;
    const content = `${stage.name}\nWaves: ${waveCount}\nReward: ${stage.baseGoldReward} gold`;

    this.tooltipText.setText(content);
    this.tooltipText.setOrigin(0, 0);

    const padding = 10;
    const width = this.tooltipText.width + padding * 2;
    const height = this.tooltipText.height + padding * 2;

    this.tooltipBg.setSize(width, height);
    this.tooltipBg.setOrigin(0, 0);

    this.tooltipText.setPosition(padding, padding);

    // Position tooltip above the button, clamped to screen bounds
    let tooltipX = x - width / 2;
    let tooltipY = y - BUTTON_SIZE / 2 - height - 10;

    // Clamp to screen edges
    tooltipX = Math.max(10, Math.min(tooltipX, GAME_WIDTH - width - 10));
    if (tooltipY < 10) {
      tooltipY = y + BUTTON_SIZE / 2 + 10;
    }

    this.tooltip.setPosition(tooltipX, tooltipY);
    this.tooltip.setVisible(true);
  }

  private hideTooltip(): void {
    if (this.tooltip) {
      this.tooltip.setVisible(false);
    }
  }

  private createStageButton(
    x: number,
    y: number,
    stageId: number,
    isUnlocked: boolean,
    stars: number
  ): void {
    // Button background
    const bgColor = isUnlocked ? 0x3a5a8a : 0x333333;
    const bg = this.add.rectangle(x, y, BUTTON_SIZE, BUTTON_SIZE, bgColor);
    bg.setStrokeStyle(2, isUnlocked ? 0x6ab0f9 : 0x555555);

    // Stage number
    const labelColor = isUnlocked ? '#ffffff' : '#666666';
    const label = this.add.text(x, y - 8, `${stageId}`, {
      fontSize: '28px',
      color: labelColor,
      fontStyle: 'bold',
    });
    label.setOrigin(0.5);

    // Stars display (for completed stages)
    if (isUnlocked && stars > 0) {
      const starsText = '★'.repeat(stars) + '☆'.repeat(3 - stars);
      const starsLabel = this.add.text(x, y + 22, starsText, {
        fontSize: '12px',
        color: '#ffd700',
      });
      starsLabel.setOrigin(0.5);
    }

    // Lock icon for locked stages
    if (!isUnlocked) {
      const lockIcon = this.add.text(x, y + 22, '🔒', {
        fontSize: '16px',
      });
      lockIcon.setOrigin(0.5);
    }

    // Interactivity for unlocked stages
    if (isUnlocked) {
      bg.setInteractive({ useHandCursor: true });

      bg.on('pointerover', () => {
        bg.setFillStyle(0x4a7aaa);
        this.showTooltip(stageId, x, y);
      });

      bg.on('pointerout', () => {
        bg.setFillStyle(0x3a5a8a);
        this.hideTooltip();
      });

      bg.on('pointerdown', () => {
        this.scene.start('loadout', { stageId });
      });
    }
  }
}
