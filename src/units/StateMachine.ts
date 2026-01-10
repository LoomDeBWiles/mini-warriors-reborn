/**
 * Unit AI states.
 */
export enum UnitState {
  Moving = 'moving',
  Attacking = 'attacking',
  Holding = 'holding',
  Healing = 'healing',
  Dying = 'dying',
}

/**
 * Context passed to state machine for evaluating transitions.
 */
export interface TransitionContext {
  /** Distance to nearest enemy in pixels, or null if no enemy exists */
  distanceToEnemy: number | null;
  /** Attack range of the unit in pixels (0 = melee) */
  attackRange: number;
  /** Tank units enter holding state instead of attacking */
  isTank?: boolean;
  /** Healer units heal allies instead of attacking */
  isHealer?: boolean;
  /** Distance to nearest damaged ally in pixels, or null if none */
  distanceToDamagedAlly: number | null;
}

/** Melee range threshold - units attack when closer than this distance */
const MELEE_RANGE = 30;

/**
 * Simple finite state machine for unit AI.
 * Manages state transitions based on battlefield conditions.
 */
export class StateMachine {
  private state: UnitState;
  private onStateChange?: (oldState: UnitState, newState: UnitState) => void;

  constructor(
    initialState: UnitState = UnitState.Moving,
    onStateChange?: (oldState: UnitState, newState: UnitState) => void
  ) {
    this.state = initialState;
    this.onStateChange = onStateChange;
  }

  getState(): UnitState {
    return this.state;
  }

  /**
   * Evaluate transition conditions and change state if needed.
   * Call every frame with current battlefield context.
   */
  update(context: TransitionContext): void {
    const newState = this.evaluateTransition(context);
    if (newState !== this.state) {
      const oldState = this.state;
      this.state = newState;
      this.onStateChange?.(oldState, newState);
    }
  }

  /**
   * Force transition to Dying state. This is a terminal state with no exit.
   */
  transitionToDying(): void {
    if (this.state === UnitState.Dying) return;
    const oldState = this.state;
    this.state = UnitState.Dying;
    this.onStateChange?.(oldState, UnitState.Dying);
  }

  private evaluateTransition(context: TransitionContext): UnitState {
    // Dying is a terminal state - no transitions out
    if (this.state === UnitState.Dying) {
      return UnitState.Dying;
    }

    const { distanceToEnemy, attackRange, isTank, isHealer, distanceToDamagedAlly } = context;

    // Healers prioritize healing damaged allies over attacking
    if (isHealer && distanceToDamagedAlly !== null && distanceToDamagedAlly <= attackRange) {
      return UnitState.Healing;
    }

    if (distanceToEnemy === null) {
      return UnitState.Moving;
    }

    // Calculate effective attack range - melee units use MELEE_RANGE
    const effectiveRange = attackRange > 0 ? attackRange : MELEE_RANGE;

    if (distanceToEnemy <= effectiveRange) {
      // Tank units enter holding state to block enemies
      // Healers don't attack enemies (damage = 0), so continue moving
      if (isTank) return UnitState.Holding;
      if (isHealer) return UnitState.Moving;
      return UnitState.Attacking;
    }

    return UnitState.Moving;
  }
}
