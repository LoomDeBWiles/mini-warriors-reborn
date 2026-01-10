import Phaser from 'phaser';
import { UnitDefinition } from '../data/units';
import { HealthBar } from '../ui/HealthBar';
import { showDamageNumber } from '../ui/DamageNumbers';
import { StateMachine, UnitState, TransitionContext } from './StateMachine';

// Re-export UnitState for consumers
export { UnitState };

interface UnitConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  definition: UnitDefinition;
}

/** Amplitude of flying unit bob in pixels */
const FLY_BOB_AMPLITUDE = 8;
/** Speed of flying unit bob (radians per second) */
const FLY_BOB_SPEED = 3;

/**
 * A unit on the battlefield with a health bar that follows its position.
 */
export class Unit extends Phaser.GameObjects.Container {
  readonly definition: UnitDefinition;
  private healthBar: HealthBar;
  private sprite: Phaser.GameObjects.Arc;
  protected stateMachine: StateMachine;
  /** Accumulated time for flying bob animation (in seconds) */
  private flyTime = 0;
  /** Current y offset from flying bob */
  private flyOffset = 0;

  constructor(config: UnitConfig) {
    super(config.scene, config.x, config.y);
    this.definition = config.definition;

    this.sprite = this.scene.add.circle(0, 0, 20, this.getUnitColor());
    this.add(this.sprite);

    this.healthBar = new HealthBar({
      scene: config.scene,
      maxHp: config.definition.hp,
    });
    this.add(this.healthBar);

    this.stateMachine = new StateMachine(UnitState.Moving, (oldState, newState) => {
      this.onStateChange(oldState, newState);
    });

    this.scene.add.existing(this);
  }

  /**
   * Called when state machine transitions to a new state.
   * Override in subclasses for state-specific behavior.
   */
  protected onStateChange(_oldState: UnitState, _newState: UnitState): void {
    // Base implementation does nothing - subclasses override
  }

  /**
   * Update the unit's state machine with current battlefield context.
   * Call every frame with distance to nearest enemy and damaged ally.
   */
  updateStateMachine(distanceToEnemy: number | null, distanceToDamagedAlly: number | null = null): void {
    const context: TransitionContext = {
      distanceToEnemy,
      attackRange: this.definition.range,
      isTank: this.definition.isTank,
      isHealer: this.definition.isHealer,
      distanceToDamagedAlly,
    };
    this.stateMachine.update(context);
  }

  /**
   * Get the current state of the unit.
   */
  getState(): UnitState {
    return this.stateMachine.getState();
  }

  /**
   * Returns true if this unit is blocking enemy movement.
   * Tank units enter holding state and block enemies from advancing.
   */
  isBlocking(): boolean {
    return this.stateMachine.getState() === UnitState.Holding;
  }

  /**
   * Returns true if this unit ignores ground collision.
   */
  isFlying(): boolean {
    return this.definition.isFlying === true;
  }

  /**
   * Update flying bob animation. Call each frame with delta time.
   * Returns the current y offset for visual bobbing.
   */
  updateFlyingBob(deltaMs: number): number {
    if (!this.definition.isFlying) {
      return 0;
    }
    this.flyTime += deltaMs / 1000;
    this.flyOffset = Math.sin(this.flyTime * FLY_BOB_SPEED) * FLY_BOB_AMPLITUDE;
    return this.flyOffset;
  }

  /**
   * Get the current flying bob offset.
   */
  getFlyingOffset(): number {
    return this.flyOffset;
  }

  takeDamage(amount: number): void {
    showDamageNumber(this.scene, this.x, this.y, amount);

    const newHp = this.healthBar.getHp() - amount;
    this.healthBar.setHp(newHp);

    if (newHp <= 0) {
      this.destroy();
    }
  }

  getHp(): number {
    return this.healthBar.getHp();
  }

  getMaxHp(): number {
    return this.definition.hp;
  }

  /**
   * Heal this unit by the given amount. HP cannot exceed max HP.
   */
  heal(amount: number): void {
    const newHp = Math.min(this.healthBar.getHp() + amount, this.definition.hp);
    this.healthBar.setHp(newHp);
  }

  /**
   * Returns true if this unit is a healer.
   */
  isHealer(): boolean {
    return this.definition.isHealer === true;
  }

  /**
   * Returns the heal amount for healer units.
   */
  getHealAmount(): number {
    return this.definition.healAmount ?? 0;
  }

  private getUnitColor(): number {
    const colors: Record<string, number> = {
      swordsman: 0x4a90d9,
      archer: 0x90d94a,
      knight: 0x7a7a9a,
      mage: 0x9a4ad9,
      healer: 0x4ad99a,
      assassin: 0x2a2a4a,
      catapult: 0x9a6a4a,
      griffin: 0xd9d94a,
      paladin: 0xffd700,
      dragon: 0xd94a4a,
    };
    return colors[this.definition.id] ?? 0x6a6a6a;
  }
}
