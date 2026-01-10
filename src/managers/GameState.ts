import Phaser from 'phaser';
import { STAGE_DEFINITIONS } from '../data/stages';

const SAVE_STORAGE_KEY = 'miniWarriorsSave';
const CURRENT_VERSION = 1;

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
}

function createDefaultState(): GameStateData {
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
  };
}

/**
 * Load GameState from localStorage.
 * Returns saved state if valid, or a fresh default state if parse fails.
 */
export function loadGameState(): GameStateData {
  try {
    const stored = localStorage.getItem(SAVE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<GameStateData>;
      return mergeWithDefaults(parsed);
    }
  } catch {
    // Parse failed, return default
  }
  return createDefaultState();
}

/**
 * Save GameState to localStorage.
 * Logs warning if storage is full.
 */
export function saveGameState(state: GameStateData): void {
  try {
    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save game state:', error);
  }
}

/**
 * Merge saved state with defaults to handle schema evolution.
 * Any missing fields get default values.
 */
function mergeWithDefaults(saved: Partial<GameStateData>): GameStateData {
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

    const data = loadGameState();
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
}
