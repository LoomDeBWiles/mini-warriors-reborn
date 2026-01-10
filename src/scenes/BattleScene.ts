import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { AudioManager } from '../managers/AudioManager';
import { MUSIC_KEYS, SFX_KEYS } from '../data/audio';
import { UNIT_DEFINITIONS } from '../data/units';
import { HUD } from '../ui/HUD';
import { SpawnBar } from '../ui/SpawnBar';
import { WaveManager } from '../systems/WaveManager';
import { EnemyUnit } from '../units/EnemyUnit';
import { PlayerUnit, createPlayerUnit } from '../units/PlayerUnit';
import { Base } from '../entities/Base';
import { Unit, UnitState } from '../units/Unit';
import { getStage } from '../data/stages';
import { GameState } from '../managers/GameState';
import { calculateRewards } from '../systems/EconomyManager';

const INITIAL_GOLD = 50;
const PLAYER_BASE_HP = 1000;
const ENEMY_BASE_HP = 1000;
const PLAYER_BASE_X = 50;
const ENEMY_BASE_X = GAME_WIDTH - 50;
const ENEMY_SPAWN_X = GAME_WIDTH - 50;
const ENEMY_SPAWN_Y = GAME_HEIGHT / 2;
const PLAYER_SPAWN_X = 100;
const PLAYER_SPAWN_Y = GAME_HEIGHT / 2;

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
  private killGold = 0;
  private battleStartTime = 0;

  private hud!: HUD;
  private spawnBar!: SpawnBar;
  private waveManager!: WaveManager;
  private loadout: string[] = [];
  private playerBase!: Base;
  private enemyBase!: Base;
  private playerUnits!: Phaser.GameObjects.Group;
  private enemyUnits!: Phaser.GameObjects.Group;

  constructor() {
    super({ key: 'battle' });
  }

  init(data: BattleSceneData): void {
    this.stageId = data.stageId ?? 1;
    this.loadout = data.loadout ?? [];

    console.log('BattleScene.init', { stageId: this.stageId, loadout: this.loadout });

    // Reset battle state
    this.gold = INITIAL_GOLD;
    this.killGold = 0;
    this.battleStartTime = 0;
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

    // Create unit groups
    this.playerUnits = this.add.group();
    this.enemyUnits = this.add.group();

    // Create wave manager with waves from stage definition
    const stage = getStage(this.stageId);
    this.waveManager = new WaveManager(
      this,
      stage.waves,
      ENEMY_SPAWN_X,
      ENEMY_SPAWN_Y,
      (enemy) => this.handleEnemySpawn(enemy)
    );
    this.waveManager.setOnWaveComplete((waveNumber, delayAfter) => {
      this.handleWaveComplete(waveNumber, delayAfter);
    });
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

    // Listen for enemy deaths to track wave completion
    this.events.on('enemy-killed', () => this.waveManager.notifyEnemyKilled());

    // Stage info (temporary, for debugging)
    const stageInfo = this.add.text(20, GAME_HEIGHT - 100, `Stage ${this.stageId}`, {
      fontSize: '16px',
      color: '#666666',
    });
    stageInfo.setOrigin(0, 1);

    // Record battle start time
    this.battleStartTime = this.time.now;

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
        if (unitId && this.spawnBar.canSpawn(unitId)) {
          this.handleSpawnInput(unitId);
        }
      });
    });
  }

  update(_time: number, delta: number): void {
    this.spawnBar.update();
    this.waveManager.update();
    this.updateUnitAI(delta);
  }

  /**
   * Update all unit AI: state machines, targets, combat, movement, and healing.
   */
  private updateUnitAI(deltaMs: number): void {
    const playerUnits = this.playerUnits.getChildren() as PlayerUnit[];
    const enemyUnits = this.enemyUnits.getChildren() as EnemyUnit[];
    const deltaSeconds = deltaMs / 1000;

    // Update player unit AI
    for (const unit of playerUnits) {
      if (!unit.active) continue;

      // Find nearest enemy
      const nearestEnemy = this.findNearestUnit(unit, enemyUnits);
      const distanceToEnemy = nearestEnemy
        ? Phaser.Math.Distance.Between(unit.x, unit.y, nearestEnemy.x, nearestEnemy.y)
        : null;

      // Find nearest damaged ally (for healers)
      let distanceToDamagedAlly: number | null = null;
      let nearestDamagedAlly: Unit | null = null;
      if (unit.isHealer()) {
        nearestDamagedAlly = this.findNearestDamagedAlly(unit, playerUnits);
        if (nearestDamagedAlly) {
          distanceToDamagedAlly = Phaser.Math.Distance.Between(
            unit.x,
            unit.y,
            nearestDamagedAlly.x,
            nearestDamagedAlly.y
          );
        }
      }

      // Update state machine
      unit.updateStateMachine(distanceToEnemy, distanceToDamagedAlly);

      // Set targets based on state
      const state = unit.getState();
      if (state === UnitState.Attacking && nearestEnemy) {
        unit.setAttackTarget(nearestEnemy);
      } else if (state === UnitState.Healing && nearestDamagedAlly) {
        unit.setHealTarget(nearestDamagedAlly);
      }

      // Move player units right toward enemy base when in Moving state
      if (state === UnitState.Moving) {
        unit.x += unit.definition.speed * deltaSeconds;
      }

      // Process attack/heal
      unit.updateAttack(deltaMs);
      unit.updateHeal(deltaMs);
      unit.updateFlyingBob(deltaMs);
    }

    // Update enemy unit AI
    for (const enemy of enemyUnits) {
      if (!enemy.active) continue;

      const nearestPlayer = this.findNearestUnit(enemy, playerUnits);
      const distanceToPlayer = nearestPlayer
        ? Phaser.Math.Distance.Between(enemy.x, enemy.y, nearestPlayer.x, nearestPlayer.y)
        : null;

      enemy.updateStateMachine(distanceToPlayer, null);

      if (enemy.getState() === UnitState.Attacking && nearestPlayer) {
        enemy.setAttackTarget(nearestPlayer);
      }

      // Move enemy units left toward player base when in Moving state
      // Check if blocked by a player unit that is blocking (tank in Holding state)
      if (enemy.getState() === UnitState.Moving) {
        const blocker = this.findBlockingUnit(enemy, playerUnits);
        if (!blocker) {
          enemy.x -= enemy.definition.speed * deltaSeconds;
        }
      }

      enemy.updateAttack(deltaMs);
    }
  }

  /**
   * Find a player unit that is blocking the enemy's path.
   * Returns the blocking unit if one is directly ahead, null otherwise.
   */
  private findBlockingUnit(enemy: EnemyUnit, playerUnits: PlayerUnit[]): PlayerUnit | null {
    const BLOCKING_RANGE = 40; // How close enemy must be to be blocked

    for (const player of playerUnits) {
      if (!player.active || player.getState() === UnitState.Dying) continue;
      if (!player.isBlocking()) continue;

      // Blocker must be ahead of enemy (to the left, since enemies move left)
      if (player.x >= enemy.x) continue;

      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);
      if (distance <= BLOCKING_RANGE) {
        return player;
      }
    }

    return null;
  }

  /**
   * Find nearest unit from a list of targets.
   */
  private findNearestUnit(source: Unit, targets: Unit[]): Unit | null {
    let nearest: Unit | null = null;
    let nearestDist = Infinity;

    for (const target of targets) {
      if (!target.active || target.getState() === UnitState.Dying) continue;

      const dist = Phaser.Math.Distance.Between(source.x, source.y, target.x, target.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = target;
      }
    }

    return nearest;
  }

  /**
   * Find nearest damaged ally for healers.
   */
  private findNearestDamagedAlly(healer: Unit, allies: Unit[]): Unit | null {
    let nearest: Unit | null = null;
    let nearestDist = Infinity;

    for (const ally of allies) {
      // Skip self, inactive, dying, or fully healed units
      if (
        ally === healer ||
        !ally.active ||
        ally.getState() === UnitState.Dying ||
        ally.getHp() >= ally.getMaxHp()
      ) {
        continue;
      }

      const dist = Phaser.Math.Distance.Between(healer.x, healer.y, ally.x, ally.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = ally;
      }
    }

    return nearest;
  }

  private handleEnemySpawn(enemy: EnemyUnit): void {
    this.enemyUnits.add(enemy);
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
    const effectiveCost = this.spawnBar.getEffectiveSpawnCost(unitId);
    if (effectiveCost === undefined) return;

    if (this.spendGold(effectiveCost)) {
      this.spawnBar.startCooldown(unitId);
      this.spawnUnit(unitId);
      this.playSpawnSfx(unitId);
    }
  }

  /**
   * Play the appropriate spawn sound effect based on unit type.
   */
  private playSpawnSfx(unitId: string): void {
    const unit = UNIT_DEFINITIONS[unitId];
    if (!unit) return;

    const audio = AudioManager.getInstance(this);
    if (!audio) return;

    if (unit.isTank) {
      audio.playSfx(SFX_KEYS.spawn_heavy.key);
    } else if (unit.range > 0) {
      audio.playSfx(SFX_KEYS.spawn_ranged.key);
    } else {
      audio.playSfx(SFX_KEYS.spawn_melee.key);
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
    this.killGold += amount;
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

  private handleWaveComplete(waveNumber: number, delayAfter: number): void {
    console.log(`Wave ${waveNumber} complete, next wave in ${delayAfter}ms`);

    // If this was the final wave and all enemies are dead, victory is handled by base destruction
    // So we only advance to next wave if there are more waves
    if (waveNumber < this.waveManager.getTotalWaves()) {
      this.time.delayedCall(delayAfter, () => {
        this.advanceWave();
      });
    }
  }

  private endBattle(victory: boolean): void {
    const elapsedSeconds = (this.time.now - this.battleStartTime) / 1000;

    // Play victory or defeat jingle
    const audio = AudioManager.getInstance(this);
    audio?.switchMusic(victory ? MUSIC_KEYS.victory : MUSIC_KEYS.defeat);

    // Calculate rewards using the progression system
    const rewards = victory
      ? calculateRewards(
          this.stageId,
          this.playerBase.getHp(),
          this.playerBase.getMaxHp(),
          elapsedSeconds,
          this.killGold
        )
      : null;

    const stars = rewards?.stars ?? 0;
    const goldReward = rewards?.totalGold ?? 0;

    // Update persistent game state
    const gameState = GameState.getInstance(this);
    if (gameState) {
      gameState.recordBattle();

      if (victory && rewards) {
        gameState.addGold(rewards.totalGold);
        gameState.recordStageCompletion(this.stageId, rewards.stars);

        if (rewards.unitUnlock) {
          gameState.unlockUnit(rewards.unitUnlock);
        }
      }

      gameState.save();
    }

    this.scene.pause();
    this.scene.launch('results', {
      victory,
      stars,
      goldReward,
    });
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
