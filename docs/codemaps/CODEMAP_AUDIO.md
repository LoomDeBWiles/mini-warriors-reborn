# Codemap: Audio Module

> Sound effect system, music manager, and audio pooling.

## Placement Rule

A use case belongs in THIS file if:
- It involves ONLY Audio module (sound playback, music)
- It can be tested by mocking Phaser.Sound
- It has clear contract: input -> Audio -> output

If a UC spans multiple modules -> put it in CODEMAP_OVERVIEW.md as IUC-N.

## Key Files

| File | Responsibility |
|------|----------------|
| `src/managers/AudioManager.ts` | Central audio controller |
| `src/data/audio.ts` | Sound key definitions and variations |

## Public API

| Function/Class | Signature | Purpose |
|----------------|-----------|---------|
| `AudioManager` | `class` | Singleton audio controller |
| `AudioManager.getInstance` | `(scene: Phaser.Scene) => AudioManager` | Get from registry |
| `AudioManager.playMusic` | `(key: string) => void` | Start looping music |
| `AudioManager.stopMusic` | `() => void` | Fade out and stop |
| `AudioManager.playSfx` | `(key: string) => void` | Play one-shot sound |
| `AudioManager.setMusicVolume` | `(volume: number) => void` | Adjust music 0-1 |
| `AudioManager.setSfxVolume` | `(volume: number) => void` | Adjust SFX 0-1 |
| `AudioManager.pause` | `() => void` | Pause all audio |
| `AudioManager.resume` | `() => void` | Resume all audio |

## Key Types

```typescript
interface AudioManagerConfig {
  scene: Phaser.Scene;
  musicVolume: number;  // 0-1
  sfxVolume: number;    // 0-1
}

interface SfxDefinition {
  key: string;
  variations?: string[];  // e.g., ['sword_hit_1', 'sword_hit_2']
  maxInstances?: number;  // For pooling
  volume?: number;        // Override default
  detune?: { min: number; max: number };  // Random pitch shift
}

interface MusicTrack {
  key: string;
  loop: boolean;
  volume: number;
  fadeIn?: number;   // ms
  fadeOut?: number;  // ms
}

// Audio asset keys (defined in data/audio.ts)
const MUSIC_KEYS = {
  menu: 'music_menu',
  battle_easy: 'music_battle_easy',
  battle_hard: 'music_battle_hard',
  boss: 'music_boss',
  upgrade: 'music_upgrade',
  victory: 'sfx_victory',
  defeat: 'sfx_defeat',
} as const;

const SFX_KEYS = {
  // UI
  button_click: 'sfx_button_click',
  button_hover: 'sfx_button_hover',
  gold_earned: 'sfx_gold_earned',
  purchase_success: 'sfx_purchase_success',
  purchase_fail: 'sfx_purchase_fail',
  star_earned: 'sfx_star_earned',

  // Combat - Melee
  sword_hit: { key: 'sfx_sword_hit', variations: ['sfx_sword_hit_1', 'sfx_sword_hit_2', 'sfx_sword_hit_3'] },
  sword_swing: 'sfx_sword_swing',

  // Combat - Ranged
  arrow_fire: 'sfx_arrow_fire',
  arrow_hit: 'sfx_arrow_hit',
  magic_cast: 'sfx_magic_cast',
  magic_hit: 'sfx_magic_hit',
  fireball_launch: 'sfx_fireball_launch',
  fireball_explode: 'sfx_fireball_explode',

  // Combat - Impact
  light_hit: 'sfx_light_hit',
  heavy_hit: 'sfx_heavy_hit',
  critical_hit: 'sfx_critical_hit',
  shield_block: 'sfx_shield_block',

  // Units
  spawn_melee: 'sfx_spawn_melee',
  spawn_ranged: 'sfx_spawn_ranged',
  spawn_heavy: 'sfx_spawn_heavy',
  death_human: 'sfx_death_human',
  death_monster: 'sfx_death_monster',
  death_boss: 'sfx_death_boss',

  // Events
  wave_start: 'sfx_wave_start',
  wave_complete: 'sfx_wave_complete',
  boss_spawn: 'sfx_boss_spawn',
  level_up: 'sfx_level_up',

  // Abilities
  heal_cast: 'sfx_heal_cast',
  meteor_strike: 'sfx_meteor_strike',
  time_warp: 'sfx_time_warp',
} as const;
```

## Module Use Cases (UC-AUDIO)

### UC-AUDIO-1: Initialize audio manager

**Participates in:** IUC-1 (Game boot)
**Touches:** `AudioManager.ts`, `PreloadScene.ts`
**Depends:** none

**Given:** PreloadScene complete
**When:** AudioManager instantiated
**Then:** Manager registered, audio unlock handler set

**Contract:**
- Input: Scene reference, initial volumes from GameSettings
- Output: AudioManager in registry
- Errors: None (graceful if Web Audio not available)

**Acceptance:** AudioManager.getInstance() returns instance after boot

---

### UC-AUDIO-2: Play sound effect

**Participates in:** IUC-3 (Combat round), IUC-5 (Unit spawning)
**Touches:** `AudioManager.ts`
**Depends:** UC-AUDIO-1

**Given:** AudioManager initialized
**When:** `audioManager.playSfx('sword_hit')` called
**Then:** Random variation played with slight pitch variation

**Contract:**
- Input: SFX key
- Output: Sound plays at sfxVolume
- Errors: Log warning if key not found

**Acceptance:** Sword hit plays with audible variation each time

---

### UC-AUDIO-3: Play victory/defeat jingle

**Participates in:** IUC-4 (Battle victory)
**Touches:** `AudioManager.ts`
**Depends:** UC-AUDIO-1

**Given:** Battle ends
**When:** `audioManager.playMusic('victory')` or `('defeat')` called
**Then:** Current music stops, jingle plays once

**Contract:**
- Input: 'victory' or 'defeat' key
- Output: Jingle plays, no loop
- Errors: None

**Acceptance:** Win battle, hear victory fanfare

---

### UC-AUDIO-4: Purchase confirmation sound

**Participates in:** IUC-6 (Upgrade purchase)
**Touches:** `AudioManager.ts`
**Depends:** UC-AUDIO-2

**Given:** Player purchases upgrade
**When:** `audioManager.playSfx('purchase_success')` called
**Then:** Satisfying confirmation sound plays

**Contract:**
- Input: 'purchase_success' or 'purchase_fail' key
- Output: Appropriate sound
- Errors: None

**Acceptance:** Buy upgrade, hear coin/register sound

---

### UC-AUDIO-5: Pause/resume audio

**Participates in:** IUC-8 (Pause and resume)
**Touches:** `AudioManager.ts`
**Depends:** UC-AUDIO-1

**Given:** Audio playing
**When:** `audioManager.pause()` called
**Then:** All sounds and music pause

**Contract:**
- Input: None
- Output: `scene.sound.pauseAll()`
- Errors: None

**Acceptance:** Pause game, audio stops, resume restores

---

### UC-AUDIO-6: Switch background music

**Participates in:** standalone
**Touches:** `AudioManager.ts`
**Depends:** UC-AUDIO-1

**Given:** Music playing
**When:** Scene transition requires new music
**Then:** Current fades out, new fades in

**Contract:**
- Input: New music key
- Output: Crossfade between tracks
- Errors: None (same track = no-op)

**Acceptance:** Enter battle, music crossfades from menu to battle

---

### UC-AUDIO-7: Handle audio unlock

**Participates in:** IUC-1 (Game boot)
**Touches:** `AudioManager.ts`
**Depends:** none

**Given:** Browser requires user interaction for audio
**When:** First user input
**Then:** Audio context unlocked, queued sounds play

**Contract:**
- Input: User interaction event
- Output: `scene.sound.unlock()` completes
- Errors: None (no audio on unlock failure)

**Acceptance:** First click plays any pending sounds

---

### UC-AUDIO-8: Adjust volume from settings

**Participates in:** standalone
**Touches:** `AudioManager.ts`
**Depends:** UC-AUDIO-1

**Given:** Player on settings menu
**When:** Volume slider moved
**Then:** Corresponding volume updates in real-time

**Contract:**
- Input: `volume: number` (0-1)
- Output: `audioManager.setMusicVolume(v)` updates all music
- Errors: Clamp to 0-1

**Acceptance:** Drag slider, hear volume change immediately

---

### UC-AUDIO-9: Pool frequently-used sounds

**Participates in:** IUC-3 (Combat round)
**Touches:** `AudioManager.ts`
**Depends:** UC-AUDIO-2

**Given:** Rapid combat with many hits
**When:** Same SFX triggered repeatedly
**Then:** Pooled instances reused, no audio clipping

**Contract:**
- Input: High-frequency SFX key
- Output: Limited concurrent instances
- Errors: Oldest instance stopped if pool exhausted

**Acceptance:** 10 rapid sword hits don't create audio chaos

---

### UC-AUDIO-10: Scene-appropriate music

**Participates in:** standalone
**Touches:** `AudioManager.ts`, all scenes
**Depends:** UC-AUDIO-6

**Given:** Player navigates between scenes
**When:** Scene.create() runs
**Then:** Appropriate music for that scene plays

| Scene | Music |
|-------|-------|
| MenuScene | menu |
| LevelSelectScene | menu |
| LoadoutScene | menu |
| BattleScene (1-10) | battle_easy |
| BattleScene (11-20) | battle_hard |
| BattleScene (boss) | boss |
| UpgradeScene | upgrade |

**Acceptance:** Each scene has correct background music

---

### UC-AUDIO-11: Wave start fanfare

**Participates in:** IUC-3 (Combat round)
**Touches:** `AudioManager.ts`, `WaveManager.ts`
**Depends:** UC-AUDIO-2

**Given:** Battle in progress
**When:** New wave begins
**Then:** Wave start sound plays

**Contract:**
- Input: 'wave_start' key
- Output: Short attention-grabbing sound
- Errors: None

**Acceptance:** Wave 2 starts, hear distinctive sound

---

### UC-AUDIO-12: Boss spawn announcement

**Participates in:** standalone
**Touches:** `AudioManager.ts`, `WaveManager.ts`
**Depends:** UC-AUDIO-2

**Given:** Boss enemy in wave
**When:** Boss spawns
**Then:** Dramatic boss spawn sound plays

**Contract:**
- Input: 'boss_spawn' key
- Output: Impactful sound effect
- Errors: None

**Acceptance:** Giant spawns in stage 10, hear ominous sound

---

## Internal Data Flow

```
PreloadScene.create()
   │
   └──► AudioManager.init(settings)
             │
             ├── Set volumes from GameState.settings
             ├── Handle audio unlock
             └── Register in game.registry

Any Scene
   │
   ├──► audioManager.playMusic(trackKey)
   │         │
   │         ├── Stop current if different
   │         ├── Fade out (200ms)
   │         └── Fade in new (500ms)
   │
   └──► audioManager.playSfx(sfxKey)
             │
             ├── Get variation if defined
             ├── Apply random detune (-50 to +50)
             ├── Apply sfxVolume
             └── Play from pool or create

PauseOverlay
   │
   └──► audioManager.pause()
             └── scene.sound.pauseAll()

Resume
   │
   └──► audioManager.resume()
             └── scene.sound.resumeAll()
```

## Patterns

| Pattern | When to Use | Example |
|---------|-------------|---------|
| Singleton via registry | Cross-scene audio | `registry.set('audioManager', am)` |
| Variations | Combat sounds | `getRandomVariation(sfxKey)` |
| Audio pooling | Rapid-fire SFX | `pool.get() || new Sound()` |
| Volume ducking | Important sounds | Lower music during SFX |
| Crossfade | Music transitions | Fade out old, fade in new |

## Dependencies

| This Module Uses | Used By |
|------------------|---------|
| Core (registry, settings) | Units (SFX triggers), UI (button sounds) |

## Common Tasks

| Task | Solution |
|------|----------|
| Add new SFX | Add to `audio.ts` SFX_KEYS, load in PreloadScene |
| Add music track | Add to `audio.ts` MUSIC_KEYS, load in PreloadScene |
| Change volume | `AudioManager.getInstance(this).setMusicVolume(0.5)` |
| Trigger sound | `AudioManager.getInstance(this).playSfx('key')` |
| Mute all | `audioManager.setMusicVolume(0); audioManager.setSfxVolume(0)` |

## Asset Loading (PreloadScene)

```typescript
// Music
this.load.audio('music_menu', 'assets/audio/music/menu.ogg');
this.load.audio('music_battle_easy', 'assets/audio/music/battle_easy.ogg');
this.load.audio('music_battle_hard', 'assets/audio/music/battle_hard.ogg');
this.load.audio('music_boss', 'assets/audio/music/boss.ogg');
this.load.audio('music_upgrade', 'assets/audio/music/upgrade.ogg');

// SFX - load all defined in audio.ts
Object.values(SFX_KEYS).forEach(sfx => {
  const key = typeof sfx === 'string' ? sfx : sfx.key;
  this.load.audio(key, `assets/audio/sfx/${key}.ogg`);
  if (typeof sfx !== 'string' && sfx.variations) {
    sfx.variations.forEach(v =>
      this.load.audio(v, `assets/audio/sfx/${v}.ogg`)
    );
  }
});
```

## Gotchas

**Audio unlock:** Must wait for `scene.sound.once('unlocked')` before playing on mobile.

**Format support:** Use OGG for broad support; provide MP3 fallback.

**Memory:** Don't load all audio upfront if large; consider lazy loading per scene.

**Rapid triggers:** Pool sounds to prevent audio clipping from overlapping instances.

**Volume persistence:** Always read from `gameState.settings` on init, save on change.

**Crossfade timing:** Fade out should be shorter than fade in for smooth transitions.

---
<!-- PLACEMENT RULE: Only UC-AUDIO-N belong in this file.
     Cross-module flows go in CODEMAP_OVERVIEW.md as IUC-N -->
