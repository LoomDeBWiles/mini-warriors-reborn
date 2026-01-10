import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { AudioManager } from '../managers/AudioManager';
import { MUSIC_KEYS } from '../data/audio';
import { HUD } from '../ui/HUD';
import { WaveManager } from '../systems/WaveManager';

const INITIAL_GOLD = 50;
const PLAYER_BASE_HP = 1000;
const ENEMY_BASE_HP = 1000;
const DEFAULT_TOTAL_WAVES = 3;

interface BattleSceneData {
  stageId: number;
  loadout: string[];
}

/**
 * Main battle scene where gameplay takes place.
 * Manages the HUD, spawning, and battle state.
 */
export class BattleScene extends Phaser.Scene {
  private stageId = 1;
  private gold = INITIAL_GOLD;
  private playerBaseHp = PLAYER_BASE_HP;
  private enemyBaseHp = ENEMY_BASE_HP;

  private hud!: HUD;
  private waveManager!: WaveManager;

  constructor() {
    super({ key: 'battle' });
  }

  init(data: BattleSceneData): void {
    this.stageId = data.stageId ?? 1;

    // Reset battle state
    this.gold = INITIAL_GOLD;
    this.playerBaseHp = PLAYER_BASE_HP;
    this.enemyBaseHp = ENEMY_BASE_HP;
  }

  create(): void {
    // Start battle music
    const audio = AudioManager.getInstance(this);
    audio?.switchMusic(MUSIC_KEYS.battle_easy);

    // Create wave manager
    this.waveManager = new WaveManager(this, DEFAULT_TOTAL_WAVES);
    this.waveManager.startNextWave();

    // Create HUD
    this.hud = new HUD({
      scene: this,
      initialGold: this.gold,
      totalWaves: this.waveManager.getTotalWaves(),
      playerBaseHp: this.playerBaseHp,
      enemyBaseHp: this.enemyBaseHp,
    });

    // Pause button (top-right corner, below HUD)
    const pauseButton = this.add.text(GAME_WIDTH - 20, 70, '⏸', {
      fontSize: '32px',
      color: '#ffffff',
    });
    pauseButton.setOrigin(1, 0);
    pauseButton.setInteractive({ useHandCursor: true });
    pauseButton.on('pointerdown', () => {
      this.scene.pause();
      this.scene.launch('pauseOverlay');
    });
    pauseButton.setDepth(1001);

    // Stage info (temporary, for debugging)
    const stageInfo = this.add.text(20, GAME_HEIGHT - 30, `Stage ${this.stageId}`, {
      fontSize: '16px',
      color: '#666666',
    });
    stageInfo.setOrigin(0, 1);
  }

  // Public methods for game systems to update HUD

  addGold(amount: number): void {
    this.gold += amount;
    this.hud.updateGold(this.gold);
  }

  spendGold(amount: number): boolean {
    if (this.gold >= amount) {
      this.gold -= amount;
      this.hud.updateGold(this.gold);
      return true;
    }
    return false;
  }

  getGold(): number {
    return this.gold;
  }

  damagePlayerBase(amount: number): void {
    this.playerBaseHp = Math.max(0, this.playerBaseHp - amount);
    this.hud.updatePlayerBaseHp(this.playerBaseHp, PLAYER_BASE_HP);
    if (this.playerBaseHp <= 0) {
      this.endBattle(false);
    }
  }

  damageEnemyBase(amount: number): void {
    this.enemyBaseHp = Math.max(0, this.enemyBaseHp - amount);
    this.hud.updateEnemyBaseHp(this.enemyBaseHp, ENEMY_BASE_HP);
    if (this.enemyBaseHp <= 0) {
      this.endBattle(true);
    }
  }

  advanceWave(): void {
    const wave = this.waveManager.startNextWave();
    if (wave !== null) {
      this.hud.updateWave(wave, this.waveManager.getTotalWaves());
    }
  }

  private endBattle(victory: boolean): void {
    console.log(`Battle ended: ${victory ? 'Victory' : 'Defeat'}`);
    // ResultsOverlay will be implemented in a future bead
  }
}
