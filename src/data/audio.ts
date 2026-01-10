/**
 * Sound effect definitions with variations and settings.
 */
export interface SfxDefinition {
  key: string;
  variations?: string[];
  maxInstances?: number; // For pooling: limit concurrent instances
}

/**
 * Sound effect keys for the game.
 * Sounds with variations will randomly select from their variation list.
 */
export const SFX_KEYS = {
  // UI
  button_click: { key: 'sfx_button_click' },
  button_hover: { key: 'sfx_button_hover' },
  gold_earned: { key: 'sfx_gold_earned' },
  purchase_success: { key: 'sfx_purchase_success' },
  purchase_fail: { key: 'sfx_purchase_fail' },
  star_earned: { key: 'sfx_star_earned' },

  // Combat - Melee
  sword_hit: {
    key: 'sfx_sword_hit',
    variations: ['sfx_sword_hit_1', 'sfx_sword_hit_2', 'sfx_sword_hit_3'],
    maxInstances: 4,
  },
  sword_swing: { key: 'sfx_sword_swing' },

  // Combat - Ranged
  arrow_fire: { key: 'sfx_arrow_fire' },
  arrow_hit: { key: 'sfx_arrow_hit' },
  magic_cast: { key: 'sfx_magic_cast' },
  magic_hit: { key: 'sfx_magic_hit' },
  fireball_launch: { key: 'sfx_fireball_launch' },
  fireball_explode: { key: 'sfx_fireball_explode' },

  // Combat - Impact
  light_hit: { key: 'sfx_light_hit' },
  heavy_hit: { key: 'sfx_heavy_hit' },
  critical_hit: { key: 'sfx_critical_hit' },
  shield_block: { key: 'sfx_shield_block' },

  // Units
  spawn_melee: { key: 'sfx_spawn_melee' },
  spawn_ranged: { key: 'sfx_spawn_ranged' },
  spawn_heavy: { key: 'sfx_spawn_heavy' },
  death_human: { key: 'sfx_death_human' },
  death_monster: { key: 'sfx_death_monster' },
  death_boss: { key: 'sfx_death_boss' },

  // Events
  wave_start: { key: 'sfx_wave_start' },
  wave_complete: { key: 'sfx_wave_complete' },
  boss_spawn: { key: 'sfx_boss_spawn' },
  level_up: { key: 'sfx_level_up' },

  // Abilities
  heal_cast: { key: 'sfx_heal_cast' },
  meteor_strike: { key: 'sfx_meteor_strike' },
  time_warp: { key: 'sfx_time_warp' },
} as const;

export type SfxKey = keyof typeof SFX_KEYS;

/**
 * Music track keys.
 */
export const MUSIC_KEYS = {
  menu: 'music_menu',
  battle_easy: 'music_battle_easy',
  battle_hard: 'music_battle_hard',
  boss: 'music_boss',
  upgrade: 'music_upgrade',
  victory: 'sfx_victory',
  defeat: 'sfx_defeat',
} as const;

export type MusicKey = keyof typeof MUSIC_KEYS;
