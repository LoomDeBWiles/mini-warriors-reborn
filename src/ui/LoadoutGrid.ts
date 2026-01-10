import Phaser from 'phaser';
import { GAME_WIDTH } from '../constants';
import { UnitDefinition } from '../data/units';

const CARD_WIDTH = 100;
const CARD_HEIGHT = 120;
const CARD_SPACING = 15;
const CARDS_PER_ROW = 5;
const SLOT_SIZE = 80;
const SLOT_SPACING = 10;

interface LoadoutGridConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  availableUnits: UnitDefinition[];
  maxLoadoutSize: number;
  onLoadoutChange?: (loadout: string[]) => void;
}

/**
 * Grid for selecting units into a battle loadout.
 * Displays available units and selected loadout slots.
 */
export class LoadoutGrid extends Phaser.GameObjects.Container {
  private availableUnits: UnitDefinition[];
  private selectedLoadout: string[] = [];
  private maxLoadoutSize: number;
  private onLoadoutChange?: (loadout: string[]) => void;

  private unitCards: Map<string, Phaser.GameObjects.Container> = new Map();
  private slotContainers: Phaser.GameObjects.Container[] = [];

  private tooltip: Phaser.GameObjects.Container | null = null;
  private tooltipBg: Phaser.GameObjects.Rectangle | null = null;
  private tooltipText: Phaser.GameObjects.Text | null = null;

  constructor(config: LoadoutGridConfig) {
    super(config.scene, config.x, config.y);
    this.availableUnits = config.availableUnits;
    this.maxLoadoutSize = config.maxLoadoutSize;
    this.onLoadoutChange = config.onLoadoutChange;

    this.scene.add.existing(this);
    this.createUnitGrid();
    this.createLoadoutSlots();
    this.createTooltip();
  }

  private createUnitGrid(): void {
    const gridTitle = this.scene.add.text(0, 0, 'Available Units', {
      fontSize: '24px',
      color: '#ffffff',
    });
    this.add(gridTitle);

    this.availableUnits.forEach((unit, index) => {
      const row = Math.floor(index / CARDS_PER_ROW);
      const col = index % CARDS_PER_ROW;
      const x = col * (CARD_WIDTH + CARD_SPACING);
      const y = 40 + row * (CARD_HEIGHT + CARD_SPACING);

      const card = this.createUnitCard(unit, x, y);
      this.unitCards.set(unit.id, card);
      this.add(card);
    });
  }

  private createUnitCard(
    unit: UnitDefinition,
    x: number,
    y: number
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    // Card background
    const bg = this.scene.add.rectangle(
      CARD_WIDTH / 2,
      CARD_HEIGHT / 2,
      CARD_WIDTH,
      CARD_HEIGHT,
      0x3a3a4a
    );
    bg.setStrokeStyle(2, 0x6a6a7a);
    container.add(bg);

    // Unit icon placeholder (colored circle based on unit type)
    const iconColor = this.getUnitColor(unit.id);
    const icon = this.scene.add.circle(CARD_WIDTH / 2, 40, 25, iconColor);
    container.add(icon);

    // Unit name
    const name = this.scene.add.text(CARD_WIDTH / 2, 80, unit.name, {
      fontSize: '14px',
      color: '#ffffff',
    });
    name.setOrigin(0.5);
    container.add(name);

    // Cost indicator
    const cost = this.scene.add.text(CARD_WIDTH / 2, 100, `${unit.spawnCost}g`, {
      fontSize: '12px',
      color: '#ffd700',
    });
    cost.setOrigin(0.5);
    container.add(cost);

    // Make interactive
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      bg.setFillStyle(0x4a4a5a);
      this.showTooltip(unit, x, y);
    });
    bg.on('pointerout', () => {
      this.updateCardHighlight(unit.id);
      this.hideTooltip();
    });
    bg.on('pointerdown', () => {
      this.toggleUnitSelection(unit.id);
    });

    return container;
  }

  private createLoadoutSlots(): void {
    const slotsY =
      40 +
      Math.ceil(this.availableUnits.length / CARDS_PER_ROW) *
        (CARD_HEIGHT + CARD_SPACING) +
      30;

    const slotsTitle = this.scene.add.text(0, slotsY, 'Battle Loadout', {
      fontSize: '24px',
      color: '#ffffff',
    });
    this.add(slotsTitle);

    for (let i = 0; i < this.maxLoadoutSize; i++) {
      const x = i * (SLOT_SIZE + SLOT_SPACING);
      const y = slotsY + 40;

      const slotContainer = this.scene.add.container(x, y);

      // Slot background
      const slotBg = this.scene.add.rectangle(
        SLOT_SIZE / 2,
        SLOT_SIZE / 2,
        SLOT_SIZE,
        SLOT_SIZE,
        0x2a2a3a
      );
      slotBg.setStrokeStyle(2, 0x5a5a6a);
      slotContainer.add(slotBg);

      // Slot number
      const slotNum = this.scene.add.text(SLOT_SIZE / 2, SLOT_SIZE / 2, `${i + 1}`, {
        fontSize: '24px',
        color: '#4a4a5a',
      });
      slotNum.setOrigin(0.5);
      slotContainer.add(slotNum);

      slotBg.setInteractive({ useHandCursor: true });
      slotBg.on('pointerdown', () => {
        this.removeFromSlot(i);
      });

      this.slotContainers.push(slotContainer);
      this.add(slotContainer);
    }
  }

  private toggleUnitSelection(unitId: string): void {
    const index = this.selectedLoadout.indexOf(unitId);
    if (index !== -1) {
      // Remove from loadout
      this.selectedLoadout.splice(index, 1);
    } else if (this.selectedLoadout.length < this.maxLoadoutSize) {
      // Add to loadout
      this.selectedLoadout.push(unitId);
    }
    this.updateDisplay();
    this.onLoadoutChange?.(this.selectedLoadout);
  }

  private removeFromSlot(slotIndex: number): void {
    if (slotIndex < this.selectedLoadout.length) {
      this.selectedLoadout.splice(slotIndex, 1);
      this.updateDisplay();
      this.onLoadoutChange?.(this.selectedLoadout);
    }
  }

  private updateDisplay(): void {
    // Update card highlights
    this.availableUnits.forEach((unit) => {
      this.updateCardHighlight(unit.id);
    });

    // Update slot contents
    this.slotContainers.forEach((container, i) => {
      // Remove existing unit content (keep bg and number)
      while (container.list.length > 2) {
        const obj = container.list[container.list.length - 1] as Phaser.GameObjects.GameObject;
        container.remove(obj, true);
      }

      // Show slot number when empty
      const slotNum = container.list[1] as Phaser.GameObjects.Text;
      slotNum.setVisible(i >= this.selectedLoadout.length);

      if (i < this.selectedLoadout.length) {
        const unitId = this.selectedLoadout[i];
        const unit = this.availableUnits.find((u) => u.id === unitId);
        if (unit) {
          // Unit icon
          const iconColor = this.getUnitColor(unitId);
          const icon = this.scene.add.circle(SLOT_SIZE / 2, 30, 20, iconColor);
          container.add(icon);

          // Unit name
          const name = this.scene.add.text(SLOT_SIZE / 2, 60, unit.name, {
            fontSize: '10px',
            color: '#ffffff',
          });
          name.setOrigin(0.5);
          container.add(name);
        }
      }
    });
  }

  private updateCardHighlight(unitId: string): void {
    const card = this.unitCards.get(unitId);
    if (!card) return;

    const bg = card.list[0] as Phaser.GameObjects.Rectangle;
    const isSelected = this.selectedLoadout.includes(unitId);

    if (isSelected) {
      bg.setFillStyle(0x4a6a4a);
      bg.setStrokeStyle(2, 0x6ada6a);
    } else {
      bg.setFillStyle(0x3a3a4a);
      bg.setStrokeStyle(2, 0x6a6a7a);
    }
  }

  private getUnitColor(unitId: string): number {
    const colors: Record<string, number> = {
      swordsman: 0x4a90d9,
      archer: 0x90d94a,
      knight: 0x7a7a9a,
      mage: 0x9a4ad9,
      healer: 0x4ad99a,
      assassin: 0x2a2a4a,
      catapult: 0x9a6a4a,
      griffin: 0xd9d94a,
      paladin: 0xffd700,
      dragon: 0xd94a4a,
    };
    return colors[unitId] ?? 0x6a6a6a;
  }

  getSelectedLoadout(): string[] {
    return [...this.selectedLoadout];
  }

  setSelectedLoadout(unitIds: string[]): void {
    this.selectedLoadout = unitIds
      .filter((id) => this.availableUnits.some((u) => u.id === id))
      .slice(0, this.maxLoadoutSize);
    this.updateDisplay();
  }

  private createTooltip(): void {
    this.tooltipText = this.scene.add.text(0, 0, '', {
      fontSize: '14px',
      color: '#ffffff',
      align: 'left',
      lineSpacing: 4,
    });

    this.tooltipBg = this.scene.add.rectangle(0, 0, 10, 10, 0x222222, 0.95);
    this.tooltipBg.setStrokeStyle(1, 0x666666);

    this.tooltip = this.scene.add.container(0, 0, [this.tooltipBg, this.tooltipText]);
    this.tooltip.setVisible(false);
    this.tooltip.setDepth(100);
  }

  private showTooltip(unit: UnitDefinition, cardX: number, cardY: number): void {
    if (!this.tooltip || !this.tooltipBg || !this.tooltipText) return;

    const rangeText = unit.range > 0 ? `${unit.range}px` : 'Melee';
    const content = `HP: ${unit.hp}\nDMG: ${unit.damage}\nRange: ${rangeText}`;

    this.tooltipText.setText(content);
    this.tooltipText.setOrigin(0, 0);

    const padding = 10;
    const width = this.tooltipText.width + padding * 2;
    const height = this.tooltipText.height + padding * 2;

    this.tooltipBg.setSize(width, height);
    this.tooltipBg.setOrigin(0, 0);

    this.tooltipText.setPosition(padding, padding);

    // Convert local card position to world coordinates
    const worldX = this.x + cardX + CARD_WIDTH / 2;
    const worldY = this.y + cardY;

    // Position tooltip above the card
    let tooltipX = worldX - width / 2;
    let tooltipY = worldY - height - 10;

    // Clamp to screen edges
    tooltipX = Math.max(10, Math.min(tooltipX, GAME_WIDTH - width - 10));
    if (tooltipY < 10) {
      tooltipY = worldY + CARD_HEIGHT + 10;
    }

    this.tooltip.setPosition(tooltipX, tooltipY);
    this.tooltip.setVisible(true);
  }

  private hideTooltip(): void {
    if (this.tooltip) {
      this.tooltip.setVisible(false);
    }
  }
}
