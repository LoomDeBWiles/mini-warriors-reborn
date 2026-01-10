import Phaser from 'phaser';
import { AudioManager } from '../managers/AudioManager';

/** Enemy IDs considered bosses for audio announcements */
const BOSS_ENEMY_IDS = new Set(['giant', 'dragon_boss', 'demon_lord']);

/**
 * Manages wave spawning in battle. Triggers wave start fanfare when waves begin
 * and boss spawn announcements for boss enemies.
 */
export class WaveManager {
  private scene: Phaser.Scene;
  private currentWave: number;
  private totalWaves: number;

  constructor(scene: Phaser.Scene, totalWaves: number) {
    this.scene = scene;
    this.currentWave = 0;
    this.totalWaves = totalWaves;
  }

  /**
   * Start the next wave. Plays wave start fanfare if not the first wave.
   * Returns the wave number that was started, or null if all waves complete.
   */
  startNextWave(): number | null {
    if (this.currentWave >= this.totalWaves) {
      return null;
    }

    this.currentWave++;

    // Play wave start fanfare for waves after the first
    if (this.currentWave > 1) {
      const audioManager = AudioManager.getInstance(this.scene);
      audioManager?.playSfx('wave_start');
    }

    return this.currentWave;
  }

  getCurrentWave(): number {
    return this.currentWave;
  }

  getTotalWaves(): number {
    return this.totalWaves;
  }

  isComplete(): boolean {
    return this.currentWave >= this.totalWaves;
  }

  /**
   * Notify that an enemy is spawning. Plays boss spawn sound for boss enemies.
   * Call this when creating each enemy unit.
   */
  notifyEnemySpawn(enemyId: string): void {
    if (BOSS_ENEMY_IDS.has(enemyId)) {
      const audioManager = AudioManager.getInstance(this.scene);
      audioManager?.playSfx('boss_spawn');
    }
  }

  /**
   * Check if an enemy ID represents a boss.
   */
  static isBoss(enemyId: string): boolean {
    return BOSS_ENEMY_IDS.has(enemyId);
  }
}
