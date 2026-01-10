import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { UnitDefinition, UNIT_DEFINITIONS } from '../data/units';

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

interface SpawnButtonState {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Rectangle;
  nameText: Phaser.GameObjects.Text;
  costText: Phaser.GameObjects.Text;
  unit: UnitDefinition;
  isAffordable: boolean;
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

    // Cost indicator
    const costText = this.scene.add.text(0, 12, `${unit.spawnCost}g`, {
      fontSize: '12px',
      color: GOLD_COLOR,
    });
    costText.setOrigin(0.5);
    container.add(costText);

    // Set up interactivity
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => {
      const buttonState = this.buttons.find((b) => b.unit.id === unit.id);
      if (buttonState?.isAffordable) {
        this.onSpawn(unit.id);
      }
    });
    bg.on('pointerover', () => {
      const buttonState = this.buttons.find((b) => b.unit.id === unit.id);
      if (buttonState?.isAffordable) {
        bg.setFillStyle(0x4a4a5a);
      }
    });
    bg.on('pointerout', () => {
      const buttonState = this.buttons.find((b) => b.unit.id === unit.id);
      if (buttonState?.isAffordable) {
        bg.setFillStyle(ENABLED_BG_COLOR);
      }
    });

    this.add(container);

    return {
      container,
      bg,
      nameText,
      costText,
      unit,
      isAffordable: true,
    };
  }

  /**
   * Update button states based on current gold amount.
   * Buttons become disabled (grayed out) when gold < spawn cost.
   */
  updateGold(gold: number): void {
    for (const button of this.buttons) {
      const wasAffordable = button.isAffordable;
      button.isAffordable = gold >= button.unit.spawnCost;

      if (wasAffordable !== button.isAffordable) {
        this.updateButtonAppearance(button);
      }
    }
  }

  private updateButtonAppearance(button: SpawnButtonState): void {
    if (button.isAffordable) {
      button.bg.setFillStyle(ENABLED_BG_COLOR);
      button.bg.setStrokeStyle(2, ENABLED_STROKE_COLOR);
      button.nameText.setColor(ENABLED_TEXT_COLOR);
      button.costText.setColor(GOLD_COLOR);
      button.bg.input!.cursor = 'pointer';
    } else {
      button.bg.setFillStyle(DISABLED_BG_COLOR);
      button.bg.setStrokeStyle(2, DISABLED_STROKE_COLOR);
      button.nameText.setColor(DISABLED_TEXT_COLOR);
      button.costText.setColor(DISABLED_GOLD_COLOR);
      button.bg.input!.cursor = 'default';
    }
  }
}
