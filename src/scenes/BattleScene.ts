import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { AudioManager } from '../managers/AudioManager';
import { MUSIC_KEYS } from '../data/audio';
import { HUD } from '../ui/HUD';
import { SpawnBar } from '../ui/SpawnBar';
import { WaveManager } from '../systems/WaveManager';
import { UNIT_DEFINITIONS } from '../data/units';

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
  private spawnBar!: SpawnBar;
  private waveManager!: WaveManager;
  private loadout: string[] = [];

  constructor() {
    super({ key: 'battle' });
  }

  init(data: BattleSceneData): void {
    this.stageId = data.stageId ?? 1;
    this.loadout = data.loadout ?? [];

    console.log('BattleScene.init', { stageId: this.stageId, loadout: this.loadout });

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
    pauseButton.on('pointerdown', () => this.pauseBattle());
    pauseButton.setDepth(1001);

    // Escape key to pause
    this.input.keyboard?.on('keydown-ESC', () => this.pauseBattle());

    // Stage info (temporary, for debugging)
    const stageInfo = this.add.text(20, GAME_HEIGHT - 100, `Stage ${this.stageId}`, {
      fontSize: '16px',
      color: '#666666',
    });
    stageInfo.setOrigin(0, 1);

    // Create spawn bar
    this.spawnBar = new SpawnBar({
      scene: this,
      loadout: this.loadout,
      onSpawn: (unitId) => this.handleSpawnInput(unitId),
    });
    this.spawnBar.updateGold(this.gold);

    // Setup keyboard input for spawning (keys 1-5)
    this.setupSpawnKeyboardInput();
  }

  private setupSpawnKeyboardInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;

    // Keys 1-5 map to loadout slots 0-4
    const spawnKeys = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'] as const;
    spawnKeys.forEach((keyName, slotIndex) => {
      keyboard.on(`keydown-${keyName}`, () => {
        const unitId = this.loadout[slotIndex];
        if (unitId) {
          this.handleSpawnInput(unitId);
        }
      });
    });
  }

  update(): void {
    this.spawnBar.update();
  }

  /**
   * Handle spawn input from keyboard or touch.
   * Emits 'spawn-unit' event and triggers the spawn if affordable.
   */
  private handleSpawnInput(unitId: string): void {
    console.log('Spawn input received:', { unitId });
    this.events.emit('spawn-unit', { unitId });
    this.handleSpawn(unitId);
  }

  private handleSpawn(unitId: string): void {
    const unit = UNIT_DEFINITIONS[unitId];
    if (!unit) return;

    if (this.spendGold(unit.spawnCost)) {
      this.spawnBar.startCooldown(unitId);
      console.log(`Spawning ${unit.name}`);
    }
  }

  // Public methods for game systems to update HUD

  addGold(amount: number): void {
    this.gold += amount;
    this.hud.updateGold(this.gold);
    this.spawnBar.updateGold(this.gold);
  }

  spendGold(amount: number): boolean {
    if (this.gold >= amount) {
      this.gold -= amount;
      this.hud.updateGold(this.gold);
      this.spawnBar.updateGold(this.gold);
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
    const stars = victory ? this.calculateStars() : 0;
    const goldReward = victory ? 100 : 25;

    this.scene.pause();
    this.scene.launch('results', {
      victory,
      stars,
      goldReward,
    });
  }

  private calculateStars(): number {
    const hpRatio = this.playerBaseHp / PLAYER_BASE_HP;
    if (hpRatio >= 0.8) return 3;
    if (hpRatio >= 0.5) return 2;
    return 1;
  }

  /**
   * Pause the battle: freeze physics, tweens, and launch pause overlay.
   */
  private pauseBattle(): void {
    if (this.scene.isPaused()) return;
    this.physics.pause();
    this.tweens.pauseAll();
    this.scene.pause();
    this.scene.launch('pause', { pausedScene: 'battle' });
  }
}
