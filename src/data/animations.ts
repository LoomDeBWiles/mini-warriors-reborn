/**
 * Animation configuration for unit spritesheets.
 * All sprites use 64x64 pixel frames arranged horizontally.
 */

export interface AnimationConfig {
  /** Total width of spritesheet in pixels */
  width: number;
  /** Frame width in pixels */
  frameWidth: number;
  /** Frame height in pixels */
  frameHeight: number;
  /** Animation state definitions: [startFrame, frameCount] */
  states: {
    idle: [number, number];
    walk: [number, number];
    attack: [number, number];
    death: [number, number];
  };
}

/**
 * Standard 20-frame layout used by most units:
 * - Idle: frames 0-3 (4 frames)
 * - Walk: frames 4-11 (8 frames)
 * - Attack: frames 12-15 (4 frames)
 * - Death: frames 16-19 (4 frames)
 */
const STANDARD_20_FRAME: AnimationConfig = {
  width: 1280,
  frameWidth: 64,
  frameHeight: 64,
  states: {
    idle: [0, 4],
    walk: [4, 8],
    attack: [12, 4],
    death: [16, 4],
  },
};

/**
 * 21-frame layout used by some enemies:
 * - Idle: frames 0-5 (6 frames)
 * - Walk: frames 6-9 (4 frames)
 * - Attack: frames 10-15 (6 frames)
 * - Death: frames 16-20 (5 frames)
 */
const STANDARD_21_FRAME: AnimationConfig = {
  width: 1344,
  frameWidth: 64,
  frameHeight: 64,
  states: {
    idle: [0, 6],
    walk: [6, 4],
    attack: [10, 6],
    death: [16, 5],
  },
};

/**
 * 16-frame layout (dinosaur):
 * - Idle: frames 0-3 (4 frames)
 * - Walk: frames 4-7 (4 frames)
 * - Attack: frames 8-11 (4 frames)
 * - Death: frames 12-15 (4 frames)
 */
const STANDARD_16_FRAME: AnimationConfig = {
  width: 1024,
  frameWidth: 64,
  frameHeight: 64,
  states: {
    idle: [0, 4],
    walk: [4, 4],
    attack: [8, 4],
    death: [12, 4],
  },
};

/**
 * 18-frame layout (rider):
 * - Idle: frames 0-4 (5 frames)
 * - Walk: frames 5-8 (4 frames)
 * - Attack: frames 9-13 (5 frames)
 * - Death: frames 14-17 (4 frames)
 */
const STANDARD_18_FRAME: AnimationConfig = {
  width: 1152,
  frameWidth: 64,
  frameHeight: 64,
  states: {
    idle: [0, 5],
    walk: [5, 4],
    attack: [9, 5],
    death: [14, 4],
  },
};

/**
 * 23-frame layout (harpy, dragon_rider):
 * - Idle: frames 0-5 (6 frames)
 * - Walk: frames 6-11 (6 frames)
 * - Attack: frames 12-17 (6 frames)
 * - Death: frames 18-22 (5 frames)
 */
const STANDARD_23_FRAME: AnimationConfig = {
  width: 1472,
  frameWidth: 64,
  frameHeight: 64,
  states: {
    idle: [0, 6],
    walk: [6, 6],
    attack: [12, 6],
    death: [18, 5],
  },
};

/**
 * 24-frame layout (slinger):
 * - Idle: frames 0-5 (6 frames)
 * - Walk: frames 6-11 (6 frames)
 * - Attack: frames 12-17 (6 frames)
 * - Death: frames 18-23 (6 frames)
 */
const STANDARD_24_FRAME: AnimationConfig = {
  width: 1536,
  frameWidth: 64,
  frameHeight: 64,
  states: {
    idle: [0, 6],
    walk: [6, 6],
    attack: [12, 6],
    death: [18, 6],
  },
};

/** Animation configs for player units */
export const UNIT_ANIMATIONS: Record<string, AnimationConfig> = {
  swordsman: STANDARD_20_FRAME,
  archer: STANDARD_20_FRAME,
  knight: STANDARD_20_FRAME,
  mage: STANDARD_20_FRAME,
  healer: STANDARD_20_FRAME,
  assassin: STANDARD_20_FRAME,
  catapult: STANDARD_20_FRAME,
  griffin: STANDARD_20_FRAME,
  paladin: STANDARD_20_FRAME,
  dragon: STANDARD_20_FRAME,
};

/** Animation configs for enemy sprites */
export const ENEMY_ANIMATIONS: Record<string, AnimationConfig> = {
  goblin: STANDARD_20_FRAME,
  warrior: STANDARD_21_FRAME,
  slinger: STANDARD_24_FRAME,
  brute: STANDARD_21_FRAME,
  speedy: STANDARD_21_FRAME,
  rider: STANDARD_18_FRAME,
  archer_enemy: STANDARD_21_FRAME,
  wizard: STANDARD_21_FRAME,
  giant: STANDARD_21_FRAME,
  harpy: STANDARD_23_FRAME,
  dinosaur: STANDARD_16_FRAME,
  dragon_rider: STANDARD_23_FRAME,
};

/** Animation frame rates */
export const ANIMATION_FRAME_RATE = {
  idle: 6,
  walk: 10,
  attack: 12,
  death: 8,
};

/**
 * Maps enemy IDs used in game logic to sprite file names.
 * Use when enemy definition IDs don't match sprite filenames.
 */
export const ENEMY_SPRITE_MAP: Record<string, string> = {
  // Direct matches (sprite name = enemy ID)
  goblin: 'goblin',
  harpy: 'harpy',
  giant: 'giant',
  // Mapped sprites (enemy ID → different sprite file)
  wolf: 'speedy',
  bandit: 'warrior',
  orc: 'brute',
  slime: 'slinger',
  troll: 'wizard',
  golem: 'rider',
  dragon_boss: 'dinosaur',
  demon_lord: 'dragon_rider',
};

/**
 * Get the sprite filename for an enemy ID.
 * Returns the mapped sprite name, or the enemy ID if no mapping exists.
 */
export function getEnemySpriteFile(enemyId: string): string {
  return ENEMY_SPRITE_MAP[enemyId] ?? enemyId;
}
