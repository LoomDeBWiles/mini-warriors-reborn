import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { UnitDefinition, UNIT_DEFINITIONS } from '../data/units';
import { getEffectiveSpawnStats } from '../units/PlayerUnit';

const SPAWN_BAR_HEIGHT = 80;
const BUTTON_WIDTH = 90;
const BUTTON_HEIGHT = 60;
const BUTTON_SPACING = 10;
const BUTTON_Y_OFFSET = 10;

const ENABLED_BG_COLOR = 0x3a3a4a;
const ENABLED_STROKE_COLOR = 0x6a6a7a;
const DISABLED_BG_COLOR = 0x2a2a2a;
const DISABLED_STROKE_COLOR = 0x4a4a4a;
const DISABLED_TEXT_COLOR = '#666666';
const ENABLED_TEXT_COLOR = '#ffffff';
const GOLD_COLOR = '#ffd700';
const DISABLED_GOLD_COLOR = '#666666';
const COOLDOWN_OVERLAY_COLOR = 0x000000;
const COOLDOWN_OVERLAY_ALPHA = 0.6;
const COOLDOWN_ARC_COLOR = 0x88ccff;

interface SpawnButtonState {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Rectangle;
  nameText: Phaser.GameObjects.Text;
  costText: Phaser.GameObjects.Text;
  cooldownOverlay: Phaser.GameObjects.Rectangle;
  cooldownArc: Phaser.GameObjects.Graphics;
  unit: UnitDefinition;
  effectiveSpawnCost: number;
  effectiveCooldownMs: number;
  isAffordable: boolean;
  cooldownEndTime: number;
}

interface SpawnBarConfig {
  scene: Phaser.Scene;
  loadout: string[];
  onSpawn: (unitId: string) => void;
}

/**
 * Bottom bar with spawn buttons for units in the player's loadout.
 * Buttons are disabled (grayed out, tap ignored) when player gold < unit cost.
 */
export class SpawnBar extends Phaser.GameObjects.Container {
  private buttons: SpawnButtonState[] = [];
  private onSpawn: (unitId: string) => void;

  constructor(config: SpawnBarConfig) {
    super(config.scene, 0, GAME_HEIGHT - SPAWN_BAR_HEIGHT);
    this.onSpawn = config.onSpawn;

    // Bar background
    const bg = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      SPAWN_BAR_HEIGHT / 2,
      GAME_WIDTH,
      SPAWN_BAR_HEIGHT,
      0x1a1a2e,
      0.95
    );
    this.add(bg);

    // Create spawn buttons for each unit in loadout
    const loadoutUnits = config.loadout
      .map((id) => UNIT_DEFINITIONS[id])
      .filter((u): u is UnitDefinition => u !== undefined);

    const totalWidth =
      loadoutUnits.length * BUTTON_WIDTH + (loadoutUnits.length - 1) * BUTTON_SPACING;
    const startX = (GAME_WIDTH - totalWidth) / 2;

    loadoutUnits.forEach((unit, index) => {
      const x = startX + index * (BUTTON_WIDTH + BUTTON_SPACING) + BUTTON_WIDTH / 2;
      const button = this.createSpawnButton(unit, x);
      this.buttons.push(button);
    });

    this.setDepth(1000);
    this.scene.add.existing(this);
  }

  private createSpawnButton(unit: UnitDefinition, x: number): SpawnButtonState {
    const container = this.scene.add.container(x, BUTTON_Y_OFFSET + BUTTON_HEIGHT / 2);

    // Get effective costs with utility upgrades applied
    const effectiveStats = getEffectiveSpawnStats(this.scene, unit.id);

    // Button background
    const bg = this.scene.add.rectangle(0, 0, BUTTON_WIDTH, BUTTON_HEIGHT, ENABLED_BG_COLOR);
    bg.setStrokeStyle(2, ENABLED_STROKE_COLOR);
    container.add(bg);

    // Unit name
    const nameText = this.scene.add.text(0, -12, unit.name, {
      fontSize: '14px',
      color: ENABLED_TEXT_COLOR,
    });
    nameText.setOrigin(0.5);
    container.add(nameText);

    // Cost indicator (shows effective cost with upgrades applied)
    const costText = this.scene.add.text(0, 12, `${effectiveStats.spawnCost}g`, {
      fontSize: '12px',
      color: GOLD_COLOR,
    });
    costText.setOrigin(0.5);
    container.add(costText);

    // Cooldown overlay (dark rectangle over the button)
    const cooldownOverlay = this.scene.add.rectangle(
      0,
      0,
      BUTTON_WIDTH,
      BUTTON_HEIGHT,
      COOLDOWN_OVERLAY_COLOR,
      COOLDOWN_OVERLAY_ALPHA
    );
    cooldownOverlay.setVisible(false);
    container.add(cooldownOverlay);

    // Cooldown arc graphics (circular progress indicator)
    const cooldownArc = this.scene.add.graphics();
    cooldownArc.setVisible(false);
    container.add(cooldownArc);

    // Set up interactivity
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => {
      const buttonState = this.buttons.find((b) => b.unit.id === unit.id);
      if (buttonState && this.isButtonEnabled(buttonState)) {
        this.onSpawn(unit.id);
      }
    });
    bg.on('pointerover', () => {
      const buttonState = this.buttons.find((b) => b.unit.id === unit.id);
      if (buttonState && this.isButtonEnabled(buttonState)) {
        bg.setFillStyle(0x4a4a5a);
      }
    });
    bg.on('pointerout', () => {
      const buttonState = this.buttons.find((b) => b.unit.id === unit.id);
      if (buttonState && this.isButtonEnabled(buttonState)) {
        bg.setFillStyle(ENABLED_BG_COLOR);
      }
    });

    this.add(container);

    return {
      container,
      bg,
      nameText,
      costText,
      cooldownOverlay,
      cooldownArc,
      unit,
      effectiveSpawnCost: effectiveStats.spawnCost,
      effectiveCooldownMs: effectiveStats.cooldownMs,
      isAffordable: true,
      cooldownEndTime: 0,
    };
  }

  private isButtonEnabled(button: SpawnButtonState): boolean {
    return button.isAffordable && button.cooldownEndTime <= this.scene.time.now;
  }

  /**
   * Update button states based on current gold amount.
   * Buttons become disabled (grayed out) when gold < spawn cost.
   */
  updateGold(gold: number): void {
    for (const button of this.buttons) {
      const wasAffordable = button.isAffordable;
      button.isAffordable = gold >= button.effectiveSpawnCost;

      if (wasAffordable !== button.isAffordable) {
        this.updateButtonAppearance(button);
      }
    }
  }

  private updateButtonAppearance(button: SpawnButtonState): void {
    const isOnCooldown = button.cooldownEndTime > this.scene.time.now;

    if (isOnCooldown) {
      // Cooldown state - darken button, show overlay
      button.bg.setFillStyle(DISABLED_BG_COLOR);
      button.bg.setStrokeStyle(2, DISABLED_STROKE_COLOR);
      button.nameText.setColor(DISABLED_TEXT_COLOR);
      button.costText.setColor(DISABLED_GOLD_COLOR);
      button.bg.input!.cursor = 'default';
      button.cooldownOverlay.setVisible(true);
      button.cooldownArc.setVisible(true);
    } else if (button.isAffordable) {
      button.bg.setFillStyle(ENABLED_BG_COLOR);
      button.bg.setStrokeStyle(2, ENABLED_STROKE_COLOR);
      button.nameText.setColor(ENABLED_TEXT_COLOR);
      button.costText.setColor(GOLD_COLOR);
      button.bg.input!.cursor = 'pointer';
      button.cooldownOverlay.setVisible(false);
      button.cooldownArc.setVisible(false);
    } else {
      button.bg.setFillStyle(DISABLED_BG_COLOR);
      button.bg.setStrokeStyle(2, DISABLED_STROKE_COLOR);
      button.nameText.setColor(DISABLED_TEXT_COLOR);
      button.costText.setColor(DISABLED_GOLD_COLOR);
      button.bg.input!.cursor = 'default';
      button.cooldownOverlay.setVisible(false);
      button.cooldownArc.setVisible(false);
    }
  }

  /**
   * Start cooldown for a unit after spawning.
   * Shows darkened button with circular progress overlay.
   */
  startCooldown(unitId: string): void {
    const button = this.buttons.find((b) => b.unit.id === unitId);
    if (!button) return;

    button.cooldownEndTime = this.scene.time.now + button.effectiveCooldownMs;
    this.updateButtonAppearance(button);
  }

  /**
   * Get the effective spawn cost for a unit (with upgrades applied).
   * Returns undefined if unit is not in the spawn bar.
   */
  getEffectiveSpawnCost(unitId: string): number | undefined {
    const button = this.buttons.find((b) => b.unit.id === unitId);
    return button?.effectiveSpawnCost;
  }

  /**
   * Check if a unit can be spawned (affordable and not on cooldown).
   */
  canSpawn(unitId: string): boolean {
    const button = this.buttons.find((b) => b.unit.id === unitId);
    return button !== undefined && this.isButtonEnabled(button);
  }

  /**
   * Update cooldown visuals. Should be called each frame during battle.
   */
  update(): void {
    const now = this.scene.time.now;

    for (const button of this.buttons) {
      if (button.cooldownEndTime > now) {
        this.drawCooldownArc(button);
      } else if (button.cooldownOverlay.visible) {
        // Cooldown just finished
        this.updateButtonAppearance(button);
      }
    }
  }

  private drawCooldownArc(button: SpawnButtonState): void {
    const now = this.scene.time.now;
    const remaining = button.cooldownEndTime - now;
    const progress = remaining / button.effectiveCooldownMs;

    const arcRadius = Math.min(BUTTON_WIDTH, BUTTON_HEIGHT) / 2 - 8;
    const startAngle = -Math.PI / 2; // Top of circle
    const endAngle = startAngle + progress * Math.PI * 2;

    button.cooldownArc.clear();
    button.cooldownArc.lineStyle(4, COOLDOWN_ARC_COLOR, 1);
    button.cooldownArc.beginPath();
    button.cooldownArc.arc(0, 0, arcRadius, startAngle, endAngle, false);
    button.cooldownArc.strokePath();
  }
}
