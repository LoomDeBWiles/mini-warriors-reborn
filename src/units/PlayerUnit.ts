import Phaser from 'phaser';
import { Unit } from './Unit';
import { UNIT_DEFINITIONS, UnitDefinition } from '../data/units';
import { GameState } from '../managers/GameState';
import {
  getOffenseMultiplier,
  getDefenseMultiplier,
  getSpawnCostMultiplier,
  getCooldownMultiplier,
} from '../data/upgrades';

interface PlayerUnitConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  definition: UnitDefinition;
}

/**
 * A player-controlled unit on the battlefield.
 * Extends Unit with player-specific behavior.
 */
export class PlayerUnit extends Unit {
  constructor(config: PlayerUnitConfig) {
    super(config);
  }
}

/**
 * Apply upgrade multipliers to a unit definition.
 * Returns a new definition with modified stats.
 */
function applyUpgrades(
  definition: UnitDefinition,
  offenseTier: number,
  defenseTier: number,
  utilityTier: number
): UnitDefinition {
  return {
    ...definition,
    damage: Math.round(definition.damage * getOffenseMultiplier(offenseTier)),
    hp: Math.round(definition.hp * getDefenseMultiplier(defenseTier)),
    spawnCost: Math.round(definition.spawnCost * getSpawnCostMultiplier(utilityTier)),
    cooldownMs: Math.round(definition.cooldownMs * getCooldownMultiplier(utilityTier)),
  };
}

/**
 * Create a player unit from a unit definition.
 * Applies upgrade multipliers from GameState if available.
 * @param scene - The Phaser scene
 * @param unitId - ID of the unit type (e.g., 'swordsman')
 * @param x - Initial x position
 * @param y - Initial y position
 * @returns PlayerUnit with stats from the unit definition, modified by upgrades
 * @throws Error if unitId is not found in UNIT_DEFINITIONS
 */
export function createPlayerUnit(
  scene: Phaser.Scene,
  unitId: string,
  x: number,
  y: number
): PlayerUnit {
  const baseDefinition = UNIT_DEFINITIONS[unitId];
  if (!baseDefinition) {
    throw new Error(`Unknown unit ID: ${unitId}`);
  }

  const gameState = GameState.getInstance(scene);
  let definition = baseDefinition;

  if (gameState) {
    const upgrades = gameState.unitUpgrades[unitId];
    if (upgrades) {
      definition = applyUpgrades(
        baseDefinition,
        upgrades.offense,
        upgrades.defense,
        upgrades.utility
      );
    }
  }

  return new PlayerUnit({ scene, x, y, definition });
}
