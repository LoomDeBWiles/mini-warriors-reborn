import { GameStateData, UnitUpgrades } from '../managers/GameState';
import { UpgradePath, getUpgradeCost, canPurchaseTier } from '../data/upgrades';

/**
 * Manages unit upgrade purchases.
 * Validates purchases and updates game state.
 */
export class UpgradeManager {
  private state: GameStateData;

  constructor(state: GameStateData) {
    this.state = state;
  }

  /**
   * Attempt to purchase an upgrade for a unit.
   * @param unitId - ID of the unit to upgrade
   * @param path - Upgrade path ('offense' | 'defense' | 'utility')
   * @param tier - Target tier (1-3)
   * @returns true if purchase succeeded, false if insufficient gold or already purchased
   */
  purchase(unitId: string, path: string, tier: number): boolean {
    const upgradePath = path as UpgradePath;

    const cost = getUpgradeCost(upgradePath, tier);
    if (cost === 0) {
      return false;
    }

    if (this.state.gold < cost) {
      return false;
    }

    const unitUpgrades = this.getUnitUpgrades(unitId);
    const currentTier = unitUpgrades[upgradePath];

    if (!canPurchaseTier(currentTier, tier)) {
      return false;
    }

    this.state.gold -= cost;
    unitUpgrades[upgradePath] = tier;

    return true;
  }

  private getUnitUpgrades(unitId: string): UnitUpgrades {
    if (!this.state.unitUpgrades[unitId]) {
      this.state.unitUpgrades[unitId] = { offense: 0, defense: 0, utility: 0 };
    }
    return this.state.unitUpgrades[unitId];
  }
}
