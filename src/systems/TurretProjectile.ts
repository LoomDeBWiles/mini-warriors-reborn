import Phaser from 'phaser';
import { Unit } from '../units/Unit';

interface TurretProjectileConfig {
  scene: Phaser.Scene;
  startX: number;
  startY: number;
  target: Unit;
  damage: number;
  speed: number;
  color: number;
  size: number;
}

/**
 * A projectile fired by a turret.
 * Travels to target and deals fixed damage on hit.
 * Self-destructs after hitting target or if target is destroyed.
 */
export class TurretProjectile extends Phaser.GameObjects.Arc {
  private target: Unit;
  private speed: number;
  private damage: number;

  constructor(config: TurretProjectileConfig) {
    super(config.scene, config.startX, config.startY, config.size, 0, 360, false, config.color);
    this.target = config.target;
    this.speed = config.speed;
    this.damage = config.damage;

    this.scene.add.existing(this);
    this.addToUpdateList();
  }

  preUpdate(_time: number, delta: number): void {
    // Check if target is still valid
    if (!this.target.active) {
      this.destroy();
      return;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 10) {
      this.target.takeDamage(this.damage);
      this.destroy();
      return;
    }

    const deltaSeconds = delta / 1000;
    const moveDistance = this.speed * deltaSeconds;
    const moveRatio = Math.min(moveDistance / distance, 1);

    this.x += dx * moveRatio;
    this.y += dy * moveRatio;
  }
}
