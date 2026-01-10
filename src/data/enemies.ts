/**
 * Enemy unit definitions.
 * Contains base stats and gold drop values.
 */
export interface EnemyDefinition {
  id: string;
  name: string;
  /** Base HP */
  hp: number;
  /** Base damage per attack */
  damage: number;
  /** Attack range in pixels (0 = melee) */
  range: number;
  /** Movement speed in pixels/sec */
  speed: number;
  /** Gold awarded when killed */
  goldDrop: number;
}

/**
 * Wave spawn definition - describes when and how many enemies spawn.
 */
export interface SpawnDefinition {
  enemyId: string;
  count: number;
  /** Delay before first spawn in ms */
  spawnDelay: number;
  /** Interval between spawns in ms */
  spawnInterval: number;
}

/**
 * Wave definition - a sequence of spawn groups.
 */
export interface WaveDefinition {
  spawns: SpawnDefinition[];
  /** Delay after wave completes before next wave in ms */
  delayAfter: number;
}

/**
 * All enemy definitions keyed by enemy ID.
 */
export const ENEMY_DEFINITIONS: Record<string, EnemyDefinition> = {
  goblin: {
    id: 'goblin',
    name: 'Goblin',
    hp: 40,
    damage: 8,
    range: 0,
    speed: 60,
    goldDrop: 5,
  },
  wolf: {
    id: 'wolf',
    name: 'Wolf',
    hp: 50,
    damage: 12,
    range: 0,
    speed: 90,
    goldDrop: 7,
  },
  bandit: {
    id: 'bandit',
    name: 'Bandit',
    hp: 70,
    damage: 10,
    range: 0,
    speed: 55,
    goldDrop: 10,
  },
  orc: {
    id: 'orc',
    name: 'Orc',
    hp: 120,
    damage: 15,
    range: 0,
    speed: 45,
    goldDrop: 15,
  },
  slime: {
    id: 'slime',
    name: 'Slime',
    hp: 30,
    damage: 5,
    range: 0,
    speed: 30,
    goldDrop: 4,
  },
  troll: {
    id: 'troll',
    name: 'Troll',
    hp: 200,
    damage: 20,
    range: 0,
    speed: 35,
    goldDrop: 25,
  },
  harpy: {
    id: 'harpy',
    name: 'Harpy',
    hp: 60,
    damage: 14,
    range: 0,
    speed: 85,
    goldDrop: 12,
  },
  golem: {
    id: 'golem',
    name: 'Golem',
    hp: 250,
    damage: 25,
    range: 0,
    speed: 25,
    goldDrop: 30,
  },
  giant: {
    id: 'giant',
    name: 'Giant',
    hp: 500,
    damage: 40,
    range: 0,
    speed: 20,
    goldDrop: 75,
  },
  dragon_boss: {
    id: 'dragon_boss',
    name: 'Dragon Boss',
    hp: 800,
    damage: 60,
    range: 100,
    speed: 40,
    goldDrop: 150,
  },
  demon_lord: {
    id: 'demon_lord',
    name: 'Demon Lord',
    hp: 1000,
    damage: 75,
    range: 0,
    speed: 30,
    goldDrop: 200,
  },
};
