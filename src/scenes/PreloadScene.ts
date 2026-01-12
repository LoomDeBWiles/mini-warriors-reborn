import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';
import { AudioManager } from '../managers/AudioManager';
import { GameState } from '../managers/GameState';
import {
  UNIT_ANIMATIONS,
  ENEMY_ANIMATIONS,
  ANIMATION_FRAME_RATE,
  AnimationConfig,
  getEnemySpriteFile,
} from '../data/animations';

const SETTINGS_STORAGE_KEY = 'miniWarriorsSettings';

// Player unit sprite IDs
const PLAYER_UNITS = [
  'swordsman',
  'archer',
  'knight',
  'mage',
  'healer',
  'assassin',
  'catapult',
  'griffin',
  'paladin',
  'dragon',
] as const;

// Enemy IDs (matching ENEMY_DEFINITIONS, not sprite filenames)
const ENEMIES = [
  'goblin',
  'wolf',
  'bandit',
  'orc',
  'slime',
  'troll',
  'harpy',
  'golem',
  'giant',
  'dragon_boss',
  'demon_lord',
  'flying_dragon',
] as const;

// Background IDs
const BACKGROUNDS = [
  'battle_grasslands',
  'battle_forest',
  'battle_mountains',
  'battle_volcano',
  'menu',
  'level_select',
  'loadout',
  'upgrade',
] as const;

// UI texture IDs
const UI_TEXTURES = [
  'button_normal',
  'button_pressed',
  'button_hover',
  'button_disabled',
  'panel',
  'icon_gold',
  'icon_gem',
  'health_bar',
] as const;

// Music track IDs (filename without extension -> Phaser key)
const MUSIC_TRACKS = [
  { file: 'menu', key: 'music_menu' },
  { file: 'battle_easy', key: 'music_battle_easy' },
  { file: 'battle_hard', key: 'music_battle_hard' },
  { file: 'boss', key: 'music_boss' },
  { file: 'upgrade', key: 'music_upgrade' },
  { file: 'victory', key: 'sfx_victory' },
  { file: 'defeat', key: 'sfx_defeat' },
] as const;

// SFX file IDs (all use sfx_ prefix)
const SFX_FILES = [
  'button_click',
  'button_hover',
  'gold_earned',
  'purchase_success',
  'purchase_fail',
  'star_earned',
  'sword_hit_1',
  'sword_hit_2',
  'sword_hit_3',
  'sword_swing',
  'arrow_fire',
  'arrow_hit',
  'magic_cast',
  'magic_hit',
  'fireball_launch',
  'fireball_explode',
  'light_hit',
  'heavy_hit',
  'critical_hit',
  'shield_block',
  'spawn_melee',
  'spawn_ranged',
  'spawn_heavy',
  'death_human',
  'death_monster',
  'death_boss',
  'wave_start',
  'wave_complete',
  'boss_spawn',
  'level_up',
  'heal_cast',
  'meteor_strike',
  'time_warp',
] as const;

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'preload' });
  }

  preload(): void {
    // Create loading bar
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(GAME_WIDTH / 2 - 160, GAME_HEIGHT / 2 - 25, 320, 50);

    const loadingText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'Loading...', {
      fontSize: '20px',
      color: '#ffffff',
    });
    loadingText.setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x4a90d9, 1);
      progressBar.fillRect(GAME_WIDTH / 2 - 150, GAME_HEIGHT / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    this.loadSprites();
    this.loadBackgrounds();
    this.loadUI();
    this.loadAudio();
  }

  private loadSprites(): void {
    // Player unit spritesheets
    for (const unit of PLAYER_UNITS) {
      const config = UNIT_ANIMATIONS[unit];
      if (config) {
        this.load.spritesheet(`unit_${unit}`, `assets/sprites/units/${unit}.png`, {
          frameWidth: config.frameWidth,
          frameHeight: config.frameHeight,
        });
      } else {
        // Fallback to image if no animation config
        this.load.image(`unit_${unit}`, `assets/sprites/units/${unit}.png`);
      }
    }

    // Enemy spritesheets (use sprite mapping for filenames)
    for (const enemy of ENEMIES) {
      const spriteFile = getEnemySpriteFile(enemy);
      const config = ENEMY_ANIMATIONS[spriteFile];
      if (config) {
        this.load.spritesheet(`enemy_${enemy}`, `assets/sprites/enemies/${spriteFile}.png`, {
          frameWidth: config.frameWidth,
          frameHeight: config.frameHeight,
        });
      } else {
        // Fallback to image if no animation config
        this.load.image(`enemy_${enemy}`, `assets/sprites/enemies/${spriteFile}.png`);
      }
    }
  }

  private loadBackgrounds(): void {
    for (const bg of BACKGROUNDS) {
      this.load.image(`bg_${bg}`, `assets/backgrounds/${bg}.png`);
    }
  }

  private loadUI(): void {
    for (const ui of UI_TEXTURES) {
      this.load.image(`ui_${ui}`, `assets/ui/${ui}.png`);
    }

    // Castle sprites
    this.load.image('castle_player', 'assets/sprites/castle_player.png');
    this.load.image('castle_enemy', 'assets/sprites/castle_enemy.png');
  }

  private loadAudio(): void {
    // Music tracks (detect extension from file system)
    for (const track of MUSIC_TRACKS) {
      // Try mp3 first, then wav as fallback
      this.load.audio(track.key, [
        `assets/audio/music/${track.file}.mp3`,
        `assets/audio/music/${track.file}.wav`,
      ]);
    }

    // Sound effects
    for (const sfx of SFX_FILES) {
      this.load.audio(`sfx_${sfx}`, `assets/audio/sfx/sfx_${sfx}.wav`);
    }
  }

  create(): void {
    // Create animations for all sprites
    this.createAnimations();

    // Load saved settings from localStorage
    const savedSettings = this.loadSettings();
    const musicVolume = savedSettings.musicVolume ?? 1.0;

    // Initialize AudioManager with saved volume
    AudioManager.init(this, musicVolume);

    // Load GameState from localStorage and place in registry
    GameState.init(this);

    this.scene.start('menu');
  }

  private createAnimations(): void {
    // Create player unit animations
    for (const unit of PLAYER_UNITS) {
      const config = UNIT_ANIMATIONS[unit];
      if (config) {
        this.createAnimationsForSprite(`unit_${unit}`, config);
      }
    }

    // Create enemy animations (use sprite mapping for config lookup)
    for (const enemy of ENEMIES) {
      const spriteFile = getEnemySpriteFile(enemy);
      const config = ENEMY_ANIMATIONS[spriteFile];
      if (config) {
        this.createAnimationsForSprite(`enemy_${enemy}`, config);
      }
    }
  }

  private createAnimationsForSprite(key: string, config: AnimationConfig): void {
    const states = ['idle', 'walk', 'attack', 'death'] as const;

    for (const state of states) {
      const [startFrame, frameCount] = config.states[state];
      const animKey = `${key}_${state}`;

      // Skip if animation already exists
      if (this.anims.exists(animKey)) continue;

      this.anims.create({
        key: animKey,
        frames: this.anims.generateFrameNumbers(key, {
          start: startFrame,
          end: startFrame + frameCount - 1,
        }),
        frameRate: ANIMATION_FRAME_RATE[state],
        repeat: state === 'death' ? 0 : -1, // Death plays once, others loop
      });
    }
  }

  private loadSettings(): { musicVolume?: number } {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors, return default
    }
    return {};
  }
}
