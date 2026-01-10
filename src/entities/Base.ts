import Phaser from 'phaser';
import { GAME_HEIGHT } from '../constants';

const BASE_WIDTH = 60;
const BASE_HEIGHT = 120;

interface BaseConfig {
  scene: Phaser.Scene;
  x: number;
  maxHp: number;
  isPlayerBase: boolean;
  onDeath: () => void;
}

/**
 * Visual damage state for a base, changes at HP thresholds.
 */
export enum BaseDamageState {
  Healthy = 'healthy', // > 66% HP
  Damaged = 'damaged', // 34-66% HP
  Critical = 'critical', // <= 33% HP
}

/**
 * Base structure that can take damage and shows visual degradation.
 * Emits 'damaged' event with damage state changes.
 */
export class Base extends Phaser.GameObjects.Container {
  readonly isPlayerBase: boolean;
  private maxHp: number;
  private currentHp: number;
  private onDeath: () => void;
  private damageState: BaseDamageState = BaseDamageState.Healthy;
  private baseSprite: Phaser.GameObjects.Rectangle;
  private damageOverlay: Phaser.GameObjects.Rectangle;

  constructor(config: BaseConfig) {
    super(config.scene, config.x, GAME_HEIGHT / 2);
    this.maxHp = config.maxHp;
    this.currentHp = config.maxHp;
    this.isPlayerBase = config.isPlayerBase;
    this.onDeath = config.onDeath;

    const baseColor = config.isPlayerBase ? 0x4a90d9 : 0xd94a4a;

    this.baseSprite = this.scene.add.rectangle(0, 0, BASE_WIDTH, BASE_HEIGHT, baseColor);
    this.add(this.baseSprite);

    this.damageOverlay = this.scene.add.rectangle(0, 0, BASE_WIDTH, BASE_HEIGHT, 0x000000, 0);
    this.add(this.damageOverlay);

    this.scene.add.existing(this);
  }

  /**
   * Deal damage to the base, updating HP and visual state.
   * @param amount - Damage amount to apply
   */
  takeDamage(amount: number): void {
    this.currentHp = Math.max(0, this.currentHp - amount);
    this.updateDamageState();

    if (this.currentHp <= 0) {
      this.onDeath();
    }
  }

  getHp(): number {
    return this.currentHp;
  }

  getMaxHp(): number {
    return this.maxHp;
  }

  getHpRatio(): number {
    return this.currentHp / this.maxHp;
  }

  getDamageState(): BaseDamageState {
    return this.damageState;
  }

  private updateDamageState(): void {
    const ratio = this.getHpRatio();
    let newState: BaseDamageState;

    if (ratio > 0.66) {
      newState = BaseDamageState.Healthy;
    } else if (ratio > 0.33) {
      newState = BaseDamageState.Damaged;
    } else {
      newState = BaseDamageState.Critical;
    }

    if (newState !== this.damageState) {
      this.damageState = newState;
      this.updateVisual();
    }
  }

  private updateVisual(): void {
    switch (this.damageState) {
      case BaseDamageState.Healthy:
        this.damageOverlay.setAlpha(0);
        break;
      case BaseDamageState.Damaged:
        this.damageOverlay.setFillStyle(0x000000, 0.25);
        this.damageOverlay.setAlpha(1);
        break;
      case BaseDamageState.Critical:
        this.damageOverlay.setFillStyle(0x000000, 0.5);
        this.damageOverlay.setAlpha(1);
        break;
    }
  }
}
