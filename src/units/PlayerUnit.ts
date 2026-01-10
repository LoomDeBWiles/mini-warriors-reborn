import Phaser from 'phaser';
import { Unit } from './Unit';
import { UNIT_DEFINITIONS, UnitDefinition } from '../data/units';
import { GameState } from '../managers/GameState';
import {
  getOffenseMultiplier,
  getDefenseMultiplier,
  getSpawnCostMultiplier,
  getCooldownMultiplier,
  getArmoryMultiplier,
  getBarracksMultiplier,
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
    super({ ...config, textureKey: `unit_${config.definition.id}` });
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
 * Get effective spawn cost and cooldown for a unit, applying utility upgrades and barracks bonus.
 * Returns base values if no upgrades or GameState unavailable.
 */
export function getEffectiveSpawnStats(
  scene: Phaser.Scene,
  unitId: string
): { spawnCost: number; cooldownMs: number } {
  const baseDefinition = UNIT_DEFINITIONS[unitId];
  if (!baseDefinition) {
    throw new Error(`Unknown unit ID: ${unitId}`);
  }

  const gameState = GameState.getInstance(scene);
  const utilityTier = gameState?.unitUpgrades[unitId]?.utility ?? 0;
  const barracksLevel = gameState?.castleUpgrades['barracks'] ?? 0;

  // Apply both utility upgrade and barracks castle upgrade to cooldown
  const cooldownMultiplier = getCooldownMultiplier(utilityTier) * getBarracksMultiplier(barracksLevel);

  return {
    spawnCost: Math.round(baseDefinition.spawnCost * getSpawnCostMultiplier(utilityTier)),
    cooldownMs: Math.round(baseDefinition.cooldownMs * cooldownMultiplier),
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

    // Apply armory castle upgrade bonus to damage
    const armoryLevel = gameState.castleUpgrades['armory'] ?? 0;
    if (armoryLevel > 0) {
      definition = {
        ...definition,
        damage: Math.round(definition.damage * getArmoryMultiplier(armoryLevel)),
      };
    }
  }

  return new PlayerUnit({ scene, x, y, definition });
}
