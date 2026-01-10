import Phaser from 'phaser';
import { AudioManager } from '../managers/AudioManager';
import { WaveDefinition, SpawnDefinition, ENEMY_DEFINITIONS } from '../data/enemies';
import { createEnemyUnit, EnemyUnit } from '../units/EnemyUnit';

/** Enemy IDs considered bosses for audio announcements */
const BOSS_ENEMY_IDS = new Set(['giant', 'dragon_boss', 'demon_lord']);

/** Tracks spawning state for a single spawn group */
interface SpawnState {
  definition: SpawnDefinition;
  spawnedCount: number;
  nextSpawnTime: number;
}

/** Callback when wave is complete (all enemies spawned, then all killed) */
type OnWaveCompleteCallback = (waveNumber: number, delayAfter: number) => void;

/**
 * Manages wave spawning in battle. Triggers wave start fanfare when waves begin
 * and boss spawn announcements for boss enemies.
 */
export class WaveManager {
  private scene: Phaser.Scene;
  private waveDefinitions: WaveDefinition[];
  private currentWave: number;
  private spawnX: number;
  private spawnY: number;
  private onEnemySpawn: (enemy: EnemyUnit) => void;
  private onWaveComplete: OnWaveCompleteCallback | null = null;

  private waveActive: boolean;
  private spawnStates: SpawnState[];
  private waveStartTime: number;
  /** Total enemies spawned in current wave */
  private waveEnemyCount: number;
  /** Enemies killed in current wave */
  private waveKillCount: number;
  /** True when all enemies spawned but waiting for kills */
  private waitingForKills: boolean;

  constructor(
    scene: Phaser.Scene,
    waveDefinitions: WaveDefinition[],
    spawnX: number,
    spawnY: number,
    onEnemySpawn: (enemy: EnemyUnit) => void
  ) {
    this.scene = scene;
    this.waveDefinitions = waveDefinitions;
    this.currentWave = 0;
    this.spawnX = spawnX;
    this.spawnY = spawnY;
    this.onEnemySpawn = onEnemySpawn;

    this.waveActive = false;
    this.spawnStates = [];
    this.waveStartTime = 0;
    this.waveEnemyCount = 0;
    this.waveKillCount = 0;
    this.waitingForKills = false;
  }

  /**
   * Set callback for wave completion.
   */
  setOnWaveComplete(callback: OnWaveCompleteCallback): void {
    this.onWaveComplete = callback;
  }

  /**
   * Start the next wave. Plays wave start fanfare if not the first wave.
   * Returns the wave number that was started, or null if all waves complete.
   */
  startNextWave(): number | null {
    if (this.currentWave >= this.waveDefinitions.length) {
      return null;
    }

    this.currentWave++;

    // Play wave start fanfare for waves after the first
    if (this.currentWave > 1) {
      const audioManager = AudioManager.getInstance(this.scene);
      audioManager?.playSfx('wave_start');
    }

    // Initialize spawn states for this wave
    const waveDef = this.waveDefinitions[this.currentWave - 1];
    this.waveStartTime = this.scene.time.now;
    this.spawnStates = waveDef.spawns.map((spawn) => ({
      definition: spawn,
      spawnedCount: 0,
      nextSpawnTime: this.waveStartTime + spawn.spawnDelay,
    }));
    this.waveActive = true;
    this.waveEnemyCount = 0;
    this.waveKillCount = 0;
    this.waitingForKills = false;

    return this.currentWave;
  }

  /**
   * Update spawning logic. Call every frame from scene update.
   * Spawns enemies according to wave definition timing.
   */
  update(): void {
    if (!this.waveActive) return;

    const now = this.scene.time.now;
    let allComplete = true;

    for (const state of this.spawnStates) {
      if (state.spawnedCount >= state.definition.count) continue;

      allComplete = false;

      if (now >= state.nextSpawnTime) {
        this.spawnEnemy(state.definition.enemyId);
        state.spawnedCount++;
        state.nextSpawnTime = now + state.definition.spawnInterval;
      }
    }

    if (allComplete) {
      this.waveActive = false;
      this.waitingForKills = true;
    }
  }

  /**
   * Notify that an enemy from the current wave was killed.
   * When all enemies are killed, triggers wave completion.
   */
  notifyEnemyKilled(): void {
    this.waveKillCount++;

    if (this.waitingForKills && this.waveKillCount >= this.waveEnemyCount) {
      this.waitingForKills = false;

      // Play wave complete sound
      const audioManager = AudioManager.getInstance(this.scene);
      audioManager?.playSfx('wave_complete');

      // Notify callback with delay
      const waveDef = this.waveDefinitions[this.currentWave - 1];
      const delayAfter = waveDef?.delayAfter ?? 2000;
      this.onWaveComplete?.(this.currentWave, delayAfter);
    }
  }

  private spawnEnemy(enemyId: string): void {
    if (!ENEMY_DEFINITIONS[enemyId]) {
      console.warn(`WaveManager: Unknown enemy ID "${enemyId}"`);
      return;
    }

    const enemy = createEnemyUnit(this.scene, enemyId, this.spawnX, this.spawnY);
    this.waveEnemyCount++;
    this.notifyEnemySpawn(enemyId);
    this.onEnemySpawn(enemy);
  }

  getCurrentWave(): number {
    return this.currentWave;
  }

  getTotalWaves(): number {
    return this.waveDefinitions.length;
  }

  isComplete(): boolean {
    return this.currentWave >= this.waveDefinitions.length && !this.waveActive;
  }

  isWaveActive(): boolean {
    return this.waveActive;
  }

  /**
   * Notify that an enemy is spawning. Plays boss spawn sound for boss enemies.
   */
  private notifyEnemySpawn(enemyId: string): void {
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
