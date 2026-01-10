/**
 * Stage definitions for the game.
 * Contains stage names, enemy types, and base gold rewards.
 */
export interface StageDefinition {
  id: number;
  name: string;
  /** Enemy types that appear in this stage */
  enemies: string[];
  /** Base gold reward for completing the stage */
  baseGold: number;
}

/**
 * All stage definitions keyed by stage ID.
 */
export const STAGE_DEFINITIONS: Record<number, StageDefinition> = {
  1: {
    id: 1,
    name: 'Training Grounds',
    enemies: ['Goblin'],
    baseGold: 50,
  },
  2: {
    id: 2,
    name: 'Forest Edge',
    enemies: ['Goblin', 'Wolf'],
    baseGold: 75,
  },
  3: {
    id: 3,
    name: 'Dark Woods',
    enemies: ['Wolf', 'Bandit'],
    baseGold: 100,
  },
  4: {
    id: 4,
    name: 'Bandit Camp',
    enemies: ['Bandit', 'Bandit Chief (mini-boss)'],
    baseGold: 150,
  },
  5: {
    id: 5,
    name: 'Grasslands',
    enemies: ['Orc', 'Brute (mini-boss)'],
    baseGold: 175,
  },
  6: {
    id: 6,
    name: 'Swamp',
    enemies: ['Slime', 'Troll'],
    baseGold: 200,
  },
  7: {
    id: 7,
    name: 'Cursed Bog',
    enemies: ['Troll', 'Witch'],
    baseGold: 225,
  },
  8: {
    id: 8,
    name: 'Mountain Pass',
    enemies: ['Harpy', 'Golem'],
    baseGold: 250,
  },
  9: {
    id: 9,
    name: 'Cave Entrance',
    enemies: ['Bat Swarm', 'Cave Spider'],
    baseGold: 275,
  },
  10: {
    id: 10,
    name: 'Crystal Cavern',
    enemies: ['Golem', 'Giant (boss)'],
    baseGold: 350,
  },
  11: {
    id: 11,
    name: 'Lava Fields',
    enemies: ['Fire Imp', 'Salamander'],
    baseGold: 325,
  },
  12: {
    id: 12,
    name: 'Volcano',
    enemies: ['Salamander', 'Fire Elemental'],
    baseGold: 375,
  },
  13: {
    id: 13,
    name: 'Frozen Tundra',
    enemies: ['Ice Wolf', 'Frost Giant'],
    baseGold: 400,
  },
  14: {
    id: 14,
    name: 'Ice Fortress',
    enemies: ['Frost Giant', 'Ice Mage'],
    baseGold: 425,
  },
  15: {
    id: 15,
    name: 'Dragon\'s Lair',
    enemies: ['Drake', 'Dragon Boss (boss)'],
    baseGold: 500,
  },
  16: {
    id: 16,
    name: 'Shadow Realm',
    enemies: ['Shadow', 'Wraith'],
    baseGold: 475,
  },
  17: {
    id: 17,
    name: 'Haunted Castle',
    enemies: ['Ghost', 'Vampire'],
    baseGold: 525,
  },
  18: {
    id: 18,
    name: 'Throne Room',
    enemies: ['Dark Knight', 'Lich'],
    baseGold: 575,
  },
  19: {
    id: 19,
    name: 'Demon Gate',
    enemies: ['Demon', 'Succubus'],
    baseGold: 625,
  },
  20: {
    id: 20,
    name: 'The Abyss',
    enemies: ['Demon', 'Demon Lord (boss)'],
    baseGold: 750,
  },
};

/**
 * Get stage definition by ID, returns undefined if not found.
 */
export function getStageDefinition(stageId: number): StageDefinition | undefined {
  return STAGE_DEFINITIONS[stageId];
}
