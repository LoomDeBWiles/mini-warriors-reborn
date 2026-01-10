import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';
import { AudioManager } from '../managers/AudioManager';
import { GameState, UnitUpgrades } from '../managers/GameState';
import { MUSIC_KEYS } from '../data/audio';
import { getUnlockedUnits, UNIT_DEFINITIONS } from '../data/units';
import { UpgradeTree } from '../ui/UpgradeTree';
import { UpgradePath, CASTLE_UPGRADES, getCastleUpgradeCost } from '../data/upgrades';

const UNIT_BUTTON_SIZE = 70;
const UNIT_BUTTON_SPACING = 10;

type TabType = 'units' | 'castle';

/**
 * Scene for purchasing unit and castle upgrades.
 * Shows tabs at top for Units/Castle.
 * Units tab: unlocked units on the left, upgrade tree for selected unit on the right.
 * Castle tab: grid of castle upgrade bars with level indicators.
 */
export class UpgradeScene extends Phaser.Scene {
  private activeTab: TabType = 'units';
  private selectedUnitId: string | null = null;
  private upgradeTree: UpgradeTree | null = null;
  private unitButtons: Map<string, Phaser.GameObjects.Container> = new Map();
  private goldDisplay: Phaser.GameObjects.Text | null = null;
  private confirmDialog: Phaser.GameObjects.Container | null = null;
  private tabButtons: Map<TabType, Phaser.GameObjects.Container> = new Map();
  private unitPanel: Phaser.GameObjects.Container | null = null;
  private castlePanel: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'upgrade' });
  }

  create(): void {
    const audio = AudioManager.getInstance(this);
    audio?.switchMusic(MUSIC_KEYS.menu);

    // Title
    const title = this.add.text(GAME_WIDTH / 2, 30, 'Upgrades', {
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

    // Create tabs
    this.createTabs();

    // Create unit selection panel (default tab)
    this.createUnitPanel();

    // Select first unlocked unit by default
    const unlockedUnits = getUnlockedUnits(gameState.unlockedUnits);
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
    const gameState = GameState.getInstance(this);
    if (!gameState) {
      throw new Error('GameState not initialized');
    }
    return gameState;
  }

  private getUnitUpgrades(unitId: string): UnitUpgrades {
    const gameState = this.getGameState();
    return gameState.unitUpgrades[unitId] ?? { offense: 0, defense: 0, utility: 0 };
  }

  private getCastleUpgradeLevel(upgradeId: string): number {
    const gameState = this.getGameState();
    return gameState.castleUpgrades[upgradeId] ?? 0;
  }

  private createTabs(): void {
    const tabY = 65;
    const tabWidth = 100;
    const tabHeight = 32;
    const tabSpacing = 10;
    const startX = GAME_WIDTH / 2 - (tabWidth + tabSpacing / 2);

    const tabs: { type: TabType; label: string }[] = [
      { type: 'units', label: 'Units' },
      { type: 'castle', label: 'Castle' },
    ];

    tabs.forEach((tab, index) => {
      const x = startX + index * (tabWidth + tabSpacing);
      const container = this.add.container(x, tabY);

      const isActive = tab.type === this.activeTab;
      const bgColor = isActive ? 0x4a6a4a : 0x3a3a4a;
      const strokeColor = isActive ? 0x6ada6a : 0x5a5a5a;

      const bg = this.add.rectangle(0, 0, tabWidth, tabHeight, bgColor);
      bg.setStrokeStyle(2, strokeColor);
      container.add(bg);

      const label = this.add.text(0, 0, tab.label, {
        fontSize: '16px',
        color: isActive ? '#ffffff' : '#aaaaaa',
        fontStyle: isActive ? 'bold' : 'normal',
      });
      label.setOrigin(0.5);
      container.add(label);

      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => {
        if (tab.type !== this.activeTab) {
          bg.setFillStyle(0x4a4a5a);
        }
      });
      bg.on('pointerout', () => {
        if (tab.type !== this.activeTab) {
          bg.setFillStyle(0x3a3a4a);
        }
      });
      bg.on('pointerdown', () => {
        this.switchTab(tab.type);
      });

      this.tabButtons.set(tab.type, container);
    });
  }

  private switchTab(tab: TabType): void {
    if (tab === this.activeTab) return;
    this.activeTab = tab;

    // Update tab appearance
    this.tabButtons.forEach((container, tabType) => {
      const bg = container.list[0] as Phaser.GameObjects.Rectangle;
      const label = container.list[1] as Phaser.GameObjects.Text;
      const isActive = tabType === tab;

      bg.setFillStyle(isActive ? 0x4a6a4a : 0x3a3a4a);
      bg.setStrokeStyle(2, isActive ? 0x6ada6a : 0x5a5a5a);
      label.setColor(isActive ? '#ffffff' : '#aaaaaa');
      label.setStyle({ fontStyle: isActive ? 'bold' : 'normal' });
    });

    // Show/hide panels
    if (tab === 'units') {
      this.hideCastlePanel();
      this.showUnitsPanel();
    } else {
      this.hideUnitsPanel();
      this.showCastlePanel();
    }
  }

  private showUnitsPanel(): void {
    if (this.unitPanel) {
      this.unitPanel.setVisible(true);
    } else {
      this.createUnitPanel();
    }
    if (this.upgradeTree) {
      this.upgradeTree.setVisible(true);
    } else if (this.selectedUnitId) {
      this.showUpgradeTree(this.selectedUnitId);
    }
  }

  private hideUnitsPanel(): void {
    if (this.unitPanel) {
      this.unitPanel.setVisible(false);
    }
    if (this.upgradeTree) {
      this.upgradeTree.setVisible(false);
    }
  }

  private showCastlePanel(): void {
    if (this.castlePanel) {
      this.castlePanel.setVisible(true);
    } else {
      this.createCastlePanel();
    }
  }

  private hideCastlePanel(): void {
    if (this.castlePanel) {
      this.castlePanel.setVisible(false);
    }
  }

  private createCastlePanel(): void {
    const container = this.add.container(0, 0);
    this.castlePanel = container;

    const panelX = 150;
    const panelY = 120;
    const barWidth = 400;
    const barHeight = 50;
    const barSpacing = 15;

    // Panel background
    const bgHeight = CASTLE_UPGRADES.length * (barHeight + barSpacing) + 40;
    const panelBg = this.add.rectangle(
      GAME_WIDTH / 2,
      panelY + bgHeight / 2 - 10,
      barWidth + 60,
      bgHeight,
      0x222222,
      0.9
    );
    panelBg.setStrokeStyle(2, 0x444444);
    container.add(panelBg);

    // Header
    const header = this.add.text(GAME_WIDTH / 2, panelY, 'Castle Upgrades', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    header.setOrigin(0.5);
    container.add(header);

    // Create upgrade bars
    CASTLE_UPGRADES.forEach((upgrade, index) => {
      const y = panelY + 40 + index * (barHeight + barSpacing);
      this.createCastleUpgradeBar(container, panelX, y, upgrade, barWidth, barHeight);
    });
  }

  private createCastleUpgradeBar(
    parent: Phaser.GameObjects.Container,
    x: number,
    y: number,
    upgrade: typeof CASTLE_UPGRADES[0],
    width: number,
    height: number
  ): void {
    const gameState = this.getGameState();
    const currentLevel = this.getCastleUpgradeLevel(upgrade.id);
    const isMaxLevel = currentLevel >= upgrade.maxLevel;
    const nextCost = isMaxLevel ? 0 : getCastleUpgradeCost(upgrade.id, currentLevel + 1);
    const canAfford = gameState.gold >= nextCost;

    // Background bar
    const bg = this.add.rectangle(x + width / 2, y + height / 2, width, height, 0x3a3a4a);
    bg.setStrokeStyle(1, 0x5a5a5a);
    parent.add(bg);

    // Upgrade name
    const name = this.add.text(x + 10, y + 8, upgrade.name, {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    parent.add(name);

    // Level indicator: "L2/5"
    const levelText = this.add.text(x + width - 10, y + 8, `L${currentLevel}/${upgrade.maxLevel}`, {
      fontSize: '16px',
      color: isMaxLevel ? '#6ada6a' : '#ffd700',
    });
    levelText.setOrigin(1, 0);
    parent.add(levelText);

    // Progress segments
    const segmentWidth = (width - 20) / upgrade.maxLevel;
    const segmentHeight = 12;
    const segmentY = y + height - segmentHeight - 8;

    for (let i = 0; i < upgrade.maxLevel; i++) {
      const segmentX = x + 10 + i * segmentWidth + 2;
      const isFilled = i < currentLevel;
      const segment = this.add.rectangle(
        segmentX + (segmentWidth - 4) / 2,
        segmentY + segmentHeight / 2,
        segmentWidth - 4,
        segmentHeight,
        isFilled ? 0x6ada6a : 0x2a2a2a
      );
      segment.setStrokeStyle(1, isFilled ? 0x8afa8a : 0x4a4a4a);
      parent.add(segment);
    }

    // Next cost or MAX text
    if (isMaxLevel) {
      const maxText = this.add.text(x + width / 2, y + height / 2 - 2, 'MAX', {
        fontSize: '14px',
        color: '#6ada6a',
        fontStyle: 'bold',
      });
      maxText.setOrigin(0.5);
      parent.add(maxText);
    } else {
      const costText = this.add.text(x + width / 2, y + height / 2 - 2, `Next: ${nextCost}g`, {
        fontSize: '14px',
        color: canAfford ? '#ffd700' : '#ff6666',
      });
      costText.setOrigin(0.5);
      parent.add(costText);

      // Make purchasable upgrades clickable
      if (canAfford) {
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => bg.setFillStyle(0x4a5a4a));
        bg.on('pointerout', () => bg.setFillStyle(0x3a3a4a));
        bg.on('pointerdown', () => {
          this.showConfirmDialog(nextCost, () => {
            this.confirmCastlePurchase(upgrade.id, currentLevel + 1, nextCost);
          });
        });
      }
    }
  }

  private confirmCastlePurchase(upgradeId: string, level: number, cost: number): void {
    const gameState = this.getGameState();

    // Deduct gold
    if (!gameState.spendGold(cost)) {
      AudioManager.getInstance(this)?.playSfx('purchase_fail');
      return;
    }

    // Apply upgrade
    gameState.castleUpgrades[upgradeId] = level;

    // Save progress to localStorage
    gameState.save();

    // Play purchase confirmation sound
    AudioManager.getInstance(this)?.playSfx('purchase_success');

    // Update gold display
    if (this.goldDisplay) {
      this.goldDisplay.setText(`Gold: ${gameState.gold}`);
    }

    // Rebuild castle panel
    this.castlePanel?.destroy();
    this.castlePanel = null;
    this.createCastlePanel();
  }

  private createUnitPanel(): void {
    const gameState = this.getGameState();
    const unlockedUnits = getUnlockedUnits(gameState.unlockedUnits);

    const container = this.add.container(0, 0);
    this.unitPanel = container;

    // Panel background
    const panelX = 40;
    const panelY = 100;
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
    container.add(panelBg);

    // Create unit buttons
    unlockedUnits.forEach((unit, index) => {
      const x = panelX + panelWidth / 2;
      const y = panelY + 20 + index * (UNIT_BUTTON_SIZE + UNIT_BUTTON_SPACING) + UNIT_BUTTON_SIZE / 2;
      this.createUnitButton(container, x, y, unit.id, unit.name);
    });
  }

  private createUnitButton(
    parent: Phaser.GameObjects.Container,
    x: number,
    y: number,
    unitId: string,
    unitName: string
  ): void {
    const buttonContainer = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, UNIT_BUTTON_SIZE, UNIT_BUTTON_SIZE, 0x3a3a4a);
    bg.setStrokeStyle(2, 0x6a6a7a);
    buttonContainer.add(bg);

    // Unit icon (colored circle)
    const iconColor = this.getUnitColor(unitId);
    const icon = this.add.circle(0, -8, 18, iconColor);
    buttonContainer.add(icon);

    // Unit name (abbreviated)
    const abbrev = unitName.substring(0, 4);
    const label = this.add.text(0, 20, abbrev, {
      fontSize: '11px',
      color: '#ffffff',
    });
    label.setOrigin(0.5);
    buttonContainer.add(label);

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

    parent.add(buttonContainer);
    this.unitButtons.set(unitId, buttonContainer);
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

    // Show confirmation dialog instead of purchasing directly
    this.showConfirmDialog(cost, () => {
      this.confirmPurchase(unitId, path, tier, cost);
    });
  }

  private confirmPurchase(unitId: string, path: UpgradePath, tier: number, cost: number): void {
    const gameState = this.getGameState();

    // Deduct gold
    if (!gameState.spendGold(cost)) {
      AudioManager.getInstance(this)?.playSfx('purchase_fail');
      return;
    }

    // Initialize unit upgrades if needed
    if (!gameState.unitUpgrades[unitId]) {
      gameState.unitUpgrades[unitId] = { offense: 0, defense: 0, utility: 0 };
    }

    // Apply upgrade
    gameState.unitUpgrades[unitId][path] = tier;

    // Save progress to localStorage
    gameState.save();

    // Play purchase confirmation sound
    AudioManager.getInstance(this)?.playSfx('purchase_success');

    // Update displays
    if (this.goldDisplay) {
      this.goldDisplay.setText(`Gold: ${gameState.gold}`);
    }

    // Refresh tree
    if (this.upgradeTree) {
      this.upgradeTree.updateState(gameState.unitUpgrades[unitId], gameState.gold);
    }
  }

  private showConfirmDialog(cost: number, onConfirm: () => void): void {
    this.hideConfirmDialog();

    const container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    container.setDepth(2000);

    // Dark overlay
    const overlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5);
    overlay.setInteractive();
    container.add(overlay);

    // Dialog box
    const dialogWidth = 280;
    const dialogHeight = 120;
    const dialogBg = this.add.rectangle(0, 0, dialogWidth, dialogHeight, 0x222222);
    dialogBg.setStrokeStyle(2, 0x444444);
    container.add(dialogBg);

    // Cost text - matches acceptance criteria: "150g - Confirm?"
    const costText = this.add.text(0, -25, `${cost}g - Confirm?`, {
      fontSize: '24px',
      color: '#ffd700',
    });
    costText.setOrigin(0.5);
    container.add(costText);

    // Button dimensions
    const buttonWidth = 100;
    const buttonHeight = 36;
    const buttonY = 25;
    const buttonSpacing = 20;

    // Confirm button
    const confirmBtn = this.add.rectangle(-buttonWidth / 2 - buttonSpacing / 2, buttonY, buttonWidth, buttonHeight, 0x4a7a4a);
    confirmBtn.setStrokeStyle(1, 0x6ada6a);
    confirmBtn.setInteractive({ useHandCursor: true });
    container.add(confirmBtn);

    const confirmText = this.add.text(-buttonWidth / 2 - buttonSpacing / 2, buttonY, 'Confirm', {
      fontSize: '18px',
      color: '#ffffff',
    });
    confirmText.setOrigin(0.5);
    container.add(confirmText);

    confirmBtn.on('pointerover', () => confirmBtn.setFillStyle(0x5a9a5a));
    confirmBtn.on('pointerout', () => confirmBtn.setFillStyle(0x4a7a4a));
    confirmBtn.on('pointerdown', () => {
      this.hideConfirmDialog();
      onConfirm();
    });

    // Cancel button
    const cancelBtn = this.add.rectangle(buttonWidth / 2 + buttonSpacing / 2, buttonY, buttonWidth, buttonHeight, 0x5a4a4a);
    cancelBtn.setStrokeStyle(1, 0x7a5a5a);
    cancelBtn.setInteractive({ useHandCursor: true });
    container.add(cancelBtn);

    const cancelText = this.add.text(buttonWidth / 2 + buttonSpacing / 2, buttonY, 'Cancel', {
      fontSize: '18px',
      color: '#ffffff',
    });
    cancelText.setOrigin(0.5);
    container.add(cancelText);

    cancelBtn.on('pointerover', () => cancelBtn.setFillStyle(0x7a5a5a));
    cancelBtn.on('pointerout', () => cancelBtn.setFillStyle(0x5a4a4a));
    cancelBtn.on('pointerdown', () => this.hideConfirmDialog());

    this.confirmDialog = container;
  }

  private hideConfirmDialog(): void {
    if (this.confirmDialog) {
      this.confirmDialog.destroy();
      this.confirmDialog = null;
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
