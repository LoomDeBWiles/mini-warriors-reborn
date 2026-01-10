import type { GameStateData } from './GameState';

const SAVE_STORAGE_KEY = 'miniWarriorsSave';

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
   * Returns null if no save exists or parse fails.
   */
  static load(): GameStateData | null {
    try {
      const stored = localStorage.getItem(SAVE_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as GameStateData;
      }
    } catch {
      // Parse failed
    }
    return null;
  }
}
