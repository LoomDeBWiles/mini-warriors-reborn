import Phaser from 'phaser';
import { getStage, calculateStars } from '../data/stages';
import { UNIT_DEFINITIONS } from '../data/units';
import { StatModifiers } from './UpgradeManager';

/**
 * Battle rewards returned after a victory.
 */
export interface BattleRewards {
  baseGold: number;
  bonusGold: number;
  timeBonus: number;
  stars: 1 | 2 | 3;
  totalGold: number;
  gems: number;
  unitUnlock?: string;
}

/**
 * Calculate rewards for a completed battle.
 * @param stageId - Stage number (1-20, or 0 for endless)
 * @param baseHP - Remaining base HP
 * @param maxHP - Maximum base HP
 * @param elapsedTime - Battle duration in seconds
 * @param killGold - Gold earned from killing enemies
 * @returns BattleRewards object with totals and unlocks
 */
export function calculateRewards(
  stageId: number,
  baseHP: number,
  maxHP: number,
  elapsedTime: number,
  killGold: number,
): BattleRewards {
  const stage = getStage(stageId);
  const stars = calculateStars(baseHP, maxHP, elapsedTime, stage.targetTime);

  const baseGold = stage.baseGoldReward;
  const bonusGold = killGold;

  // Time bonus: 10% of base gold if completed under target time
  const timeBonus = elapsedTime <= stage.targetTime ? Math.floor(baseGold * 0.1) : 0;

  const totalGold = baseGold + bonusGold + timeBonus;

  // Gems: awarded on first 3-star clear (10 gems) or first clear of any kind (5 gems)
  // For simplicity, award based on stars: 3 stars = 10 gems, else 5 gems
  // (Actual "first clear" logic would require GameState access, kept simple here)
  const gems = stars === 3 ? 10 : 5;

  return {
    baseGold,
    bonusGold,
    timeBonus,
    stars,
    totalGold,
    gems,
    unitUnlock: stage.unlocksUnit,
  };
}

/**
 * Manages battle economy: gold tracking and events.
 * Tracks gold earned during battle and emits events on changes.
 */
export class EconomyManager {
  private scene: Phaser.Scene;
  private gold: number;
  private getModifiers: (unitId: string) => StatModifiers;

  constructor(
    scene: Phaser.Scene,
    initialGold: number = 0,
    getModifiers?: (unitId: string) => StatModifiers,
  ) {
    this.scene = scene;
    this.gold = initialGold;
    this.getModifiers =
      getModifiers ??
      (() => ({
        damageMultiplier: 1.0,
        hpMultiplier: 1.0,
        costMultiplier: 1.0,
        cooldownMultiplier: 1.0,
      }));
  }

  /**
   * Add gold to the battle state.
   * Emits 'gold-changed' event with the new total.
   * Negative amounts are silently ignored.
   */
  addGold(amount: number): void {
    if (amount < 0) return;

    this.gold += amount;
    this.scene.events.emit('gold-changed', { gold: this.gold, added: amount });
  }

  /**
   * Get current gold amount.
   */
  getGold(): number {
    return this.gold;
  }

  /**
   * Check if a unit can be spawned with current gold.
   * Applies upgrade cost modifier to the unit's base spawn cost.
   * @param unitId - ID of the unit to check affordability for
   * @returns true if current gold >= adjusted spawn cost
   */
  canSpend(unitId: string): boolean {
    const unit = UNIT_DEFINITIONS[unitId];
    if (!unit) {
      return false;
    }

    const modifiers = this.getModifiers(unitId);
    const adjustedCost = Math.floor(unit.spawnCost * modifiers.costMultiplier);

    return this.gold >= adjustedCost;
  }
}
