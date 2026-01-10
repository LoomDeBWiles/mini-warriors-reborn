/**
 * Generate all SFX WAV files using jsfxr.
 *
 * Usage: npx tsx scripts/generate-sfx.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// @ts-expect-error jsfxr has no types
import jsfxr from 'jsfxr';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../public/assets/audio/sfx');

const { Params, SoundEffect, waveforms } = jsfxr;
const { SQUARE, SAWTOOTH, SINE, NOISE } = waveforms;

interface SfxConfig {
  preset?: string;
  customize?: (params: typeof Params.prototype) => void;
  seed?: number;
}

/**
 * SFX definitions mapping each sound key to generation parameters.
 * Uses jsfxr presets with customizations for game-appropriate sounds.
 */
const SFX_CONFIGS: Record<string, SfxConfig> = {
  // UI
  sfx_button_click: {
    preset: 'blipSelect',
    customize: (p) => {
      p.p_env_sustain = 0.05;
      p.p_env_decay = 0.1;
      p.p_base_freq = 0.5;
    },
    seed: 1,
  },
  sfx_button_hover: {
    preset: 'blipSelect',
    customize: (p) => {
      p.p_env_sustain = 0.03;
      p.p_env_decay = 0.05;
      p.p_base_freq = 0.6;
      p.sound_vol = 0.15;
    },
    seed: 2,
  },
  sfx_gold_earned: {
    preset: 'pickupCoin',
    customize: (p) => {
      p.p_base_freq = 0.6;
      p.p_arp_mod = 0.4;
      p.p_arp_speed = 0.6;
    },
    seed: 3,
  },
  sfx_purchase_success: {
    preset: 'powerUp',
    customize: (p) => {
      p.p_base_freq = 0.4;
      p.p_freq_ramp = 0.2;
      p.p_env_sustain = 0.2;
    },
    seed: 4,
  },
  sfx_purchase_fail: {
    preset: 'hitHurt',
    customize: (p) => {
      p.wave_type = SQUARE;
      p.p_base_freq = 0.3;
      p.p_freq_ramp = -0.2;
      p.p_env_decay = 0.3;
    },
    seed: 5,
  },
  sfx_star_earned: {
    preset: 'powerUp',
    customize: (p) => {
      p.wave_type = SINE;
      p.p_base_freq = 0.5;
      p.p_freq_ramp = 0.3;
      p.p_env_sustain = 0.3;
      p.p_arp_mod = 0.3;
      p.p_arp_speed = 0.5;
    },
    seed: 6,
  },

  // Combat - Melee
  sfx_sword_hit_1: {
    preset: 'hitHurt',
    customize: (p) => {
      p.wave_type = NOISE;
      p.p_base_freq = 0.4;
      p.p_freq_ramp = -0.4;
      p.p_env_sustain = 0.05;
      p.p_env_decay = 0.15;
    },
    seed: 10,
  },
  sfx_sword_hit_2: {
    preset: 'hitHurt',
    customize: (p) => {
      p.wave_type = NOISE;
      p.p_base_freq = 0.45;
      p.p_freq_ramp = -0.35;
      p.p_env_sustain = 0.06;
      p.p_env_decay = 0.14;
    },
    seed: 11,
  },
  sfx_sword_hit_3: {
    preset: 'hitHurt',
    customize: (p) => {
      p.wave_type = NOISE;
      p.p_base_freq = 0.35;
      p.p_freq_ramp = -0.45;
      p.p_env_sustain = 0.04;
      p.p_env_decay = 0.16;
    },
    seed: 12,
  },
  sfx_sword_swing: {
    customize: (p) => {
      p.wave_type = NOISE;
      p.p_base_freq = 0.5;
      p.p_freq_ramp = -0.4;
      p.p_env_attack = 0;
      p.p_env_sustain = 0.06;
      p.p_env_decay = 0.12;
      p.p_hpf_freq = 0.15;
      p.sound_vol = 0.25;
    },
  },

  // Combat - Ranged
  sfx_arrow_fire: {
    preset: 'laserShoot',
    customize: (p) => {
      p.wave_type = NOISE;
      p.p_base_freq = 0.7;
      p.p_freq_ramp = -0.3;
      p.p_env_sustain = 0.02;
      p.p_env_decay = 0.08;
      p.p_hpf_freq = 0.3;
    },
    seed: 20,
  },
  sfx_arrow_hit: {
    preset: 'hitHurt',
    customize: (p) => {
      p.wave_type = NOISE;
      p.p_base_freq = 0.5;
      p.p_freq_ramp = -0.5;
      p.p_env_sustain = 0.02;
      p.p_env_decay = 0.1;
    },
    seed: 21,
  },
  sfx_magic_cast: {
    preset: 'synth',
    customize: (p) => {
      p.wave_type = SINE;
      p.p_base_freq = 0.35;
      p.p_freq_ramp = 0.15;
      p.p_env_attack = 0.05;
      p.p_env_sustain = 0.15;
      p.p_env_decay = 0.2;
      p.p_vib_strength = 0.3;
      p.p_vib_speed = 0.4;
    },
    seed: 22,
  },
  sfx_magic_hit: {
    preset: 'explosion',
    customize: (p) => {
      p.wave_type = NOISE;
      p.p_base_freq = 0.3;
      p.p_freq_ramp = -0.2;
      p.p_env_sustain = 0.1;
      p.p_env_decay = 0.2;
      p.p_lpf_freq = 0.6;
    },
    seed: 23,
  },
  sfx_fireball_launch: {
    preset: 'laserShoot',
    customize: (p) => {
      p.wave_type = NOISE;
      p.p_base_freq = 0.4;
      p.p_freq_ramp = 0.1;
      p.p_env_sustain = 0.1;
      p.p_env_decay = 0.15;
      p.p_lpf_freq = 0.5;
    },
    seed: 24,
  },
  sfx_fireball_explode: {
    preset: 'explosion',
    customize: (p) => {
      p.p_base_freq = 0.25;
      p.p_freq_ramp = -0.15;
      p.p_env_sustain = 0.15;
      p.p_env_decay = 0.3;
      p.p_env_punch = 0.5;
    },
    seed: 25,
  },

  // Combat - Impact
  sfx_light_hit: {
    preset: 'hitHurt',
    customize: (p) => {
      p.wave_type = NOISE;
      p.p_base_freq = 0.5;
      p.p_freq_ramp = -0.3;
      p.p_env_sustain = 0.03;
      p.p_env_decay = 0.08;
      p.sound_vol = 0.2;
    },
    seed: 30,
  },
  sfx_heavy_hit: {
    preset: 'explosion',
    customize: (p) => {
      p.p_base_freq = 0.2;
      p.p_freq_ramp = -0.2;
      p.p_env_sustain = 0.08;
      p.p_env_decay = 0.2;
      p.p_env_punch = 0.4;
    },
    seed: 31,
  },
  sfx_critical_hit: {
    preset: 'explosion',
    customize: (p) => {
      p.p_base_freq = 0.3;
      p.p_freq_ramp = -0.25;
      p.p_env_sustain = 0.1;
      p.p_env_decay = 0.25;
      p.p_env_punch = 0.6;
      p.p_pha_offset = 0.2;
    },
    seed: 32,
  },
  sfx_shield_block: {
    preset: 'hitHurt',
    customize: (p) => {
      p.wave_type = NOISE;
      p.p_base_freq = 0.6;
      p.p_freq_ramp = -0.4;
      p.p_env_sustain = 0.04;
      p.p_env_decay = 0.12;
      p.p_hpf_freq = 0.15;
    },
    seed: 33,
  },

  // Units
  sfx_spawn_melee: {
    preset: 'powerUp',
    customize: (p) => {
      p.wave_type = SQUARE;
      p.p_base_freq = 0.3;
      p.p_freq_ramp = 0.15;
      p.p_env_sustain = 0.1;
      p.p_env_decay = 0.15;
    },
    seed: 40,
  },
  sfx_spawn_ranged: {
    preset: 'powerUp',
    customize: (p) => {
      p.wave_type = SAWTOOTH;
      p.p_base_freq = 0.35;
      p.p_freq_ramp = 0.2;
      p.p_env_sustain = 0.08;
      p.p_env_decay = 0.12;
    },
    seed: 41,
  },
  sfx_spawn_heavy: {
    preset: 'powerUp',
    customize: (p) => {
      p.wave_type = SQUARE;
      p.p_base_freq = 0.2;
      p.p_freq_ramp = 0.1;
      p.p_env_sustain = 0.15;
      p.p_env_decay = 0.2;
    },
    seed: 42,
  },
  sfx_death_human: {
    preset: 'hitHurt',
    customize: (p) => {
      p.wave_type = NOISE;
      p.p_base_freq = 0.4;
      p.p_freq_ramp = -0.5;
      p.p_env_sustain = 0.1;
      p.p_env_decay = 0.3;
    },
    seed: 43,
  },
  sfx_death_monster: {
    preset: 'hitHurt',
    customize: (p) => {
      p.wave_type = NOISE;
      p.p_base_freq = 0.3;
      p.p_freq_ramp = -0.4;
      p.p_env_sustain = 0.12;
      p.p_env_decay = 0.35;
      p.p_lpf_freq = 0.7;
    },
    seed: 44,
  },
  sfx_death_boss: {
    preset: 'explosion',
    customize: (p) => {
      p.p_base_freq = 0.15;
      p.p_freq_ramp = -0.1;
      p.p_env_sustain = 0.2;
      p.p_env_decay = 0.5;
      p.p_env_punch = 0.3;
    },
    seed: 45,
  },

  // Events
  sfx_wave_start: {
    preset: 'synth',
    customize: (p) => {
      p.wave_type = SAWTOOTH;
      p.p_base_freq = 0.25;
      p.p_freq_ramp = 0.1;
      p.p_env_attack = 0.1;
      p.p_env_sustain = 0.2;
      p.p_env_decay = 0.3;
    },
    seed: 50,
  },
  sfx_wave_complete: {
    preset: 'powerUp',
    customize: (p) => {
      p.wave_type = SAWTOOTH;
      p.p_base_freq = 0.4;
      p.p_freq_ramp = 0.25;
      p.p_env_sustain = 0.25;
      p.p_env_decay = 0.35;
      p.p_arp_mod = 0.3;
      p.p_arp_speed = 0.4;
    },
    seed: 51,
  },
  sfx_boss_spawn: {
    preset: 'explosion',
    customize: (p) => {
      p.p_base_freq = 0.1;
      p.p_freq_ramp = 0.05;
      p.p_env_attack = 0.15;
      p.p_env_sustain = 0.3;
      p.p_env_decay = 0.4;
      p.p_vib_strength = 0.2;
      p.p_vib_speed = 0.3;
    },
    seed: 52,
  },
  sfx_level_up: {
    preset: 'powerUp',
    customize: (p) => {
      p.wave_type = SINE;
      p.p_base_freq = 0.35;
      p.p_freq_ramp = 0.35;
      p.p_env_sustain = 0.2;
      p.p_env_decay = 0.4;
      p.p_arp_mod = 0.5;
      p.p_arp_speed = 0.3;
    },
    seed: 53,
  },

  // Abilities
  sfx_heal_cast: {
    preset: 'synth',
    customize: (p) => {
      p.wave_type = SINE;
      p.p_base_freq = 0.4;
      p.p_freq_ramp = 0.2;
      p.p_env_attack = 0.1;
      p.p_env_sustain = 0.2;
      p.p_env_decay = 0.3;
      p.p_vib_strength = 0.2;
      p.p_vib_speed = 0.5;
    },
    seed: 60,
  },
  sfx_meteor_strike: {
    preset: 'explosion',
    customize: (p) => {
      p.p_base_freq = 0.2;
      p.p_freq_ramp = -0.25;
      p.p_env_sustain = 0.2;
      p.p_env_decay = 0.5;
      p.p_env_punch = 0.7;
      p.p_repeat_speed = 0.4;
    },
    seed: 61,
  },
  sfx_time_warp: {
    preset: 'synth',
    customize: (p) => {
      p.wave_type = SINE;
      p.p_base_freq = 0.3;
      p.p_freq_ramp = -0.1;
      p.p_freq_dramp = 0.05;
      p.p_env_attack = 0.2;
      p.p_env_sustain = 0.3;
      p.p_env_decay = 0.4;
      p.p_vib_strength = 0.4;
      p.p_vib_speed = 0.6;
      p.p_pha_offset = 0.3;
      p.p_pha_ramp = -0.1;
    },
    seed: 62,
  },

  // Victory / Defeat (music keys that are actually SFX)
  sfx_victory: {
    preset: 'powerUp',
    customize: (p) => {
      p.wave_type = SAWTOOTH;
      p.p_base_freq = 0.3;
      p.p_freq_ramp = 0.2;
      p.p_env_attack = 0.05;
      p.p_env_sustain = 0.4;
      p.p_env_decay = 0.5;
      p.p_arp_mod = 0.4;
      p.p_arp_speed = 0.3;
    },
    seed: 70,
  },
  sfx_defeat: {
    preset: 'synth',
    customize: (p) => {
      p.wave_type = SAWTOOTH;
      p.p_base_freq = 0.35;
      p.p_freq_ramp = -0.15;
      p.p_env_attack = 0.1;
      p.p_env_sustain = 0.3;
      p.p_env_decay = 0.6;
    },
    seed: 71,
  },
};

/**
 * Seeded random for reproducible sound generation.
 */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/**
 * Generate a WAV file for a sound effect.
 */
function generateSfx(key: string, config: SfxConfig): Buffer {
  // Create params and apply preset
  const params = new Params();
  params.sound_vol = 0.25;
  params.sample_rate = 44100;
  params.sample_size = 8;

  // Seed random if specified (for reproducibility)
  if (config.seed !== undefined) {
    const rand = seededRandom(config.seed);
    // Override Math.random temporarily for the preset
    const origRandom = Math.random;
    Math.random = rand;

    if (config.preset) {
      params[config.preset]();
    }

    Math.random = origRandom;
  } else if (config.preset) {
    params[config.preset]();
  }

  // Apply customizations
  if (config.customize) {
    config.customize(params);
  }

  // Generate the sound
  const sound = new SoundEffect(params).generate();

  // Extract WAV data from data URI
  const dataUri = sound.dataURI as string;
  const base64Data = dataUri.split(',')[1];
  return Buffer.from(base64Data, 'base64');
}

/**
 * Main entry point.
 */
function main(): void {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`Generating ${Object.keys(SFX_CONFIGS).length} SFX files...`);

  for (const [key, config] of Object.entries(SFX_CONFIGS)) {
    const filename = `${key}.wav`;
    const filepath = path.join(OUTPUT_DIR, filename);

    const wavBuffer = generateSfx(key, config);
    fs.writeFileSync(filepath, wavBuffer);

    console.log(`  ✓ ${filename}`);
  }

  console.log(`\nDone! Generated ${Object.keys(SFX_CONFIGS).length} files in ${OUTPUT_DIR}`);
}

main();
