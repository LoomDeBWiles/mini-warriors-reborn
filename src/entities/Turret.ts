import Phaser from 'phaser';
import {
  TurretTierDefinition,
  getTurretTier,
  canUpgradeTurret,
  TURRET_UPGRADE_COST,
} from '../data/turrets';
import { TurretProjectile } from '../systems/TurretProjectile';
import { Unit } from '../units/Unit';
import { UnitState } from '../units/StateMachine';

interface TurretConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  index: number;
  initialTier?: number;
  onUpgradeRequest: (turret: Turret) => void;
}

/**
 * A fixed defensive turret that automatically attacks nearby enemies.
 * Indestructible once placed. Can be upgraded through 3 tiers.
 */
export class Turret extends Phaser.GameObjects.Container {
  readonly index: number;
  private tierIndex: number;
  private tier: TurretTierDefinition;
  private attackCooldown: number = 0;
  private turretGraphics: Phaser.GameObjects.Graphics;
  private tierIndicator: Phaser.GameObjects.Text;
  private onUpgradeRequest: (turret: Turret) => void;
  private tooltipText: Phaser.GameObjects.Text | null = null;

  constructor(config: TurretConfig) {
    super(config.scene, config.x, config.y);
    this.index = config.index;
    this.tierIndex = config.initialTier ?? 0;
    this.tier = getTurretTier(this.tierIndex);
    this.onUpgradeRequest = config.onUpgradeRequest;

    // Draw turret base and tower
    this.turretGraphics = this.scene.add.graphics();
    this.add(this.turretGraphics);
    this.drawTurret();

    // Tier indicator (stars)
    this.tierIndicator = this.scene.add.text(0, 25, this.getTierLabel(), {
      fontSize: '12px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.tierIndicator.setOrigin(0.5);
    this.add(this.tierIndicator);

    // Make interactive for upgrade
    this.setSize(40, 50);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerdown', () => this.onUpgradeRequest(this));
    this.on('pointerover', () => this.showUpgradeTooltip());
    this.on('pointerout', () => this.hideUpgradeTooltip());

    this.scene.add.existing(this);
  }

  private drawTurret(): void {
    this.turretGraphics.clear();

    // Base platform
    this.turretGraphics.fillStyle(0x555555, 1);
    this.turretGraphics.fillRect(-15, 10, 30, 10);

    // Tower body - color based on tier
    const tierColors = [0x666666, 0x8b4513, 0x222222];
    this.turretGraphics.fillStyle(tierColors[this.tierIndex], 1);
    this.turretGraphics.fillRect(-10, -15, 20, 25);

    // Barrel/launcher
    const barrelColors = [0x888888, 0xcd853f, 0x444444];
    this.turretGraphics.fillStyle(barrelColors[this.tierIndex], 1);
    this.turretGraphics.fillRect(10, -8, 12, 6);
  }

  private getTierLabel(): string {
    return '\u2605'.repeat(this.tierIndex + 1);
  }

  getTier(): number {
    return this.tierIndex;
  }

  getTierDefinition(): TurretTierDefinition {
    return this.tier;
  }

  canUpgrade(): boolean {
    return canUpgradeTurret(this.tierIndex);
  }

  upgrade(): boolean {
    if (!this.canUpgrade()) return false;

    this.tierIndex++;
    this.tier = getTurretTier(this.tierIndex);
    this.drawTurret();
    this.tierIndicator.setText(this.getTierLabel());

    // Visual feedback
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    return true;
  }

  /**
   * Update turret AI - find target and attack.
   * Call from BattleScene update loop.
   */
  updateTurret(deltaMs: number, enemies: Unit[]): void {
    // Reduce cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaMs;
      return;
    }

    // Find nearest enemy in range
    const target = this.findTarget(enemies);
    if (!target) return;

    // Fire projectile
    new TurretProjectile({
      scene: this.scene,
      startX: this.x + 16, // Barrel tip
      startY: this.y - 5,
      target,
      damage: this.tier.damage,
      speed: this.tier.projectileSpeed,
      color: this.tier.projectileColor,
      size: this.tier.projectileSize,
    });

    this.attackCooldown = this.tier.cooldownMs;
  }

  private findTarget(enemies: Unit[]): Unit | null {
    let nearest: Unit | null = null;
    let nearestDist = Infinity;

    for (const enemy of enemies) {
      if (!enemy.active) continue;
      if (enemy.getState() === UnitState.Dying) continue;

      const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      if (dist <= this.tier.range && dist < nearestDist) {
        nearestDist = dist;
        nearest = enemy;
      }
    }

    return nearest;
  }

  private showUpgradeTooltip(): void {
    if (this.tooltipText) return;
    if (!this.canUpgrade()) return;

    const nextTier = getTurretTier(this.tierIndex + 1);
    this.tooltipText = this.scene.add.text(
      this.x,
      this.y - 45,
      `Upgrade to ${nextTier.name}\n${TURRET_UPGRADE_COST}g`,
      {
        fontSize: '10px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 4, y: 2 },
        align: 'center',
      }
    );
    this.tooltipText.setOrigin(0.5);
    this.tooltipText.setDepth(2000);
  }

  private hideUpgradeTooltip(): void {
    if (this.tooltipText) {
      this.tooltipText.destroy();
      this.tooltipText = null;
    }
  }
}
