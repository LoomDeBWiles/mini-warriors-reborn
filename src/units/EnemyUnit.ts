import Phaser from 'phaser';
import { Unit } from './Unit';
import { EnemyDefinition, ENEMY_DEFINITIONS } from '../data/enemies';

interface EnemyUnitConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  definition: EnemyDefinition;
}

/**
 * An enemy unit on the battlefield.
 * Extends Unit with enemy-specific behavior.
 */
export class EnemyUnit extends Unit {
  readonly enemyDefinition: EnemyDefinition;

  constructor(config: EnemyUnitConfig) {
    super({
      scene: config.scene,
      x: config.x,
      y: config.y,
      definition: {
        id: config.definition.id,
        name: config.definition.name,
        unlockStage: 1,
        spawnCost: 0,
        cooldownMs: 0,
        hp: config.definition.hp,
        damage: config.definition.damage,
        range: config.definition.range,
        speed: config.definition.speed,
      },
    });
    this.enemyDefinition = config.definition;
  }

  getGoldDrop(): number {
    return this.enemyDefinition.goldDrop;
  }
}

/**
 * Create an enemy unit from an enemy definition.
 * @param scene - The Phaser scene
 * @param enemyId - ID of the enemy type (e.g., 'goblin')
 * @param x - Initial x position
 * @param y - Initial y position
 * @returns EnemyUnit with stats from the enemy definition
 * @throws Error if enemyId is not found in ENEMY_DEFINITIONS
 */
export function createEnemyUnit(
  scene: Phaser.Scene,
  enemyId: string,
  x: number,
  y: number
): EnemyUnit {
  const definition = ENEMY_DEFINITIONS[enemyId];
  if (!definition) {
    throw new Error(`Unknown enemy ID: ${enemyId}`);
  }

  return new EnemyUnit({ scene, x, y, definition });
}
