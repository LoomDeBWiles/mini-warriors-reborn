import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { AudioManager } from '../managers/AudioManager';
import { MUSIC_KEYS } from '../data/audio';
import { HUD } from '../ui/HUD';
import { SpawnBar } from '../ui/SpawnBar';
import { WaveManager } from '../systems/WaveManager';
import { UNIT_DEFINITIONS } from '../data/units';
import { WaveDefinition } from '../data/enemies';
import { EnemyUnit } from '../units/EnemyUnit';
import { PlayerUnit, createPlayerUnit } from '../units/PlayerUnit';
import { Base } from '../entities/Base';

const INITIAL_GOLD = 50;
const PLAYER_BASE_HP = 1000;
const ENEMY_BASE_HP = 1000;
const PLAYER_BASE_X = 50;
const ENEMY_BASE_X = GAME_WIDTH - 50;
const ENEMY_SPAWN_X = GAME_WIDTH - 50;
const ENEMY_SPAWN_Y = GAME_HEIGHT / 2;
const PLAYER_SPAWN_X = 100;
const PLAYER_SPAWN_Y = GAME_HEIGHT / 2;

/** Default waves: 3 goblins per wave with 2s spacing, matching acceptance criteria */
const DEFAULT_WAVE_DEFINITIONS: WaveDefinition[] = [
  {
    spawns: [{ enemyId: 'goblin', count: 3, spawnDelay: 0, spawnInterval: 2000 }],
    delayAfter: 3000,
  },
  {
    spawns: [{ enemyId: 'goblin', count: 4, spawnDelay: 0, spawnInterval: 2000 }],
    delayAfter: 3000,
  },
  {
    spawns: [{ enemyId: 'goblin', count: 5, spawnDelay: 0, spawnInterval: 2000 }],
    delayAfter: 0,
  },
];

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

  private hud!: HUD;
  private spawnBar!: SpawnBar;
  private waveManager!: WaveManager;
  private loadout: string[] = [];
  private playerBase!: Base;
  private enemyBase!: Base;
  private playerUnits!: Phaser.GameObjects.Group;

  constructor() {
    super({ key: 'battle' });
  }

  init(data: BattleSceneData): void {
    this.stageId = data.stageId ?? 1;
    this.loadout = data.loadout ?? [];

    console.log('BattleScene.init', { stageId: this.stageId, loadout: this.loadout });

    // Reset battle state
    this.gold = INITIAL_GOLD;
  }

  create(): void {
    // Start battle music
    const audio = AudioManager.getInstance(this);
    audio?.switchMusic(MUSIC_KEYS.battle_easy);

    // Create bases
    this.playerBase = new Base({
      scene: this,
      x: PLAYER_BASE_X,
      maxHp: PLAYER_BASE_HP,
      isPlayerBase: true,
      onDeath: () => this.endBattle(false),
    });

    this.enemyBase = new Base({
      scene: this,
      x: ENEMY_BASE_X,
      maxHp: ENEMY_BASE_HP,
      isPlayerBase: false,
      onDeath: () => this.endBattle(true),
    });

    // Create player units group
    this.playerUnits = this.add.group();

    // Create wave manager with default waves
    this.waveManager = new WaveManager(
      this,
      DEFAULT_WAVE_DEFINITIONS,
      ENEMY_SPAWN_X,
      ENEMY_SPAWN_Y,
      (enemy) => this.handleEnemySpawn(enemy)
    );
    this.waveManager.startNextWave();

    // Create HUD
    this.hud = new HUD({
      scene: this,
      initialGold: this.gold,
      totalWaves: this.waveManager.getTotalWaves(),
      playerBaseHp: PLAYER_BASE_HP,
      enemyBaseHp: ENEMY_BASE_HP,
    });

    // Show wave 1 announcement
    this.hud.showWaveAnnouncement(this.waveManager.getCurrentWave());

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

    // Listen for scene resume to restore physics and tweens
    this.events.on('resume', () => this.onResume());

    // Listen for gold earned from enemy kills
    this.events.on('gold-earned', (data: { amount: number }) => this.addGold(data.amount));

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
    this.waveManager.update();
  }

  private handleEnemySpawn(enemy: EnemyUnit): void {
    console.log(`Enemy spawned: ${enemy.definition.name} at (${enemy.x}, ${enemy.y})`);
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
      this.spawnUnit(unitId);
    }
  }

  /**
   * Spawn a player unit at the spawn point and add to playerUnits group.
   */
  spawnUnit(unitId: string): PlayerUnit {
    const unit = createPlayerUnit(this, unitId, PLAYER_SPAWN_X, PLAYER_SPAWN_Y);
    this.playerUnits.add(unit);
    console.log(`Spawned ${unit.definition.name} at (${unit.x}, ${unit.y})`);
    return unit;
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
    this.playerBase.takeDamage(amount);
    this.hud.updatePlayerBaseHp(this.playerBase.getHp(), this.playerBase.getMaxHp());
  }

  damageEnemyBase(amount: number): void {
    this.enemyBase.takeDamage(amount);
    this.hud.updateEnemyBaseHp(this.enemyBase.getHp(), this.enemyBase.getMaxHp());
  }

  getPlayerBase(): Base {
    return this.playerBase;
  }

  getEnemyBase(): Base {
    return this.enemyBase;
  }

  getPlayerUnits(): Phaser.GameObjects.Group {
    return this.playerUnits;
  }

  advanceWave(): void {
    const wave = this.waveManager.startNextWave();
    if (wave !== null) {
      this.hud.updateWave(wave, this.waveManager.getTotalWaves());
      this.hud.showWaveAnnouncement(wave);
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
    const hpRatio = this.playerBase.getHpRatio();
    if (hpRatio >= 0.8) return 3;
    if (hpRatio >= 0.5) return 2;
    return 1;
  }

  /**
   * Pause the battle: freeze physics, tweens, audio, and launch pause overlay.
   */
  private pauseBattle(): void {
    if (this.scene.isPaused()) return;
    this.physics.pause();
    this.tweens.pauseAll();
    AudioManager.getInstance(this)?.pause();
    this.scene.pause();
    this.scene.launch('pause', { pausedScene: 'battle' });
  }

  /**
   * Resume the battle: restore physics, tweens, and audio after pause overlay closes.
   */
  private onResume(): void {
    this.physics.resume();
    this.tweens.resumeAll();
    AudioManager.getInstance(this)?.resume();
  }
}
