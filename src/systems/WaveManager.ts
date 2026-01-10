import Phaser from 'phaser';
import { AudioManager } from '../managers/AudioManager';

/**
 * Manages wave spawning in battle. Triggers wave start fanfare when waves begin.
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
}
