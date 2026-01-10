import Phaser from 'phaser';
import { Unit } from './Unit';
import { UNIT_DEFINITIONS, UnitDefinition } from '../data/units';

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
 * Create a player unit from a unit definition.
 * @param scene - The Phaser scene
 * @param unitId - ID of the unit type (e.g., 'swordsman')
 * @param x - Initial x position
 * @param y - Initial y position
 * @returns PlayerUnit with stats from the unit definition
 * @throws Error if unitId is not found in UNIT_DEFINITIONS
 */
export function createPlayerUnit(
  scene: Phaser.Scene,
  unitId: string,
  x: number,
  y: number
): PlayerUnit {
  const definition = UNIT_DEFINITIONS[unitId];
  if (!definition) {
    throw new Error(`Unknown unit ID: ${unitId}`);
  }

  return new PlayerUnit({ scene, x, y, definition });
}
