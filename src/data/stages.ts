import { WaveDefinition } from './enemies';

/**
 * Stage definitions for the game.
 * Contains stage names, waves, multipliers, and rewards.
 */
export interface StageDefinition {
  id: number;
  world: 'grasslands' | 'forest' | 'mountains' | 'volcano';
  name: string;
  enemyHPMultiplier: number;
  enemyDamageMultiplier: number;
  waves: WaveDefinition[];
  baseGoldReward: number;
  /** Target time in seconds for 3-star rating */
  targetTime: number;
  /** Unit unlocked on first clear */
  unlocksUnit?: string;
  /** Gold requirement for elite units */
  requiresGold?: number;
}

/**
 * All stage definitions keyed by stage ID.
 */
export const STAGE_DEFINITIONS: Record<number, StageDefinition> = {
  1: {
    id: 1,
    world: 'grasslands',
    name: 'Training Grounds',
    enemyHPMultiplier: 1.0,
    enemyDamageMultiplier: 1.0,
    waves: [
      { spawns: [{ enemyId: 'goblin', count: 3, spawnDelay: 0, spawnInterval: 2000 }], delayAfter: 3000 },
      { spawns: [{ enemyId: 'goblin', count: 4, spawnDelay: 0, spawnInterval: 1800 }], delayAfter: 3000 },
      { spawns: [{ enemyId: 'goblin', count: 5, spawnDelay: 0, spawnInterval: 1500 }], delayAfter: 0 },
    ],
    baseGoldReward: 50,
    targetTime: 90,
  },
  2: {
    id: 2,
    world: 'grasslands',
    name: 'Forest Edge',
    enemyHPMultiplier: 1.0,
    enemyDamageMultiplier: 1.0,
    waves: [
      { spawns: [{ enemyId: 'goblin', count: 4, spawnDelay: 0, spawnInterval: 1800 }], delayAfter: 3000 },
      { spawns: [{ enemyId: 'wolf', count: 3, spawnDelay: 0, spawnInterval: 2000 }], delayAfter: 3000 },
      { spawns: [
        { enemyId: 'goblin', count: 3, spawnDelay: 0, spawnInterval: 2000 },
        { enemyId: 'wolf', count: 2, spawnDelay: 4000, spawnInterval: 2000 },
      ], delayAfter: 0 },
    ],
    baseGoldReward: 75,
    targetTime: 100,
    unlocksUnit: 'archer',
  },
  3: {
    id: 3,
    world: 'forest',
    name: 'Dark Woods',
    enemyHPMultiplier: 1.1,
    enemyDamageMultiplier: 1.05,
    waves: [
      { spawns: [{ enemyId: 'wolf', count: 4, spawnDelay: 0, spawnInterval: 1800 }], delayAfter: 3000 },
      { spawns: [{ enemyId: 'bandit', count: 3, spawnDelay: 0, spawnInterval: 2000 }], delayAfter: 3000 },
      { spawns: [
        { enemyId: 'wolf', count: 3, spawnDelay: 0, spawnInterval: 1800 },
        { enemyId: 'bandit', count: 3, spawnDelay: 3000, spawnInterval: 1800 },
      ], delayAfter: 0 },
    ],
    baseGoldReward: 100,
    targetTime: 110,
  },
  4: {
    id: 4,
    world: 'forest',
    name: 'Bandit Camp',
    enemyHPMultiplier: 1.15,
    enemyDamageMultiplier: 1.1,
    waves: [
      { spawns: [{ enemyId: 'bandit', count: 5, spawnDelay: 0, spawnInterval: 1800 }], delayAfter: 3000 },
      { spawns: [{ enemyId: 'bandit', count: 4, spawnDelay: 0, spawnInterval: 1500 }], delayAfter: 3000 },
      { spawns: [
        { enemyId: 'bandit', count: 4, spawnDelay: 0, spawnInterval: 1500 },
        { enemyId: 'orc', count: 1, spawnDelay: 5000, spawnInterval: 0 },
      ], delayAfter: 0 },
    ],
    baseGoldReward: 150,
    targetTime: 120,
    unlocksUnit: 'knight',
  },
  5: {
    id: 5,
    world: 'grasslands',
    name: 'Grasslands',
    enemyHPMultiplier: 1.2,
    enemyDamageMultiplier: 1.15,
    waves: [
      { spawns: [{ enemyId: 'orc', count: 3, spawnDelay: 0, spawnInterval: 2500 }], delayAfter: 3000 },
      { spawns: [{ enemyId: 'orc', count: 4, spawnDelay: 0, spawnInterval: 2200 }], delayAfter: 3000 },
      { spawns: [{ enemyId: 'orc', count: 5, spawnDelay: 0, spawnInterval: 2000 }], delayAfter: 0 },
    ],
    baseGoldReward: 175,
    targetTime: 130,
  },
  6: {
    id: 6,
    world: 'forest',
    name: 'Swamp',
    enemyHPMultiplier: 1.25,
    enemyDamageMultiplier: 1.2,
    waves: [
      { spawns: [{ enemyId: 'slime', count: 6, spawnDelay: 0, spawnInterval: 1200 }], delayAfter: 3000 },
      { spawns: [{ enemyId: 'troll', count: 2, spawnDelay: 0, spawnInterval: 3000 }], delayAfter: 3000 },
      { spawns: [
        { enemyId: 'slime', count: 5, spawnDelay: 0, spawnInterval: 1000 },
        { enemyId: 'troll', count: 2, spawnDelay: 4000, spawnInterval: 2500 },
      ], delayAfter: 0 },
    ],
    baseGoldReward: 200,
    targetTime: 140,
    unlocksUnit: 'mage',
  },
  7: {
    id: 7,
    world: 'forest',
    name: 'Cursed Bog',
    enemyHPMultiplier: 1.3,
    enemyDamageMultiplier: 1.25,
    waves: [
      { spawns: [{ enemyId: 'troll', count: 3, spawnDelay: 0, spawnInterval: 2800 }], delayAfter: 3000 },
      { spawns: [
        { enemyId: 'slime', count: 4, spawnDelay: 0, spawnInterval: 1200 },
        { enemyId: 'troll', count: 2, spawnDelay: 3000, spawnInterval: 2500 },
      ], delayAfter: 3000 },
      { spawns: [{ enemyId: 'troll', count: 4, spawnDelay: 0, spawnInterval: 2200 }], delayAfter: 0 },
    ],
    baseGoldReward: 225,
    targetTime: 150,
  },
  8: {
    id: 8,
    world: 'mountains',
    name: 'Mountain Pass',
    enemyHPMultiplier: 1.35,
    enemyDamageMultiplier: 1.3,
    waves: [
      { spawns: [{ enemyId: 'harpy', count: 4, spawnDelay: 0, spawnInterval: 1800 }], delayAfter: 3000 },
      { spawns: [{ enemyId: 'golem', count: 2, spawnDelay: 0, spawnInterval: 3500 }], delayAfter: 3000 },
      { spawns: [
        { enemyId: 'harpy', count: 3, spawnDelay: 0, spawnInterval: 1500 },
        { enemyId: 'golem', count: 2, spawnDelay: 3000, spawnInterval: 3000 },
      ], delayAfter: 0 },
    ],
    baseGoldReward: 250,
    targetTime: 160,
    unlocksUnit: 'healer',
  },
  9: {
    id: 9,
    world: 'mountains',
    name: 'Cave Entrance',
    enemyHPMultiplier: 1.4,
    enemyDamageMultiplier: 1.35,
    waves: [
      { spawns: [{ enemyId: 'harpy', count: 5, spawnDelay: 0, spawnInterval: 1500 }], delayAfter: 3000 },
      { spawns: [{ enemyId: 'golem', count: 3, spawnDelay: 0, spawnInterval: 3000 }], delayAfter: 3000 },
      { spawns: [
        { enemyId: 'harpy', count: 4, spawnDelay: 0, spawnInterval: 1400 },
        { enemyId: 'golem', count: 2, spawnDelay: 4000, spawnInterval: 2800 },
      ], delayAfter: 0 },
    ],
    baseGoldReward: 275,
    targetTime: 170,
  },
  10: {
    id: 10,
    world: 'mountains',
    name: 'Crystal Cavern',
    enemyHPMultiplier: 1.5,
    enemyDamageMultiplier: 1.4,
    waves: [
      { spawns: [{ enemyId: 'golem', count: 4, spawnDelay: 0, spawnInterval: 2800 }], delayAfter: 3000 },
      { spawns: [{ enemyId: 'golem', count: 3, spawnDelay: 0, spawnInterval: 2500 }], delayAfter: 3000 },
      { spawns: [
        { enemyId: 'golem', count: 2, spawnDelay: 0, spawnInterval: 2500 },
        { enemyId: 'giant', count: 1, spawnDelay: 5000, spawnInterval: 0 },
      ], delayAfter: 0 },
    ],
    baseGoldReward: 350,
    targetTime: 180,
    unlocksUnit: 'assassin',
  },
  11: {
    id: 11,
    world: 'volcano',
    name: 'Lava Fields',
    enemyHPMultiplier: 1.55,
    enemyDamageMultiplier: 1.45,
    waves: [
      { spawns: [{ enemyId: 'harpy', count: 5, spawnDelay: 0, spawnInterval: 1400 }], delayAfter: 3000 },
      { spawns: [{ enemyId: 'orc', count: 4, spawnDelay: 0, spawnInterval: 2000 }], delayAfter: 3000 },
      { spawns: [
        { enemyId: 'harpy', count: 4, spawnDelay: 0, spawnInterval: 1300 },
        { enemyId: 'orc', count: 3, spawnDelay: 3500, spawnInterval: 1800 },
      ], delayAfter: 0 },
    ],
    baseGoldReward: 325,
    targetTime: 175,
  },
  12: {
    id: 12,
    world: 'volcano',
    name: 'Volcano',
    enemyHPMultiplier: 1.6,
    enemyDamageMultiplier: 1.5,
    waves: [
      { spawns: [{ enemyId: 'orc', count: 5, spawnDelay: 0, spawnInterval: 1800 }], delayAfter: 3000 },
      { spawns: [{ enemyId: 'troll', count: 3, spawnDelay: 0, spawnInterval: 2500 }], delayAfter: 3000 },
      { spawns: [
        { enemyId: 'orc', count: 4, spawnDelay: 0, spawnInterval: 1600 },
        { enemyId: 'troll', count: 2, spawnDelay: 4000, spawnInterval: 2200 },
      ], delayAfter: 0 },
    ],
    baseGoldReward: 375,
    targetTime: 190,
    unlocksUnit: 'catapult',
  },
  13: {
    id: 13,
    world: 'mountains',
    name: 'Frozen Tundra',
    enemyHPMultiplier: 1.65,
    enemyDamageMultiplier: 1.55,
    waves: [
      { spawns: [{ enemyId: 'wolf', count: 6, spawnDelay: 0, spawnInterval: 1200 }], delayAfter: 3000 },
      { spawns: [{ enemyId: 'golem', count: 3, spawnDelay: 0, spawnInterval: 2800 }], delayAfter: 3000 },
      { spawns: [
        { enemyId: 'wolf', count: 5, spawnDelay: 0, spawnInterval: 1100 },
        { enemyId: 'golem', count: 2, spawnDelay: 4000, spawnInterval: 2500 },
      ], delayAfter: 0 },
    ],
    baseGoldReward: 400,
    targetTime: 200,
  },
  14: {
    id: 14,
    world: 'mountains',
    name: 'Ice Fortress',
    enemyHPMultiplier: 1.7,
    enemyDamageMultiplier: 1.6,
    waves: [
      { spawns: [{ enemyId: 'golem', count: 4, spawnDelay: 0, spawnInterval: 2500 }], delayAfter: 3000 },
      { spawns: [{ enemyId: 'giant', count: 1, spawnDelay: 0, spawnInterval: 0 }], delayAfter: 3000 },
      { spawns: [
        { enemyId: 'golem', count: 3, spawnDelay: 0, spawnInterval: 2300 },
        { enemyId: 'giant', count: 1, spawnDelay: 5000, spawnInterval: 0 },
      ], delayAfter: 0 },
    ],
    baseGoldReward: 425,
    targetTime: 210,
  },
  15: {
    id: 15,
    world: 'volcano',
    name: "Dragon's Lair",
    enemyHPMultiplier: 1.8,
    enemyDamageMultiplier: 1.7,
    waves: [
      { spawns: [{ enemyId: 'harpy', count: 5, spawnDelay: 0, spawnInterval: 1200 }], delayAfter: 3000 },
      { spawns: [
        { enemyId: 'golem', count: 3, spawnDelay: 0, spawnInterval: 2500 },
        { enemyId: 'harpy', count: 4, spawnDelay: 3000, spawnInterval: 1300 },
      ], delayAfter: 3000 },
      { spawns: [
        { enemyId: 'golem', count: 2, spawnDelay: 0, spawnInterval: 2500 },
        { enemyId: 'dragon_boss', count: 1, spawnDelay: 5000, spawnInterval: 0 },
      ], delayAfter: 0 },
    ],
    baseGoldReward: 500,
    targetTime: 220,
    unlocksUnit: 'griffin',
    requiresGold: 500,
  },
  16: {
    id: 16,
    world: 'forest',
    name: 'Shadow Realm',
    enemyHPMultiplier: 1.85,
    enemyDamageMultiplier: 1.75,
    waves: [
      { spawns: [{ enemyId: 'bandit', count: 6, spawnDelay: 0, spawnInterval: 1200 }], delayAfter: 3000 },
      { spawns: [{ enemyId: 'troll', count: 4, spawnDelay: 0, spawnInterval: 2200 }], delayAfter: 3000 },
      { spawns: [
        { enemyId: 'bandit', count: 5, spawnDelay: 0, spawnInterval: 1100 },
        { enemyId: 'troll', count: 3, spawnDelay: 4000, spawnInterval: 2000 },
      ], delayAfter: 0 },
    ],
    baseGoldReward: 475,
    targetTime: 215,
  },
  17: {
    id: 17,
    world: 'forest',
    name: 'Haunted Castle',
    enemyHPMultiplier: 1.9,
    enemyDamageMultiplier: 1.8,
    waves: [
      { spawns: [{ enemyId: 'bandit', count: 5, spawnDelay: 0, spawnInterval: 1200 }], delayAfter: 3000 },
      { spawns: [{ enemyId: 'orc', count: 4, spawnDelay: 0, spawnInterval: 1800 }], delayAfter: 3000 },
      { spawns: [
        { enemyId: 'bandit', count: 4, spawnDelay: 0, spawnInterval: 1100 },
        { enemyId: 'orc', count: 4, spawnDelay: 3500, spawnInterval: 1600 },
      ], delayAfter: 0 },
    ],
    baseGoldReward: 525,
    targetTime: 225,
  },
  18: {
    id: 18,
    world: 'mountains',
    name: 'Throne Room',
    enemyHPMultiplier: 1.95,
    enemyDamageMultiplier: 1.85,
    waves: [
      { spawns: [{ enemyId: 'orc', count: 5, spawnDelay: 0, spawnInterval: 1500 }], delayAfter: 3000 },
      { spawns: [
        { enemyId: 'golem', count: 3, spawnDelay: 0, spawnInterval: 2500 },
        { enemyId: 'giant', count: 1, spawnDelay: 4000, spawnInterval: 0 },
      ], delayAfter: 3000 },
      { spawns: [
        { enemyId: 'orc', count: 4, spawnDelay: 0, spawnInterval: 1400 },
        { enemyId: 'golem', count: 2, spawnDelay: 4000, spawnInterval: 2300 },
      ], delayAfter: 0 },
    ],
    baseGoldReward: 575,
    targetTime: 235,
    unlocksUnit: 'paladin',
    requiresGold: 750,
  },
  19: {
    id: 19,
    world: 'volcano',
    name: 'Demon Gate',
    enemyHPMultiplier: 2.0,
    enemyDamageMultiplier: 1.9,
    waves: [
      { spawns: [{ enemyId: 'troll', count: 4, spawnDelay: 0, spawnInterval: 2000 }], delayAfter: 3000 },
      { spawns: [
        { enemyId: 'harpy', count: 5, spawnDelay: 0, spawnInterval: 1200 },
        { enemyId: 'troll', count: 3, spawnDelay: 4000, spawnInterval: 1800 },
      ], delayAfter: 3000 },
      { spawns: [
        { enemyId: 'giant', count: 2, spawnDelay: 0, spawnInterval: 4000 },
        { enemyId: 'troll', count: 3, spawnDelay: 5000, spawnInterval: 1800 },
      ], delayAfter: 0 },
    ],
    baseGoldReward: 625,
    targetTime: 245,
  },
  20: {
    id: 20,
    world: 'volcano',
    name: 'The Abyss',
    enemyHPMultiplier: 2.1,
    enemyDamageMultiplier: 2.0,
    waves: [
      { spawns: [{ enemyId: 'troll', count: 5, spawnDelay: 0, spawnInterval: 1800 }], delayAfter: 3000 },
      { spawns: [
        { enemyId: 'giant', count: 2, spawnDelay: 0, spawnInterval: 3500 },
        { enemyId: 'golem', count: 3, spawnDelay: 4000, spawnInterval: 2500 },
      ], delayAfter: 3000 },
      { spawns: [
        { enemyId: 'golem', count: 3, spawnDelay: 0, spawnInterval: 2500 },
        { enemyId: 'demon_lord', count: 1, spawnDelay: 6000, spawnInterval: 0 },
      ], delayAfter: 0 },
    ],
    baseGoldReward: 750,
    targetTime: 260,
    unlocksUnit: 'dragon',
    requiresGold: 1000,
  },
};

/**
 * Endless mode stage definition (stageId 0).
 * Dynamically scales enemies based on wave number.
 */
const ENDLESS_STAGE: StageDefinition = {
  id: 0,
  world: 'volcano',
  name: 'Endless Mode',
  enemyHPMultiplier: 1.0,
  enemyDamageMultiplier: 1.0,
  waves: [],
  baseGoldReward: 100,
  targetTime: 0,
};

/**
 * Get stage definition by ID.
 * @param stageId - Stage number (1-20) or 0 for endless mode
 * @throws Error if stageId is not valid (not 0-20)
 */
export function getStage(stageId: number): StageDefinition {
  if (stageId === 0) {
    return ENDLESS_STAGE;
  }
  const stage = STAGE_DEFINITIONS[stageId];
  if (!stage) {
    throw new Error(`Invalid stageId: ${stageId}. Must be 0 (endless) or 1-20.`);
  }
  return stage;
}
