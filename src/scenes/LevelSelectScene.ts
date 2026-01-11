import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';
import { AudioManager } from '../managers/AudioManager';
import { MUSIC_KEYS } from '../data/audio';
import { getStage, StageDefinition } from '../data/stages';
import { Button } from '../ui/Button';
import { THEME } from '../ui/theme';
import { TransitionManager } from '../systems/TransitionManager';

const STAGES_PER_WORLD = 5;
const BUTTON_SIZE = 70;
const BUTTON_SPACING = 20;
const WORLD_SPACING = 40;

// World definitions with themed colors
const WORLDS = [
  { name: 'Forest', color: 0x4a7a4a, textColor: '#8fbc8f', stages: [1, 5] },
  { name: 'Castle', color: 0x6a6a8a, textColor: '#9a9aba', stages: [6, 10] },
  { name: 'Graveyard', color: 0x5a5a6a, textColor: '#8a8a9a', stages: [11, 15] },
  { name: 'Volcano', color: 0x8a4a4a, textColor: '#ca6a6a', stages: [16, 20] },
] as const;

interface GameState {
  highestStage: number;
  stageStars: Record<number, number>;
}

/**
 * Level selection scene with world-grouped stages.
 * Stages 1 to highestStage+1 are clickable, rest are locked.
 */
export class LevelSelectScene extends Phaser.Scene {
  private tooltip: Phaser.GameObjects.Container | null = null;
  private tooltipBg: Phaser.GameObjects.Rectangle | null = null;
  private tooltipText: Phaser.GameObjects.Text | null = null;
  private stageButtons: Map<number, Phaser.GameObjects.Rectangle> = new Map();

  constructor() {
    super({ key: 'levelSelect' });
  }

  create(): void {
    // Reset camera and fade in
    TransitionManager.resetCamera(this);
    TransitionManager.fadeIn(this);

    // Add background with subtle parallax
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_level_select');
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const offsetX = (pointer.x - GAME_WIDTH / 2) * 0.008;
      const offsetY = (pointer.y - GAME_HEIGHT / 2) * 0.008;
      bg.setPosition(GAME_WIDTH / 2 + offsetX, GAME_HEIGHT / 2 + offsetY);
    });

    const audio = AudioManager.getInstance(this);
    audio?.switchMusic(MUSIC_KEYS.menu);

    // Title with shadow
    this.add.text(GAME_WIDTH / 2 + 2, 42, 'Select Stage', {
      fontSize: '42px',
      color: '#000000',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.3);

    this.add.text(GAME_WIDTH / 2, 40, 'Select Stage', {
      fontSize: '42px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Get game state from registry
    const gameState = this.registry.get('gameState') as GameState | undefined;
    const highestStage = gameState?.highestStage ?? 1;
    const stageStars = gameState?.stageStars ?? {};

    // Create world-grouped stage grid
    this.createWorldGrid(highestStage, stageStars);

    // Back button using new Button component
    new Button({
      scene: this,
      x: 80,
      y: GAME_HEIGHT - 50,
      label: 'Back',
      tier: 'secondary',
      width: 100,
      height: 44,
      onClick: () => {
        TransitionManager.transition(this, 'menu', undefined, 'slideLeft');
      },
    });

    // Create tooltip container
    this.createTooltip();

    // Draw progression path connecting cleared stages
    this.drawProgressionPath(highestStage, stageStars);
  }

  private createWorldGrid(highestStage: number, stageStars: Record<number, number>): void {
    const totalWidth = STAGES_PER_WORLD * (BUTTON_SIZE + BUTTON_SPACING) - BUTTON_SPACING;
    const startX = (GAME_WIDTH - totalWidth) / 2 + BUTTON_SIZE / 2;
    const baseY = 130;

    WORLDS.forEach((world, worldIndex) => {
      const worldY = baseY + worldIndex * (BUTTON_SIZE + WORLD_SPACING + 20);

      // World header with themed color
      const worldLabel = this.add.text(startX - BUTTON_SIZE / 2 - 10, worldY - 5, world.name, {
        fontSize: '18px',
        color: world.textColor,
        fontStyle: 'bold',
      });
      worldLabel.setOrigin(1, 0.5);

      // Decorative line under world name
      const lineGraphics = this.add.graphics();
      lineGraphics.lineStyle(2, world.color, 0.5);
      lineGraphics.lineBetween(
        startX - BUTTON_SIZE / 2,
        worldY + 15,
        startX + totalWidth + BUTTON_SIZE / 2 - totalWidth - 20,
        worldY + 15
      );

      // Create stage buttons for this world
      for (let i = 0; i < STAGES_PER_WORLD; i++) {
        const stageId = world.stages[0] + i;
        const x = startX + i * (BUTTON_SIZE + BUTTON_SPACING);

        const isUnlocked = stageId <= highestStage + 1;
        const stars = stageStars[stageId] ?? 0;

        this.createStageButton(x, worldY, stageId, isUnlocked, stars, world.color);
      }
    });
  }

  private drawProgressionPath(highestStage: number, stageStars: Record<number, number>): void {
    const graphics = this.add.graphics();
    graphics.setDepth(-1);

    // Draw dotted lines connecting completed stages
    const totalWidth = STAGES_PER_WORLD * (BUTTON_SIZE + BUTTON_SPACING) - BUTTON_SPACING;
    const startX = (GAME_WIDTH - totalWidth) / 2 + BUTTON_SIZE / 2;
    const baseY = 130;

    for (let stageId = 1; stageId < highestStage; stageId++) {
      const stars = stageStars[stageId] ?? 0;
      if (stars === 0) continue;

      const worldIndex = Math.floor((stageId - 1) / STAGES_PER_WORLD);
      const stageInWorld = (stageId - 1) % STAGES_PER_WORLD;

      const x1 = startX + stageInWorld * (BUTTON_SIZE + BUTTON_SPACING);
      const y1 = baseY + worldIndex * (BUTTON_SIZE + WORLD_SPACING + 20);

      // Draw to next stage if it's in the same world
      if (stageInWorld < STAGES_PER_WORLD - 1) {
        const x2 = x1 + BUTTON_SIZE + BUTTON_SPACING;
        this.drawDottedLine(graphics, x1 + BUTTON_SIZE / 2 + 5, y1, x2 - BUTTON_SIZE / 2 - 5, y1);
      }
    }
  }

  private drawDottedLine(
    graphics: Phaser.GameObjects.Graphics,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): void {
    const dashLength = 4;
    const gapLength = 4;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const dashCount = Math.floor(distance / (dashLength + gapLength));

    graphics.lineStyle(2, THEME.colors.accent.goldHex, 0.6);

    for (let i = 0; i < dashCount; i++) {
      const startRatio = (i * (dashLength + gapLength)) / distance;
      const endRatio = (i * (dashLength + gapLength) + dashLength) / distance;

      graphics.lineBetween(
        x1 + dx * startRatio,
        y1 + dy * startRatio,
        x1 + dx * endRatio,
        y1 + dy * endRatio
      );
    }
  }

  private createTooltip(): void {
    this.tooltipText = this.add.text(0, 0, '', {
      fontSize: '14px',
      color: '#ffffff',
      align: 'left',
      lineSpacing: 4,
    });

    this.tooltipBg = this.add.rectangle(0, 0, 10, 10, THEME.colors.background.panel, 0.95);
    this.tooltipBg.setStrokeStyle(1, THEME.colors.border.dim);

    this.tooltip = this.add.container(0, 0, [this.tooltipBg, this.tooltipText]);
    this.tooltip.setVisible(false);
    this.tooltip.setDepth(THEME.depth.tooltip);
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
    stars: number,
    worldColor: number
  ): void {
    // Button background with world-themed color for unlocked stages
    const bgColor = isUnlocked ? worldColor : THEME.colors.background.panelLight;
    const bg = this.add.rectangle(x, y, BUTTON_SIZE, BUTTON_SIZE, bgColor);
    bg.setStrokeStyle(2, isUnlocked ? THEME.colors.border.normal : THEME.colors.border.disabled);

    this.stageButtons.set(stageId, bg);

    // Stage number
    const labelColor = isUnlocked ? THEME.colors.text.primary : THEME.colors.text.disabled;
    const label = this.add.text(x, y - 8, `${stageId}`, {
      fontSize: '24px',
      color: labelColor,
      fontStyle: 'bold',
    });
    label.setOrigin(0.5);

    // Stars display (for completed stages)
    if (isUnlocked && stars > 0) {
      const starsText = '★'.repeat(stars) + '☆'.repeat(3 - stars);
      const starsLabel = this.add.text(x, y + 18, starsText, {
        fontSize: '10px',
        color: THEME.colors.accent.gold,
      });
      starsLabel.setOrigin(0.5);
    }

    // Lock icon for locked stages (styled text instead of emoji)
    if (!isUnlocked) {
      const lockIcon = this.add.text(x, y + 18, '🔒', {
        fontSize: '14px',
      });
      lockIcon.setOrigin(0.5);
    }

    // Interactivity for unlocked stages
    if (isUnlocked) {
      bg.setInteractive({ useHandCursor: true });

      const hoverColor = Phaser.Display.Color.ValueToColor(worldColor).lighten(20).color;

      bg.on('pointerover', () => {
        bg.setFillStyle(hoverColor);
        bg.setStrokeStyle(2, THEME.colors.border.highlight);

        // Scale up effect
        this.tweens.add({
          targets: [bg, label],
          scaleX: 1.05,
          scaleY: 1.05,
          duration: THEME.animation.fast,
          ease: 'Quad.easeOut',
        });

        this.showTooltip(stageId, x, y);

        // Hover sound
        const audio = AudioManager.getInstance(this);
        audio?.playSfx('sfx_button_hover');
      });

      bg.on('pointerout', () => {
        bg.setFillStyle(worldColor);
        bg.setStrokeStyle(2, THEME.colors.border.normal);

        // Scale back
        this.tweens.add({
          targets: [bg, label],
          scaleX: 1,
          scaleY: 1,
          duration: THEME.animation.fast,
          ease: 'Quad.easeOut',
        });

        this.hideTooltip();
      });

      bg.on('pointerdown', () => {
        // Click sound
        const audio = AudioManager.getInstance(this);
        audio?.playSfx('sfx_button_click');

        TransitionManager.transition(this, 'loadout', { stageId }, 'slideRight');
      });
    }
  }
}
