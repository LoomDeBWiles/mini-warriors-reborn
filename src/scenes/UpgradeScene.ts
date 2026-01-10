import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { AudioManager } from '../managers/AudioManager';
import { MUSIC_KEYS } from '../data/audio';
import { getUnlockedUnits, UNIT_DEFINITIONS } from '../data/units';
import { UpgradeTree } from '../ui/UpgradeTree';
import { UpgradePath } from '../data/upgrades';

const UNIT_BUTTON_SIZE = 70;
const UNIT_BUTTON_SPACING = 10;

interface UnitUpgrades {
  offense: number;
  defense: number;
  utility: number;
}

interface GameState {
  highestStage: number;
  gold: number;
  unitUpgrades: Record<string, UnitUpgrades>;
}

/**
 * Scene for purchasing unit upgrades.
 * Shows unlocked units on the left, upgrade tree for selected unit on the right.
 */
export class UpgradeScene extends Phaser.Scene {
  private selectedUnitId: string | null = null;
  private upgradeTree: UpgradeTree | null = null;
  private unitButtons: Map<string, Phaser.GameObjects.Container> = new Map();
  private goldDisplay: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'upgrade' });
  }

  create(): void {
    const audio = AudioManager.getInstance(this);
    audio?.switchMusic(MUSIC_KEYS.menu);

    // Title
    const title = this.add.text(GAME_WIDTH / 2, 30, 'Unit Upgrades', {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Gold display
    const gameState = this.getGameState();
    this.goldDisplay = this.add.text(GAME_WIDTH - 30, 30, `Gold: ${gameState.gold}`, {
      fontSize: '24px',
      color: '#ffd700',
    });
    this.goldDisplay.setOrigin(1, 0.5);

    // Create unit selection panel
    this.createUnitPanel();

    // Select first unlocked unit by default
    const unlockedUnits = getUnlockedUnits(gameState.highestStage);
    if (unlockedUnits.length > 0) {
      this.selectUnit(unlockedUnits[0].id);
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
  }

  private getGameState(): GameState {
    const stored = this.registry.get('gameState') as GameState | undefined;
    return stored ?? {
      highestStage: 1,
      gold: 500,
      unitUpgrades: {},
    };
  }

  private getUnitUpgrades(unitId: string): UnitUpgrades {
    const gameState = this.getGameState();
    return gameState.unitUpgrades[unitId] ?? { offense: 0, defense: 0, utility: 0 };
  }

  private createUnitPanel(): void {
    const gameState = this.getGameState();
    const unlockedUnits = getUnlockedUnits(gameState.highestStage);

    // Panel background
    const panelX = 40;
    const panelY = 80;
    const panelWidth = 100;
    const panelHeight = unlockedUnits.length * (UNIT_BUTTON_SIZE + UNIT_BUTTON_SPACING) + 20;

    const panelBg = this.add.rectangle(
      panelX + panelWidth / 2,
      panelY + panelHeight / 2,
      panelWidth,
      panelHeight,
      0x222222,
      0.8
    );
    panelBg.setStrokeStyle(1, 0x444444);

    // Create unit buttons
    unlockedUnits.forEach((unit, index) => {
      const x = panelX + panelWidth / 2;
      const y = panelY + 20 + index * (UNIT_BUTTON_SIZE + UNIT_BUTTON_SPACING) + UNIT_BUTTON_SIZE / 2;
      this.createUnitButton(x, y, unit.id, unit.name);
    });
  }

  private createUnitButton(x: number, y: number, unitId: string, unitName: string): void {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, UNIT_BUTTON_SIZE, UNIT_BUTTON_SIZE, 0x3a3a4a);
    bg.setStrokeStyle(2, 0x6a6a7a);
    container.add(bg);

    // Unit icon (colored circle)
    const iconColor = this.getUnitColor(unitId);
    const icon = this.add.circle(0, -8, 18, iconColor);
    container.add(icon);

    // Unit name (abbreviated)
    const abbrev = unitName.substring(0, 4);
    const label = this.add.text(0, 20, abbrev, {
      fontSize: '11px',
      color: '#ffffff',
    });
    label.setOrigin(0.5);
    container.add(label);

    // Make interactive
    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      if (this.selectedUnitId !== unitId) {
        bg.setFillStyle(0x4a4a5a);
      }
    });

    bg.on('pointerout', () => {
      if (this.selectedUnitId !== unitId) {
        bg.setFillStyle(0x3a3a4a);
      }
    });

    bg.on('pointerdown', () => {
      this.selectUnit(unitId);
    });

    this.unitButtons.set(unitId, container);
  }

  private selectUnit(unitId: string): void {
    // Update previous selection
    if (this.selectedUnitId) {
      const prevButton = this.unitButtons.get(this.selectedUnitId);
      if (prevButton) {
        const prevBg = prevButton.list[0] as Phaser.GameObjects.Rectangle;
        prevBg.setFillStyle(0x3a3a4a);
        prevBg.setStrokeStyle(2, 0x6a6a7a);
      }
    }

    // Highlight new selection
    this.selectedUnitId = unitId;
    const button = this.unitButtons.get(unitId);
    if (button) {
      const bg = button.list[0] as Phaser.GameObjects.Rectangle;
      bg.setFillStyle(0x4a6a4a);
      bg.setStrokeStyle(2, 0x6ada6a);
    }

    // Update upgrade tree
    this.showUpgradeTree(unitId);
  }

  private showUpgradeTree(unitId: string): void {
    // Remove existing tree
    if (this.upgradeTree) {
      this.upgradeTree.destroy();
      this.upgradeTree = null;
    }

    const unit = UNIT_DEFINITIONS[unitId];
    if (!unit) return;

    const gameState = this.getGameState();
    const unitUpgrades = this.getUnitUpgrades(unitId);

    this.upgradeTree = new UpgradeTree({
      scene: this,
      x: GAME_WIDTH / 2 + 50,
      y: GAME_HEIGHT / 2 - 80,
      unitId,
      unitName: unit.name,
      unitUpgrades,
      playerGold: gameState.gold,
      onNodeClick: (path, tier, cost) => {
        this.handleUpgradePurchase(unitId, path, tier, cost);
      },
    });
  }

  private handleUpgradePurchase(unitId: string, path: UpgradePath, tier: number, cost: number): void {
    const gameState = this.getGameState();

    if (gameState.gold < cost) return;

    // Initialize unit upgrades if needed
    if (!gameState.unitUpgrades[unitId]) {
      gameState.unitUpgrades[unitId] = { offense: 0, defense: 0, utility: 0 };
    }

    // Check if this is the next tier
    const currentTier = gameState.unitUpgrades[unitId][path];
    if (tier !== currentTier + 1) return;

    // Deduct gold and apply upgrade
    gameState.gold -= cost;
    gameState.unitUpgrades[unitId][path] = tier;

    // Save updated state
    this.registry.set('gameState', gameState);

    // Update displays
    if (this.goldDisplay) {
      this.goldDisplay.setText(`Gold: ${gameState.gold}`);
    }

    // Refresh tree
    if (this.upgradeTree) {
      this.upgradeTree.updateState(gameState.unitUpgrades[unitId], gameState.gold);
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
}
