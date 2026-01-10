import Phaser from 'phaser';
import SoundFade from 'phaser3-rex-plugins/plugins/soundfade';
import { MUSIC_KEYS, SFX_KEYS, type SfxKey } from '../data/audio';

/** Music keys that should play once without looping (jingles) */
const JINGLE_KEYS: Set<string> = new Set([MUSIC_KEYS.victory, MUSIC_KEYS.defeat]);

/** Default max concurrent instances for pooled sounds */
const DEFAULT_MAX_INSTANCES = 8;

/** Default crossfade duration in milliseconds */
const DEFAULT_CROSSFADE_DURATION_MS = 1000;

/**
 * Central audio controller for music and sound effects.
 * Handles browser audio unlock requirements - browsers require user interaction
 * before audio can play, so we queue sounds until unlock occurs.
 *
 * Uses the game's global sound manager rather than storing a scene reference,
 * since scenes may be destroyed during transitions.
 */
export class AudioManager {
  private static readonly REGISTRY_KEY = 'audioManager';

  private game: Phaser.Game;
  private musicVolume: number;
  private sfxVolume: number;
  private unlocked: boolean;
  private pendingSounds: Array<{ key: string; config?: Phaser.Types.Sound.SoundConfig }>;
  /** Pool of active sound instances per SFX key (logical key, not resolved audio key) */
  private sfxPool: Map<string, Phaser.Sound.BaseSound[]>;
  /** Currently playing background music track */
  private currentMusic: Phaser.Sound.BaseSound | null;
  /** Currently playing jingle (victory/defeat - responds to music volume but doesn't loop) */
  private currentJingle: Phaser.Sound.BaseSound | null;

  constructor(scene: Phaser.Scene, musicVolume = 1.0, sfxVolume = 1.0) {
    this.game = scene.game;
    this.musicVolume = musicVolume;
    this.sfxVolume = sfxVolume;
    this.unlocked = false;
    this.pendingSounds = [];
    this.sfxPool = new Map();
    this.currentMusic = null;
    this.currentJingle = null;

    this.setupAudioUnlock();
  }

  /**
   * Get the AudioManager instance from the game registry.
   */
  static getInstance(scene: Phaser.Scene): AudioManager | undefined {
    return scene.registry.get(AudioManager.REGISTRY_KEY) as AudioManager | undefined;
  }

  /**
   * Initialize and register the AudioManager in the game registry.
   */
  static init(scene: Phaser.Scene, musicVolume = 1.0, sfxVolume = 1.0): AudioManager {
    const existing = AudioManager.getInstance(scene);
    if (existing) {
      return existing;
    }

    const manager = new AudioManager(scene, musicVolume, sfxVolume);
    scene.registry.set(AudioManager.REGISTRY_KEY, manager);
    return manager;
  }

  /**
   * Set up audio unlock handling for browsers that require user interaction.
   * Phaser's sound manager emits 'unlocked' when the audio context becomes available.
   */
  private setupAudioUnlock(): void {
    const soundManager = this.game.sound;

    // Check if already unlocked (desktop browsers without autoplay restrictions)
    if (!soundManager.locked) {
      this.unlocked = true;
      return;
    }

    // Wait for Phaser's unlock event which fires on first user interaction
    soundManager.once('unlocked', () => {
      this.unlocked = true;
      this.playPendingSounds();
    });
  }

  /**
   * Play all sounds that were queued while audio was locked.
   */
  private playPendingSounds(): void {
    for (const pending of this.pendingSounds) {
      this.game.sound.play(pending.key, pending.config);
    }
    this.pendingSounds = [];
  }

  /**
   * Play a sound effect. If audio is locked, queues it for playback after unlock.
   * For sounds with variations, randomly selects one. Applies random pitch variation.
   * Uses pooling to limit concurrent instances of the same sound.
   */
  playSfx(key: string, config?: Phaser.Types.Sound.SoundConfig): void {
    const resolvedKey = this.resolveSfxKey(key);
    const detune = this.randomDetune();

    const soundConfig: Phaser.Types.Sound.SoundConfig = {
      volume: this.sfxVolume,
      detune,
      ...config,
    };

    if (!this.unlocked) {
      this.pendingSounds.push({ key: resolvedKey, config: soundConfig });
      return;
    }

    // Enforce pool limit before playing new sound
    this.enforcePoolLimit(key);

    const sound = this.game.sound.add(resolvedKey, soundConfig);
    sound.play();

    // Track this sound in the pool and remove when complete
    this.addToPool(key, sound);
    sound.once('complete', () => this.removeFromPool(key, sound));
    sound.once('stop', () => this.removeFromPool(key, sound));
  }

  /**
   * Get the max instances allowed for an SFX key.
   */
  private getMaxInstances(key: string): number {
    if (!(key in SFX_KEYS)) {
      return DEFAULT_MAX_INSTANCES;
    }
    const sfxDef = SFX_KEYS[key as SfxKey];
    if ('maxInstances' in sfxDef && typeof sfxDef.maxInstances === 'number') {
      return sfxDef.maxInstances;
    }
    return DEFAULT_MAX_INSTANCES;
  }

  /**
   * Enforce the pool limit for an SFX key by stopping the oldest instance if at limit.
   */
  private enforcePoolLimit(key: string): void {
    const pool = this.sfxPool.get(key);
    if (!pool) return;

    const maxInstances = this.getMaxInstances(key);

    // Remove completed sounds from pool
    const activeSounds = pool.filter((s) => s.isPlaying);
    this.sfxPool.set(key, activeSounds);

    // If at limit, stop the oldest sound
    while (activeSounds.length >= maxInstances && activeSounds.length > 0) {
      const oldest = activeSounds.shift();
      oldest?.stop();
    }
  }

  /**
   * Add a sound to the pool for the given key.
   */
  private addToPool(key: string, sound: Phaser.Sound.BaseSound): void {
    const pool = this.sfxPool.get(key) ?? [];
    pool.push(sound);
    this.sfxPool.set(key, pool);
  }

  /**
   * Remove a sound from the pool for the given key.
   */
  private removeFromPool(key: string, sound: Phaser.Sound.BaseSound): void {
    const pool = this.sfxPool.get(key);
    if (!pool) return;

    const index = pool.indexOf(sound);
    if (index !== -1) {
      pool.splice(index, 1);
    }
  }

  /**
   * Resolve an SFX key to a playable audio key.
   * If the sound has variations, randomly selects one.
   */
  private resolveSfxKey(key: string): string {
    if (!(key in SFX_KEYS)) {
      return key;
    }

    const sfxDef = SFX_KEYS[key as SfxKey];
    if ('variations' in sfxDef && sfxDef.variations.length > 0) {
      const index = Math.floor(Math.random() * sfxDef.variations.length);
      return sfxDef.variations[index];
    }

    return sfxDef.key;
  }

  /**
   * Generate a random detune value between -50 and +50 cents for pitch variation.
   */
  private randomDetune(): number {
    return Math.floor(Math.random() * 101) - 50;
  }

  /**
   * Play background music. If audio is locked, queues it for playback after unlock.
   * For jingles (victory/defeat), stops current music and plays once without looping.
   * Note: Use switchMusic() for crossfade transitions between scenes.
   */
  playMusic(key: string, config?: Phaser.Types.Sound.SoundConfig): void {
    const isJingle = JINGLE_KEYS.has(key);

    const soundConfig: Phaser.Types.Sound.SoundConfig = {
      volume: this.musicVolume,
      loop: !isJingle,
      ...config,
    };

    if (!this.unlocked) {
      this.pendingSounds.push({ key, config: soundConfig });
      return;
    }

    // Stop current music before playing new track
    this.stopMusic();

    const sound = this.game.sound.add(key, soundConfig);
    sound.play();

    // Track as current music or jingle for volume control
    if (isJingle) {
      this.currentJingle = sound;
      sound.once('complete', () => {
        this.currentJingle = null;
      });
    } else {
      this.currentMusic = sound;
    }
  }

  /**
   * Switch to new background music with crossfade. Fades out current music while
   * fading in the new track. Use this for scene transitions.
   * @param key - The music key to play
   * @param durationMs - Crossfade duration in milliseconds (default 1000)
   */
  switchMusic(key: string, durationMs = DEFAULT_CROSSFADE_DURATION_MS): void {
    const isJingle = JINGLE_KEYS.has(key);

    if (!this.unlocked) {
      // If audio locked, queue as regular playback (will play when unlocked)
      this.pendingSounds.push({
        key,
        config: { volume: this.musicVolume, loop: !isJingle },
      });
      return;
    }

    // Create new music track
    const newMusic = this.game.sound.add(key, {
      volume: 0, // Start at 0 for fade in
      loop: !isJingle,
    });

    // Fade out current music if playing
    if (this.currentMusic && this.currentMusic.isPlaying) {
      SoundFade.fadeOut(this.currentMusic, durationMs, true);
    }

    // Fade in new music to target volume
    SoundFade.fadeIn(newMusic, durationMs, this.musicVolume, 0);

    // Track as current music or jingle for volume control
    if (isJingle) {
      this.currentJingle = newMusic;
      newMusic.once('complete', () => {
        this.currentJingle = null;
      });
    } else {
      this.currentMusic = newMusic;
    }
  }

  /**
   * Stop all music currently playing.
   */
  stopMusic(): void {
    this.game.sound.stopAll();
    this.currentMusic = null;
    this.currentJingle = null;
  }

  /**
   * Set music volume (0-1). Updates looped music and jingles.
   */
  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));

    // Update volume on all currently playing looped sounds (music)
    for (const sound of this.game.sound.getAllPlaying()) {
      if ('loop' in sound && sound.loop) {
        (sound as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound).setVolume(this.musicVolume);
      }
    }

    // Also update jingle volume (jingles don't loop but should respond to music volume)
    if (this.currentJingle?.isPlaying) {
      (this.currentJingle as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound).setVolume(this.musicVolume);
    }
  }

  /**
   * Set SFX volume (0-1). Updates all currently playing non-looped sounds except jingles.
   */
  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));

    // Update volume on all currently playing non-looped sounds (SFX), excluding jingles
    for (const sound of this.game.sound.getAllPlaying()) {
      if ('loop' in sound && !sound.loop && sound !== this.currentJingle) {
        (sound as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound).setVolume(this.sfxVolume);
      }
    }
  }

  /**
   * Pause all audio.
   */
  pause(): void {
    this.game.sound.pauseAll();
  }

  /**
   * Resume all audio.
   */
  resume(): void {
    this.game.sound.resumeAll();
  }

  /**
   * Check if audio is currently locked (waiting for user interaction).
   */
  isLocked(): boolean {
    return !this.unlocked;
  }
}
