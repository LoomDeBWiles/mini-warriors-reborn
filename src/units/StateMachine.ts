/**
 * Unit AI states.
 */
export enum UnitState {
  Moving = 'moving',
  Attacking = 'attacking',
}

/**
 * Context passed to state machine for evaluating transitions.
 */
export interface TransitionContext {
  /** Distance to nearest enemy in pixels, or null if no enemy exists */
  distanceToEnemy: number | null;
  /** Attack range of the unit in pixels (0 = melee) */
  attackRange: number;
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

  private evaluateTransition(context: TransitionContext): UnitState {
    const { distanceToEnemy, attackRange } = context;

    if (distanceToEnemy === null) {
      return UnitState.Moving;
    }

    // Calculate effective attack range - melee units use MELEE_RANGE
    const effectiveRange = attackRange > 0 ? attackRange : MELEE_RANGE;

    if (distanceToEnemy <= effectiveRange) {
      return UnitState.Attacking;
    }

    return UnitState.Moving;
  }
}
