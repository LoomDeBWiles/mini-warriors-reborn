import { Unit } from '../units/Unit';
import { Projectile } from './Projectile';

/**
 * Calculate damage from attacker to target.
 * Currently returns attacker's raw damage value.
 * Future: could factor in armor, buffs, damage types, etc.
 */
export function calculateDamage(attacker: Unit, _target: Unit): number {
  return attacker.definition.damage;
}

/**
 * Fire a projectile from attacker to target.
 * The projectile travels to the target and deals damage on hit.
 */
export function fireProjectile(attacker: Unit, target: Unit): Projectile {
  return new Projectile({
    scene: attacker.scene,
    attacker,
    target,
  });
}

/**
 * Process an attack from attacker to target.
 * Applies calculated damage to target, which handles:
 * - Showing damage numbers
 * - Updating health bar
 * - Destroying unit if HP <= 0
 */
export function processAttack(attacker: Unit, target: Unit): void {
  const damage = calculateDamage(attacker, target);
  target.takeDamage(damage);
}
