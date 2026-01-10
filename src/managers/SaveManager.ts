import type { GameStateData } from './GameState';
import { CURRENT_VERSION, createDefaultState, mergeWithDefaults } from './GameState';

const SAVE_STORAGE_KEY = 'miniWarriorsSave';

/**
 * Migrates save data from an older version to the current version.
 * Applies sequential migrations, logging each step.
 * On partial failure, continues with remaining migrations.
 */
function migrate(data: GameStateData): GameStateData {
  let current = data;

  while (current.version < CURRENT_VERSION) {
    const fromVersion = current.version;
    try {
      current = migrateStep(current);
      console.log(`Migrated save from v${fromVersion} to v${current.version}`);
    } catch (error) {
      console.warn(`Migration from v${fromVersion} failed:`, error);
      // Continue with next version to attempt partial recovery
      current.version = fromVersion + 1;
    }
  }

  return current;
}

/**
 * Apply a single migration step.
 * Add new cases here when schema changes require migration.
 */
function migrateStep(data: GameStateData): GameStateData {
  switch (data.version) {
    // Example: when CURRENT_VERSION increases to 2, add:
    // case 1:
    //   return { ...data, newField: defaultValue, version: 2 };
    default:
      return { ...data, version: data.version + 1 };
  }
}

/**
 * SaveManager handles persistence of GameStateData to localStorage.
 */
export class SaveManager {
  /**
   * Save game state to localStorage.
   * Logs warning if storage is full.
   */
  static save(state: GameStateData): void {
    try {
      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save game state:', error);
    }
  }

  /**
   * Load game state from localStorage.
   * Returns default state if no save exists or parse fails.
   * Applies migrations if save version is older than current,
   * then merges with defaults to fill any missing fields.
   */
  static load(): GameStateData {
    try {
      const stored = localStorage.getItem(SAVE_STORAGE_KEY);
      if (stored) {
        let data = JSON.parse(stored) as GameStateData;
        if (data.version < CURRENT_VERSION) {
          data = migrate(data);
        }
        return mergeWithDefaults(data);
      }
    } catch {
      // Parse failed
    }
    return createDefaultState();
  }
}
