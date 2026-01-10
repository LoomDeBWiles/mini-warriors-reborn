import Phaser from 'phaser';
import { UPGRADE_PATHS, UpgradePath, canPurchaseTier } from '../data/upgrades';

const NODE_SIZE = 60;
const NODE_SPACING_X = 100;
const NODE_SPACING_Y = 90;
const PATH_COLORS: Record<UpgradePath, number> = {
  offense: 0xd94a4a,
  defense: 0x4a90d9,
  utility: 0x4ad99a,
};

interface UnitUpgrades {
  offense: number;
  defense: number;
  utility: number;
}

interface UpgradeTreeConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  unitId: string;
  unitName: string;
  unitUpgrades: UnitUpgrades;
  playerGold: number;
  onNodeClick?: (path: UpgradePath, tier: number, cost: number) => void;
}

/**
 * Displays a 3-path upgrade tree for a unit.
 * Each path (offense, defense, utility) has 3 tiers displayed vertically.
 */
export class UpgradeTree extends Phaser.GameObjects.Container {
  private unitId: string;
  private unitName: string;
  private unitUpgrades: UnitUpgrades;
  private playerGold: number;
  private onNodeClick?: (path: UpgradePath, tier: number, cost: number) => void;

  private nodes: Map<string, Phaser.GameObjects.Container> = new Map();

  constructor(config: UpgradeTreeConfig) {
    super(config.scene, config.x, config.y);
    this.unitId = config.unitId;
    this.unitName = config.unitName;
    this.unitUpgrades = config.unitUpgrades;
    this.playerGold = config.playerGold;
    this.onNodeClick = config.onNodeClick;

    this.scene.add.existing(this);
    this.createTree();
  }

  private createTree(): void {
    // Unit name header
    const header = this.scene.add.text(NODE_SPACING_X, -40, this.unitName, {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    header.setOrigin(0.5);
    this.add(header);

    // Draw connecting lines first (behind nodes)
    this.drawConnections();

    // Create path labels and nodes
    const paths: UpgradePath[] = ['offense', 'defense', 'utility'];
    paths.forEach((path, pathIndex) => {
      const pathDef = UPGRADE_PATHS[path];
      const x = pathIndex * NODE_SPACING_X;

      // Path label
      const label = this.scene.add.text(x, 10, pathDef.name, {
        fontSize: '16px',
        color: this.colorToHex(PATH_COLORS[path]),
      });
      label.setOrigin(0.5);
      this.add(label);

      // Create tier nodes
      pathDef.tiers.forEach((tierDef) => {
        const y = 40 + tierDef.tier * NODE_SPACING_Y;
        this.createNode(x, y, path, tierDef.tier, tierDef.cost, tierDef.description);
      });
    });
  }

  private drawConnections(): void {
    const graphics = this.scene.add.graphics();
    this.add(graphics);

    const paths: UpgradePath[] = ['offense', 'defense', 'utility'];
    paths.forEach((_, pathIndex) => {
      const x = pathIndex * NODE_SPACING_X;
      graphics.lineStyle(2, 0x444444);

      // Draw vertical line connecting tiers
      for (let tier = 1; tier < 3; tier++) {
        const y1 = 40 + tier * NODE_SPACING_Y + NODE_SIZE / 2;
        const y2 = 40 + (tier + 1) * NODE_SPACING_Y - NODE_SIZE / 2;
        graphics.beginPath();
        graphics.moveTo(x, y1);
        graphics.lineTo(x, y2);
        graphics.strokePath();
      }
    });
  }

  private createNode(
    x: number,
    y: number,
    path: UpgradePath,
    tier: number,
    cost: number,
    description: string
  ): void {
    const container = this.scene.add.container(x, y);
    const nodeKey = `${path}_${tier}`;

    const ownedTier = this.unitUpgrades[path];
    const isPurchased = tier <= ownedTier;
    const canPurchase = canPurchaseTier(ownedTier, tier);
    const isAffordable = this.playerGold >= cost;
    const isClickable = canPurchase && isAffordable;
    const isLocked = tier > ownedTier + 1;

    // Node background
    let bgColor: number;
    if (isPurchased) {
      bgColor = PATH_COLORS[path];
    } else if (isClickable) {
      bgColor = 0x3a5a3a;
    } else if (canPurchase) {
      bgColor = 0x5a3a3a;
    } else {
      bgColor = 0x2a2a2a;
    }

    const bg = this.scene.add.rectangle(0, 0, NODE_SIZE, NODE_SIZE, bgColor);
    bg.setStrokeStyle(2, isPurchased ? 0xffffff : isClickable ? 0x6ada6a : 0x555555);
    container.add(bg);

    // Tier number
    const tierText = this.scene.add.text(0, -10, `T${tier}`, {
      fontSize: '18px',
      color: isPurchased || isClickable ? '#ffffff' : '#888888',
      fontStyle: 'bold',
    });
    tierText.setOrigin(0.5);
    container.add(tierText);

    // Cost or checkmark
    if (isPurchased) {
      const check = this.scene.add.text(0, 12, '✓', {
        fontSize: '20px',
        color: '#ffffff',
      });
      check.setOrigin(0.5);
      container.add(check);
    } else if (isLocked) {
      const lock = this.scene.add.text(0, 12, '🔒', {
        fontSize: '14px',
      });
      lock.setOrigin(0.5);
      container.add(lock);
    } else {
      const costColor = isAffordable ? '#ffd700' : '#ff6666';
      const costText = this.scene.add.text(0, 12, `${cost}g`, {
        fontSize: '14px',
        color: costColor,
      });
      costText.setOrigin(0.5);
      container.add(costText);
    }

    // Make clickable nodes interactive
    if (isClickable) {
      bg.setInteractive({ useHandCursor: true });

      bg.on('pointerover', () => {
        bg.setFillStyle(0x4a7a4a);
        this.showTooltip(container, description, cost);
      });

      bg.on('pointerout', () => {
        bg.setFillStyle(0x3a5a3a);
        this.hideTooltip();
      });

      bg.on('pointerdown', () => {
        this.onNodeClick?.(path, tier, cost);
      });
    } else if (!isPurchased) {
      // Show tooltip on hover for non-purchased nodes
      bg.setInteractive();
      bg.on('pointerover', () => {
        this.showTooltip(container, description, cost, !isAffordable);
      });
      bg.on('pointerout', () => {
        this.hideTooltip();
      });
    }

    this.nodes.set(nodeKey, container);
    this.add(container);
  }

  private tooltip: Phaser.GameObjects.Container | null = null;

  private showTooltip(
    node: Phaser.GameObjects.Container,
    description: string,
    cost: number,
    showCantAfford = false
  ): void {
    this.hideTooltip();

    const text = showCantAfford ? `${description}\nNeed ${cost}g` : description;
    const tooltipText = this.scene.add.text(0, 0, text, {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#222222',
      padding: { x: 8, y: 6 },
      align: 'center',
    });
    tooltipText.setOrigin(0.5, 1);

    this.tooltip = this.scene.add.container(node.x, node.y - NODE_SIZE / 2 - 8, [tooltipText]);
    this.tooltip.setDepth(100);
    this.add(this.tooltip);
  }

  private hideTooltip(): void {
    if (this.tooltip) {
      this.tooltip.destroy();
      this.tooltip = null;
    }
  }

  private colorToHex(color: number): string {
    return '#' + color.toString(16).padStart(6, '0');
  }

  /** Update the tree when upgrades or gold changes */
  updateState(unitUpgrades: UnitUpgrades, playerGold: number): void {
    this.unitUpgrades = unitUpgrades;
    this.playerGold = playerGold;

    // Rebuild the tree
    this.removeAll(true);
    this.nodes.clear();
    this.createTree();
  }

  getUnitId(): string {
    return this.unitId;
  }
}
