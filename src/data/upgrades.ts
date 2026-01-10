/**
 * Upgrade path definitions for units.
 * Each path has 3 tiers with increasing effects and costs.
 */

export type UpgradePath = 'offense' | 'defense' | 'utility';

export interface UpgradeTier {
  tier: number;
  cost: number;
  description: string;
}

export interface UpgradePathDefinition {
  id: UpgradePath;
  name: string;
  tiers: UpgradeTier[];
}

/** Upgrade path definitions with tier costs and descriptions */
export const UPGRADE_PATHS: Record<UpgradePath, UpgradePathDefinition> = {
  offense: {
    id: 'offense',
    name: 'Offense',
    tiers: [
      { tier: 1, cost: 150, description: '+15% Damage' },
      { tier: 2, cost: 400, description: '+25% Damage' },
      { tier: 3, cost: 800, description: '+40% Damage' },
    ],
  },
  defense: {
    id: 'defense',
    name: 'Defense',
    tiers: [
      { tier: 1, cost: 150, description: '+20% HP' },
      { tier: 2, cost: 400, description: '+35% HP' },
      { tier: 3, cost: 800, description: '+50% HP' },
    ],
  },
  utility: {
    id: 'utility',
    name: 'Utility',
    tiers: [
      { tier: 1, cost: 200, description: '-15% Spawn Cost' },
      { tier: 2, cost: 500, description: '-20% Cooldown' },
      { tier: 3, cost: 1000, description: '-25% Cost & CD' },
    ],
  },
};

/** Get the cost for a specific upgrade tier */
export function getUpgradeCost(path: UpgradePath, tier: number): number {
  const pathDef = UPGRADE_PATHS[path];
  const tierDef = pathDef.tiers.find((t) => t.tier === tier);
  return tierDef?.cost ?? 0;
}

/** Check if a tier is purchasable (previous tier must be owned) */
export function canPurchaseTier(ownedTier: number, targetTier: number): boolean {
  return targetTier === ownedTier + 1;
}

/**
 * Castle upgrade definitions.
 * Each castle upgrade has 5 levels.
 */
export interface CastleUpgradeDefinition {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  /** Cost for each level (index 0 = level 1) */
  costs: number[];
  /** Effect per level */
  effect: string;
}

export const CASTLE_UPGRADES: CastleUpgradeDefinition[] = [
  {
    id: 'fortification',
    name: 'Fortification',
    description: 'Increases base HP',
    maxLevel: 5,
    costs: [200, 400, 800, 1500, 3000],
    effect: '+10% Base HP per level',
  },
  {
    id: 'goldMine',
    name: 'Gold Mine',
    description: 'Passive gold income during battle',
    maxLevel: 5,
    costs: [300, 600, 1000, 1800, 3500],
    effect: '+0.5 gold/sec per level',
  },
  {
    id: 'armory',
    name: 'Armory',
    description: 'Increases all unit damage',
    maxLevel: 5,
    costs: [250, 500, 900, 1600, 3200],
    effect: '+5% damage per level',
  },
  {
    id: 'barracks',
    name: 'Barracks',
    description: 'Reduces unit spawn cooldowns',
    maxLevel: 5,
    costs: [250, 500, 900, 1600, 3200],
    effect: '-5% cooldown per level',
  },
  {
    id: 'treasury',
    name: 'Treasury',
    description: 'Increases gold from enemies',
    maxLevel: 5,
    costs: [350, 700, 1200, 2000, 4000],
    effect: '+10% gold drops per level',
  },
];

/** Get castle upgrade cost for a specific level */
export function getCastleUpgradeCost(upgradeId: string, level: number): number {
  const upgrade = CASTLE_UPGRADES.find((u) => u.id === upgradeId);
  if (!upgrade || level < 1 || level > upgrade.maxLevel) return 0;
  return upgrade.costs[level - 1];
}

/** Damage multipliers by offense tier (index 0 = no upgrade) */
const OFFENSE_MULTIPLIERS = [1.0, 1.15, 1.25, 1.4];

/** HP multipliers by defense tier (index 0 = no upgrade) */
const DEFENSE_MULTIPLIERS = [1.0, 1.2, 1.35, 1.5];

/** Spawn cost multipliers by utility tier (index 0 = no upgrade) */
const SPAWN_COST_MULTIPLIERS = [1.0, 0.85, 0.85, 0.75];

/** Cooldown multipliers by utility tier (index 0 = no upgrade) */
const COOLDOWN_MULTIPLIERS = [1.0, 1.0, 0.8, 0.75];

/** Get damage multiplier for an offense tier (0-3) */
export function getOffenseMultiplier(tier: number): number {
  return OFFENSE_MULTIPLIERS[Math.min(Math.max(tier, 0), 3)];
}

/** Get HP multiplier for a defense tier (0-3) */
export function getDefenseMultiplier(tier: number): number {
  return DEFENSE_MULTIPLIERS[Math.min(Math.max(tier, 0), 3)];
}

/** Get spawn cost multiplier for a utility tier (0-3) */
export function getSpawnCostMultiplier(tier: number): number {
  return SPAWN_COST_MULTIPLIERS[Math.min(Math.max(tier, 0), 3)];
}

/** Get cooldown multiplier for a utility tier (0-3) */
export function getCooldownMultiplier(tier: number): number {
  return COOLDOWN_MULTIPLIERS[Math.min(Math.max(tier, 0), 3)];
}

/** Get fortification multiplier: +10% base HP per level */
export function getFortificationMultiplier(level: number): number {
  return 1 + 0.1 * Math.max(level, 0);
}

/** Get armory multiplier: +5% unit damage per level */
export function getArmoryMultiplier(level: number): number {
  return 1 + 0.05 * Math.max(level, 0);
}

/** Get barracks multiplier: -5% spawn cooldown per level */
export function getBarracksMultiplier(level: number): number {
  return 1 - 0.05 * Math.max(level, 0);
}

/** Get treasury multiplier: +10% gold drops per level */
export function getTreasuryMultiplier(level: number): number {
  return 1 + 0.1 * Math.max(level, 0);
}
