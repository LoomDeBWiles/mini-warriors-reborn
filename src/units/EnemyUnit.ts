import Phaser from 'phaser';
import { Unit, UnitState } from './Unit';
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
      textureKey: `enemy_${config.definition.id}`,
    });
    this.enemyDefinition = config.definition;
  }

  getGoldDrop(): number {
    return this.enemyDefinition.goldDrop;
  }

  protected override onStateChange(_oldState: UnitState, newState: UnitState): void {
    if (newState === UnitState.Dying) {
      this.scene.events.emit('gold-earned', { amount: this.enemyDefinition.goldDrop });
      this.scene.events.emit('enemy-killed');
    }
  }
}

/**
 * Create an enemy unit from an enemy definition.
 * @param scene - The Phaser scene
 * @param enemyId - ID of the enemy type (e.g., 'goblin')
 * @param x - Initial x position
 * @param y - Initial y position
 * @param hpMultiplier - Multiplier for enemy HP (default 1.0)
 * @param damageMultiplier - Multiplier for enemy damage (default 1.0)
 * @returns EnemyUnit with stats from the enemy definition, scaled by multipliers
 * @throws Error if enemyId is not found in ENEMY_DEFINITIONS
 */
export function createEnemyUnit(
  scene: Phaser.Scene,
  enemyId: string,
  x: number,
  y: number,
  hpMultiplier = 1.0,
  damageMultiplier = 1.0
): EnemyUnit {
  const baseDefinition = ENEMY_DEFINITIONS[enemyId];
  if (!baseDefinition) {
    throw new Error(`Unknown enemy ID: ${enemyId}`);
  }

  const definition: EnemyDefinition = {
    ...baseDefinition,
    hp: Math.round(baseDefinition.hp * hpMultiplier),
    damage: Math.round(baseDefinition.damage * damageMultiplier),
  };

  return new EnemyUnit({ scene, x, y, definition });
}
