import Phaser from 'phaser';
import { Unit } from '../units/Unit';
import { calculateDamage } from './CombatSystem';

interface ProjectileConfig {
  scene: Phaser.Scene;
  attacker: Unit;
  target: Unit;
  speed?: number;
}

/** Default projectile speed in pixels per second */
const DEFAULT_SPEED = 400;

/**
 * A projectile that travels from attacker to target and deals damage on hit.
 * Self-destructs after hitting target or if target is destroyed.
 */
export class Projectile extends Phaser.GameObjects.Arc {
  private target: Unit;
  private speed: number;
  private damage: number;

  constructor(config: ProjectileConfig) {
    super(config.scene, config.attacker.x, config.attacker.y, 4, 0, 360, false, 0xffff00);
    this.target = config.target;
    this.speed = config.speed ?? DEFAULT_SPEED;
    this.damage = calculateDamage(config.attacker, config.target);

    this.scene.add.existing(this);
  }

  update(_time: number, delta: number): void {
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
