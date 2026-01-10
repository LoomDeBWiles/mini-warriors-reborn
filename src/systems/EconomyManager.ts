import Phaser from 'phaser';

/**
 * Manages battle economy: gold tracking and events.
 * Tracks gold earned during battle and emits events on changes.
 */
export class EconomyManager {
  private scene: Phaser.Scene;
  private gold: number;

  constructor(scene: Phaser.Scene, initialGold: number = 0) {
    this.scene = scene;
    this.gold = initialGold;
  }

  /**
   * Add gold to the battle state.
   * Emits 'gold-changed' event with the new total.
   * Negative amounts are silently ignored.
   */
  addGold(amount: number): void {
    if (amount < 0) return;

    this.gold += amount;
    this.scene.events.emit('gold-changed', { gold: this.gold, added: amount });
  }

  /**
   * Get current gold amount.
   */
  getGold(): number {
    return this.gold;
  }
}
