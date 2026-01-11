import Phaser from 'phaser';
import { Unit } from '../units/Unit';
import { Base } from '../entities/Base';
import { calculateDamage } from './CombatSystem';

type ProjectileTarget = Unit | Base;

interface ProjectileConfig {
  scene: Phaser.Scene;
  attacker: Unit;
  target: ProjectileTarget;
  speed?: number;
  damage?: number;
}

/** Splash damage multiplier (50% of primary damage) */
const SPLASH_DAMAGE_MULTIPLIER = 0.5;

/** Default projectile speed in pixels per second */
const DEFAULT_SPEED = 400;

/**
 * A projectile that travels from attacker to target and deals damage on hit.
 * Self-destructs after hitting target or if target is destroyed.
 */
export class Projectile extends Phaser.GameObjects.Arc {
  private target: ProjectileTarget;
  private speed: number;
  private damage: number;
  private splashRadius: number;

  constructor(config: ProjectileConfig) {
    super(config.scene, config.attacker.x, config.attacker.y, 4, 0, 360, false, 0xffff00);
    this.target = config.target;
    this.speed = config.speed ?? DEFAULT_SPEED;
    // Use provided damage for base targets, otherwise calculate from unit stats
    if (config.damage !== undefined) {
      this.damage = config.damage;
    } else if (config.target instanceof Unit) {
      this.damage = calculateDamage(config.attacker, config.target);
    } else {
      this.damage = config.attacker.definition.damage;
    }
    this.splashRadius = config.attacker.definition.splashRadius ?? 0;

    this.scene.add.existing(this);
    // Register for automatic preUpdate calls each frame
    this.addToUpdateList();
  }

  preUpdate(_time: number, delta: number): void {
    // Check if target is still valid (Units have active property, Base doesn't)
    if (this.target instanceof Unit && !this.target.active) {
      this.destroy();
      return;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 10) {
      this.target.takeDamage(this.damage);
      this.applySplashDamage();
      this.destroy();
      return;
    }

    const deltaSeconds = delta / 1000;
    const moveDistance = this.speed * deltaSeconds;
    const moveRatio = Math.min(moveDistance / distance, 1);

    this.x += dx * moveRatio;
    this.y += dy * moveRatio;
  }

  /**
   * Apply splash damage to enemies within splash radius (excluding primary target).
   * Uses duck typing to avoid circular dependency with EnemyUnit.
   */
  private applySplashDamage(): void {
    if (this.splashRadius <= 0) return;

    const splashDamage = Math.round(this.damage * SPLASH_DAMAGE_MULTIPLIER);
    const impactX = this.target.x;
    const impactY = this.target.y;

    for (const child of this.scene.children.list) {
      // Duck type check: must be a Unit with takeDamage method
      if (!(child instanceof Unit)) continue;
      if (child === this.target) continue;
      if (!child.active) continue;
      // Only damage enemies (units with enemyDefinition property)
      if (!('enemyDefinition' in child)) continue;

      const dx = child.x - impactX;
      const dy = child.y - impactY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= this.splashRadius) {
        child.takeDamage(splashDamage);
      }
    }
  }
}
