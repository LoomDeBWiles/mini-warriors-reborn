import Phaser from 'phaser';
import { EnemyUnit, createEnemyUnit } from '../units/EnemyUnit';

interface DragonSpawnerConfig {
  scene: Phaser.Scene;
  /** X position to spawn dragons (enemy castle) */
  spawnX: number;
  /** Y position to spawn dragons (above ground units) */
  spawnY: number;
  /** Total number of dragons to spawn */
  dragonCount: number;
  /** Interval between dragon spawns in ms */
  spawnInterval: number;
  /** Callback when a dragon is spawned */
  onDragonSpawn: (dragon: EnemyUnit) => void;
  /** HP multiplier from stage definition */
  hpMultiplier?: number;
  /** Damage multiplier from stage definition */
  damageMultiplier?: number;
}

/**
 * Manages spawning of flying dragons during battle.
 * Dragons spawn from the enemy castle and fly toward the player castle.
 */
export class DragonSpawner {
  private scene: Phaser.Scene;
  private spawnX: number;
  private spawnY: number;
  private dragonsToSpawn: number;
  private dragonsSpawned: number = 0;
  private spawnInterval: number;
  private nextSpawnTime: number;
  private onDragonSpawn: (dragon: EnemyUnit) => void;
  private hpMultiplier: number;
  private damageMultiplier: number;

  constructor(config: DragonSpawnerConfig) {
    this.scene = config.scene;
    this.spawnX = config.spawnX;
    this.spawnY = config.spawnY;
    this.dragonsToSpawn = config.dragonCount;
    this.spawnInterval = config.spawnInterval;
    this.onDragonSpawn = config.onDragonSpawn;
    this.hpMultiplier = config.hpMultiplier ?? 1.0;
    this.damageMultiplier = config.damageMultiplier ?? 1.0;

    // Schedule first dragon spawn after initial delay
    this.nextSpawnTime = this.scene.time.now + 10000; // 10 second initial delay
  }

  /**
   * Update dragon spawning logic. Call from BattleScene update loop.
   */
  update(): void {
    if (this.dragonsSpawned >= this.dragonsToSpawn) {
      return; // All dragons spawned
    }

    const now = this.scene.time.now;
    if (now >= this.nextSpawnTime) {
      this.spawnDragon();
      this.dragonsSpawned++;
      this.nextSpawnTime = now + this.spawnInterval;
    }
  }

  private spawnDragon(): void {
    // Vary Y position slightly for visual interest
    const yOffset = Phaser.Math.Between(-30, 30);
    const dragon = createEnemyUnit(
      this.scene,
      'flying_dragon',
      this.spawnX,
      this.spawnY + yOffset,
      this.hpMultiplier,
      this.damageMultiplier
    );

    console.log(`Dragon spawned at (${dragon.x}, ${dragon.y}) - ${this.dragonsSpawned + 1}/${this.dragonsToSpawn}`);
    this.onDragonSpawn(dragon);
  }

  /**
   * Get number of dragons still to spawn.
   */
  getRemainingDragons(): number {
    return this.dragonsToSpawn - this.dragonsSpawned;
  }

  /**
   * Check if all dragons have been spawned.
   */
  isComplete(): boolean {
    return this.dragonsSpawned >= this.dragonsToSpawn;
  }
}
