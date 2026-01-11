import Phaser from 'phaser';
import { GAME_HEIGHT } from '../constants';

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
  Healthy = 'healthy', // > 50% HP
  Burning = 'burning', // 26-50% HP - flames appear
  Crumbling = 'crumbling', // 2-25% HP - top crumbles
  Rubble = 'rubble', // <= 1% HP - completely destroyed
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
  private baseSprite: Phaser.GameObjects.Image;
  private flames: Phaser.GameObjects.Graphics | null = null;
  private debris: Phaser.GameObjects.Graphics[] = [];

  constructor(config: BaseConfig) {
    super(config.scene, config.x, GAME_HEIGHT / 2);
    this.maxHp = config.maxHp;
    this.currentHp = config.maxHp;
    this.isPlayerBase = config.isPlayerBase;
    this.onDeath = config.onDeath;

    const spriteKey = config.isPlayerBase ? 'castle_player' : 'castle_enemy';
    this.baseSprite = this.scene.add.image(0, 0, spriteKey);
    this.add(this.baseSprite);

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

    if (ratio > 0.5) {
      newState = BaseDamageState.Healthy;
    } else if (ratio > 0.25) {
      newState = BaseDamageState.Burning;
    } else if (ratio > 0.01) {
      newState = BaseDamageState.Crumbling;
    } else {
      newState = BaseDamageState.Rubble;
    }

    if (newState !== this.damageState) {
      this.damageState = newState;
      this.updateVisual();
    }
  }

  private updateVisual(): void {
    switch (this.damageState) {
      case BaseDamageState.Healthy:
        this.baseSprite.clearTint();
        this.removeFlames();
        break;
      case BaseDamageState.Burning:
        this.baseSprite.setTint(0xffccaa);
        this.addFlames();
        break;
      case BaseDamageState.Crumbling:
        this.baseSprite.setTint(0xaa8866);
        this.addFlames();
        this.crumbleTop();
        break;
      case BaseDamageState.Rubble:
        this.baseSprite.setTint(0x666666);
        this.removeFlames();
        this.showRubble();
        break;
    }
  }

  private addFlames(): void {
    if (this.flames) return;

    this.flames = this.scene.add.graphics();
    this.add(this.flames);

    // Animate flames
    this.scene.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        if (!this.flames || this.damageState === BaseDamageState.Rubble) return;
        this.flames.clear();

        // Draw flickering flames
        const flameColors = [0xff4400, 0xff6600, 0xffaa00, 0xff2200];
        for (let i = 0; i < 5; i++) {
          const x = -20 + Math.random() * 40;
          const y = -50 + Math.random() * 20;
          const color = flameColors[Math.floor(Math.random() * flameColors.length)];
          const size = 5 + Math.random() * 10;

          this.flames.fillStyle(color, 0.8);
          this.flames.fillEllipse(x, y, size, size * 1.5);
        }
      },
    });
  }

  private removeFlames(): void {
    if (this.flames) {
      this.flames.destroy();
      this.flames = null;
    }
  }

  private crumbleTop(): void {
    // Crop the top of the sprite to simulate crumbling
    this.baseSprite.setCrop(0, 20, this.baseSprite.width, this.baseSprite.height - 20);
    this.baseSprite.setY(10);

    // Add falling debris
    if (this.debris.length === 0) {
      for (let i = 0; i < 4; i++) {
        const debrisBlock = this.scene.add.graphics();
        debrisBlock.fillStyle(0x555555, 1);
        debrisBlock.fillRect(-5, -5, 10, 10);
        debrisBlock.setPosition(-20 + i * 15, -60);
        this.add(debrisBlock);
        this.debris.push(debrisBlock);

        // Animate debris falling
        this.scene.tweens.add({
          targets: debrisBlock,
          y: 80,
          x: debrisBlock.x + (Math.random() - 0.5) * 30,
          angle: Math.random() * 360,
          alpha: 0,
          duration: 1500 + Math.random() * 1000,
          ease: 'Quad.easeIn',
        });
      }
    }
  }

  private showRubble(): void {
    // Flatten and darken the sprite
    this.baseSprite.setScale(1.2, 0.3);
    this.baseSprite.setY(40);
    this.baseSprite.setCrop(0, 0, this.baseSprite.width, this.baseSprite.height);

    // Clear debris
    this.debris.forEach((d) => d.destroy());
    this.debris = [];

    // Add rubble pile effect
    const rubble = this.scene.add.graphics();
    rubble.fillStyle(0x444444, 1);
    for (let i = 0; i < 8; i++) {
      const x = -30 + Math.random() * 60;
      const y = 20 + Math.random() * 20;
      const size = 5 + Math.random() * 10;
      rubble.fillRect(x, y, size, size);
    }
    this.add(rubble);
  }
}
