import Phaser from 'phaser';
import { STAGE_DEFINITIONS } from '../data/stages';
import { SaveManager } from './SaveManager';

export const CURRENT_VERSION = 1;

export interface UnitUpgrades {
  offense: number;
  defense: number;
  utility: number;
}

export interface CastleUpgrades {
  [upgradeId: string]: number;
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  fullscreen: boolean;
}

export interface PlayerStats {
  totalBattles: number;
  totalVictories: number;
  totalUnitsSpawned: number;
  totalEnemiesKilled: number;
  totalPlayTime: number;
}

export interface GameStateData {
  version: number;
  currentStage: number;
  highestStage: number;
  stageStars: Record<number, number>;
  gold: number;
  gems: number;
  totalGoldEarned: number;
  unlockedUnits: string[];
  unitUpgrades: Record<string, UnitUpgrades>;
  castleUpgrades: CastleUpgrades;
  unlockedAbilities: string[];
  settings: GameSettings;
  stats: PlayerStats;
  goldMines: number;
}

export function createDefaultState(): GameStateData {
  return {
    version: CURRENT_VERSION,
    currentStage: 1,
    highestStage: 1,
    stageStars: {},
    gold: 500,
    gems: 0,
    totalGoldEarned: 0,
    unlockedUnits: ['swordsman'],
    unitUpgrades: {},
    castleUpgrades: {},
    unlockedAbilities: [],
    settings: {
      musicVolume: 1.0,
      sfxVolume: 1.0,
      fullscreen: false,
    },
    stats: {
      totalBattles: 0,
      totalVictories: 0,
      totalUnitsSpawned: 0,
      totalEnemiesKilled: 0,
      totalPlayTime: 0,
    },
    goldMines: 0,
  };
}


/**
 * Save GameState to localStorage.
 * Delegates to SaveManager for consistency.
 */
export function saveGameState(state: GameStateData): void {
  SaveManager.save(state);
}

/**
 * Merge saved state with defaults to handle schema evolution.
 * Any missing fields get default values.
 */
export function mergeWithDefaults(saved: Partial<GameStateData>): GameStateData {
  const defaults = createDefaultState();
  return {
    version: saved.version ?? defaults.version,
    currentStage: saved.currentStage ?? defaults.currentStage,
    highestStage: saved.highestStage ?? defaults.highestStage,
    stageStars: saved.stageStars ?? defaults.stageStars,
    gold: saved.gold ?? defaults.gold,
    gems: saved.gems ?? defaults.gems,
    totalGoldEarned: saved.totalGoldEarned ?? defaults.totalGoldEarned,
    unlockedUnits: saved.unlockedUnits ?? defaults.unlockedUnits,
    unitUpgrades: saved.unitUpgrades ?? defaults.unitUpgrades,
    castleUpgrades: saved.castleUpgrades ?? defaults.castleUpgrades,
    unlockedAbilities: saved.unlockedAbilities ?? defaults.unlockedAbilities,
    settings: {
      ...defaults.settings,
      ...saved.settings,
    },
    stats: {
      ...defaults.stats,
      ...saved.stats,
    },
    goldMines: saved.goldMines ?? defaults.goldMines,
  };
}

/**
 * GameState singleton class that wraps the data and provides
 * save/load methods. Registered in Phaser's game registry.
 */
export class GameState {
  private static readonly REGISTRY_KEY = 'gameState';
  private data: GameStateData;

  constructor(data: GameStateData) {
    this.data = data;
  }

  /**
   * Get the GameState instance from the game registry.
   */
  static getInstance(scene: Phaser.Scene): GameState | undefined {
    return scene.registry.get(GameState.REGISTRY_KEY) as GameState | undefined;
  }

  /**
   * Initialize GameState from localStorage and register in the game registry.
   * If already initialized, returns existing instance.
   */
  static init(scene: Phaser.Scene): GameState {
    const existing = GameState.getInstance(scene);
    if (existing) {
      return existing;
    }

    const data = SaveManager.load();
    const state = new GameState(data);
    scene.registry.set(GameState.REGISTRY_KEY, state);
    return state;
  }

  /**
   * Save current state to localStorage.
   */
  save(): void {
    saveGameState(this.data);
  }

  /**
   * Get the underlying data (read-only access for scenes).
   */
  getData(): Readonly<GameStateData> {
    return this.data;
  }

  // Convenience accessors
  get highestStage(): number {
    return this.data.highestStage;
  }

  get gold(): number {
    return this.data.gold;
  }

  get stageStars(): Record<number, number> {
    return this.data.stageStars;
  }

  get unitUpgrades(): Record<string, UnitUpgrades> {
    return this.data.unitUpgrades;
  }

  get castleUpgrades(): CastleUpgrades {
    return this.data.castleUpgrades;
  }

  get unlockedUnits(): readonly string[] {
    return this.data.unlockedUnits;
  }

  /**
   * Check if a unit is unlocked.
   * Returns false for unknown unit IDs.
   */
  isUnitUnlocked(unitId: string): boolean {
    return this.data.unlockedUnits.includes(unitId);
  }

  /**
   * Unlock a unit if not already unlocked.
   * Duplicates are silently ignored.
   */
  unlockUnit(unitId: string): void {
    if (!this.data.unlockedUnits.includes(unitId)) {
      this.data.unlockedUnits.push(unitId);
    }
  }

  /**
   * Check if a unit can be unlocked.
   * Returns true only if the stage that unlocks this unit has been cleared
   * AND player has the required gold (if the stage has a gold requirement).
   */
  canUnlockUnit(unitId: string): boolean {
    // Find the stage that unlocks this unit
    const stage = Object.values(STAGE_DEFINITIONS).find(
      (s) => s.unlocksUnit === unitId
    );

    if (!stage) {
      return false;
    }

    // Check if stage has been cleared (has stars recorded)
    const cleared = this.data.stageStars[stage.id] !== undefined;
    if (!cleared) {
      return false;
    }

    // Check gold requirement if present
    if (stage.requiresGold !== undefined && this.data.gold < stage.requiresGold) {
      return false;
    }

    return true;
  }

  /**
   * Add gold to the player's persistent balance.
   */
  addGold(amount: number): void {
    if (amount <= 0) return;
    this.data.gold += amount;
    this.data.totalGoldEarned += amount;
  }

  /**
   * Add gems to the player's persistent balance.
   */
  addGems(amount: number): void {
    if (amount <= 0) return;
    this.data.gems += amount;
  }

  /**
   * Spend gold from the player's balance.
   * Returns true if successful, false if insufficient funds.
   */
  spendGold(amount: number): boolean {
    if (amount <= 0) return false;
    if (this.data.gold < amount) return false;
    this.data.gold -= amount;
    return true;
  }

  /**
   * Record a stage completion. Updates stars (keeping best) and unlocks next stage.
   * @param stageId - Completed stage number
   * @param stars - Stars earned (1-3)
   */
  recordStageCompletion(stageId: number, stars: number): void {
    const currentStars = this.data.stageStars[stageId] ?? 0;
    this.data.stageStars[stageId] = Math.max(currentStars, stars);

    if (stageId >= this.data.highestStage && stageId < 20) {
      this.data.highestStage = stageId + 1;
    }

    this.data.stats.totalVictories += 1;
  }

  /**
   * Record a battle (victory or defeat) for stats tracking.
   */
  recordBattle(): void {
    this.data.stats.totalBattles += 1;
  }

  get goldMines(): number {
    return this.data.goldMines;
  }

  addGoldMine(): boolean {
    if (this.data.goldMines >= 10) return false;
    this.data.goldMines += 1;
    return true;
  }

  resetGoldMines(): void {
    this.data.goldMines = 0;
  }
}
