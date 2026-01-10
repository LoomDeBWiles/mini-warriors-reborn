/**
 * Unit definitions for player units.
 * Contains base stats and unlock requirements.
 */
export interface UnitDefinition {
  id: string;
  name: string;
  /** Stage at which unit becomes available (1 = starter) */
  unlockStage: number;
  /** Gold cost to spawn in battle */
  spawnCost: number;
  /** Cooldown in ms before unit can be spawned again */
  cooldownMs: number;
  /** Base HP at level 0 */
  hp: number;
  /** Base damage per attack */
  damage: number;
  /** Attack range in pixels (0 = melee) */
  range: number;
  /** Movement speed in pixels/sec */
  speed: number;
  /** Tank units enter holding state and block enemy movement */
  isTank?: boolean;
  /** Flying units ignore ground collision and bob with a sine wave pattern */
  isFlying?: boolean;
}

/**
 * All player unit definitions keyed by unit ID.
 */
export const UNIT_DEFINITIONS: Record<string, UnitDefinition> = {
  swordsman: {
    id: 'swordsman',
    name: 'Swordsman',
    unlockStage: 1,
    spawnCost: 15,
    cooldownMs: 3000,
    hp: 100,
    damage: 12,
    range: 0,
    speed: 80,
  },
  archer: {
    id: 'archer',
    name: 'Archer',
    unlockStage: 2,
    spawnCost: 20,
    cooldownMs: 3500,
    hp: 60,
    damage: 14,
    range: 200,
    speed: 70,
  },
  knight: {
    id: 'knight',
    name: 'Knight',
    unlockStage: 4,
    spawnCost: 40,
    cooldownMs: 6000,
    hp: 200,
    damage: 18,
    range: 0,
    speed: 50,
    isTank: true,
  },
  mage: {
    id: 'mage',
    name: 'Mage',
    unlockStage: 6,
    spawnCost: 35,
    cooldownMs: 5000,
    hp: 50,
    damage: 25,
    range: 180,
    speed: 60,
  },
  healer: {
    id: 'healer',
    name: 'Healer',
    unlockStage: 8,
    spawnCost: 30,
    cooldownMs: 4500,
    hp: 70,
    damage: 0,
    range: 150,
    speed: 65,
  },
  assassin: {
    id: 'assassin',
    name: 'Assassin',
    unlockStage: 10,
    spawnCost: 45,
    cooldownMs: 5500,
    hp: 80,
    damage: 35,
    range: 0,
    speed: 120,
  },
  catapult: {
    id: 'catapult',
    name: 'Catapult',
    unlockStage: 12,
    spawnCost: 60,
    cooldownMs: 8000,
    hp: 120,
    damage: 40,
    range: 300,
    speed: 30,
  },
  griffin: {
    id: 'griffin',
    name: 'Griffin',
    unlockStage: 15,
    spawnCost: 55,
    cooldownMs: 7000,
    hp: 110,
    damage: 28,
    range: 0,
    speed: 100,
    isFlying: true,
  },
  paladin: {
    id: 'paladin',
    name: 'Paladin',
    unlockStage: 18,
    spawnCost: 70,
    cooldownMs: 9000,
    hp: 250,
    damage: 22,
    range: 0,
    speed: 55,
    isTank: true,
  },
  dragon: {
    id: 'dragon',
    name: 'Dragon',
    unlockStage: 20,
    spawnCost: 100,
    cooldownMs: 12000,
    hp: 300,
    damage: 50,
    range: 150,
    speed: 90,
    isFlying: true,
  },
};

/** Array of all unit IDs in unlock order */
export const UNIT_IDS = Object.keys(UNIT_DEFINITIONS).sort(
  (a, b) => UNIT_DEFINITIONS[a].unlockStage - UNIT_DEFINITIONS[b].unlockStage
);

/** Get units unlocked at or before a given stage */
export function getUnlockedUnits(highestStage: number): UnitDefinition[] {
  return UNIT_IDS.filter((id) => UNIT_DEFINITIONS[id].unlockStage <= highestStage).map(
    (id) => UNIT_DEFINITIONS[id]
  );
}
