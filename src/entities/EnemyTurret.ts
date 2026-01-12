import Phaser from 'phaser';
import { TurretProjectile } from '../systems/TurretProjectile';
import { Unit } from '../units/Unit';
import { UnitState } from '../units/StateMachine';

interface EnemyTurretConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
}

/** Enemy turret stats (cannonball tier) */
const ENEMY_TURRET_STATS = {
  damage: 25,
  range: 250,
  cooldownMs: 2000,
  projectileSpeed: 350,
  projectileColor: 0x880000, // Dark red
  projectileSize: 6,
};

/**
 * An enemy defensive turret that automatically attacks player units.
 * Fixed cannonball tier, not upgradeable. Appears on final level.
 */
export class EnemyTurret extends Phaser.GameObjects.Container {
  private attackCooldown: number = 0;
  private turretGraphics: Phaser.GameObjects.Graphics;

  constructor(config: EnemyTurretConfig) {
    super(config.scene, config.x, config.y);

    // Draw turret
    this.turretGraphics = this.scene.add.graphics();
    this.add(this.turretGraphics);
    this.drawTurret();

    this.scene.add.existing(this);
  }

  private drawTurret(): void {
    this.turretGraphics.clear();

    // Base platform - dark metal
    this.turretGraphics.fillStyle(0x333333, 1);
    this.turretGraphics.fillRect(-15, 10, 30, 10);

    // Tower body - dark red/maroon
    this.turretGraphics.fillStyle(0x660000, 1);
    this.turretGraphics.fillRect(-10, -15, 20, 25);

    // Barrel/launcher - points LEFT (negative x direction)
    this.turretGraphics.fillStyle(0x440000, 1);
    this.turretGraphics.fillRect(-22, -8, 12, 6);

    // Skull decoration on tower
    this.turretGraphics.fillStyle(0xcccccc, 1);
    this.turretGraphics.fillCircle(0, -5, 4);
  }

  /**
   * Update turret AI - find target and attack.
   * Call from BattleScene update loop.
   */
  updateTurret(deltaMs: number, playerUnits: Unit[]): void {
    // Reduce cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaMs;
      return;
    }

    // Find nearest player unit in range
    const target = this.findTarget(playerUnits);
    if (!target) return;

    // Fire projectile (barrel tip is on the LEFT side)
    new TurretProjectile({
      scene: this.scene,
      startX: this.x - 16, // Barrel tip (left side)
      startY: this.y - 5,
      target,
      damage: ENEMY_TURRET_STATS.damage,
      speed: ENEMY_TURRET_STATS.projectileSpeed,
      color: ENEMY_TURRET_STATS.projectileColor,
      size: ENEMY_TURRET_STATS.projectileSize,
    });

    this.attackCooldown = ENEMY_TURRET_STATS.cooldownMs;
  }

  private findTarget(playerUnits: Unit[]): Unit | null {
    let nearest: Unit | null = null;
    let nearestDist = Infinity;

    for (const unit of playerUnits) {
      if (!unit.active) continue;
      if (unit.getState() === UnitState.Dying) continue;

      const dist = Phaser.Math.Distance.Between(this.x, this.y, unit.x, unit.y);
      if (dist <= ENEMY_TURRET_STATS.range && dist < nearestDist) {
        nearestDist = dist;
        nearest = unit;
      }
    }

    return nearest;
  }
}
