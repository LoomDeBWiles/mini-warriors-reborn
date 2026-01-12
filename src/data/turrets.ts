/**
 * Turret definitions and constants.
 * Turrets are fixed defensive structures that auto-attack enemies.
 */

export interface TurretTierDefinition {
  id: string;
  name: string;
  /** Damage per projectile */
  damage: number;
  /** Attack range in pixels */
  range: number;
  /** Attack cooldown in milliseconds */
  cooldownMs: number;
  /** Projectile speed in pixels/sec */
  projectileSpeed: number;
  /** Projectile color (hex) */
  projectileColor: number;
  /** Projectile size in pixels */
  projectileSize: number;
}

export const TURRET_TIERS: TurretTierDefinition[] = [
  {
    id: 'pebble',
    name: 'Pebble Turret',
    damage: 5,
    range: 150,
    cooldownMs: 1500,
    projectileSpeed: 300,
    projectileColor: 0x888888,
    projectileSize: 3,
  },
  {
    id: 'arrow',
    name: 'Arrow Turret',
    damage: 12,
    range: 200,
    cooldownMs: 1000,
    projectileSpeed: 450,
    projectileColor: 0x8b4513,
    projectileSize: 4,
  },
  {
    id: 'cannonball',
    name: 'Cannon Turret',
    damage: 25,
    range: 250,
    cooldownMs: 2000,
    projectileSpeed: 350,
    projectileColor: 0x333333,
    projectileSize: 6,
  },
];

/** Cost to purchase initial turret */
export const TURRET_PURCHASE_COST = 10;

/** Cost to upgrade to next tier */
export const TURRET_UPGRADE_COST = 15;

/** Maximum number of turrets allowed */
export const MAX_TURRETS = 3;

/** Get turret tier by index (0=pebble, 1=arrow, 2=cannonball) */
export function getTurretTier(tierIndex: number): TurretTierDefinition {
  return TURRET_TIERS[Math.min(Math.max(tierIndex, 0), TURRET_TIERS.length - 1)];
}

/** Check if tier can be upgraded */
export function canUpgradeTurret(currentTier: number): boolean {
  return currentTier < TURRET_TIERS.length - 1;
}
