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
